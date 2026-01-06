/**
 * Dimensional Monotonic Stack
 */
import { EventEmitter } from 'events';
export class DimensionalMonoStack extends EventEmitter {
    private static instance: DimensionalMonoStack;
    private constructor() { super(); }
    static getInstance(): DimensionalMonoStack { if (!DimensionalMonoStack.instance) { DimensionalMonoStack.instance = new DimensionalMonoStack(); } return DimensionalMonoStack.instance; }
    nextGreater(arr: number[]): number[] { const n = arr.length; const result = new Array(n).fill(-1); const stack: number[] = []; for (let i = 0; i < n; i++) { while (stack.length && arr[stack[stack.length - 1]] < arr[i]) result[stack.pop()!] = i; stack.push(i); } return result; }
    nextSmaller(arr: number[]): number[] { const n = arr.length; const result = new Array(n).fill(-1); const stack: number[] = []; for (let i = 0; i < n; i++) { while (stack.length && arr[stack[stack.length - 1]] > arr[i]) result[stack.pop()!] = i; stack.push(i); } return result; }
    prevGreater(arr: number[]): number[] { const n = arr.length; const result = new Array(n).fill(-1); const stack: number[] = []; for (let i = n - 1; i >= 0; i--) { while (stack.length && arr[stack[stack.length - 1]] < arr[i]) result[stack.pop()!] = i; stack.push(i); } return result; }
    prevSmaller(arr: number[]): number[] { const n = arr.length; const result = new Array(n).fill(-1); const stack: number[] = []; for (let i = n - 1; i >= 0; i--) { while (stack.length && arr[stack[stack.length - 1]] > arr[i]) result[stack.pop()!] = i; stack.push(i); } return result; }
    largestRectangleHistogram(heights: number[]): number { const n = heights.length; const left = new Array(n).fill(-1); const right = new Array(n).fill(n); const stack: number[] = []; for (let i = 0; i < n; i++) { while (stack.length && heights[stack[stack.length - 1]] >= heights[i]) right[stack.pop()!] = i; if (stack.length) left[i] = stack[stack.length - 1]; stack.push(i); } let maxArea = 0; for (let i = 0; i < n; i++) maxArea = Math.max(maxArea, heights[i] * (right[i] - left[i] - 1)); return maxArea; }
}
export const dimensionalMonoStack = DimensionalMonoStack.getInstance();
