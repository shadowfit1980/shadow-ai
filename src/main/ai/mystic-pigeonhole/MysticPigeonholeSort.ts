/**
 * Mystic Pigeonhole Sort
 */
import { EventEmitter } from 'events';
export class MysticPigeonholeSort extends EventEmitter {
    private static instance: MysticPigeonholeSort;
    private constructor() { super(); }
    static getInstance(): MysticPigeonholeSort { if (!MysticPigeonholeSort.instance) { MysticPigeonholeSort.instance = new MysticPigeonholeSort(); } return MysticPigeonholeSort.instance; }
    sort(arr: number[]): number[] { if (arr.length === 0) return []; const min = Math.min(...arr); const max = Math.max(...arr); const range = max - min + 1; const holes: number[][] = Array.from({ length: range }, () => []); for (const num of arr) holes[num - min].push(num); const result: number[] = []; for (const hole of holes) result.push(...hole); return result; }
    sortWithKey<T>(arr: T[], keyFn: (item: T) => number): T[] { if (arr.length === 0) return []; const keys = arr.map(keyFn); const min = Math.min(...keys); const max = Math.max(...keys); const range = max - min + 1; const holes: T[][] = Array.from({ length: range }, () => []); for (let i = 0; i < arr.length; i++) holes[keys[i] - min].push(arr[i]); return holes.flat(); }
}
export const mysticPigeonholeSort = MysticPigeonholeSort.getInstance();
