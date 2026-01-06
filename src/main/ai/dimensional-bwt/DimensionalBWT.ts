/**
 * Dimensional Burrows-Wheeler
 */
import { EventEmitter } from 'events';
export class DimensionalBWT extends EventEmitter {
    private static instance: DimensionalBWT;
    private constructor() { super(); }
    static getInstance(): DimensionalBWT { if (!DimensionalBWT.instance) { DimensionalBWT.instance = new DimensionalBWT(); } return DimensionalBWT.instance; }
    transform(s: string): { bwt: string; index: number } { const text = s + '$'; const n = text.length; const rotations: number[] = Array.from({ length: n }, (_, i) => i); rotations.sort((a, b) => { for (let i = 0; i < n; i++) { const ca = text[(a + i) % n]; const cb = text[(b + i) % n]; if (ca < cb) return -1; if (ca > cb) return 1; } return 0; }); let bwt = ''; let index = 0; for (let i = 0; i < n; i++) { bwt += text[(rotations[i] + n - 1) % n]; if (rotations[i] === 0) index = i; } return { bwt, index }; }
    inverse(bwt: string, index: number): string { const n = bwt.length; const sorted = [...bwt].sort().join(''); const count: Map<string, number> = new Map(); const occ: number[] = []; for (const c of bwt) { occ.push(count.get(c) || 0); count.set(c, (count.get(c) || 0) + 1); } const first: Map<string, number> = new Map(); count.clear(); for (let i = 0; i < n; i++) { const c = sorted[i]; if (!first.has(c)) first.set(c, i); count.set(c, (count.get(c) || 0) + 1); } const lf = (i: number) => first.get(bwt[i])! + occ[i]; let result = ''; let pos = index; for (let i = 0; i < n - 1; i++) { pos = lf(pos); result = bwt[pos] + result; } return result; }
}
export const dimensionalBWT = DimensionalBWT.getInstance();
