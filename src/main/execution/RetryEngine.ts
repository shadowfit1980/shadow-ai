/**
 * RetryEngine - Resilient API Call Handler
 * 
 * Provides fault tolerance for transient failures:
 * - Exponential backoff with jitter
 * - Circuit breaker pattern to prevent cascade failures
 * - Per-endpoint tracking and metrics
 * - Configurable retry policies
 * 
 * Usage:
 *   const result = await retryEngine.withRetry('openai', () => callOpenAI());
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Initial delay in milliseconds */
    baseDelay: number;
    /** Maximum delay in milliseconds */
    maxDelay: number;
    /** Delay multiplier for exponential backoff */
    multiplier: number;
    /** Add random jitter to prevent thundering herd */
    jitter: boolean;
    /** Error codes/types that should trigger retry */
    retryableErrors: string[];
}

export interface CircuitBreakerConfig {
    /** Number of consecutive failures to open circuit */
    failureThreshold: number;
    /** Time in ms before attempting recovery */
    cooldownPeriod: number;
    /** Number of successes in half-open state to close circuit */
    successThreshold: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface EndpointStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    retriedCalls: number;
    consecutiveFailures: number;
    lastFailureTime: number | null;
    circuitState: CircuitState;
    averageLatency: number;
}

export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalDuration: number;
    circuitBroken: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
    jitter: true,
    retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'EPIPE',
        'ENOTFOUND',
        '429',           // Rate limited
        '502',           // Bad Gateway
        '503',           // Service Unavailable
        '504',           // Gateway Timeout
        'socket hang up',
        'request timeout',
        'rate_limit_exceeded',
        'overloaded'
    ]
};

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    cooldownPeriod: 60000,
    successThreshold: 3
};

// ============================================================================
// RETRY ENGINE CLASS
// ============================================================================

export class RetryEngine extends EventEmitter {
    private endpoints: Map<string, EndpointStats> = new Map();
    private retryConfig: RetryConfig;
    private circuitConfig: CircuitBreakerConfig;
    private halfOpenSuccesses: Map<string, number> = new Map();

