/**
 * Quantum Suffix Tree
 */
import { EventEmitter } from 'events';
interface SuffixEdge { start: number; end: number; target: number; }
export class QuantumSuffixTree extends EventEmitter {
    private text: string = '';
    private nodes: { edges: Map<string, SuffixEdge>; suffixLink: number }[] = [];
    constructor() { super(); this.nodes.push({ edges: new Map(), suffixLink: -1 }); }
    build(text: string): void { this.text = text + '$'; for (let i = 0; i < this.text.length; i++) this.addSuffix(i); }
    private addSuffix(start: number): void { let node = 0; for (let i = start; i < this.text.length; i++) { const c = this.text[i]; if (!this.nodes[node].edges.has(c)) { const newNode = this.nodes.length; this.nodes.push({ edges: new Map(), suffixLink: -1 }); this.nodes[node].edges.set(c, { start: i, end: this.text.length, target: newNode }); return; } const edge = this.nodes[node].edges.get(c)!; node = edge.target; } }
    contains(pattern: string): boolean { let node = 0; let pos = 0; while (pos < pattern.length) { const c = pattern[pos]; if (!this.nodes[node].edges.has(c)) return false; const edge = this.nodes[node].edges.get(c)!; const edgeLen = edge.end - edge.start; for (let i = 0; i < edgeLen && pos < pattern.length; i++, pos++) if (this.text[edge.start + i] !== pattern[pos]) return false; node = edge.target; } return true; }
    countOccurrences(pattern: string): number { let node = 0; let pos = 0; while (pos < pattern.length) { const c = pattern[pos]; if (!this.nodes[node].edges.has(c)) return 0; const edge = this.nodes[node].edges.get(c)!; const edgeLen = edge.end - edge.start; for (let i = 0; i < edgeLen && pos < pattern.length; i++, pos++) if (this.text[edge.start + i] !== pattern[pos]) return 0; node = edge.target; } return this.countLeaves(node); }
    private countLeaves(node: number): number { if (this.nodes[node].edges.size === 0) return 1; let count = 0; for (const edge of this.nodes[node].edges.values()) count += this.countLeaves(edge.target); return count; }
}
export const createSuffixTree = () => new QuantumSuffixTree();
