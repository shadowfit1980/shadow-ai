/**
 * Dimensional Paint Houses
 */
import { EventEmitter } from 'events';
export class DimensionalPaintHouses extends EventEmitter {
    private static instance: DimensionalPaintHouses;
    private constructor() { super(); }
    static getInstance(): DimensionalPaintHouses { if (!DimensionalPaintHouses.instance) { DimensionalPaintHouses.instance = new DimensionalPaintHouses(); } return DimensionalPaintHouses.instance; }
    minCost(costs: number[][]): number { if (costs.length === 0) return 0; const dp = [...costs[0]]; for (let i = 1; i < costs.length; i++) { const prev = [...dp]; dp[0] = costs[i][0] + Math.min(prev[1], prev[2]); dp[1] = costs[i][1] + Math.min(prev[0], prev[2]); dp[2] = costs[i][2] + Math.min(prev[0], prev[1]); } return Math.min(...dp); }
    minCostII(costs: number[][]): number { if (costs.length === 0) return 0; const n = costs.length, k = costs[0].length; let dp = [...costs[0]]; for (let i = 1; i < n; i++) { const prev = [...dp]; let min1 = Infinity, min2 = Infinity, minIdx = -1; for (let j = 0; j < k; j++) { if (prev[j] < min1) { min2 = min1; min1 = prev[j]; minIdx = j; } else if (prev[j] < min2) { min2 = prev[j]; } } for (let j = 0; j < k; j++) dp[j] = costs[i][j] + (j === minIdx ? min2 : min1); } return Math.min(...dp); }
}
export const dimensionalPaintHouses = DimensionalPaintHouses.getInstance();
