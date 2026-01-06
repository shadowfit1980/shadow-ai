/**
 * Background Jobs - Background execution
 */
import { EventEmitter } from 'events';

export interface BackgroundJob { id: string; name: string; status: 'queued' | 'running' | 'completed' | 'failed'; progress: number; result?: any; startedAt?: number; completedAt?: number; }

export class BackgroundJobManager extends EventEmitter {
    private static instance: BackgroundJobManager;
    private jobs: Map<string, BackgroundJob> = new Map();
    private constructor() { super(); }
    static getInstance(): BackgroundJobManager { if (!BackgroundJobManager.instance) BackgroundJobManager.instance = new BackgroundJobManager(); return BackgroundJobManager.instance; }

    queue(name: string): BackgroundJob {
        const job: BackgroundJob = { id: `job_${Date.now()}`, name, status: 'queued', progress: 0 };
        this.jobs.set(job.id, job);
        this.emit('queued', job);
        return job;
    }

    async run(id: string): Promise<BackgroundJob | null> {
        const job = this.jobs.get(id); if (!job) return null;
        job.status = 'running'; job.startedAt = Date.now();
        this.emit('started', job);
        job.progress = 100; job.status = 'completed'; job.completedAt = Date.now();
        this.emit('completed', job);
        return job;
    }

    getRunning(): BackgroundJob[] { return Array.from(this.jobs.values()).filter(j => j.status === 'running'); }
    getAll(): BackgroundJob[] { return Array.from(this.jobs.values()); }
}
export function getBackgroundJobManager(): BackgroundJobManager { return BackgroundJobManager.getInstance(); }
