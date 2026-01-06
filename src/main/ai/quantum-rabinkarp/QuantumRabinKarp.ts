/**
 * Quantum Rabin Karp
 */
import { EventEmitter } from 'events';
export class QuantumRabinKarp extends EventEmitter {
    private static instance: QuantumRabinKarp;
    private prime = 101;
    private base = 256;
    private constructor() { super(); }
    static getInstance(): QuantumRabinKarp { if (!QuantumRabinKarp.instance) { QuantumRabinKarp.instance = new QuantumRabinKarp(); } return QuantumRabinKarp.instance; }
    search(text: string, pattern: string): number[] { const indices: number[] = []; const m = pattern.length, n = text.length; if (m > n) return indices; let patternHash = 0, textHash = 0, h = 1; for (let i = 0; i < m - 1; i++) h = (h * this.base) % this.prime; for (let i = 0; i < m; i++) { patternHash = (this.base * patternHash + pattern.charCodeAt(i)) % this.prime; textHash = (this.base * textHash + text.charCodeAt(i)) % this.prime; } for (let i = 0; i <= n - m; i++) { if (patternHash === textHash && text.slice(i, i + m) === pattern) indices.push(i); if (i < n - m) { textHash = (this.base * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % this.prime; if (textHash < 0) textHash += this.prime; } } return indices; }
    getStats(): { searched: number } { return { searched: 0 }; }
}
export const quantumRabinKarp = QuantumRabinKarp.getInstance();
