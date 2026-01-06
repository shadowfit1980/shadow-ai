/**
 * Astral Suffix Array
 */
import { EventEmitter } from 'events';
export class AstralSuffixArray extends EventEmitter {
    private text: string;
    private suffixArr: number[];
    constructor(text: string) { super(); this.text = text; this.suffixArr = this.buildSuffixArray(); }
    private buildSuffixArray(): number[] { const n = this.text.length; const suffixes = Array.from({ length: n }, (_, i) => i); suffixes.sort((a, b) => this.text.slice(a).localeCompare(this.text.slice(b))); return suffixes; }
    search(pattern: string): number[] { const indices: number[] = []; let left = 0, right = this.suffixArr.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); const suffix = this.text.slice(this.suffixArr[mid]); if (suffix.startsWith(pattern)) { let i = mid; while (i >= 0 && this.text.slice(this.suffixArr[i]).startsWith(pattern)) indices.push(this.suffixArr[i--]); i = mid + 1; while (i < this.suffixArr.length && this.text.slice(this.suffixArr[i]).startsWith(pattern)) indices.push(this.suffixArr[i++]); break; } if (suffix < pattern) left = mid + 1; else right = mid - 1; } return indices.sort((a, b) => a - b); }
    getSuffixArray(): number[] { return [...this.suffixArr]; }
}
export const createSuffixArray = (text: string) => new AstralSuffixArray(text);
