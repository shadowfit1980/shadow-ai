/**
 * Mystic House Robber
 */
import { EventEmitter } from 'events';
export class MysticHouseRobber extends EventEmitter {
    private static instance: MysticHouseRobber;
    private constructor() { super(); }
    static getInstance(): MysticHouseRobber { if (!MysticHouseRobber.instance) { MysticHouseRobber.instance = new MysticHouseRobber(); } return MysticHouseRobber.instance; }
    robLinear(nums: number[]): number { if (nums.length === 0) return 0; if (nums.length === 1) return nums[0]; let prev2 = 0, prev1 = nums[0]; for (let i = 1; i < nums.length; i++) { const curr = Math.max(prev1, prev2 + nums[i]); prev2 = prev1; prev1 = curr; } return prev1; }
    robCircular(nums: number[]): number { if (nums.length === 0) return 0; if (nums.length === 1) return nums[0]; return Math.max(this.robLinear(nums.slice(0, -1)), this.robLinear(nums.slice(1))); }
    robTree(root: { val: number; left?: unknown; right?: unknown } | null): number { const dfs = (node: unknown): [number, number] => { if (!node) return [0, 0]; const n = node as { val: number; left?: unknown; right?: unknown }; const [leftRob, leftSkip] = dfs(n.left); const [rightRob, rightSkip] = dfs(n.right); const rob = n.val + leftSkip + rightSkip; const skip = Math.max(leftRob, leftSkip) + Math.max(rightRob, rightSkip); return [rob, skip]; }; const [rob, skip] = dfs(root); return Math.max(rob, skip); }
}
export const mysticHouseRobber = MysticHouseRobber.getInstance();
