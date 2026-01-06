import { ShadowArchitect } from './ShadowArchitect';
import { ShadowBuilder } from './ShadowBuilder';
import { ShadowDebugger } from './ShadowDebugger';
import { ShadowUX } from './ShadowUX';
import { ShadowCommunicator } from './ShadowCommunicator';
import { BaseAgent } from './BaseAgent';
import { COMMANDS } from '../types';
import { TaskQueue, AgentTask, TaskPriority } from './TaskQueue';

/**
 * Agent Coordinator
 * Orchestrates multiple agents to work together on complex tasks
 */
export class AgentCoordinator {
    private static instance: AgentCoordinator;
    private agents: Map<string, BaseAgent> = new Map();
    private taskQueue: TaskQueue;

    private constructor() {
        this.initializeAgents();
        this.taskQueue = TaskQueue.getInstance();
        this.setupTaskHandlers();
    }

    static getInstance(): AgentCoordinator {
        if (!AgentCoordinator.instance) {
            AgentCoordinator.instance = new AgentCoordinator();
        }
        return AgentCoordinator.instance;
    }

    /**
     * Setup task queue event handlers
     */
    private setupTaskHandlers(): void {
        this.taskQueue.on('task:started', (task: AgentTask) => {
            console.log(`Task ${task.id} started: ${task.command}`);
            this.executeTaskAsync(task);
        });

        this.taskQueue.on('task:completed', (task: AgentTask) => {
            console.log(`Task ${task.id} completed`);
        });

        this.taskQueue.on('task:failed', (task: AgentTask) => {
            console.error(`Task ${task.id} failed:`, task.error);
        });
    }

    /**
     * Initialize all agents
     */
    private initializeAgents(): void {
        this.agents.set('architect', new ShadowArchitect());
        this.agents.set('builder', new ShadowBuilder());
        this.agents.set('debugger', new ShadowDebugger());
        this.agents.set('ux', new ShadowUX());
        this.agents.set('communicator', new ShadowCommunicator());
    }

    /**
     * Queue a task for execution
     */
    queueTask(command: string, params: any, priority: TaskPriority = 'normal'): string {
        const cmd = COMMANDS.find((c) => c.name === command);

        if (!cmd) {
            throw new Error(`Unknown command: ${command}`);
        }

        const taskId = this.taskQueue.addTask(cmd.handler, command, params, priority);
        return taskId;
    }

    /**
     * Execute a task asynchronously (called by task queue)
     */
    private async executeTaskAsync(task: AgentTask): Promise<void> {
        try {
            // Update initial progress
            this.taskQueue.updateTaskProgress(task.id, 10);

            const result = await this.executeCommand(task.command, task.params, task.id);

            // Update completion progress
            this.taskQueue.updateTaskProgress(task.id, 100);
            this.taskQueue.completeTask(task.id, result);
        } catch (error: any) {
            this.taskQueue.failTask(task.id, error.message || 'Unknown error');
        }
    }

    /**
     * Get task status
     */
    getTaskStatus(taskId: string): AgentTask | undefined {
        return this.taskQueue.getTask(taskId);
    }

    /**
     * Cancel a task
     */
    cancelTask(taskId: string): boolean {
        return this.taskQueue.cancelTask(taskId);
    }

    /**
     * Get queue statistics
     */
    getQueueStats() {
        return this.taskQueue.getStats();
    }

    /**
     * Get all tasks
     */
    getAllTasks(): AgentTask[] {
        return this.taskQueue.getAllTasks();
    }

    /**
     * Execute a command (legacy direct execution - now called by task queue)
     */
    async executeCommand(command: string, params: any, taskId?: string): Promise<any> {
        const cmd = COMMANDS.find((c) => c.name === command);

        if (!cmd) {
            throw new Error(`Unknown command: ${command}`);
        }

        const agent = this.agents.get(cmd.handler);

        if (!agent) {
            throw new Error(`Agent not found for command: ${command}`);
        }

        console.log(`Executing ${command} with ${agent.getName()}`);

        // Execute based on command type
        switch (command) {
            case '/build':
                return await this.handleBuild(params, taskId);
            case '/debug':
                return await this.handleDebug(params, taskId);
            case '/design':
                return await this.handleDesign(params, taskId);
            case '/deploy':
                return await this.handleDeploy(params, taskId);
            case '/evolve':
                return await this.handleEvolve(params, taskId);
            case '/analyze':
                return await this.handleAnalyze(params, taskId);
            default:
                return await agent.execute(params.task || params, params.context);
        }
    }

