/**
 * Cosmic SimHash
 */
import { EventEmitter } from 'events';
export class CosmicSimHash extends EventEmitter {
    private static instance: CosmicSimHash;
    private bits: number;
    private constructor() { super(); this.bits = 64; }
    static getInstance(): CosmicSimHash { if (!CosmicSimHash.instance) { CosmicSimHash.instance = new CosmicSimHash(); } return CosmicSimHash.instance; }
    setBits(bits: number): void { this.bits = bits; }
    private tokenHash(token: string): bigint { let h = 0n; for (let i = 0; i < token.length; i++) h = (h * 31n + BigInt(token.charCodeAt(i))) & ((1n << BigInt(this.bits)) - 1n); return h; }
    hash(tokens: string[], weights?: Map<string, number>): bigint { const v = new Array(this.bits).fill(0); for (const token of tokens) { const h = this.tokenHash(token); const w = weights?.get(token) || 1; for (let i = 0; i < this.bits; i++) { if ((h >> BigInt(i)) & 1n) v[i] += w; else v[i] -= w; } } let result = 0n; for (let i = 0; i < this.bits; i++) if (v[i] > 0) result |= 1n << BigInt(i); return result; }
    hammingDistance(h1: bigint, h2: bigint): number { let xor = h1 ^ h2; let dist = 0; while (xor > 0n) { dist += Number(xor & 1n); xor >>= 1n; } return dist; }
    similarity(h1: bigint, h2: bigint): number { return 1 - this.hammingDistance(h1, h2) / this.bits; }
}
export const cosmicSimHash = CosmicSimHash.getInstance();
