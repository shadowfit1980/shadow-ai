/**
 * Quantum Word Break
 */
import { EventEmitter } from 'events';
export class QuantumWordBreak extends EventEmitter {
    private static instance: QuantumWordBreak;
    private constructor() { super(); }
    static getInstance(): QuantumWordBreak { if (!QuantumWordBreak.instance) { QuantumWordBreak.instance = new QuantumWordBreak(); } return QuantumWordBreak.instance; }
    canBreak(s: string, wordDict: string[]): boolean { const wordSet = new Set(wordDict); const dp = new Array(s.length + 1).fill(false); dp[0] = true; for (let i = 1; i <= s.length; i++) { for (let j = 0; j < i; j++) { if (dp[j] && wordSet.has(s.slice(j, i))) { dp[i] = true; break; } } } return dp[s.length]; }
    allBreaks(s: string, wordDict: string[]): string[][] { const wordSet = new Set(wordDict); const memo: Map<number, string[][]> = new Map(); const backtrack = (start: number): string[][] => { if (start === s.length) return [[]]; if (memo.has(start)) return memo.get(start)!; const result: string[][] = []; for (let end = start + 1; end <= s.length; end++) { const word = s.slice(start, end); if (wordSet.has(word)) { const suffixes = backtrack(end); for (const suffix of suffixes) result.push([word, ...suffix]); } } memo.set(start, result); return result; }; return backtrack(0); }
    allBreaksSentences(s: string, wordDict: string[]): string[] { return this.allBreaks(s, wordDict).map(words => words.join(' ')); }
}
export const quantumWordBreak = QuantumWordBreak.getInstance();