    /**
     * Handle /build command - multi-agent workflow
     */
    private async handleBuild(params: any, taskId?: string): Promise<any> {
        const results: any = {
            stages: [],
        };

        // Stage 1: Architect designs the system
        console.log('Stage 1: Architecture design');
        if (taskId) this.taskQueue.updateTaskProgress(taskId, 25);

        const architect = this.agents.get('architect') as ShadowArchitect;
        const architectResult = await architect.execute(
            `Design a ${params.type || 'web application'} with the following requirements: ${params.description || params.task}`,
            params
        );
        results.stages.push({ stage: 'architecture', result: architectResult });

        // Stage 2: UX designs the interface
        console.log('Stage 2: UX design');
        if (taskId) this.taskQueue.updateTaskProgress(taskId, 50);

        const ux = this.agents.get('ux') as ShadowUX;
        const uxResult = await ux.execute(
            `Design a beautiful, modern UI for: ${params.description || params.task}`,
            params
        );
        results.stages.push({ stage: 'design', result: uxResult });

        // Stage 3: Builder creates the code
        console.log('Stage 3: Building code');
        if (taskId) this.taskQueue.updateTaskProgress(taskId, 75);

        const builder = this.agents.get('builder') as ShadowBuilder;
        const buildResult = await builder.execute(
            `Build a complete ${params.type || 'application'} based on this architecture and design. Requirements: ${params.description || params.task}`,
            params
        );
        results.stages.push({ stage: 'build', result: buildResult });

        // Stage 4: Debugger reviews the code
        console.log('Stage 4: Code review');
        if (taskId) this.taskQueue.updateTaskProgress(taskId, 90);

        const debuggerAgent = this.agents.get('debugger') as ShadowDebugger;
        const debugResult = await debuggerAgent.execute(
            'Review the generated code for bugs, security issues, and optimization opportunities',
            { code: buildResult.output }
        );
        results.stages.push({ stage: 'review', result: debugResult });

        return results;
    }

    /**
     * Handle /debug command
     */
    private async handleDebug(params: any, taskId?: string): Promise<any> {
        const debuggerAgent = this.agents.get('debugger') as ShadowDebugger;
        return await debuggerAgent.execute(params.task || params.code, params);
    }

    /**
     * Handle /design command
     */
    private async handleDesign(params: any, taskId?: string): Promise<any> {
        const ux = this.agents.get('ux') as ShadowUX;
        return await ux.execute(params.task || params.description, params);
    }

    /**
     * Handle /deploy command
     */
    private async handleDeploy(params: any, taskId?: string): Promise<any> {
        const builder = this.agents.get('builder') as ShadowBuilder;
        return await builder.execute(`Deploy the project to ${params.platform || 'Vercel'}`, params);
    }

    /**
     * Handle /evolve command
     */
    private async handleEvolve(params: any, taskId?: string): Promise<any> {
        const architect = this.agents.get('architect') as ShadowArchitect;
        return await architect.execute(
            'Analyze the current system and suggest improvements for better performance, code quality, and user experience',
            params
        );
    }

    /**
     * Handle /analyze command
     */
    private async handleAnalyze(params: any, taskId?: string): Promise<any> {
        const architect = this.agents.get('architect') as ShadowArchitect;
        return await architect.execute(`Analyze: ${params.task || params.target}`, params);
    }

    /**
     * Get all agents
     */
    getAgents(): BaseAgent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get specific agent
     */
    getAgent(type: string): BaseAgent | undefined {
        return this.agents.get(type);
    }
}
