/**
 * Ethereal Key By
 */
import { EventEmitter } from 'events';
export class EtherealKeyBy extends EventEmitter {
    private static instance: EtherealKeyBy;
    private constructor() { super(); }
    static getInstance(): EtherealKeyBy { if (!EtherealKeyBy.instance) { EtherealKeyBy.instance = new EtherealKeyBy(); } return EtherealKeyBy.instance; }
    keyBy<T>(arr: T[], fn: (item: T) => string): Record<string, T> { return arr.reduce((acc, item) => { acc[fn(item)] = item; return acc; }, {} as Record<string, T>); }
    getStats(): { keyed: number } { return { keyed: 0 }; }
}
export const etherealKeyBy = EtherealKeyBy.getInstance();
