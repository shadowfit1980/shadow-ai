/**
 * Quantum Next Permutation
 */
import { EventEmitter } from 'events';
export class QuantumNextPermutation extends EventEmitter {
    private static instance: QuantumNextPermutation;
    private constructor() { super(); }
    static getInstance(): QuantumNextPermutation { if (!QuantumNextPermutation.instance) { QuantumNextPermutation.instance = new QuantumNextPermutation(); } return QuantumNextPermutation.instance; }
    nextPermutation(nums: number[]): void { let i = nums.length - 2; while (i >= 0 && nums[i] >= nums[i + 1]) i--; if (i >= 0) { let j = nums.length - 1; while (nums[j] <= nums[i]) j--;[nums[i], nums[j]] = [nums[j], nums[i]]; } this.reverse(nums, i + 1); }
    private reverse(nums: number[], start: number): void { let end = nums.length - 1; while (start < end) { [nums[start], nums[end]] = [nums[end], nums[start]]; start++; end--; } }
    getPermutation(n: number, k: number): string { const factorial = [1]; for (let i = 1; i <= n; i++) factorial.push(factorial[i - 1] * i); const nums = Array.from({ length: n }, (_, i) => i + 1); k--; let result = ''; for (let i = n; i > 0; i--) { const index = Math.floor(k / factorial[i - 1]); result += nums[index]; nums.splice(index, 1); k %= factorial[i - 1]; } return result; }
    permutations<T>(arr: T[]): T[][] { const result: T[][] = []; const permute = (start: number): void => { if (start === arr.length) { result.push([...arr]); return; } for (let i = start; i < arr.length; i++) { [arr[start], arr[i]] = [arr[i], arr[start]]; permute(start + 1);[arr[start], arr[i]] = [arr[i], arr[start]]; } }; permute(0); return result; }
}
export const quantumNextPermutation = QuantumNextPermutation.getInstance();
