/**
 * Dimensional Partial
 */
import { EventEmitter } from 'events';
export class DimensionalPartial extends EventEmitter {
    private static instance: DimensionalPartial;
    private constructor() { super(); }
    static getInstance(): DimensionalPartial { if (!DimensionalPartial.instance) { DimensionalPartial.instance = new DimensionalPartial(); } return DimensionalPartial.instance; }
    partial<T extends (...args: unknown[]) => unknown>(fn: T, ...presetArgs: unknown[]): (...args: unknown[]) => ReturnType<T> { return (...args: unknown[]) => fn(...presetArgs, ...args) as ReturnType<T>; }
    getStats(): { partialed: number } { return { partialed: 0 }; }
}
export const dimensionalPartial = DimensionalPartial.getInstance();
