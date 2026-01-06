/**
 * Quantum Staircase Climber
 */
import { EventEmitter } from 'events';
export class QuantumStaircaseClimber extends EventEmitter {
    private static instance: QuantumStaircaseClimber;
    private constructor() { super(); }
    static getInstance(): QuantumStaircaseClimber { if (!QuantumStaircaseClimber.instance) { QuantumStaircaseClimber.instance = new QuantumStaircaseClimber(); } return QuantumStaircaseClimber.instance; }
    countWays(n: number): number { if (n <= 2) return n; let prev1 = 2, prev2 = 1; for (let i = 3; i <= n; i++) { const curr = prev1 + prev2; prev2 = prev1; prev1 = curr; } return prev1; }
    getStats(): { counts: number } { return { counts: 0 }; }
}
export const quantumStaircaseClimber = QuantumStaircaseClimber.getInstance();
