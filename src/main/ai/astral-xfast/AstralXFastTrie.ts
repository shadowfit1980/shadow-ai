/**
 * Astral X-Fast Trie
 */
import { EventEmitter } from 'events';
export class AstralXFastTrie extends EventEmitter {
    private levels: Map<number, number>[] = [];
    private leaves: Map<number, { prev: number | null; next: number | null }> = new Map();
    private bits: number;
    constructor(bits: number = 32) { super(); this.bits = bits; for (let i = 0; i <= bits; i++) this.levels.push(new Map()); }
    insert(x: number): void { let prefix = x; for (let i = this.bits; i >= 0; i--) { this.levels[i].set(prefix, x); prefix = prefix >> 1; } const prevKey = this.predecessor(x); const nextKey = this.successor(x); this.leaves.set(x, { prev: prevKey, next: nextKey }); if (prevKey !== null) { const prev = this.leaves.get(prevKey)!; prev.next = x; } if (nextKey !== null) { const next = this.leaves.get(nextKey)!; next.prev = x; } }
    member(x: number): boolean { return this.leaves.has(x); }
    predecessor(x: number): number | null { let lo = 0, hi = this.bits; while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); const prefix = x >> (this.bits - mid); if (this.levels[mid].has(prefix)) lo = mid; else hi = mid - 1; } if (lo === 0) return null; const prefix = x >> (this.bits - lo); const candidate = this.levels[lo].get(prefix); if (candidate !== undefined && candidate < x) return candidate; const leaf = this.leaves.get(candidate || 0); return leaf?.prev ?? null; }
    successor(x: number): number | null { let lo = 0, hi = this.bits; while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); const prefix = x >> (this.bits - mid); if (this.levels[mid].has(prefix)) lo = mid; else hi = mid - 1; } if (lo === 0) return this.leaves.size > 0 ? Math.min(...this.leaves.keys()) : null; const prefix = x >> (this.bits - lo); const candidate = this.levels[lo].get(prefix); if (candidate !== undefined && candidate > x) return candidate; const leaf = this.leaves.get(candidate || 0); return leaf?.next ?? null; }
}
export const createXFastTrie = (bits?: number) => new AstralXFastTrie(bits);
