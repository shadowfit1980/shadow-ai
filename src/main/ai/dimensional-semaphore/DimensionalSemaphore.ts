/**
 * Dimensional Semaphore
 */
import { EventEmitter } from 'events';
export class DimensionalSemaphore extends EventEmitter {
    private permits: number;
    private waiting: (() => void)[] = [];
    constructor(permits: number = 1) { super(); this.permits = permits; }
    async acquire(): Promise<void> { if (this.permits > 0) { this.permits--; return; } return new Promise<void>(resolve => this.waiting.push(resolve)); }
    release(): void { if (this.waiting.length > 0) { const next = this.waiting.shift()!; next(); } else { this.permits++; } }
    async withLock<T>(fn: () => Promise<T>): Promise<T> { await this.acquire(); try { return await fn(); } finally { this.release(); } }
    availablePermits(): number { return this.permits; }
}
export const createSemaphore = (permits?: number) => new DimensionalSemaphore(permits);
