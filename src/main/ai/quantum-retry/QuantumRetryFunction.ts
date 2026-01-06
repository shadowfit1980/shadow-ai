/**
 * Quantum Retry Function
 */
import { EventEmitter } from 'events';
export class QuantumRetryFunction extends EventEmitter {
    private static instance: QuantumRetryFunction;
    private constructor() { super(); }
    static getInstance(): QuantumRetryFunction { if (!QuantumRetryFunction.instance) { QuantumRetryFunction.instance = new QuantumRetryFunction(); } return QuantumRetryFunction.instance; }
    async retry<T>(fn: () => Promise<T>, retries: number, delay: number = 0): Promise<T> { for (let i = 0; i <= retries; i++) { try { return await fn(); } catch (err) { if (i === retries) throw err; if (delay > 0) await new Promise(r => setTimeout(r, delay)); } } throw new Error('All retries failed'); }
    getStats(): { retries: number } { return { retries: 0 }; }
}
export const quantumRetryFunction = QuantumRetryFunction.getInstance();
