/**
 * Background Agent Pool
 * Manages background agent workers for parallel task execution
 * Enables Cursor-like background processing while user continues working
 */

import { EventEmitter } from 'events';
import { Worker, parentPort, isMainThread } from 'worker_threads';

export interface AgentTask {
    id: string;
    type: string;
    description: string;
    payload: any;
    priority: 'low' | 'normal' | 'high' | 'critical';
    createdAt: number;
    timeout?: number; // milliseconds
}

export enum TaskStatus {
    QUEUED = 'queued',
    RUNNING = 'running',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    TIMED_OUT = 'timed_out',
}

export interface TaskResult {
    taskId: string;
    status: TaskStatus;
    result?: any;
    error?: string;
    startTime: number;
    endTime?: number;
    duration?: number;
}

export interface BackgroundWorker {
    id: string;
    status: 'idle' | 'busy';
    currentTask?: string;
    startedAt?: number;
}

export interface PoolConfig {
    maxWorkers: number;
    taskTimeout: number; // default timeout in ms
    maxQueueSize: number;
    enablePersistence: boolean;
}

/**
 * BackgroundAgentPool
 * Manages a pool of background workers for parallel agent task execution
 */
export class BackgroundAgentPool extends EventEmitter {
    private static instance: BackgroundAgentPool;

    private taskQueue: AgentTask[] = [];
    private runningTasks: Map<string, TaskResult> = new Map();
    private completedTasks: Map<string, TaskResult> = new Map();
    private workers: Map<string, BackgroundWorker> = new Map();
    private taskCallbacks: Map<string, ((result: TaskResult) => void)[]> = new Map();
    private taskTimeouts: Map<string, NodeJS.Timeout> = new Map();

    private config: PoolConfig = {
        maxWorkers: 4,
        taskTimeout: 300000, // 5 minutes
        maxQueueSize: 100,
        enablePersistence: false,
    };

    // Metrics
    private metrics = {
        totalTasksSubmitted: 0,
        totalTasksCompleted: 0,
        totalTasksFailed: 0,
        totalTasksCancelled: 0,
        averageDuration: 0,
    };

    private constructor() {
        super();
        this.initializeWorkers();
    }

    static getInstance(): BackgroundAgentPool {
        if (!BackgroundAgentPool.instance) {
            BackgroundAgentPool.instance = new BackgroundAgentPool();
        }
        return BackgroundAgentPool.instance;
    }

    /**
     * Submit a new task to the pool
     */
    async submitTask(task: Omit<AgentTask, 'id' | 'createdAt'>): Promise<string> {
        const taskId = this.generateTaskId();

        const fullTask: AgentTask = {
            ...task,
            id: taskId,
            createdAt: Date.now(),
            timeout: task.timeout || this.config.taskTimeout,
        };

        // Check queue size
        if (this.taskQueue.length >= this.config.maxQueueSize) {
            throw new Error('Task queue is full');
        }

        // Add to queue with priority ordering
        this.insertTaskByPriority(fullTask);
        this.metrics.totalTasksSubmitted++;

        // Emit event
        this.emit('taskSubmitted', fullTask);

        // Try to process immediately if workers available
        this.processNextTask();

        return taskId;
    }

    /**
     * Get task status
     */
    async getTaskStatus(taskId: string): Promise<TaskResult | null> {
        // Check running tasks
        if (this.runningTasks.has(taskId)) {
            return this.runningTasks.get(taskId)!;
        }

        // Check completed tasks
        if (this.completedTasks.has(taskId)) {
            return this.completedTasks.get(taskId)!;
        }

        // Check queue
        const queuedTask = this.taskQueue.find(t => t.id === taskId);
        if (queuedTask) {
            return {
                taskId,
                status: TaskStatus.QUEUED,
                startTime: queuedTask.createdAt,
            };
        }

        return null;
    }

