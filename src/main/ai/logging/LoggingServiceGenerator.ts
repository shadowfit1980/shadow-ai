/**
 * Logging Service Generator
 * 
 * Generate structured logging configurations for
 * Winston, Pino, and custom logging solutions.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type LogProvider = 'winston' | 'pino' | 'morgan' | 'custom';
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug' | 'trace';
export type LogTransport = 'console' | 'file' | 'http' | 'datadog' | 'elasticsearch' | 'cloudwatch';

export interface LogConfig {
    provider: LogProvider;
    level: LogLevel;
    transports: LogTransport[];
    format?: 'json' | 'pretty' | 'combined';
    redactPaths?: string[];
    includeTimestamp?: boolean;
    includeRequestId?: boolean;
}

// ============================================================================
// LOGGING SERVICE GENERATOR
// ============================================================================

export class LoggingServiceGenerator extends EventEmitter {
    private static instance: LoggingServiceGenerator;

    private constructor() {
        super();
    }

    static getInstance(): LoggingServiceGenerator {
        if (!LoggingServiceGenerator.instance) {
            LoggingServiceGenerator.instance = new LoggingServiceGenerator();
        }
        return LoggingServiceGenerator.instance;
    }

    // ========================================================================
    // WINSTON
    // ========================================================================

    generateWinston(config: LogConfig): string {
        return `import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for pretty printing
const prettyFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return \`\${timestamp} [\${level}]: \${message} \${metaStr}\`;
});

// Redact sensitive fields
const redactFormat = winston.format((info) => {
    const redactPaths = ${JSON.stringify(config.redactPaths || ['password', 'token', 'secret', 'authorization'])};
    
    const redact = (obj: any) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (const key of Object.keys(obj)) {
            if (redactPaths.some(p => key.toLowerCase().includes(p.toLowerCase()))) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                redact(obj[key]);
            }
        }
        return obj;
    };

    return redact({ ...info });
})();

// Transports
const transports: winston.transport[] = [];

${config.transports.includes('console') ? `// Console transport
transports.push(
    new winston.transports.Console({
        format: combine(
            colorize({ all: true }),
            ${config.format === 'json' ? 'json()' : 'prettyFormat'}
        ),
    })
);` : ''}

${config.transports.includes('file') ? `// File transport with rotation
transports.push(
    new DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: json(),
    })
);

// Error file transport
transports.push(
    new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: json(),
    })
);` : ''}

${config.transports.includes('http') ? `// HTTP transport for log aggregation
transports.push(
    new winston.transports.Http({
        host: process.env.LOG_SERVER_HOST || 'localhost',
        port: parseInt(process.env.LOG_SERVER_PORT || '3001'),
        path: '/logs',
    })
);` : ''}

// Create logger
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || '${config.level}',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        redactFormat,
        json()
    ),
    defaultMeta: {
        service: process.env.SERVICE_NAME || 'app',
        environment: process.env.NODE_ENV || 'development',
    },
    transports,
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
});

// Child logger for request context
export function createRequestLogger(requestId: string, userId?: string) {
    return logger.child({ requestId, userId });
}

// Stream for Morgan HTTP logging
export const httpLogStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};
`;
    }

    // ========================================================================
    // PINO
    // ========================================================================

    generatePino(config: LogConfig): string {
        return `import pino, { Logger, LoggerOptions } from 'pino';

const redactPaths = ${JSON.stringify(config.redactPaths || ['*.password', '*.token', '*.secret', '*.authorization', '*.apiKey'])};

const options: LoggerOptions = {
    level: process.env.LOG_LEVEL || '${config.level}',
    
    // Redaction
    redact: {
        paths: redactPaths,
        censor: '[REDACTED]',
    },
    
    // Formatting
    ${config.format === 'pretty' ? `transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },` : ''}
    
    // Base context
    base: {
        service: process.env.SERVICE_NAME || 'app',
        env: process.env.NODE_ENV || 'development',
    },
    
    // Timestamp
    timestamp: pino.stdTimeFunctions.isoTime,
    
    // Serializers
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            path: req.path,
            params: req.params,
            query: req.query,
            headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent'],
            },
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
        err: pino.stdSerializers.err,
    },
};

export const logger: Logger = pino(options);

// Child logger for request context
export function createRequestLogger(requestId: string, userId?: string) {
    return logger.child({ requestId, userId });
}

// Express/Fastify middleware
export function createPinoMiddleware() {
    return (req: any, res: any, next: any) => {
        const requestId = req.headers['x-request-id'] || crypto.randomUUID();
        const start = Date.now();
        
        req.log = logger.child({ requestId });
        res.setHeader('X-Request-ID', requestId);
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            req.log.info({
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration,
            }, 'request completed');
        });
        
        next();
    };
}

// File rotation with pino-rotate
${config.transports.includes('file') ? `
import { multistream } from 'pino';
import { createWriteStream } from 'pino-rotate';

const streams = [
    { stream: process.stdout },
    { 
        stream: createWriteStream({
            path: 'logs/app.log',
            size: '10M',
            interval: '1d',
            compress: true,
        })
    },
    {
        level: 'error',
        stream: createWriteStream({
            path: 'logs/error.log',
            size: '10M',
            interval: '1d',
            compress: true,
        })
    },
];

export const fileLogger = pino(options, multistream(streams));
` : ''}
`;
    }

    // ========================================================================
    // MORGAN HTTP LOGGING
    // ========================================================================

    generateMorgan(): string {
        return `import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom tokens
morgan.token('request-id', (req: Request) => (req as any).requestId || '-');
morgan.token('user-id', (req: Request) => (req as any).userId || 'anonymous');
morgan.token('body', (req: Request) => {
    if (req.body && Object.keys(req.body).length > 0) {
        // Redact sensitive fields
        const redacted = { ...req.body };
        ['password', 'token', 'secret', 'apiKey'].forEach(key => {
            if (redacted[key]) redacted[key] = '[REDACTED]';
        });
        return JSON.stringify(redacted);
    }
    return '-';
});

// Custom format
const jsonFormat = (tokens: any, req: Request, res: Response) => {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId: tokens['request-id'](req, res),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: parseInt(tokens.status(req, res) || '0'),
        responseTime: parseFloat(tokens['response-time'](req, res) || '0'),
        contentLength: parseInt(tokens.res(req, res, 'content-length') || '0'),
        userAgent: tokens['user-agent'](req, res),
        ip: tokens['remote-addr'](req, res),
        userId: tokens['user-id'](req, res),
    });
};

// Development format
const devFormat = ':method :url :status :response-time ms - :res[content-length]';

// Create middleware
export const httpLogger = morgan(
    process.env.NODE_ENV === 'production' ? jsonFormat : devFormat,
    {
        skip: (req: Request) => {
            // Skip health checks
            return req.url === '/health' || req.url === '/ready';
        },
    }
);

// Stream for combining with Winston
export const morganStream = {
    write: (message: string) => {
        // Integrate with your main logger here
        console.log(message.trim());
    },
};
`;
    }

    // ========================================================================
    // STRUCTURED LOGGING MIDDLEWARE
    // ========================================================================

    generateLoggingMiddleware(): string {
        return `import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger'; // Your logger

declare global {
    namespace Express {
        interface Request {
            requestId: string;
            log: typeof logger;
        }
    }
}

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    const startTime = Date.now();

    // Attach to request
    req.requestId = requestId;
    req.log = logger.child({ requestId });

    // Set response header
    res.setHeader('X-Request-ID', requestId);

    // Log request
    req.log.info({
        type: 'request',
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });

    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        const logData = {
            type: 'response',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('content-length'),
        };

        if (res.statusCode >= 500) {
            req.log.error(logData);
        } else if (res.statusCode >= 400) {
            req.log.warn(logData);
        } else {
            req.log.info(logData);
        }
    });

    next();
}

// Error logging middleware
export function errorLoggingMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    req.log.error({
        type: 'error',
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
        },
        method: req.method,
        url: req.originalUrl,
    });

    next(err);
}

// Performance logging
export function performanceLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1000000;

        if (durationMs > 1000) {
            req.log.warn({
                type: 'slow-request',
                duration: durationMs,
                method: req.method,
                url: req.originalUrl,
            });
        }
    });

    next();
}
`;
    }
}

export const loggingServiceGenerator = LoggingServiceGenerator.getInstance();
