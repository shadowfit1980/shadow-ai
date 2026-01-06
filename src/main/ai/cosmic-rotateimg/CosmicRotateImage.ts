/**
 * Cosmic Rotate Image
 */
import { EventEmitter } from 'events';
export class CosmicRotateImage extends EventEmitter {
    private static instance: CosmicRotateImage;
    private constructor() { super(); }
    static getInstance(): CosmicRotateImage { if (!CosmicRotateImage.instance) { CosmicRotateImage.instance = new CosmicRotateImage(); } return CosmicRotateImage.instance; }
    rotate(matrix: number[][]): void { const n = matrix.length; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]]; for (let i = 0; i < n; i++) matrix[i].reverse(); }
    rotateCounter(matrix: number[][]): void { const n = matrix.length; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]]; matrix.reverse(); }
    transpose(matrix: number[][]): number[][] { const m = matrix.length, n = matrix[0].length; const result = Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => matrix[j][i])); return result; }
    flipAndInvert(image: number[][]): number[][] { return image.map(row => row.reverse().map(x => 1 - x)); }
}
export const cosmicRotateImage = CosmicRotateImage.getInstance();
