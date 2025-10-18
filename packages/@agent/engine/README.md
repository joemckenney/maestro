# @agent/engine

Functional agent engine powered by Anthropic's Claude API.

## Overview

This package provides a functional, composable API for building agents that can interact with Claude models and use tools. It follows functional programming patterns with immutable state and pure functions.

## Installation

```bash
pnpm add @agent/engine
```

## Features

- **Functional API**: Pure functions with immutable state
- **Tool Support**: Built-in tool execution with agentic loops
- **Type-Safe**: Full TypeScript support with Anthropic's types
- **Composable**: Build complex agents from simple functions
- **Flexible**: Use single queries or multi-turn conversations

## Basic Usage

### Simple Query

```typescript
import { query } from '@agent/engine';

const response = await query(
  {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-5-sonnet-20241022',
    system: 'You are a helpful assistant.',
  },
  'What is the capital of France?'
);

console.log(response); // "The capital of France is Paris."
```

### Multi-Turn Conversation

```typescript
import { createAgentState, addUserMessage, runAgent, extractTextContent } from '@agent/engine';

// Create initial state
let state = createAgentState({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-20241022',
  system: 'You are a helpful assistant.',
});

// First turn
state = addUserMessage(state, 'Hello! What is 2 + 2?');
let result = await runAgent(state);
state = result.state;
console.log(extractTextContent(result.response));

// Second turn - state maintains context
state = addUserMessage(state, 'What about if I multiply that by 3?');
result = await runAgent(state);
state = result.state;
console.log(extractTextContent(result.response));
```

### Using Maestro Tools

The agent engine integrates seamlessly with Maestro's tool system:

```typescript
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
} from '@agent/engine';

// Create a tool registry and register tools
const registry = createToolRegistry();
await registerTool(registry, new TextTransformTool());

// Define input schemas for the tools
const inputSchemas = {
  'text-transform': {
    operation: {
      type: 'string',
      description: 'Operation: uppercase, lowercase, reverse, slugify, or title',
      enum: ['uppercase', 'lowercase', 'reverse', 'slugify', 'title'],
    },
    text: {
      type: 'string',
      description: 'The text to transform',
    },
  },
};

// Get Anthropic-compatible tool definitions
const tools = getAnthropicTools(registry, inputSchemas);

// Create agent state with tools
let state = createAgentState({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-20241022',
  system: 'You are a helpful assistant.',
  tools,
});

// Add user message
state = addUserMessage(state, 'Convert "Hello World" to uppercase');

// Run agentic loop - automatically handles tool calls
const toolHandler = createToolHandler(registry);
const { responses } = await runAgentLoop(state, toolHandler, {
  onIteration: (iteration, result) => {
    console.log(`Iteration ${iteration}:`, result.wantsToolUse ? 'Using tools...' : 'Done!');
  },
});

// Get final response
console.log(extractTextContent(responses[responses.length - 1]));
```

See [examples/text-transform-example.ts](./examples/text-transform-example.ts) for a complete working example.

## Tool Integration

The agent engine includes built-in support for Maestro's tool system (`@tools/schema`). The tool adapter automatically:

- Converts Maestro tool metadata to Anthropic's tool format
- Handles JSON serialization/deserialization
- Manages tool execution and error handling
- Provides a registry for managing multiple tools

### Tool Registry Pattern

The recommended way to use tools is through the registry pattern:

1. **Create a registry**: `createToolRegistry()`
2. **Register tools**: `registerTool(registry, tool)`
3. **Define input schemas**: Map tool names to parameter schemas
4. **Get Anthropic tools**: `getAnthropicTools(registry, inputSchemas)`
5. **Create handler**: `createToolHandler(registry)`

This pattern provides:
- Type-safe tool execution
- Centralized tool management
- Easy tool discovery
- Automatic error handling

## API Reference

### Core Functions

#### `createAgentState(config: AgentConfig): AgentState`

Creates initial agent state with configuration.

#### `addUserMessage(state: AgentState, content: string): AgentState`

Adds a user message to the conversation.

#### `addAssistantMessage(state: AgentState, response: Message): AgentState`

Adds an assistant message to the conversation.

#### `addToolResults(state: AgentState, results: ToolResult[]): AgentState`

Adds tool execution results to the conversation.

#### `runAgent(state: AgentState): Promise<AgentRunResult>`

Runs a single turn of the agent, calling the Claude API.

#### `executeTools(toolUses: ToolUseBlock[], handler: ToolHandler): Promise<ToolResult[]>`

Executes tool calls using the provided handler.

#### `runAgentLoop(initialState: AgentState, toolHandler: ToolHandler, options?): Promise<Result>`

Runs an agentic loop, automatically executing tools until completion.

#### `query(config: AgentConfig, message: string, toolHandler?: ToolHandler): Promise<string>`

Simple helper for one-shot queries.

### Tool Functions

#### `createToolRegistry(): ToolRegistry`

Creates a new tool registry for managing multiple tools.

#### `registerTool(registry: ToolRegistry, tool: MaestroTool): Promise<ToolMetadata>`

Registers a Maestro tool in the registry. Returns the tool's metadata.

#### `createToolHandler(registry: ToolRegistry): ToolHandler`

Creates a tool handler function from a registry that can be used with `runAgentLoop`.

#### `getAnthropicTools(registry: ToolRegistry, inputSchemas: Record<string, object>): Tool[]`

Converts registered tools to Anthropic tool definitions using provided input schemas.

#### `adaptMaestroTool(tool: MaestroTool): Promise<AdaptedTool>`

Low-level function to adapt a single Maestro tool. Usually you'll use `registerTool` instead.

#### `loadTools(registry: ToolRegistry, config: ToolLoaderConfig): Promise<void>`

Batch loads multiple tools into a registry.

### Types

See [src/types.ts](./src/types.ts) for full type definitions.

## Design Philosophy

This package follows functional programming principles:

- **Immutable State**: State is never mutated, always returns new state
- **Pure Functions**: Functions have no side effects (except API calls)
- **Composable**: Build complex behavior from simple functions
- **Explicit**: No hidden state or magic, everything is explicit

## License

ISC
