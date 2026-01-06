// Error Handling Generator - Generate error handling utilities
import Anthropic from '@anthropic-ai/sdk';

class ErrorHandlingGenerator {
    private anthropic: Anthropic | null = null;

    generateErrorClasses(): string {
        return `// Custom Error Classes
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;

    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string[]>;

    constructor(errors: Record<string, string[]>) {
        super('Validation failed', 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(\`\${resource} not found\`, 404, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class RateLimitError extends AppError {
    public readonly retryAfter: number;

    constructor(retryAfter = 60) {
        super('Rate limit exceeded', 429, 'RATE_LIMIT');
        this.retryAfter = retryAfter;
    }
}
`;
    }

    generateExpressErrorHandler(): string {
        return `import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';

// Async handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler middleware
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err instanceof ValidationError && { errors: err.errors }),
            },
        });
    }

    // Handle Mongoose/Prisma errors
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid ID format' } });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message } });
    }

    // Default error
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
        },
    });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: \`Route \${req.originalUrl} not found\` },
    });
};
`;
    }

    generateReactErrorBoundary(): string {
        return `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>Something went wrong</h2>
                    <p>{this.state.error?.message}</p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}>
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// HOC for error boundary
export function withErrorBoundary<P extends object>(WrappedComponent: React.ComponentType<P>, fallback?: ReactNode) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
`;
    }

    generateResultType(): string {
        return `// Result type for functional error handling
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export function Ok<T>(data: T): Result<T, never> {
    return { success: true, data };
}

export function Err<E>(error: E): Result<never, E> {
    return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
    return result.success === false;
}

// Wrap async functions to return Result
export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
    try {
        const data = await fn();
        return Ok(data);
    } catch (error) {
        return Err(error instanceof Error ? error : new Error(String(error)));
    }
}

// Map over Result
export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    return result.success ? Ok(fn(result.data)) : result;
}
`;
    }
}

export const errorHandlingGenerator = new ErrorHandlingGenerator();
