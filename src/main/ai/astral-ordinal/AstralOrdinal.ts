/**
 * Astral Ordinal
 */
import { EventEmitter } from 'events';
export class AstralOrdinal extends EventEmitter {
    private static instance: AstralOrdinal;
    private constructor() { super(); }
    static getInstance(): AstralOrdinal { if (!AstralOrdinal.instance) { AstralOrdinal.instance = new AstralOrdinal(); } return AstralOrdinal.instance; }
    ordinal(num: number): string { const s = ['th', 'st', 'nd', 'rd']; const v = num % 100; return num + (s[(v - 20) % 10] || s[v] || s[0]); }
    getStats(): { formatted: number } { return { formatted: 0 }; }
}
export const astralOrdinal = AstralOrdinal.getInstance();
