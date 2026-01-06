/**
 * Cosmic Min Max By
 */
import { EventEmitter } from 'events';
export class CosmicMinMaxBy extends EventEmitter {
    private static instance: CosmicMinMaxBy;
    private constructor() { super(); }
    static getInstance(): CosmicMinMaxBy { if (!CosmicMinMaxBy.instance) { CosmicMinMaxBy.instance = new CosmicMinMaxBy(); } return CosmicMinMaxBy.instance; }
    minBy<T>(arr: T[], fn: (item: T) => number): T | undefined { if (arr.length === 0) return undefined; return arr.reduce((min, item) => fn(item) < fn(min) ? item : min); }
    maxBy<T>(arr: T[], fn: (item: T) => number): T | undefined { if (arr.length === 0) return undefined; return arr.reduce((max, item) => fn(item) > fn(max) ? item : max); }
    getStats(): { found: number } { return { found: 0 }; }
}
export const cosmicMinMaxBy = CosmicMinMaxBy.getInstance();
