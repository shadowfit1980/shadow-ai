/**
 * Tasks Manager 2 - Task management
 */
import { EventEmitter } from 'events';

export interface Task2 { id: string; title: string; description?: string; status: 'todo' | 'in-progress' | 'done'; priority: 'low' | 'medium' | 'high'; dueDate?: Date; createdAt: number; }

export class TasksManager2 extends EventEmitter {
    private static instance: TasksManager2;
    private tasks: Map<string, Task2> = new Map();
    private constructor() { super(); }
    static getInstance(): TasksManager2 { if (!TasksManager2.instance) TasksManager2.instance = new TasksManager2(); return TasksManager2.instance; }

    create(title: string, priority: Task2['priority'] = 'medium', dueDate?: Date): Task2 {
        const task: Task2 = { id: `task_${Date.now()}`, title, status: 'todo', priority, dueDate, createdAt: Date.now() };
        this.tasks.set(task.id, task);
        return task;
    }

    updateStatus(id: string, status: Task2['status']): boolean { const t = this.tasks.get(id); if (!t) return false; t.status = status; this.emit('updated', t); return true; }
    getByStatus(status: Task2['status']): Task2[] { return Array.from(this.tasks.values()).filter(t => t.status === status); }
    getOverdue(): Task2[] { const now = new Date(); return Array.from(this.tasks.values()).filter(t => t.dueDate && t.dueDate < now && t.status !== 'done'); }
    getAll(): Task2[] { return Array.from(this.tasks.values()); }
    delete(id: string): boolean { return this.tasks.delete(id); }
}
export function getTasksManager2(): TasksManager2 { return TasksManager2.getInstance(); }
