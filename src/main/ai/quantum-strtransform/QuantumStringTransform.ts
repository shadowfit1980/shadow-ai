/**
 * Quantum String Transform
 */
import { EventEmitter } from 'events';
export class QuantumStringTransform extends EventEmitter {
    private static instance: QuantumStringTransform;
    private constructor() { super(); }
    static getInstance(): QuantumStringTransform { if (!QuantumStringTransform.instance) { QuantumStringTransform.instance = new QuantumStringTransform(); } return QuantumStringTransform.instance; }
    minStickers(stickers: string[], target: string): number { const m = target.length; const dp: Map<string, number> = new Map([['', 0]]); const stickerCounts = stickers.map(s => { const count: number[] = new Array(26).fill(0); for (const c of s) count[c.charCodeAt(0) - 97]++; return count; }); const solve = (remaining: string): number => { if (dp.has(remaining)) return dp.get(remaining)!; const targetCount = new Array(26).fill(0); for (const c of remaining) targetCount[c.charCodeAt(0) - 97]++; let minStickers = Infinity; for (const sticker of stickerCounts) { if (sticker[remaining.charCodeAt(0) - 97] === 0) continue; let newRemaining = ''; for (let i = 0; i < 26; i++) { const need = Math.max(0, targetCount[i] - sticker[i]); newRemaining += String.fromCharCode(97 + i).repeat(need); } const sub = solve(newRemaining); if (sub !== -1) minStickers = Math.min(minStickers, 1 + sub); } dp.set(remaining, minStickers === Infinity ? -1 : minStickers); return dp.get(remaining)!; }; return solve(target); }
}
export const quantumStringTransform = QuantumStringTransform.getInstance();
