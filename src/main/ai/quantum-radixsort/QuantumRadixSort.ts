/**
 * Quantum Radix Sort
 */
import { EventEmitter } from 'events';
export class QuantumRadixSort extends EventEmitter {
    private static instance: QuantumRadixSort;
    private constructor() { super(); }
    static getInstance(): QuantumRadixSort { if (!QuantumRadixSort.instance) { QuantumRadixSort.instance = new QuantumRadixSort(); } return QuantumRadixSort.instance; }
    lsdRadixSort(arr: number[]): number[] { if (arr.length <= 1) return arr; const max = Math.max(...arr); const result = [...arr]; for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) { const output = new Array(result.length); const count = new Array(10).fill(0); for (const num of result) count[Math.floor(num / exp) % 10]++; for (let i = 1; i < 10; i++) count[i] += count[i - 1]; for (let i = result.length - 1; i >= 0; i--) { const digit = Math.floor(result[i] / exp) % 10; output[count[digit] - 1] = result[i]; count[digit]--; } for (let i = 0; i < result.length; i++) result[i] = output[i]; } return result; }
    msdRadixSort(arr: number[]): number[] { const max = Math.max(...arr); const maxDigits = max === 0 ? 1 : Math.floor(Math.log10(max)) + 1; const getDigit = (num: number, pos: number): number => Math.floor(num / Math.pow(10, pos)) % 10; const sort = (arr: number[], pos: number): number[] => { if (arr.length <= 1 || pos < 0) return arr; const buckets: number[][] = Array.from({ length: 10 }, () => []); for (const num of arr) buckets[getDigit(num, pos)].push(num); const result: number[] = []; for (const bucket of buckets) result.push(...sort(bucket, pos - 1)); return result; }; return sort(arr, maxDigits - 1); }
    stringRadixSort(arr: string[]): string[] { const maxLen = Math.max(...arr.map(s => s.length)); const padded = arr.map(s => s.padEnd(maxLen, '\0')); for (let pos = maxLen - 1; pos >= 0; pos--) { const buckets: string[][] = Array.from({ length: 256 }, () => []); for (const s of padded) buckets[s.charCodeAt(pos)].push(s); padded.length = 0; for (const bucket of buckets) padded.push(...bucket); } return padded.map(s => s.replace(/\0/g, '')); }
}
export const quantumRadixSort = QuantumRadixSort.getInstance();
