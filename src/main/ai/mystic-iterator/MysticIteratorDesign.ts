/**
 * Mystic Iterator Design
 */
import { EventEmitter } from 'events';
export class MysticNestedIterator extends EventEmitter {
    private list: number[] = [];
    private index: number = 0;
    constructor(nestedList: (number | unknown[])[]) { super(); this.flatten(nestedList); }
    private flatten(list: (number | unknown[])[]): void { for (const item of list) { if (typeof item === 'number') this.list.push(item); else this.flatten(item as (number | unknown[])[]); } }
    next(): number { return this.list[this.index++]; }
    hasNext(): boolean { return this.index < this.list.length; }
}
export class PeekingIterator extends EventEmitter {
    private iterator: Iterator<number>;
    private peeked: number | null = null;
    private hasMore: boolean = true;
    constructor(nums: number[]) { super(); this.iterator = nums[Symbol.iterator](); this.advance(); }
    private advance(): void { const next = this.iterator.next(); if (next.done) { this.hasMore = false; this.peeked = null; } else { this.peeked = next.value; } }
    peek(): number { return this.peeked!; }
    next(): number { const val = this.peeked!; this.advance(); return val; }
    hasNext(): boolean { return this.hasMore; }
}
export class ZigzagIterator extends EventEmitter {
    private vectors: number[][];
    private indices: number[];
    private current: number = 0;
    constructor(v1: number[], v2: number[]) { super(); this.vectors = [v1, v2].filter(v => v.length > 0); this.indices = new Array(this.vectors.length).fill(0); }
    next(): number { const v = this.vectors[this.current]; const val = v[this.indices[this.current]++]; if (this.indices[this.current] >= v.length) { this.vectors.splice(this.current, 1); this.indices.splice(this.current, 1); if (this.vectors.length > 0) this.current %= this.vectors.length; } else { this.current = (this.current + 1) % this.vectors.length; } return val; }
    hasNext(): boolean { return this.vectors.length > 0; }
}
export const createNestedIterator = (nestedList: (number | unknown[])[]) => new MysticNestedIterator(nestedList);
export const createPeekingIterator = (nums: number[]) => new PeekingIterator(nums);
export const createZigzagIterator = (v1: number[], v2: number[]) => new ZigzagIterator(v1, v2);
