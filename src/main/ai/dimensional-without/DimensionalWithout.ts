/**
 * Dimensional Without
 */
import { EventEmitter } from 'events';
export class DimensionalWithout extends EventEmitter {
    private static instance: DimensionalWithout;
    private constructor() { super(); }
    static getInstance(): DimensionalWithout { if (!DimensionalWithout.instance) { DimensionalWithout.instance = new DimensionalWithout(); } return DimensionalWithout.instance; }
    without<T>(arr: T[], ...values: T[]): T[] { const excluded = new Set(values); return arr.filter(x => !excluded.has(x)); }
    getStats(): { filtered: number } { return { filtered: 0 }; }
}
export const dimensionalWithout = DimensionalWithout.getInstance();
