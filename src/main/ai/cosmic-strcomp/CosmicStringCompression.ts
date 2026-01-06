/**
 * Cosmic String Compression
 */
import { EventEmitter } from 'events';
export class CosmicStringCompression extends EventEmitter {
    private static instance: CosmicStringCompression;
    private constructor() { super(); }
    static getInstance(): CosmicStringCompression { if (!CosmicStringCompression.instance) { CosmicStringCompression.instance = new CosmicStringCompression(); } return CosmicStringCompression.instance; }
    compress(chars: string[]): number { let write = 0, read = 0; while (read < chars.length) { const char = chars[read]; let count = 0; while (read < chars.length && chars[read] === char) { read++; count++; } chars[write++] = char; if (count > 1) { const countStr = String(count); for (const c of countStr) chars[write++] = c; } } return write; }
    countAndSay(n: number): string { if (n === 1) return '1'; const prev = this.countAndSay(n - 1); let result = '', i = 0; while (i < prev.length) { const char = prev[i]; let count = 0; while (i < prev.length && prev[i] === char) { i++; count++; } result += String(count) + char; } return result; }
    encode(strs: string[]): string { return strs.map(s => s.length + '#' + s).join(''); }
    decode(s: string): string[] { const result: string[] = []; let i = 0; while (i < s.length) { let j = i; while (s[j] !== '#') j++; const len = parseInt(s.slice(i, j)); result.push(s.slice(j + 1, j + 1 + len)); i = j + 1 + len; } return result; }
}
export const cosmicStringCompression = CosmicStringCompression.getInstance();
