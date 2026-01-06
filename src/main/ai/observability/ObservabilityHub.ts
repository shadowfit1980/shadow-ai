/**
 * ObservabilityHub - Unified Metrics, Logging, and Tracing
 * 
 * Centralized observability system for Shadow AI
 * Aggregates metrics, logs, and traces into a single interface
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    service: string;
    message: string;
    context?: Record<string, any>;
    correlationId?: string;
    duration?: number;
}

export interface Metric {
    name: string;
    type: MetricType;
    value: number;
    labels?: Record<string, string>;
    timestamp: Date;
}

export interface Span {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    service: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'success' | 'error';
    tags?: Record<string, string>;
    logs?: Array<{ timestamp: Date; message: string }>;
}

export interface Alert {
    id: string;
    type: 'threshold' | 'anomaly' | 'error_rate';
    metric: string;
    threshold: number;
    currentValue: number;
    message: string;
    severity: 'warning' | 'critical';
    timestamp: Date;
}

export interface ObservabilityConfig {
    logLevel: LogLevel;
    enableConsole: boolean;
    enableFileLogging: boolean;
    logPath?: string;
    retentionDays: number;
    metricsFlushInterval: number;
}

// ============================================================================
// OBSERVABILITY HUB
// ============================================================================

export class ObservabilityHub extends EventEmitter {
    private static instance: ObservabilityHub;

    private config: ObservabilityConfig = {
        logLevel: 'info',
        enableConsole: true,
        enableFileLogging: true,
        retentionDays: 7,
        metricsFlushInterval: 60000
    };

    private logs: LogEntry[] = [];
    private metrics: Map<string, Metric> = new Map();
    private metricHistory: Metric[] = [];
    private spans: Map<string, Span> = new Map();
    private activeAlerts: Map<string, Alert> = new Map();
    private counters: Map<string, number> = new Map();
    private histograms: Map<string, number[]> = new Map();

    private flushInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.startMetricsFlush();
    }

    static getInstance(): ObservabilityHub {
        if (!ObservabilityHub.instance) {
            ObservabilityHub.instance = new ObservabilityHub();
        }
        return ObservabilityHub.instance;
    }

    // ========================================================================
    // LOGGING
    // ========================================================================

    log(level: LogLevel, service: string, message: string, context?: Record<string, any>): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            service,
            message,
            context,
            correlationId: context?.correlationId
        };

        this.logs.push(entry);
        this.emit('log', entry);

        // Console output
        if (this.config.enableConsole) {
            const prefix = this.getLogPrefix(level);
            console.log(`${prefix} [${service}] ${message}`, context || '');
        }

        // Trim old logs
        if (this.logs.length > 10000) {
            this.logs = this.logs.slice(-5000);
        }
    }

    debug(service: string, message: string, context?: Record<string, any>): void {
        this.log('debug', service, message, context);
    }

    info(service: string, message: string, context?: Record<string, any>): void {
        this.log('info', service, message, context);
    }

    warn(service: string, message: string, context?: Record<string, any>): void {
        this.log('warn', service, message, context);
    }

    error(service: string, message: string, context?: Record<string, any>): void {
        this.log('error', service, message, context);
        this.incrementCounter('errors_total', { service });
    }

    fatal(service: string, message: string, context?: Record<string, any>): void {
        this.log('fatal', service, message, context);
        this.incrementCounter('fatal_errors_total', { service });
    }

    // ========================================================================
    // METRICS
    // ========================================================================

    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, labels?: Record<string, string>, delta: number = 1): void {
        const key = this.getMetricKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + delta);

        const metric: Metric = {
            name,
            type: 'counter',
            value: current + delta,
            labels,
            timestamp: new Date()
        };

        this.metrics.set(key, metric);
        this.metricHistory.push(metric);
        this.emit('metric', metric);
    }

    /**
     * Set a gauge metric
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getMetricKey(name, labels);

        const metric: Metric = {
            name,
            type: 'gauge',
            value,
            labels,
            timestamp: new Date()
        };

        this.metrics.set(key, metric);
        this.metricHistory.push(metric);
        this.emit('metric', metric);
    }

    /**
     * Record a histogram value
     */
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
        const key = this.getMetricKey(name, labels);

        if (!this.histograms.has(key)) {
            this.histograms.set(key, []);
        }
        this.histograms.get(key)!.push(value);

        // Calculate percentiles
        const values = this.histograms.get(key)!;
        const sorted = [...values].sort((a, b) => a - b);

        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];

        const metric: Metric = {
            name,
            type: 'histogram',
            value: p50,
            labels: { ...labels, percentile: '50' },
            timestamp: new Date()
        };

        this.metrics.set(key, metric);
        this.emit('metric', { p50, p95, p99, count: values.length });
    }

    /**
     * Time an operation
     */
    startTimer(name: string, labels?: Record<string, string>): () => number {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.recordHistogram(name, duration, labels);
            return duration;
        };
    }

    // ========================================================================
    // TRACING
    // ========================================================================

    /**
     * Start a new trace span
     */
    startSpan(operationName: string, service: string, parentSpanId?: string): Span {
        const span: Span = {
            traceId: parentSpanId ? this.getTraceIdFromSpan(parentSpanId) : this.generateId(),
            spanId: this.generateId(),
            parentSpanId,
            operationName,
            service,
            startTime: new Date(),
            status: 'running',
            tags: {},
            logs: []
        };

        this.spans.set(span.spanId, span);
        this.emit('span:start', span);
        return span;
    }

    /**
     * End a trace span
     */
    endSpan(spanId: string, status: 'success' | 'error' = 'success', error?: string): void {
        const span = this.spans.get(spanId);
        if (span) {
            span.endTime = new Date();
            span.status = status;

            if (error) {
                this.addSpanLog(spanId, `Error: ${error}`);
            }

            const duration = span.endTime.getTime() - span.startTime.getTime();
            this.recordHistogram('span_duration_ms', duration, {
                operation: span.operationName,
                service: span.service
            });

            this.emit('span:end', span);
        }
    }

    /**
     * Add a log to a span
     */
    addSpanLog(spanId: string, message: string): void {
        const span = this.spans.get(spanId);
        if (span && span.logs) {
            span.logs.push({ timestamp: new Date(), message });
        }
    }

    /**
     * Add tags to a span
     */
    addSpanTags(spanId: string, tags: Record<string, string>): void {
        const span = this.spans.get(spanId);
        if (span) {
            span.tags = { ...span.tags, ...tags };
        }
    }

    // ========================================================================
    // ALERTS
    // ========================================================================

    /**
     * Check and trigger alerts based on thresholds
     */
    checkAlerts(): void {
        // Error rate alert
        const errorCount = this.counters.get('errors_total') || 0;
        const requestCount = this.counters.get('requests_total') || 1;
        const errorRate = errorCount / requestCount;

        if (errorRate > 0.1) { // 10% error rate
            this.triggerAlert({
                id: 'error_rate_high',
                type: 'error_rate',
                metric: 'error_rate',
                threshold: 0.1,
                currentValue: errorRate,
                message: `Error rate is ${(errorRate * 100).toFixed(1)}% (threshold: 10%)`,
                severity: errorRate > 0.25 ? 'critical' : 'warning',
                timestamp: new Date()
            });
        }
    }

    private triggerAlert(alert: Alert): void {
        if (!this.activeAlerts.has(alert.id)) {
            this.activeAlerts.set(alert.id, alert);
            this.emit('alert', alert);
            this.error('ObservabilityHub', `ALERT: ${alert.message}`, { alert });
        }
    }

    resolveAlert(alertId: string): void {
        if (this.activeAlerts.has(alertId)) {
            this.activeAlerts.delete(alertId);
            this.emit('alert:resolved', { alertId });
        }
    }

    // ========================================================================
    // QUERY & EXPORT
    // ========================================================================

    /**
     * Get logs by query
     */
    queryLogs(options: {
        level?: LogLevel;
        service?: string;
        since?: Date;
        limit?: number;
    }): LogEntry[] {
        let filtered = this.logs;

        if (options.level) {
            filtered = filtered.filter(l => l.level === options.level);
        }
        if (options.service) {
            filtered = filtered.filter(l => l.service === options.service);
        }
        if (options.since) {
            filtered = filtered.filter(l => l.timestamp >= options.since!);
        }

        return filtered.slice(-(options.limit || 100));
    }

    /**
     * Get current metrics
     */
    getMetrics(): Metric[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Get active spans
     */
    getActiveSpans(): Span[] {
        return Array.from(this.spans.values()).filter(s => s.status === 'running');
    }

    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[] {
        return Array.from(this.activeAlerts.values());
    }

    /**
     * Export logs to file
     */
    async exportLogs(filePath?: string): Promise<string> {
        const exportPath = filePath || path.join(
            app?.getPath('userData') || '/tmp',
            `logs-${new Date().toISOString().split('T')[0]}.json`
        );

        await fs.writeFile(exportPath, JSON.stringify({
            exportedAt: new Date().toISOString(),
            logs: this.logs,
            metrics: this.getMetrics(),
            alerts: this.getActiveAlerts()
        }, null, 2));

        return exportPath;
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalLogs: number;
        logsByLevel: Record<LogLevel, number>;
        totalMetrics: number;
        activeSpans: number;
        activeAlerts: number;
        counters: Record<string, number>;
    } {
        const logsByLevel = this.logs.reduce((acc, log) => {
            acc[log.level] = (acc[log.level] || 0) + 1;
            return acc;
        }, {} as Record<LogLevel, number>);

        return {
            totalLogs: this.logs.length,
            logsByLevel,
            totalMetrics: this.metrics.size,
            activeSpans: this.getActiveSpans().length,
            activeAlerts: this.activeAlerts.size,
            counters: Object.fromEntries(this.counters)
        };
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
        return levels.indexOf(level) >= levels.indexOf(this.config.logLevel);
    }

    private getLogPrefix(level: LogLevel): string {
        const prefixes: Record<LogLevel, string> = {
            debug: '🔍',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            fatal: '💀'
        };
        return prefixes[level];
    }

    private getMetricKey(name: string, labels?: Record<string, string>): string {
        if (!labels) return name;
        const labelStr = Object.entries(labels).sort().map(([k, v]) => `${k}=${v}`).join(',');
        return `${name}{${labelStr}}`;
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private getTraceIdFromSpan(spanId: string): string {
        const span = this.spans.get(spanId);
        return span?.traceId || this.generateId();
    }

    private startMetricsFlush(): void {
        this.flushInterval = setInterval(() => {
            this.checkAlerts();
            this.cleanupOldData();
        }, this.config.metricsFlushInterval);
    }

    private cleanupOldData(): void {
        const cutoff = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);

        this.logs = this.logs.filter(l => l.timestamp > cutoff);
        this.metricHistory = this.metricHistory.filter(m => m.timestamp > cutoff);

        // Clean up completed spans older than 1 hour
        const spanCutoff = new Date(Date.now() - 60 * 60 * 1000);
        for (const [id, span] of this.spans) {
            if (span.status !== 'running' && span.endTime && span.endTime < spanCutoff) {
                this.spans.delete(id);
            }
        }
    }

    /**
     * Configure the observability hub
     */
    configure(config: Partial<ObservabilityConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.logs = [];
        this.metrics.clear();
        this.metricHistory = [];
        this.spans.clear();
        this.activeAlerts.clear();
        this.counters.clear();
        this.histograms.clear();
    }
}

// Export singleton
export const observabilityHub = ObservabilityHub.getInstance();