    /**
     * Cancel a task
     */
    async cancelTask(taskId: string): Promise<boolean> {
        // Remove from queue
        const queueIndex = this.taskQueue.findIndex(t => t.id === taskId);
        if (queueIndex !== -1) {
            this.taskQueue.splice(queueIndex, 1);
            this.handleTaskComplete(taskId, TaskStatus.CANCELLED);
            this.metrics.totalTasksCancelled++;
            return true;
        }

        // If running, mark for cancellation
        if (this.runningTasks.has(taskId)) {
            const result = this.runningTasks.get(taskId)!;
            result.status = TaskStatus.CANCELLED;
            this.handleTaskComplete(taskId, TaskStatus.CANCELLED);
            this.metrics.totalTasksCancelled++;
            return true;
        }

        return false;
    }

    /**
     * Register callback for task completion
     */
    onTaskComplete(taskId: string, callback: (result: TaskResult) => void): void {
        if (!this.taskCallbacks.has(taskId)) {
            this.taskCallbacks.set(taskId, []);
        }
        this.taskCallbacks.get(taskId)!.push(callback);

        // If task already completed, call immediately
        if (this.completedTasks.has(taskId)) {
            callback(this.completedTasks.get(taskId)!);
        }
    }

    /**
     * Get all running tasks
     */
    getRunningTasks(): TaskResult[] {
        return Array.from(this.runningTasks.values());
    }

    /**
     * Get queued tasks
     */
    getQueuedTasks(): AgentTask[] {
        return [...this.taskQueue];
    }

    /**
     * Get completed tasks (recent)
     */
    getCompletedTasks(limit = 50): TaskResult[] {
        return Array.from(this.completedTasks.values())
            .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
            .slice(0, limit);
    }

    /**
     * Get pool statistics
     */
    getStats() {
        const workers = Array.from(this.workers.values());
        return {
            ...this.metrics,
            queueSize: this.taskQueue.length,
            runningTaskCount: this.runningTasks.size,
            completedTaskCount: this.completedTasks.size,
            totalWorkers: workers.length,
            idleWorkers: workers.filter(w => w.status === 'idle').length,
            busyWorkers: workers.filter(w => w.status === 'busy').length,
        };
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<PoolConfig>): void {
        this.config = { ...this.config, ...config };

        // Adjust worker count if needed
        if (config.maxWorkers !== undefined) {
            this.adjustWorkerCount();
        }
    }

    /**
     * Get configuration
     */
    getConfig(): PoolConfig {
        return { ...this.config };
    }

    /**
     * Clear completed tasks
     */
    clearCompletedTasks(): void {
        this.completedTasks.clear();
        this.emit('completedTasksCleared');
    }

    // Private methods

    private initializeWorkers(): void {
        for (let i = 0; i < this.config.maxWorkers; i++) {
            this.createWorker();
        }
    }

    private createWorker(): BackgroundWorker {
        const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const worker: BackgroundWorker = {
            id: workerId,
            status: 'idle',
        };
        this.workers.set(workerId, worker);
        return worker;
    }

    private adjustWorkerCount(): void {
        const currentCount = this.workers.size;
        const targetCount = this.config.maxWorkers;

        if (currentCount < targetCount) {
            for (let i = currentCount; i < targetCount; i++) {
                this.createWorker();
            }
        } else if (currentCount > targetCount) {
            // Remove idle workers
            let removed = 0;
            for (const [id, worker] of this.workers) {
                if (worker.status === 'idle' && removed < currentCount - targetCount) {
                    this.workers.delete(id);
                    removed++;
                }
            }
        }
    }

    private insertTaskByPriority(task: AgentTask): void {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const taskPriority = priorityOrder[task.priority];

        let insertIndex = this.taskQueue.length;
        for (let i = 0; i < this.taskQueue.length; i++) {
            const existingPriority = priorityOrder[this.taskQueue[i].priority];
            if (taskPriority < existingPriority) {
                insertIndex = i;
                break;
            }
        }

        this.taskQueue.splice(insertIndex, 0, task);
    }

