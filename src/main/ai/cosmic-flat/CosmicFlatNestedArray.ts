/**
 * Cosmic Flat Nested Array
 */
import { EventEmitter } from 'events';
export class CosmicFlatNestedArray extends EventEmitter {
    private static instance: CosmicFlatNestedArray;
    private constructor() { super(); }
    static getInstance(): CosmicFlatNestedArray { if (!CosmicFlatNestedArray.instance) { CosmicFlatNestedArray.instance = new CosmicFlatNestedArray(); } return CosmicFlatNestedArray.instance; }
    flatten(arr: unknown[], depth: number = 1): unknown[] { if (depth === 0) return arr; return arr.reduce<unknown[]>((acc, val) => acc.concat(Array.isArray(val) ? this.flatten(val, depth - 1) : val), []); }
    getStats(): { flattened: number } { return { flattened: 0 }; }
}
export const cosmicFlatNestedArray = CosmicFlatNestedArray.getInstance();
