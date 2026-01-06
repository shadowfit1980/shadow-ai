/**
 * Quantum Reverse String
 */
import { EventEmitter } from 'events';
export class QuantumReverseString extends EventEmitter {
    private static instance: QuantumReverseString;
    private constructor() { super(); }
    static getInstance(): QuantumReverseString { if (!QuantumReverseString.instance) { QuantumReverseString.instance = new QuantumReverseString(); } return QuantumReverseString.instance; }
    reverseString(s: string[]): void { let left = 0, right = s.length - 1; while (left < right) { [s[left], s[right]] = [s[right], s[left]]; left++; right--; } }
    reverseWords(s: string): string { return s.trim().split(/\s+/).reverse().join(' '); }
    reverseWordsII(s: string[]): void { this.reverseString(s); let start = 0; for (let i = 0; i <= s.length; i++) { if (i === s.length || s[i] === ' ') { this.reverseRange(s, start, i - 1); start = i + 1; } } }
    private reverseRange(s: string[], left: number, right: number): void { while (left < right) { [s[left], s[right]] = [s[right], s[left]]; left++; right--; } }
    reverseVowels(s: string): string { const arr = s.split(''); const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']); let left = 0, right = arr.length - 1; while (left < right) { while (left < right && !vowels.has(arr[left])) left++; while (left < right && !vowels.has(arr[right])) right--;[arr[left], arr[right]] = [arr[right], arr[left]]; left++; right--; } return arr.join(''); }
}
export const quantumReverseString = QuantumReverseString.getInstance();
