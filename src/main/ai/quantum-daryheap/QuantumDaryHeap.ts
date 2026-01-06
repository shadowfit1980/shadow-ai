/**
 * Quantum D-ary Heap
 */
import { EventEmitter } from 'events';
export class QuantumDaryHeap<T> extends EventEmitter {
    private heap: T[] = [];
    private d: number;
    private compare: (a: T, b: T) => number;
    constructor(d: number = 4, compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.d = d; this.compare = compare; }
    private parent(i: number): number { return Math.floor((i - 1) / this.d); }
    private child(i: number, k: number): number { return this.d * i + k + 1; }
    private swap(i: number, j: number): void { [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]]; }
    private siftUp(i: number): void { while (i > 0 && this.compare(this.heap[i], this.heap[this.parent(i)]) < 0) { this.swap(i, this.parent(i)); i = this.parent(i); } }
    private siftDown(i: number): void { while (true) { let minIdx = i; for (let k = 0; k < this.d; k++) { const c = this.child(i, k); if (c < this.heap.length && this.compare(this.heap[c], this.heap[minIdx]) < 0) minIdx = c; } if (minIdx === i) break; this.swap(i, minIdx); i = minIdx; } }
    insert(value: T): void { this.heap.push(value); this.siftUp(this.heap.length - 1); }
    extractMin(): T | null { if (this.heap.length === 0) return null; const min = this.heap[0]; this.heap[0] = this.heap[this.heap.length - 1]; this.heap.pop(); if (this.heap.length > 0) this.siftDown(0); return min; }
    peek(): T | null { return this.heap[0] ?? null; }
    isEmpty(): boolean { return this.heap.length === 0; }
    size(): number { return this.heap.length; }
}
export const createDaryHeap = <T>(d?: number, compare?: (a: T, b: T) => number) => new QuantumDaryHeap<T>(d, compare);
