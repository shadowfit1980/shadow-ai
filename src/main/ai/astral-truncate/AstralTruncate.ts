/**
 * Astral Truncate
 */
import { EventEmitter } from 'events';
export class AstralTruncate extends EventEmitter {
    private static instance: AstralTruncate;
    private constructor() { super(); }
    static getInstance(): AstralTruncate { if (!AstralTruncate.instance) { AstralTruncate.instance = new AstralTruncate(); } return AstralTruncate.instance; }
    truncate(str: string, length: number, omission: string = '...'): string { if (str.length <= length) return str; return str.slice(0, length - omission.length) + omission; }
    getStats(): { truncated: number } { return { truncated: 0 }; }
}
export const astralTruncate = AstralTruncate.getInstance();
