/**
 * Multi-Agent Orchestration
 * 
 * Specialized agents working together (Architect, Coder, Tester, Reviewer)
 * with agent-to-agent communication and parallel task execution.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export type AgentRole = 'architect' | 'coder' | 'tester' | 'reviewer' | 'devops' | 'documenter';

export interface SpecializedAgent {
    id: string;
    role: AgentRole;
    name: string;
    expertise: string[];
    systemPrompt: string;
    status: 'idle' | 'working' | 'waiting';
    currentTask?: string;
}

export interface AgentMessage {
    from: string;
    to: string;
    type: 'request' | 'response' | 'broadcast';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface TeamTask {
    id: string;
    description: string;
    assignedAgents: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    subtasks: Array<{ agentId: string; task: string; result?: string }>;
    startedAt?: Date;
    completedAt?: Date;
}

// ============================================================================
// MULTI-AGENT ORCHESTRATOR
// ============================================================================

export class MultiAgentOrchestrator extends EventEmitter {
    private static instance: MultiAgentOrchestrator;
    private modelManager: ModelManager;
    private agents: Map<string, SpecializedAgent> = new Map();
    private messageQueue: AgentMessage[] = [];
    private currentTask: TeamTask | null = null;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
        this.initializeAgents();
    }

    static getInstance(): MultiAgentOrchestrator {
        if (!MultiAgentOrchestrator.instance) {
            MultiAgentOrchestrator.instance = new MultiAgentOrchestrator();
        }
        return MultiAgentOrchestrator.instance;
    }

    // ========================================================================
    // AGENT INITIALIZATION
    // ========================================================================

    private initializeAgents(): void {
        const agentConfigs: Omit<SpecializedAgent, 'id' | 'status'>[] = [
            {
                role: 'architect',
                name: 'Archie',
                expertise: ['system design', 'architecture', 'scalability', 'patterns'],
                systemPrompt: `You are Archie, a Senior Software Architect. You design system architecture, 
make high-level technical decisions, and ensure scalability and maintainability. 
Think about patterns, trade-offs, and long-term implications.`,
            },
            {
                role: 'coder',
                name: 'Neo',
                expertise: ['implementation', 'algorithms', 'optimization', 'debugging'],
                systemPrompt: `You are Neo, a Senior Developer. You write clean, efficient code.
Focus on best practices, performance, and readability. Implement features based on specs.`,
            },
            {
                role: 'tester',
                name: 'Trinity',
                expertise: ['testing', 'QA', 'edge cases', 'coverage'],
                systemPrompt: `You are Trinity, a QA Engineer. You write comprehensive tests,
find edge cases, and ensure code quality. Think about what could go wrong.`,
            },
            {
                role: 'reviewer',
                name: 'Morpheus',
                expertise: ['code review', 'security', 'best practices', 'mentoring'],
                systemPrompt: `You are Morpheus, a Tech Lead. You review code for quality, security,
and adherence to standards. Provide constructive feedback and suggestions.`,
            },
            {
                role: 'devops',
                name: 'Tank',
                expertise: ['deployment', 'CI/CD', 'infrastructure', 'monitoring'],
                systemPrompt: `You are Tank, a DevOps Engineer. You handle deployments, CI/CD pipelines,
infrastructure, and monitoring. Ensure reliability and automation.`,
            },
            {
                role: 'documenter',
                name: 'Oracle',
                expertise: ['documentation', 'API docs', 'tutorials', 'clarity'],
                systemPrompt: `You are Oracle, a Technical Writer. You create clear documentation,
API references, and tutorials. Make complex things understandable.`,
            },
        ];

        agentConfigs.forEach(config => {
            const agent: SpecializedAgent = {
                ...config,
                id: `agent_${config.role}`,
                status: 'idle',
            };
            this.agents.set(agent.id, agent);
        });
    }

    // ========================================================================
    // AGENT COMMUNICATION
    // ========================================================================

    /**
     * Send message between agents
     */
    sendMessage(message: Omit<AgentMessage, 'timestamp'>): void {
        const fullMessage: AgentMessage = {
            ...message,
            timestamp: new Date(),
        };

        this.messageQueue.push(fullMessage);
        this.emit('message:sent', fullMessage);
    }

    /**
     * Broadcast message to all agents
     */
    broadcast(from: string, content: string): void {
        for (const agent of this.agents.values()) {
            if (agent.id !== from) {
                this.sendMessage({
                    from,
                    to: agent.id,
                    type: 'broadcast',
                    content,
                });
            }
        }
    }

    /**
     * Get messages for an agent
     */
    getMessages(agentId: string): AgentMessage[] {
        return this.messageQueue.filter(m => m.to === agentId);
    }

    // ========================================================================
    // TASK EXECUTION
    // ========================================================================

    /**
     * Execute a team task with multiple agents
     */
    async executeTeamTask(description: string): Promise<TeamTask> {
        const task: TeamTask = {
            id: `task_${Date.now()}`,
            description,
            assignedAgents: [],
            status: 'pending',
            subtasks: [],
            startedAt: new Date(),
        };

        this.currentTask = task;
        this.emit('task:started', task);

        try {
            // 1. Architect designs the approach
            const architect = this.agents.get('agent_architect')!;
            const design = await this.agentWork(architect,
                `Design an approach for: ${description}`);
            task.subtasks.push({ agentId: architect.id, task: 'Design', result: design });

            // 2. Coder implements based on design
            const coder = this.agents.get('agent_coder')!;
            const implementation = await this.agentWork(coder,
                `Implement based on this design:\n${design}\n\nTask: ${description}`);
            task.subtasks.push({ agentId: coder.id, task: 'Implementation', result: implementation });

            // 3. Tester writes tests
            const tester = this.agents.get('agent_tester')!;
            const tests = await this.agentWork(tester,
                `Write tests for this implementation:\n${implementation}`);
            task.subtasks.push({ agentId: tester.id, task: 'Testing', result: tests });

            // 4. Reviewer reviews everything
            const reviewer = this.agents.get('agent_reviewer')!;
            const review = await this.agentWork(reviewer,
                `Review this work:\nDesign: ${design}\nImplementation: ${implementation}\nTests: ${tests}`);
            task.subtasks.push({ agentId: reviewer.id, task: 'Review', result: review });

            // 5. Documenter creates docs
            const documenter = this.agents.get('agent_documenter')!;
            const docs = await this.agentWork(documenter,
                `Document this feature:\n${description}\n\nImplementation: ${implementation}`);
            task.subtasks.push({ agentId: documenter.id, task: 'Documentation', result: docs });

            task.status = 'completed';
            task.completedAt = new Date();
            task.assignedAgents = task.subtasks.map(s => s.agentId);

            this.emit('task:completed', task);
            return task;

        } catch (error: any) {
            task.status = 'failed';
            this.emit('task:failed', { task, error: error.message });
            throw error;
        }
    }

    /**
     * Have an agent perform work
     */
    private async agentWork(agent: SpecializedAgent, task: string): Promise<string> {
        agent.status = 'working';
        agent.currentTask = task;
        this.emit('agent:working', { agent, task });

        try {
            const response = await this.modelManager.chat([
                { role: 'system', content: agent.systemPrompt, timestamp: new Date() },
                { role: 'user', content: task, timestamp: new Date() }
            ]);

            agent.status = 'idle';
            agent.currentTask = undefined;
            this.emit('agent:completed', { agent, result: response });

            return response;
        } catch (error) {
            agent.status = 'idle';
            agent.currentTask = undefined;
            throw error;
        }
    }

    /**
     * Execute subtasks in parallel
     */
    async executeParallel(subtasks: Array<{ agentId: string; task: string }>): Promise<string[]> {
        const promises = subtasks.map(async ({ agentId, task }) => {
            const agent = this.agents.get(agentId);
            if (!agent) throw new Error(`Agent ${agentId} not found`);
            return this.agentWork(agent, task);
        });

        return Promise.all(promises);
    }

    // ========================================================================
    // AGENT QUERIES
    // ========================================================================

    /**
     * Get agent by ID or role
     */
    getAgent(idOrRole: string): SpecializedAgent | undefined {
        return this.agents.get(idOrRole) ||
            Array.from(this.agents.values()).find(a => a.role === idOrRole);
    }

    /**
     * List all agents
     */
    listAgents(): SpecializedAgent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get agent status
     */
    getAgentStatus(): Record<string, { status: string; task?: string }> {
        const status: Record<string, { status: string; task?: string }> = {};
        for (const agent of this.agents.values()) {
            status[agent.name] = { status: agent.status, task: agent.currentTask };
        }
        return status;
    }

    /**
     * Get current task
     */
    getCurrentTask(): TeamTask | null {
        return this.currentTask;
    }
}

// Export singleton
export const multiAgentOrchestrator = MultiAgentOrchestrator.getInstance();
