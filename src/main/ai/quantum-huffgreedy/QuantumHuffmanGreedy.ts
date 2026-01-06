/**
 * Quantum Huffman Greedy
 */
import { EventEmitter } from 'events';
export class QuantumHuffmanGreedy extends EventEmitter {
    private static instance: QuantumHuffmanGreedy;
    private constructor() { super(); }
    static getInstance(): QuantumHuffmanGreedy { if (!QuantumHuffmanGreedy.instance) { QuantumHuffmanGreedy.instance = new QuantumHuffmanGreedy(); } return QuantumHuffmanGreedy.instance; }
    optimalMerge(sizes: number[]): number { const heap = [...sizes]; heap.sort((a, b) => a - b); let totalCost = 0; while (heap.length > 1) { const a = heap.shift()!; const b = heap.shift()!; const merged = a + b; totalCost += merged; let i = 0; while (i < heap.length && heap[i] < merged) i++; heap.splice(i, 0, merged); } return totalCost; }
    huffmanCoding(freq: Map<string, number>): Map<string, string> { if (freq.size === 0) return new Map(); if (freq.size === 1) { const key = freq.keys().next().value; return new Map([[key, '0']]); } type Node = { char?: string; freq: number; left?: Node; right?: Node }; const nodes: Node[] = []; for (const [char, f] of freq) nodes.push({ char, freq: f }); nodes.sort((a, b) => a.freq - b.freq); while (nodes.length > 1) { const a = nodes.shift()!; const b = nodes.shift()!; const merged: Node = { freq: a.freq + b.freq, left: a, right: b }; let i = 0; while (i < nodes.length && nodes[i].freq < merged.freq) i++; nodes.splice(i, 0, merged); } const codes = new Map<string, string>(); const traverse = (node: Node, code: string): void => { if (node.char !== undefined) { codes.set(node.char, code || '0'); return; } if (node.left) traverse(node.left, code + '0'); if (node.right) traverse(node.right, code + '1'); }; traverse(nodes[0], ''); return codes; }
}
export const quantumHuffmanGreedy = QuantumHuffmanGreedy.getInstance();
