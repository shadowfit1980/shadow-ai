/**
 * Quantum Aggregator
 * 
 * Aggregates data across quantum states,
 * combining results from multiple dimensions.
 */

import { EventEmitter } from 'events';

export interface QuantumAggregation { id: string; source: string; values: number[]; result: number; method: 'sum' | 'avg' | 'max' | 'min'; }

export class QuantumAggregator extends EventEmitter {
    private static instance: QuantumAggregator;
    private aggregations: Map<string, QuantumAggregation> = new Map();

    private constructor() { super(); }
    static getInstance(): QuantumAggregator {
        if (!QuantumAggregator.instance) { QuantumAggregator.instance = new QuantumAggregator(); }
        return QuantumAggregator.instance;
    }

    aggregate(source: string, values: number[], method: 'sum' | 'avg' | 'max' | 'min'): QuantumAggregation {
        let result: number;
        switch (method) {
            case 'sum': result = values.reduce((s, v) => s + v, 0); break;
            case 'avg': result = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0; break;
            case 'max': result = Math.max(...values); break;
            case 'min': result = Math.min(...values); break;
        }
        const agg: QuantumAggregation = { id: `agg_${Date.now()}`, source, values, result, method };
        this.aggregations.set(agg.id, agg);
        return agg;
    }

    getStats(): { total: number } { return { total: this.aggregations.size }; }
}

export const quantumAggregator = QuantumAggregator.getInstance();
