/**
 * Mystic Levenshtein
 */
import { EventEmitter } from 'events';
export class MysticLevenshtein extends EventEmitter {
    private static instance: MysticLevenshtein;
    private constructor() { super(); }
    static getInstance(): MysticLevenshtein { if (!MysticLevenshtein.instance) { MysticLevenshtein.instance = new MysticLevenshtein(); } return MysticLevenshtein.instance; }
    distance(a: string, b: string): number { const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)); for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]); return dp[a.length][b.length]; }
    similarity(a: string, b: string): number { const maxLen = Math.max(a.length, b.length); return maxLen === 0 ? 1 : 1 - this.distance(a, b) / maxLen; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const mysticLevenshtein = MysticLevenshtein.getInstance();
