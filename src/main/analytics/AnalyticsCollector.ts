/**
 * Analytics Collector
 * Tracks agent performance metrics, KPIs, and business outcomes
 * Similar to Cognigy Insights
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface ConversationMetrics {
    id: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    messageCount: number;
    userMessages: number;
    agentMessages: number;
    toolCalls: number;
    toolCallSuccess: number;
    toolCallFailure: number;
    resolved: boolean;
    handoffToHuman: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
    tags?: string[];
}

export interface ToolMetrics {
    toolName: string;
    callCount: number;
    successCount: number;
    failureCount: number;
    avgLatency: number;
    totalLatency: number;
}

export interface DailyMetrics {
    date: string;
    totalConversations: number;
    resolvedConversations: number;
    avgConversationDuration: number;
    avgResponseTime: number;
    toolCalls: number;
    toolSuccessRate: number;
    handoffRate: number;
    sentimentPositive: number;
    sentimentNeutral: number;
    sentimentNegative: number;
}

export interface AgentPerformance {
    period: 'day' | 'week' | 'month';
    conversations: number;
    resolutionRate: number;
    avgDuration: number;
    avgResponseTime: number;
    toolSuccessRate: number;
    handoffRate: number;
    topTools: Array<{ name: string; count: number }>;
    sentimentBreakdown: { positive: number; neutral: number; negative: number };
}

/**
 * AnalyticsCollector
 * Collects and aggregates agent performance metrics
 */
