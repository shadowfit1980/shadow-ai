/**
 * Ethereal Letter Combinations
 */
import { EventEmitter } from 'events';
export class EtherealLetterCombinations extends EventEmitter {
    private static instance: EtherealLetterCombinations;
    private mapping: Record<string, string> = { '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl', '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz' };
    private constructor() { super(); }
    static getInstance(): EtherealLetterCombinations { if (!EtherealLetterCombinations.instance) { EtherealLetterCombinations.instance = new EtherealLetterCombinations(); } return EtherealLetterCombinations.instance; }
    letterCombinations(digits: string): string[] { if (!digits) return []; const result: string[] = []; this.backtrack(result, '', digits, 0); return result; }
    private backtrack(result: string[], current: string, digits: string, index: number): void { if (index === digits.length) { result.push(current); return; } for (const c of this.mapping[digits[index]] || '') this.backtrack(result, current + c, digits, index + 1); }
    getStats(): { generated: number } { return { generated: 0 }; }
}
export const etherealLetterCombinations = EtherealLetterCombinations.getInstance();
