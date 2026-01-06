/**
 * Quantum Functional Queue
 */
import { EventEmitter } from 'events';
export class QuantumFunctionalQueue<T> extends EventEmitter {
    private front: T[];
    private back: T[];
    constructor(front: T[] = [], back: T[] = []) { super(); this.front = front; this.back = back; }
    enqueue(value: T): QuantumFunctionalQueue<T> { return new QuantumFunctionalQueue(this.front, [value, ...this.back]); }
    dequeue(): { value: T; queue: QuantumFunctionalQueue<T> } | null { if (this.isEmpty()) return null; if (this.front.length === 0) { const newFront = this.back.reverse(); return { value: newFront[0], queue: new QuantumFunctionalQueue(newFront.slice(1), []) }; } return { value: this.front[0], queue: new QuantumFunctionalQueue(this.front.slice(1), this.back) }; }
    peek(): T | null { if (this.isEmpty()) return null; if (this.front.length === 0) return this.back[this.back.length - 1]; return this.front[0]; }
    isEmpty(): boolean { return this.front.length === 0 && this.back.length === 0; }
    size(): number { return this.front.length + this.back.length; }
    toArray(): T[] { return [...this.front, ...this.back.slice().reverse()]; }
}
export const createFunctionalQueue = <T>() => new QuantumFunctionalQueue<T>();
