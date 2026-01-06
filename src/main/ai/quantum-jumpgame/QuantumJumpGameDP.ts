/**
 * Quantum Jump Game
 */
import { EventEmitter } from 'events';
export class QuantumJumpGameDP extends EventEmitter {
    private static instance: QuantumJumpGameDP;
    private constructor() { super(); }
    static getInstance(): QuantumJumpGameDP { if (!QuantumJumpGameDP.instance) { QuantumJumpGameDP.instance = new QuantumJumpGameDP(); } return QuantumJumpGameDP.instance; }
    canJump(nums: number[]): boolean { let maxReach = 0; for (let i = 0; i < nums.length && i <= maxReach; i++) maxReach = Math.max(maxReach, i + nums[i]); return maxReach >= nums.length - 1; }
    jump(nums: number[]): number { let jumps = 0, currentEnd = 0, farthest = 0; for (let i = 0; i < nums.length - 1; i++) { farthest = Math.max(farthest, i + nums[i]); if (i === currentEnd) { jumps++; currentEnd = farthest; } } return jumps; }
    canCross(stones: number[]): boolean { const stoneSet = new Set(stones); const dp: Map<string, boolean> = new Map(); const canReach = (pos: number, k: number): boolean => { if (pos === stones[stones.length - 1]) return true; const key = `${pos},${k}`; if (dp.has(key)) return dp.get(key)!; for (const next of [k - 1, k, k + 1]) { if (next > 0 && stoneSet.has(pos + next) && canReach(pos + next, next)) { dp.set(key, true); return true; } } dp.set(key, false); return false; }; return canReach(0, 0); }
}
export const quantumJumpGameDP = QuantumJumpGameDP.getInstance();
