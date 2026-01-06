/**
 * Mystic Basic Calculator
 */
import { EventEmitter } from 'events';
export class MysticBasicCalculator extends EventEmitter {
    private static instance: MysticBasicCalculator;
    private constructor() { super(); }
    static getInstance(): MysticBasicCalculator { if (!MysticBasicCalculator.instance) { MysticBasicCalculator.instance = new MysticBasicCalculator(); } return MysticBasicCalculator.instance; }
    calculate(s: string): number { const stack: number[] = []; let num = 0, sign = 1, result = 0; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c >= '0' && c <= '9') { num = num * 10 + parseInt(c); } else if (c === '+') { result += sign * num; num = 0; sign = 1; } else if (c === '-') { result += sign * num; num = 0; sign = -1; } else if (c === '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; } else if (c === ')') { result += sign * num; num = 0; result *= stack.pop()!; result += stack.pop()!; } } return result + sign * num; }
    calculateII(s: string): number { const stack: number[] = []; let num = 0, op = '+'; s = s.replace(/\s/g, '') + '+'; for (const c of s) { if (c >= '0' && c <= '9') { num = num * 10 + parseInt(c); } else { if (op === '+') stack.push(num); else if (op === '-') stack.push(-num); else if (op === '*') stack.push(stack.pop()! * num); else if (op === '/') stack.push(Math.trunc(stack.pop()! / num)); num = 0; op = c; } } return stack.reduce((a, b) => a + b, 0); }
    evalRPN(tokens: string[]): number { const stack: number[] = []; for (const token of tokens) { if (['+', '-', '*', '/'].includes(token)) { const b = stack.pop()!, a = stack.pop()!; if (token === '+') stack.push(a + b); else if (token === '-') stack.push(a - b); else if (token === '*') stack.push(a * b); else stack.push(Math.trunc(a / b)); } else { stack.push(parseInt(token)); } } return stack[0]; }
}
export const mysticBasicCalculator = MysticBasicCalculator.getInstance();
