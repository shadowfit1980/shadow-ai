/**
 * Astral Barrier
 */
import { EventEmitter } from 'events';
export class AstralBarrier extends EventEmitter {
    private count: number;
    private parties: number;
    private waiting: (() => void)[] = [];
    constructor(parties: number) { super(); this.parties = parties; this.count = 0; }
    async wait(): Promise<void> { this.count++; if (this.count === this.parties) { this.count = 0; for (const resolve of this.waiting) resolve(); this.waiting = []; this.emit('released'); return; } return new Promise<void>(resolve => this.waiting.push(resolve)); }
    getParties(): number { return this.parties; }
    getWaiting(): number { return this.count; }
}
export const createBarrier = (parties: number) => new AstralBarrier(parties);
