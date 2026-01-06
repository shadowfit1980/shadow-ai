/**
 * Quantum Regex Pattern
 */
import { EventEmitter } from 'events';
export class QuantumRegexPattern extends EventEmitter {
    private static instance: QuantumRegexPattern;
    private constructor() { super(); }
    static getInstance(): QuantumRegexPattern { if (!QuantumRegexPattern.instance) { QuantumRegexPattern.instance = new QuantumRegexPattern(); } return QuantumRegexPattern.instance; }
    match(text: string, pattern: string): boolean { const m = text.length, n = pattern.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let j = 1; j <= n; j++) if (pattern[j - 1] === '*') dp[0][j] = dp[0][j - 2]; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (pattern[j - 1] === text[i - 1] || pattern[j - 1] === '.') { dp[i][j] = dp[i - 1][j - 1]; } else if (pattern[j - 1] === '*') { dp[i][j] = dp[i][j - 2]; if (pattern[j - 2] === text[i - 1] || pattern[j - 2] === '.') dp[i][j] = dp[i][j] || dp[i - 1][j]; } } } return dp[m][n]; }
    wildcardMatch(text: string, pattern: string): boolean { const m = text.length, n = pattern.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let j = 1; j <= n; j++) if (pattern[j - 1] === '*') dp[0][j] = dp[0][j - 1]; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (pattern[j - 1] === text[i - 1] || pattern[j - 1] === '?') { dp[i][j] = dp[i - 1][j - 1]; } else if (pattern[j - 1] === '*') { dp[i][j] = dp[i - 1][j] || dp[i][j - 1]; } } } return dp[m][n]; }
}
export const quantumRegexPattern = QuantumRegexPattern.getInstance();
