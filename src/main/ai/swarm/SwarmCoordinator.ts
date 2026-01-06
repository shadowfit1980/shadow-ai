/**
 * Multi-Agent Swarm Coordinator
 * 
 * Deploy fleets of sub-agents for parallel tasks,
 * orchestrating them like a symphony.
 */

import { EventEmitter } from 'events';

export interface SwarmAgent {
    id: string;
    name: string;
    role: AgentRole;
    status: 'idle' | 'working' | 'blocked' | 'completed' | 'failed';
    currentTask?: SwarmTask;
    capabilities: string[];
    performance: AgentPerformance;
}

export type AgentRole =
    | 'ui_specialist'
    | 'backend_specialist'
    | 'database_specialist'
    | 'testing_specialist'
    | 'documentation_specialist'
    | 'security_specialist'
    | 'devops_specialist'
    | 'generalist';

export interface SwarmTask {
    id: string;
    type: TaskType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    dependencies: string[];
    assignedTo?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
    input: any;
    output?: any;
    startTime?: Date;
    endTime?: Date;
    retries: number;
}

export type TaskType =
    | 'code_generation'
    | 'code_review'
    | 'testing'
    | 'documentation'
    | 'debugging'
    | 'refactoring'
    | 'deployment'
    | 'research';

export interface AgentPerformance {
    tasksCompleted: number;
    tasksFailed: number;
    averageTime: number;
    successRate: number;
    specialization: Record<string, number>; // Task type -> success rate
}

export interface SwarmConfig {
    maxAgents: number;
    taskTimeout: number;
    retryLimit: number;
    parallelTasks: number;
}

export interface SwarmOrchestration {
    id: string;
    name: string;
    goal: string;
    agents: SwarmAgent[];
    tasks: SwarmTask[];
    status: 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
    progress: number;
    startTime: Date;
    endTime?: Date;
}

const DEFAULT_CONFIG: SwarmConfig = {
    maxAgents: 8,
    taskTimeout: 60000, // 60 seconds
    retryLimit: 3,
    parallelTasks: 4,
};

export class SwarmCoordinator extends EventEmitter {
    private static instance: SwarmCoordinator;
    private agents: Map<string, SwarmAgent> = new Map();
    private orchestrations: Map<string, SwarmOrchestration> = new Map();
    private taskQueue: SwarmTask[] = [];
    private config: SwarmConfig = DEFAULT_CONFIG;
    private isRunning: boolean = false;

    private constructor() {
        super();
        this.initializeDefaultAgents();
    }

