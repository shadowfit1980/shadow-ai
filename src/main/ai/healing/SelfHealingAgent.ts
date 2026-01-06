/**
 * Self-Healing Agent
 * 
 * Automatically detects, diagnoses, and fixes errors,
 * with learning from past failures.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorDiagnosis {
    errorType: string;
    rootCause: string;
    suggestedFixes: string[];
    confidence: number;
    relatedErrors: string[];
}

interface HealingAttempt {
    id: string;
    error: string;
    fix: string;
    success: boolean;
    timestamp: number;
}

interface HealthCheck {
    component: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    lastCheck: number;
    issues: string[];
}

// ============================================================================
// SELF-HEALING AGENT
// ============================================================================

export class SelfHealingAgent extends EventEmitter {
    private static instance: SelfHealingAgent;
    private healingHistory: HealingAttempt[] = [];
    private errorPatterns: Map<string, string[]> = new Map();
    private healthStatus: Map<string, HealthCheck> = new Map();
    private isMonitoring: boolean = false;

    private constructor() {
        super();
        this.initializeErrorPatterns();
    }

    static getInstance(): SelfHealingAgent {
        if (!SelfHealingAgent.instance) {
            SelfHealingAgent.instance = new SelfHealingAgent();
        }
        return SelfHealingAgent.instance;
    }

    private initializeErrorPatterns(): void {
        // Common error patterns and their fixes
        this.errorPatterns.set('TypeError: Cannot read property', [
            'Add null check before accessing property',
            'Use optional chaining (?.) operator',
            'Ensure object is initialized before access',
        ]);

        this.errorPatterns.set('ReferenceError: is not defined', [
            'Import or define the missing variable',
            'Check for typos in variable name',
            'Ensure variable is in correct scope',
        ]);

        this.errorPatterns.set('SyntaxError', [
            'Check for missing brackets or parentheses',
            'Verify correct syntax for the language version',
            'Look for unclosed strings or template literals',
        ]);

        this.errorPatterns.set('ECONNREFUSED', [
            'Check if the target service is running',
            'Verify network connectivity',
            'Check firewall and security group settings',
        ]);

        this.errorPatterns.set('ENOTFOUND', [
            'Verify the hostname is correct',
            'Check DNS resolution',
            'Ensure network connectivity',
        ]);

        this.errorPatterns.set('ETIMEDOUT', [
            'Increase timeout settings',
            'Check network latency',
            'Verify service is responding',
        ]);

        this.errorPatterns.set('OutOfMemoryError', [
            'Increase memory allocation',
            'Optimize memory usage in code',
            'Implement pagination for large datasets',
        ]);
    }

    // ========================================================================
    // ERROR DIAGNOSIS
    // ========================================================================

    async diagnose(error: Error | string): Promise<ErrorDiagnosis> {
        const errorMessage = error instanceof Error ? error.message : error;
        const errorStack = error instanceof Error ? error.stack : '';

        // Find matching patterns
        let matchedPattern: string | null = null;
        let suggestedFixes: string[] = [];

        for (const [pattern, fixes] of this.errorPatterns.entries()) {
            if (errorMessage.includes(pattern)) {
                matchedPattern = pattern;
                suggestedFixes = fixes;
                break;
            }
        }

        // Analyze stack trace for root cause
        const rootCause = this.analyzeStackTrace(errorStack);

        // Find related errors from history
        const relatedErrors = this.findRelatedErrors(errorMessage);

        const diagnosis: ErrorDiagnosis = {
            errorType: matchedPattern || 'Unknown',
            rootCause,
            suggestedFixes,
            confidence: suggestedFixes.length > 0 ? 0.8 : 0.3,
            relatedErrors,
        };

        this.emit('error:diagnosed', diagnosis);
        return diagnosis;
    }

    private analyzeStackTrace(stack?: string): string {
        if (!stack) return 'Unknown - no stack trace available';

        const lines = stack.split('\n');
        const userCode = lines.find(line =>
            !line.includes('node_modules') &&
            line.includes('.ts') || line.includes('.js')
        );

        return userCode?.trim() || 'Error in external dependency';
    }

    private findRelatedErrors(errorMessage: string): string[] {
        return this.healingHistory
            .filter(h => this.calculateSimilarity(h.error, errorMessage) > 0.7)
            .map(h => h.error)
            .slice(0, 3);
    }

    private calculateSimilarity(a: string, b: string): number {
        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.toLowerCase().split(/\s+/));

        let intersection = 0;
        for (const word of wordsA) {
            if (wordsB.has(word)) intersection++;
        }

        return intersection / Math.max(wordsA.size, wordsB.size);
    }

    // ========================================================================
    // AUTO-HEALING
    // ========================================================================

    async attemptHeal(error: Error | string): Promise<HealingAttempt> {
        const diagnosis = await this.diagnose(error);
        const errorMessage = error instanceof Error ? error.message : error;

        // Check if we've successfully fixed this before
        const previousSuccess = this.findPreviousSuccessfulFix(errorMessage);

        const fix = previousSuccess || diagnosis.suggestedFixes[0] || 'Manual intervention required';

        const attempt: HealingAttempt = {
            id: this.generateId(),
            error: errorMessage,
            fix,
            success: false, // Will be updated after verification
            timestamp: Date.now(),
        };

        this.emit('healing:attempt', attempt);

        // In a real implementation, this would apply the fix
        // For now, we simulate the healing process
        attempt.success = Math.random() > 0.3; // 70% success rate for demo

        this.healingHistory.push(attempt);
        this.emit('healing:complete', attempt);

        return attempt;
    }

    private findPreviousSuccessfulFix(error: string): string | null {
        const successfulAttempt = this.healingHistory.find(h =>
            h.success && this.calculateSimilarity(h.error, error) > 0.8
        );
        return successfulAttempt?.fix || null;
    }

    // ========================================================================
    // HEALTH MONITORING
    // ========================================================================

    async checkHealth(component: string, checkFn: () => Promise<boolean>): Promise<HealthCheck> {
        const startTime = Date.now();
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        const issues: string[] = [];

        try {
            const isHealthy = await Promise.race([
                checkFn(),
                new Promise<boolean>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                ),
            ]);

            if (!isHealthy) {
                status = 'unhealthy';
                issues.push('Health check returned false');
            }
        } catch (error) {
            status = 'unhealthy';
            issues.push(error instanceof Error ? error.message : String(error));
        }

        const latency = Date.now() - startTime;

        // Degraded if latency is high
        if (status === 'healthy' && latency > 1000) {
            status = 'degraded';
            issues.push('High latency detected');
        }

        const healthCheck: HealthCheck = {
            component,
            status,
            latency,
            lastCheck: Date.now(),
            issues,
        };

        this.healthStatus.set(component, healthCheck);
        this.emit('health:checked', healthCheck);

        return healthCheck;
    }

    startMonitoring(interval: number = 30000): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.emit('monitoring:started');

        // Periodic health checks would go here
    }

    stopMonitoring(): void {
        this.isMonitoring = false;
        this.emit('monitoring:stopped');
    }

    getHealthStatus(): Map<string, HealthCheck> {
        return new Map(this.healthStatus);
    }

    // ========================================================================
    // CIRCUIT BREAKER
    // ========================================================================

    private circuitBreakers: Map<string, { failures: number; state: 'closed' | 'open' | 'half-open'; lastFailure: number }> = new Map();

    async executeWithCircuitBreaker<T>(
        name: string,
        operation: () => Promise<T>,
        options: { threshold?: number; timeout?: number } = {}
    ): Promise<T> {
        const { threshold = 5, timeout = 30000 } = options;

        let breaker = this.circuitBreakers.get(name);
        if (!breaker) {
            breaker = { failures: 0, state: 'closed', lastFailure: 0 };
            this.circuitBreakers.set(name, breaker);
        }

        // Check if circuit is open
        if (breaker.state === 'open') {
            if (Date.now() - breaker.lastFailure > timeout) {
                breaker.state = 'half-open';
            } else {
                throw new Error(`Circuit breaker open for: ${name}`);
            }
        }

        try {
            const result = await operation();

            // Reset on success
            if (breaker.state === 'half-open') {
                breaker.state = 'closed';
            }
            breaker.failures = 0;

            return result;
        } catch (error) {
            breaker.failures++;
            breaker.lastFailure = Date.now();

            if (breaker.failures >= threshold) {
                breaker.state = 'open';
                this.emit('circuit:opened', { name });
            }

            throw error;
        }
    }

    private generateId(): string {
        return `heal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const selfHealingAgent = SelfHealingAgent.getInstance();
