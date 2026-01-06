/**
 * Quantum Multiset
 */
import { EventEmitter } from 'events';
export class QuantumMultiset<T> extends EventEmitter {
    private counts: Map<T, number> = new Map();
    add(value: T, count: number = 1): void { this.counts.set(value, (this.counts.get(value) || 0) + count); }
    remove(value: T, count: number = 1): boolean { const current = this.counts.get(value) || 0; if (current <= count) { this.counts.delete(value); return current > 0; } this.counts.set(value, current - count); return true; }
    count(value: T): number { return this.counts.get(value) || 0; }
    has(value: T): boolean { return this.counts.has(value); }
    uniqueSize(): number { return this.counts.size; }
    totalSize(): number { return [...this.counts.values()].reduce((sum, c) => sum + c, 0); }
    elements(): T[] { const result: T[] = []; for (const [value, count] of this.counts) for (let i = 0; i < count; i++) result.push(value); return result; }
}
export const createMultiset = <T>() => new QuantumMultiset<T>();
