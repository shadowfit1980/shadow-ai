/**
 * Cosmic Decode XOR
 */
import { EventEmitter } from 'events';
export class CosmicDecodeXOR extends EventEmitter {
    private static instance: CosmicDecodeXOR;
    private constructor() { super(); }
    static getInstance(): CosmicDecodeXOR { if (!CosmicDecodeXOR.instance) { CosmicDecodeXOR.instance = new CosmicDecodeXOR(); } return CosmicDecodeXOR.instance; }
    decode(encoded: number[], first: number): number[] { const result = [first]; for (let i = 0; i < encoded.length; i++) result.push(result[i] ^ encoded[i]); return result; }
    xorQueries(arr: number[], queries: [number, number][]): number[] { const prefix = [0]; for (const num of arr) prefix.push(prefix[prefix.length - 1] ^ num); return queries.map(([left, right]) => prefix[left] ^ prefix[right + 1]); }
    xorAllPairs(nums1: number[], nums2: number[]): number { let xor1 = 0, xor2 = 0; for (const n of nums1) xor1 ^= n; for (const n of nums2) xor2 ^= n; let result = 0; if (nums2.length % 2 === 1) result ^= xor1; if (nums1.length % 2 === 1) result ^= xor2; return result; }
    findMissingAndRepeated(nums: number[]): [number, number] { const n = nums.length; let xor = 0; for (let i = 1; i <= n; i++) xor ^= i; for (const num of nums) xor ^= num; const diff = xor & -xor; let a = 0, b = 0; for (let i = 1; i <= n; i++) { if (i & diff) a ^= i; else b ^= i; } for (const num of nums) { if (num & diff) a ^= num; else b ^= num; } for (const num of nums) if (num === a) return [a, b]; return [b, a]; }
}
export const cosmicDecodeXOR = CosmicDecodeXOR.getInstance();
