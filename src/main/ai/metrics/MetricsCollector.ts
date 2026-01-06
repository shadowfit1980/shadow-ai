/**
 * MetricsCollector - Observability Dashboard Backend
 * 
 * Implements ChatGPT's suggestion for:
 * - Correctness, safety, productivity metrics
 * - Confidence calibration tracking
 * - Self-improvement delta over time
 * - Benchmark performance tracking
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MetricEntry {
    id: string;
    timestamp: Date;
    category: 'correctness' | 'safety' | 'productivity' | 'quality' | 'confidence';
    name: string;
    value: number;
    unit: string;
    context?: Record<string, any>;
}

export interface ConfidenceCalibration {
    predicted: number;
    actual: number;
    timestamp: Date;
    task: string;
}

export interface ImprovementDelta {
    metric: string;
    previousValue: number;
    currentValue: number;
    delta: number;
    percentChange: number;
    period: string;
    timestamp: Date;
}

export interface MetricsSummary {
    correctness: {
        testPassRate: number;
        runtimeErrors: number;
        successfulCompletions: number;
    };
    safety: {
        policyViolations: number;
        humanApprovalsRequired: number;
        blockedActions: number;
    };
    productivity: {
        tasksCompleted: number;
        averageTimeToFirstPR: number;
        codeGeneratedLines: number;
    };
    quality: {
        bugsPreRelease: number;
        codeChurnPrevented: number;
        refactoringSuggestions: number;
    };
    confidence: {
        averagePredicted: number;
        averageActual: number;
        calibrationError: number;
    };
}

/**
 * MetricsCollector tracks and analyzes agent performance
 */
export class MetricsCollector extends EventEmitter {
    private static instance: MetricsCollector;
    private metrics: MetricEntry[] = [];
    private calibrations: ConfidenceCalibration[] = [];
    private improvementHistory: ImprovementDelta[] = [];
    private persistPath: string;

    private constructor() {
        super();
        this.persistPath = path.join(process.cwd(), '.shadow-metrics');
    }

