/**
 * Quantum First Missing Positive
 */
import { EventEmitter } from 'events';
export class QuantumFirstMissingPositive extends EventEmitter {
    private static instance: QuantumFirstMissingPositive;
    private constructor() { super(); }
    static getInstance(): QuantumFirstMissingPositive { if (!QuantumFirstMissingPositive.instance) { QuantumFirstMissingPositive.instance = new QuantumFirstMissingPositive(); } return QuantumFirstMissingPositive.instance; }
    firstMissingPositive(nums: number[]): number { const n = nums.length; for (let i = 0; i < n; i++) while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) { const j = nums[i] - 1;[nums[i], nums[j]] = [nums[j], nums[i]]; } for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1; return n + 1; }
    getStats(): { found: number } { return { found: 0 }; }
}
export const quantumFirstMissingPositive = QuantumFirstMissingPositive.getInstance();
