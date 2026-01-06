/**
 * Cosmic Min Stack
 */
import { EventEmitter } from 'events';
export class CosmicMinStack extends EventEmitter {
    private stack: number[] = [];
    private minStack: number[] = [];
    constructor() { super(); }
    push(val: number): void { this.stack.push(val); if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1]) this.minStack.push(val); }
    pop(): void { if (this.stack.pop() === this.minStack[this.minStack.length - 1]) this.minStack.pop(); }
    top(): number { return this.stack[this.stack.length - 1]; }
    getMin(): number { return this.minStack[this.minStack.length - 1]; }
}
export class MaxStack extends EventEmitter {
    private stack: number[] = [];
    private maxStack: number[] = [];
    constructor() { super(); }
    push(val: number): void { this.stack.push(val); if (this.maxStack.length === 0 || val >= this.maxStack[this.maxStack.length - 1]) this.maxStack.push(val); else this.maxStack.push(this.maxStack[this.maxStack.length - 1]); }
    pop(): number { this.maxStack.pop(); return this.stack.pop()!; }
    top(): number { return this.stack[this.stack.length - 1]; }
    peekMax(): number { return this.maxStack[this.maxStack.length - 1]; }
}
export const createMinStack = () => new CosmicMinStack();
export const createMaxStack = () => new MaxStack();
