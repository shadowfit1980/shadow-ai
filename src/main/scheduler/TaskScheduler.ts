/**
 * Task Scheduler
 * Schedule and run background tasks
 */

import { EventEmitter } from 'events';

export interface ScheduledTask {
    id: string;
    name: string;
    handler: () => void | Promise<void>;
    intervalMs?: number;
    runAt?: Date;
    running: boolean;
    lastRun?: number;
    timerId?: NodeJS.Timeout;
}

/**
 * TaskScheduler
 * Background task scheduling
 */
export class TaskScheduler extends EventEmitter {
    private static instance: TaskScheduler;
    private tasks: Map<string, ScheduledTask> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): TaskScheduler {
        if (!TaskScheduler.instance) {
            TaskScheduler.instance = new TaskScheduler();
        }
        return TaskScheduler.instance;
    }

    schedule(name: string, handler: () => void | Promise<void>, intervalMs: number): ScheduledTask {
        const task: ScheduledTask = {
            id: `task_${Date.now()}`,
            name,
            handler,
            intervalMs,
            running: true,
        };

        task.timerId = setInterval(async () => {
            try {
                await handler();
                task.lastRun = Date.now();
                this.emit('taskRan', task);
            } catch (error) {
                this.emit('taskFailed', { task, error });
            }
        }, intervalMs);

        this.tasks.set(task.id, task);
        this.emit('scheduled', task);
        return task;
    }

    scheduleOnce(name: string, handler: () => void | Promise<void>, delayMs: number): ScheduledTask {
        const task: ScheduledTask = {
            id: `task_${Date.now()}`,
            name,
            handler,
            running: true,
        };

        task.timerId = setTimeout(async () => {
            try {
                await handler();
                task.lastRun = Date.now();
                task.running = false;
                this.emit('taskRan', task);
            } catch (error) {
                this.emit('taskFailed', { task, error });
            }
        }, delayMs);

        this.tasks.set(task.id, task);
        return task;
    }

    cancel(id: string): boolean {
        const task = this.tasks.get(id);
        if (!task) return false;

        if (task.timerId) {
            clearInterval(task.timerId);
            clearTimeout(task.timerId);
        }
        task.running = false;
        this.emit('cancelled', task);
        return true;
    }

    cancelAll(): void {
        for (const task of this.tasks.values()) {
            if (task.timerId) {
                clearInterval(task.timerId);
                clearTimeout(task.timerId);
            }
            task.running = false;
        }
        this.emit('allCancelled');
    }

    getAll(): ScheduledTask[] {
        return Array.from(this.tasks.values());
    }

    getRunning(): ScheduledTask[] {
        return this.getAll().filter(t => t.running);
    }
}

export function getTaskScheduler(): TaskScheduler {
    return TaskScheduler.getInstance();
}
