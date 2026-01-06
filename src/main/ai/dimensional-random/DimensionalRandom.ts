/**
 * Dimensional Random
 */
import { EventEmitter } from 'events';
export class DimensionalRandom extends EventEmitter {
    private static instance: DimensionalRandom;
    private constructor() { super(); }
    static getInstance(): DimensionalRandom { if (!DimensionalRandom.instance) { DimensionalRandom.instance = new DimensionalRandom(); } return DimensionalRandom.instance; }
    random(lower: number = 0, upper: number = 1, floating: boolean = false): number { if (floating || lower % 1 !== 0 || upper % 1 !== 0) return Math.random() * (upper - lower) + lower; return Math.floor(Math.random() * (upper - lower + 1)) + lower; }
    getStats(): { generated: number } { return { generated: 0 }; }
}
export const dimensionalRandom = DimensionalRandom.getInstance();
