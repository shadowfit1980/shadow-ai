/**
 * Multi-Agent Swarm Orchestrator
 * 
 * Spawns and coordinates specialized sub-agents (Planner, Coder, Tester, Deployer)
 * that collaborate in parallel swarms for complex tasks.
 */

import { EventEmitter } from 'events';

export interface SwarmAgent {
    id: string;
    name: string;
    role: AgentRole;
    status: AgentStatus;
    capabilities: string[];
    currentTask?: string;
    workload: number;
    performance: AgentPerformance;
    createdAt: Date;
}

export type AgentRole =
    | 'planner'
    | 'coder'
    | 'tester'
    | 'deployer'
    | 'reviewer'
    | 'documenter'
    | 'security'
    | 'optimizer'
    | 'designer'
    | 'debugger';

export type AgentStatus = 'idle' | 'working' | 'blocked' | 'completed' | 'failed';

export interface AgentPerformance {
    tasksCompleted: number;
    successRate: number;
    avgExecutionTime: number;
    specializations: string[];
}

export interface SwarmTask {
    id: string;
    description: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'epic';
    requiredRoles: AgentRole[];
    subtasks: SwarmSubtask[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    finalResult?: any;
    createdAt: Date;
    completedAt?: Date;
}

export interface SwarmSubtask {
    id: string;
    parentId: string;
    description: string;
    assignedAgent?: string;
    role: AgentRole;
    dependencies: string[];
    status: AgentStatus;
    result?: any;
    startedAt?: Date;
    completedAt?: Date;
}

export interface SwarmConfig {
    maxAgents: number;
    autoScale: boolean;
    parallelism: number;
    timeout: number;
    retryOnFailure: boolean;
    learningEnabled: boolean;
}

export class MultiAgentSwarmOrchestrator extends EventEmitter {
    private static instance: MultiAgentSwarmOrchestrator;
    private agents: Map<string, SwarmAgent> = new Map();
    private tasks: Map<string, SwarmTask> = new Map();
    private config: SwarmConfig = {
        maxAgents: 10,
        autoScale: true,
        parallelism: 4,
        timeout: 300000,
        retryOnFailure: true,
        learningEnabled: true,
    };

    private constructor() {
        super();
        this.initializeDefaultAgents();
    }

    static getInstance(): MultiAgentSwarmOrchestrator {
        if (!MultiAgentSwarmOrchestrator.instance) {
            MultiAgentSwarmOrchestrator.instance = new MultiAgentSwarmOrchestrator();
        }
        return MultiAgentSwarmOrchestrator.instance;
    }

    private initializeDefaultAgents(): void {
        const defaultRoles: { role: AgentRole; name: string; capabilities: string[] }[] = [
            { role: 'planner', name: 'Architect', capabilities: ['task breakdown', 'dependency analysis', 'estimation'] },
            { role: 'coder', name: 'Developer', capabilities: ['code generation', 'refactoring', 'implementation'] },
            { role: 'tester', name: 'QA Specialist', capabilities: ['test generation', 'coverage analysis', 'bug detection'] },
            { role: 'deployer', name: 'DevOps', capabilities: ['deployment', 'configuration', 'infrastructure'] },
            { role: 'reviewer', name: 'Code Reviewer', capabilities: ['code review', 'best practices', 'optimization'] },
            { role: 'security', name: 'Security Guard', capabilities: ['vulnerability scan', 'audit', 'encryption'] },
        ];

        for (const config of defaultRoles) {
            this.spawnAgent(config.role, config.name, config.capabilities);
        }
    }

    // ========================================================================
    // AGENT MANAGEMENT
    // ========================================================================

    spawnAgent(role: AgentRole, name?: string, capabilities?: string[]): SwarmAgent {
        const agent: SwarmAgent = {
            id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: name || `${role.charAt(0).toUpperCase() + role.slice(1)} Agent`,
            role,
            status: 'idle',
            capabilities: capabilities || this.getDefaultCapabilities(role),
            workload: 0,
            performance: {
                tasksCompleted: 0,
                successRate: 1.0,
                avgExecutionTime: 0,
                specializations: [],
            },
            createdAt: new Date(),
        };

        this.agents.set(agent.id, agent);
        this.emit('agent:spawned', agent);
        return agent;
    }

    private getDefaultCapabilities(role: AgentRole): string[] {
        const capMap: Record<AgentRole, string[]> = {
            planner: ['task decomposition', 'dependency graph', 'effort estimation'],
            coder: ['code generation', 'implementation', 'refactoring'],
            tester: ['unit tests', 'integration tests', 'coverage'],
            deployer: ['CI/CD', 'containerization', 'cloud deployment'],
            reviewer: ['code review', 'style check', 'optimization'],
            documenter: ['documentation', 'API specs', 'tutorials'],
            security: ['vulnerability scan', 'penetration test', 'compliance'],
            optimizer: ['performance tuning', 'bottleneck detection', 'caching'],
            designer: ['UI/UX', 'wireframes', 'component design'],
            debugger: ['bug hunting', 'stack traces', 'root cause analysis'],
        };
        return capMap[role] || [];
    }

