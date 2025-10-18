import Ajv from 'ajv';

// Import JSON schemas
import toolMetadataSchema from './schemas/tool-metadata.json' with { type: 'json' };
import toolExecuteInputSchema from './schemas/tool-execute-input.json' with { type: 'json' };
import toolExecuteOutputSchema from './schemas/tool-execute-output.json' with { type: 'json' };

// Export generated types (these will be created by json-schema-to-typescript)
export type { ToolMetadata } from './generated/tool-metadata.js';
export type { ToolExecuteInput } from './generated/tool-execute-input.js';
export type { ToolExecuteOutput } from './generated/tool-execute-output.js';

// Create AJV instance for validation
const ajv = new Ajv();

// Compile validators
const validateMetadata = ajv.compile(toolMetadataSchema);
const validateExecuteInput = ajv.compile(toolExecuteInputSchema);
const validateExecuteOutput = ajv.compile(toolExecuteOutputSchema);

// Validation functions
export function isValidMetadata(data: unknown): boolean {
  return validateMetadata(data);
}

export function isValidExecuteInput(data: unknown): boolean {
  return validateExecuteInput(data);
}

export function isValidExecuteOutput(data: unknown): boolean {
  return validateExecuteOutput(data);
}

export function getValidationErrors(validator: typeof validateMetadata): string[] {
  return validator.errors?.map(err => `${err.instancePath} ${err.message}`) || [];
}

// Tool interface that all tools must implement
export interface Tool {
  /**
   * Returns metadata about the tool
   */
  metadata(): string; // JSON string matching ToolMetadata schema

  /**
   * Executes the tool with given input
   * @param input - JSON string matching ToolExecuteInput schema
   * @returns JSON string matching ToolExecuteOutput schema
   */
  execute(input: string): Promise<string> | string;
}

// Helper function to parse and validate tool responses
export function parseToolMetadata(json: string) {
  try {
    const data = JSON.parse(json);
    if (!isValidMetadata(data)) {
      throw new Error(`Invalid metadata: ${getValidationErrors(validateMetadata).join(', ')}`);
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse metadata: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseToolExecuteInput(json: string) {
  try {
    const data = JSON.parse(json);
    if (!isValidExecuteInput(data)) {
      throw new Error(`Invalid execute input: ${getValidationErrors(validateExecuteInput).join(', ')}`);
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse execute input: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function parseToolExecuteOutput(json: string) {
  try {
    const data = JSON.parse(json);
    if (!isValidExecuteOutput(data)) {
      throw new Error(`Invalid execute output: ${getValidationErrors(validateExecuteOutput).join(', ')}`);
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse execute output: ${error instanceof Error ? error.message : String(error)}`);
  }
}
