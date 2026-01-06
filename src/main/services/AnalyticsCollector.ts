/**
 * Analytics Collector Service
 * 
 * Collect and aggregate usage metrics for the analytics dashboard
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

interface MetricEvent {
    type: string;
    data: Record<string, any>;
    timestamp: Date;
}

interface DailyStats {
    date: string;
    events: MetricEvent[];
    modelUsage: Record<string, { requests: number; tokens: number }>;
    featureUsage: Record<string, number>;
    chatCount: number;
    codeGenCount: number;
    successRate: number;
}

interface AnalyticsSummary {
    totalChats: number;
    totalCodeGenerations: number;
    totalTokens: number;
    avgResponseTime: number;
    modelUsage: Record<string, { requests: number; percentage: number }>;
    featureUsage: Record<string, number>;
    dailyActivity: Array<{ date: string; count: number }>;
    successRate: number;
}

/**
 * AnalyticsCollector - Track and aggregate usage metrics
 */
export class AnalyticsCollector extends EventEmitter {
    private static instance: AnalyticsCollector;
    private storageDir: string;
    private currentDay: DailyStats;
    private sessionStartTime: Date;
    private requestTimes: number[] = [];

    private constructor() {
        super();
        this.storageDir = path.join(app.getPath('userData'), 'analytics');
        this.sessionStartTime = new Date();
        this.currentDay = this.createEmptyDay();
        this.initialize();
    }

    static getInstance(): AnalyticsCollector {
        if (!AnalyticsCollector.instance) {
            AnalyticsCollector.instance = new AnalyticsCollector();
        }
        return AnalyticsCollector.instance;
    }

    /**
     * Initialize storage 
     */
    private async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
            await this.loadCurrentDay();
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    /**
     * Create empty day stats
     */
    private createEmptyDay(): DailyStats {
        return {
            date: new Date().toISOString().split('T')[0],
            events: [],
            modelUsage: {},
            featureUsage: {},
            chatCount: 0,
            codeGenCount: 0,
            successRate: 100,
        };
    }

