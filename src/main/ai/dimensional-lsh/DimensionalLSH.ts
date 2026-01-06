/**
 * Dimensional LSH
 */
import { EventEmitter } from 'events';
export class DimensionalLSH extends EventEmitter {
    private bands: number;
    private rows: number;
    private buckets: Map<string, Set<string>>[] = [];
    constructor(bands: number = 20, rows: number = 5) { super(); this.bands = bands; this.rows = rows; for (let i = 0; i < bands; i++) this.buckets.push(new Map()); }
    private bandHash(signature: number[], band: number): string { const start = band * this.rows; const end = Math.min(start + this.rows, signature.length); return signature.slice(start, end).join(','); }
    index(id: string, signature: number[]): void { for (let b = 0; b < this.bands; b++) { const hash = this.bandHash(signature, b); if (!this.buckets[b].has(hash)) this.buckets[b].set(hash, new Set()); this.buckets[b].get(hash)!.add(id); } }
    query(signature: number[]): Set<string> { const candidates = new Set<string>(); for (let b = 0; b < this.bands; b++) { const hash = this.bandHash(signature, b); const bucket = this.buckets[b].get(hash); if (bucket) bucket.forEach(id => candidates.add(id)); } return candidates; }
    clear(): void { for (const bucket of this.buckets) bucket.clear(); }
}
export const createLSH = (bands?: number, rows?: number) => new DimensionalLSH(bands, rows);
