/**
 * Monitoring & Observability Generator
 * 
 * Generate monitoring setups for Datadog, New Relic,
 * Sentry, and custom Prometheus/Grafana dashboards.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type MonitoringProvider = 'datadog' | 'newrelic' | 'sentry' | 'prometheus' | 'grafana';

export interface MonitoringConfig {
    provider: MonitoringProvider;
    applicationName: string;
    environment: string;
}

// ============================================================================
// MONITORING GENERATOR
// ============================================================================

export class MonitoringGenerator extends EventEmitter {
    private static instance: MonitoringGenerator;

    private constructor() {
        super();
    }

    static getInstance(): MonitoringGenerator {
        if (!MonitoringGenerator.instance) {
            MonitoringGenerator.instance = new MonitoringGenerator();
        }
        return MonitoringGenerator.instance;
    }

    // ========================================================================
    // DATADOG
    // ========================================================================

    generateDatadogSetup(config: MonitoringConfig): string {
        return `import { datadogLogger, datadogRum } from '@datadog/browser-logs';
import tracer from 'dd-trace';

// Initialize Datadog tracer (Node.js)
tracer.init({
    service: '${config.applicationName}',
    env: '${config.environment}',
    version: process.env.APP_VERSION || '1.0.0',
    logInjection: true,
    runtimeMetrics: true,
});

export { tracer };

// Initialize Datadog RUM (Browser)
export function initDatadogRUM() {
    datadogRum.init({
        applicationId: process.env.DATADOG_APPLICATION_ID!,
        clientToken: process.env.DATADOG_CLIENT_TOKEN!,
        site: 'datadoghq.com',
        service: '${config.applicationName}',
        env: '${config.environment}',
        version: process.env.APP_VERSION || '1.0.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
    });
    
    datadogRum.startSessionReplayRecording();
}

// Custom metrics
export function recordMetric(name: string, value: number, tags?: Record<string, string>) {
    tracer.dogstatsd.gauge(name, value, tags);
}

// Custom events
export function trackEvent(name: string, properties?: Record<string, any>) {
    datadogRum.addAction(name, properties);
}

// Error tracking
export function trackError(error: Error, context?: Record<string, any>) {
    datadogRum.addError(error, context);
}
`;
    }

    // ========================================================================
    // SENTRY
    // ========================================================================

    generateSentrySetup(config: MonitoringConfig): string {
        return `import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: '${config.environment}',
    release: process.env.APP_VERSION || '1.0.0',
    
    // Performance Monitoring
    tracesSampleRate: ${config.environment === 'production' ? '0.1' : '1.0'},
    
    // Profiling
    profilesSampleRate: ${config.environment === 'production' ? '0.1' : '1.0'},
    integrations: [
        new ProfilingIntegration(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }),
    ],
    
    // Additional options
    beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
            delete event.request.cookies;
            delete event.request.headers?.authorization;
        }
        return event;
    },
});

// Express middleware
export const sentryRequestHandler = Sentry.Handlers.requestHandler();
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

// Custom error tracking
export function captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, { extra: context });
}

// Custom event tracking
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
}

// Performance tracking
export function startTransaction(name: string, op: string) {
    return Sentry.startTransaction({ name, op });
}

// User tracking
export function setUser(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser(user);
}

// Custom tags
export function setTags(tags: Record<string, string>) {
    Sentry.setTags(tags);
}

// Breadcrumbs
export function addBreadcrumb(message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
        message,
        data,
        level: 'info',
    });
}
`;
    }

    // ========================================================================
    // NEW RELIC
    // ========================================================================

    generateNewRelicSetup(config: MonitoringConfig): string {
        return `// newrelic.js
'use strict';

exports.config = {
    app_name: ['${config.applicationName}'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    logging: {
        level: 'info',
    },
    allow_all_headers: true,
    attributes: {
        exclude: [
            'request.headers.cookie',
            'request.headers.authorization',
            'response.headers.set-cookie',
        ],
    },
    distributed_tracing: {
        enabled: true,
    },
    transaction_tracer: {
        enabled: true,
        transaction_threshold: 'apdex_f',
        record_sql: 'obfuscated',
    },
    error_collector: {
        enabled: true,
        ignore_status_codes: [404],
    },
};

// Import at the top of your main file
// require('newrelic');

// Custom instrumentation
import newrelic from 'newrelic';

export function recordMetric(name: string, value: number) {
    newrelic.recordMetric(name, value);
}

export function recordCustomEvent(eventType: string, attributes: Record<string, any>) {
    newrelic.recordCustomEvent(eventType, attributes);
}

export function startBackgroundTransaction(name: string, group: string, callback: () => Promise<any>) {
    return newrelic.startBackgroundTransaction(name, group, callback);
}

export function addCustomAttribute(key: string, value: string | number | boolean) {
    newrelic.addCustomAttribute(key, value);
}

export function noticeError(error: Error, customAttributes?: Record<string, any>) {
    newrelic.noticeError(error, customAttributes);
}

export function setTransactionName(name: string) {
    newrelic.setTransactionName(name);
}
`;
    }

    // ========================================================================
    // PROMETHEUS + GRAFANA
    // ========================================================================

    generatePrometheusGrafana(): string {
        return `import { Registry, Counter, Histogram, Gauge, Summary } from 'prom-client';
import { Request, Response } from 'express';

// Create registry
export const register = new Registry();

// Collect default metrics
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

// ============================================================================
// CUSTOM METRICS
// ============================================================================

// HTTP Request metrics
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [register],
});

// Database metrics
export const dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'collection'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register],
});

export const dbConnectionsActive = new Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections',
    registers: [register],
});

// Business metrics
export const ordersTotal = new Counter({
    name: 'orders_total',
    help: 'Total number of orders',
    labelNames: ['status'],
    registers: [register],
});

export const revenueTotal = new Counter({
    name: 'revenue_total_cents',
    help: 'Total revenue in cents',
    labelNames: ['currency'],
    registers: [register],
});

// Queue metrics
export const queueSize = new Gauge({
    name: 'queue_size',
    help: 'Current queue size',
    labelNames: ['queue_name'],
    registers: [register],
});

export const jobProcessingDuration = new Histogram({
    name: 'job_processing_duration_seconds',
    help: 'Job processing duration in seconds',
    labelNames: ['job_type', 'status'],
    buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120],
    registers: [register],
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

export function metricsMiddleware(req: Request, res: Response, next: any) {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        
        httpRequestsTotal.inc({
            method: req.method,
            route,
            status_code: res.statusCode,
        });
        
        httpRequestDuration.observe({
            method: req.method,
            route,
            status_code: res.statusCode,
        }, duration);
    });
    
    next();
}

// ============================================================================
// METRICS ENDPOINT
// ============================================================================

export async function metricsHandler(req: Request, res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}

// Usage: app.get('/metrics', metricsHandler);
`;
    }

    // ========================================================================
    // GRAFANA DASHBOARD
    // ========================================================================

    generateGrafanaDashboard(appName: string): string {
        return JSON.stringify({
            dashboard: {
                title: `${appName} - Application Monitoring`,
                tags: ['application', 'monitoring'],
                timezone: 'browser',
                panels: [
                    {
                        title: 'Request Rate',
                        type: 'graph',
                        targets: [{
                            expr: 'rate(http_requests_total[5m])',
                            legendFormat: '{{method}} {{route}}',
                        }],
                        gridPos: { h: 8, w: 12, x: 0, y: 0 },
                    },
                    {
                        title: 'Response Time (95th percentile)',
                        type: 'graph',
                        targets: [{
                            expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
                            legendFormat: '{{method}} {{route}}',
                        }],
                        gridPos: { h: 8, w: 12, x: 12, y: 0 },
                    },
                    {
                        title: 'Error Rate',
                        type: 'graph',
                        targets: [{
                            expr: 'rate(http_requests_total{status_code=~"5.."}[5m])',
                            legendFormat: '{{route}}',
                        }],
                        gridPos: { h: 8, w: 12, x: 0, y: 8 },
                    },
                    {
                        title: 'Active Database Connections',
                        type: 'graph',
                        targets: [{
                            expr: 'db_connections_active',
                        }],
                        gridPos: { h: 8, w: 12, x: 12, y: 8 },
                    },
                ],
                refresh: '10s',
                time: {
                    from: 'now-1h',
                    to: 'now',
                },
            },
        }, null, 2);
    }

    // ========================================================================
    // ALERT RULES
    // ========================================================================

    generateAlertRules(): string {
        return `groups:
  - name: application_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec for {{ $labels.route }}"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "95th percentile response time is {{ $value }}s for {{ $labels.route }}"
      
      - alert: DatabaseConnectionsHigh
        expr: db_connections_active > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool near capacity"
          description: "Active connections: {{ $value }}"
      
      - alert: QueueBacklog
        expr: queue_size{queue_name="default"} > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Queue backlog building up"
          description: "Queue {{ $labels.queue_name }} has {{ $value }} items"
`;
    }
}

export const monitoringGenerator = MonitoringGenerator.getInstance();
