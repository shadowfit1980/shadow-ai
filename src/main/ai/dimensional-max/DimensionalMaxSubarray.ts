/**
 * Dimensional Max Subarray
 */
import { EventEmitter } from 'events';
export class DimensionalMaxSubarray extends EventEmitter {
    private static instance: DimensionalMaxSubarray;
    private constructor() { super(); }
    static getInstance(): DimensionalMaxSubarray { if (!DimensionalMaxSubarray.instance) { DimensionalMaxSubarray.instance = new DimensionalMaxSubarray(); } return DimensionalMaxSubarray.instance; }
    maxSum(arr: number[]): number { let maxSoFar = arr[0] || 0, maxEndingHere = arr[0] || 0; for (let i = 1; i < arr.length; i++) { maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]); maxSoFar = Math.max(maxSoFar, maxEndingHere); } return maxSoFar; }
    getStats(): { finds: number } { return { finds: 0 }; }
}
export const dimensionalMaxSubarray = DimensionalMaxSubarray.getInstance();
