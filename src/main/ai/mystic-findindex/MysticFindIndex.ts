/**
 * Mystic Find Index
 */
import { EventEmitter } from 'events';
export class MysticFindIndex extends EventEmitter {
    private static instance: MysticFindIndex;
    private constructor() { super(); }
    static getInstance(): MysticFindIndex { if (!MysticFindIndex.instance) { MysticFindIndex.instance = new MysticFindIndex(); } return MysticFindIndex.instance; }
    findIndex<T>(arr: T[], predicate: (item: T) => boolean): number { for (let i = 0; i < arr.length; i++) if (predicate(arr[i])) return i; return -1; }
    findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number { for (let i = arr.length - 1; i >= 0; i--) if (predicate(arr[i])) return i; return -1; }
    getStats(): { found: number } { return { found: 0 }; }
}
export const mysticFindIndex = MysticFindIndex.getInstance();
