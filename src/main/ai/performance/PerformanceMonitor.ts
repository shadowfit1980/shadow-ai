export interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: Date;
    success: boolean;
    metadata?: Record<string, any>;
}

export interface TokenUsage {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
}

export interface SystemMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalTokensUsed: number;
    uptime: number;
}

export class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private tokenUsage: TokenUsage[] = [];
    private startTime: Date = new Date();

    /**
     * Record a performance metric
     */
    record(metric: PerformanceMetric): void {
        this.metrics.push(metric);

        // Keep only last 1000 metrics
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
    }

    /**
     * Record token usage
     */
    recordTokens(usage: TokenUsage): void {
        this.tokenUsage.push(usage);
    }

    /**
     * Get system metrics
     */
    getMetrics(): SystemMetrics {
        const total = this.metrics.length;
        const successful = this.metrics.filter(m => m.success).length;
        const avgTime = total > 0
            ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / total
            : 0;
        const totalTokens = this.tokenUsage.reduce((sum, u) => sum + u.totalTokens, 0);

        return {
            totalRequests: total,
            successfulRequests: successful,
            failedRequests: total - successful,
            averageResponseTime: Math.round(avgTime),
            totalTokensUsed: totalTokens,
            uptime: Date.now() - this.startTime.getTime()
        };
    }

    /**
     * Get metrics for specific operation
     */
    getOperationMetrics(operation: string) {
        const ops = this.metrics.filter(m => m.operation === operation);

        if (ops.length === 0) {
            return null;
        }

        const avgDuration = ops.reduce((sum, m) => sum + m.duration, 0) / ops.length;
        const successRate = (ops.filter(m => m.success).length / ops.length) * 100;

        return {
            operation,
            count: ops.length,
            averageDuration: Math.round(avgDuration),
            successRate: Math.round(successRate),
            minDuration: Math.min(...ops.map(m => m.duration)),
            maxDuration: Math.max(...ops.map(m => m.duration))
        };
    }

    /**
     * Get slow operations (> 5s)
     */
    getSlowOperations(threshold: number = 5000) {
        return this.metrics
            .filter(m => m.duration > threshold)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 10);
    }

    /**
     * Clear metrics
     */
    clear(): void {
        this.metrics = [];
        this.tokenUsage = [];
    }
}

// Singleton
let monitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
    if (!monitor) {
        monitor = new PerformanceMonitor();
    }
    return monitor;
}
