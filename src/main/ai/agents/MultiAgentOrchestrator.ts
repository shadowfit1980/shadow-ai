/**
 * Multi-Agent Orchestrator
 * 
 * Coordinates multiple specialized agents working together
 * to solve complex tasks through collaboration.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface Agent {
    id: string;
    name: string;
    role: string;
    capabilities: string[];
    status: 'idle' | 'busy' | 'error';
    execute: (task: AgentTask) => Promise<AgentResult>;
}

interface AgentTask {
    id: string;
    type: string;
    input: any;
    context?: any;
    deadline?: number;
}

interface AgentResult {
    taskId: string;
    agentId: string;
    success: boolean;
    output: any;
    error?: string;
    duration: number;
}

interface ConversationMessage {
    from: string;
    to: string | 'all';
    content: string;
    timestamp: number;
}

// ============================================================================
// MULTI-AGENT ORCHESTRATOR
// ============================================================================

export class MultiAgentOrchestrator extends EventEmitter {
    private static instance: MultiAgentOrchestrator;
    private agents: Map<string, Agent> = new Map();
    private taskQueue: AgentTask[] = [];
    private conversation: ConversationMessage[] = [];
    private isRunning: boolean = false;

    private constructor() {
        super();
    }

    static getInstance(): MultiAgentOrchestrator {
        if (!MultiAgentOrchestrator.instance) {
            MultiAgentOrchestrator.instance = new MultiAgentOrchestrator();
        }
        return MultiAgentOrchestrator.instance;
    }

    // ========================================================================
    // AGENT MANAGEMENT
    // ========================================================================

    registerAgent(agent: Agent): void {
        this.agents.set(agent.id, agent);
        this.emit('agent:registered', { id: agent.id, name: agent.name });
    }

    unregisterAgent(agentId: string): void {
        this.agents.delete(agentId);
        this.emit('agent:unregistered', { id: agentId });
    }

    getAgent(agentId: string): Agent | undefined {
        return this.agents.get(agentId);
    }

    listAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    // ========================================================================
    // TASK ROUTING
    // ========================================================================

    async routeTask(task: AgentTask): Promise<AgentResult> {
        const bestAgent = this.findBestAgent(task);

        if (!bestAgent) {
            return {
                taskId: task.id,
                agentId: 'none',
                success: false,
                output: null,
                error: 'No suitable agent found',
                duration: 0,
            };
        }

        return this.executeTaskWithAgent(task, bestAgent);
    }

    private findBestAgent(task: AgentTask): Agent | null {
        let bestAgent: Agent | null = null;
        let bestScore = 0;

        for (const agent of this.agents.values()) {
            if (agent.status !== 'idle') continue;

            const score = this.calculateAgentScore(agent, task);
            if (score > bestScore) {
                bestScore = score;
                bestAgent = agent;
            }
        }

        return bestAgent;
    }

    private calculateAgentScore(agent: Agent, task: AgentTask): number {
        let score = 0;

        for (const capability of agent.capabilities) {
            if (task.type.toLowerCase().includes(capability.toLowerCase())) {
                score += 10;
            }
        }

        return score;
    }

    private async executeTaskWithAgent(task: AgentTask, agent: Agent): Promise<AgentResult> {
        agent.status = 'busy';
        const startTime = Date.now();

        this.emit('task:started', { taskId: task.id, agentId: agent.id });

        try {
            const result = await agent.execute(task);
            agent.status = 'idle';

            this.emit('task:completed', { taskId: task.id, agentId: agent.id, result });
            return result;
        } catch (error) {
            agent.status = 'error';

            const result: AgentResult = {
                taskId: task.id,
                agentId: agent.id,
                success: false,
                output: null,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime,
            };

            this.emit('task:failed', { taskId: task.id, agentId: agent.id, error });
            return result;
        }
    }

    // ========================================================================
    // COLLABORATIVE EXECUTION
    // ========================================================================

    async executeCollaboratively(
        mainTask: string,
        subtasks: AgentTask[]
    ): Promise<AgentResult[]> {
        const results: AgentResult[] = [];

        // Broadcast task to all agents
        this.broadcast('coordinator', `Starting collaborative task: ${mainTask}`);

        // Execute subtasks in parallel where possible
        const parallelGroups = this.groupParallelTasks(subtasks);

        for (const group of parallelGroups) {
            const groupResults = await Promise.all(
                group.map(task => this.routeTask(task))
            );
            results.push(...groupResults);

            // Share results between agents
            for (const result of groupResults) {
                if (result.success) {
                    this.broadcast(result.agentId, `Completed: ${JSON.stringify(result.output).substring(0, 100)}`);
                }
            }
        }

        this.emit('collaboration:completed', { mainTask, results });
        return results;
    }

    private groupParallelTasks(tasks: AgentTask[]): AgentTask[][] {
        // Simple grouping - in production, use dependency analysis
        const groups: AgentTask[][] = [];
        for (let i = 0; i < tasks.length; i += 3) {
            groups.push(tasks.slice(i, i + 3));
        }
        return groups;
    }

    // ========================================================================
    // AGENT COMMUNICATION
    // ========================================================================

    broadcast(from: string, content: string): void {
        const message: ConversationMessage = {
            from,
            to: 'all',
            content,
            timestamp: Date.now(),
        };

        this.conversation.push(message);
        this.emit('message:broadcast', message);
    }

    sendMessage(from: string, to: string, content: string): void {
        const message: ConversationMessage = {
            from,
            to,
            content,
            timestamp: Date.now(),
        };

        this.conversation.push(message);
        this.emit('message:sent', message);
    }

    getConversationHistory(): ConversationMessage[] {
        return [...this.conversation];
    }

    // ========================================================================
    // CONSENSUS & VOTING
    // ========================================================================

    async reachConsensus(
        question: string,
        voters: string[]
    ): Promise<{ decision: string; votes: Record<string, string> }> {
        const votes: Record<string, string> = {};

        for (const voterId of voters) {
            const agent = this.agents.get(voterId);
            if (agent) {
                // In production, each agent would provide their vote
                votes[voterId] = 'approve';
            }
        }

        // Simple majority
        const approvals = Object.values(votes).filter(v => v === 'approve').length;
        const decision = approvals > voters.length / 2 ? 'approved' : 'rejected';

        this.emit('consensus:reached', { question, decision, votes });

        return { decision, votes };
    }

    // ========================================================================
    // SPECIALIZED AGENTS
    // ========================================================================

    createCodeReviewAgent(): Agent {
        return {
            id: 'code-reviewer',
            name: 'Code Review Agent',
            role: 'Reviews code for quality, security, and best practices',
            capabilities: ['review', 'analyze', 'lint', 'security'],
            status: 'idle',
            execute: async (task) => ({
                taskId: task.id,
                agentId: 'code-reviewer',
                success: true,
                output: { issues: [], suggestions: [] },
                duration: 100,
            }),
        };
    }

    createTestingAgent(): Agent {
        return {
            id: 'tester',
            name: 'Testing Agent',
            role: 'Generates and runs tests',
            capabilities: ['test', 'unit', 'integration', 'e2e'],
            status: 'idle',
            execute: async (task) => ({
                taskId: task.id,
                agentId: 'tester',
                success: true,
                output: { passed: true, coverage: 85 },
                duration: 200,
            }),
        };
    }

    createDocumentationAgent(): Agent {
        return {
            id: 'documenter',
            name: 'Documentation Agent',
            role: 'Generates documentation',
            capabilities: ['document', 'explain', 'readme', 'api-docs'],
            status: 'idle',
            execute: async (task) => ({
                taskId: task.id,
                agentId: 'documenter',
                success: true,
                output: { documentation: '# Generated Docs' },
                duration: 150,
            }),
        };
    }
}

export const multiAgentOrchestrator = MultiAgentOrchestrator.getInstance();
