/**
 * Mystic Number Painting
 */
import { EventEmitter } from 'events';
export class MysticNumberPainting extends EventEmitter {
    private static instance: MysticNumberPainting;
    private constructor() { super(); }
    static getInstance(): MysticNumberPainting { if (!MysticNumberPainting.instance) { MysticNumberPainting.instance = new MysticNumberPainting(); } return MysticNumberPainting.instance; }
    minCost(n: number, cuts: number[]): number { cuts.push(0, n); cuts.sort((a, b) => a - b); const m = cuts.length; const dp = Array.from({ length: m }, () => new Array(m).fill(0)); for (let len = 2; len < m; len++) { for (let i = 0; i + len < m; i++) { const j = i + len; dp[i][j] = Infinity; for (let k = i + 1; k < j; k++) dp[i][j] = Math.min(dp[i][j], cuts[j] - cuts[i] + dp[i][k] + dp[k][j]); } } return dp[0][m - 1]; }
    minCostToPaint(costs: number[][], houses: number, colors: number, target: number): number { const INF = 1e9; const dp = Array.from({ length: houses }, () => Array.from({ length: colors + 1 }, () => new Array(target + 1).fill(INF))); for (let c = 1; c <= colors; c++) if (costs[0][c - 1] !== 0 || c === costs[0][c - 1]) dp[0][c][1] = costs[0][c - 1]; for (let i = 1; i < houses; i++) { for (let c = 1; c <= colors; c++) { for (let t = 1; t <= target; t++) { for (let prevC = 1; prevC <= colors; prevC++) { const prevT = prevC === c ? t : t - 1; if (prevT >= 1) dp[i][c][t] = Math.min(dp[i][c][t], dp[i - 1][prevC][prevT] + costs[i][c - 1]); } } } } let result = INF; for (let c = 1; c <= colors; c++) result = Math.min(result, dp[houses - 1][c][target]); return result >= INF ? -1 : result; }
}
export const mysticNumberPainting = MysticNumberPainting.getInstance();
