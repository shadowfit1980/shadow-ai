/**
 * Astral Compact Filter
 */
import { EventEmitter } from 'events';
export class AstralCompactFilter extends EventEmitter {
    private static instance: AstralCompactFilter;
    private constructor() { super(); }
    static getInstance(): AstralCompactFilter { if (!AstralCompactFilter.instance) { AstralCompactFilter.instance = new AstralCompactFilter(); } return AstralCompactFilter.instance; }
    compact<T>(arr: T[]): (Exclude<T, null | undefined | false | 0 | ''>)[] { return arr.filter(Boolean) as (Exclude<T, null | undefined | false | 0 | ''>)[]; }
    filterNullish<T>(arr: (T | null | undefined)[]): T[] { return arr.filter((x): x is T => x != null); }
    getStats(): { compacted: number } { return { compacted: 0 }; }
}
export const astralCompactFilter = AstralCompactFilter.getInstance();
