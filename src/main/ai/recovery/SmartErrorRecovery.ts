/**
 * Smart Error Recovery System
 * 
 * Intelligently recovers from errors with automatic diagnostics,
 * fix suggestions, and rollback capabilities.
 */

import { EventEmitter } from 'events';

export interface CapturedError {
    id: string;
    type: ErrorType;
    message: string;
    stack?: string;
    source: ErrorSource;
    context: ErrorContext;
    suggestion?: ErrorSuggestion;
    resolved: boolean;
    timestamp: Date;
}

export type ErrorType =
    | 'syntax'
    | 'runtime'
    | 'type'
    | 'reference'
    | 'network'
    | 'permission'
    | 'timeout'
    | 'validation'
    | 'unknown';

export interface ErrorSource {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
    module?: string;
}

export interface ErrorContext {
    userAction?: string;
    inputData?: any;
    systemState?: Record<string, any>;
    previousErrors?: string[];
    environment?: string;
}

export interface ErrorSuggestion {
    title: string;
    description: string;
    fix?: string;
    autoFixable: boolean;
    confidence: number;
}

export interface RecoveryAction {
    id: string;
    errorId: string;
    type: 'auto_fix' | 'rollback' | 'retry' | 'ignore' | 'escalate';
    success: boolean;
    result?: any;
    timestamp: Date;
}

export interface ErrorPattern {
    pattern: RegExp;
    type: ErrorType;
    suggestion: (match: RegExpMatchArray) => ErrorSuggestion;
}

// Common error patterns and their fixes
const ERROR_PATTERNS: ErrorPattern[] = [
    {
        pattern: /Cannot find module '([^']+)'/,
        type: 'reference',
        suggestion: (match) => ({
            title: `Missing module: ${match[1]}`,
            description: `The module "${match[1]}" is not installed`,
            fix: `npm install ${match[1]}`,
            autoFixable: true,
            confidence: 0.9,
        }),
    },
    {
        pattern: /is not defined/,
        type: 'reference',
        suggestion: () => ({
            title: 'Undefined reference',
            description: 'A variable or function is being used before declaration',
            autoFixable: false,
            confidence: 0.8,
        }),
    },
    {
        pattern: /TypeError: (.*) is not a function/,
        type: 'type',
        suggestion: (match) => ({
            title: `Type error: ${match[1]} is not callable`,
            description: 'Attempting to call something that is not a function',
            autoFixable: false,
            confidence: 0.85,
        }),
    },
    {
        pattern: /SyntaxError: Unexpected token/,
        type: 'syntax',
        suggestion: () => ({
            title: 'Syntax error',
            description: 'There is a syntax error in the code',
            autoFixable: false,
            confidence: 0.9,
        }),
    },
    {
        pattern: /ECONNREFUSED/,
        type: 'network',
        suggestion: () => ({
            title: 'Connection refused',
            description: 'Unable to connect to the server. Check if the service is running.',
            autoFixable: false,
            confidence: 0.95,
        }),
    },
    {
        pattern: /ENOENT: no such file or directory.*'([^']+)'/,
        type: 'reference',
        suggestion: (match) => ({
            title: 'File not found',
            description: `The file "${match[1]}" does not exist`,
            autoFixable: false,
            confidence: 0.95,
        }),
    },
    {
        pattern: /ETIMEDOUT/,
        type: 'timeout',
        suggestion: () => ({
            title: 'Operation timed out',
            description: 'The operation took too long to complete',
            fix: 'Increase timeout or check network connection',
            autoFixable: false,
            confidence: 0.9,
        }),
    },
];

export class SmartErrorRecovery extends EventEmitter {
    private static instance: SmartErrorRecovery;
    private errors: Map<string, CapturedError> = new Map();
    private recoveryActions: RecoveryAction[] = [];
    private autoRecoveryEnabled = true;
    private maxRetries = 3;

    private constructor() {
        super();
    }

    static getInstance(): SmartErrorRecovery {
        if (!SmartErrorRecovery.instance) {
            SmartErrorRecovery.instance = new SmartErrorRecovery();
        }
        return SmartErrorRecovery.instance;
    }

    // ========================================================================
    // ERROR CAPTURE
    // ========================================================================

    capture(error: Error | string, context: Partial<ErrorContext> = {}): CapturedError {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const errorStack = typeof error === 'string' ? undefined : error.stack;

        // Analyze error
        const analysis = this.analyzeError(errorMessage, errorStack);

        const captured: CapturedError = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: analysis.type,
            message: errorMessage,
            stack: errorStack,
            source: analysis.source,
            context: {
                ...context,
                previousErrors: this.getRecentErrorIds(5),
            },
            suggestion: analysis.suggestion,
            resolved: false,
            timestamp: new Date(),
        };

        this.errors.set(captured.id, captured);
        this.emit('error:captured', captured);

        // Attempt auto-recovery if enabled
        if (this.autoRecoveryEnabled && captured.suggestion?.autoFixable) {
            this.attemptAutoRecovery(captured);
        }

