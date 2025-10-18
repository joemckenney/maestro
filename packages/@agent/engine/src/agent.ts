import Anthropic from '@anthropic-ai/sdk';
import type {
  AgentConfig,
  AgentState,
  AgentRunResult,
  ToolResult,
  ToolUseBlock,
  ToolHandler,
} from './types.js';

export function createAgentState(config: AgentConfig): AgentState {
  return {
    messages: [],
    config,
  };
}

export function addUserMessage(state: AgentState, content: string): AgentState {
  return {
    ...state,
    messages: [...state.messages, { role: 'user', content }],
  };
}

export function addAssistantMessage(
  state: AgentState,
  response: Anthropic.Messages.Message
): AgentState {
  return {
    ...state,
    messages: [...state.messages, { role: 'assistant', content: response.content }],
  };
}

export function addToolResults(state: AgentState, results: ToolResult[]): AgentState {
  const toolResultContent = results.map((result) => ({
    type: 'tool_result' as const,
    tool_use_id: result.tool_use_id,
    content: result.content,
    is_error: result.is_error,
  }));

  return {
    ...state,
    messages: [...state.messages, { role: 'user', content: toolResultContent }],
  };
}

export function extractToolUses(response: Anthropic.Messages.Message): ToolUseBlock[] {
  return response.content.filter(
    (block): block is ToolUseBlock => block.type === 'tool_use'
  );
}

export function hasToolUse(response: Anthropic.Messages.Message): boolean {
  return extractToolUses(response).length > 0;
}

export async function runAgent(state: AgentState): Promise<AgentRunResult> {
  const client = new Anthropic({ apiKey: state.config.apiKey });

  const response = await client.messages.create({
    model: state.config.model,
    max_tokens: state.config.maxTokens ?? 4096,
    system: state.config.system,
    messages: state.messages,
    tools: state.config.tools,
    temperature: state.config.temperature,
  });

  const updatedState = addAssistantMessage(state, response);
  const toolUses = extractToolUses(response);

  return {
    response,
    state: updatedState,
    wantsToolUse: toolUses.length > 0,
    toolUses,
  };
}

export async function executeTools(
  toolUses: ToolUseBlock[],
  handler: ToolHandler
): Promise<ToolResult[]> {
  const results = await Promise.all(
    toolUses.map(async (toolUse) => {
      try {
        const content = await handler(toolUse.name, toolUse.input);
        return {
          tool_use_id: toolUse.id,
          content,
        };
      } catch (error) {
        return {
          tool_use_id: toolUse.id,
          content: error instanceof Error ? error.message : String(error),
          is_error: true,
        };
      }
    })
  );

  return results;
}

/**
 * Runs an agentic loop until no more tool uses are requested
 * Returns the final state and all responses
 */
export async function runAgentLoop(
  initialState: AgentState,
  toolHandler: ToolHandler,
  options?: {
    maxIterations?: number;
    onIteration?: (iteration: number, result: AgentRunResult) => void;
  }
): Promise<{ state: AgentState; responses: Anthropic.Messages.Message[] }> {
  const maxIterations = options?.maxIterations ?? 10;
  const responses: Anthropic.Messages.Message[] = [];
  let state = initialState;
  let iteration = 0;

  while (iteration < maxIterations) {
    const result = await runAgent(state);
    responses.push(result.response);
    state = result.state;

    options?.onIteration?.(iteration, result);

    if (!result.wantsToolUse) {
      break;
    }

    const toolResults = await executeTools(result.toolUses, toolHandler);
    state = addToolResults(state, toolResults);

    iteration++;
  }

  return { state, responses };
}

export async function query(
  config: AgentConfig,
  message: string,
  toolHandler?: ToolHandler
): Promise<string> {
  let state = createAgentState(config);
  state = addUserMessage(state, message);

  if (toolHandler && config.tools && config.tools.length > 0) {
    const { responses } = await runAgentLoop(state, toolHandler);
    const lastResponse = responses[responses.length - 1];
    return extractTextContent(lastResponse);
  }

  const result = await runAgent(state);
  return extractTextContent(result.response);
}

export function extractTextContent(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { text: string }).text)
    .join('\n');
}
