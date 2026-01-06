import {
    Tool,
    ToolMetadata,
    ToolExecutionContext,
    ToolExecutionResult,
    ToolParameter,
} from './types';

/**
 * Abstract base class for tools
 * Provides common functionality for all tools
 */
export abstract class BaseTool implements Tool {
    metadata: ToolMetadata;

    constructor(metadata: ToolMetadata) {
        this.metadata = metadata;
    }

    /**
     * Validate parameters before execution
     */
    validate(params: Record<string, any>): { valid: boolean; errors?: string[] } {
        const errors: string[] = [];

        // Check required parameters
        this.metadata.parameters.forEach(param => {
            if (param.required && !(param.name in params)) {
                errors.push(`Missing required parameter: ${param.name}`);
            }
        });

        // Type validation
        Object.entries(params).forEach(([key, value]) => {
            const paramDef = this.metadata.parameters.find(p => p.name === key);

            if (!paramDef) {
                errors.push(`Unknown parameter: ${key}`);
                return;
            }

            // Basic type checking
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (paramDef.type === 'object' && actualType !== 'object') {
                errors.push(`Parameter '${key}' should be type '${paramDef.type}', got '${actualType}'`);
            } else if (paramDef.type !== 'object' && paramDef.type !== 'array' && actualType !== paramDef.type) {
                errors.push(`Parameter '${key}' should be type '${paramDef.type}', got '${actualType}'`);
            }

            // Enum validation
            if (paramDef.enum && !paramDef.enum.includes(value)) {
                errors.push(`Parameter '${key}' must be one of: ${paramDef.enum.join(', ')}`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Check if tool can be executed in current context
     * Override this in subclasses for specific requirements
     */
    async canExecute(context?: ToolExecutionContext): Promise<boolean> {
        return true; // Default: always can execute
    }

    /**
     * Get help text for the tool
     */
    getHelp(): string {
        let help = `# ${this.metadata.name}\n\n`;
        help += `${this.metadata.description}\n\n`;

        if (this.metadata.parameters.length > 0) {
            help += '## Parameters\n\n';
            this.metadata.parameters.forEach(param => {
                const required = param.required ? ' (required)' : ' (optional)';
                help += `**${param.name}**${required}\n`;
                help += `- Type: ${param.type}\n`;
                help += `- Description: ${param.description}\n`;
                if (param.default !== undefined) {
                    help += `- Default: ${JSON.stringify(param.default)}\n`;
                }
                if (param.enum) {
                    help += `- Options: ${param.enum.join(', ')}\n`;
                }
                help += '\n';
            });
        }

        help += `## Returns\n\n`;
        help += `${this.metadata.returns.description}\n\n`;

        if (this.metadata.examples && this.metadata.examples.length > 0) {
            help += '## Examples\n\n';
            this.metadata.examples.forEach((example, index) => {
                help += `### Example ${index + 1}: ${example.description}\n\n`;
                help += '**Input:**\n```json\n';
                help += JSON.stringify(example.input, null, 2);
                help += '\n```\n\n';
                help += '**Output:**\n```json\n';
                help += JSON.stringify(example.output, null, 2);
                help += '\n```\n\n';
            });
        }

        return help;
    }

    /**
     * Execute with timeout
     */
    protected async executeWithTimeout<T>(
        fn: () => Promise<T>,
        timeout: number = 30000
    ): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
            ),
        ]);
    }

    /**
     * Create a successful result
     */
    protected createSuccessResult(
        output: any,
        duration: number,
        metadata?: ToolExecutionResult['metadata']
    ): ToolExecutionResult {
        return {
            success: true,
            output,
            duration,
            metadata,
        };
    }

    /**
     * Create an error result
     */
    protected createErrorResult(
        error: Error,
        duration: number,
        metadata?: ToolExecutionResult['metadata']
    ): ToolExecutionResult {
        return {
            success: false,
            error,
            duration,
            metadata,
        };
    }

    /**
     * Abstract execute method - must be implemented by subclasses
     */
    abstract execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult>;
}

/**
 * Helper function to create tool parameter definitions
 */
export function defineParameter(
    name: string,
    type: ToolParameter['type'],
    description: string,
    required: boolean = true,
    options?: {
        default?: any;
        enum?: any[];
    }
): ToolParameter {
    return {
        name,
        type,
        description,
        required,
        ...options,
    };
}
