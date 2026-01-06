/**
 * Ethereal Assert
 */
import { EventEmitter } from 'events';
export class EtherealAssert extends EventEmitter {
    private static instance: EtherealAssert;
    private constructor() { super(); }
    static getInstance(): EtherealAssert { if (!EtherealAssert.instance) { EtherealAssert.instance = new EtherealAssert(); } return EtherealAssert.instance; }
    assert(condition: unknown, message?: string): asserts condition { if (!condition) throw new Error(message || 'Assertion failed'); }
    assertNonNull<T>(value: T | null | undefined, message?: string): asserts value is T { if (value == null) throw new Error(message || 'Value is null or undefined'); }
    getStats(): { asserted: number } { return { asserted: 0 }; }
}
export const etherealAssert = EtherealAssert.getInstance();
