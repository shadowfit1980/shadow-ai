/**
 * Dimensional Iterator
 */
import { EventEmitter } from 'events';
export class DimensionalIterator<T> extends EventEmitter implements Iterable<T> {
    private items: T[];
    private index = 0;
    constructor(items: T[]) { super(); this.items = items; }
    *[Symbol.iterator](): Iterator<T> { for (const item of this.items) yield item; }
    hasNext(): boolean { return this.index < this.items.length; }
    next(): T | undefined { return this.hasNext() ? this.items[this.index++] : undefined; }
    reset(): void { this.index = 0; }
    toArray(): T[] { return [...this.items]; }
}
export const createIterator = <T>(items: T[]) => new DimensionalIterator<T>(items);
