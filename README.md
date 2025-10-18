# Maestro

A library monorepo for building multi-language agent tools with enforced interfaces.

## Overview

Maestro provides a standardized interface for creating agent tools in any programming language. Tools can be written in Rust (compiled to WASM), TypeScript/Node.js, or any other language that can implement the JSON-based interface.

## Structure

```
packages/
  @tools/
    schema/          # JSON schemas and TypeScript types for tool interface
    calculator/      # Example Rust/WASM tool
    text-transform/  # Example TypeScript/Node.js tool
```

## Tool Interface

All tools must implement a standardized interface defined by JSON schemas in `@tools/schema`:

### Interface Methods

Every tool must export two functions:

1. **`metadata(): string`** - Returns JSON matching the `ToolMetadata` schema
2. **`execute(input: string): string`** - Accepts JSON matching `ToolExecuteInput`, returns JSON matching `ToolExecuteOutput`

### Schemas

**ToolMetadata:**
```json
{
  "name": "string",
  "version": "string (semver)",
  "description": "string"
}
```

**ToolExecuteInput:**
```json
{
  "parameters": {
    "key": "value"
  }
}
```

**ToolExecuteOutput:**
```json
{
  "success": boolean,
  "data": any,        // optional
  "error": "string"   // optional
}
```

## Example Tools

### Rust/WASM Tool (Calculator)

```rust
#[wasm_bindgen]
pub fn metadata() -> String {
    // Returns tool metadata as JSON
}

#[wasm_bindgen]
pub fn execute(input: &str) -> String {
    // Parse input JSON, perform calculation, return output JSON
}
```

**Usage:**
```typescript
import { metadata, execute } from '@tools/calculator';

const meta = JSON.parse(metadata());
const result = JSON.parse(execute(JSON.stringify({
  parameters: { operation: "add", a: 5, b: 3 }
})));
```

### TypeScript/Node.js Tool (Text Transform)

```typescript
export function metadata(): string {
  // Returns tool metadata as JSON
}

export function execute(input: string): string {
  // Parse input JSON, transform text, return output JSON
}
```

**Usage:**
```typescript
import { metadata, execute } from '@tools/text-transform';

const meta = JSON.parse(metadata());
const result = JSON.parse(execute(JSON.stringify({
  parameters: { operation: "uppercase", text: "hello" }
})));
```

## Interface Enforcement

Cross-language interface consistency is enforced through:

1. **JSON Schemas** - Define the contract for all tools
2. **Runtime Validation** - `@tools/schema` provides validation utilities
3. **TypeScript Types** - Generated from JSON schemas for type safety
4. **Convention** - String-based interface works with WASM and native code

### Why This Approach?

- ✅ **Language Agnostic** - Works with any language (Rust, Go, TypeScript, etc.)
- ✅ **WASM Compatible** - Simple string in/out interface perfect for WASM
- ✅ **Type Safe** - TypeScript gets full type safety from generated types
- ✅ **Runtime Safe** - JSON schema validation catches errors at runtime
- ✅ **Flexible** - Tools can be WASM (sandboxed) or native (full system access)

## Building Tools

### WASM Tool (Rust)

```bash
cd packages/@tools/calculator
cargo install wasm-pack  # if not installed
pnpm run build
```

### Native Tool (TypeScript)

```bash
cd packages/@tools/text-transform
pnpm run build
```

## Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build
```

## Creating Your Own Tool

1. Create a new package in `packages/@tools/your-tool/`
2. Implement `metadata()` and `execute(input: string)` functions
3. Ensure output matches the JSON schemas in `@tools/schema`
4. Build and use in your agent engine

See existing tools for examples!
