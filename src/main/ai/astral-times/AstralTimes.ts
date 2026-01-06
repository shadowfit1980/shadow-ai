/**
 * Astral Times
 */
import { EventEmitter } from 'events';
export class AstralTimes extends EventEmitter {
    private static instance: AstralTimes;
    private constructor() { super(); }
    static getInstance(): AstralTimes { if (!AstralTimes.instance) { AstralTimes.instance = new AstralTimes(); } return AstralTimes.instance; }
    times<T>(n: number, fn: (index: number) => T): T[] { return Array.from({ length: n }, (_, i) => fn(i)); }
    getStats(): { timed: number } { return { timed: 0 }; }
}
export const astralTimes = AstralTimes.getInstance();
