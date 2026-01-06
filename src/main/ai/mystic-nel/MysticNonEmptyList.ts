/**
 * Mystic NonEmptyList
 */
import { EventEmitter } from 'events';
export class MysticNonEmptyList<T> extends EventEmitter {
    private head: T;
    private tail: T[];
    constructor(head: T, ...tail: T[]) { super(); this.head = head; this.tail = tail; }
    static of<T>(head: T, ...tail: T[]): MysticNonEmptyList<T> { return new MysticNonEmptyList(head, ...tail); }
    static fromArray<T>(arr: T[]): MysticNonEmptyList<T> | null { if (arr.length === 0) return null; const [head, ...tail] = arr; return new MysticNonEmptyList(head, ...tail); }
    getHead(): T { return this.head; }
    getTail(): T[] { return [...this.tail]; }
    toArray(): T[] { return [this.head, ...this.tail]; }
    length(): number { return 1 + this.tail.length; }
    map<U>(fn: (value: T) => U): MysticNonEmptyList<U> { return new MysticNonEmptyList(fn(this.head), ...this.tail.map(fn)); }
    concat(other: MysticNonEmptyList<T>): MysticNonEmptyList<T> { return new MysticNonEmptyList(this.head, ...this.tail, ...other.toArray()); }
}
export const nel = <T>(head: T, ...tail: T[]) => MysticNonEmptyList.of(head, ...tail);
