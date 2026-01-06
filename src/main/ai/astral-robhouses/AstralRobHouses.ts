/**
 * Astral Rob Houses
 */
import { EventEmitter } from 'events';
export class AstralRobHouses extends EventEmitter {
    private static instance: AstralRobHouses;
    private constructor() { super(); }
    static getInstance(): AstralRobHouses { if (!AstralRobHouses.instance) { AstralRobHouses.instance = new AstralRobHouses(); } return AstralRobHouses.instance; }
    rob(nums: number[]): number { let prev = 0, curr = 0; for (const num of nums) [prev, curr] = [curr, Math.max(curr, prev + num)]; return curr; }
    robCircular(nums: number[]): number { if (nums.length === 1) return nums[0]; const rob = (arr: number[]): number => { let prev = 0, curr = 0; for (const num of arr) [prev, curr] = [curr, Math.max(curr, prev + num)]; return curr; }; return Math.max(rob(nums.slice(1)), rob(nums.slice(0, -1))); }
    robTree(root: { val: number; left?: unknown; right?: unknown } | null): number { const dfs = (node: unknown): [number, number] => { if (!node) return [0, 0]; const n = node as { val: number; left?: unknown; right?: unknown }; const [leftRob, leftSkip] = dfs(n.left); const [rightRob, rightSkip] = dfs(n.right); const robThis = n.val + leftSkip + rightSkip; const skipThis = Math.max(leftRob, leftSkip) + Math.max(rightRob, rightSkip); return [robThis, skipThis]; }; const [rob, skip] = dfs(root); return Math.max(rob, skip); }
}
export const astralRobHouses = AstralRobHouses.getInstance();
