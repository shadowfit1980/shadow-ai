/**
 * Quantum LZ77
 */
import { EventEmitter } from 'events';
export interface LZ77Token { offset: number; length: number; next: string; }
export class QuantumLZ77 extends EventEmitter {
    private static instance: QuantumLZ77;
    private windowSize: number;
    private lookaheadSize: number;
    private constructor() { super(); this.windowSize = 4096; this.lookaheadSize = 18; }
    static getInstance(): QuantumLZ77 { if (!QuantumLZ77.instance) { QuantumLZ77.instance = new QuantumLZ77(); } return QuantumLZ77.instance; }
    setWindowSize(size: number): void { this.windowSize = size; }
    setLookaheadSize(size: number): void { this.lookaheadSize = size; }
    compress(text: string): LZ77Token[] { const tokens: LZ77Token[] = []; let pos = 0; while (pos < text.length) { let bestOffset = 0, bestLength = 0; const searchStart = Math.max(0, pos - this.windowSize); const searchEnd = pos; const lookaheadEnd = Math.min(text.length, pos + this.lookaheadSize); for (let i = searchStart; i < searchEnd; i++) { let matchLen = 0; while (pos + matchLen < lookaheadEnd && text[i + matchLen] === text[pos + matchLen]) matchLen++; if (matchLen > bestLength) { bestOffset = pos - i; bestLength = matchLen; } } const next = pos + bestLength < text.length ? text[pos + bestLength] : ''; tokens.push({ offset: bestOffset, length: bestLength, next }); pos += bestLength + 1; } return tokens; }
    decompress(tokens: LZ77Token[]): string { let result = ''; for (const token of tokens) { if (token.length > 0) { const start = result.length - token.offset; for (let i = 0; i < token.length; i++) result += result[start + i]; } result += token.next; } return result; }
}
export const quantumLZ77 = QuantumLZ77.getInstance();
