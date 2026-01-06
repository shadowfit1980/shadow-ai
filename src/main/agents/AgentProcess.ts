/**
 * AgentProcess - Worker Thread Agent Executor
 * 
 * Provides true parallel agent execution:
 * - Spawns agents in separate worker threads
 * - Manages agent lifecycle
 * - Coordinates with MessageBus for communication
 * - Resource monitoring and limits
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { EventEmitter } from 'events';
import { messageBus, MessageBus, Message } from './MessageBus';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentConfig {
    id: string;
    name: string;
    type: string;
    /** Path to worker script */
    scriptPath?: string;
    /** Inline worker code (if no scriptPath) */
    code?: string;
    /** Environment variables for worker */
    env?: Record<string, string>;
    /** Resource limits */
    limits?: {
        maxMemoryMB?: number;
        maxCPUPercent?: number;
        timeout?: number;
    };
    /** Capabilities this agent provides */
    capabilities: string[];
    /** Priority for task assignment */
    priority: number;
}

export interface AgentInstance {
    config: AgentConfig;
    worker: Worker | null;
    status: 'idle' | 'busy' | 'error' | 'terminated';
    currentTask?: string;
    startedAt: Date;
    tasksCompleted: number;
    tasksFailed: number;
    memoryUsage: number;
    lastHeartbeat: Date;
}

export interface TaskAssignment {
    taskId: string;
    agentId: string;
    task: any;
    assignedAt: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
}

// ============================================================================
// DEFAULT AGENT SCRIPT
// ============================================================================

const DEFAULT_AGENT_SCRIPT = `
const { parentPort, workerData } = require('worker_threads');

const agentId = workerData.agentId;
const agentConfig = workerData.config;

console.log('[Worker:' + agentId + '] Started');

// Handle incoming messages
parentPort.on('message', async (msg) => {
    if (msg.type === 'task') {
        try {
            // Process task
            const result = await processTask(msg.task);
            parentPort.postMessage({
                type: 'taskComplete',
                taskId: msg.taskId,
                result
            });
        } catch (error) {
            parentPort.postMessage({
                type: 'taskError',
                taskId: msg.taskId,
                error: error.message
            });
        }
    } else if (msg.type === 'ping') {
        parentPort.postMessage({ type: 'pong', timestamp: Date.now() });
    } else if (msg.type === 'shutdown') {
        console.log('[Worker:' + agentId + '] Shutting down');
        process.exit(0);
    }
});

async function processTask(task) {
    // Default task processor - override in custom agents
    console.log('[Worker:' + agentId + '] Processing task:', task.name);
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
        agentId,
        taskName: task.name,
        processed: true,
        timestamp: new Date().toISOString()
    };
}

// Send ready signal
parentPort.postMessage({ type: 'ready', agentId });
`;

// ============================================================================
// AGENT PROCESS MANAGER
// ============================================================================

export class AgentProcessManager extends EventEmitter {
    private agents: Map<string, AgentInstance> = new Map();
    private taskQueue: TaskAssignment[] = [];
    private pendingTasks: Map<string, {
        resolve: (result: any) => void;
        reject: (error: Error) => void;
    }> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private tempDir: string;

    constructor(private bus: MessageBus = messageBus) {
        super();
        this.tempDir = path.join(os.tmpdir(), 'shadow-ai-agents');
        this.startHeartbeat();
        console.log('[AgentProcessManager] Initialized');
    }

