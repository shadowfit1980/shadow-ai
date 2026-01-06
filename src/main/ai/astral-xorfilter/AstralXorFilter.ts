/**
 * Astral Xor Filter
 */
import { EventEmitter } from 'events';
export class AstralXorFilter extends EventEmitter {
    private fingerprints: Uint8Array;
    private size: number;
    constructor(size: number = 1000) { super(); this.size = size; this.fingerprints = new Uint8Array(size); }
    private hash(item: string, seed: number): number { let h = seed; for (let i = 0; i < item.length; i++) h = ((h << 5) - h + item.charCodeAt(i)) >>> 0; return h % this.size; }
    private fingerprint(item: string): number { let h = 0; for (let i = 0; i < item.length; i++) h = ((h * 31) + item.charCodeAt(i)) >>> 0; return h & 0xFF; }
    build(items: string[]): void { this.fingerprints.fill(0); for (const item of items) { const fp = this.fingerprint(item); const h0 = this.hash(item, 0); const h1 = this.hash(item, 1); const h2 = this.hash(item, 2); this.fingerprints[h0] ^= fp; this.fingerprints[h1] ^= fp; this.fingerprints[h2] ^= fp; } }
    contains(item: string): boolean { const fp = this.fingerprint(item); const h0 = this.hash(item, 0); const h1 = this.hash(item, 1); const h2 = this.hash(item, 2); return (this.fingerprints[h0] ^ this.fingerprints[h1] ^ this.fingerprints[h2]) === fp; }
}
export const createXorFilter = (size?: number) => new AstralXorFilter(size);