    private async processNextTask(): Promise<void> {
        // Find an idle worker
        const idleWorker = Array.from(this.workers.values()).find(w => w.status === 'idle');
        if (!idleWorker) return;

        // Get next task from queue
        const task = this.taskQueue.shift();
        if (!task) return;

        // Mark worker as busy
        idleWorker.status = 'busy';
        idleWorker.currentTask = task.id;
        idleWorker.startedAt = Date.now();

        // Create task result
        const result: TaskResult = {
            taskId: task.id,
            status: TaskStatus.RUNNING,
            startTime: Date.now(),
        };
        this.runningTasks.set(task.id, result);

        // Set timeout
        if (task.timeout) {
            const timeoutHandle = setTimeout(() => {
                this.handleTaskTimeout(task.id);
            }, task.timeout);
            this.taskTimeouts.set(task.id, timeoutHandle);
        }

        // Emit running event
        this.emit('taskStarted', task);

        // Execute task (simulated for now - in real impl this would use worker threads)
        try {
            const taskResult = await this.executeTask(task);
            this.handleTaskComplete(task.id, TaskStatus.COMPLETED, taskResult);
        } catch (error: any) {
            this.handleTaskComplete(task.id, TaskStatus.FAILED, undefined, error.message);
        }

        // Mark worker as idle
        idleWorker.status = 'idle';
        idleWorker.currentTask = undefined;
        idleWorker.startedAt = undefined;

        // Process next task if available
        this.processNextTask();
    }

    private async executeTask(task: AgentTask): Promise<any> {
        // This is a placeholder - in a real implementation, this would:
        // 1. Route to appropriate agent based on task.type
        // 2. Execute in a worker thread
        // 3. Return the result

        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 100));

        // For now, just emit that the task needs processing
        this.emit('executeTask', task);

        return { message: 'Task executed', taskId: task.id };
    }

    private handleTaskComplete(
        taskId: string,
        status: TaskStatus,
        result?: any,
        error?: string
    ): void {
        // Clear timeout if exists
        if (this.taskTimeouts.has(taskId)) {
            clearTimeout(this.taskTimeouts.get(taskId)!);
            this.taskTimeouts.delete(taskId);
        }

        // Get running result
        const runningResult = this.runningTasks.get(taskId);
        const endTime = Date.now();

        // Create final result
        const finalResult: TaskResult = {
            taskId,
            status,
            result,
            error,
            startTime: runningResult?.startTime || endTime,
            endTime,
            duration: endTime - (runningResult?.startTime || endTime),
        };

        // Move from running to completed
        this.runningTasks.delete(taskId);
        this.completedTasks.set(taskId, finalResult);

        // Update metrics
        if (status === TaskStatus.COMPLETED) {
            this.metrics.totalTasksCompleted++;
            this.updateAverageDuration(finalResult.duration || 0);
        } else if (status === TaskStatus.FAILED) {
            this.metrics.totalTasksFailed++;
        }

        // Call registered callbacks
        const callbacks = this.taskCallbacks.get(taskId) || [];
        for (const callback of callbacks) {
            try {
                callback(finalResult);
            } catch (e) {
                console.error('Task callback error:', e);
            }
        }
        this.taskCallbacks.delete(taskId);

        // Emit completion event
        this.emit('taskCompleted', finalResult);
    }

    private handleTaskTimeout(taskId: string): void {
        if (this.runningTasks.has(taskId)) {
            this.handleTaskComplete(taskId, TaskStatus.TIMED_OUT, undefined, 'Task timed out');
        }
    }

    private updateAverageDuration(duration: number): void {
        const total = this.metrics.totalTasksCompleted;
        const currentAvg = this.metrics.averageDuration;
        this.metrics.averageDuration = (currentAvg * (total - 1) + duration) / total;
    }

    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton getter
export function getBackgroundAgentPool(): BackgroundAgentPool {
    return BackgroundAgentPool.getInstance();
}
