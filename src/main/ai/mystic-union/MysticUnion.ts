/**
 * Mystic Union
 */
import { EventEmitter } from 'events';
export class MysticUnion extends EventEmitter {
    private static instance: MysticUnion;
    private constructor() { super(); }
    static getInstance(): MysticUnion { if (!MysticUnion.instance) { MysticUnion.instance = new MysticUnion(); } return MysticUnion.instance; }
    union<T>(...arrays: T[][]): T[] { return [...new Set(arrays.flat())]; }
    getStats(): { unioned: number } { return { unioned: 0 }; }
}
export const mysticUnion = MysticUnion.getInstance();
