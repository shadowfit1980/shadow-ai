/**
 * Ethereal Suffix Array
 */
import { EventEmitter } from 'events';
export class EtherealSuffixArray extends EventEmitter {
    private static instance: EtherealSuffixArray;
    private suffixes: { suffix: string; index: number }[] = [];
    private constructor() { super(); }
    static getInstance(): EtherealSuffixArray { if (!EtherealSuffixArray.instance) { EtherealSuffixArray.instance = new EtherealSuffixArray(); } return EtherealSuffixArray.instance; }
    build(s: string): void { this.suffixes = []; for (let i = 0; i < s.length; i++) this.suffixes.push({ suffix: s.slice(i), index: i }); this.suffixes.sort((a, b) => a.suffix.localeCompare(b.suffix)); }
    search(pattern: string): number[] { return this.suffixes.filter(s => s.suffix.startsWith(pattern)).map(s => s.index); }
    getStats(): { size: number } { return { size: this.suffixes.length }; }
}
export const etherealSuffixArray = EtherealSuffixArray.getInstance();
