/**
 * Astral Compressed Trie
 */
import { EventEmitter } from 'events';
interface CompressedNode { children: Map<string, CompressedNode>; isEnd: boolean; data?: unknown; }
export class AstralCompressedTrie extends EventEmitter {
    private root: CompressedNode;
    constructor() { super(); this.root = { children: new Map(), isEnd: false }; }
    insert(key: string, data?: unknown): void { let node = this.root; let remaining = key; while (remaining.length > 0) { let matched = false; for (const [edge, child] of node.children) { const commonLen = this.commonPrefixLength(remaining, edge); if (commonLen > 0) { if (commonLen === edge.length) { node = child; remaining = remaining.slice(commonLen); matched = true; break; } else { const newChild: CompressedNode = { children: new Map(), isEnd: false }; const oldEdge = edge.slice(commonLen); newChild.children.set(oldEdge, child); node.children.delete(edge); node.children.set(edge.slice(0, commonLen), newChild); node = newChild; remaining = remaining.slice(commonLen); matched = true; break; } } } if (!matched) { const newNode: CompressedNode = { children: new Map(), isEnd: true, data }; node.children.set(remaining, newNode); return; } } node.isEnd = true; node.data = data; }
    private commonPrefixLength(a: string, b: string): number { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
    search(key: string): { found: boolean; data?: unknown } { let node = this.root; let remaining = key; while (remaining.length > 0) { let matched = false; for (const [edge, child] of node.children) { if (remaining.startsWith(edge)) { node = child; remaining = remaining.slice(edge.length); matched = true; break; } } if (!matched) return { found: false }; } return { found: node.isEnd, data: node.data }; }
    startsWith(prefix: string): boolean { let node = this.root; let remaining = prefix; while (remaining.length > 0) { let matched = false; for (const [edge, child] of node.children) { const commonLen = this.commonPrefixLength(remaining, edge); if (commonLen > 0) { if (commonLen <= edge.length) return true; node = child; remaining = remaining.slice(edge.length); matched = true; break; } } if (!matched) return false; } return true; }
}
export const createCompressedTrie = () => new AstralCompressedTrie();
