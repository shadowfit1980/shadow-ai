/**
 * ModelProfiler - Persistent Model Performance Tracking
 * 
 * Tracks model performance metrics over time:
 * - Latency (avg, p50, p95, p99)
 * - Success/failure rates
 * - Cost tracking
 * - Hallucination incidents
 * - Quality scores from user feedback
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface ModelMetric {
    timestamp: number;
    latencyMs: number;
    success: boolean;
    tokenCount: number;
    cost: number;
    feedbackScore?: number;  // 1-5 user rating
    hallucinationFlag?: boolean;
}

export interface ModelHealth {
    modelId: string;
    totalCalls: number;
    successRate: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    totalCost: number;
    avgFeedbackScore: number;
    hallucinationRate: number;
    healthScore: number;  // 0-100 overall health
    lastUsed: number;
}

export interface ProfilerConfig {
    maxMetricsPerModel: number;
    metricsRetentionDays: number;
    persistPath: string;
}

const DEFAULT_CONFIG: ProfilerConfig = {
    maxMetricsPerModel: 1000,
    metricsRetentionDays: 30,
    persistPath: ''  // Set in constructor
};

export class ModelProfiler {
    private static instance: ModelProfiler;
    private metrics: Map<string, ModelMetric[]> = new Map();
    private config: ProfilerConfig;
    private persistPath: string;
    private saveDebounce: NodeJS.Timeout | null = null;

    private constructor() {
        // Get persist path
        try {
            this.persistPath = path.join(app.getPath('userData'), 'model-profiles.json');
        } catch {
            this.persistPath = path.join(process.cwd(), '.model-profiles.json');
        }

        this.config = { ...DEFAULT_CONFIG, persistPath: this.persistPath };
        this.loadFromDisk();
        console.log('[ModelProfiler] Initialized with', this.metrics.size, 'model profiles');
    }

    static getInstance(): ModelProfiler {
        if (!ModelProfiler.instance) {
            ModelProfiler.instance = new ModelProfiler();
        }
        return ModelProfiler.instance;
    }

    /**
     * Record a model call metric
     */
    recordMetric(modelId: string, metric: Omit<ModelMetric, 'timestamp'>): void {
        const fullMetric: ModelMetric = {
            ...metric,
            timestamp: Date.now()
        };

        if (!this.metrics.has(modelId)) {
            this.metrics.set(modelId, []);
        }

        const modelMetrics = this.metrics.get(modelId)!;
        modelMetrics.push(fullMetric);

        // Trim old metrics
        if (modelMetrics.length > this.config.maxMetricsPerModel) {
            modelMetrics.splice(0, modelMetrics.length - this.config.maxMetricsPerModel);
        }

        this.debouncedSave();
    }

    /**
     * Add user feedback to the most recent metric
     */
    recordFeedback(modelId: string, score: number, hallucinationFlag?: boolean): void {
        const modelMetrics = this.metrics.get(modelId);
        if (modelMetrics && modelMetrics.length > 0) {
            const lastMetric = modelMetrics[modelMetrics.length - 1];
            lastMetric.feedbackScore = score;
            if (hallucinationFlag !== undefined) {
                lastMetric.hallucinationFlag = hallucinationFlag;
            }
            this.debouncedSave();
        }
    }

    /**
     * Get health summary for a model
     */
    getModelHealth(modelId: string): ModelHealth | null {
        const modelMetrics = this.metrics.get(modelId);
        if (!modelMetrics || modelMetrics.length === 0) {
            return null;
        }

        // Filter to recent metrics (last 30 days)
        const cutoff = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
        const recentMetrics = modelMetrics.filter(m => m.timestamp > cutoff);

        if (recentMetrics.length === 0) {
            return null;
        }

        // Calculate statistics
        const successCount = recentMetrics.filter(m => m.success).length;
        const latencies = recentMetrics.filter(m => m.success).map(m => m.latencyMs).sort((a, b) => a - b);
        const feedbackScores = recentMetrics.filter(m => m.feedbackScore).map(m => m.feedbackScore!);
        const hallucinationCount = recentMetrics.filter(m => m.hallucinationFlag).length;
        const totalCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0);

        const avgLatency = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;

        const p50 = this.percentile(latencies, 50);
        const p95 = this.percentile(latencies, 95);
        const p99 = this.percentile(latencies, 99);

        const avgFeedback = feedbackScores.length > 0
            ? feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length
            : 3;  // Default neutral

        const successRate = successCount / recentMetrics.length;
        const hallucinationRate = hallucinationCount / recentMetrics.length;

        // Calculate overall health score (0-100)
        const healthScore = this.calculateHealthScore(
            successRate,
            avgLatency,
            avgFeedback,
            hallucinationRate
        );

        return {
            modelId,
            totalCalls: recentMetrics.length,
            successRate,
            avgLatencyMs: avgLatency,
            p50LatencyMs: p50,
            p95LatencyMs: p95,
            p99LatencyMs: p99,
            totalCost,
            avgFeedbackScore: avgFeedback,
            hallucinationRate,
            healthScore,
            lastUsed: Math.max(...recentMetrics.map(m => m.timestamp))
        };
    }

    /**
     * Get health for all tracked models
     */
    getAllModelHealth(): ModelHealth[] {
        const health: ModelHealth[] = [];
        for (const modelId of this.metrics.keys()) {
            const modelHealth = this.getModelHealth(modelId);
            if (modelHealth) {
                health.push(modelHealth);
            }
        }
        return health.sort((a, b) => b.healthScore - a.healthScore);
    }

    /**
     * Get recommended models based on health scores
     */
    getRecommendedModels(topN: number = 5): string[] {
        return this.getAllModelHealth()
            .slice(0, topN)
            .map(h => h.modelId);
    }

    /**
     * Check if a model is healthy enough to use
     */
    isModelHealthy(modelId: string, minHealthScore: number = 50): boolean {
        const health = this.getModelHealth(modelId);
        if (!health) return true;  // No data, assume healthy
        return health.healthScore >= minHealthScore;
    }

    /**
     * Calculate percentile from sorted array
     */
    private percentile(sortedArr: number[], p: number): number {
        if (sortedArr.length === 0) return 0;
        const index = Math.ceil((p / 100) * sortedArr.length) - 1;
        return sortedArr[Math.max(0, index)];
    }

    /**
     * Calculate overall health score (0-100)
     */
    private calculateHealthScore(
        successRate: number,
        avgLatency: number,
        avgFeedback: number,
        hallucinationRate: number
    ): number {
        // Weights for different factors
        const successWeight = 40;
        const latencyWeight = 20;
        const feedbackWeight = 25;
        const hallucinationWeight = 15;

        // Success rate contribution (0-40)
        const successScore = successRate * successWeight;

        // Latency contribution - faster is better (0-20)
        // Assume 500ms is excellent, 5000ms is poor
        const latencyScore = Math.max(0, (1 - avgLatency / 5000)) * latencyWeight;

        // Feedback contribution - scale 1-5 to 0-25
        const feedbackScore = ((avgFeedback - 1) / 4) * feedbackWeight;

        // Hallucination penalty (0-15, higher rate = lower score)
        const hallucinationScore = (1 - hallucinationRate) * hallucinationWeight;

        return Math.round(successScore + latencyScore + feedbackScore + hallucinationScore);
    }

    /**
     * Save metrics to disk with debouncing
     */
    private debouncedSave(): void {
        if (this.saveDebounce) {
            clearTimeout(this.saveDebounce);
        }
        this.saveDebounce = setTimeout(() => this.saveToDisk(), 5000);
    }

    private saveToDisk(): void {
        try {
            const data: Record<string, ModelMetric[]> = {};
            for (const [modelId, metrics] of this.metrics) {
                data[modelId] = metrics;
            }
            fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
            console.log('[ModelProfiler] Saved metrics to disk');
        } catch (error) {
            console.error('[ModelProfiler] Failed to save:', error);
        }
    }

    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.persistPath)) {
                const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf-8'));
                for (const [modelId, metrics] of Object.entries(data)) {
                    this.metrics.set(modelId, metrics as ModelMetric[]);
                }
            }
        } catch (error) {
            console.error('[ModelProfiler] Failed to load:', error);
        }
    }

    /**
     * Get raw metrics for a model (for debugging)
     */
    getRawMetrics(modelId: string): ModelMetric[] {
        return this.metrics.get(modelId) || [];
    }

    /**
     * Clear all metrics (for testing)
     */
    clearAll(): void {
        this.metrics.clear();
        this.saveToDisk();
    }
}

export const modelProfiler = ModelProfiler.getInstance();
