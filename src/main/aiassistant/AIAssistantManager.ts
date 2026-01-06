/**
 * AI Assistant - Multi-agent assistant
 */
import { EventEmitter } from 'events';

export interface AssistantMessage { id: string; role: 'user' | 'assistant' | 'agent'; content: string; agent?: string; timestamp: number; }
export interface Agent { id: string; name: string; specialty: 'code' | 'test' | 'review' | 'refactor' | 'explain'; }

export class AIAssistantManager extends EventEmitter {
    private static instance: AIAssistantManager;
    private agents: Map<string, Agent> = new Map();
    private messages: AssistantMessage[] = [];
    private constructor() { super(); this.initAgents(); }
    static getInstance(): AIAssistantManager { if (!AIAssistantManager.instance) AIAssistantManager.instance = new AIAssistantManager(); return AIAssistantManager.instance; }

    private initAgents(): void {
        const defaultAgents: Agent[] = [
            { id: 'coder', name: 'CodeGen', specialty: 'code' },
            { id: 'tester', name: 'TestGen', specialty: 'test' },
            { id: 'reviewer', name: 'Reviewer', specialty: 'review' },
            { id: 'refactorer', name: 'Refactor', specialty: 'refactor' },
            { id: 'explainer', name: 'Explainer', specialty: 'explain' }
        ];
        defaultAgents.forEach(a => this.agents.set(a.id, a));
    }

    async chat(message: string, agentId?: string): Promise<AssistantMessage> {
        const userMsg: AssistantMessage = { id: `msg_${Date.now()}`, role: 'user', content: message, timestamp: Date.now() };
        this.messages.push(userMsg);
        const agent = agentId ? this.agents.get(agentId) : undefined;
        const response: AssistantMessage = { id: `msg_${Date.now() + 1}`, role: agent ? 'agent' : 'assistant', content: `AI response to: ${message}`, agent: agent?.name, timestamp: Date.now() };
        this.messages.push(response);
        this.emit('message', response);
        return response;
    }

    getAgents(): Agent[] { return Array.from(this.agents.values()); }
    getHistory(): AssistantMessage[] { return [...this.messages]; }
    clear(): void { this.messages = []; }
}
export function getAIAssistantManager(): AIAssistantManager { return AIAssistantManager.getInstance(); }
