/**
 * Mystic Skip List
 */
import { EventEmitter } from 'events';
class SkipNode<T> { value: T; forward: (SkipNode<T> | null)[] = []; constructor(value: T, level: number) { this.value = value; this.forward = new Array(level + 1).fill(null); } }
export class MysticSkipList<T> extends EventEmitter {
    private head: SkipNode<T>;
    private level = 0;
    private maxLevel: number;
    private comparator: (a: T, b: T) => number;
    constructor(maxLevel: number = 16, comparator: (a: T, b: T) => number = (a, b) => a > b ? 1 : a < b ? -1 : 0) { super(); this.maxLevel = maxLevel; this.comparator = comparator; this.head = new SkipNode<T>(undefined as T, maxLevel); }
    private randomLevel(): number { let lvl = 0; while (Math.random() < 0.5 && lvl < this.maxLevel) lvl++; return lvl; }
    insert(value: T): void { const update: (SkipNode<T> | null)[] = new Array(this.maxLevel + 1).fill(null); let current = this.head; for (let i = this.level; i >= 0; i--) { while (current.forward[i] && this.comparator(current.forward[i]!.value, value) < 0) current = current.forward[i]!; update[i] = current; } const lvl = this.randomLevel(); if (lvl > this.level) { for (let i = this.level + 1; i <= lvl; i++) update[i] = this.head; this.level = lvl; } const node = new SkipNode(value, lvl); for (let i = 0; i <= lvl; i++) { node.forward[i] = update[i]!.forward[i]; update[i]!.forward[i] = node; } }
    search(value: T): boolean { let current = this.head; for (let i = this.level; i >= 0; i--) while (current.forward[i] && this.comparator(current.forward[i]!.value, value) < 0) current = current.forward[i]!; return current.forward[0] !== null && this.comparator(current.forward[0]!.value, value) === 0; }
}
export const createSkipList = <T>(maxLevel?: number, comparator?: (a: T, b: T) => number) => new MysticSkipList<T>(maxLevel, comparator);
