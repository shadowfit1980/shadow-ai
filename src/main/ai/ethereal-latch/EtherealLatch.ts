/**
 * Ethereal Latch
 */
import { EventEmitter } from 'events';
export class EtherealLatch extends EventEmitter {
    private count: number;
    private waiting: (() => void)[] = [];
    constructor(count: number) { super(); this.count = count; if (count <= 0) this.emit('released'); }
    countDown(): void { if (this.count > 0) { this.count--; if (this.count === 0) { for (const resolve of this.waiting) resolve(); this.waiting = []; this.emit('released'); } } }
    async wait(): Promise<void> { if (this.count === 0) return; return new Promise<void>(resolve => this.waiting.push(resolve)); }
    getCount(): number { return this.count; }
}
export const createLatch = (count: number) => new EtherealLatch(count);
