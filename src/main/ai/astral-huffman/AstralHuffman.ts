/**
 * Astral Huffman Coding
 */
import { EventEmitter } from 'events';
interface HuffmanNode { char?: string; freq: number; left?: HuffmanNode; right?: HuffmanNode; }
export class AstralHuffman extends EventEmitter {
    private static instance: AstralHuffman;
    private constructor() { super(); }
    static getInstance(): AstralHuffman { if (!AstralHuffman.instance) { AstralHuffman.instance = new AstralHuffman(); } return AstralHuffman.instance; }
    buildTree(freq: Map<string, number>): HuffmanNode | null { const nodes: HuffmanNode[] = Array.from(freq.entries()).map(([char, f]) => ({ char, freq: f })); if (nodes.length === 0) return null; while (nodes.length > 1) { nodes.sort((a, b) => a.freq - b.freq); const left = nodes.shift()!; const right = nodes.shift()!; nodes.push({ freq: left.freq + right.freq, left, right }); } return nodes[0]; }
    buildCodes(root: HuffmanNode | null): Map<string, string> { const codes: Map<string, string> = new Map(); const traverse = (node: HuffmanNode, code: string): void => { if (node.char !== undefined) { codes.set(node.char, code || '0'); return; } if (node.left) traverse(node.left, code + '0'); if (node.right) traverse(node.right, code + '1'); }; if (root) traverse(root, ''); return codes; }
    encode(text: string): { encoded: string; tree: HuffmanNode | null } { const freq: Map<string, number> = new Map(); for (const c of text) freq.set(c, (freq.get(c) || 0) + 1); const tree = this.buildTree(freq); const codes = this.buildCodes(tree); let encoded = ''; for (const c of text) encoded += codes.get(c)!; return { encoded, tree }; }
    decode(encoded: string, tree: HuffmanNode | null): string { if (!tree) return ''; if (tree.char !== undefined) return tree.char.repeat(encoded.length); let result = ''; let node = tree; for (const bit of encoded) { node = bit === '0' ? node.left! : node.right!; if (node.char !== undefined) { result += node.char; node = tree; } } return result; }
}
export const astralHuffman = AstralHuffman.getInstance();
