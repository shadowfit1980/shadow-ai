/**
 * Astral Drop Take
 */
import { EventEmitter } from 'events';
export class AstralDropTake extends EventEmitter {
    private static instance: AstralDropTake;
    private constructor() { super(); }
    static getInstance(): AstralDropTake { if (!AstralDropTake.instance) { AstralDropTake.instance = new AstralDropTake(); } return AstralDropTake.instance; }
    drop<T>(arr: T[], n: number = 1): T[] { return arr.slice(n); }
    dropRight<T>(arr: T[], n: number = 1): T[] { return arr.slice(0, -n || arr.length); }
    take<T>(arr: T[], n: number = 1): T[] { return arr.slice(0, n); }
    takeRight<T>(arr: T[], n: number = 1): T[] { return arr.slice(-n); }
    getStats(): { taken: number } { return { taken: 0 }; }
}
export const astralDropTake = AstralDropTake.getInstance();
