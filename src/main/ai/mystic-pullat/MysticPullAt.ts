/**
 * Mystic Pull At
 */
import { EventEmitter } from 'events';
export class MysticPullAt extends EventEmitter {
    private static instance: MysticPullAt;
    private constructor() { super(); }
    static getInstance(): MysticPullAt { if (!MysticPullAt.instance) { MysticPullAt.instance = new MysticPullAt(); } return MysticPullAt.instance; }
    pullAt<T>(arr: T[], ...indexes: number[]): T[] { const removed: T[] = []; const idxSet = new Set(indexes); for (const idx of indexes.sort((a, b) => b - a)) if (idx >= 0 && idx < arr.length) removed.unshift(arr[idx]); arr.splice(0, arr.length, ...arr.filter((_, i) => !idxSet.has(i))); return removed; }
    getStats(): { pulled: number } { return { pulled: 0 }; }
}
export const mysticPullAt = MysticPullAt.getInstance();
