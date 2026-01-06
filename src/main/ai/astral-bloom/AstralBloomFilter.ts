/**
 * Astral Bloom Filter
 */
import { EventEmitter } from 'events';
export class AstralBloomFilter extends EventEmitter {
    private static instance: AstralBloomFilter;
    private filter: Set<number> = new Set();
    private constructor() { super(); }
    static getInstance(): AstralBloomFilter { if (!AstralBloomFilter.instance) { AstralBloomFilter.instance = new AstralBloomFilter(); } return AstralBloomFilter.instance; }
    add(item: string): void { const h1 = this.hash1(item); const h2 = this.hash2(item); this.filter.add(h1); this.filter.add(h2); }
    mightContain(item: string): boolean { return this.filter.has(this.hash1(item)) && this.filter.has(this.hash2(item)); }
    private hash1(s: string): number { let h = 0; for (const c of s) h = ((h << 5) - h) + c.charCodeAt(0); return h & 0xffff; }
    private hash2(s: string): number { let h = 5381; for (const c of s) h = (h * 33) ^ c.charCodeAt(0); return h & 0xffff; }
    getStats(): { size: number } { return { size: this.filter.size }; }
}
export const astralBloomFilter = AstralBloomFilter.getInstance();
