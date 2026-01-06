/**
 * Astral Jump Game III
 */
import { EventEmitter } from 'events';
export class AstralJumpGameIII extends EventEmitter {
    private static instance: AstralJumpGameIII;
    private constructor() { super(); }
    static getInstance(): AstralJumpGameIII { if (!AstralJumpGameIII.instance) { AstralJumpGameIII.instance = new AstralJumpGameIII(); } return AstralJumpGameIII.instance; }
    canReach(arr: number[], start: number): boolean { const n = arr.length; const visited = new Set<number>(); const queue = [start]; while (queue.length) { const i = queue.shift()!; if (arr[i] === 0) return true; if (visited.has(i)) continue; visited.add(i); if (i + arr[i] < n) queue.push(i + arr[i]); if (i - arr[i] >= 0) queue.push(i - arr[i]); } return false; }
    maxJumps(arr: number[], d: number): number { const n = arr.length; const dp = new Array(n).fill(-1); const solve = (i: number): number => { if (dp[i] !== -1) return dp[i]; dp[i] = 1; for (let j = i + 1; j <= Math.min(i + d, n - 1); j++) { if (arr[j] >= arr[i]) break; dp[i] = Math.max(dp[i], 1 + solve(j)); } for (let j = i - 1; j >= Math.max(0, i - d); j--) { if (arr[j] >= arr[i]) break; dp[i] = Math.max(dp[i], 1 + solve(j)); } return dp[i]; }; let maxJumps = 0; for (let i = 0; i < n; i++) maxJumps = Math.max(maxJumps, solve(i)); return maxJumps; }
}
export const astralJumpGameIII = AstralJumpGameIII.getInstance();
