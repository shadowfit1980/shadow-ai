/**
 * Mystic Reduce Right
 */
import { EventEmitter } from 'events';
export class MysticReduceRight extends EventEmitter {
    private static instance: MysticReduceRight;
    private constructor() { super(); }
    static getInstance(): MysticReduceRight { if (!MysticReduceRight.instance) { MysticReduceRight.instance = new MysticReduceRight(); } return MysticReduceRight.instance; }
    reduceRight<T, R>(arr: T[], fn: (acc: R, val: T, idx: number) => R, initial: R): R { let acc = initial; for (let i = arr.length - 1; i >= 0; i--) acc = fn(acc, arr[i], i); return acc; }
    getStats(): { reduced: number } { return { reduced: 0 }; }
}
export const mysticReduceRight = MysticReduceRight.getInstance();
