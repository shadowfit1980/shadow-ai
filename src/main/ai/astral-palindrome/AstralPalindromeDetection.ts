/**
 * Astral Palindrome Detection
 */
import { EventEmitter } from 'events';
export class AstralPalindromeDetection extends EventEmitter {
    private static instance: AstralPalindromeDetection;
    private constructor() { super(); }
    static getInstance(): AstralPalindromeDetection { if (!AstralPalindromeDetection.instance) { AstralPalindromeDetection.instance = new AstralPalindromeDetection(); } return AstralPalindromeDetection.instance; }
    isPalindrome(s: string): boolean { s = s.toLowerCase().replace(/[^a-z0-9]/g, ''); let left = 0, right = s.length - 1; while (left < right) if (s[left++] !== s[right--]) return false; return true; }
    validPalindrome(s: string): boolean { const check = (l: number, r: number, deleted: boolean): boolean => { while (l < r) { if (s[l] !== s[r]) return !deleted && (check(l + 1, r, true) || check(l, r - 1, true)); l++; r--; } return true; }; return check(0, s.length - 1, false); }
    longestPalindrome(s: string): string { let start = 0, maxLen = 0; const expand = (l: number, r: number): void => { while (l >= 0 && r < s.length && s[l] === s[r]) { if (r - l + 1 > maxLen) { start = l; maxLen = r - l + 1; } l--; r++; } }; for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); } return s.slice(start, start + maxLen); }
    countSubstrings(s: string): number { let count = 0; const expand = (l: number, r: number): void => { while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; } }; for (let i = 0; i < s.length; i++) { expand(i, i); expand(i, i + 1); } return count; }
}
export const astralPalindromeDetection = AstralPalindromeDetection.getInstance();
