/**
 * Mystic Median Finder
 */
import { EventEmitter } from 'events';
export class MysticMedianFinder extends EventEmitter {
    private small: number[] = []; // max heap (negated)
    private large: number[] = []; // min heap
    constructor() { super(); }
    private pushHeap(heap: number[], val: number): void { heap.push(val); let i = heap.length - 1; while (i > 0) { const parent = Math.floor((i - 1) / 2); if (heap[parent] <= heap[i]) break;[heap[parent], heap[i]] = [heap[i], heap[parent]]; i = parent; } }
    private popHeap(heap: number[]): number { const result = heap[0]; const last = heap.pop()!; if (heap.length > 0) { heap[0] = last; let i = 0; while (true) { let smallest = i; const left = 2 * i + 1, right = 2 * i + 2; if (left < heap.length && heap[left] < heap[smallest]) smallest = left; if (right < heap.length && heap[right] < heap[smallest]) smallest = right; if (smallest === i) break;[heap[i], heap[smallest]] = [heap[smallest], heap[i]]; i = smallest; } } return result; }
    addNum(num: number): void { this.pushHeap(this.small, -num); this.pushHeap(this.large, -this.popHeap(this.small)); if (this.large.length > this.small.length) this.pushHeap(this.small, -this.popHeap(this.large)); }
    findMedian(): number { if (this.small.length > this.large.length) return -this.small[0]; return (-this.small[0] + this.large[0]) / 2; }
}
export const createMedianFinder = () => new MysticMedianFinder();
