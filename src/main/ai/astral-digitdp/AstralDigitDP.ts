/**
 * Astral Digit DP
 */
import { EventEmitter } from 'events';
export class AstralDigitDP extends EventEmitter {
    private static instance: AstralDigitDP;
    private constructor() { super(); }
    static getInstance(): AstralDigitDP { if (!AstralDigitDP.instance) { AstralDigitDP.instance = new AstralDigitDP(); } return AstralDigitDP.instance; }
    countDigitSum(n: number, targetSum: number): number { const digits = n.toString().split('').map(Number); const len = digits.length; const memo: Map<string, number> = new Map(); const dp = (pos: number, sum: number, tight: boolean, started: boolean): number => { if (pos === len) return started && sum === targetSum ? 1 : 0; const key = `${pos},${sum},${tight},${started}`; if (memo.has(key)) return memo.get(key)!; const limit = tight ? digits[pos] : 9; let result = 0; for (let d = 0; d <= limit; d++) { const newStarted = started || d > 0; const newSum = newStarted ? sum + d : sum; result += dp(pos + 1, newSum, tight && d === limit, newStarted); } memo.set(key, result); return result; }; return dp(0, 0, true, false); }
    countWithoutDigit(n: number, forbidden: number): number { const digits = n.toString().split('').map(Number); const len = digits.length; const memo: Map<string, number> = new Map(); const dp = (pos: number, tight: boolean, started: boolean): number => { if (pos === len) return started ? 1 : 0; const key = `${pos},${tight},${started}`; if (memo.has(key)) return memo.get(key)!; const limit = tight ? digits[pos] : 9; let result = 0; for (let d = 0; d <= limit; d++) if (d !== forbidden || !started) result += dp(pos + 1, tight && d === limit, started || d > 0); memo.set(key, result); return result; }; return dp(0, true, false); }
}
export const astralDigitDP = AstralDigitDP.getInstance();
