/**
 * Quantum Majority Element
 */
import { EventEmitter } from 'events';
export class QuantumMajorityElement extends EventEmitter {
    private static instance: QuantumMajorityElement;
    private constructor() { super(); }
    static getInstance(): QuantumMajorityElement { if (!QuantumMajorityElement.instance) { QuantumMajorityElement.instance = new QuantumMajorityElement(); } return QuantumMajorityElement.instance; }
    majorityElement(nums: number[]): number { let candidate = nums[0], count = 0; for (const num of nums) { if (count === 0) candidate = num; count += num === candidate ? 1 : -1; } return candidate; }
    majorityElementII(nums: number[]): number[] { let c1 = 0, c2 = 0, n1 = 0, n2 = 1; for (const num of nums) { if (num === n1) c1++; else if (num === n2) c2++; else if (c1 === 0) { n1 = num; c1 = 1; } else if (c2 === 0) { n2 = num; c2 = 1; } else { c1--; c2--; } } const result: number[] = []; const threshold = nums.length / 3; if (nums.filter(n => n === n1).length > threshold) result.push(n1); if (nums.filter(n => n === n2).length > threshold) result.push(n2); return result; }
    findDuplicate(nums: number[]): number { let slow = nums[0], fast = nums[0]; do { slow = nums[slow]; fast = nums[nums[fast]]; } while (slow !== fast); slow = nums[0]; while (slow !== fast) { slow = nums[slow]; fast = nums[fast]; } return slow; }
}
export const quantumMajorityElement = QuantumMajorityElement.getInstance();