    retireAgent(agentId: string): boolean {
        const agent = this.agents.get(agentId);
        if (!agent || agent.status === 'working') return false;

        this.agents.delete(agentId);
        this.emit('agent:retired', agentId);
        return true;
    }

    getAgent(id: string): SwarmAgent | undefined {
        return this.agents.get(id);
    }

    getAgentsByRole(role: AgentRole): SwarmAgent[] {
        return Array.from(this.agents.values()).filter(a => a.role === role);
    }

    // ========================================================================
    // TASK ORCHESTRATION
    // ========================================================================

    async executeSwarmTask(description: string, options?: { roles?: AgentRole[] }): Promise<SwarmTask> {
        const task = this.createTask(description, options?.roles);
        this.tasks.set(task.id, task);

        // Analyze and decompose task
        const subtasks = this.decomposeTask(task);
        task.subtasks = subtasks;

        this.emit('task:started', task);

        // Execute subtasks in parallel where possible
        await this.executeSubtasks(task);

        task.status = task.subtasks.every(s => s.status === 'completed') ? 'completed' : 'failed';
        task.completedAt = new Date();

        this.emit('task:completed', task);
        return task;
    }

    private createTask(description: string, roles?: AgentRole[]): SwarmTask {
        return {
            id: `task_${Date.now()}`,
            description,
            complexity: this.assessComplexity(description),
            requiredRoles: roles || ['planner', 'coder', 'tester'],
            subtasks: [],
            status: 'pending',
            createdAt: new Date(),
        };
    }

    private assessComplexity(description: string): SwarmTask['complexity'] {
        const lower = description.toLowerCase();
        const words = lower.split(/\s+/);

        if (words.length > 50 || lower.includes('full-stack') || lower.includes('complete')) {
            return 'epic';
        }
        if (words.length > 20 || lower.includes('integrate') || lower.includes('refactor')) {
            return 'complex';
        }
        if (words.length > 10) {
            return 'moderate';
        }
        return 'simple';
    }

    private decomposeTask(task: SwarmTask): SwarmSubtask[] {
        const subtasks: SwarmSubtask[] = [];

        // Planning phase
        subtasks.push({
            id: `${task.id}_plan`,
            parentId: task.id,
            description: `Analyze and plan: ${task.description}`,
            role: 'planner',
            dependencies: [],
            status: 'idle',
        });

        // Implementation phase
        subtasks.push({
            id: `${task.id}_code`,
            parentId: task.id,
            description: `Implement: ${task.description}`,
            role: 'coder',
            dependencies: [`${task.id}_plan`],
            status: 'idle',
        });

        // Testing phase
        subtasks.push({
            id: `${task.id}_test`,
            parentId: task.id,
            description: `Test: ${task.description}`,
            role: 'tester',
            dependencies: [`${task.id}_code`],
            status: 'idle',
        });

        // Review phase
        subtasks.push({
            id: `${task.id}_review`,
            parentId: task.id,
            description: `Review: ${task.description}`,
            role: 'reviewer',
            dependencies: [`${task.id}_code`],
            status: 'idle',
        });

        return subtasks;
    }

    private async executeSubtasks(task: SwarmTask): Promise<void> {
        const completed = new Set<string>();

        while (completed.size < task.subtasks.length) {
            const ready = task.subtasks.filter(s =>
                s.status === 'idle' &&
                s.dependencies.every(d => completed.has(d))
            );

            if (ready.length === 0 && completed.size < task.subtasks.length) {
                // Check for blocked tasks
                const hasWorking = task.subtasks.some(s => s.status === 'working');
                if (!hasWorking) break; // Deadlock
                await new Promise(r => setTimeout(r, 100));
                continue;
            }

            // Execute ready subtasks in parallel
            await Promise.all(ready.map(async subtask => {
                subtask.status = 'working';
                subtask.startedAt = new Date();

                const agent = this.findAvailableAgent(subtask.role);
                if (agent) {
                    subtask.assignedAgent = agent.id;
                    agent.status = 'working';
                    agent.currentTask = subtask.id;
                    agent.workload++;

                    // Simulate work
                    await this.simulateWork(subtask, agent);

                    agent.status = 'idle';
                    agent.currentTask = undefined;
                    agent.performance.tasksCompleted++;
                }

                subtask.status = 'completed';
                subtask.completedAt = new Date();
                completed.add(subtask.id);

                this.emit('subtask:completed', subtask);
            }));
        }
    }

