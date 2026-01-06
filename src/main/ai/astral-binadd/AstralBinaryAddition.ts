/**
 * Astral Binary Addition
 */
import { EventEmitter } from 'events';
export class AstralBinaryAddition extends EventEmitter {
    private static instance: AstralBinaryAddition;
    private constructor() { super(); }
    static getInstance(): AstralBinaryAddition { if (!AstralBinaryAddition.instance) { AstralBinaryAddition.instance = new AstralBinaryAddition(); } return AstralBinaryAddition.instance; }
    addBinary(a: string, b: string): string { let result = ''; let carry = 0; let i = a.length - 1, j = b.length - 1; while (i >= 0 || j >= 0 || carry) { const bitA = i >= 0 ? parseInt(a[i--]) : 0; const bitB = j >= 0 ? parseInt(b[j--]) : 0; const sum = bitA + bitB + carry; result = (sum % 2) + result; carry = Math.floor(sum / 2); } return result || '0'; }
    addWithoutOperator(a: number, b: number): number { while (b !== 0) { const carry = a & b; a = a ^ b; b = carry << 1; } return a; }
    subtractWithoutOperator(a: number, b: number): number { while (b !== 0) { const borrow = ~a & b; a = a ^ b; b = borrow << 1; } return a; }
    multiplyWithoutOperator(a: number, b: number): number { const isNegative = (a < 0) !== (b < 0); a = Math.abs(a); b = Math.abs(b); let result = 0; while (b) { if (b & 1) result = this.addWithoutOperator(result, a); a <<= 1; b >>= 1; } return isNegative ? -result : result; }
}
export const astralBinaryAddition = AstralBinaryAddition.getInstance();
