/**
 * Dimensional Min Stack
 */
import { EventEmitter } from 'events';
export class DimensionalMinStack extends EventEmitter {
    private static instance: DimensionalMinStack;
    private stack: { val: number; min: number }[] = [];
    private constructor() { super(); }
    static getInstance(): DimensionalMinStack { if (!DimensionalMinStack.instance) { DimensionalMinStack.instance = new DimensionalMinStack(); } return DimensionalMinStack.instance; }
    push(val: number): void { const min = this.stack.length === 0 ? val : Math.min(val, this.stack[this.stack.length - 1].min); this.stack.push({ val, min }); }
    pop(): number | undefined { return this.stack.pop()?.val; }
    top(): number | undefined { return this.stack[this.stack.length - 1]?.val; }
    getMin(): number | undefined { return this.stack[this.stack.length - 1]?.min; }
    getStats(): { size: number } { return { size: this.stack.length }; }
}
export const dimensionalMinStack = DimensionalMinStack.getInstance();
