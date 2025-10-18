import { TextTransformTool } from '@tools/text-transform';

import {
  createAgentState,
  addUserMessage,
  runAgentLoop,
  extractTextContent,
  createToolRegistry,
  registerTool,
  createToolHandler,
  getAnthropicTools,
} from '../src/index.js';

async function main() {
  const registry = createToolRegistry();
  const tool = new TextTransformTool();
  await registerTool(registry, tool);

  console.log('Registered tools:', Array.from(registry.tools.keys()));

  const inputSchemas = {
    'text-transform': {
      operation: {
        type: 'string',
        description:
          'Operation to perform: uppercase, lowercase, reverse, slugify, or title',
        enum: ['uppercase', 'lowercase', 'reverse', 'slugify', 'title'],
      },
      text: {
        type: 'string',
        description: 'The text to transform',
      },
    },
  };

  const tools = getAnthropicTools(registry, inputSchemas);

  let state = createAgentState({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-haiku-4-5-20251001',
    system: 'You are a helpful assistant with text transformation capabilities.',
    tools,
  });

  state = addUserMessage(
    state,
    'Can you convert "Hello World" to uppercase and then slugify it?'
  );

  const toolHandler = createToolHandler(registry);

  const { responses } = await runAgentLoop(state, toolHandler, {
    onIteration: (iteration, result) => {
      console.log(`\nIteration ${iteration + 1}:`);
      if (result.wantsToolUse) {
        console.log('Tools requested:', result.toolUses.map((t) => t.name).join(', '));
      } else {
        console.log('No more tools needed, finishing...');
      }
    },
  });

  const finalResponse = responses[responses.length - 1];
  console.log('\n=== Final Response ===');
  console.log(extractTextContent(finalResponse));
}

main().catch(console.error);
