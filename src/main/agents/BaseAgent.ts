import { AgentMessage, AgentType } from '../types';
import { ModelManager } from '../ai/ModelManager';

/**
 * Base Agent class
 * All specialized agents inherit from this
 */
export abstract class BaseAgent {
    protected agentType: AgentType;
    protected modelManager: ModelManager;
    protected systemPrompt: string;
    protected memory: AgentMessage[] = [];

    constructor(agentType: AgentType, systemPrompt: string) {
        this.agentType = agentType;
        this.systemPrompt = systemPrompt;
        this.modelManager = ModelManager.getInstance();
    }

    /**
     * Execute a task
     */
    abstract execute(task: string, context?: any): Promise<any>;

    /**
     * Get agent capabilities
     */
    abstract getCapabilities(): string[];

    /**
     * Chat with the AI model
     */
    protected async chat(userMessage: string, context?: any): Promise<string> {
        const messages: AgentMessage[] = [
            {
                role: 'system',
                content: this.systemPrompt,
                timestamp: new Date(),
            },
            ...this.memory,
            {
                role: 'user',
                content: userMessage,
                timestamp: new Date(),
            },
        ];

        const response = await this.modelManager.chat(messages);

        // Store in memory
        this.memory.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        });
        this.memory.push({
            role: 'agent',
            content: response,
            agentType: this.agentType,
            timestamp: new Date(),
        });

        // Keep memory manageable (last 10 exchanges)
        if (this.memory.length > 20) {
            this.memory = this.memory.slice(-20);
        }

        return response;
    }

    /**
     * Clear agent memory
     */
    clearMemory(): void {
        this.memory = [];
    }

    /**
     * Get agent type
     */
    getType(): AgentType {
        return this.agentType;
    }

    /**
     * Get agent name
     */
    getName(): string {
        return `Shadow ${this.agentType.charAt(0).toUpperCase() + this.agentType.slice(1)}`;
    }
}
