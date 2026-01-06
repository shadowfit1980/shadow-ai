import { EventEmitter } from 'events';

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
    id: string;
    type: string;
    command: string;
    params: any;
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    dependencies?: string[];
    progress?: number; // 0-100
}

export interface QueueStats {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
}

/**
 * Priority-based task queue with concurrent execution support
 */
export class TaskQueue extends EventEmitter {
    private static instance: TaskQueue;
    private tasks: Map<string, AgentTask> = new Map();
    private runningTasks: Set<string> = new Set();
    private maxConcurrent: number = 3; // Maximum concurrent tasks
    private taskIdCounter: number = 0;

    private constructor() {
        super();
    }

    static getInstance(): TaskQueue {
        if (!TaskQueue.instance) {
            TaskQueue.instance = new TaskQueue();
        }
        return TaskQueue.instance;
    }

    /**
     * Add a task to the queue
     */
    addTask(
        type: string,
        command: string,
        params: any,
        priority: TaskPriority = 'normal',
        dependencies?: string[]
    ): string {
        const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;

        const task: AgentTask = {
            id: taskId,
            type,
            command,
            params,
            priority,
            status: 'pending',
            createdAt: new Date(),
            dependencies,
            progress: 0,
        };

        this.tasks.set(taskId, task);
        this.emit('task:added', task);

        // Try to start processing immediately
        this.processQueue();

        return taskId;
    }

    /**
     * Process the queue - start pending tasks if capacity allows
     */
    private processQueue(): void {
        if (this.runningTasks.size >= this.maxConcurrent) {
            return; // At capacity
        }

        // Get pending tasks sorted by priority
        const pendingTasks = this.getPendingTasks();

        for (const task of pendingTasks) {
            if (this.runningTasks.size >= this.maxConcurrent) {
                break;
            }

            // Check if dependencies are met
            if (task.dependencies && task.dependencies.length > 0) {
                const depsCompleted = task.dependencies.every(depId => {
                    const depTask = this.tasks.get(depId);
                    return depTask && depTask.status === 'completed';
                });

                if (!depsCompleted) {
                    continue; // Skip this task, dependencies not met
                }
            }

            // Start the task
            this.startTask(task.id);
        }
    }

    /**
     * Get pending tasks sorted by priority
     */
    private getPendingTasks(): AgentTask[] {
        const priorityOrder: Record<TaskPriority, number> = {
            critical: 0,
            high: 1,
            normal: 2,
            low: 3,
        };

        return Array.from(this.tasks.values())
            .filter(t => t.status === 'pending')
            .sort((a, b) => {
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                // Same priority, sort by creation time (FIFO)
                return a.createdAt.getTime() - b.createdAt.getTime();
            });
    }

    /**
     * Start executing a task
     */
    private startTask(taskId: string): void {
        const task = this.tasks.get(taskId);
        if (!task || task.status !== 'pending') {
            return;
        }

        task.status = 'running';
        task.startedAt = new Date();
        this.runningTasks.add(taskId);
        this.emit('task:started', task);
    }

    /**
     * Mark a task as completed
     */
    completeTask(taskId: string, result: any): void {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }

        task.status = 'completed';
        task.completedAt = new Date();
        task.result = result;
        task.progress = 100;
        this.runningTasks.delete(taskId);
        this.emit('task:completed', task);

        // Process queue to start next tasks
        this.processQueue();
    }

    /**
     * Mark a task as failed
     */
    failTask(taskId: string, error: string): void {
        const task = this.tasks.get(taskId);
        if (!task) {
            return;
        }

        task.status = 'failed';
        task.completedAt = new Date();
        task.error = error;
        this.runningTasks.delete(taskId);
        this.emit('task:failed', task);

        // Process queue to start next tasks
        this.processQueue();
    }

    /**
     * Cancel a task
     */
    cancelTask(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }

        if (task.status === 'completed' || task.status === 'failed') {
            return false; // Cannot cancel finished tasks
        }

        task.status = 'cancelled';
        task.completedAt = new Date();
        this.runningTasks.delete(taskId);
        this.emit('task:cancelled', task);

        // Process queue
        this.processQueue();

        return true;
    }

    /**
     * Update task progress
     */
    updateTaskProgress(taskId: string, progress: number): void {
        const task = this.tasks.get(taskId);
        if (task && task.status === 'running') {
            task.progress = Math.max(0, Math.min(100, progress));
            this.emit('task:progress', task);
        }
    }

    /**
     * Get a task by ID
     */
    getTask(taskId: string): AgentTask | undefined {
        return this.tasks.get(taskId);
    }

    /**
     * Get all tasks
     */
    getAllTasks(): AgentTask[] {
        return Array.from(this.tasks.values());
    }

    /**
     * Get queue statistics
     */
    getStats(): QueueStats {
        const stats: QueueStats = {
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
            total: this.tasks.size,
        };

        for (const task of this.tasks.values()) {
            stats[task.status]++;
        }

        return stats;
    }

    /**
     * Clear completed and failed tasks
     */
    clearFinishedTasks(): void {
        const toRemove: string[] = [];

        for (const [id, task] of this.tasks.entries()) {
            if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
                toRemove.push(id);
            }
        }

        for (const id of toRemove) {
            this.tasks.delete(id);
        }

        this.emit('queue:cleared');
    }

    /**
     * Set max concurrent tasks
     */
    setMaxConcurrent(max: number): void {
        this.maxConcurrent = Math.max(1, max);
        this.processQueue();
    }

    /**
     * Get max concurrent tasks
     */
    getMaxConcurrent(): number {
        return this.maxConcurrent;
    }
}
