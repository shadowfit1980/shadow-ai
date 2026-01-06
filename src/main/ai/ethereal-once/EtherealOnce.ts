/**
 * Ethereal Once
 */
import { EventEmitter } from 'events';
export class EtherealOnce extends EventEmitter {
    private static instance: EtherealOnce;
    private constructor() { super(); }
    static getInstance(): EtherealOnce { if (!EtherealOnce.instance) { EtherealOnce.instance = new EtherealOnce(); } return EtherealOnce.instance; }
    runOnce<T extends (...args: unknown[]) => unknown>(fn: T): T { let called = false; let result: ReturnType<T>; return ((...args: unknown[]) => { if (!called) { called = true; result = fn(...args) as ReturnType<T>; } return result; }) as T; }
    getStats(): { called: number } { return { called: 0 }; }
}
export const etherealOnce = EtherealOnce.getInstance();
