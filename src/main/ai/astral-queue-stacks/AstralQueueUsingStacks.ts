/**
 * Astral Queue Using Stacks
 */
import { EventEmitter } from 'events';
export class AstralQueueUsingStacks extends EventEmitter {
    private static instance: AstralQueueUsingStacks;
    private s1: number[] = [];
    private s2: number[] = [];
    private constructor() { super(); }
    static getInstance(): AstralQueueUsingStacks { if (!AstralQueueUsingStacks.instance) { AstralQueueUsingStacks.instance = new AstralQueueUsingStacks(); } return AstralQueueUsingStacks.instance; }
    push(x: number): void { this.s1.push(x); }
    pop(): number | undefined { if (this.s2.length === 0) while (this.s1.length) this.s2.push(this.s1.pop()!); return this.s2.pop(); }
    peek(): number | undefined { if (this.s2.length === 0) while (this.s1.length) this.s2.push(this.s1.pop()!); return this.s2[this.s2.length - 1]; }
    empty(): boolean { return this.s1.length === 0 && this.s2.length === 0; }
    getStats(): { size: number } { return { size: this.s1.length + this.s2.length }; }
}
export const astralQueueUsingStacks = AstralQueueUsingStacks.getInstance();
