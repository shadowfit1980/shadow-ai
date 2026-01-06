/**
 * Quantum Circular Queue
 */
import { EventEmitter } from 'events';
export class QuantumCircularQueue extends EventEmitter {
    private static instance: QuantumCircularQueue;
    private queue: (number | undefined)[];
    private head = 0; private tail = -1; private size = 0; private capacity: number;
    private constructor() { super(); this.capacity = 100; this.queue = new Array(this.capacity); }
    static getInstance(): QuantumCircularQueue { if (!QuantumCircularQueue.instance) { QuantumCircularQueue.instance = new QuantumCircularQueue(); } return QuantumCircularQueue.instance; }
    enQueue(value: number): boolean { if (this.isFull()) return false; this.tail = (this.tail + 1) % this.capacity; this.queue[this.tail] = value; this.size++; return true; }
    deQueue(): boolean { if (this.isEmpty()) return false; this.head = (this.head + 1) % this.capacity; this.size--; return true; }
    Front(): number { return this.isEmpty() ? -1 : this.queue[this.head]!; }
    Rear(): number { return this.isEmpty() ? -1 : this.queue[this.tail]!; }
    isEmpty(): boolean { return this.size === 0; }
    isFull(): boolean { return this.size === this.capacity; }
    getStats(): { size: number } { return { size: this.size }; }
}
export const quantumCircularQueue = QuantumCircularQueue.getInstance();
