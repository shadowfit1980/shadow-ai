/**
 * Cosmic Palindromic Tree
 */
import { EventEmitter } from 'events';
interface PalindromeNode { len: number; link: number; next: Map<string, number>; count: number; }
export class CosmicPalindromicTree extends EventEmitter {
    private nodes: PalindromeNode[] = [];
    private text: string = '';
    private last: number = 0;
    constructor() { super(); this.nodes.push({ len: -1, link: 0, next: new Map(), count: 0 }); this.nodes.push({ len: 0, link: 0, next: new Map(), count: 0 }); }
    private getSuffixLink(v: number): number { while (true) { const pos = this.text.length - 1 - this.nodes[v].len - 1; if (pos >= 0 && this.text[pos] === this.text[this.text.length - 1]) return v; v = this.nodes[v].link; } }
    add(c: string): void { this.text += c; let curr = this.getSuffixLink(this.last); if (!this.nodes[curr].next.has(c)) { const newNode = this.nodes.length; this.nodes.push({ len: this.nodes[curr].len + 2, link: 0, next: new Map(), count: 0 }); if (this.nodes[newNode].len === 1) { this.nodes[newNode].link = 1; } else { this.nodes[newNode].link = this.nodes[this.getSuffixLink(this.nodes[curr].link)].next.get(c)!; } this.nodes[curr].next.set(c, newNode); } this.last = this.nodes[curr].next.get(c)!; this.nodes[this.last].count++; }
    build(s: string): void { for (const c of s) this.add(c); }
    countDistinctPalindromes(): number { return this.nodes.length - 2; }
    countAllPalindromes(): number { let total = 0; for (let i = this.nodes.length - 1; i >= 2; i--) { this.nodes[this.nodes[i].link].count += this.nodes[i].count; total += this.nodes[i].count; } return total; }
}
export const createPalindromicTree = () => new CosmicPalindromicTree();
