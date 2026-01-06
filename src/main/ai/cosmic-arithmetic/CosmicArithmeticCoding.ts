/**
 * Cosmic Arithmetic Coding
 */
import { EventEmitter } from 'events';
export class CosmicArithmeticCoding extends EventEmitter {
    private static instance: CosmicArithmeticCoding;
    private constructor() { super(); }
    static getInstance(): CosmicArithmeticCoding { if (!CosmicArithmeticCoding.instance) { CosmicArithmeticCoding.instance = new CosmicArithmeticCoding(); } return CosmicArithmeticCoding.instance; }
    encode(text: string): { value: number; freq: Map<string, number>; length: number } { const freq: Map<string, number> = new Map(); for (const c of text) freq.set(c, (freq.get(c) || 0) + 1); const total = text.length; const cumulative: Map<string, { low: number; high: number }> = new Map(); let cumFreq = 0; for (const [char, f] of freq) { cumulative.set(char, { low: cumFreq / total, high: (cumFreq + f) / total }); cumFreq += f; } let low = 0, high = 1; for (const c of text) { const range = high - low; const { low: cLow, high: cHigh } = cumulative.get(c)!; high = low + range * cHigh; low = low + range * cLow; } return { value: (low + high) / 2, freq, length: text.length }; }
    decode(value: number, freq: Map<string, number>, length: number): string { const total = Array.from(freq.values()).reduce((a, b) => a + b, 0); const cumulative: { char: string; low: number; high: number }[] = []; let cumFreq = 0; for (const [char, f] of freq) { cumulative.push({ char, low: cumFreq / total, high: (cumFreq + f) / total }); cumFreq += f; } let result = ''; let low = 0, high = 1; for (let i = 0; i < length; i++) { const range = high - low; const scaledValue = (value - low) / range; for (const { char, low: cLow, high: cHigh } of cumulative) { if (scaledValue >= cLow && scaledValue < cHigh) { result += char; high = low + range * cHigh; low = low + range * cLow; break; } } } return result; }
}
export const cosmicArithmeticCoding = CosmicArithmeticCoding.getInstance();
