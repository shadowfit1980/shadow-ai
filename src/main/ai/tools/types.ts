/**
 * Tool System Types
 * Defines the structure for agent tools and their execution
 */

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required: boolean;
    default?: any;
    enum?: any[];
}

export interface ToolMetadata {
    name: string;
    description: string;
    category: 'file' | 'code' | 'browser' | 'terminal' | 'api' | 'analysis' | 'git' | 'database' | 'web' | 'other';
    parameters: ToolParameter[];
    returns: {
        type: string;
        description: string;
    };
    examples?: Array<{
        input: Record<string, any>;
        output: any;
        description: string;
    }>;
    tags?: string[];
    version?: string;
    deprecated?: boolean;
}

export interface ToolExecutionContext {
    taskId?: string;
    userId?: string;
    workingDirectory?: string;
    environment?: Record<string, string>;
    timeout?: number;
    retries?: number;
    metadata?: Record<string, any>;
}

export interface ToolExecutionResult {
    success: boolean;
    output?: any;
    error?: Error;
    duration: number;
    metadata?: {
        tokensUsed?: number;
        apiCalls?: number;
        filesModified?: string[];
        commandsRun?: string[];
        [key: string]: any;
    };
}

export interface Tool {
    metadata: ToolMetadata;

    /**
     * Execute the tool with given parameters
     */
    execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult>;

    /**
     * Validate parameters before execution
     */
    validate(params: Record<string, any>): {
        valid: boolean;
        errors?: string[];
    };

    /**
     * Check if tool can be executed in current context
     */
    canExecute(context?: ToolExecutionContext): Promise<boolean>;

    /**
     * Get help text for the tool
     */
    getHelp(): string;
}

export interface ToolRegistry {
    /**
     * Register a new tool
     */
    register(tool: Tool): void;

    /**
     * Unregister a tool
     */
    unregister(name: string): boolean;

    /**
     * Get a tool by name
     */
    get(name: string): Tool | undefined;

    /**
     * List all tools
     */
    list(): Tool[];

    /**
     * Search tools by category or tags
     */
    search(query: {
        category?: ToolMetadata['category'];
        tags?: string[];
        name?: string;
    }): Tool[];

    /**
     * Execute a tool
     */
    execute(
        toolName: string,
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult>;
}
