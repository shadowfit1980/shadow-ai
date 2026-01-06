/**
 * Error Boundary Generator
 * 
 * Generate error boundaries and error handling code.
 */

import { EventEmitter } from 'events';

export class ErrorBoundaryGenerator extends EventEmitter {
    private static instance: ErrorBoundaryGenerator;

    private constructor() { super(); }

    static getInstance(): ErrorBoundaryGenerator {
        if (!ErrorBoundaryGenerator.instance) {
            ErrorBoundaryGenerator.instance = new ErrorBoundaryGenerator();
        }
        return ErrorBoundaryGenerator.instance;
    }

    generateReactErrorBoundary(options: { fallback?: string; onError?: boolean } = {}): string {
        const fallback = options.fallback || '<div>Something went wrong.</div>';
        return `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    ${options.onError ? '// Send to error tracking service\n    // errorService.report(error, errorInfo);' : ''}
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (${fallback});
    }
    return this.props.children;
  }
}
`;
    }

    generateTryCatchWrapper(funcName: string): string {
        return `async function ${funcName}Safe<T>(fn: () => Promise<T>): Promise<[T | null, Error | null]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}
`;
    }

    generateErrorHandler(): string {
        return `export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: Error | AppError) => {
  if (error instanceof AppError && error.isOperational) {
    console.error(\`[AppError] \${error.code}: \${error.message}\`);
    return { success: false, error: { code: error.code, message: error.message } };
  }
  console.error('[UnhandledError]', error);
  throw error;
};

export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);
`;
    }

    generateGlobalHandler(): string {
        return `process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
});
`;
    }
}

export const errorBoundaryGenerator = ErrorBoundaryGenerator.getInstance();
