/**
 * Mystic Climbing Stairs
 */
import { EventEmitter } from 'events';
export class MysticClimbingStairs extends EventEmitter {
    private static instance: MysticClimbingStairs;
    private constructor() { super(); }
    static getInstance(): MysticClimbingStairs { if (!MysticClimbingStairs.instance) { MysticClimbingStairs.instance = new MysticClimbingStairs(); } return MysticClimbingStairs.instance; }
    climbStairs(n: number): number { if (n <= 2) return n; let prev = 1, curr = 2; for (let i = 3; i <= n; i++) [prev, curr] = [curr, prev + curr]; return curr; }
    minCostClimbingStairs(cost: number[]): number { const n = cost.length; let prev2 = cost[0], prev1 = cost[1]; for (let i = 2; i < n; i++) { const curr = cost[i] + Math.min(prev1, prev2); prev2 = prev1; prev1 = curr; } return Math.min(prev1, prev2); }
    tribonacci(n: number): number { if (n === 0) return 0; if (n <= 2) return 1; let t0 = 0, t1 = 1, t2 = 1; for (let i = 3; i <= n; i++) { const t3 = t0 + t1 + t2; t0 = t1; t1 = t2; t2 = t3; } return t2; }
    fibonacci(n: number): number { if (n <= 1) return n; let prev = 0, curr = 1; for (let i = 2; i <= n; i++) [prev, curr] = [curr, prev + curr]; return curr; }
}
export const mysticClimbingStairs = MysticClimbingStairs.getInstance();
