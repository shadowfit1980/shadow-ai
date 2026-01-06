/**
 * Dimensional Is Type
 */
import { EventEmitter } from 'events';
export class DimensionalIsType extends EventEmitter {
    private static instance: DimensionalIsType;
    private constructor() { super(); }
    static getInstance(): DimensionalIsType { if (!DimensionalIsType.instance) { DimensionalIsType.instance = new DimensionalIsType(); } return DimensionalIsType.instance; }
    isArray(value: unknown): value is unknown[] { return Array.isArray(value); }
    isObject(value: unknown): value is object { return value !== null && typeof value === 'object' && !Array.isArray(value); }
    isString(value: unknown): value is string { return typeof value === 'string'; }
    isNumber(value: unknown): value is number { return typeof value === 'number' && !isNaN(value); }
    isBoolean(value: unknown): value is boolean { return typeof value === 'boolean'; }
    isFunction(value: unknown): value is (...args: unknown[]) => unknown { return typeof value === 'function'; }
    getStats(): { checked: number } { return { checked: 0 }; }
}
export const dimensionalIsType = DimensionalIsType.getInstance();
