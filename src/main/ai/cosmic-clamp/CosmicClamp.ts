/**
 * Cosmic Clamp
 */
import { EventEmitter } from 'events';
export class CosmicClamp extends EventEmitter {
    private static instance: CosmicClamp;
    private constructor() { super(); }
    static getInstance(): CosmicClamp { if (!CosmicClamp.instance) { CosmicClamp.instance = new CosmicClamp(); } return CosmicClamp.instance; }
    clamp(num: number, lower: number, upper: number): number { return Math.min(Math.max(num, lower), upper); }
    inRange(num: number, start: number, end?: number): boolean { if (end === undefined) { end = start; start = 0; } return num >= Math.min(start, end) && num < Math.max(start, end); }
    getStats(): { clamped: number } { return { clamped: 0 }; }
}
export const cosmicClamp = CosmicClamp.getInstance();
