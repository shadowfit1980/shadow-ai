/**
 * Quantum Sample
 */
import { EventEmitter } from 'events';
export class QuantumSample extends EventEmitter {
    private static instance: QuantumSample;
    private constructor() { super(); }
    static getInstance(): QuantumSample { if (!QuantumSample.instance) { QuantumSample.instance = new QuantumSample(); } return QuantumSample.instance; }
    sample<T>(arr: T[], n: number = 1): T[] { const shuffled = [...arr]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } return shuffled.slice(0, n); }
    getStats(): { sampled: number } { return { sampled: 0 }; }
}
export const quantumSample = QuantumSample.getInstance();
