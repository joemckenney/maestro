import type Anthropic from '@anthropic-ai/sdk';

export type Message = Anthropic.Messages.MessageParam;

export type ContentBlock = Anthropic.Messages.ContentBlock;
export type TextBlock = Anthropic.Messages.TextBlock;
export type ToolUseBlock = Anthropic.Messages.ToolUseBlock;

export type Tool = Anthropic.Messages.Tool;

export interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface AgentConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  system?: string;
  tools?: Tool[];
  temperature?: number;
}

export interface AgentState {
  messages: Message[];
  config: AgentConfig;
}

export interface AgentRunResult {
  response: Anthropic.Messages.Message;
  state: AgentState;
  wantsToolUse: boolean;
  toolUses: ToolUseBlock[];
}

export type ToolHandler = (
  toolName: string,
  toolInput: unknown
) => Promise<string> | string;
