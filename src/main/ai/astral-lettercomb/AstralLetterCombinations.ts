/**
 * Astral Letter Combinations
 */
import { EventEmitter } from 'events';
export class AstralLetterCombinations extends EventEmitter {
    private static instance: AstralLetterCombinations;
    private phoneMap: Map<string, string>;
    private constructor() { super(); this.phoneMap = new Map([['2', 'abc'], ['3', 'def'], ['4', 'ghi'], ['5', 'jkl'], ['6', 'mno'], ['7', 'pqrs'], ['8', 'tuv'], ['9', 'wxyz']]); }
    static getInstance(): AstralLetterCombinations { if (!AstralLetterCombinations.instance) { AstralLetterCombinations.instance = new AstralLetterCombinations(); } return AstralLetterCombinations.instance; }
    letterCombinations(digits: string): string[] { if (digits.length === 0) return []; const result: string[] = []; const backtrack = (index: number, current: string): void => { if (index === digits.length) { result.push(current); return; } const letters = this.phoneMap.get(digits[index]) || ''; for (const letter of letters) backtrack(index + 1, current + letter); }; backtrack(0, ''); return result; }
    letterCombinationsIterative(digits: string): string[] { if (digits.length === 0) return []; let result = ['']; for (const digit of digits) { const letters = this.phoneMap.get(digit) || ''; const temp: string[] = []; for (const prefix of result) for (const letter of letters) temp.push(prefix + letter); result = temp; } return result; }
}
export const astralLetterCombinations = AstralLetterCombinations.getInstance();
