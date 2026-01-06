/**
 * Metrics Collector
 * Collect and track usage metrics
 */

import { EventEmitter } from 'events';

export interface Metric {
    name: string;
    value: number;
    timestamp: number;
    tags?: Record<string, string>;
}

/**
 * MetricsCollector
 * Track app usage
 */
export class MetricsCollector extends EventEmitter {
    private static instance: MetricsCollector;
    private metrics: Metric[] = [];
    private counters: Map<string, number> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    record(name: string, value: number, tags?: Record<string, string>): void {
        this.metrics.push({ name, value, timestamp: Date.now(), tags });
        this.emit('recorded', { name, value });
    }

    increment(name: string, by = 1): number {
        const current = this.counters.get(name) || 0;
        const newValue = current + by;
        this.counters.set(name, newValue);
        return newValue;
    }

    decrement(name: string, by = 1): number {
        return this.increment(name, -by);
    }

    getCounter(name: string): number {
        return this.counters.get(name) || 0;
    }

    getMetrics(name?: string, limit = 100): Metric[] {
        let result = this.metrics;
        if (name) result = result.filter(m => m.name === name);
        return result.slice(-limit);
    }

    getAverage(name: string): number {
        const filtered = this.metrics.filter(m => m.name === name);
        if (filtered.length === 0) return 0;
        return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
    }

    getAllCounters(): Record<string, number> {
        return Object.fromEntries(this.counters);
    }

    clear(): void {
        this.metrics = [];
        this.counters.clear();
        this.emit('cleared');
    }
}

export function getMetricsCollector(): MetricsCollector {
    return MetricsCollector.getInstance();
}
