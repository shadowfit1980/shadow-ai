/**
 * Dimensional Sorted List
 */
import { EventEmitter } from 'events';
export class DimensionalSortedList<T> extends EventEmitter {
    private items: T[] = [];
    private comparator: (a: T, b: T) => number;
    constructor(comparator: (a: T, b: T) => number = (a, b) => a > b ? 1 : a < b ? -1 : 0) { super(); this.comparator = comparator; }
    add(item: T): void { let left = 0, right = this.items.length; while (left < right) { const mid = Math.floor((left + right) / 2); if (this.comparator(this.items[mid], item) < 0) left = mid + 1; else right = mid; } this.items.splice(left, 0, item); }
    remove(item: T): boolean { const idx = this.items.indexOf(item); if (idx === -1) return false; this.items.splice(idx, 1); return true; }
    has(item: T): boolean { return this.items.includes(item); }
    get(index: number): T | undefined { return this.items[index]; }
    toArray(): T[] { return [...this.items]; }
    size(): number { return this.items.length; }
}
export const createSortedList = <T>(comparator?: (a: T, b: T) => number) => new DimensionalSortedList<T>(comparator);
