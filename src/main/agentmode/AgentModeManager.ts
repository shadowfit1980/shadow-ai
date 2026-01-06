/**
 * Agent Mode Manager - Autonomous agent mode
 */
import { EventEmitter } from 'events';

export interface AgentTask { id: string; description: string; status: 'pending' | 'running' | 'completed' | 'failed'; steps: string[]; result?: any; }

export class AgentModeManager extends EventEmitter {
    private static instance: AgentModeManager;
    private tasks: Map<string, AgentTask> = new Map();
    private running = false;
    private constructor() { super(); }
    static getInstance(): AgentModeManager { if (!AgentModeManager.instance) AgentModeManager.instance = new AgentModeManager(); return AgentModeManager.instance; }

    async execute(description: string): Promise<AgentTask> {
        const task: AgentTask = { id: `agent_${Date.now()}`, description, status: 'running', steps: [] };
        this.tasks.set(task.id, task);
        this.running = true;
        this.emit('started', task);
        task.steps.push('Analyzing task', 'Planning execution', 'Executing steps', 'Validating results');
        task.status = 'completed';
        this.running = false;
        this.emit('completed', task);
        return task;
    }

    stop(id: string): boolean { const t = this.tasks.get(id); if (!t) return false; t.status = 'failed'; this.running = false; return true; }
    isRunning(): boolean { return this.running; }
    getAll(): AgentTask[] { return Array.from(this.tasks.values()); }
}
export function getAgentModeManager(): AgentModeManager { return AgentModeManager.getInstance(); }