    /**
     * Load current day stats
     */
    private async loadCurrentDay(): Promise<void> {
        const date = new Date().toISOString().split('T')[0];
        const filePath = path.join(this.storageDir, `${date}.json`);

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            this.currentDay = JSON.parse(content);
        } catch {
            this.currentDay = this.createEmptyDay();
        }
    }

    /**
     * Save current day stats
     */
    private async saveCurrentDay(): Promise<void> {
        const filePath = path.join(this.storageDir, `${this.currentDay.date}.json`);
        await fs.writeFile(filePath, JSON.stringify(this.currentDay, null, 2));
    }

    /**
     * Track a chat event
     */
    async trackChat(model: string, tokens: number, success: boolean, responseTimeMs: number): Promise<void> {
        this.currentDay.chatCount++;

        if (!this.currentDay.modelUsage[model]) {
            this.currentDay.modelUsage[model] = { requests: 0, tokens: 0 };
        }
        this.currentDay.modelUsage[model].requests++;
        this.currentDay.modelUsage[model].tokens += tokens;

        this.requestTimes.push(responseTimeMs);

        this.currentDay.events.push({
            type: 'chat',
            data: { model, tokens, success, responseTimeMs },
            timestamp: new Date(),
        });

        if (!success) {
            const total = this.currentDay.chatCount + this.currentDay.codeGenCount;
            const failures = this.currentDay.events.filter(e => !e.data.success).length;
            this.currentDay.successRate = ((total - failures) / total) * 100;
        }

        await this.saveCurrentDay();
        this.emit('metric:chat', { model, tokens, success });
    }

    /**
     * Track code generation
     */
    async trackCodeGen(language: string, linesGenerated: number, success: boolean): Promise<void> {
        this.currentDay.codeGenCount++;

        if (!this.currentDay.featureUsage['codeGen']) {
            this.currentDay.featureUsage['codeGen'] = 0;
        }
        this.currentDay.featureUsage['codeGen']++;

        this.currentDay.events.push({
            type: 'codeGen',
            data: { language, linesGenerated, success },
            timestamp: new Date(),
        });

        await this.saveCurrentDay();
        this.emit('metric:codeGen', { language, linesGenerated });
    }

    /**
     * Track feature usage
     */
    async trackFeature(feature: string): Promise<void> {
        if (!this.currentDay.featureUsage[feature]) {
            this.currentDay.featureUsage[feature] = 0;
        }
        this.currentDay.featureUsage[feature]++;

        this.currentDay.events.push({
            type: 'feature',
            data: { feature },
            timestamp: new Date(),
        });

        await this.saveCurrentDay();
        this.emit('metric:feature', { feature });
    }

    /**
     * Track custom event
     */
    async trackEvent(type: string, data: Record<string, any>): Promise<void> {
        this.currentDay.events.push({ type, data, timestamp: new Date() });
        await this.saveCurrentDay();
        this.emit(`metric:${type}`, data);
    }

    /**
     * Get analytics summary
     */
    async getSummary(days: number = 7): Promise<AnalyticsSummary> {
        const allStats: DailyStats[] = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const filePath = path.join(this.storageDir, `${dateStr}.json`);

            try {
                const content = await fs.readFile(filePath, 'utf-8');
                allStats.push(JSON.parse(content));
            } catch {
                // No data for this day
            }
        }

        // Aggregate
        let totalChats = 0;
        let totalCodeGenerations = 0;
        let totalTokens = 0;
        const modelUsage: Record<string, { requests: number; percentage: number }> = {};
        const featureUsage: Record<string, number> = {};
        const dailyActivity: Array<{ date: string; count: number }> = [];
        let successCount = 0;
        let totalOperations = 0;

        for (const stats of allStats) {
            totalChats += stats.chatCount;
            totalCodeGenerations += stats.codeGenCount;

            for (const [model, usage] of Object.entries(stats.modelUsage)) {
                if (!modelUsage[model]) modelUsage[model] = { requests: 0, percentage: 0 };
                modelUsage[model].requests += usage.requests;
                totalTokens += usage.tokens;
            }

            for (const [feature, count] of Object.entries(stats.featureUsage)) {
                if (!featureUsage[feature]) featureUsage[feature] = 0;
                featureUsage[feature] += count;
            }

            const dayCount = stats.chatCount + stats.codeGenCount;
            dailyActivity.push({ date: stats.date, count: dayCount });

            successCount += stats.events.filter(e => e.data.success !== false).length;
            totalOperations += stats.events.length;
        }

        // Calculate percentages
        const totalRequests = Object.values(modelUsage).reduce((sum, m) => sum + m.requests, 0);
        for (const model of Object.keys(modelUsage)) {
            modelUsage[model].percentage = totalRequests > 0
                ? (modelUsage[model].requests / totalRequests) * 100
                : 0;
        }

        const avgResponseTime = this.requestTimes.length > 0
            ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length
            : 0;

        return {
            totalChats,
            totalCodeGenerations,
            totalTokens,
            avgResponseTime,
            modelUsage,
            featureUsage,
            dailyActivity: dailyActivity.reverse(),
            successRate: totalOperations > 0 ? (successCount / totalOperations) * 100 : 100,
        };
    }

    /**
     * Get today's stats
     */
    getTodayStats(): DailyStats {
        return this.currentDay;
    }

    /**
     * Clear all analytics data
     */
    async clearAll(): Promise<void> {
        try {
            const files = await fs.readdir(this.storageDir);
            for (const file of files) {
                await fs.unlink(path.join(this.storageDir, file));
            }
            this.currentDay = this.createEmptyDay();
        } catch (error) {
            console.error('Failed to clear analytics:', error);
        }
    }
}

export default AnalyticsCollector;
