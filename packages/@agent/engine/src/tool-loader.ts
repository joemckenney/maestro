import type { Tool as MaestroTool } from '@tools/schema';
import type { ToolRegistry } from './tools.js';
import { registerTool } from './tools.js';

export interface ToolLoaderConfig {
  tools: MaestroTool[];
  inputSchemas: Record<string, Record<string, unknown>>;
}

export async function loadTools(
  registry: ToolRegistry,
  config: ToolLoaderConfig
): Promise<void> {
  await Promise.all(config.tools.map((tool) => registerTool(registry, tool)));
}

export function createToolLoaderConfig(
  tools: MaestroTool[],
  inputSchemas: Record<string, Record<string, unknown>>
): ToolLoaderConfig {
  return {
    tools,
    inputSchemas,
  };
}
