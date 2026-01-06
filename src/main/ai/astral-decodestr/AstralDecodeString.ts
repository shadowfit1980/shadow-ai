/**
 * Astral Decode String
 */
import { EventEmitter } from 'events';
export class AstralDecodeString extends EventEmitter {
    private static instance: AstralDecodeString;
    private constructor() { super(); }
    static getInstance(): AstralDecodeString { if (!AstralDecodeString.instance) { AstralDecodeString.instance = new AstralDecodeString(); } return AstralDecodeString.instance; }
    decodeString(s: string): string { const countStack: number[] = []; const stringStack: string[] = []; let current = '', num = 0; for (const c of s) { if (c >= '0' && c <= '9') { num = num * 10 + parseInt(c); } else if (c === '[') { countStack.push(num); stringStack.push(current); num = 0; current = ''; } else if (c === ']') { const count = countStack.pop()!; const prev = stringStack.pop()!; current = prev + current.repeat(count); } else { current += c; } } return current; }
    decodeAtIndex(s: string, k: number): string { let size = 0; for (const c of s) { if (c >= '0' && c <= '9') size *= parseInt(c); else size++; } for (let i = s.length - 1; i >= 0; i--) { k %= size; const c = s[i]; if (k === 0 && c >= 'a' && c <= 'z') return c; if (c >= '0' && c <= '9') size /= parseInt(c); else size--; } return ''; }
}
export const astralDecodeString = AstralDecodeString.getInstance();
