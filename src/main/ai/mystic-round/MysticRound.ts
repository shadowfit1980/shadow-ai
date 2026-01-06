/**
 * Mystic Round
 */
import { EventEmitter } from 'events';
export class MysticRound extends EventEmitter {
    private static instance: MysticRound;
    private constructor() { super(); }
    static getInstance(): MysticRound { if (!MysticRound.instance) { MysticRound.instance = new MysticRound(); } return MysticRound.instance; }
    round(num: number, precision: number = 0): number { const mult = Math.pow(10, precision); return Math.round(num * mult) / mult; }
    floor(num: number, precision: number = 0): number { const mult = Math.pow(10, precision); return Math.floor(num * mult) / mult; }
    ceil(num: number, precision: number = 0): number { const mult = Math.pow(10, precision); return Math.ceil(num * mult) / mult; }
    getStats(): { rounded: number } { return { rounded: 0 }; }
}
export const mysticRound = MysticRound.getInstance();
