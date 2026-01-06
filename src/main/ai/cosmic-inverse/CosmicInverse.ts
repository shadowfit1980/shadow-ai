/**
 * Cosmic Inverse Operations
 */
import { EventEmitter } from 'events';
export class CosmicInverse extends EventEmitter {
    private static instance: CosmicInverse;
    private constructor() { super(); }
    static getInstance(): CosmicInverse { if (!CosmicInverse.instance) { CosmicInverse.instance = new CosmicInverse(); } return CosmicInverse.instance; }
    countInversions<T>(arr: T[], compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)): number { let inversions = 0; const mergeSort = (arr: T[]): T[] => { if (arr.length <= 1) return arr; const mid = Math.floor(arr.length / 2); const left = mergeSort(arr.slice(0, mid)); const right = mergeSort(arr.slice(mid)); return merge(left, right); }; const merge = (left: T[], right: T[]): T[] => { const result: T[] = []; let i = 0, j = 0; while (i < left.length && j < right.length) { if (compare(left[i], right[j]) <= 0) { result.push(left[i++]); } else { inversions += left.length - i; result.push(right[j++]); } } return result.concat(left.slice(i)).concat(right.slice(j)); }; mergeSort([...arr]); return inversions; }
    inversionPairs<T>(arr: T[], compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)): [number, number][] { const pairs: [number, number][] = []; for (let i = 0; i < arr.length; i++) { for (let j = i + 1; j < arr.length; j++) { if (compare(arr[i], arr[j]) > 0) pairs.push([i, j]); } } return pairs; }
    kendallTau<T>(arr1: T[], arr2: T[]): number { const n = arr1.length; const rank1 = new Map<T, number>(); const rank2 = new Map<T, number>(); for (let i = 0; i < n; i++) { rank1.set(arr1[i], i); rank2.set(arr2[i], i); } let concordant = 0, discordant = 0; for (let i = 0; i < n; i++) { for (let j = i + 1; j < n; j++) { const r1i = rank1.get(arr1[i])!, r1j = rank1.get(arr1[j])!; const r2i = rank2.get(arr1[i])!, r2j = rank2.get(arr1[j])!; if ((r1i - r1j) * (r2i - r2j) > 0) concordant++; else discordant++; } } return (concordant - discordant) / (n * (n - 1) / 2); }
}
export const cosmicInverse = CosmicInverse.getInstance();