export class AnalyticsCollector extends EventEmitter {
    private static instance: AnalyticsCollector;
    private store: Store;
    private conversations: Map<string, ConversationMetrics> = new Map();
    private toolMetrics: Map<string, ToolMetrics> = new Map();
    private dailyMetrics: Map<string, DailyMetrics> = new Map();
    private currentConversation: string | null = null;

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-analytics' });
        this.loadPersistedMetrics();
    }

    static getInstance(): AnalyticsCollector {
        if (!AnalyticsCollector.instance) {
            AnalyticsCollector.instance = new AnalyticsCollector();
        }
        return AnalyticsCollector.instance;
    }

    /**
     * Start tracking a new conversation
     */
    startConversation(conversationId?: string): string {
        const id = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const metrics: ConversationMetrics = {
            id,
            startTime: Date.now(),
            messageCount: 0,
            userMessages: 0,
            agentMessages: 0,
            toolCalls: 0,
            toolCallSuccess: 0,
            toolCallFailure: 0,
            resolved: false,
            handoffToHuman: false,
        };

        this.conversations.set(id, metrics);
        this.currentConversation = id;
        this.emit('conversationStarted', { id });

        return id;
    }

    /**
     * End a conversation
     */
    endConversation(conversationId: string, resolved = false): ConversationMetrics | null {
        const metrics = this.conversations.get(conversationId);
        if (!metrics) return null;

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.resolved = resolved;

        this.updateDailyMetrics(metrics);
        this.emit('conversationEnded', metrics);
        this.persist();

        return metrics;
    }

    /**
     * Track a message
     */
    trackMessage(conversationId: string, role: 'user' | 'agent' | 'system'): void {
        const metrics = this.conversations.get(conversationId);
        if (!metrics) return;

        metrics.messageCount++;
        if (role === 'user') {
            metrics.userMessages++;
        } else if (role === 'agent') {
            metrics.agentMessages++;
        }

        this.emit('messageTracked', { conversationId, role });
    }

    /**
     * Track a tool call
     */
    trackToolCall(conversationId: string, toolName: string, success: boolean, latency: number): void {
        const convMetrics = this.conversations.get(conversationId);
        if (convMetrics) {
            convMetrics.toolCalls++;
            if (success) {
                convMetrics.toolCallSuccess++;
            } else {
                convMetrics.toolCallFailure++;
            }
        }

        // Update tool metrics
        const tool = this.toolMetrics.get(toolName) || {
            toolName,
            callCount: 0,
            successCount: 0,
            failureCount: 0,
            avgLatency: 0,
            totalLatency: 0,
        };

        tool.callCount++;
        if (success) {
            tool.successCount++;
        } else {
            tool.failureCount++;
        }
        tool.totalLatency += latency;
        tool.avgLatency = tool.totalLatency / tool.callCount;

        this.toolMetrics.set(toolName, tool);
        this.emit('toolCallTracked', { toolName, success, latency });
    }

    /**
     * Track handoff to human
     */
    trackHandoff(conversationId: string): void {
        const metrics = this.conversations.get(conversationId);
        if (!metrics) return;

        metrics.handoffToHuman = true;
        this.emit('handoffTracked', { conversationId });
    }

    /**
     * Track sentiment
     */
    trackSentiment(conversationId: string, sentiment: 'positive' | 'neutral' | 'negative'): void {
        const metrics = this.conversations.get(conversationId);
        if (!metrics) return;

        metrics.sentiment = sentiment;
        this.emit('sentimentTracked', { conversationId, sentiment });
    }

    /**
     * Get conversation metrics
     */
    getConversation(conversationId: string): ConversationMetrics | null {
        return this.conversations.get(conversationId) || null;
    }

    /**
     * Get all tool metrics
     */
    getToolMetrics(): ToolMetrics[] {
        return Array.from(this.toolMetrics.values());
    }

    /**
     * Get metrics for a specific tool
     */
    getToolMetric(toolName: string): ToolMetrics | null {
        return this.toolMetrics.get(toolName) || null;
    }

    /**
     * Get daily metrics
     */
    getDailyMetrics(date?: string): DailyMetrics | null {
        const key = date || this.getDateKey();
        return this.dailyMetrics.get(key) || null;
    }

    /**
     * Get metrics for a date range
     */
    getMetricsRange(startDate: string, endDate: string): DailyMetrics[] {
        const results: DailyMetrics[] = [];

        for (const [date, metrics] of this.dailyMetrics) {
            if (date >= startDate && date <= endDate) {
                results.push(metrics);
            }
        }

        return results.sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Get aggregated performance metrics
     */
    getPerformance(period: 'day' | 'week' | 'month' = 'week'): AgentPerformance {
        const now = new Date();
        let startDate: string;

        switch (period) {
            case 'day':
                startDate = this.getDateKey(now);
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                startDate = this.getDateKey(weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                startDate = this.getDateKey(monthAgo);
                break;
        }

        const endDate = this.getDateKey(now);
        const dailyData = this.getMetricsRange(startDate, endDate);

        // Aggregate
        let totalConversations = 0;
        let totalResolved = 0;
        let totalDuration = 0;
        let totalResponseTime = 0;
        let totalToolCalls = 0;
        let totalToolSuccess = 0;
        let totalHandoffs = 0;
        let sentimentPos = 0, sentimentNeu = 0, sentimentNeg = 0;

        for (const day of dailyData) {
            totalConversations += day.totalConversations;
            totalResolved += day.resolvedConversations;
            totalDuration += day.avgConversationDuration * day.totalConversations;
            totalResponseTime += day.avgResponseTime * day.totalConversations;
            totalToolCalls += day.toolCalls;
            totalToolSuccess += day.toolCalls * day.toolSuccessRate;
            totalHandoffs += day.totalConversations * day.handoffRate;
            sentimentPos += day.sentimentPositive;
            sentimentNeu += day.sentimentNeutral;
            sentimentNeg += day.sentimentNegative;
        }

        const topTools = Array.from(this.toolMetrics.values())
            .sort((a, b) => b.callCount - a.callCount)
            .slice(0, 5)
            .map(t => ({ name: t.toolName, count: t.callCount }));

        return {
            period,
            conversations: totalConversations,
            resolutionRate: totalConversations > 0 ? totalResolved / totalConversations : 0,
            avgDuration: totalConversations > 0 ? totalDuration / totalConversations : 0,
            avgResponseTime: totalConversations > 0 ? totalResponseTime / totalConversations : 0,
            toolSuccessRate: totalToolCalls > 0 ? totalToolSuccess / totalToolCalls : 0,
            handoffRate: totalConversations > 0 ? totalHandoffs / totalConversations : 0,
            topTools,
            sentimentBreakdown: {
                positive: sentimentPos,
                neutral: sentimentNeu,
                negative: sentimentNeg,
            },
        };
    }

    /**
     * Export metrics as JSON
     */
    exportMetrics(): string {
        return JSON.stringify({
            conversations: Array.from(this.conversations.values()),
            toolMetrics: Array.from(this.toolMetrics.values()),
            dailyMetrics: Array.from(this.dailyMetrics.values()),
            exportTime: new Date().toISOString(),
        }, null, 2);
    }

    /**
     * Get dashboard summary
     */
    getDashboardSummary(): {
        today: DailyMetrics | null;
        weeklyPerformance: AgentPerformance;
        topTools: Array<{ name: string; successRate: number; count: number }>;
    } {
        const today = this.getDailyMetrics();
        const weeklyPerformance = this.getPerformance('week');

        const topTools = Array.from(this.toolMetrics.values())
            .sort((a, b) => b.callCount - a.callCount)
            .slice(0, 5)
            .map(t => ({
                name: t.toolName,
                successRate: t.callCount > 0 ? t.successCount / t.callCount : 0,
                count: t.callCount,
            }));

        return { today, weeklyPerformance, topTools };
    }

    // Private methods

    private updateDailyMetrics(conv: ConversationMetrics): void {
        const date = this.getDateKey(new Date(conv.startTime));
        const existing = this.dailyMetrics.get(date) || this.createEmptyDailyMetrics(date);

        existing.totalConversations++;
        if (conv.resolved) existing.resolvedConversations++;

        // Update averages
        const n = existing.totalConversations;
        if (conv.duration) {
            existing.avgConversationDuration =
                ((existing.avgConversationDuration * (n - 1)) + conv.duration) / n;
        }

        existing.toolCalls += conv.toolCalls;
        if (conv.toolCalls > 0) {
            existing.toolSuccessRate =
                (existing.toolSuccessRate * (n - 1) + conv.toolCallSuccess / conv.toolCalls) / n;
        }

        if (conv.handoffToHuman) {
            existing.handoffRate = (existing.handoffRate * (n - 1) + 1) / n;
        }

        if (conv.sentiment === 'positive') existing.sentimentPositive++;
        else if (conv.sentiment === 'neutral') existing.sentimentNeutral++;
        else if (conv.sentiment === 'negative') existing.sentimentNegative++;

        this.dailyMetrics.set(date, existing);
    }

    private createEmptyDailyMetrics(date: string): DailyMetrics {
        return {
            date,
            totalConversations: 0,
            resolvedConversations: 0,
            avgConversationDuration: 0,
            avgResponseTime: 0,
            toolCalls: 0,
            toolSuccessRate: 0,
            handoffRate: 0,
            sentimentPositive: 0,
            sentimentNeutral: 0,
            sentimentNegative: 0,
        };
    }

    private getDateKey(date: Date = new Date()): string {
        return date.toISOString().split('T')[0];
    }

    private persist(): void {
        try {
            this.store.set('dailyMetrics', Array.from(this.dailyMetrics.entries()));
            this.store.set('toolMetrics', Array.from(this.toolMetrics.entries()));
        } catch (error) {
            console.error('Failed to persist analytics:', error);
        }
    }

    private loadPersistedMetrics(): void {
        try {
            const daily = this.store.get('dailyMetrics') as Array<[string, DailyMetrics]>;
            if (daily) {
                this.dailyMetrics = new Map(daily);
            }

            const tools = this.store.get('toolMetrics') as Array<[string, ToolMetrics]>;
            if (tools) {
                this.toolMetrics = new Map(tools);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }
}

// Singleton getter
export function getAnalyticsCollector(): AnalyticsCollector {
    return AnalyticsCollector.getInstance();
}
