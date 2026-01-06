import { Task, ExecutionResult } from '../reasoning/types';
import { toolRegistry } from '../tools';
import { AgentOrchestrator } from '../reasoning/AgentOrchestrator';

/**
 * Enhanced Agent Orchestrator with Tool Integration
 * Extends the base orchestrator with advanced tool capabilities
 */
export class EnhancedAgentOrchestrator {
    private static instance: EnhancedAgentOrchestrator;
    private baseOrchestrator: AgentOrchestrator;

    private constructor() {
        this.baseOrchestrator = new AgentOrchestrator();
        this.initializeTools();
    }

    static getInstance(): EnhancedAgentOrchestrator {
        if (!EnhancedAgentOrchestrator.instance) {
            EnhancedAgentOrchestrator.instance = new EnhancedAgentOrchestrator();
        }
        return EnhancedAgentOrchestrator.instance;
    }

    /**
     * Initialize tools in the orchestrator
     */
    private initializeTools() {
        const tools = toolRegistry.list();
        console.log(`🔧 Integrating ${tools.length} tools into orchestrator`);

        tools.forEach(tool => {
            this.baseOrchestrator.registerTool({
                name: tool.metadata.name,
                execute: async (inputs: any) => {
                    const result = await tool.execute(inputs);
                    if (!result.success) {
                        throw result.error || new Error('Tool execution failed');
                    }
                    return result.output;
                },
                timeout: 30000,
                retryable: true,
            });
        });
    }

    /**
     * Execute a task with available tools
     */
    async executeTask(task: Task): Promise<ExecutionResult> {
        console.log(`🚀 Enhanced execution of task: ${task.description}`);
        return this.baseOrchestrator.executeTask(task);
    }

    /**
     * Get explanation of reasoning for a task
     */
    async explainReasoning(task: Task): Promise<string> {
        return this.baseOrchestrator.explainReasoning(task);
    }

    /**
     * Get available tools for AI context
     */
    getToolContext(): string {
        return toolRegistry.exportForAI();
    }

    /**
     * Get tool statistics
     */
    getToolStats() {
        return toolRegistry.getStats();
    }

    /**
     * Execute a specific tool directly
     */
    async executeTool(
        toolName: string,
        params: Record<string, any>,
        context?: any
    ) {
        return toolRegistry.execute(toolName, params, context);
    }

    /**
     * Search for tools by criteria
     */
    searchTools(query: {
        category?: string;
        tags?: string[];
        name?: string;
    }) {
        return toolRegistry.search(query as any);
    }

    /**
     * List all available tools
     */
    listTools() {
        return toolRegistry.listMetadata();
    }
}

// Export singleton getter
export function getEnhancedOrchestrator(): EnhancedAgentOrchestrator {
    return EnhancedAgentOrchestrator.getInstance();
}