    static getInstance(): SwarmCoordinator {
        if (!SwarmCoordinator.instance) {
            SwarmCoordinator.instance = new SwarmCoordinator();
        }
        return SwarmCoordinator.instance;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    private initializeDefaultAgents(): void {
        const defaultAgents: Partial<SwarmAgent>[] = [
            { name: 'UI Builder', role: 'ui_specialist', capabilities: ['react', 'css', 'animations'] },
            { name: 'Backend Engineer', role: 'backend_specialist', capabilities: ['node', 'api', 'database'] },
            { name: 'Test Engineer', role: 'testing_specialist', capabilities: ['unit-tests', 'e2e', 'coverage'] },
            { name: 'Doc Writer', role: 'documentation_specialist', capabilities: ['jsdoc', 'readme', 'api-docs'] },
            { name: 'Security Auditor', role: 'security_specialist', capabilities: ['vulnerabilities', 'auth', 'encryption'] },
            { name: 'DevOps Lead', role: 'devops_specialist', capabilities: ['docker', 'ci-cd', 'deployment'] },
        ];

        for (const agentDef of defaultAgents) {
            this.spawnAgent(agentDef);
        }
    }

    /**
     * Spawn a new agent in the swarm
     */
    spawnAgent(config: Partial<SwarmAgent>): SwarmAgent {
        if (this.agents.size >= this.config.maxAgents) {
            throw new Error(`Maximum agents (${this.config.maxAgents}) reached`);
        }

        const agent: SwarmAgent = {
            id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: config.name || 'Unnamed Agent',
            role: config.role || 'generalist',
            status: 'idle',
            capabilities: config.capabilities || [],
            performance: {
                tasksCompleted: 0,
                tasksFailed: 0,
                averageTime: 0,
                successRate: 1,
                specialization: {},
            },
        };

        this.agents.set(agent.id, agent);
        this.emit('agent:spawned', agent);
        return agent;
    }

    // ========================================================================
    // ORCHESTRATION
    // ========================================================================

    /**
     * Create a new orchestration (complex multi-task operation)
     */
    createOrchestration(name: string, goal: string, tasks: Partial<SwarmTask>[]): SwarmOrchestration {
        const orchestration: SwarmOrchestration = {
            id: `orch_${Date.now()}`,
            name,
            goal,
            agents: [],
            tasks: tasks.map((t, i) => ({
                id: `task_${Date.now()}_${i}`,
                type: t.type || 'code_generation',
                priority: t.priority || 'medium',
                description: t.description || '',
                dependencies: t.dependencies || [],
                status: 'pending',
                input: t.input,
                retries: 0,
            })),
            status: 'planning',
            progress: 0,
            startTime: new Date(),
        };

        // Auto-assign agents based on task types
        this.assignAgentsToOrchestration(orchestration);

        this.orchestrations.set(orchestration.id, orchestration);
        this.emit('orchestration:created', orchestration);
        return orchestration;
    }

    /**
     * Assign best-fit agents to orchestration tasks
     */
    private assignAgentsToOrchestration(orchestration: SwarmOrchestration): void {
        const taskTypeToRole: Record<TaskType, AgentRole[]> = {
            code_generation: ['generalist', 'ui_specialist', 'backend_specialist'],
            code_review: ['security_specialist', 'generalist'],
            testing: ['testing_specialist', 'generalist'],
            documentation: ['documentation_specialist', 'generalist'],
            debugging: ['backend_specialist', 'generalist'],
            refactoring: ['generalist', 'backend_specialist'],
            deployment: ['devops_specialist', 'generalist'],
            research: ['generalist'],
        };

        const usedAgents = new Set<string>();

        for (const task of orchestration.tasks) {
            const preferredRoles = taskTypeToRole[task.type] || ['generalist'];

            // Find best available agent
            let bestAgent: SwarmAgent | null = null;

            for (const role of preferredRoles) {
                const available = Array.from(this.agents.values()).find(a =>
                    a.role === role &&
                    a.status === 'idle' &&
                    !usedAgents.has(a.id)
                );

                if (available) {
                    bestAgent = available;
                    break;
                }
            }

            if (bestAgent) {
                task.assignedTo = bestAgent.id;
                usedAgents.add(bestAgent.id);
                orchestration.agents.push(bestAgent);
            }
        }
    }

    /**
     * Execute an orchestration
     */
    async executeOrchestration(orchestrationId: string): Promise<void> {
        const orchestration = this.orchestrations.get(orchestrationId);
        if (!orchestration) throw new Error(`Orchestration ${orchestrationId} not found`);

        orchestration.status = 'executing';
        this.isRunning = true;
        this.emit('orchestration:started', orchestrationId);

        try {
            await this.runTaskGraph(orchestration);
            orchestration.status = 'completed';
            orchestration.endTime = new Date();
            orchestration.progress = 100;
        } catch (error: any) {
            orchestration.status = 'failed';
            this.emit('orchestration:failed', { id: orchestrationId, error: error.message });
        }

        this.isRunning = false;
        this.emit('orchestration:completed', orchestration);
    }

    /**
     * Run tasks respecting dependency graph
     */
    private async runTaskGraph(orchestration: SwarmOrchestration): Promise<void> {
        const completed = new Set<string>();
        const failed = new Set<string>();

        while (completed.size + failed.size < orchestration.tasks.length) {
            // Find runnable tasks (all dependencies met)
            const runnable = orchestration.tasks.filter(t =>
                t.status === 'pending' &&
                t.dependencies.every(d => completed.has(d))
            );

            if (runnable.length === 0) {
                // Check for blocked tasks
                const blocked = orchestration.tasks.filter(t =>
                    t.status === 'pending' &&
                    t.dependencies.some(d => failed.has(d))
                );

                if (blocked.length > 0) {
                    // Mark blocked tasks as failed
                    for (const task of blocked) {
                        task.status = 'blocked';
                        failed.add(task.id);
                    }
                } else {
                    // Deadlock or all done
                    break;
                }
            }

            // Execute runnable tasks in parallel (up to limit)
            const batch = runnable.slice(0, this.config.parallelTasks);
            const results = await Promise.allSettled(
                batch.map(task => this.executeTask(task))
            );

            for (let i = 0; i < results.length; i++) {
                const task = batch[i];
                if (results[i].status === 'fulfilled') {
                    task.status = 'completed';
                    completed.add(task.id);
                } else {
                    if (task.retries < this.config.retryLimit) {
                        task.retries++;
                        task.status = 'pending'; // Retry
                    } else {
                        task.status = 'failed';
                        failed.add(task.id);
                    }
                }
            }

            // Update progress
            orchestration.progress = Math.round(
                ((completed.size + failed.size) / orchestration.tasks.length) * 100
            );
            this.emit('orchestration:progress', { id: orchestration.id, progress: orchestration.progress });
        }
    }

    /**
     * Execute a single task
     */
    private async executeTask(task: SwarmTask): Promise<any> {
        task.status = 'in_progress';
        task.startTime = new Date();

        const agent = task.assignedTo ? this.agents.get(task.assignedTo) : null;
        if (agent) {
            agent.status = 'working';
            agent.currentTask = task;
        }

        this.emit('task:started', { taskId: task.id, agentId: agent?.id });

        try {
            // Simulate task execution (in real implementation, call actual AI)
            await new Promise(resolve => setTimeout(resolve, 1000));

            task.output = {
                success: true,
                generatedContent: `Result for ${task.type}: ${task.description}`,
            };

            if (agent) {
                agent.status = 'idle';
                agent.currentTask = undefined;
                agent.performance.tasksCompleted++;
                this.updateAgentPerformance(agent, task, true);
            }

            task.endTime = new Date();
            this.emit('task:completed', { taskId: task.id, output: task.output });
            return task.output;
        } catch (error: any) {
            if (agent) {
                agent.status = 'idle';
                agent.currentTask = undefined;
                agent.performance.tasksFailed++;
                this.updateAgentPerformance(agent, task, false);
            }

            task.endTime = new Date();
            this.emit('task:failed', { taskId: task.id, error: error.message });
            throw error;
        }
    }

    private updateAgentPerformance(agent: SwarmAgent, task: SwarmTask, success: boolean): void {
        const total = agent.performance.tasksCompleted + agent.performance.tasksFailed;
        agent.performance.successRate = agent.performance.tasksCompleted / total;

        // Update specialization
        const spec = agent.performance.specialization[task.type] || 0;
        agent.performance.specialization[task.type] =
            success ? Math.min(1, spec + 0.1) : Math.max(0, spec - 0.05);

        // Update average time
        if (task.startTime && task.endTime) {
            const duration = task.endTime.getTime() - task.startTime.getTime();
            const n = total;
            agent.performance.averageTime =
                (agent.performance.averageTime * (n - 1) + duration) / n;
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAgents(): SwarmAgent[] {
        return Array.from(this.agents.values());
    }

    getOrchestration(id: string): SwarmOrchestration | undefined {
        return this.orchestrations.get(id);
    }

    getActiveOrchestrations(): SwarmOrchestration[] {
        return Array.from(this.orchestrations.values())
            .filter(o => o.status === 'executing' || o.status === 'planning');
    }

    getIdleAgents(): SwarmAgent[] {
        return Array.from(this.agents.values()).filter(a => a.status === 'idle');
    }

    getSwarmStats(): { agents: number; idle: number; working: number; orchestrations: number } {
        const agents = this.getAgents();
        return {
            agents: agents.length,
            idle: agents.filter(a => a.status === 'idle').length,
            working: agents.filter(a => a.status === 'working').length,
            orchestrations: this.orchestrations.size,
        };
    }
}

export const swarmCoordinator = SwarmCoordinator.getInstance();
