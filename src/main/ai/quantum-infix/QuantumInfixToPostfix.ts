/**
 * Quantum Infix to Postfix
 */
import { EventEmitter } from 'events';
export class QuantumInfixToPostfix extends EventEmitter {
    private static instance: QuantumInfixToPostfix;
    private precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
    private constructor() { super(); }
    static getInstance(): QuantumInfixToPostfix { if (!QuantumInfixToPostfix.instance) { QuantumInfixToPostfix.instance = new QuantumInfixToPostfix(); } return QuantumInfixToPostfix.instance; }
    convert(infix: string): string { const output: string[] = []; const stack: string[] = []; for (const c of infix) { if (/[a-zA-Z0-9]/.test(c)) output.push(c); else if (c === '(') stack.push(c); else if (c === ')') { while (stack.length && stack[stack.length - 1] !== '(') output.push(stack.pop()!); stack.pop(); } else { while (stack.length && (this.precedence[stack[stack.length - 1]] || 0) >= (this.precedence[c] || 0)) output.push(stack.pop()!); stack.push(c); } } while (stack.length) output.push(stack.pop()!); return output.join(''); }
    getStats(): { converted: number } { return { converted: 0 }; }
}
export const quantumInfixToPostfix = QuantumInfixToPostfix.getInstance();
