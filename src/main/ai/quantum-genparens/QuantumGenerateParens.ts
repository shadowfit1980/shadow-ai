/**
 * Quantum Generate Parentheses
 */
import { EventEmitter } from 'events';
export class QuantumGenerateParens extends EventEmitter {
    private static instance: QuantumGenerateParens;
    private constructor() { super(); }
    static getInstance(): QuantumGenerateParens { if (!QuantumGenerateParens.instance) { QuantumGenerateParens.instance = new QuantumGenerateParens(); } return QuantumGenerateParens.instance; }
    generateParenthesis(n: number): string[] { const result: string[] = []; const backtrack = (current: string, open: number, close: number): void => { if (current.length === 2 * n) { result.push(current); return; } if (open < n) backtrack(current + '(', open + 1, close); if (close < open) backtrack(current + ')', open, close + 1); }; backtrack('', 0, 0); return result; }
    isValid(s: string): boolean { let count = 0; for (const c of s) { if (c === '(') count++; else if (c === ')') count--; if (count < 0) return false; } return count === 0; }
    longestValidParentheses(s: string): number { const stack: number[] = [-1]; let maxLen = 0; for (let i = 0; i < s.length; i++) { if (s[i] === '(') { stack.push(i); } else { stack.pop(); if (stack.length === 0) { stack.push(i); } else { maxLen = Math.max(maxLen, i - stack[stack.length - 1]); } } } return maxLen; }
}
export const quantumGenerateParens = QuantumGenerateParens.getInstance();