    private findAvailableAgent(role: AgentRole): SwarmAgent | undefined {
        const agents = this.getAgentsByRole(role);
        return agents.find(a => a.status === 'idle') || agents[0];
    }

    private async simulateWork(subtask: SwarmSubtask, agent: SwarmAgent): Promise<void> {
        // Simulate execution time based on role
        const baseTimes: Record<AgentRole, number> = {
            planner: 500,
            coder: 1000,
            tester: 800,
            deployer: 600,
            reviewer: 400,
            documenter: 300,
            security: 700,
            optimizer: 500,
            designer: 600,
            debugger: 800,
        };

        const time = baseTimes[agent.role] || 500;
        await new Promise(r => setTimeout(r, time));

        subtask.result = {
            success: true,
            output: `Completed by ${agent.name}`,
            duration: time,
        };
    }

    // ========================================================================
    // SWARM INTELLIGENCE
    // ========================================================================

    async collaborativeSolve(problem: string): Promise<any> {
        // Get insights from all agent types
        const insights: Record<AgentRole, string> = {} as any;

        for (const role of ['planner', 'coder', 'tester', 'security'] as AgentRole[]) {
            const agent = this.findAvailableAgent(role);
            if (agent) {
                insights[role] = this.getAgentPerspective(problem, role);
            }
        }

        // Synthesize solution
        return {
            problem,
            insights,
            consensus: this.buildConsensus(insights),
            recommendedApproach: this.recommendApproach(insights),
        };
    }

    private getAgentPerspective(problem: string, role: AgentRole): string {
        const perspectives: Record<AgentRole, (p: string) => string> = {
            planner: p => `Break down "${p}" into phases with clear milestones`,
            coder: p => `Implement "${p}" using modular, testable components`,
            tester: p => `Ensure "${p}" has comprehensive test coverage`,
            security: p => `Audit "${p}" for vulnerabilities and compliance`,
            deployer: p => `Deploy "${p}" with CI/CD and monitoring`,
            reviewer: p => `Review "${p}" for code quality and best practices`,
            documenter: p => `Document "${p}" with clear API specs and examples`,
            optimizer: p => `Optimize "${p}" for performance and efficiency`,
            designer: p => `Design "${p}" with intuitive UX and accessibility`,
            debugger: p => `Debug "${p}" with thorough error handling`,
        };
        return perspectives[role]?.(problem) || problem;
    }

    private buildConsensus(insights: Record<AgentRole, string>): string {
        return `Unified approach combining: ${Object.keys(insights).join(', ')} perspectives`;
    }

    private recommendApproach(insights: Record<AgentRole, string>): string[] {
        return [
            '1. Start with thorough planning and task breakdown',
            '2. Implement with modular architecture',
            '3. Add comprehensive testing',
            '4. Security audit before deployment',
            '5. Document and deploy with monitoring',
        ];
    }

    // ========================================================================
    // QUERIES & STATS
    // ========================================================================

    getAllAgents(): SwarmAgent[] {
        return Array.from(this.agents.values());
    }

    getTask(id: string): SwarmTask | undefined {
        return this.tasks.get(id);
    }

    getAllTasks(): SwarmTask[] {
        return Array.from(this.tasks.values());
    }

    getConfig(): SwarmConfig {
        return { ...this.config };
    }

    updateConfig(updates: Partial<SwarmConfig>): void {
        Object.assign(this.config, updates);
        this.emit('config:updated', this.config);
    }

    getStats(): {
        totalAgents: number;
        agentsByRole: Record<AgentRole, number>;
        totalTasks: number;
        completedTasks: number;
        avgCompletionTime: number;
    } {
        const agents = Array.from(this.agents.values());
        const tasks = Array.from(this.tasks.values());

        const agentsByRole: Record<string, number> = {};
        for (const agent of agents) {
            agentsByRole[agent.role] = (agentsByRole[agent.role] || 0) + 1;
        }

        const completedTasks = tasks.filter(t => t.status === 'completed');
        const avgTime = completedTasks.length > 0
            ? completedTasks.reduce((sum, t) => {
                const duration = t.completedAt && t.createdAt
                    ? t.completedAt.getTime() - t.createdAt.getTime()
                    : 0;
                return sum + duration;
            }, 0) / completedTasks.length
            : 0;

        return {
            totalAgents: agents.length,
            agentsByRole: agentsByRole as Record<AgentRole, number>,
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            avgCompletionTime: avgTime,
        };
    }
}

export const multiAgentSwarmOrchestrator = MultiAgentSwarmOrchestrator.getInstance();
