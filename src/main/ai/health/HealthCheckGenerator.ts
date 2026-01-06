/**
 * Health Check Generator
 * 
 * Generate health check endpoints, readiness probes,
 * and liveness checks for Kubernetes and monitoring.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface HealthCheckConfig {
    includeDatabase?: boolean;
    includeRedis?: boolean;
    includeExternalAPIs?: string[];
    includeMessageQueue?: boolean;
    includeFileSystem?: boolean;
    timeout?: number;
}

export interface DependencyCheck {
    name: string;
    type: 'database' | 'redis' | 'http' | 'queue' | 'filesystem' | 'custom';
    endpoint?: string;
    timeout?: number;
}

// ============================================================================
// HEALTH CHECK GENERATOR
// ============================================================================

export class HealthCheckGenerator extends EventEmitter {
    private static instance: HealthCheckGenerator;

    private constructor() {
        super();
    }

    static getInstance(): HealthCheckGenerator {
        if (!HealthCheckGenerator.instance) {
            HealthCheckGenerator.instance = new HealthCheckGenerator();
        }
        return HealthCheckGenerator.instance;
    }

    // ========================================================================
    // EXPRESS HEALTH CHECKS
    // ========================================================================

    generateExpressHealthChecks(config: HealthCheckConfig, dependencies: DependencyCheck[]): string {
        return `import { Router, Request, Response } from 'express';

const router = Router();
const TIMEOUT = ${config.timeout || 5000};

// Types
interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    checks: Record<string, CheckResult>;
}

interface CheckResult {
    status: 'pass' | 'fail' | 'warn';
    responseTime?: number;
    message?: string;
}

// Check functions
${dependencies.map(dep => this.generateCheckFunction(dep)).join('\n\n')}

// Health endpoint
router.get('/health', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const checks: Record<string, CheckResult> = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Run all checks in parallel with timeout
    const checkPromises = [
${dependencies.map(dep => `        check${this.toPascalCase(dep.name)}().then(r => checks['${dep.name}'] = r),`).join('\n')}
    ];

    await Promise.allSettled(checkPromises);

    // Determine overall status
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail');
    const warnChecks = Object.values(checks).filter(c => c.status === 'warn');

    if (failedChecks.length > 0) {
        overallStatus = 'unhealthy';
    } else if (warnChecks.length > 0) {
        overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        checks,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    res.status(statusCode).json(result);
});

// Liveness probe (is the app running?)
router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Readiness probe (is the app ready to serve traffic?)
router.get('/ready', async (req: Request, res: Response) => {
    try {
        // Check critical dependencies only
        const criticalChecks = await Promise.all([
${dependencies.filter(d => d.type === 'database' || d.type === 'redis').map(dep => `            check${this.toPascalCase(dep.name)}(),`).join('\n')}
        ]);

        const hasFailure = criticalChecks.some(c => c.status === 'fail');
        
        if (hasFailure) {
            res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
        } else {
            res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
        }
    } catch (error) {
        res.status(503).json({ ready: false, error: (error as Error).message });
    }
});

// Startup probe (has the app started successfully?)
let isStarted = false;
router.get('/startup', (req: Request, res: Response) => {
    if (isStarted) {
        res.status(200).json({ started: true });
    } else {
        res.status(503).json({ started: false });
    }
});

export function markAsStarted() {
    isStarted = true;
}

export default router;
`;
    }

    private generateCheckFunction(dep: DependencyCheck): string {
        switch (dep.type) {
            case 'database':
                return `async function check${this.toPascalCase(dep.name)}(): Promise<CheckResult> {
    const start = Date.now();
    try {
        // Replace with your database client
        // await db.query('SELECT 1');
        await new Promise(r => setTimeout(r, 10)); // Simulated check
        return {
            status: 'pass',
            responseTime: Date.now() - start,
        };
    } catch (error) {
        return {
            status: 'fail',
            message: (error as Error).message,
            responseTime: Date.now() - start,
        };
    }
}`;

            case 'redis':
                return `async function check${this.toPascalCase(dep.name)}(): Promise<CheckResult> {
    const start = Date.now();
    try {
        // Replace with your Redis client
        // await redis.ping();
        await new Promise(r => setTimeout(r, 10)); // Simulated check
        return {
            status: 'pass',
            responseTime: Date.now() - start,
        };
    } catch (error) {
        return {
            status: 'fail',
            message: (error as Error).message,
            responseTime: Date.now() - start,
        };
    }
}`;

            case 'http':
                return `async function check${this.toPascalCase(dep.name)}(): Promise<CheckResult> {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ${dep.timeout || 5000});
        
        const response = await fetch('${dep.endpoint}', { 
            signal: controller.signal,
            method: 'HEAD',
        });
        clearTimeout(timeout);
        
        if (response.ok) {
            return { status: 'pass', responseTime: Date.now() - start };
        } else {
            return { 
                status: response.status < 500 ? 'warn' : 'fail',
                message: \`HTTP \${response.status}\`,
                responseTime: Date.now() - start,
            };
        }
    } catch (error) {
        return {
            status: 'fail',
            message: (error as Error).message,
            responseTime: Date.now() - start,
        };
    }
}`;

            case 'queue':
                return `async function check${this.toPascalCase(dep.name)}(): Promise<CheckResult> {
    const start = Date.now();
    try {
        // Replace with your queue client check
        await new Promise(r => setTimeout(r, 10)); // Simulated check
        return {
            status: 'pass',
            responseTime: Date.now() - start,
        };
    } catch (error) {
        return {
            status: 'fail',
            message: (error as Error).message,
            responseTime: Date.now() - start,
        };
    }
}`;

            case 'filesystem':
                return `async function check${this.toPascalCase(dep.name)}(): Promise<CheckResult> {
    const start = Date.now();
    try {
        const fs = await import('fs/promises');
        await fs.access('/tmp', fs.constants.W_OK);
        return {
            status: 'pass',
            responseTime: Date.now() - start,
        };
    } catch (error) {
        return {
            status: 'fail',
            message: (error as Error).message,
            responseTime: Date.now() - start,
        };
    }
}`;

            default:
                return `async function check${this.toPascalCase(dep.name)}(): Promise<CheckResult> {
    const start = Date.now();
    try {
        // Add custom check logic here
        return { status: 'pass', responseTime: Date.now() - start };
    } catch (error) {
        return {
            status: 'fail',
            message: (error as Error).message,
            responseTime: Date.now() - start,
        };
    }
}`;
        }
    }

    // ========================================================================
    // KUBERNETES PROBES
    // ========================================================================

    generateKubernetesManifest(serviceName: string): string {
        return `# Health check probes for Kubernetes deployment
apiVersion: v1
kind: Pod
metadata:
  name: ${serviceName}
spec:
  containers:
    - name: ${serviceName}
      image: ${serviceName}:latest
      ports:
        - containerPort: 3000
      
      # Liveness probe - is the container running?
      livenessProbe:
        httpGet:
          path: /live
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 15
        timeoutSeconds: 5
        failureThreshold: 3
      
      # Readiness probe - is the container ready for traffic?
      readinessProbe:
        httpGet:
          path: /ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3
      
      # Startup probe - has the container started?
      startupProbe:
        httpGet:
          path: /startup
          port: 3000
        initialDelaySeconds: 0
        periodSeconds: 5
        timeoutSeconds: 5
        failureThreshold: 30  # 30 * 5 = 150 seconds max startup time
`;
    }

    // ========================================================================
    // DOCKER COMPOSE HEALTH CHECK
    // ========================================================================

    generateDockerHealthcheck(): string {
        return `# Docker Compose health check configuration
services:
  app:
    build: .
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
`;
    }

    // ========================================================================
    // MONITORING METRICS
    // ========================================================================

    generatePrometheusMetrics(): string {
        return `import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Router, Request, Response } from 'express';

// Create registry
export const register = new Registry();

// Collect default metrics
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register],
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
});

export const activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [register],
});

export const healthCheckStatus = new Gauge({
    name: 'health_check_status',
    help: 'Health check status (1 = healthy, 0 = unhealthy)',
    labelNames: ['check'],
    registers: [register],
});

// Metrics middleware
export function metricsMiddleware(req: Request, res: Response, next: any) {
    const start = Date.now();
    
    activeConnections.inc();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const path = req.route?.path || req.path;
        
        httpRequestsTotal.inc({
            method: req.method,
            path,
            status: res.statusCode.toString(),
        });
        
        httpRequestDuration.observe({
            method: req.method,
            path,
            status: res.statusCode.toString(),
        }, duration);
        
        activeConnections.dec();
    });
    
    next();
}

// Metrics endpoint
const router = Router();
router.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

export default router;
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private toPascalCase(str: string): string {
        return str.split(/[-_]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    }
}

export const healthCheckGenerator = HealthCheckGenerator.getInstance();
