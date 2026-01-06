/**
 * Dimensional Soup Servings
 */
import { EventEmitter } from 'events';
export class DimensionalSoupServings extends EventEmitter {
    private static instance: DimensionalSoupServings;
    private memo: Map<string, number> = new Map();
    private constructor() { super(); }
    static getInstance(): DimensionalSoupServings { if (!DimensionalSoupServings.instance) { DimensionalSoupServings.instance = new DimensionalSoupServings(); } return DimensionalSoupServings.instance; }
    soupServings(n: number): number { if (n > 4800) return 1; return this.serve(Math.ceil(n / 25), Math.ceil(n / 25)); }
    private serve(a: number, b: number): number { if (a <= 0 && b <= 0) return 0.5; if (a <= 0) return 1; if (b <= 0) return 0; const key = `${a},${b}`; if (this.memo.has(key)) return this.memo.get(key)!; const result = 0.25 * (this.serve(a - 4, b) + this.serve(a - 3, b - 1) + this.serve(a - 2, b - 2) + this.serve(a - 1, b - 3)); this.memo.set(key, result); return result; }
    clearMemo(): void { this.memo.clear(); }
}
export const dimensionalSoupServings = DimensionalSoupServings.getInstance();
