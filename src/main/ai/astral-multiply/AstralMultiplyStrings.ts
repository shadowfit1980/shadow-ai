/**
 * Astral Multiply Strings
 */
import { EventEmitter } from 'events';
export class AstralMultiplyStrings extends EventEmitter {
    private static instance: AstralMultiplyStrings;
    private constructor() { super(); }
    static getInstance(): AstralMultiplyStrings { if (!AstralMultiplyStrings.instance) { AstralMultiplyStrings.instance = new AstralMultiplyStrings(); } return AstralMultiplyStrings.instance; }
    multiply(num1: string, num2: string): string { if (num1 === '0' || num2 === '0') return '0'; const m = num1.length, n = num2.length; const result = new Array(m + n).fill(0); for (let i = m - 1; i >= 0; i--) { for (let j = n - 1; j >= 0; j--) { const mul = parseInt(num1[i]) * parseInt(num2[j]); const p1 = i + j, p2 = i + j + 1; const sum = mul + result[p2]; result[p2] = sum % 10; result[p1] += Math.floor(sum / 10); } } let str = result.join(''); while (str[0] === '0' && str.length > 1) str = str.slice(1); return str; }
    addStrings(num1: string, num2: string): string { let i = num1.length - 1, j = num2.length - 1, carry = 0, result = ''; while (i >= 0 || j >= 0 || carry) { const sum = (i >= 0 ? parseInt(num1[i--]) : 0) + (j >= 0 ? parseInt(num2[j--]) : 0) + carry; result = (sum % 10) + result; carry = Math.floor(sum / 10); } return result; }
    divide(dividend: number, divisor: number): number { const MAX = 2147483647, MIN = -2147483648; if (dividend === MIN && divisor === -1) return MAX; const negative = (dividend < 0) !== (divisor < 0); let a = Math.abs(dividend), b = Math.abs(divisor), result = 0; while (a >= b) { let temp = b, multiple = 1; while (a >= temp + temp) { temp += temp; multiple += multiple; } a -= temp; result += multiple; } return negative ? -result : result; }
}
export const astralMultiplyStrings = AstralMultiplyStrings.getInstance();
