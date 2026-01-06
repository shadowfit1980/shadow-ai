/**
 * Astral Expression Parser
 */
import { EventEmitter } from 'events';
export class AstralExpressionParser extends EventEmitter {
    private static instance: AstralExpressionParser;
    private constructor() { super(); }
    static getInstance(): AstralExpressionParser { if (!AstralExpressionParser.instance) { AstralExpressionParser.instance = new AstralExpressionParser(); } return AstralExpressionParser.instance; }
    evaluate(expression: string): number { let result = 0, num = 0, sign = 1; const stack: number[] = []; for (const c of expression) { if (c >= '0' && c <= '9') num = num * 10 + parseInt(c); else if (c === '+') { result += sign * num; num = 0; sign = 1; } else if (c === '-') { result += sign * num; num = 0; sign = -1; } else if (c === '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; } else if (c === ')') { result += sign * num; num = 0; result *= stack.pop()!; result += stack.pop()!; } } return result + sign * num; }
    getStats(): { evaluated: number } { return { evaluated: 0 }; }
}
export const astralExpressionParser = AstralExpressionParser.getInstance();
