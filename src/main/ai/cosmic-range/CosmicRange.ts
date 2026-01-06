/**
 * Cosmic Range
 */
import { EventEmitter } from 'events';
export class CosmicRange extends EventEmitter {
    private static instance: CosmicRange;
    private constructor() { super(); }
    static getInstance(): CosmicRange { if (!CosmicRange.instance) { CosmicRange.instance = new CosmicRange(); } return CosmicRange.instance; }
    range(start: number, end?: number, step: number = 1): number[] { if (end === undefined) { end = start; start = 0; } const result: number[] = []; if (step > 0) for (let i = start; i < end; i += step) result.push(i); else for (let i = start; i > end; i += step) result.push(i); return result; }
    getStats(): { generated: number } { return { generated: 0 }; }
}
export const cosmicRange = CosmicRange.getInstance();
