/**
 * Task Prioritizer - Autonomous task scheduling
 */
import { EventEmitter } from 'events';

export interface PrioritizedTask { id: string; description: string; priority: number; dependencies: string[]; status: 'pending' | 'ready' | 'running' | 'complete' | 'blocked'; }

export class TaskPrioritizer extends EventEmitter {
    private static instance: TaskPrioritizer;
    private tasks: Map<string, PrioritizedTask> = new Map();
    private constructor() { super(); }
    static getInstance(): TaskPrioritizer { if (!TaskPrioritizer.instance) TaskPrioritizer.instance = new TaskPrioritizer(); return TaskPrioritizer.instance; }

    add(description: string, priority: number, dependencies: string[] = []): PrioritizedTask {
        const task: PrioritizedTask = { id: `task_${Date.now()}`, description, priority, dependencies, status: dependencies.length ? 'blocked' : 'ready' };
        this.tasks.set(task.id, task); this.updateStatuses(); return task;
    }

    private updateStatuses(): void { this.tasks.forEach(t => { if (t.status === 'blocked' && t.dependencies.every(d => this.tasks.get(d)?.status === 'complete')) t.status = 'ready'; }); }
    getNext(): PrioritizedTask | null { const ready = Array.from(this.tasks.values()).filter(t => t.status === 'ready').sort((a, b) => b.priority - a.priority); return ready[0] || null; }
    start(taskId: string): boolean { const t = this.tasks.get(taskId); if (!t || t.status !== 'ready') return false; t.status = 'running'; return true; }
    complete(taskId: string): boolean { const t = this.tasks.get(taskId); if (!t) return false; t.status = 'complete'; this.updateStatuses(); return true; }
    getQueue(): PrioritizedTask[] { return Array.from(this.tasks.values()).filter(t => t.status !== 'complete').sort((a, b) => b.priority - a.priority); }
}
export function getTaskPrioritizer(): TaskPrioritizer { return TaskPrioritizer.getInstance(); }
