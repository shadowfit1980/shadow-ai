/**
 * Ethereal Unique By
 */
import { EventEmitter } from 'events';
export class EtherealUniqueBy extends EventEmitter {
    private static instance: EtherealUniqueBy;
    private constructor() { super(); }
    static getInstance(): EtherealUniqueBy { if (!EtherealUniqueBy.instance) { EtherealUniqueBy.instance = new EtherealUniqueBy(); } return EtherealUniqueBy.instance; }
    uniqueBy<T>(arr: T[], fn: (item: T) => unknown): T[] { const seen = new Map<unknown, T>(); for (const item of arr) { const key = fn(item); if (!seen.has(key)) seen.set(key, item); } return [...seen.values()]; }
    getStats(): { uniqued: number } { return { uniqued: 0 }; }
}
export const etherealUniqueBy = EtherealUniqueBy.getInstance();
