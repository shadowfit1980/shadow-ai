/**
 * Mystic Heap
 */
import { EventEmitter } from 'events';
export class MysticHeap extends EventEmitter {
    private static instance: MysticHeap;
    private heap: number[] = [];
    private constructor() { super(); }
    static getInstance(): MysticHeap { if (!MysticHeap.instance) { MysticHeap.instance = new MysticHeap(); } return MysticHeap.instance; }
    push(val: number): void { this.heap.push(val); this.heap.sort((a, b) => a - b); }
    pop(): number | undefined { return this.heap.shift(); }
    peek(): number | undefined { return this.heap[0]; }
    getStats(): { size: number } { return { size: this.heap.length }; }
}
export const mysticHeap = MysticHeap.getInstance();
