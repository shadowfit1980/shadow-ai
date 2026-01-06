/**
 * Dimensional Maximum XOR
 */
import { EventEmitter } from 'events';
class TrieNode { children: (TrieNode | null)[] = [null, null]; }
export class DimensionalMaxXOR extends EventEmitter {
    private root: TrieNode = new TrieNode();
    constructor() { super(); }
    insert(num: number): void { let node = this.root; for (let i = 31; i >= 0; i--) { const bit = (num >> i) & 1; if (!node.children[bit]) node.children[bit] = new TrieNode(); node = node.children[bit]!; } }
    findMaxXOR(num: number): number { let node = this.root; let maxXOR = 0; for (let i = 31; i >= 0; i--) { const bit = (num >> i) & 1; const oppositeBit = 1 - bit; if (node.children[oppositeBit]) { maxXOR |= (1 << i); node = node.children[oppositeBit]!; } else if (node.children[bit]) { node = node.children[bit]!; } else { break; } } return maxXOR; }
    findMaximumXOR(nums: number[]): number { if (nums.length === 0) return 0; for (const num of nums) this.insert(num); let maxXOR = 0; for (const num of nums) maxXOR = Math.max(maxXOR, this.findMaxXOR(num)); return maxXOR; }
    reset(): void { this.root = new TrieNode(); }
}
export const createMaxXOR = () => new DimensionalMaxXOR();
