/**
 * Astral Slugify
 */
import { EventEmitter } from 'events';
export class AstralSlugify extends EventEmitter {
    private static instance: AstralSlugify;
    private constructor() { super(); }
    static getInstance(): AstralSlugify { if (!AstralSlugify.instance) { AstralSlugify.instance = new AstralSlugify(); } return AstralSlugify.instance; }
    slugify(str: string): string { return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''); }
    getStats(): { slugified: number } { return { slugified: 0 }; }
}
export const astralSlugify = AstralSlugify.getInstance();
