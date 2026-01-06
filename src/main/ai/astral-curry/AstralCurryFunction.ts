/**
 * Astral Curry Function
 */
import { EventEmitter } from 'events';
export class AstralCurryFunction extends EventEmitter {
    private static instance: AstralCurryFunction;
    private constructor() { super(); }
    static getInstance(): AstralCurryFunction { if (!AstralCurryFunction.instance) { AstralCurryFunction.instance = new AstralCurryFunction(); } return AstralCurryFunction.instance; }
    curry<T extends (...args: unknown[]) => unknown>(fn: T): (...args: unknown[]) => unknown { return function curried(...args: unknown[]): unknown { if (args.length >= fn.length) return fn(...args); return (...more: unknown[]) => curried(...args, ...more); }; }
    getStats(): { curried: number } { return { curried: 0 }; }
}
export const astralCurryFunction = AstralCurryFunction.getInstance();