    /**
     * Spawn a new agent worker
     */
    async spawn(config: AgentConfig): Promise<AgentInstance> {
        // Check if already exists
        if (this.agents.has(config.id)) {
            throw new Error(`Agent ${config.id} already exists`);
        }

        // Ensure temp directory exists
        await fs.mkdir(this.tempDir, { recursive: true });

        // Prepare worker script
        let scriptPath = config.scriptPath;
        if (!scriptPath && config.code) {
            // Write inline code to temp file
            scriptPath = path.join(this.tempDir, `agent-${config.id}.js`);
            await fs.writeFile(scriptPath, config.code);
        } else if (!scriptPath) {
            // Use default script
            scriptPath = path.join(this.tempDir, `agent-${config.id}.js`);
            await fs.writeFile(scriptPath, DEFAULT_AGENT_SCRIPT);
        }

        // Create worker
        const worker = new Worker(scriptPath, {
            workerData: {
                agentId: config.id,
                config
            },
            env: {
                ...process.env,
                ...config.env
            },
            resourceLimits: config.limits?.maxMemoryMB ? {
                maxOldGenerationSizeMb: config.limits.maxMemoryMB,
                maxYoungGenerationSizeMb: config.limits.maxMemoryMB / 4
            } : undefined
        });

        const instance: AgentInstance = {
            config,
            worker,
            status: 'idle',
            startedAt: new Date(),
            tasksCompleted: 0,
            tasksFailed: 0,
            memoryUsage: 0,
            lastHeartbeat: new Date()
        };

        // Set up worker event handlers
        this.setupWorkerHandlers(instance);

        this.agents.set(config.id, instance);
        this.bus.registerAgent(config.id, worker);

        this.emit('agentSpawned', { agentId: config.id });
        console.log(`[AgentProcessManager] Spawned agent: ${config.id}`);

        return instance;
    }

    /**
     * Set up event handlers for worker
     */
    private setupWorkerHandlers(instance: AgentInstance): void {
        const worker = instance.worker!;
        const agentId = instance.config.id;

        worker.on('message', (msg) => {
            instance.lastHeartbeat = new Date();

            if (msg.type === 'ready') {
                console.log(`[AgentProcessManager] Agent ${agentId} is ready`);
                this.emit('agentReady', { agentId });
            } else if (msg.type === 'taskComplete') {
                instance.status = 'idle';
                instance.tasksCompleted++;
                instance.currentTask = undefined;

                const pending = this.pendingTasks.get(msg.taskId);
                if (pending) {
                    pending.resolve(msg.result);
                    this.pendingTasks.delete(msg.taskId);
                }

                this.emit('taskComplete', { agentId, taskId: msg.taskId, result: msg.result });
                this.processQueue();
            } else if (msg.type === 'taskError') {
                instance.status = 'error';
                instance.tasksFailed++;
                instance.currentTask = undefined;

                const pending = this.pendingTasks.get(msg.taskId);
                if (pending) {
                    pending.reject(new Error(msg.error));
                    this.pendingTasks.delete(msg.taskId);
                }

                this.emit('taskError', { agentId, taskId: msg.taskId, error: msg.error });

                // Reset to idle after error
                setTimeout(() => {
                    instance.status = 'idle';
                    this.processQueue();
                }, 1000);
            } else if (msg.type === 'pong') {
                instance.lastHeartbeat = new Date();
            }
        });

        worker.on('error', (error) => {
            console.error(`[AgentProcessManager] Worker error for ${agentId}:`, error);
            instance.status = 'error';
            this.emit('agentError', { agentId, error });
        });

        worker.on('exit', (code) => {
            console.log(`[AgentProcessManager] Agent ${agentId} exited with code ${code}`);
            instance.status = 'terminated';
            instance.worker = null;
            this.emit('agentExit', { agentId, code });
        });
    }

    /**
     * Assign a task to an agent
     */
    async assignTask(agentId: string, task: any): Promise<any> {
        const instance = this.agents.get(agentId);
        if (!instance) {
            throw new Error(`Agent ${agentId} not found`);
        }

        if (instance.status !== 'idle') {
            // Queue the task
            return this.queueTask(agentId, task);
        }

        return this.executeTask(instance, task);
    }

    /**
     * Execute a task on an agent
     */
    private async executeTask(instance: AgentInstance, task: any): Promise<any> {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        instance.status = 'busy';
        instance.currentTask = taskId;

        return new Promise((resolve, reject) => {
            const timeout = instance.config.limits?.timeout || 300000;

            const timer = setTimeout(() => {
                this.pendingTasks.delete(taskId);
                instance.status = 'error';
                reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
            }, timeout);

            this.pendingTasks.set(taskId, {
                resolve: (result) => {
                    clearTimeout(timer);
                    resolve(result);
                },
                reject: (error) => {
                    clearTimeout(timer);
                    reject(error);
                }
            });

            // Send task to worker
            instance.worker?.postMessage({
                type: 'task',
                taskId,
                task
            });
        });
    }

