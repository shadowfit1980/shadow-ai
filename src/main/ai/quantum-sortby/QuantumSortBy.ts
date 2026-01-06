/**
 * Quantum Sort By
 */
import { EventEmitter } from 'events';
export class QuantumSortBy extends EventEmitter {
    private static instance: QuantumSortBy;
    private constructor() { super(); }
    static getInstance(): QuantumSortBy { if (!QuantumSortBy.instance) { QuantumSortBy.instance = new QuantumSortBy(); } return QuantumSortBy.instance; }
    sortBy<T>(arr: T[], fn: (item: T) => number | string, order: 'asc' | 'desc' = 'asc'): T[] { const sorted = [...arr].sort((a, b) => { const va = fn(a), vb = fn(b); if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb); return (va as number) - (vb as number); }); return order === 'desc' ? sorted.reverse() : sorted; }
    getStats(): { sorted: number } { return { sorted: 0 }; }
}
export const quantumSortBy = QuantumSortBy.getInstance();
