/**
 * Quantum MinHash
 */
import { EventEmitter } from 'events';
export class QuantumMinHash extends EventEmitter {
    private numHashes: number;
    private hashFunctions: ((s: string) => number)[];
    constructor(numHashes: number = 100) { super(); this.numHashes = numHashes; this.hashFunctions = []; for (let i = 0; i < numHashes; i++) { const a = Math.floor(Math.random() * 1000000) + 1; const b = Math.floor(Math.random() * 1000000); this.hashFunctions.push((s: string) => { let h = 0; for (let j = 0; j < s.length; j++) h = ((a * h + s.charCodeAt(j) + b) >>> 0) % 2147483647; return h; }); } }
    signature(set: Set<string>): number[] { return this.hashFunctions.map(h => { let minHash = Infinity; for (const item of set) minHash = Math.min(minHash, h(item)); return minHash === Infinity ? 0 : minHash; }); }
    jaccardSimilarity(sig1: number[], sig2: number[]): number { let matches = 0; for (let i = 0; i < this.numHashes; i++) if (sig1[i] === sig2[i]) matches++; return matches / this.numHashes; }
    estimateJaccard(set1: Set<string>, set2: Set<string>): number { return this.jaccardSimilarity(this.signature(set1), this.signature(set2)); }
}
export const createMinHash = (numHashes?: number) => new QuantumMinHash(numHashes);
