/**
 * Logging & Monitoring Generator
 * 
 * Generate structured logging with Winston, Pino,
 * and monitoring with Prometheus, Datadog.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type LoggingProvider = 'winston' | 'pino' | 'bunyan';
export type MonitoringProvider = 'prometheus' | 'datadog' | 'newrelic';

// ============================================================================
// LOGGING GENERATOR
// ============================================================================

export class LoggingMonitoringGenerator extends EventEmitter {
    private static instance: LoggingMonitoringGenerator;

    private constructor() {
        super();
    }

    static getInstance(): LoggingMonitoringGenerator {
        if (!LoggingMonitoringGenerator.instance) {
            LoggingMonitoringGenerator.instance = new LoggingMonitoringGenerator();
        }
        return LoggingMonitoringGenerator.instance;
    }

    // ========================================================================
    // WINSTON
    // ========================================================================

    generateWinston(): string {
        return `import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return \`\${timestamp} [\${level}]: \${message} \${metaStr}\`;
});

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'app' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
    
    // File transport with rotation
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), json()),
    }),
    
    // Error file
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    }),
  ],
});

// Child logger for specific contexts
export function createLogger(context: string) {
  return logger.child({ context });
}

// Request logging middleware
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: \`\${duration}ms\`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
}

// Structured logging helpers
export const log = {
  info: (message: string, meta?: object) => logger.info(message, meta),
  warn: (message: string, meta?: object) => logger.warn(message, meta),
  error: (message: string, error?: Error, meta?: object) => {
    logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
  },
  debug: (message: string, meta?: object) => logger.debug(message, meta),
  
  // Business events
  event: (eventName: string, data?: object) => {
    logger.info(\`Event: \${eventName}\`, { event: eventName, ...data });
  },
  
  // Performance logging
  perf: (operation: string, durationMs: number, meta?: object) => {
    logger.info(\`Performance: \${operation}\`, { operation, durationMs, ...meta });
  },
  
  // Audit logging
  audit: (action: string, userId: string, details?: object) => {
    logger.info(\`Audit: \${action}\`, { audit: true, action, userId, ...details });
  },
};

// Timer utility
export function timer(label: string) {
  const start = Date.now();
  return {
    end: (meta?: object) => {
      const duration = Date.now() - start;
      log.perf(label, duration, meta);
      return duration;
    },
  };
}
`;
    }

    // ========================================================================
    // PINO
    // ========================================================================

    generatePino(): string {
        return `import pino from 'pino';

// Create logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: process.env.SERVICE_NAME || 'app',
    env: process.env.NODE_ENV,
  },
  redact: ['password', 'token', 'authorization', 'cookie'],
});

// Child loggers
export function createLogger(name: string) {
  return logger.child({ module: name });
}

// Express middleware
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = randomUUID();
  const start = process.hrtime.bigint();
  
  // Attach request logger
  (req as any).log = logger.child({ requestId });
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: \`\${duration.toFixed(2)}ms\`,
      contentLength: res.get('content-length'),
    }, 'request completed');
  });
  
  next();
}

// Pino with Fastify
// import Fastify from 'fastify';
// const app = Fastify({ logger });

// Stream to file
import { createWriteStream } from 'fs';
import { join } from 'path';

export function createFileLogger(filename: string) {
  const stream = createWriteStream(join(__dirname, '..', 'logs', filename), { flags: 'a' });
  return pino(stream);
}

// Async context tracking
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<{ requestId: string }>();

export function withRequestContext<T>(requestId: string, fn: () => T): T {
  return asyncLocalStorage.run({ requestId }, fn);
}

export function getRequestId(): string | undefined {
  return asyncLocalStorage.getStore()?.requestId;
}
`;
    }

    // ========================================================================
    // PROMETHEUS METRICS
    // ========================================================================

    generatePrometheus(): string {
        return `import client from 'prom-client';

// Enable default metrics
client.collectDefaultMetrics({ prefix: 'app_' });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export const businessMetrics = {
  ordersCreated: new client.Counter({
    name: 'orders_created_total',
    help: 'Total orders created',
    labelNames: ['status'],
  }),
  
  userSignups: new client.Counter({
    name: 'user_signups_total',
    help: 'Total user signups',
    labelNames: ['method'],
  }),
  
  paymentProcessed: new client.Counter({
    name: 'payments_processed_total',
    help: 'Total payments processed',
    labelNames: ['provider', 'status'],
  }),
  
  cacheHitRate: new client.Gauge({
    name: 'cache_hit_rate',
    help: 'Cache hit rate percentage',
  }),
};

// Express middleware
import { Request, Response, NextFunction } from 'express';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });
  
  next();
}

// Metrics endpoint
import express from 'express';
const router = express.Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

export { router as metricsRouter };

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (req, res) => {
  // Check dependencies (DB, Redis, etc.)
  // const dbHealthy = await checkDatabase();
  res.json({ status: 'ready' });
});
`;
    }

    // ========================================================================
    // DATADOG
    // ========================================================================

    generateDatadog(): string {
        return `import tracer from 'dd-trace';

// Initialize tracer
tracer.init({
  service: process.env.DD_SERVICE || 'my-app',
  env: process.env.DD_ENV || 'development',
  version: process.env.DD_VERSION || '1.0.0',
  logInjection: true,
});

export { tracer };

// Custom spans
export function trace<T>(name: string, fn: () => T): T {
  const span = tracer.startSpan(name);
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() => span.finish()) as T;
    }
    span.finish();
    return result;
  } catch (error) {
    span.setTag('error', true);
    span.setTag('error.message', (error as Error).message);
    span.finish();
    throw error;
  }
}

// Metrics with DogStatsD
import StatsD from 'hot-shots';

const dogstatsd = new StatsD({
  host: process.env.DD_AGENT_HOST || 'localhost',
  port: 8125,
  prefix: 'app.',
  globalTags: { env: process.env.NODE_ENV || 'development' },
});

export const metrics = {
  increment: (name: string, tags?: string[]) => {
    dogstatsd.increment(name, 1, tags);
  },
  
  gauge: (name: string, value: number, tags?: string[]) => {
    dogstatsd.gauge(name, value, tags);
  },
  
  histogram: (name: string, value: number, tags?: string[]) => {
    dogstatsd.histogram(name, value, tags);
  },
  
  timing: (name: string, value: number, tags?: string[]) => {
    dogstatsd.timing(name, value, tags);
  },
  
  // Timer helper
  timer: (name: string, tags?: string[]) => {
    const start = Date.now();
    return {
      end: () => {
        dogstatsd.timing(name, Date.now() - start, tags);
      },
    };
  },
};

// Express middleware with APM
import { Request, Response, NextFunction } from 'express';

export function datadogMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const tags = [
      \`method:\${req.method}\`,
      \`route:\${req.route?.path || 'unknown'}\`,
      \`status:\${res.statusCode}\`,
    ];
    
    metrics.timing('http.request.duration', duration, tags);
    metrics.increment('http.request.count', tags);
  });
  
  next();
}

// Custom events
export function sendEvent(title: string, text: string, alertType: 'error' | 'warning' | 'info' | 'success' = 'info') {
  dogstatsd.event(title, text, { alert_type: alertType });
}
`;
    }

    generateEnvTemplate(provider: LoggingProvider | MonitoringProvider): string {
        switch (provider) {
            case 'winston':
            case 'pino':
                return `LOG_LEVEL=info
SERVICE_NAME=my-app`;
            case 'datadog':
                return `DD_SERVICE=my-app
DD_ENV=production
DD_VERSION=1.0.0
DD_AGENT_HOST=localhost`;
            default:
                return '';
        }
    }
}

export const loggingMonitoringGenerator = LoggingMonitoringGenerator.getInstance();
