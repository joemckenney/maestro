/**
 * @agent/engine - toy agent engine 
 */

export {
  createAgentState,
  addUserMessage,
  addAssistantMessage,
  addToolResults,
  extractToolUses,
  hasToolUse,
  runAgent,
  executeTools,
  runAgentLoop,
  extractTextContent,
} from './agent.js';

export {
  createAnthropicTool,
  adaptMaestroTool,
  createToolRegistry,
  registerTool,
  createToolHandler,
  getAnthropicTools,
} from './tools.js';

export { loadTools, createToolLoaderConfig } from './tool-loader.js';

export type {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  Tool,
  ToolResult,
  AgentConfig,
  AgentState,
  AgentRunResult,
  ToolHandler,
} from './types.js';

export type { ToolRegistry } from './tools.js';
export type { ToolLoaderConfig } from './tool-loader.js';