    static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    /**
     * Initialize and load persisted metrics
     */
    async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.persistPath, { recursive: true });
            await this.loadFromDisk();
            console.log(`📊 [MetricsCollector] Initialized with ${this.metrics.length} historical entries`);
        } catch {
            console.warn('[MetricsCollector] Could not initialize persistence');
        }
    }

    /**
     * Record a metric
     */
    recordMetric(params: {
        category: MetricEntry['category'];
        name: string;
        value: number;
        unit?: string;
        context?: Record<string, any>;
    }): string {
        const entry: MetricEntry = {
            id: `m-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date(),
            category: params.category,
            name: params.name,
            value: params.value,
            unit: params.unit || '',
            context: params.context,
        };

        this.metrics.push(entry);
        this.emit('metricRecorded', entry);

        // Persist async
        this.persistToDisk().catch(() => { });

        return entry.id;
    }

    /**
     * Record a confidence calibration point
     */
    recordCalibration(params: {
        predicted: number;
        actual: number;
        task: string;
    }): void {
        this.calibrations.push({
            predicted: params.predicted,
            actual: params.actual,
            task: params.task,
            timestamp: new Date(),
        });

        this.emit('calibrationRecorded', params);
    }

    /**
     * Record correctness metric (test pass rate)
     */
    recordTestResult(passed: boolean, testName: string): void {
        this.recordMetric({
            category: 'correctness',
            name: 'test_result',
            value: passed ? 1 : 0,
            unit: 'boolean',
            context: { testName },
        });
    }

    /**
     * Record runtime error
     */
    recordRuntimeError(error: string, location?: string): void {
        this.recordMetric({
            category: 'correctness',
            name: 'runtime_error',
            value: 1,
            unit: 'count',
            context: { error, location },
        });
    }

    /**
     * Record safety event
     */
    recordSafetyEvent(type: 'violation' | 'approval_required' | 'blocked', context?: any): void {
        this.recordMetric({
            category: 'safety',
            name: type,
            value: 1,
            unit: 'count',
            context,
        });
    }

    /**
     * Record productivity metric
     */
    recordProductivity(type: 'task_completed' | 'code_generated' | 'pr_created', value: number, context?: any): void {
        this.recordMetric({
            category: 'productivity',
            name: type,
            value,
            unit: type === 'code_generated' ? 'lines' : 'count',
            context,
        });
    }

    /**
     * Get metrics summary
     */
    getSummary(since?: Date): MetricsSummary {
        let filtered = this.metrics;
        if (since) {
            filtered = this.metrics.filter(m => m.timestamp >= since);
        }

        const correctnessMetrics = filtered.filter(m => m.category === 'correctness');
        const safetyMetrics = filtered.filter(m => m.category === 'safety');
        const productivityMetrics = filtered.filter(m => m.category === 'productivity');
        const qualityMetrics = filtered.filter(m => m.category === 'quality');

        // Calculate test pass rate
        const testResults = correctnessMetrics.filter(m => m.name === 'test_result');
        const testPassRate = testResults.length > 0
            ? testResults.filter(m => m.value === 1).length / testResults.length
            : 1;

        // Calculate calibration error
        const recentCalibrations = since
            ? this.calibrations.filter(c => c.timestamp >= since)
            : this.calibrations;

        const avgPredicted = recentCalibrations.length > 0
            ? recentCalibrations.reduce((sum, c) => sum + c.predicted, 0) / recentCalibrations.length
            : 0;
        const avgActual = recentCalibrations.length > 0
            ? recentCalibrations.reduce((sum, c) => sum + c.actual, 0) / recentCalibrations.length
            : 0;
        const calibrationError = Math.abs(avgPredicted - avgActual);

        return {
            correctness: {
                testPassRate,
                runtimeErrors: correctnessMetrics.filter(m => m.name === 'runtime_error').length,
                successfulCompletions: correctnessMetrics.filter(m => m.name === 'completion' && m.value === 1).length,
            },
            safety: {
                policyViolations: safetyMetrics.filter(m => m.name === 'violation').length,
                humanApprovalsRequired: safetyMetrics.filter(m => m.name === 'approval_required').length,
                blockedActions: safetyMetrics.filter(m => m.name === 'blocked').length,
            },
            productivity: {
                tasksCompleted: productivityMetrics.filter(m => m.name === 'task_completed').reduce((sum, m) => sum + m.value, 0),
                averageTimeToFirstPR: 0, // Would need timing data
                codeGeneratedLines: productivityMetrics.filter(m => m.name === 'code_generated').reduce((sum, m) => sum + m.value, 0),
            },
            quality: {
                bugsPreRelease: qualityMetrics.filter(m => m.name === 'bug_found').length,
                codeChurnPrevented: qualityMetrics.filter(m => m.name === 'churn_prevented').reduce((sum, m) => sum + m.value, 0),
                refactoringSuggestions: qualityMetrics.filter(m => m.name === 'refactor_suggestion').length,
            },
            confidence: {
                averagePredicted: avgPredicted,
                averageActual: avgActual,
                calibrationError,
            },
        };
    }

    /**
     * Calculate improvement delta over time
     */
    calculateImprovementDelta(metric: string, period: 'day' | 'week' | 'month'): ImprovementDelta | null {
        const now = new Date();
        let periodStart: Date;

        switch (period) {
            case 'day':
                periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }

        const recentMetrics = this.metrics.filter(m => m.name === metric && m.timestamp >= periodStart);
        const olderMetrics = this.metrics.filter(m =>
            m.name === metric &&
            m.timestamp < periodStart &&
            m.timestamp >= new Date(periodStart.getTime() - (now.getTime() - periodStart.getTime()))
        );

        if (recentMetrics.length === 0 || olderMetrics.length === 0) return null;

        const currentValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
        const previousValue = olderMetrics.reduce((sum, m) => sum + m.value, 0) / olderMetrics.length;
        const delta = currentValue - previousValue;
        const percentChange = previousValue !== 0 ? (delta / previousValue) * 100 : 0;

        const improvement: ImprovementDelta = {
            metric,
            previousValue,
            currentValue,
            delta,
            percentChange,
            period,
            timestamp: now,
        };

        this.improvementHistory.push(improvement);
        return improvement;
    }

    /**
     * Get calibration data for visualization
     */
    getCalibrationData(): { predicted: number; actual: number; count: number }[] {
        // Bucket by predicted confidence (0.0-0.1, 0.1-0.2, etc.)
        const buckets: Map<number, { predicted: number; actual: number[]; }> = new Map();

        for (const cal of this.calibrations) {
            const bucket = Math.floor(cal.predicted * 10) / 10;
            if (!buckets.has(bucket)) {
                buckets.set(bucket, { predicted: bucket, actual: [] });
            }
            buckets.get(bucket)!.actual.push(cal.actual);
        }

        return Array.from(buckets.values()).map(b => ({
            predicted: b.predicted,
            actual: b.actual.reduce((sum, v) => sum + v, 0) / b.actual.length,
            count: b.actual.length,
        })).sort((a, b) => a.predicted - b.predicted);
    }

    /**
     * Get metrics by category
     */
    getMetricsByCategory(category: MetricEntry['category'], limit: number = 100): MetricEntry[] {
        return this.metrics
            .filter(m => m.category === category)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get all improvement history
     */
    getImprovementHistory(): ImprovementDelta[] {
        return [...this.improvementHistory];
    }

    /**
     * Persist metrics to disk
     */
    private async persistToDisk(): Promise<void> {
        try {
            const data = {
                metrics: this.metrics.slice(-1000), // Keep last 1000
                calibrations: this.calibrations.slice(-500),
                improvements: this.improvementHistory.slice(-100),
            };
            const filepath = path.join(this.persistPath, 'metrics.json');
            await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            // Silent fail for persistence
        }
    }

    /**
     * Load metrics from disk
     */
    private async loadFromDisk(): Promise<void> {
        try {
            const filepath = path.join(this.persistPath, 'metrics.json');
            const content = await fs.readFile(filepath, 'utf-8');
            const data = JSON.parse(content);

            if (data.metrics) {
                this.metrics = data.metrics.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                }));
            }
            if (data.calibrations) {
                this.calibrations = data.calibrations.map((c: any) => ({
                    ...c,
                    timestamp: new Date(c.timestamp),
                }));
            }
            if (data.improvements) {
                this.improvementHistory = data.improvements.map((i: any) => ({
                    ...i,
                    timestamp: new Date(i.timestamp),
                }));
            }
        } catch {
            // No existing data
        }
    }
}

export default MetricsCollector;
