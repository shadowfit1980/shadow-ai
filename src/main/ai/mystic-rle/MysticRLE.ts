/**
 * Mystic Run Length Encoding
 */
import { EventEmitter } from 'events';
export class MysticRLE extends EventEmitter {
    private static instance: MysticRLE;
    private constructor() { super(); }
    static getInstance(): MysticRLE { if (!MysticRLE.instance) { MysticRLE.instance = new MysticRLE(); } return MysticRLE.instance; }
    encode(s: string): string { if (s.length === 0) return ''; let result = ''; let count = 1; for (let i = 1; i <= s.length; i++) { if (i < s.length && s[i] === s[i - 1]) { count++; } else { result += s[i - 1] + (count > 1 ? count.toString() : ''); count = 1; } } return result; }
    decode(s: string): string { let result = ''; let i = 0; while (i < s.length) { const char = s[i]; let count = ''; i++; while (i < s.length && s[i] >= '0' && s[i] <= '9') { count += s[i]; i++; } result += char.repeat(count ? parseInt(count) : 1); } return result; }
    encodeToArray(s: string): [string, number][] { if (s.length === 0) return []; const result: [string, number][] = []; let count = 1; for (let i = 1; i <= s.length; i++) { if (i < s.length && s[i] === s[i - 1]) { count++; } else { result.push([s[i - 1], count]); count = 1; } } return result; }
    decodeFromArray(arr: [string, number][]): string { return arr.map(([c, n]) => c.repeat(n)).join(''); }
}
export const mysticRLE = MysticRLE.getInstance();
