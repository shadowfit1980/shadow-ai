/**
 * Astral Memento
 */
import { EventEmitter } from 'events';
export class AstralMemento<T> extends EventEmitter {
    private history: T[] = [];
    private maxHistory: number;
    constructor(maxHistory: number = 50) { super(); this.maxHistory = maxHistory; }
    save(state: T): void { this.history.push(state); if (this.history.length > this.maxHistory) this.history.shift(); }
    restore(): T | null { return this.history.pop() || null; }
    peek(): T | null { return this.history[this.history.length - 1] || null; }
    clear(): void { this.history = []; }
    getStats(): { snapshots: number } { return { snapshots: this.history.length }; }
}
export const createMemento = <T>(maxHistory?: number) => new AstralMemento<T>(maxHistory);
