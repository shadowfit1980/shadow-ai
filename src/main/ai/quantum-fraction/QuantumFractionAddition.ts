/**
 * Quantum Fraction Addition
 */
import { EventEmitter } from 'events';
export class QuantumFractionAddition extends EventEmitter {
    private static instance: QuantumFractionAddition;
    private constructor() { super(); }
    static getInstance(): QuantumFractionAddition { if (!QuantumFractionAddition.instance) { QuantumFractionAddition.instance = new QuantumFractionAddition(); } return QuantumFractionAddition.instance; }
    private gcd(a: number, b: number): number { return b === 0 ? Math.abs(a) : this.gcd(b, a % b); }
    private lcm(a: number, b: number): number { return Math.abs(a * b) / this.gcd(a, b); }
    fractionAddition(expression: string): string { const fractions: [number, number][] = []; let i = 0; while (i < expression.length) { let sign = 1; if (expression[i] === '-' || expression[i] === '+') { sign = expression[i] === '-' ? -1 : 1; i++; } let num = 0; while (i < expression.length && expression[i] !== '/') { num = num * 10 + parseInt(expression[i]); i++; } i++; let den = 0; while (i < expression.length && expression[i] !== '+' && expression[i] !== '-') { den = den * 10 + parseInt(expression[i]); i++; } fractions.push([sign * num, den]); } let commonDen = 1; for (const [, den] of fractions) commonDen = this.lcm(commonDen, den); let totalNum = 0; for (const [num, den] of fractions) totalNum += num * (commonDen / den); const g = this.gcd(totalNum, commonDen); return `${totalNum / g}/${commonDen / g}`; }
    simplifyFraction(num: number, den: number): string { const g = this.gcd(num, den); const sign = (num < 0) !== (den < 0) ? -1 : 1; return `${sign * Math.abs(num / g)}/${Math.abs(den / g)}`; }
}
export const quantumFractionAddition = QuantumFractionAddition.getInstance();
