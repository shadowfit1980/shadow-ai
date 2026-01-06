/**
 * Quantum Reservoir Sampling
 */
import { EventEmitter } from 'events';
export class QuantumReservoir<T> extends EventEmitter {
    private reservoir: T[] = [];
    private k: number;
    private count: number = 0;
    constructor(k: number) { super(); this.k = k; }
    add(item: T): void { this.count++; if (this.reservoir.length < this.k) { this.reservoir.push(item); } else { const j = Math.floor(Math.random() * this.count); if (j < this.k) this.reservoir[j] = item; } }
    addAll(items: T[]): void { for (const item of items) this.add(item); }
    sample(): T[] { return [...this.reservoir]; }
    clear(): void { this.reservoir = []; this.count = 0; }
    getCount(): number { return this.count; }
    static weightedSample<T>(items: T[], weights: number[], k: number): T[] { const n = items.length; const result: T[] = []; const used = new Set<number>(); for (let i = 0; i < k && used.size < n; i++) { const totalWeight = weights.reduce((a, b, idx) => used.has(idx) ? a : a + b, 0); let rand = Math.random() * totalWeight; let idx = 0; for (; idx < n; idx++) { if (used.has(idx)) continue; rand -= weights[idx]; if (rand <= 0) break; } used.add(idx); result.push(items[idx]); } return result; }
}
export const createReservoir = <T>(k: number) => new QuantumReservoir<T>(k);
