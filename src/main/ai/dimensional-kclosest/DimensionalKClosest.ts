/**
 * Dimensional K Closest Points
 */
import { EventEmitter } from 'events';
export class DimensionalKClosest extends EventEmitter {
    private static instance: DimensionalKClosest;
    private constructor() { super(); }
    static getInstance(): DimensionalKClosest { if (!DimensionalKClosest.instance) { DimensionalKClosest.instance = new DimensionalKClosest(); } return DimensionalKClosest.instance; }
    kClosest(points: number[][], k: number): number[][] { const dist = (p: number[]) => p[0] * p[0] + p[1] * p[1]; return points.sort((a, b) => dist(a) - dist(b)).slice(0, k); }
    kClosestQuickSelect(points: number[][], k: number): number[][] { const dist = (p: number[]) => p[0] * p[0] + p[1] * p[1]; const partition = (left: number, right: number): number => { const pivotDist = dist(points[right]); let i = left; for (let j = left; j < right; j++) if (dist(points[j]) < pivotDist) [points[i++], points[j]] = [points[j], points[i]];[points[i], points[right]] = [points[right], points[i]]; return i; }; let left = 0, right = points.length - 1; while (left < right) { const mid = partition(left, right); if (mid === k) break; if (mid < k) left = mid + 1; else right = mid - 1; } return points.slice(0, k); }
    closestPair(points: number[][]): [number[], number[]] { points.sort((a, b) => a[0] - b[0]); let minDist = Infinity; let result: [number[], number[]] = [points[0], points[1]]; for (let i = 0; i < points.length; i++) { for (let j = i + 1; j < points.length && points[j][0] - points[i][0] < minDist; j++) { const d = Math.sqrt((points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2); if (d < minDist) { minDist = d; result = [points[i], points[j]]; } } } return result; }
}
export const dimensionalKClosest = DimensionalKClosest.getInstance();
