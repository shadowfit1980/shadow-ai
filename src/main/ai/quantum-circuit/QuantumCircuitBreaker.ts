/**
 * Quantum Circuit Breaker
 * 
 * A circuit breaker that exists in quantum superposition,
 * protecting against cascading failures across dimensions.
 */

import { EventEmitter } from 'events';

export interface QuantumCircuit { id: string; name: string; state: 'closed' | 'open' | 'half-open'; failures: number; threshold: number; }

export class QuantumCircuitBreaker extends EventEmitter {
    private static instance: QuantumCircuitBreaker;
    private circuits: Map<string, QuantumCircuit> = new Map();

    private constructor() { super(); }
    static getInstance(): QuantumCircuitBreaker {
        if (!QuantumCircuitBreaker.instance) { QuantumCircuitBreaker.instance = new QuantumCircuitBreaker(); }
        return QuantumCircuitBreaker.instance;
    }

    create(name: string, threshold: number = 5): QuantumCircuit {
        const circuit: QuantumCircuit = { id: `circuit_${Date.now()}`, name, state: 'closed', failures: 0, threshold };
        this.circuits.set(circuit.id, circuit);
        return circuit;
    }

    recordFailure(circuitId: string): void {
        const circuit = this.circuits.get(circuitId);
        if (circuit) { circuit.failures++; if (circuit.failures >= circuit.threshold) circuit.state = 'open'; }
    }

    getStats(): { total: number; openCircuits: number } {
        const circuits = Array.from(this.circuits.values());
        return { total: circuits.length, openCircuits: circuits.filter(c => c.state === 'open').length };
    }
}

export const quantumCircuitBreaker = QuantumCircuitBreaker.getInstance();