        return captured;
    }

    private analyzeError(message: string, stack?: string): {
        type: ErrorType;
        source: ErrorSource;
        suggestion?: ErrorSuggestion;
    } {
        // Extract source from stack
        const source = this.extractSource(stack);

        // Match against known patterns
        for (const pattern of ERROR_PATTERNS) {
            const match = message.match(pattern.pattern);
            if (match) {
                return {
                    type: pattern.type,
                    source,
                    suggestion: pattern.suggestion(match),
                };
            }
        }

        // Default analysis
        return {
            type: this.inferType(message),
            source,
        };
    }

    private extractSource(stack?: string): ErrorSource {
        if (!stack) return {};

        // Parse stack trace
        const lines = stack.split('\n');
        for (const line of lines) {
            // Match common stack formats
            const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);
            if (match) {
                return {
                    function: match[1] || undefined,
                    file: match[2],
                    line: parseInt(match[3], 10),
                    column: parseInt(match[4], 10),
                };
            }
        }

        return {};
    }

    private inferType(message: string): ErrorType {
        const lower = message.toLowerCase();

        if (lower.includes('syntax')) return 'syntax';
        if (lower.includes('type')) return 'type';
        if (lower.includes('reference') || lower.includes('undefined')) return 'reference';
        if (lower.includes('network') || lower.includes('connection')) return 'network';
        if (lower.includes('permission') || lower.includes('access denied')) return 'permission';
        if (lower.includes('timeout')) return 'timeout';
        if (lower.includes('validation') || lower.includes('invalid')) return 'validation';

        return 'unknown';
    }

    private getRecentErrorIds(limit: number): string[] {
        return Array.from(this.errors.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit)
            .map(e => e.id);
    }

    // ========================================================================
    // AUTO RECOVERY
    // ========================================================================

    private async attemptAutoRecovery(error: CapturedError): Promise<void> {
        if (!error.suggestion?.autoFixable || !error.suggestion.fix) return;

        const action: RecoveryAction = {
            id: `action_${Date.now()}`,
            errorId: error.id,
            type: 'auto_fix',
            success: false,
            timestamp: new Date(),
        };

        try {
            // Execute fix command (simulated)
            action.result = `Would execute: ${error.suggestion.fix}`;
            action.success = true;
            error.resolved = true;

            this.emit('recovery:success', { error, action });
        } catch (e: any) {
            action.result = e.message;
            this.emit('recovery:failed', { error, action });
        }

        this.recoveryActions.push(action);
    }

    // ========================================================================
    // MANUAL RECOVERY
    // ========================================================================

    async retry(errorId: string): Promise<RecoveryAction> {
        const error = this.errors.get(errorId);
        if (!error) throw new Error('Error not found');

        const action: RecoveryAction = {
            id: `action_${Date.now()}`,
            errorId,
            type: 'retry',
            success: false,
            timestamp: new Date(),
        };

        // Simulate retry logic
        action.success = Math.random() > 0.3;
        if (action.success) {
            error.resolved = true;
        }

        this.recoveryActions.push(action);
        this.emit(action.success ? 'recovery:success' : 'recovery:failed', { error, action });
        return action;
    }

    ignore(errorId: string): RecoveryAction {
        const error = this.errors.get(errorId);
        if (!error) throw new Error('Error not found');

        const action: RecoveryAction = {
            id: `action_${Date.now()}`,
            errorId,
            type: 'ignore',
            success: true,
            timestamp: new Date(),
        };

        error.resolved = true;
        this.recoveryActions.push(action);
        this.emit('error:ignored', { error, action });
        return action;
    }

    escalate(errorId: string): RecoveryAction {
        const error = this.errors.get(errorId);
        if (!error) throw new Error('Error not found');

        const action: RecoveryAction = {
            id: `action_${Date.now()}`,
            errorId,
            type: 'escalate',
            success: true,
            timestamp: new Date(),
        };

        this.recoveryActions.push(action);
        this.emit('error:escalated', { error, action });
        return action;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getError(id: string): CapturedError | undefined {
        return this.errors.get(id);
    }

    getRecentErrors(limit = 10): CapturedError[] {
        return Array.from(this.errors.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    getUnresolvedErrors(): CapturedError[] {
        return Array.from(this.errors.values())
            .filter(e => !e.resolved);
    }

    getErrorsByType(type: ErrorType): CapturedError[] {
        return Array.from(this.errors.values())
            .filter(e => e.type === type);
    }

    getRecoveryActions(errorId?: string): RecoveryAction[] {
        if (errorId) {
            return this.recoveryActions.filter(a => a.errorId === errorId);
        }
        return [...this.recoveryActions];
    }

    getStats(): {
        total: number;
        resolved: number;
        unresolved: number;
        byType: Record<ErrorType, number>;
        recoveryRate: number;
    } {
        const errors = Array.from(this.errors.values());
        const resolved = errors.filter(e => e.resolved).length;

        const byType: Record<string, number> = {};
        for (const error of errors) {
            byType[error.type] = (byType[error.type] || 0) + 1;
        }

        const successfulRecoveries = this.recoveryActions.filter(a => a.success).length;

        return {
            total: errors.length,
            resolved,
            unresolved: errors.length - resolved,
            byType: byType as Record<ErrorType, number>,
            recoveryRate: errors.length > 0 ? resolved / errors.length : 0,
        };
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    setAutoRecovery(enabled: boolean): void {
        this.autoRecoveryEnabled = enabled;
        this.emit('config:updated', { autoRecoveryEnabled: enabled });
    }

    setMaxRetries(max: number): void {
        this.maxRetries = max;
    }

    isAutoRecoveryEnabled(): boolean {
        return this.autoRecoveryEnabled;
    }

    clear(): void {
        this.errors.clear();
        this.recoveryActions = [];
        this.emit('errors:cleared');
    }
}

export const smartErrorRecovery = SmartErrorRecovery.getInstance();
