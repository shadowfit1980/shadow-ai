/**
 * Assertion Helper - Smart assertions
 */
import { EventEmitter } from 'events';

export interface Assertion { id: string; type: string; expected: any; actual: any; passed: boolean; message: string; }

export class AssertionHelper extends EventEmitter {
    private static instance: AssertionHelper;
    private assertions: Assertion[] = [];
    private constructor() { super(); }
    static getInstance(): AssertionHelper { if (!AssertionHelper.instance) AssertionHelper.instance = new AssertionHelper(); return AssertionHelper.instance; }

    assertEqual(expected: any, actual: any, message = ''): Assertion {
        const passed = expected === actual;
        const a: Assertion = { id: `assert_${Date.now()}`, type: 'equal', expected, actual, passed, message: message || `Expected ${expected} to equal ${actual}` };
        this.assertions.push(a);
        this.emit(passed ? 'passed' : 'failed', a);
        return a;
    }

    assertDeepEqual(expected: any, actual: any): Assertion { return this.assertEqual(JSON.stringify(expected), JSON.stringify(actual), 'Deep equality check'); }
    assertTrue(value: boolean, message = ''): Assertion { return this.assertEqual(true, value, message || 'Expected value to be true'); }
    assertFalse(value: boolean, message = ''): Assertion { return this.assertEqual(false, value, message || 'Expected value to be false'); }
    assertThrows(fn: () => void): Assertion { let threw = false; try { fn(); } catch { threw = true; } return this.assertTrue(threw, 'Expected function to throw'); }

    getStats(): { passed: number; failed: number } { return { passed: this.assertions.filter(a => a.passed).length, failed: this.assertions.filter(a => !a.passed).length }; }
    clear(): void { this.assertions = []; }
}
export function getAssertionHelper(): AssertionHelper { return AssertionHelper.getInstance(); }
