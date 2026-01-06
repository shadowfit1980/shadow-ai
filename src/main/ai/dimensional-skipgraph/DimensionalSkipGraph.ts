/**
 * Dimensional Skip Graph
 */
import { EventEmitter } from 'events';
class SkipGraphNode<T> { value: T; levels: (SkipGraphNode<T> | null)[]; constructor(value: T, maxLevel: number) { this.value = value; this.levels = new Array(maxLevel).fill(null); } }
export class DimensionalSkipGraph<T> extends EventEmitter {
    private head: SkipGraphNode<T>;
    private maxLevel: number;
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number, maxLevel: number = 16) { super(); this.compare = compare; this.maxLevel = maxLevel; this.head = new SkipGraphNode<T>(null as unknown as T, maxLevel); }
    private randomLevel(): number { let level = 1; while (Math.random() < 0.5 && level < this.maxLevel) level++; return level; }
    insert(value: T): void { const level = this.randomLevel(); const node = new SkipGraphNode(value, level); const update: (SkipGraphNode<T> | null)[] = new Array(level).fill(null); let current: SkipGraphNode<T> | null = this.head; for (let i = level - 1; i >= 0; i--) { while (current!.levels[i] && this.compare(current!.levels[i]!.value, value) < 0) current = current!.levels[i]; update[i] = current; } for (let i = 0; i < level; i++) { node.levels[i] = update[i]!.levels[i]; update[i]!.levels[i] = node; } }
    search(value: T): boolean { let current: SkipGraphNode<T> | null = this.head; for (let i = this.maxLevel - 1; i >= 0; i--) { while (current!.levels[i] && this.compare(current!.levels[i]!.value, value) < 0) current = current!.levels[i]; } current = current!.levels[0]; return current !== null && this.compare(current.value, value) === 0; }
}
export const createSkipGraph = <T>(compare: (a: T, b: T) => number) => new DimensionalSkipGraph<T>(compare);
