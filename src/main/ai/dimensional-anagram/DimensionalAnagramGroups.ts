/**
 * Dimensional Anagram Groups
 */
import { EventEmitter } from 'events';
export class DimensionalAnagramGroups extends EventEmitter {
    private static instance: DimensionalAnagramGroups;
    private constructor() { super(); }
    static getInstance(): DimensionalAnagramGroups { if (!DimensionalAnagramGroups.instance) { DimensionalAnagramGroups.instance = new DimensionalAnagramGroups(); } return DimensionalAnagramGroups.instance; }
    groupAnagrams(strs: string[]): string[][] { const map: Map<string, string[]> = new Map(); for (const str of strs) { const key = str.split('').sort().join(''); if (!map.has(key)) map.set(key, []); map.get(key)!.push(str); } return [...map.values()]; }
    isAnagram(s: string, t: string): boolean { if (s.length !== t.length) return false; const count: Record<string, number> = {}; for (const c of s) count[c] = (count[c] || 0) + 1; for (const c of t) { if (!count[c]) return false; count[c]--; } return true; }
    findAnagrams(s: string, p: string): number[] { const result: number[] = []; const pCount: number[] = new Array(26).fill(0); const sCount: number[] = new Array(26).fill(0); for (const c of p) pCount[c.charCodeAt(0) - 97]++; for (let i = 0; i < s.length; i++) { sCount[s.charCodeAt(i) - 97]++; if (i >= p.length) sCount[s.charCodeAt(i - p.length) - 97]--; if (pCount.every((v, idx) => v === sCount[idx])) result.push(i - p.length + 1); } return result; }
    minSteps(s: string, t: string): number { const count: number[] = new Array(26).fill(0); for (const c of s) count[c.charCodeAt(0) - 97]++; for (const c of t) count[c.charCodeAt(0) - 97]--; return count.filter(c => c > 0).reduce((a, b) => a + b, 0); }
}
export const dimensionalAnagramGroups = DimensionalAnagramGroups.getInstance();
