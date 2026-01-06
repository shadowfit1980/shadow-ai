/**
 * Queue Manager
 * Job queues and processing
 */

import { EventEmitter } from 'events';

export interface QueueJob<T = any> {
    id: string;
    data: T;
    priority: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: number;
    result?: any;
    error?: string;
}

export class QueueManager<T = any> extends EventEmitter {
    private static instance: QueueManager;
    private jobs: QueueJob<T>[] = [];
    private processing = false;
    private processor?: (data: T) => Promise<any>;

    private constructor() { super(); }

    static getInstance<T>(): QueueManager<T> {
        if (!QueueManager.instance) QueueManager.instance = new QueueManager<T>();
        return QueueManager.instance as QueueManager<T>;
    }

    setProcessor(fn: (data: T) => Promise<any>): void { this.processor = fn; }

    add(data: T, priority = 0): QueueJob<T> {
        const job: QueueJob<T> = { id: `job_${Date.now()}`, data, priority, status: 'pending', createdAt: Date.now() };
        this.jobs.push(job);
        this.jobs.sort((a, b) => b.priority - a.priority);
        this.emit('added', job);
        this.process();
        return job;
    }

    private async process(): Promise<void> {
        if (this.processing || !this.processor) return;

        const job = this.jobs.find(j => j.status === 'pending');
        if (!job) return;

        this.processing = true;
        job.status = 'processing';
        this.emit('processing', job);

        try {
            job.result = await this.processor(job.data);
            job.status = 'completed';
            this.emit('completed', job);
        } catch (error: any) {
            job.status = 'failed';
            job.error = error.message;
            this.emit('failed', job);
        }

        this.processing = false;
        this.process();
    }

    getAll(): QueueJob<T>[] { return [...this.jobs]; }
    getPending(): QueueJob<T>[] { return this.jobs.filter(j => j.status === 'pending'); }
    clear(): void { this.jobs = []; }
}

export function getQueueManager<T>(): QueueManager<T> { return QueueManager.getInstance<T>(); }
