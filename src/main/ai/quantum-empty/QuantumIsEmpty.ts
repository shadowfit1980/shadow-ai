/**
 * Quantum Is Empty
 */
import { EventEmitter } from 'events';
export class QuantumIsEmpty extends EventEmitter {
    private static instance: QuantumIsEmpty;
    private constructor() { super(); }
    static getInstance(): QuantumIsEmpty { if (!QuantumIsEmpty.instance) { QuantumIsEmpty.instance = new QuantumIsEmpty(); } return QuantumIsEmpty.instance; }
    isEmpty(value: unknown): boolean { if (value == null) return true; if (Array.isArray(value) || typeof value === 'string') return value.length === 0; if (typeof value === 'object') return Object.keys(value).length === 0; return false; }
    getStats(): { checked: number } { return { checked: 0 }; }
}
export const quantumIsEmpty = QuantumIsEmpty.getInstance();
