/**
 * Dimensional Word Break DP
 */
import { EventEmitter } from 'events';
export class DimensionalWordBreakDP extends EventEmitter {
    private static instance: DimensionalWordBreakDP;
    private constructor() { super(); }
    static getInstance(): DimensionalWordBreakDP { if (!DimensionalWordBreakDP.instance) { DimensionalWordBreakDP.instance = new DimensionalWordBreakDP(); } return DimensionalWordBreakDP.instance; }
    wordBreak(s: string, wordDict: string[]): boolean { const wordSet = new Set(wordDict); const dp = new Array(s.length + 1).fill(false); dp[0] = true; for (let i = 1; i <= s.length; i++) for (let j = 0; j < i; j++) if (dp[j] && wordSet.has(s.slice(j, i))) { dp[i] = true; break; } return dp[s.length]; }
    wordBreakII(s: string, wordDict: string[]): string[] { const wordSet = new Set(wordDict); const memo: Map<number, string[]> = new Map(); const backtrack = (start: number): string[] => { if (start === s.length) return ['']; if (memo.has(start)) return memo.get(start)!; const result: string[] = []; for (let end = start + 1; end <= s.length; end++) { const word = s.slice(start, end); if (wordSet.has(word)) { const subSentences = backtrack(end); for (const sub of subSentences) result.push(sub ? word + ' ' + sub : word); } } memo.set(start, result); return result; }; return backtrack(0); }
}
export const dimensionalWordBreakDP = DimensionalWordBreakDP.getInstance();
