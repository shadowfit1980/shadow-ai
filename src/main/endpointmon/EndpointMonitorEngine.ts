/**
 * Endpoint Monitor - Health and metrics
 */
import { EventEmitter } from 'events';

export interface EndpointHealth { endpointId: string; healthy: boolean; lastCheck: number; latency: number; errorRate: number; requestsPerSecond: number; }
export interface HealthAlert { id: string; endpointId: string; type: 'unhealthy' | 'high_latency' | 'high_error_rate'; message: string; timestamp: number; }

export class EndpointMonitorEngine extends EventEmitter {
    private static instance: EndpointMonitorEngine;
    private health: Map<string, EndpointHealth> = new Map();
    private alerts: HealthAlert[] = [];
    private latencyThreshold = 1000;
    private errorThreshold = 0.05;
    private constructor() { super(); }
    static getInstance(): EndpointMonitorEngine { if (!EndpointMonitorEngine.instance) EndpointMonitorEngine.instance = new EndpointMonitorEngine(); return EndpointMonitorEngine.instance; }

    recordMetrics(endpointId: string, latency: number, success: boolean): void {
        const existing = this.health.get(endpointId) || { endpointId, healthy: true, lastCheck: 0, latency: 0, errorRate: 0, requestsPerSecond: 0 };
        existing.latency = (existing.latency * 0.9) + (latency * 0.1);
        existing.errorRate = success ? existing.errorRate * 0.95 : Math.min(1, existing.errorRate + 0.05);
        existing.lastCheck = Date.now(); existing.healthy = existing.errorRate < this.errorThreshold && existing.latency < this.latencyThreshold;
        this.health.set(endpointId, existing);
        if (!existing.healthy) this.createAlert(endpointId, 'unhealthy', 'Endpoint is unhealthy');
        if (existing.latency > this.latencyThreshold) this.createAlert(endpointId, 'high_latency', `Latency ${existing.latency.toFixed(0)}ms exceeds threshold`);
    }

    private createAlert(endpointId: string, type: HealthAlert['type'], message: string): void { const alert: HealthAlert = { id: `alert_${Date.now()}`, endpointId, type, message, timestamp: Date.now() }; this.alerts.push(alert); this.emit('alert', alert); }
    getHealth(endpointId: string): EndpointHealth | null { return this.health.get(endpointId) || null; }
    getAlerts(endpointId?: string): HealthAlert[] { return endpointId ? this.alerts.filter(a => a.endpointId === endpointId) : this.alerts; }
}
export function getEndpointMonitorEngine(): EndpointMonitorEngine { return EndpointMonitorEngine.getInstance(); }
