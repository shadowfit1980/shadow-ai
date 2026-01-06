/**
 * Cosmic Palindrome Partitioner
 */
import { EventEmitter } from 'events';
export class CosmicPalindromePartitioner extends EventEmitter {
    private static instance: CosmicPalindromePartitioner;
    private constructor() { super(); }
    static getInstance(): CosmicPalindromePartitioner { if (!CosmicPalindromePartitioner.instance) { CosmicPalindromePartitioner.instance = new CosmicPalindromePartitioner(); } return CosmicPalindromePartitioner.instance; }
    partition(s: string): string[][] { const result: string[][] = []; this.backtrack(result, [], s, 0); return result; }
    private backtrack(result: string[][], current: string[], s: string, start: number): void { if (start === s.length) { result.push([...current]); return; } for (let end = start + 1; end <= s.length; end++) { const sub = s.substring(start, end); if (this.isPalindrome(sub)) { current.push(sub); this.backtrack(result, current, s, end); current.pop(); } } }
    private isPalindrome(s: string): boolean { let l = 0, r = s.length - 1; while (l < r) if (s[l++] !== s[r--]) return false; return true; }
    getStats(): { partitioned: number } { return { partitioned: 0 }; }
}
export const cosmicPalindromePartitioner = CosmicPalindromePartitioner.getInstance();
