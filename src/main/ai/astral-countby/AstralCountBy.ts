/**
 * Astral Count By
 */
import { EventEmitter } from 'events';
export class AstralCountBy extends EventEmitter {
    private static instance: AstralCountBy;
    private constructor() { super(); }
    static getInstance(): AstralCountBy { if (!AstralCountBy.instance) { AstralCountBy.instance = new AstralCountBy(); } return AstralCountBy.instance; }
    countBy<T>(arr: T[], fn: (item: T) => string): Record<string, number> { return arr.reduce((acc, item) => { const key = fn(item); acc[key] = (acc[key] || 0) + 1; return acc; }, {} as Record<string, number>); }
    getStats(): { counted: number } { return { counted: 0 }; }
}
export const astralCountBy = AstralCountBy.getInstance();
