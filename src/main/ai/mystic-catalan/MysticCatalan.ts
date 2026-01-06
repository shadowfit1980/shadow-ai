/**
 * Mystic Catalan
 */
import { EventEmitter } from 'events';
export class MysticCatalan extends EventEmitter {
    private static instance: MysticCatalan;
    private memo: Map<number, number> = new Map();
    private constructor() { super(); }
    static getInstance(): MysticCatalan { if (!MysticCatalan.instance) { MysticCatalan.instance = new MysticCatalan(); } return MysticCatalan.instance; }
    catalan(n: number): number { if (n <= 1) return 1; if (this.memo.has(n)) return this.memo.get(n)!; let result = 0; for (let i = 0; i < n; i++) result += this.catalan(i) * this.catalan(n - 1 - i); this.memo.set(n, result); return result; }
    catalanDP(n: number): number[] { const dp = new Array(n + 1).fill(0); dp[0] = dp[1] = 1; for (let i = 2; i <= n; i++) for (let j = 0; j < i; j++) dp[i] += dp[j] * dp[i - 1 - j]; return dp; }
    numBSTs(n: number): number { return this.catalan(n); }
    validParentheses(n: number): number { return this.catalan(n); }
    dyckPaths(n: number): number { return this.catalan(n); }
    nonCrossingPartitions(n: number): number { return this.catalan(n); }
    triangulations(n: number): number { return n < 3 ? 0 : this.catalan(n - 2); }
}
export const mysticCatalan = MysticCatalan.getInstance();
