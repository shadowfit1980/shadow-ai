/**
 * Mystic Aho-Corasick
 */
import { EventEmitter } from 'events';
export class MysticAhoCorasick extends EventEmitter {
    private static instance: MysticAhoCorasick;
    private patterns: string[] = [];
    private constructor() { super(); }
    static getInstance(): MysticAhoCorasick { if (!MysticAhoCorasick.instance) { MysticAhoCorasick.instance = new MysticAhoCorasick(); } return MysticAhoCorasick.instance; }
    addPattern(pattern: string): void { this.patterns.push(pattern); }
    search(text: string): { pattern: string; index: number }[] { const results: { pattern: string; index: number }[] = []; for (const p of this.patterns) { let idx = text.indexOf(p); while (idx >= 0) { results.push({ pattern: p, index: idx }); idx = text.indexOf(p, idx + 1); } } return results; }
    getStats(): { patterns: number } { return { patterns: this.patterns.length }; }
}
export const mysticAhoCorasick = MysticAhoCorasick.getInstance();
