/**
 * Cosmic Regular Expression
 */
import { EventEmitter } from 'events';
export class CosmicRegexMatch extends EventEmitter {
    private static instance: CosmicRegexMatch;
    private constructor() { super(); }
    static getInstance(): CosmicRegexMatch { if (!CosmicRegexMatch.instance) { CosmicRegexMatch.instance = new CosmicRegexMatch(); } return CosmicRegexMatch.instance; }
    isMatch(s: string, p: string): boolean { const m = s.length, n = p.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let j = 1; j <= n; j++) if (p[j - 1] === '*' && j >= 2) dp[0][j] = dp[0][j - 2]; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (p[j - 1] === '*') { dp[i][j] = dp[i][j - 2] || (this.matches(s[i - 1], p[j - 2]) && dp[i - 1][j]); } else if (this.matches(s[i - 1], p[j - 1])) { dp[i][j] = dp[i - 1][j - 1]; } } } return dp[m][n]; }
    private matches(c: string, p: string): boolean { return p === '.' || c === p; }
    isMatchNFA(s: string, p: string): boolean { const tokenize = (): { char: string; star: boolean }[] => { const tokens: { char: string; star: boolean }[] = []; let i = 0; while (i < p.length) { const char = p[i]; const star = p[i + 1] === '*'; tokens.push({ char, star }); i += star ? 2 : 1; } return tokens; }; const tokens = tokenize(); const match = (si: number, pi: number): boolean => { if (pi === tokens.length) return si === s.length; const token = tokens[pi]; if (token.star) { if (match(si, pi + 1)) return true; while (si < s.length && this.matches(s[si], token.char)) if (match(++si, pi + 1)) return true; return false; } return si < s.length && this.matches(s[si], token.char) && match(si + 1, pi + 1); }; return match(0, 0); }
}
export const cosmicRegexMatch = CosmicRegexMatch.getInstance();
