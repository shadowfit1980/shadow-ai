/**
 * Ethereal RPN Calculator
 */
import { EventEmitter } from 'events';
export class EtherealRPNCalculator extends EventEmitter {
    private static instance: EtherealRPNCalculator;
    private constructor() { super(); }
    static getInstance(): EtherealRPNCalculator { if (!EtherealRPNCalculator.instance) { EtherealRPNCalculator.instance = new EtherealRPNCalculator(); } return EtherealRPNCalculator.instance; }
    evalRPN(tokens: string[]): number { const stack: number[] = []; for (const t of tokens) { if (['+', '-', '*', '/'].includes(t)) { const b = stack.pop()!, a = stack.pop()!; if (t === '+') stack.push(a + b); else if (t === '-') stack.push(a - b); else if (t === '*') stack.push(a * b); else stack.push(Math.trunc(a / b)); } else stack.push(parseInt(t)); } return stack[0]; }
    getStats(): { evaluated: number } { return { evaluated: 0 }; }
}
export const etherealRPNCalculator = EtherealRPNCalculator.getInstance();
