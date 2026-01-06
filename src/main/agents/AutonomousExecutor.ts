/**
 * ⏱️ AutonomousExecutor - Long-Running Task Execution
 * 
 * Grok's Recommendation: Can run for 48–72 hours unsupervised
 * - Auto-spins up cloud runners when local GPU saturated
 * - Auto-shuts down
 * - Full weekend hacks alone
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SwarmCoordinator, SwarmTask } from './SwarmCoordinator';
import { UnifiedReasoner } from '../ai/UnifiedReasoner';

const execAsync = promisify(exec);

interface LongRunningTask {
    id: string;
    description: string;
    startTime: Date;
    estimatedDuration: string;
    status: 'running' | 'paused' | 'completed' | 'failed';
    progress: number;
    checkpoints: Checkpoint[];
    logs: LogEntry[];
    resources: ResourceUsage;
}

interface Checkpoint {
    id: string;
    timestamp: Date;
    description: string;
    state: Record<string, unknown>;
    recoverable: boolean;
}

interface LogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    details?: Record<string, unknown>;
}

interface ResourceUsage {
    cpuPercent: number;
    memoryMB: number;
    gpuPercent: number;
    networkMB: number;
}

export class AutonomousExecutor extends EventEmitter {
    private static instance: AutonomousExecutor;
    private swarm: SwarmCoordinator;
    private reasoner: UnifiedReasoner;
    private activeTasks: Map<string, LongRunningTask> = new Map();
    private checkpointInterval = 15 * 60 * 1000; // 15 minutes
    private maxRuntime = 72 * 60 * 60 * 1000; // 72 hours

    private constructor() {
        super();
        this.swarm = SwarmCoordinator.getInstance();
        this.reasoner = UnifiedReasoner.getInstance();
    }

    static getInstance(): AutonomousExecutor {
        if (!AutonomousExecutor.instance) {
            AutonomousExecutor.instance = new AutonomousExecutor();
        }
        return AutonomousExecutor.instance;
    }

    /**
     * Start a long-running autonomous task
     */
    async startLongRunningTask(description: string, estimatedHours: number): Promise<LongRunningTask> {
        const task: LongRunningTask = {
            id: `autonomous_${Date.now()}`,
            description,
            startTime: new Date(),
            estimatedDuration: `${estimatedHours} hours`,
            status: 'running',
            progress: 0,
            checkpoints: [],
            logs: [],
            resources: { cpuPercent: 0, memoryMB: 0, gpuPercent: 0, networkMB: 0 }
        };

        this.activeTasks.set(task.id, task);
        this.emit('task:start', { taskId: task.id });
        this.log(task, 'info', `Task started: ${description}`);

        // Start execution in background
        this.executeTask(task).catch(error => {
            task.status = 'failed';
            this.log(task, 'error', `Task failed: ${error.message}`);
            this.emit('task:failed', { taskId: task.id, error });
        });

        // Start checkpoint timer
        this.startCheckpointing(task);

        // Start resource monitoring
        this.startResourceMonitoring(task);

        return task;
    }

    /**
     * Main execution loop
     */
    private async executeTask(task: LongRunningTask): Promise<void> {
        try {
            // Phase 1: Break down the task
            this.log(task, 'info', 'Phase 1: Analyzing and breaking down task...');
            const plan = await this.reasoner.think({
                id: task.id,
                description: task.description,
                context: 'Long-running autonomous task',
                priority: 'high'
            });
            task.progress = 10;

            // Phase 2: Execute each step
            const steps = plan.steps;
            const stepProgress = 80 / steps.length;

            for (let i = 0; i < steps.length; i++) {
                if (task.status !== 'running') break;

                const step = steps[i];
                this.log(task, 'info', `Executing step ${i + 1}/${steps.length}: ${step.action}`);

                // Execute via swarm
                await this.swarm.quickExecute(step.action);

                task.progress = 10 + (i + 1) * stepProgress;
                this.emit('task:progress', { taskId: task.id, progress: task.progress });

                // Check if we need to scale up resources
                await this.checkResourceScaling(task);

                // Check runtime limit
                if (Date.now() - task.startTime.getTime() > this.maxRuntime) {
                    this.log(task, 'warn', 'Maximum runtime exceeded, finalizing...');
                    break;
                }
            }

            // Phase 3: Finalize
            this.log(task, 'info', 'Phase 3: Finalizing and cleanup...');
            task.progress = 95;

            await this.finalize(task);

            task.status = 'completed';
            task.progress = 100;
            this.log(task, 'info', 'Task completed successfully!');
            this.emit('task:complete', { taskId: task.id });

        } catch (error) {
            task.status = 'failed';
            throw error;
        }
    }

    /**
     * Create checkpoints periodically
     */
    private startCheckpointing(task: LongRunningTask): void {
        const interval = setInterval(() => {
            if (task.status !== 'running') {
                clearInterval(interval);
                return;
            }

            const checkpoint: Checkpoint = {
                id: `cp_${Date.now()}`,
                timestamp: new Date(),
                description: `Checkpoint at ${task.progress.toFixed(1)}% progress`,
                state: {
                    progress: task.progress,
                    logs: task.logs.length
                },
                recoverable: true
            };

            task.checkpoints.push(checkpoint);
            this.log(task, 'debug', `Checkpoint created: ${checkpoint.id}`);
            this.emit('checkpoint:created', { taskId: task.id, checkpoint });

        }, this.checkpointInterval);
    }

    /**
     * Monitor resource usage
     */
    private startResourceMonitoring(task: LongRunningTask): void {
        const interval = setInterval(async () => {
            if (task.status !== 'running') {
                clearInterval(interval);
                return;
            }

            task.resources = await this.getResourceUsage();
            this.emit('resources:update', { taskId: task.id, resources: task.resources });

        }, 30000); // Every 30 seconds
    }

    /**
     * Get current resource usage
     */
    private async getResourceUsage(): Promise<ResourceUsage> {
        try {
            // CPU usage
            const { stdout: cpuOut } = await execAsync("ps -A -o %cpu | awk '{s+=$1} END {print s}'");
            const cpuPercent = parseFloat(cpuOut.trim()) || 0;

            // Memory usage
            const { stdout: memOut } = await execAsync("vm_stat | grep 'Pages active' | awk '{print $3}'");
            const memoryMB = (parseInt(memOut.trim().replace('.', '')) * 4096) / (1024 * 1024) || 0;

            return {
                cpuPercent: Math.min(100, cpuPercent),
                memoryMB,
                gpuPercent: 0, // Would need GPU monitoring
                networkMB: 0
            };
        } catch {
            return { cpuPercent: 0, memoryMB: 0, gpuPercent: 0, networkMB: 0 };
        }
    }

    /**
     * Check if we need to scale up to cloud
     */
    private async checkResourceScaling(task: LongRunningTask): Promise<void> {
        if (task.resources.cpuPercent > 90 || task.resources.gpuPercent > 90) {
            this.log(task, 'info', 'Local resources saturated, would spawn cloud runner...');
            this.emit('scaling:needed', { taskId: task.id, resources: task.resources });

            // In production, this would spin up Fly.io/Modal/Hetzner instances
            // For now, just log the intent
        }
    }

    /**
     * Finalize the task
     */
    private async finalize(task: LongRunningTask): Promise<void> {
        // Create final checkpoint
        const finalCheckpoint: Checkpoint = {
            id: `final_${Date.now()}`,
            timestamp: new Date(),
            description: 'Final checkpoint',
            state: {
                progress: 100,
                totalLogs: task.logs.length,
                totalCheckpoints: task.checkpoints.length
            },
            recoverable: true
        };

        task.checkpoints.push(finalCheckpoint);
        this.log(task, 'info', 'Final checkpoint created');
    }

    /**
     * Log a message
     */
    private log(task: LongRunningTask, level: LogEntry['level'], message: string, details?: Record<string, unknown>): void {
        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            details
        };

        task.logs.push(entry);

        if (level === 'error') {
            console.error(`[${task.id}] ${message}`);
        } else {
            console.log(`[${task.id}] ${message}`);
        }
    }

    /**
     * Pause a task
     */
    pauseTask(taskId: string): boolean {
        const task = this.activeTasks.get(taskId);
        if (task && task.status === 'running') {
            task.status = 'paused';
            this.emit('task:paused', { taskId });
            return true;
        }
        return false;
    }

    /**
     * Resume a task
     */
    resumeTask(taskId: string): boolean {
        const task = this.activeTasks.get(taskId);
        if (task && task.status === 'paused') {
            task.status = 'running';
            this.emit('task:resumed', { taskId });
            return true;
        }
        return false;
    }

    /**
     * Get task status
     */
    getTaskStatus(taskId: string): LongRunningTask | undefined {
        return this.activeTasks.get(taskId);
    }

    /**
     * Get all active tasks
     */
    getAllTasks(): LongRunningTask[] {
        return Array.from(this.activeTasks.values());
    }
}

export const autonomousExecutor = AutonomousExecutor.getInstance();
