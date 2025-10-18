import type { Tool as MaestroTool, ToolMetadata } from '@tools/schema';
import type { Tool as AnthropicTool } from './types.js';

/**
 * Converts tool metadata to Anthropic tool definition
 * You need to provide the input schema separately as it's not in the metadata
 */
export function createAnthropicTool(
  metadata: ToolMetadata,
  inputSchema: Record<string, unknown>
): AnthropicTool {
  return {
    name: metadata.name,
    description: metadata.description,
    input_schema: {
      type: 'object',
      properties: inputSchema,
      required: Object.keys(inputSchema),
    },
  };
}

/**
 * Adapts a Maestro tool to work with the agent engine
 * Returns a function that can be used as a tool handler
 */
export async function adaptMaestroTool(tool: MaestroTool) {
  const metadataJson = await Promise.resolve(tool.metadata());
  const metadata: ToolMetadata = JSON.parse(metadataJson);

  return {
    metadata,
    async execute(input: unknown): Promise<string> {
      const executeInput = JSON.stringify({
        parameters: input,
      });

      const resultJson = await Promise.resolve(tool.execute(executeInput));
      const result = JSON.parse(resultJson);

      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed');
      }

      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    },
  };
}

export interface ToolRegistry {
  tools: Map<string, { metadata: ToolMetadata; execute: (input: unknown) => Promise<string> }>;
}

export function createToolRegistry(): ToolRegistry {
  return {
    tools: new Map(),
  };
}

export async function registerTool(
  registry: ToolRegistry,
  tool: MaestroTool
): Promise<ToolMetadata> {
  const adapted = await adaptMaestroTool(tool);
  registry.tools.set(adapted.metadata.name, adapted);
  return adapted.metadata;
}

export function createToolHandler(
  registry: ToolRegistry
): (toolName: string, toolInput: unknown) => Promise<string> {
  return async (toolName: string, toolInput: unknown) => {
    const tool = registry.tools.get(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return tool.execute(toolInput);
  };
}

export function getAnthropicTools(
  registry: ToolRegistry,
  inputSchemas: Record<string, Record<string, unknown>>
): AnthropicTool[] {
  const tools: AnthropicTool[] = [];

  for (const [name, { metadata }] of registry.tools) {
    const schema = inputSchemas[name];
    if (schema) {
      tools.push(createAnthropicTool(metadata, schema));
    }
  }

  return tools;
}
