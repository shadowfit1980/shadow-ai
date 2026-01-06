import { ErrorContext, RecoveryStrategy, RecoveryResult } from './types';

export class ErrorRecoverySystem {
    private strategies: RecoveryStrategy[] = [];
    private metrics = {
        totalErrors: 0,
        recoveredErrors: 0,
        failedRecoveries: 0,
    };

    /**
     * Register a recovery strategy
     */
    registerStrategy(strategy: RecoveryStrategy): void {
        this.strategies.push(strategy);
        this.strategies.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Attempt to recover from an error
     */
    async recover(context: ErrorContext): Promise<RecoveryResult> {
        this.metrics.totalErrors++;

        console.log(`🔧 Attempting recovery for: ${context.operation}`);

        // Find applicable strategies
        const applicableStrategies = this.strategies.filter(s =>
            s.canHandle(context.error)
        );

        if (applicableStrategies.length === 0) {
            this.metrics.failedRecoveries++;
            return {
                success: false,
                action: 'abort',
                message: 'No recovery strategy available'
            };
        }

        // Try strategies in priority order
        for (const strategy of applicableStrategies) {
            try {
                const result = await strategy.recover(context);

                if (result.success) {
                    this.metrics.recoveredErrors++;
                    console.log(`✅ Recovery successful: ${strategy.name}`);
                    return result;
                }
            } catch (error) {
                console.warn(`Strategy ${strategy.name} failed:`, error);
            }
        }

        this.metrics.failedRecoveries++;
        return {
            success: false,
            action: 'abort',
            message: 'All recovery strategies failed'
        };
    }

    /**
     * Get error metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            recoveryRate: this.metrics.totalErrors > 0
                ? (this.metrics.recoveredErrors / this.metrics.totalErrors) * 100
                : 0
        };
    }
}

// Singleton
let instance: ErrorRecoverySystem | null = null;

export function getRecoverySystem(): ErrorRecoverySystem {
    if (!instance) {
        instance = new ErrorRecoverySystem();
        initializeDefaultStrategies(instance);
    }
    return instance;
}

// Default strategies
function initializeDefaultStrategies(system: ErrorRecoverySystem) {
    // Network error retry
    system.registerStrategy({
        name: 'NetworkRetry',
        priority: 100,
        canHandle: (error) =>
            error.message.includes('network') ||
            error.message.includes('timeout') ||
            error.message.includes('ECONNREFUSED'),
        recover: async (context) => {
            if (context.attempt < 3) {
                await delay(Math.pow(2, context.attempt) * 1000);
                return {
                    success: true,
                    action: 'retry',
                    message: 'Retrying after network error'
                };
            }
            return {
                success: false,
                action: 'abort',
                message: 'Max retries exceeded'
            };
        }
    });

    // Rate limit handling
    system.registerStrategy({
        name: 'RateLimitBackoff',
        priority: 90,
        canHandle: (error) =>
            error.message.includes('429') ||
            error.message.includes('rate limit'),
        recover: async (context) => {
            const backoffTime = 5000 * context.attempt;
            console.log(`⏱️ Rate limited, waiting ${backoffTime}ms`);
            await delay(backoffTime);
            return {
                success: true,
                action: 'retry',
                message: 'Retrying after rate limit backoff'
            };
        }
    });

    // Validation error skip
    system.registerStrategy({
        name: 'ValidationSkip',
        priority: 50,
        canHandle: (error) =>
            error.message.includes('validation') ||
            error.message.includes('invalid'),
        recover: async () => ({
            success: true,
            action: 'skip',
            message: 'Skipping invalid operation'
        })
    });
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
