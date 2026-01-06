/**
 * Astral Free Fall
 */
import { EventEmitter } from 'events';
export class AstralFreeFall extends EventEmitter {
    private static instance: AstralFreeFall;
    private constructor() { super(); }
    static getInstance(): AstralFreeFall { if (!AstralFreeFall.instance) { AstralFreeFall.instance = new AstralFreeFall(); } return AstralFreeFall.instance; }
    fallingSquares(positions: number[][]): number[] { const result: number[] = []; const squares: { left: number; right: number; height: number }[] = []; let maxHeight = 0; for (const [left, sideLength] of positions) { const right = left + sideLength; let baseHeight = 0; for (const s of squares) { if (s.left < right && left < s.right) baseHeight = Math.max(baseHeight, s.height); } const newHeight = baseHeight + sideLength; squares.push({ left, right, height: newHeight }); maxHeight = Math.max(maxHeight, newHeight); result.push(maxHeight); } return result; }
    maxSumMinProduct(nums: number[]): number { const MOD = BigInt(1e9 + 7); const n = nums.length; const prefix = [0n]; for (const num of nums) prefix.push(prefix[prefix.length - 1] + BigInt(num)); const left = new Array(n).fill(-1); const right = new Array(n).fill(n); const stack: number[] = []; for (let i = 0; i < n; i++) { while (stack.length && nums[stack[stack.length - 1]] >= nums[i]) { right[stack.pop()!] = i; } if (stack.length) left[i] = stack[stack.length - 1]; stack.push(i); } let maxProduct = 0n; for (let i = 0; i < n; i++) { const sum = prefix[right[i]] - prefix[left[i] + 1]; const product = sum * BigInt(nums[i]); if (product > maxProduct) maxProduct = product; } return Number(maxProduct % MOD); }
}
export const astralFreeFall = AstralFreeFall.getInstance();
