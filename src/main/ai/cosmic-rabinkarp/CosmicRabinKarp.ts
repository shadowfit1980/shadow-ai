/**
 * Cosmic Rabin Karp
 */
import { EventEmitter } from 'events';
export class CosmicRabinKarp extends EventEmitter {
    private static instance: CosmicRabinKarp;
    private readonly prime = 101;
    private readonly base = 256;
    private constructor() { super(); }
    static getInstance(): CosmicRabinKarp { if (!CosmicRabinKarp.instance) { CosmicRabinKarp.instance = new CosmicRabinKarp(); } return CosmicRabinKarp.instance; }
    search(text: string, pattern: string): number[] { const n = text.length, m = pattern.length; if (m > n) return []; const result: number[] = []; let patternHash = 0, textHash = 0, h = 1; for (let i = 0; i < m - 1; i++) h = (h * this.base) % this.prime; for (let i = 0; i < m; i++) { patternHash = (this.base * patternHash + pattern.charCodeAt(i)) % this.prime; textHash = (this.base * textHash + text.charCodeAt(i)) % this.prime; } for (let i = 0; i <= n - m; i++) { if (patternHash === textHash && text.slice(i, i + m) === pattern) result.push(i); if (i < n - m) { textHash = (this.base * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % this.prime; if (textHash < 0) textHash += this.prime; } } return result; }
    longestDuplicateSubstring(s: string): string { let lo = 1, hi = s.length - 1, result = ''; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); const dup = this.findDuplicate(s, mid); if (dup) { result = dup; lo = mid + 1; } else { hi = mid - 1; } } return result; }
    private findDuplicate(s: string, len: number): string | null { const seen = new Map<number, number[]>(); const base = 26, mod = 1e9 + 7; let hash = 0, power = 1; for (let i = 0; i < len; i++) { hash = (hash * base + (s.charCodeAt(i) - 97)) % mod; if (i > 0) power = (power * base) % mod; } seen.set(hash, [0]); for (let i = 1; i <= s.length - len; i++) { hash = ((hash - (s.charCodeAt(i - 1) - 97) * power % mod + mod) * base + (s.charCodeAt(i + len - 1) - 97)) % mod; if (seen.has(hash)) { const str = s.slice(i, i + len); for (const j of seen.get(hash)!) if (s.slice(j, j + len) === str) return str; seen.get(hash)!.push(i); } else { seen.set(hash, [i]); } } return null; }
}
export const cosmicRabinKarp = CosmicRabinKarp.getInstance();
