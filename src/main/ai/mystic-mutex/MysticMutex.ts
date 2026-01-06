/**
 * Mystic Mutex
 */
import { EventEmitter } from 'events';
export class MysticMutex extends EventEmitter {
    private locked = false;
    private waiting: (() => void)[] = [];
    async lock(): Promise<void> { if (!this.locked) { this.locked = true; return; } return new Promise<void>(resolve => this.waiting.push(resolve)); }
    unlock(): void { if (this.waiting.length > 0) { const next = this.waiting.shift()!; next(); } else { this.locked = false; } }
    async withLock<T>(fn: () => Promise<T>): Promise<T> { await this.lock(); try { return await fn(); } finally { this.unlock(); } }
    isLocked(): boolean { return this.locked; }
}
export const createMutex = () => new MysticMutex();
