/**
 * Cosmic Longest Substring
 */
import { EventEmitter } from 'events';
export class CosmicLongestSubstring extends EventEmitter {
    private static instance: CosmicLongestSubstring;
    private constructor() { super(); }
    static getInstance(): CosmicLongestSubstring { if (!CosmicLongestSubstring.instance) { CosmicLongestSubstring.instance = new CosmicLongestSubstring(); } return CosmicLongestSubstring.instance; }
    lengthOfLongestSubstring(s: string): number { const seen = new Map<string, number>(); let maxLength = 0, start = 0; for (let i = 0; i < s.length; i++) { if (seen.has(s[i]) && seen.get(s[i])! >= start) start = seen.get(s[i])! + 1; seen.set(s[i], i); maxLength = Math.max(maxLength, i - start + 1); } return maxLength; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const cosmicLongestSubstring = CosmicLongestSubstring.getInstance();
