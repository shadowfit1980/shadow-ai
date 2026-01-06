/**
 * Quantum Daily Temperatures
 */
import { EventEmitter } from 'events';
export class QuantumDailyTemps extends EventEmitter {
    private static instance: QuantumDailyTemps;
    private constructor() { super(); }
    static getInstance(): QuantumDailyTemps { if (!QuantumDailyTemps.instance) { QuantumDailyTemps.instance = new QuantumDailyTemps(); } return QuantumDailyTemps.instance; }
    dailyTemperatures(temperatures: number[]): number[] { const n = temperatures.length; const result = new Array(n).fill(0); const stack: number[] = []; for (let i = 0; i < n; i++) { while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[i]) { const j = stack.pop()!; result[j] = i - j; } stack.push(i); } return result; }
    nextGreaterElements(nums: number[]): number[] { const n = nums.length; const result = new Array(n).fill(-1); const stack: number[] = []; for (let i = 0; i < 2 * n; i++) { while (stack.length && nums[stack[stack.length - 1]] < nums[i % n]) { const j = stack.pop()!; result[j] = nums[i % n]; } if (i < n) stack.push(i); } return result; }
    largestRectangleArea(heights: number[]): number { const stack: number[] = []; let maxArea = 0; const extended = [...heights, 0]; for (let i = 0; i < extended.length; i++) { while (stack.length && extended[stack[stack.length - 1]] > extended[i]) { const h = extended[stack.pop()!]; const w = stack.length ? i - stack[stack.length - 1] - 1 : i; maxArea = Math.max(maxArea, h * w); } stack.push(i); } return maxArea; }
}
export const quantumDailyTemps = QuantumDailyTemps.getInstance();
