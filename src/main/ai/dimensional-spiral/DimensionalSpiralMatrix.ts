/**
 * Dimensional Spiral Matrix
 */
import { EventEmitter } from 'events';
export class DimensionalSpiralMatrix extends EventEmitter {
    private static instance: DimensionalSpiralMatrix;
    private constructor() { super(); }
    static getInstance(): DimensionalSpiralMatrix { if (!DimensionalSpiralMatrix.instance) { DimensionalSpiralMatrix.instance = new DimensionalSpiralMatrix(); } return DimensionalSpiralMatrix.instance; }
    spiralOrder(matrix: number[][]): number[] { if (matrix.length === 0) return []; const result: number[] = []; let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1; while (top <= bottom && left <= right) { for (let i = left; i <= right; i++) result.push(matrix[top][i]); top++; for (let i = top; i <= bottom; i++) result.push(matrix[i][right]); right--; if (top <= bottom) { for (let i = right; i >= left; i--) result.push(matrix[bottom][i]); bottom--; } if (left <= right) { for (let i = bottom; i >= top; i--) result.push(matrix[i][left]); left++; } } return result; }
    getStats(): { traversed: number } { return { traversed: 0 }; }
}
export const dimensionalSpiralMatrix = DimensionalSpiralMatrix.getInstance();
