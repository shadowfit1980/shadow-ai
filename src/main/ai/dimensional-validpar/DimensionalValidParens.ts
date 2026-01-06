/**
 * Dimensional Valid Parentheses
 */
import { EventEmitter } from 'events';
export class DimensionalValidParens extends EventEmitter {
    private static instance: DimensionalValidParens;
    private constructor() { super(); }
    static getInstance(): DimensionalValidParens { if (!DimensionalValidParens.instance) { DimensionalValidParens.instance = new DimensionalValidParens(); } return DimensionalValidParens.instance; }
    isValid(s: string): boolean { const stack: string[] = []; const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' }; for (const c of s) { if (c in map) { if (stack.pop() !== map[c]) return false; } else stack.push(c); } return stack.length === 0; }
    minAddToMakeValid(s: string): number { let open = 0, close = 0; for (const c of s) { if (c === '(') open++; else if (open > 0) open--; else close++; } return open + close; }
    removeInvalidParentheses(s: string): string[] { const result: string[] = []; let maxLen = 0; const isValid = (str: string): boolean => { let count = 0; for (const c of str) { if (c === '(') count++; else if (c === ')') count--; if (count < 0) return false; } return count === 0; }; const dfs = (idx: number, current: string, open: number, close: number): void => { if (idx === s.length) { if (open === close && isValid(current)) { if (current.length > maxLen) { result.length = 0; maxLen = current.length; } if (current.length === maxLen) result.push(current); } return; } const c = s[idx]; if (c === '(') { dfs(idx + 1, current + c, open + 1, close); dfs(idx + 1, current, open, close); } else if (c === ')') { dfs(idx + 1, current + c, open, close + 1); dfs(idx + 1, current, open, close); } else { dfs(idx + 1, current + c, open, close); } }; dfs(0, '', 0, 0); return [...new Set(result)]; }
}
export const dimensionalValidParens = DimensionalValidParens.getInstance();
