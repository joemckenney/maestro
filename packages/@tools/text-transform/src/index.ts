import type { Tool, ToolMetadata, ToolExecuteInput, ToolExecuteOutput } from '@tools/schema';

/**
 * Text transformation tool - native TypeScript implementation
 *
 * Demonstrates that tools don't have to be WASM - they can be native Node.js code
 * as long as they implement the same string-based interface.
 */
export class TextTransformTool implements Tool {
  metadata(): string {
    const metadata: ToolMetadata = {
      name: 'text-transform',
      version: '1.0.0',
      description: 'Transforms text using various operations (uppercase, lowercase, reverse, slugify)',
    };
    return JSON.stringify(metadata);
  }

  execute(input: string): string {
    try {
      const parsed: ToolExecuteInput = JSON.parse(input);
      const { parameters } = parsed;

      // Extract parameters
      const operation = parameters.operation as string;
      const text = parameters.text as string;

      if (!operation) {
        return this.errorResponse('Missing "operation" parameter');
      }

      if (typeof text !== 'string') {
        return this.errorResponse('Missing or invalid "text" parameter (must be a string)');
      }

      // Perform transformation
      let result: string;
      switch (operation) {
        case 'uppercase':
          result = text.toUpperCase();
          break;
        case 'lowercase':
          result = text.toLowerCase();
          break;
        case 'reverse':
          result = text.split('').reverse().join('');
          break;
        case 'slugify':
          result = text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
          break;
        case 'title':
          result = text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          break;
        default:
          return this.errorResponse(
            `Unknown operation: "${operation}". Supported: uppercase, lowercase, reverse, slugify, title`
          );
      }

      return this.successResponse({ result });
    } catch (error) {
      return this.errorResponse(
        `Failed to execute: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private successResponse(data: unknown): string {
    const output: ToolExecuteOutput = {
      success: true,
      data: data as ToolExecuteOutput['data'],
    };
    return JSON.stringify(output);
  }

  private errorResponse(error: string): string {
    const output: ToolExecuteOutput = {
      success: false,
      error,
    };
    return JSON.stringify(output);
  }
}

// Export convenience functions for WASM-like interface
const tool = new TextTransformTool();

export function metadata(): string {
  return tool.metadata();
}

export function execute(input: string): string {
  return tool.execute(input);
}
