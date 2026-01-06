/**
 * Mystic Frog Jump DP
 */
import { EventEmitter } from 'events';
export class MysticFrogJumpDP extends EventEmitter {
    private static instance: MysticFrogJumpDP;
    private constructor() { super(); }
    static getInstance(): MysticFrogJumpDP { if (!MysticFrogJumpDP.instance) { MysticFrogJumpDP.instance = new MysticFrogJumpDP(); } return MysticFrogJumpDP.instance; }
    canCross(stones: number[]): boolean { if (stones[1] !== 1) return false; const stoneSet = new Set(stones); const target = stones[stones.length - 1]; const memo: Map<string, boolean> = new Map(); const dfs = (pos: number, k: number): boolean => { if (pos === target) return true; const key = `${pos},${k}`; if (memo.has(key)) return memo.get(key)!; for (const nextK of [k - 1, k, k + 1]) { if (nextK > 0 && stoneSet.has(pos + nextK) && dfs(pos + nextK, nextK)) { memo.set(key, true); return true; } } memo.set(key, false); return false; }; return dfs(1, 1); }
    minCostToReach(stones: number[]): number { const n = stones.length; const dp = Array.from({ length: n }, () => new Map<number, number>()); dp[0].set(0, 0); for (let i = 0; i < n; i++) { for (const [k, cost] of dp[i]) { for (const nextK of [k - 1, k, k + 1]) { if (nextK > 0) { for (let j = i + 1; j < n; j++) { const dist = stones[j] - stones[i]; if (dist === nextK) { const newCost = cost + Math.abs(dist - k); if (!dp[j].has(nextK) || dp[j].get(nextK)! > newCost) dp[j].set(nextK, newCost); } } } } } } return dp[n - 1].size > 0 ? Math.min(...dp[n - 1].values()) : -1; }
}
export const mysticFrogJumpDP = MysticFrogJumpDP.getInstance();