    /**
     * Queue a task for later execution
     */
    private async queueTask(agentId: string, task: any): Promise<any> {
        const assignment: TaskAssignment = {
            taskId: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            agentId,
            task,
            assignedAt: new Date()
        };

        return new Promise((resolve, reject) => {
            this.taskQueue.push(assignment);
            this.pendingTasks.set(assignment.taskId, { resolve, reject });
            this.emit('taskQueued', { agentId, taskId: assignment.taskId });
        });
    }

    /**
     * Process queued tasks
     */
    private processQueue(): void {
        const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle');

        for (const agent of idleAgents) {
            const tasks = this.taskQueue.filter(t => t.agentId === agent.config.id);
            if (tasks.length > 0) {
                const task = tasks[0];
                this.taskQueue = this.taskQueue.filter(t => t.taskId !== task.taskId);

                this.executeTask(agent, task.task)
                    .then(result => {
                        const pending = this.pendingTasks.get(task.taskId);
                        if (pending) {
                            pending.resolve(result);
                            this.pendingTasks.delete(task.taskId);
                        }
                    })
                    .catch(error => {
                        const pending = this.pendingTasks.get(task.taskId);
                        if (pending) {
                            pending.reject(error);
                            this.pendingTasks.delete(task.taskId);
                        }
                    });
            }
        }
    }

    /**
     * Find best agent for a capability
     */
    findAgentForCapability(capability: string): AgentInstance | null {
        const candidates = Array.from(this.agents.values())
            .filter(a =>
                a.status === 'idle' &&
                a.config.capabilities.includes(capability)
            )
            .sort((a, b) => b.config.priority - a.config.priority);

        return candidates[0] || null;
    }

    /**
     * Dispatch task to best available agent
     */
    async dispatch(capability: string, task: any): Promise<any> {
        const agent = this.findAgentForCapability(capability);
        if (!agent) {
            throw new Error(`No agent available for capability: ${capability}`);
        }

        return this.assignTask(agent.config.id, task);
    }

    /**
     * Send heartbeat pings to all agents
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            for (const [id, instance] of this.agents) {
                if (instance.worker && instance.status !== 'terminated') {
                    instance.worker.postMessage({ type: 'ping' });

                    // Check for stale agents
                    const stalePeriod = 30000;
                    if (Date.now() - instance.lastHeartbeat.getTime() > stalePeriod) {
                        console.warn(`[AgentProcessManager] Agent ${id} is unresponsive`);
                        this.emit('agentUnresponsive', { agentId: id });
                    }
                }
            }
        }, 10000);
    }

    /**
     * Terminate an agent
     */
    async terminate(agentId: string): Promise<void> {
        const instance = this.agents.get(agentId);
        if (!instance) return;

        if (instance.worker) {
            instance.worker.postMessage({ type: 'shutdown' });

            // Force terminate after timeout
            setTimeout(() => {
                if (instance.worker) {
                    instance.worker.terminate();
                }
            }, 5000);
        }

        this.bus.unregisterAgent(agentId);
        this.agents.delete(agentId);
        this.emit('agentTerminated', { agentId });
    }

    /**
     * Terminate all agents
     */
    async terminateAll(): Promise<void> {
        const ids = Array.from(this.agents.keys());
        await Promise.all(ids.map(id => this.terminate(id)));

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }

    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentInstance | undefined {
        return this.agents.get(agentId);
    }

    /**
     * Get all agents
     */
    getAllAgents(): AgentInstance[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalAgents: number;
        idleAgents: number;
        busyAgents: number;
        queuedTasks: number;
        totalTasksCompleted: number;
        totalTasksFailed: number;
    } {
        const agents = Array.from(this.agents.values());
        return {
            totalAgents: agents.length,
            idleAgents: agents.filter(a => a.status === 'idle').length,
            busyAgents: agents.filter(a => a.status === 'busy').length,
            queuedTasks: this.taskQueue.length,
            totalTasksCompleted: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
            totalTasksFailed: agents.reduce((sum, a) => sum + a.tasksFailed, 0)
        };
    }
}

// Singleton
export const agentProcessManager = new AgentProcessManager();
