// Error handling types

export interface ErrorContext {
    stepId: string;
    operation: string;
    timestamp: Date;
    attempt: number;
    error: Error;
    metadata?: Record<string, any>;
}

export interface RecoveryStrategy {
    name: string;
    canHandle: (error: Error) => boolean;
    recover: (context: ErrorContext) => Promise<RecoveryResult>;
    priority: number;
}

export interface RecoveryResult {
    success: boolean;
    action: 'retry' | 'fallback' | 'skip' | 'abort';
    message: string;
    data?: any;
}

export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    initialDelay: number;
    maxDelay: number;
    multiplier: number;
}

export interface FallbackOption {
    name: string;
    execute: () => Promise<any>;
    condition?: (error: Error) => boolean;
}

export interface ErrorMetrics {
    totalErrors: number;
    recoveredErrors: number;
    failedRecoveries: number;
    errorsByType: Map<string, number>;
    averageRecoveryTime: number;
}
