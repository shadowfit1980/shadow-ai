/**
 * 🛠️ ToolRegistry - Generic Tool Dispatch System
 * 
 * Claude's Recommendation: Replace 834 IPC handlers with ~30 generic handlers
 * Data-driven tool dispatch via registry pattern
 */

import { EventEmitter } from 'events';

// Types
export interface Tool {
    name: string;
    description: string;
    category: ToolCategory;
    inputSchema: Record<string, SchemaType>;
    outputSchema: Record<string, SchemaType>;
    execute: (input: Record<string, unknown>) => Promise<ToolResult>;
    stream?: (input: Record<string, unknown>) => AsyncGenerator<ToolChunk>;
    validate?: (input: Record<string, unknown>) => ValidationResult;
}

export type ToolCategory =
    | 'code'
    | 'file'
    | 'ai'
    | 'git'
    | 'terminal'
    | 'browser'
    | 'database'
    | 'deployment'
    | 'testing'
    | 'documentation'
    | 'analysis'
    | 'generation';

export interface SchemaType {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    default?: unknown;
}

export interface ToolResult {
    success: boolean;
    data: unknown;
    error?: string;
    metadata: {
        duration: number;
        tokensUsed?: number;
        cached: boolean;
    };
}

export interface ToolChunk {
    type: 'data' | 'progress' | 'error' | 'complete';
    content: unknown;
    progress?: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export interface ToolQuery {
    category?: ToolCategory;
    namePattern?: string;
    tags?: string[];
}

export class ToolRegistry extends EventEmitter {
    private static instance: ToolRegistry;
    private tools: Map<string, Tool> = new Map();
    private aliases: Map<string, string> = new Map();
    private categoryIndex: Map<ToolCategory, Set<string>> = new Map();

    private constructor() {
        super();
        this.initializeCategories();
    }

    static getInstance(): ToolRegistry {
        if (!ToolRegistry.instance) {
            ToolRegistry.instance = new ToolRegistry();
        }
        return ToolRegistry.instance;
    }

    private initializeCategories(): void {
        const categories: ToolCategory[] = [
            'code', 'file', 'ai', 'git', 'terminal', 'browser',
            'database', 'deployment', 'testing', 'documentation',
            'analysis', 'generation'
        ];
        categories.forEach(cat => this.categoryIndex.set(cat, new Set()));
    }

    /**
     * Register a tool
     */
    register(tool: Tool): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool ${tool.name} already registered`);
        }

        this.tools.set(tool.name, tool);
        this.categoryIndex.get(tool.category)?.add(tool.name);

        this.emit('tool:registered', { name: tool.name, category: tool.category });
    }

    /**
     * Register an alias for a tool
     */
    registerAlias(alias: string, toolName: string): void {
        if (!this.tools.has(toolName)) {
            throw new Error(`Tool ${toolName} not found`);
        }
        this.aliases.set(alias, toolName);
    }

    /**
     * Bulk register tools
     */
    registerMany(tools: Tool[]): void {
        tools.forEach(tool => this.register(tool));
    }

    /**
     * Get a tool by name (or alias)
     */
    get(nameOrAlias: string): Tool | undefined {
        const name = this.aliases.get(nameOrAlias) || nameOrAlias;
        return this.tools.get(name);
    }

    /**
     * Execute a tool by name
     */
    async invoke(name: string, input: Record<string, unknown>): Promise<ToolResult> {
        const tool = this.get(name);
        if (!tool) {
            return {
                success: false,
                data: null,
                error: `Tool ${name} not found`,
                metadata: { duration: 0, cached: false }
            };
        }

        // Validate input
        if (tool.validate) {
            const validation = tool.validate(input);
            if (!validation.valid) {
                return {
                    success: false,
                    data: null,
                    error: `Validation failed: ${validation.errors.join(', ')}`,
                    metadata: { duration: 0, cached: false }
                };
            }
        }

        const startTime = Date.now();

        try {
            this.emit('tool:start', { name, input });
            const result = await tool.execute(input);
            result.metadata.duration = Date.now() - startTime;
            this.emit('tool:complete', { name, result });
            return result;
        } catch (error) {
            const errorResult: ToolResult = {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                metadata: { duration: Date.now() - startTime, cached: false }
            };
            this.emit('tool:error', { name, error: errorResult.error });
            return errorResult;
        }
    }

    /**
     * Stream a tool execution
     */
    async *stream(name: string, input: Record<string, unknown>): AsyncGenerator<ToolChunk> {
        const tool = this.get(name);
        if (!tool) {
            yield { type: 'error', content: `Tool ${name} not found` };
            return;
        }

        if (!tool.stream) {
            // Fallback to non-streaming
            const result = await this.invoke(name, input);
            yield { type: result.success ? 'complete' : 'error', content: result.data };
            return;
        }

        this.emit('tool:stream:start', { name });

        try {
            for await (const chunk of tool.stream(input)) {
                yield chunk;
            }
        } catch (error) {
            yield {
                type: 'error',
                content: error instanceof Error ? error.message : 'Unknown error'
            };
        }

        this.emit('tool:stream:complete', { name });
    }

    /**
     * Query tools by criteria
     */
    query(query: ToolQuery): Tool[] {
        let results = Array.from(this.tools.values());

        if (query.category) {
            const names = this.categoryIndex.get(query.category);
            results = results.filter(t => names?.has(t.name));
        }

        if (query.namePattern) {
            const regex = new RegExp(query.namePattern, 'i');
            results = results.filter(t => regex.test(t.name));
        }

        return results;
    }

    /**
     * List all tools
     */
    list(): { name: string; category: ToolCategory; description: string }[] {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            category: t.category,
            description: t.description
        }));
    }

    /**
     * Get tool count
     */
    count(): number {
        return this.tools.size;
    }

    /**
     * Get categories with counts
     */
    getCategoryCounts(): Record<ToolCategory, number> {
        const counts: Partial<Record<ToolCategory, number>> = {};
        this.categoryIndex.forEach((tools, category) => {
            counts[category] = tools.size;
        });
        return counts as Record<ToolCategory, number>;
    }

    /**
     * Unregister a tool
     */
    unregister(name: string): boolean {
        const tool = this.tools.get(name);
        if (!tool) return false;

        this.tools.delete(name);
        this.categoryIndex.get(tool.category)?.delete(name);

        // Remove aliases
        this.aliases.forEach((target, alias) => {
            if (target === name) this.aliases.delete(alias);
        });

        this.emit('tool:unregistered', { name });
        return true;
    }
}

export const toolRegistry = ToolRegistry.getInstance();
