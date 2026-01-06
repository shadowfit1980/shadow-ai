/**
 * Model Monitor - Performance tracking
 */
import { EventEmitter } from 'events';

export interface ModelMetric { timestamp: number; accuracy: number; latency: number; throughput: number; errorRate: number; }
export interface DriftAlert { id: string; modelId: string; type: 'data' | 'concept' | 'performance'; severity: 'low' | 'medium' | 'high'; timestamp: number; }

export class ModelMonitorEngine extends EventEmitter {
    private static instance: ModelMonitorEngine;
    private metrics: Map<string, ModelMetric[]> = new Map();
    private alerts: DriftAlert[] = [];
    private constructor() { super(); }
    static getInstance(): ModelMonitorEngine { if (!ModelMonitorEngine.instance) ModelMonitorEngine.instance = new ModelMonitorEngine(); return ModelMonitorEngine.instance; }

    logMetrics(modelId: string, metric: Omit<ModelMetric, 'timestamp'>): void { const m = { ...metric, timestamp: Date.now() }; const history = this.metrics.get(modelId) || []; history.push(m); if (history.length > 1000) history.shift(); this.metrics.set(modelId, history); this.checkDrift(modelId, m); }

    private checkDrift(modelId: string, metric: ModelMetric): void { if (metric.accuracy < 0.8) this.alert(modelId, 'performance', 'high'); if (metric.errorRate > 0.1) this.alert(modelId, 'data', 'medium'); }

    alert(modelId: string, type: DriftAlert['type'], severity: DriftAlert['severity']): DriftAlert { const a: DriftAlert = { id: `alert_${Date.now()}`, modelId, type, severity, timestamp: Date.now() }; this.alerts.push(a); this.emit('alert', a); return a; }
    getMetrics(modelId: string, limit = 100): ModelMetric[] { return (this.metrics.get(modelId) || []).slice(-limit); }
    getAlerts(modelId?: string): DriftAlert[] { return modelId ? this.alerts.filter(a => a.modelId === modelId) : this.alerts; }
}
export function getModelMonitorEngine(): ModelMonitorEngine { return ModelMonitorEngine.getInstance(); }
