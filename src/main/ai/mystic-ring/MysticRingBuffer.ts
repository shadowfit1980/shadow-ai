/**
 * Mystic Ring Buffer
 */
import { EventEmitter } from 'events';
export class MysticRingBuffer<T> extends EventEmitter {
    private buffer: (T | undefined)[];
    private head = 0;
    private tail = 0;
    private count = 0;
    private capacity: number;
    constructor(capacity: number) { super(); this.capacity = capacity; this.buffer = new Array(capacity); }
    push(value: T): void { this.buffer[this.tail] = value; this.tail = (this.tail + 1) % this.capacity; if (this.count < this.capacity) this.count++; else this.head = (this.head + 1) % this.capacity; }
    pop(): T | undefined { if (this.count === 0) return undefined; this.tail = (this.tail - 1 + this.capacity) % this.capacity; const value = this.buffer[this.tail]; this.buffer[this.tail] = undefined; this.count--; return value; }
    peek(): T | undefined { return this.count > 0 ? this.buffer[this.head] : undefined; }
    size(): number { return this.count; }
    isFull(): boolean { return this.count === this.capacity; }
    toArray(): T[] { const arr: T[] = []; for (let i = 0; i < this.count; i++) arr.push(this.buffer[(this.head + i) % this.capacity]!); return arr; }
}
export const createRingBuffer = <T>(capacity: number) => new MysticRingBuffer<T>(capacity);
