/**
 * Astral Rabin-Karp
 */
import { EventEmitter } from 'events';
export class AstralRabinKarp extends EventEmitter {
    private static instance: AstralRabinKarp;
    private constructor() { super(); }
    static getInstance(): AstralRabinKarp { if (!AstralRabinKarp.instance) { AstralRabinKarp.instance = new AstralRabinKarp(); } return AstralRabinKarp.instance; }
    search(text: string, pattern: string): number[] { const indices: number[] = []; let idx = text.indexOf(pattern); while (idx >= 0) { indices.push(idx); idx = text.indexOf(pattern, idx + 1); } return indices; }
    getStats(): { searches: number } { return { searches: 0 }; }
}
export const astralRabinKarp = AstralRabinKarp.getInstance();
