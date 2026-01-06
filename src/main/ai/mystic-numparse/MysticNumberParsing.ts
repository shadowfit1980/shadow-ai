/**
 * Mystic Number Parsing
 */
import { EventEmitter } from 'events';
export class MysticNumberParsing extends EventEmitter {
    private static instance: MysticNumberParsing;
    private constructor() { super(); }
    static getInstance(): MysticNumberParsing { if (!MysticNumberParsing.instance) { MysticNumberParsing.instance = new MysticNumberParsing(); } return MysticNumberParsing.instance; }
    myAtoi(s: string): number { s = s.trim(); if (s.length === 0) return 0; let i = 0, sign = 1, result = 0; const INT_MAX = 2147483647, INT_MIN = -2147483648; if (s[i] === '-' || s[i] === '+') { sign = s[i] === '-' ? -1 : 1; i++; } while (i < s.length && s[i] >= '0' && s[i] <= '9') { const digit = parseInt(s[i]); if (result > (INT_MAX - digit) / 10) return sign === 1 ? INT_MAX : INT_MIN; result = result * 10 + digit; i++; } return sign * result; }
    isNumber(s: string): boolean { s = s.trim(); if (s.length === 0) return false; let numSeen = false, dotSeen = false, eSeen = false; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c >= '0' && c <= '9') { numSeen = true; } else if (c === '.') { if (eSeen || dotSeen) return false; dotSeen = true; } else if (c === 'e' || c === 'E') { if (eSeen || !numSeen) return false; eSeen = true; numSeen = false; } else if (c === '+' || c === '-') { if (i > 0 && s[i - 1] !== 'e' && s[i - 1] !== 'E') return false; } else { return false; } } return numSeen; }
    intToRoman(num: number): string { const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]; const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']; let result = ''; for (let i = 0; i < vals.length; i++) { while (num >= vals[i]) { num -= vals[i]; result += syms[i]; } } return result; }
    romanToInt(s: string): number { const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let result = 0; for (let i = 0; i < s.length; i++) { if (map[s[i]] < map[s[i + 1]]) result -= map[s[i]]; else result += map[s[i]]; } return result; }
}
export const mysticNumberParsing = MysticNumberParsing.getInstance();
