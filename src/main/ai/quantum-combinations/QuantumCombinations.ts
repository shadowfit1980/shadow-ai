/**
 * Quantum Combinations
 */
import { EventEmitter } from 'events';
export class QuantumCombinations<T> extends EventEmitter {
    generate(arr: T[], k: number): T[][] { const result: T[][] = []; const combine = (start: number, current: T[]): void => { if (current.length === k) { result.push([...current]); return; } for (let i = start; i < arr.length; i++) { current.push(arr[i]); combine(i + 1, current); current.pop(); } }; combine(0, []); return result; }
    withRepetition(arr: T[], k: number): T[][] { const result: T[][] = []; const combine = (start: number, current: T[]): void => { if (current.length === k) { result.push([...current]); return; } for (let i = start; i < arr.length; i++) { current.push(arr[i]); combine(i, current); current.pop(); } }; combine(0, []); return result; }
    nextCombination(indices: number[], n: number): boolean { const k = indices.length; let i = k - 1; while (i >= 0 && indices[i] === n - k + i) i--; if (i < 0) return false; indices[i]++; for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1; return true; }
    indexToCombination(index: number, n: number, k: number): number[] { const result: number[] = []; let offset = 0; for (let i = 0; i < k; i++) { for (let j = offset; j < n; j++) { const count = this.nCr(n - j - 1, k - i - 1); if (index < count) { result.push(j); offset = j + 1; break; } index -= count; } } return result; }
    private nCr(n: number, r: number): number { if (r > n || r < 0) return 0; let result = 1; for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1); return Math.round(result); }
}
export const createCombinations = <T>() => new QuantumCombinations<T>();
