/**
 * Agent Builder - Custom agent creation
 */
import { EventEmitter } from 'events';

export interface CustomAgent { id: string; name: string; description: string; instructions: string; tools: string[]; model: string; enabled: boolean; }

export class AgentBuilder extends EventEmitter {
    private static instance: AgentBuilder;
    private agents: Map<string, CustomAgent> = new Map();
    private constructor() { super(); }
    static getInstance(): AgentBuilder { if (!AgentBuilder.instance) AgentBuilder.instance = new AgentBuilder(); return AgentBuilder.instance; }

    create(name: string, description: string, instructions: string, tools: string[] = [], model = 'gpt-4o'): CustomAgent {
        const agent: CustomAgent = { id: `agent_${Date.now()}`, name, description, instructions, tools, model, enabled: true };
        this.agents.set(agent.id, agent); this.emit('created', agent); return agent;
    }

    update(agentId: string, updates: Partial<Omit<CustomAgent, 'id'>>): boolean { const a = this.agents.get(agentId); if (!a) return false; Object.assign(a, updates); return true; }
    toggle(agentId: string): boolean { const a = this.agents.get(agentId); if (!a) return false; a.enabled = !a.enabled; return true; }
    delete(agentId: string): boolean { return this.agents.delete(agentId); }
    get(agentId: string): CustomAgent | null { return this.agents.get(agentId) || null; }
    getEnabled(): CustomAgent[] { return Array.from(this.agents.values()).filter(a => a.enabled); }
    getAll(): CustomAgent[] { return Array.from(this.agents.values()); }
}
export function getAgentBuilder(): AgentBuilder { return AgentBuilder.getInstance(); }
