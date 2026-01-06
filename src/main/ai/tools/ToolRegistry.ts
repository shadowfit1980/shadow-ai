import {
    Tool,
    ToolRegistry,
    ToolExecutionContext,
    ToolExecutionResult,
    ToolMetadata,
} from './types';

/**
 * Central registry for all agent tools
 */
export class AgentToolRegistry implements ToolRegistry {
    private static instance: AgentToolRegistry;
    private tools: Map<string, Tool> = new Map();
    private executionHistory: Array<{
        toolName: string;
        timestamp: Date;
        duration: number;
        success: boolean;
    }> = [];

    private constructor() { }

    static getInstance(): AgentToolRegistry {
        if (!AgentToolRegistry.instance) {
            AgentToolRegistry.instance = new AgentToolRegistry();
        }
        return AgentToolRegistry.instance;
    }

    /**
     * Register a new tool
     */
    register(tool: Tool): void {
        const name = tool.metadata.name;

        if (this.tools.has(name)) {
            console.warn(`Tool '${name}' is already registered. Overwriting.`);
        }

        this.tools.set(name, tool);
        console.log(`✅ Registered tool: ${name} (${tool.metadata.category})`);
    }

    /**
     * Register multiple tools at once
     */
    registerMany(tools: Tool[]): void {
        tools.forEach(tool => this.register(tool));
    }

    /**
     * Unregister a tool
     */
    unregister(name: string): boolean {
        const deleted = this.tools.delete(name);
        if (deleted) {
            console.log(`Unregistered tool: ${name}`);
        }
        return deleted;
    }

    /**
     * Get a tool by name
     */
    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    /**
     * List all tools
     */
    list(): Tool[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get all tool metadata
     */
    listMetadata(): ToolMetadata[] {
        return this.list().map(tool => tool.metadata);
    }

    /**
     * Search tools by criteria
     */
    search(query: {
        category?: ToolMetadata['category'];
        tags?: string[];
        name?: string;
    }): Tool[] {
        const tools = this.list();

        return tools.filter(tool => {
            const metadata = tool.metadata;

            // Filter by category
            if (query.category && metadata.category !== query.category) {
                return false;
            }

            // Filter by tags
            if (query.tags && query.tags.length > 0) {
                const toolTags = metadata.tags || [];
                const hasAllTags = query.tags.every(tag => toolTags.includes(tag));
                if (!hasAllTags) return false;
            }

            // Filter by name (partial match)
            if (query.name) {
                const searchName = query.name.toLowerCase();
                if (!metadata.name.toLowerCase().includes(searchName)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Execute a tool
     */
    async execute(
        toolName: string,
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const tool = this.get(toolName);

        if (!tool) {
            return {
                success: false,
                error: new Error(`Tool '${toolName}' not found`),
                duration: 0,
            };
        }

        // Validate parameters
        const validation = tool.validate(params);
        if (!validation.valid) {
            return {
                success: false,
                error: new Error(`Invalid parameters: ${validation.errors?.join(', ')}`),
                duration: 0,
            };
        }

        // Check if tool can execute
        const canExecute = await tool.canExecute(context);
        if (!canExecute) {
            return {
                success: false,
                error: new Error(`Tool '${toolName}' cannot execute in current context`),
                duration: 0,
            };
        }

        // Execute tool
        const startTime = Date.now();
        let result: ToolExecutionResult;

        try {
            console.log(`🔧 Executing tool: ${toolName}`);
            result = await tool.execute(params, context);
        } catch (error: any) {
            result = {
                success: false,
                error,
                duration: Date.now() - startTime,
            };
        }

        // Record execution
        this.executionHistory.push({
            toolName,
            timestamp: new Date(),
            duration: result.duration,
            success: result.success,
        });

        // Keep history manageable (last 1000 executions)
        if (this.executionHistory.length > 1000) {
            this.executionHistory = this.executionHistory.slice(-1000);
        }

        return result;
    }

    /**
     * Get execution statistics
     */
    getStats() {
        const stats = {
            totalTools: this.tools.size,
            totalExecutions: this.executionHistory.length,
            successRate: 0,
            averageDuration: 0,
            byCategory: {} as Record<string, number>,
            mostUsed: [] as Array<{ name: string; count: number }>,
        };

        // Calculate success rate
        const successful = this.executionHistory.filter(e => e.success).length;
        stats.successRate = this.executionHistory.length > 0
            ? successful / this.executionHistory.length
            : 0;

        // Calculate average duration
        const totalDuration = this.executionHistory.reduce((sum, e) => sum + e.duration, 0);
        stats.averageDuration = this.executionHistory.length > 0
            ? totalDuration / this.executionHistory.length
            : 0;

        // Count by category
        this.list().forEach(tool => {
            const category = tool.metadata.category;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });

        // Most used tools
        const usageCount = new Map<string, number>();
        this.executionHistory.forEach(e => {
            usageCount.set(e.toolName, (usageCount.get(e.toolName) || 0) + 1);
        });

        stats.mostUsed = Array.from(usageCount.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return stats;
    }

    /**
     * Clear execution history
     */
    clearHistory(): void {
        this.executionHistory = [];
    }

    /**
     * Export tool metadata (for AI model context)
     */
    exportForAI(): string {
        const tools = this.list();
        let output = '# Available Tools\n\n';

        // Group by category
        const byCategory = new Map<string, Tool[]>();
        tools.forEach(tool => {
            const category = tool.metadata.category;
            if (!byCategory.has(category)) {
                byCategory.set(category, []);
            }
            byCategory.get(category)!.push(tool);
        });

        // Format each category
        byCategory.forEach((categoryTools, category) => {
            output += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Tools\n\n`;

            categoryTools.forEach(tool => {
                const meta = tool.metadata;
                output += `### ${meta.name}\n`;
                output += `${meta.description}\n\n`;

                if (meta.parameters.length > 0) {
                    output += '**Parameters:**\n';
                    meta.parameters.forEach(param => {
                        const required = param.required ? '(required)' : '(optional)';
                        output += `- \`${param.name}\` ${required}: ${param.description}\n`;
                    });
                    output += '\n';
                }

                if (meta.examples && meta.examples.length > 0) {
                    output += '**Example:**\n```json\n';
                    output += JSON.stringify(meta.examples[0].input, null, 2);
                    output += '\n```\n\n';
                }
            });
        });

        return output;
    }
}

// Export singleton
export const toolRegistry = AgentToolRegistry.getInstance();
