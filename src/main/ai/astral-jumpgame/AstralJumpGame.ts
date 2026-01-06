/**
 * Astral Jump Game
 */
import { EventEmitter } from 'events';
export class AstralJumpGame extends EventEmitter {
    private static instance: AstralJumpGame;
    private constructor() { super(); }
    static getInstance(): AstralJumpGame { if (!AstralJumpGame.instance) { AstralJumpGame.instance = new AstralJumpGame(); } return AstralJumpGame.instance; }
    canJump(nums: number[]): boolean { let maxReach = 0; for (let i = 0; i < nums.length && i <= maxReach; i++) { maxReach = Math.max(maxReach, i + nums[i]); if (maxReach >= nums.length - 1) return true; } return false; }
    minJumps(nums: number[]): number { if (nums.length <= 1) return 0; let jumps = 0, currentEnd = 0, farthest = 0; for (let i = 0; i < nums.length - 1; i++) { farthest = Math.max(farthest, i + nums[i]); if (i === currentEnd) { jumps++; currentEnd = farthest; if (currentEnd >= nums.length - 1) break; } } return jumps; }
    canJumpWithK(nums: number[], k: number): boolean { const n = nums.length; const dp = new Array(n).fill(false); dp[0] = true; for (let i = 1; i < n; i++) { for (let j = Math.max(0, i - k); j < i; j++) { if (dp[j] && nums[j] + j >= i) { dp[i] = true; break; } } } return dp[n - 1]; }
    minCostJump(cost: number[]): number { const n = cost.length; if (n <= 2) return Math.min(...cost); const dp = [...cost]; for (let i = 2; i < n; i++) dp[i] = cost[i] + Math.min(dp[i - 1], dp[i - 2]); return Math.min(dp[n - 1], dp[n - 2]); }
}
export const astralJumpGame = AstralJumpGame.getInstance();
