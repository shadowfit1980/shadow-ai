/**
 * Mystic Aho Corasick Automaton
 */
import { EventEmitter } from 'events';
class ACANode { children: Map<string, number> = new Map(); fail: number = 0; output: number[] = []; }
export class MysticAhoCorasick extends EventEmitter {
    private nodes: ACANode[] = [];
    private patterns: string[] = [];
    constructor() { super(); this.nodes.push(new ACANode()); }
    addPattern(pattern: string, index?: number): void { let current = 0; for (const c of pattern) { if (!this.nodes[current].children.has(c)) { this.nodes[current].children.set(c, this.nodes.length); this.nodes.push(new ACANode()); } current = this.nodes[current].children.get(c)!; } const idx = index ?? this.patterns.length; this.nodes[current].output.push(idx); this.patterns.push(pattern); }
    build(): void { const queue: number[] = []; for (const [, child] of this.nodes[0].children) { this.nodes[child].fail = 0; queue.push(child); } while (queue.length) { const u = queue.shift()!; for (const [c, v] of this.nodes[u].children) { queue.push(v); let fail = this.nodes[u].fail; while (fail !== 0 && !this.nodes[fail].children.has(c)) fail = this.nodes[fail].fail; this.nodes[v].fail = this.nodes[fail].children.get(c) ?? 0; if (this.nodes[v].fail === v) this.nodes[v].fail = 0; this.nodes[v].output.push(...this.nodes[this.nodes[v].fail].output); } } }
    search(text: string): { pattern: number; position: number }[] { const results: { pattern: number; position: number }[] = []; let state = 0; for (let i = 0; i < text.length; i++) { const c = text[i]; while (state !== 0 && !this.nodes[state].children.has(c)) state = this.nodes[state].fail; state = this.nodes[state].children.get(c) ?? 0; for (const patternIdx of this.nodes[state].output) { results.push({ pattern: patternIdx, position: i - this.patterns[patternIdx].length + 1 }); } } return results; }
    getPatterns(): string[] { return this.patterns; }
}
export const createAhoCorasick = () => new MysticAhoCorasick();
