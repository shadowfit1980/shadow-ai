/**
 * Mystic Paint House
 */
import { EventEmitter } from 'events';
export class MysticPaintHouse extends EventEmitter {
    private static instance: MysticPaintHouse;
    private constructor() { super(); }
    static getInstance(): MysticPaintHouse { if (!MysticPaintHouse.instance) { MysticPaintHouse.instance = new MysticPaintHouse(); } return MysticPaintHouse.instance; }
    minCost(costs: number[][]): number { if (costs.length === 0) return 0; const n = costs.length; const k = costs[0].length; const dp = [...costs[0]]; for (let i = 1; i < n; i++) { const newDp = new Array(k); for (let j = 0; j < k; j++) { newDp[j] = costs[i][j] + Math.min(...dp.filter((_, idx) => idx !== j)); } for (let j = 0; j < k; j++) dp[j] = newDp[j]; } return Math.min(...dp); }
    minCostOptimized(costs: number[][]): number { if (costs.length === 0) return 0; const n = costs.length; const k = costs[0].length; let min1 = 0, min2 = 0, minIdx = -1; for (let i = 0; i < n; i++) { let newMin1 = Infinity, newMin2 = Infinity, newMinIdx = -1; for (let j = 0; j < k; j++) { const cost = costs[i][j] + (j === minIdx ? min2 : min1); if (cost < newMin1) { newMin2 = newMin1; newMin1 = cost; newMinIdx = j; } else if (cost < newMin2) { newMin2 = cost; } } min1 = newMin1; min2 = newMin2; minIdx = newMinIdx; } return min1; }
}
export const mysticPaintHouse = MysticPaintHouse.getInstance();
