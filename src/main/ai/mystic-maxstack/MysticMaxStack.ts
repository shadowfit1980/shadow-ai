/**
 * Mystic Max Stack
 */
import { EventEmitter } from 'events';
export class MysticMaxStack extends EventEmitter {
    private static instance: MysticMaxStack;
    private stack: { val: number; max: number }[] = [];
    private constructor() { super(); }
    static getInstance(): MysticMaxStack { if (!MysticMaxStack.instance) { MysticMaxStack.instance = new MysticMaxStack(); } return MysticMaxStack.instance; }
    push(val: number): void { const max = this.stack.length === 0 ? val : Math.max(val, this.stack[this.stack.length - 1].max); this.stack.push({ val, max }); }
    pop(): number | undefined { return this.stack.pop()?.val; }
    top(): number | undefined { return this.stack[this.stack.length - 1]?.val; }
    getMax(): number | undefined { return this.stack[this.stack.length - 1]?.max; }
    getStats(): { size: number } { return { size: this.stack.length }; }
}
export const mysticMaxStack = MysticMaxStack.getInstance();
