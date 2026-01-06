/**
 * Agent Conversation Logger
 * Track and replay agent conversations and steps
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AgentStep {
    id: string;
    type: 'thought' | 'action' | 'observation' | 'result' | 'error';
    content: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface AgentConversation {
    id: string;
    task: string;
    agentId: string;
    steps: AgentStep[];
    status: 'running' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    result?: any;
    error?: string;
}

/**
 * AgentConversationLogger
 * Logs and visualizes agent thought processes
 */
export class AgentConversationLogger extends EventEmitter {
    private static instance: AgentConversationLogger;
    private conversations: Map<string, AgentConversation> = new Map();
    private activeConversation: string | null = null;
    private storePath: string | null = null;

    private constructor() {
        super();
    }

    static getInstance(): AgentConversationLogger {
        if (!AgentConversationLogger.instance) {
            AgentConversationLogger.instance = new AgentConversationLogger();
        }
        return AgentConversationLogger.instance;
    }

    /**
     * Set storage path
     */
    setStorePath(storagePath: string): void {
        this.storePath = storagePath;
    }

    /**
     * Start a new conversation
     */
    startConversation(task: string, agentId: string): AgentConversation {
        const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const conversation: AgentConversation = {
            id,
            task,
            agentId,
            steps: [],
            status: 'running',
            startTime: Date.now(),
        };

        this.conversations.set(id, conversation);
        this.activeConversation = id;

        this.emit('conversationStarted', conversation);
        return conversation;
    }

    /**
     * Add a step to the active conversation
     */
    addStep(
        type: AgentStep['type'],
        content: string,
        metadata?: Record<string, any>
    ): AgentStep | null {
        if (!this.activeConversation) return null;

        const conversation = this.conversations.get(this.activeConversation);
        if (!conversation) return null;

        const step: AgentStep = {
            id: `step_${Date.now()}_${conversation.steps.length}`,
            type,
            content,
            timestamp: Date.now(),
            metadata,
        };

        conversation.steps.push(step);
        this.emit('stepAdded', { conversationId: conversation.id, step });

        return step;
    }

    /**
     * Log a thought
     */
    logThought(thought: string): void {
        this.addStep('thought', thought);
    }

    /**
     * Log an action
     */
    logAction(action: string, params?: Record<string, any>): void {
        this.addStep('action', action, params);
    }

    /**
     * Log an observation
     */
    logObservation(observation: string): void {
        this.addStep('observation', observation);
    }

    /**
     * Log a result
     */
    logResult(result: string): void {
        this.addStep('result', result);
    }

    /**
     * Log an error
     */
    logError(error: string): void {
        this.addStep('error', error);
    }

    /**
     * Complete the active conversation
     */
    completeConversation(result?: any): AgentConversation | null {
        if (!this.activeConversation) return null;

        const conversation = this.conversations.get(this.activeConversation);
        if (!conversation) return null;

        conversation.status = 'completed';
        conversation.endTime = Date.now();
        conversation.result = result;

        this.emit('conversationCompleted', conversation);
        this.saveConversation(conversation);

        this.activeConversation = null;
        return conversation;
    }

    /**
     * Fail the active conversation
     */
    failConversation(error: string): AgentConversation | null {
        if (!this.activeConversation) return null;

        const conversation = this.conversations.get(this.activeConversation);
        if (!conversation) return null;

        conversation.status = 'failed';
        conversation.endTime = Date.now();
        conversation.error = error;

        this.emit('conversationFailed', conversation);
        this.saveConversation(conversation);

        this.activeConversation = null;
        return conversation;
    }

    /**
     * Get a conversation by ID
     */
    getConversation(id: string): AgentConversation | null {
        return this.conversations.get(id) || null;
    }

    /**
     * Get active conversation
     */
    getActiveConversation(): AgentConversation | null {
        if (!this.activeConversation) return null;
        return this.conversations.get(this.activeConversation) || null;
    }

    /**
     * Get all conversations
     */
    getAllConversations(): AgentConversation[] {
        return Array.from(this.conversations.values())
            .sort((a, b) => b.startTime - a.startTime);
    }

    /**
     * Get conversations by agent
     */
    getByAgent(agentId: string): AgentConversation[] {
        return Array.from(this.conversations.values())
            .filter(c => c.agentId === agentId)
            .sort((a, b) => b.startTime - a.startTime);
    }

    /**
     * Replay conversation steps
     */
    async replayConversation(id: string, delayMs = 500): Promise<void> {
        const conversation = this.conversations.get(id);
        if (!conversation) return;

        for (const step of conversation.steps) {
            this.emit('replayStep', { conversationId: id, step });
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        this.emit('replayComplete', { conversationId: id });
    }

    /**
     * Save conversation to file
     */
    private async saveConversation(conversation: AgentConversation): Promise<void> {
        if (!this.storePath) return;

        try {
            const dir = path.join(this.storePath, 'conversations');
            await fs.mkdir(dir, { recursive: true });

            const filePath = path.join(dir, `${conversation.id}.json`);
            await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
        } catch {
            // Ignore save errors
        }
    }

    /**
     * Load conversations from storage
     */
    async loadConversations(): Promise<void> {
        if (!this.storePath) return;

        try {
            const dir = path.join(this.storePath, 'conversations');
            const files = await fs.readdir(dir);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const filePath = path.join(dir, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const conversation = JSON.parse(content) as AgentConversation;
                this.conversations.set(conversation.id, conversation);
            }
        } catch {
            // Directory doesn't exist yet
        }
    }

    /**
     * Generate conversation summary
     */
    generateSummary(id: string): string {
        const conversation = this.conversations.get(id);
        if (!conversation) return 'Conversation not found';

        const lines: string[] = [
            `# Agent Conversation: ${conversation.task}`,
            '',
            `**Agent:** ${conversation.agentId}`,
            `**Status:** ${conversation.status}`,
            `**Duration:** ${this.formatDuration(conversation)}`,
            '',
            '## Steps',
            '',
        ];

        for (const step of conversation.steps) {
            const icon = this.getStepIcon(step.type);
            lines.push(`${icon} **${step.type.toUpperCase()}**: ${step.content}`);
        }

        if (conversation.result) {
            lines.push('', '## Result', '', JSON.stringify(conversation.result, null, 2));
        }

        if (conversation.error) {
            lines.push('', '## Error', '', conversation.error);
        }

        return lines.join('\n');
    }

    /**
     * Format duration
     */
    private formatDuration(conversation: AgentConversation): string {
        const end = conversation.endTime || Date.now();
        const ms = end - conversation.startTime;
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);

        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Get step icon
     */
    private getStepIcon(type: AgentStep['type']): string {
        const icons: Record<AgentStep['type'], string> = {
            thought: '💭',
            action: '⚡',
            observation: '👁️',
            result: '✅',
            error: '❌',
        };
        return icons[type] || '•';
    }

    /**
     * Clear all conversations
     */
    clearAll(): void {
        this.conversations.clear();
        this.activeConversation = null;
    }
}

// Singleton getter
export function getAgentConversationLogger(): AgentConversationLogger {
    return AgentConversationLogger.getInstance();
}