    constructor(
        retryConfig: Partial<RetryConfig> = {},
        circuitConfig: Partial<CircuitBreakerConfig> = {}
    ) {
        super();
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
        this.circuitConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...circuitConfig };
        console.log('[RetryEngine] Initialized with config:', {
            maxRetries: this.retryConfig.maxRetries,
            circuitThreshold: this.circuitConfig.failureThreshold
        });
    }

    /**
     * Execute function with retry logic
     */
    async withRetry<T>(
        endpointId: string,
        fn: () => Promise<T>,
        customConfig?: Partial<RetryConfig>
    ): Promise<RetryResult<T>> {
        const config = { ...this.retryConfig, ...customConfig };
        const startTime = Date.now();
        let attempts = 0;

        // Initialize endpoint stats if needed
        this.initializeEndpoint(endpointId);
        const stats = this.endpoints.get(endpointId)!;

        // Check circuit breaker
        if (this.isCircuitOpen(endpointId)) {
            return {
                success: false,
                error: new Error(`Circuit breaker open for ${endpointId}`),
                attempts: 0,
                totalDuration: 0,
                circuitBroken: true
            };
        }

        let lastError: Error | undefined;

        while (attempts <= config.maxRetries) {
            attempts++;
            stats.totalCalls++;

            try {
                const result = await fn();

                // Success - update stats
                stats.successfulCalls++;
                stats.consecutiveFailures = 0;
                stats.averageLatency = this.updateAverageLatency(
                    stats.averageLatency,
                    Date.now() - startTime,
                    stats.successfulCalls
                );

                // Handle half-open circuit
                if (stats.circuitState === 'half-open') {
                    this.handleHalfOpenSuccess(endpointId);
                }

                this.emit('success', { endpointId, attempts, duration: Date.now() - startTime });

                return {
                    success: true,
                    data: result,
                    attempts,
                    totalDuration: Date.now() - startTime,
                    circuitBroken: false
                };

            } catch (error: any) {
                lastError = error;
                stats.failedCalls++;

                const isRetryable = this.isRetryableError(error, config.retryableErrors);
                const hasRetriesLeft = attempts < config.maxRetries;

                if (isRetryable && hasRetriesLeft) {
                    stats.retriedCalls++;
                    const delay = this.calculateDelay(attempts, config);

                    this.emit('retry', {
                        endpointId,
                        attempt: attempts,
                        delay,
                        error: error.message
                    });

                    await this.sleep(delay);
                    continue;
                }

                // Final failure
                stats.consecutiveFailures++;
                stats.lastFailureTime = Date.now();

                // Check if we should open circuit
                this.checkCircuitBreaker(endpointId);

                this.emit('failure', {
                    endpointId,
                    attempts,
                    error: error.message,
                    circuitState: stats.circuitState
                });

                break;
            }
        }

        return {
            success: false,
            error: lastError,
            attempts,
            totalDuration: Date.now() - startTime,
            circuitBroken: stats.circuitState === 'open'
        };
    }

    /**
     * Check if error is retryable
     */
    private isRetryableError(error: any, retryableErrors: string[]): boolean {
        const errorStr = String(error.message || error.code || error);

        for (const pattern of retryableErrors) {
            if (errorStr.includes(pattern)) {
                return true;
            }
        }

        // Check HTTP status codes
        if (error.status || error.statusCode) {
            const status = String(error.status || error.statusCode);
            if (retryableErrors.includes(status)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate delay with exponential backoff and optional jitter
     */
    private calculateDelay(attempt: number, config: RetryConfig): number {
        let delay = config.baseDelay * Math.pow(config.multiplier, attempt - 1);
        delay = Math.min(delay, config.maxDelay);

        if (config.jitter) {
            // Add random jitter between 0-25% of delay
            const jitterFactor = 1 + (Math.random() * 0.25);
            delay = Math.floor(delay * jitterFactor);
        }

        return delay;
    }

    /**
     * Check and update circuit breaker state
     */
    private checkCircuitBreaker(endpointId: string): void {
        const stats = this.endpoints.get(endpointId)!;

        if (stats.consecutiveFailures >= this.circuitConfig.failureThreshold) {
            if (stats.circuitState !== 'open') {
                stats.circuitState = 'open';
                this.halfOpenSuccesses.set(endpointId, 0);

                this.emit('circuitOpen', {
                    endpointId,
                    failures: stats.consecutiveFailures
                });

                console.warn(`[RetryEngine] Circuit OPEN for ${endpointId} after ${stats.consecutiveFailures} failures`);
            }
        }
    }

    /**
     * Check if circuit is open (blocking requests)
     */
    private isCircuitOpen(endpointId: string): boolean {
        const stats = this.endpoints.get(endpointId);
        if (!stats) return false;

        if (stats.circuitState === 'open') {
            // Check if cooldown period has passed
            if (stats.lastFailureTime) {
                const timeSinceFailure = Date.now() - stats.lastFailureTime;
                if (timeSinceFailure >= this.circuitConfig.cooldownPeriod) {
                    // Transition to half-open
                    stats.circuitState = 'half-open';
                    this.halfOpenSuccesses.set(endpointId, 0);
                    this.emit('circuitHalfOpen', { endpointId });
                    console.log(`[RetryEngine] Circuit HALF-OPEN for ${endpointId}`);
                    return false;
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Handle success in half-open state
     */
    private handleHalfOpenSuccess(endpointId: string): void {
        const count = (this.halfOpenSuccesses.get(endpointId) || 0) + 1;
        this.halfOpenSuccesses.set(endpointId, count);

        if (count >= this.circuitConfig.successThreshold) {
            const stats = this.endpoints.get(endpointId)!;
            stats.circuitState = 'closed';
            stats.consecutiveFailures = 0;
            this.halfOpenSuccesses.delete(endpointId);

            this.emit('circuitClosed', { endpointId });
            console.log(`[RetryEngine] Circuit CLOSED for ${endpointId}`);
        }
    }

    /**
     * Initialize endpoint statistics
     */
    private initializeEndpoint(endpointId: string): void {
        if (!this.endpoints.has(endpointId)) {
            this.endpoints.set(endpointId, {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                retriedCalls: 0,
                consecutiveFailures: 0,
                lastFailureTime: null,
                circuitState: 'closed',
                averageLatency: 0
            });
        }
    }

    /**
     * Update running average latency
     */
    private updateAverageLatency(
        currentAvg: number,
        newValue: number,
        count: number
    ): number {
        if (count <= 1) return newValue;
        return currentAvg + (newValue - currentAvg) / count;
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get statistics for an endpoint
     */
    getStats(endpointId: string): EndpointStats | null {
        return this.endpoints.get(endpointId) || null;
    }

    /**
     * Get all endpoint statistics
     */
    getAllStats(): Record<string, EndpointStats> {
        const result: Record<string, EndpointStats> = {};
        for (const [id, stats] of this.endpoints) {
            result[id] = { ...stats };
        }
        return result;
    }

    /**
     * Manually reset circuit breaker for an endpoint
     */
    resetCircuit(endpointId: string): void {
        const stats = this.endpoints.get(endpointId);
        if (stats) {
            stats.circuitState = 'closed';
            stats.consecutiveFailures = 0;
            this.halfOpenSuccesses.delete(endpointId);
            this.emit('circuitReset', { endpointId });
            console.log(`[RetryEngine] Circuit manually RESET for ${endpointId}`);
        }
    }

    /**
     * Reset all statistics
     */
    resetAll(): void {
        this.endpoints.clear();
        this.halfOpenSuccesses.clear();
        console.log('[RetryEngine] All statistics reset');
    }

    /**
     * Get health summary
     */
    getHealthSummary(): {
        totalEndpoints: number;
        healthyEndpoints: number;
        degradedEndpoints: number;
        unhealthyEndpoints: number;
    } {
        let healthy = 0;
        let degraded = 0;
        let unhealthy = 0;

        for (const stats of this.endpoints.values()) {
            if (stats.circuitState === 'open') {
                unhealthy++;
            } else if (stats.circuitState === 'half-open' || stats.consecutiveFailures > 0) {
                degraded++;
            } else {
                healthy++;
            }
        }

        return {
            totalEndpoints: this.endpoints.size,
            healthyEndpoints: healthy,
            degradedEndpoints: degraded,
            unhealthyEndpoints: unhealthy
        };
    }
}

// Singleton instance
export const retryEngine = new RetryEngine();

// ============================================================================
// CONVENIENCE WRAPPER
// ============================================================================

/**
 * Wrap an async function with retry logic
 */
export async function withRetry<T>(
    endpointId: string,
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>
): Promise<T> {
    const result = await retryEngine.withRetry(endpointId, fn, config);

    if (result.success) {
        return result.data!;
    }

    if (result.circuitBroken) {
        throw new Error(`Service unavailable: ${endpointId} circuit breaker is open`);
    }

    throw result.error || new Error(`Failed after ${result.attempts} attempts`);
}
