/**
 * Self-Improvement Engine
 * 
 * Enables autonomous learning and continuous optimization of agent capabilities
 * The agent learns from experience and evolves its strategies over time
 */

import {
    PerformanceMetrics,
    Strategy,
    LearningSession,
    Improvement,
    Feedback,
    CapabilityGap,
    ExperimentResult,
    EvolutionRecord,
    MetaLearningInsight
} from './types';
import { getMemoryEngine } from '../memory';
import * as crypto from 'crypto';

export class SelfImprovementEngine {
    private static instance: SelfImprovementEngine;

    private performanceHistory: PerformanceMetrics[] = [];
    private strategies: Map<string, Strategy> = new Map();
    private improvements: Improvement[] = [];
    private evolutionHistory: EvolutionRecord[] = [];
    private currentSession?: LearningSession;
    private memory = getMemoryEngine();

    // Configuration
    private readonly MIN_CONFIDENCE_TO_ADOPT = 0.75;
    private readonly MIN_SAMPLES_FOR_COMPARISON = 5;
    private readonly PERFORMANCE_WINDOW = 100; // Last N tasks to analyze
    private readonly EXPERIMENT_PROBABILITY = 0.1; // 10% chance to try new strategy

    private constructor() {
        this.initializeDefaultStrategies();
    }

    static getInstance(): SelfImprovementEngine {
        if (!SelfImprovementEngine.instance) {
            SelfImprovementEngine.instance = new SelfImprovementEngine();
        }
        return SelfImprovementEngine.instance;
    }

    /**
     * Start a new learning session
     */
    startSession(): string {
        const sessionId = this.generateId();
        this.currentSession = {
            id: sessionId,
            startTime: new Date(),
            tasksCompleted: 0,
            improvements: [],
            strategiesDiscovered: [],
            performanceDelta: {
                successRate: 0,
                avgQuality: 0,
                avgEfficiency: 0
            }
        };
        console.log(`🎓 Started learning session: ${sessionId}`);
        return sessionId;
    }

    /**
     * End current learning session
     */
    endSession(): LearningSession | null {
        if (!this.currentSession) return null;

        this.currentSession.endTime = new Date();
        this.currentSession.performanceDelta = this.calculateSessionDelta();

        console.log(`✅ Learning session completed:`, {
            tasksCompleted: this.currentSession.tasksCompleted,
            improvements: this.currentSession.improvements.length,
            strategiesDiscovered: this.currentSession.strategiesDiscovered.length,
            performanceDelta: this.currentSession.performanceDelta
        });

        const session = this.currentSession;
        this.currentSession = undefined;
        return session;
    }

    /**
     * Record performance metrics for a task
     */
    async recordPerformance(metrics: PerformanceMetrics): Promise<void> {
        this.performanceHistory.push(metrics);

        // Keep history manageable
        if (this.performanceHistory.length > 10000) {
            this.performanceHistory = this.performanceHistory.slice(-5000);
        }

        if (this.currentSession) {
            this.currentSession.tasksCompleted++;
        }

        // Trigger analysis periodically
        if (this.performanceHistory.length % 10 === 0) {
            await this.analyzeAndImprove();
        }

        // Store in long-term memory
        await this.memory.remember({
            type: 'conversation',
            content: JSON.stringify(metrics),
            metadata: {
                taskType: metrics.taskType,
                success: metrics.success,
                quality: metrics.quality
            },
            timestamp: new Date()
        });
    }

    /**
     * Record user feedback
     */
    async recordFeedback(feedback: Feedback): Promise<void> {
        // Find the associated performance metrics
        const metrics = this.performanceHistory.find(m => m.taskId === feedback.taskId);
        if (!metrics) return;

        // Update user satisfaction
        metrics.userSatisfaction = feedback.rating / 5;

        // Learn from feedback
        await this.learnFromFeedback(feedback, metrics);
    }

    /**
     * Get recommended strategy for a task
     */
    async getRecommendedStrategy(taskType: string, context: Record<string, any>): Promise<Strategy | null> {
        const applicableStrategies = Array.from(this.strategies.values())
            .filter(s => this.isApplicable(s, taskType, context))
            .sort((a, b) => this.calculateStrategyScore(b) - this.calculateStrategyScore(a));

        if (applicableStrategies.length === 0) return null;

        // Exploration vs Exploitation
        if (Math.random() < this.EXPERIMENT_PROBABILITY && applicableStrategies.length > 1) {
            // Try a different strategy occasionally
            return applicableStrategies[1];
        }

        return applicableStrategies[0];
    }

    /**
     * Discover new strategies through experimentation
     */
    async discoverStrategies(): Promise<Strategy[]> {
        const discovered: Strategy[] = [];

        // Analyze successful patterns
        const successfulTasks = this.performanceHistory
            .filter(m => m.success && m.quality > 0.8)
            .slice(-50);

        // Look for common patterns
        const patterns = this.extractPatterns(successfulTasks);

        for (const pattern of patterns) {
            const strategy = this.synthesizeStrategy(pattern);
            if (strategy && !this.strategies.has(strategy.id)) {
                this.strategies.set(strategy.id, strategy);
                discovered.push(strategy);

                if (this.currentSession) {
                    this.currentSession.strategiesDiscovered.push(strategy);
                }

                console.log(`💡 Discovered new strategy: ${strategy.name}`);
            }
        }

        return discovered;
    }

    /**
     * A/B test two strategies
     */
    async compareStrategies(strategyA: Strategy, strategyB: Strategy): Promise<ExperimentResult> {
        const aMetrics = this.getStrategyMetrics(strategyA);
        const bMetrics = this.getStrategyMetrics(strategyB);

        if (aMetrics.length < this.MIN_SAMPLES_FOR_COMPARISON ||
            bMetrics.length < this.MIN_SAMPLES_FOR_COMPARISON) {
            throw new Error('Insufficient data for comparison');
        }

        const aScore = this.calculateAverageScore(aMetrics);
        const bScore = this.calculateAverageScore(bMetrics);

        const winner = aScore > bScore ? 'A' : (bScore > aScore ? 'B' : 'tie');
        const confidence = Math.abs(aScore - bScore) / Math.max(aScore, bScore);

        return {
            experimentId: this.generateId(),
            strategyA,
            strategyB,
            winner,
            confidence,
            metrics: {
                aPerformance: aMetrics,
                bPerformance: bMetrics
            },
            statistically_significant: confidence > 0.1 &&
                Math.min(aMetrics.length, bMetrics.length) >= this.MIN_SAMPLES_FOR_COMPARISON
        };
    }

    /**
     * Identify capability gaps
     */
    identifyCapabilityGaps(): CapabilityGap[] {
        const gaps: CapabilityGap[] = [];

        // Analyze failure patterns
        const failures = this.performanceHistory
            .filter(m => !m.success)
            .slice(-100);

        const failuresByType = new Map<string, number>();
        failures.forEach(f => {
            const count = failuresByType.get(f.taskType) || 0;
            failuresByType.set(f.taskType, count + 1);
        });

        // Identify gaps based on failure rates
        failuresByType.forEach((count, taskType) => {
            const totalOfType = this.performanceHistory.filter(m => m.taskType === taskType).length;
            const successRate = (totalOfType - count) / totalOfType;

            if (successRate < 0.8) {
                gaps.push({
                    capability: taskType,
                    currentLevel: successRate,
                    desiredLevel: 0.95,
                    gap: 0.95 - successRate,
                    priority: successRate < 0.5 ? 'critical' :
                        successRate < 0.7 ? 'high' : 'medium',
                    estimatedEffort: (0.95 - successRate) * 100
                });
            }
        });

        return gaps.sort((a, b) => b.gap - a.gap);
    }

    /**
     * Get meta-learning insights
     */
    getMetaLearningInsights(): MetaLearningInsight[] {
        const insights: MetaLearningInsight[] = [];

        // Pattern: What types of tasks improve over time?
        const improvingCategories = this.findImprovingCategories();
        if (improvingCategories.length > 0) {
            insights.push({
                pattern: 'learning_acceleration',
                description: 'Certain task types show accelerated improvement',
                applicability: improvingCategories,
                confidence: 0.85,
                examples: improvingCategories.map(cat => ({
                    context: cat,
                    approach: 'Repeated exposure with feedback',
                    outcome: 'Faster and higher quality results'
                }))
            });
        }

        // Pattern: What strategies work best together?
        const synergies = this.findStrategySynergies();
        if (synergies.length > 0) {
            insights.push({
                pattern: 'strategy_synergy',
                description: 'Certain strategies work better in combination',
                applicability: synergies.map(s => s.combination),
                confidence: 0.75,
                examples: synergies.map(s => ({
                    context: s.combination,
                    approach: s.strategies.join(' + '),
                    outcome: `${(s.improvement * 100).toFixed(1)}% improvement`
                }))
            });
        }

        return insights;
    }

    /**
     * Rollback to previous state if improvement fails
     */
    async rollback(improvementId: string): Promise<boolean> {
        const improvement = this.improvements.find(i => i.id === improvementId);
        if (!improvement || !improvement.rollbackAvailable) {
            return false;
        }

        // Restore previous strategy configurations
        // This is a placeholder - implement actual rollback logic
        console.log(`⏮️  Rolling back improvement: ${improvement.description}`);

        this.evolutionHistory.push({
            timestamp: new Date(),
            type: 'rollback',
            description: `Rolled back: ${improvement.description}`,
            impactedCapabilities: [],
            performanceChange: -improvement.improvementFactor,
            confidence: 1.0,
            canRollback: false
        });

        return true;
    }

    /**
     * Get current performance statistics
     */
    getPerformanceStats(): {
        overall: any;
        byTaskType: Map<string, any>;
        trends: any;
    } {
        const recent = this.performanceHistory.slice(-this.PERFORMANCE_WINDOW);

        const overall = {
            successRate: recent.filter(m => m.success).length / recent.length || 0,
            avgQuality: recent.reduce((sum, m) => sum + m.quality, 0) / recent.length || 0,
            avgEfficiency: recent.reduce((sum, m) => sum + m.efficiency, 0) / recent.length || 0,
            avgDuration: recent.reduce((sum, m) => sum + m.duration, 0) / recent.length || 0,
            totalTasks: this.performanceHistory.length
        };

        const byTaskType = new Map<string, any>();
        const taskTypes = [...new Set(recent.map(m => m.taskType))];

        taskTypes.forEach(type => {
            const typeTasks = recent.filter(m => m.taskType === type);
            byTaskType.set(type, {
                count: typeTasks.length,
                successRate: typeTasks.filter(m => m.success).length / typeTasks.length || 0,
                avgQuality: typeTasks.reduce((sum, m) => sum + m.quality, 0) / typeTasks.length || 0,
                avgEfficiency: typeTasks.reduce((sum, m) => sum + m.efficiency, 0) / typeTasks.length || 0
            });
        });

        const trends = this.calculateTrends();

        return { overall, byTaskType, trends };
    }

    // Private helper methods

    private async analyzeAndImprove(): Promise<void> {
        const stats = this.getPerformanceStats();

        // Look for improvement opportunities
        if (stats.overall.successRate < 0.85) {
            await this.discoverStrategies();
        }

        // Identify and address capability gaps
        const gaps = this.identifyCapabilityGaps();
        if (gaps.length > 0 && gaps[0].priority === 'critical') {
            console.log(`⚠️  Critical capability gap identified: ${gaps[0].capability}`);
        }
    }

    private async learnFromFeedback(feedback: Feedback, metrics: PerformanceMetrics): Promise<void> {
        // Adjust strategy confidence based on feedback
        const strategyId = metrics.metadata?.strategyId;
        if (strategyId) {
            const strategy = this.strategies.get(strategyId);
            if (strategy) {
                const feedbackScore = feedback.rating / 5;
                strategy.confidence = (strategy.confidence + feedbackScore) / 2;
            }
        }

        // Store insights from feedback
        if (feedback.userExpectation && feedback.actualResult) {
            await this.memory.remember({
                type: 'conversation',
                content: `Expected: ${feedback.userExpectation}, Got: ${feedback.actualResult}`,
                metadata: {
                    taskId: feedback.taskId,
                    rating: feedback.rating
                },
                timestamp: new Date()
            });
        }
    }

    private initializeDefaultStrategies(): void {
        // Initialize with some baseline strategies
        const defaultStrategies: Strategy[] = [
            {
                id: 'iterative-refinement',
                name: 'Iterative Refinement',
                description: 'Generate initial solution, then refine iteratively',
                category: 'general',
                confidence: 0.8,
                successRate: 0.85,
                avgQuality: 0.8,
                avgEfficiency: 0.75,
                usageCount: 0,
                lastUsed: new Date(),
                parameters: { iterations: 3 },
                applicableContexts: ['code-generation', 'architecture', 'debugging'],
                createdAt: new Date()
            },
            {
                id: 'divide-conquer',
                name: 'Divide and Conquer',
                description: 'Break complex tasks into smaller subtasks',
                category: 'general',
                confidence: 0.85,
                successRate: 0.9,
                avgQuality: 0.85,
                avgEfficiency: 0.8,
                usageCount: 0,
                lastUsed: new Date(),
                parameters: { maxSubtasks: 5 },
                applicableContexts: ['complex-task', 'architecture', 'refactoring'],
                createdAt: new Date()
            }
        ];

        defaultStrategies.forEach(s => this.strategies.set(s.id, s));
    }

    private isApplicable(strategy: Strategy, taskType: string, context: Record<string, any>): boolean {
        return strategy.applicableContexts.some(ctx =>
            taskType.includes(ctx) || ctx === 'general'
        );
    }

    private calculateStrategyScore(strategy: Strategy): number {
        return (
            strategy.confidence * 0.3 +
            strategy.successRate * 0.4 +
            strategy.avgQuality * 0.2 +
            strategy.avgEfficiency * 0.1
        );
    }

    private extractPatterns(tasks: PerformanceMetrics[]): any[] {
        // Simplified pattern extraction
        const patterns: any[] = [];

        // Group by task type
        const grouped = new Map<string, PerformanceMetrics[]>();
        tasks.forEach(task => {
            const group = grouped.get(task.taskType) || [];
            group.push(task);
            grouped.set(task.taskType, group);
        });

        // Look for common characteristics in successful tasks
        grouped.forEach((group, taskType) => {
            if (group.length >= 3) {
                patterns.push({
                    taskType,
                    avgQuality: group.reduce((sum, t) => sum + t.quality, 0) / group.length,
                    avgDuration: group.reduce((sum, t) => sum + t.duration, 0) / group.length,
                    commonMetadata: this.findCommonMetadata(group)
                });
            }
        });

        return patterns;
    }

    private synthesizeStrategy(pattern: any): Strategy | null {
        // Create new strategy from observed pattern
        const id = `learned-${this.generateId()}`;

        return {
            id,
            name: `Learned Strategy: ${pattern.taskType}`,
            description: `Strategy discovered from successful ${pattern.taskType} tasks`,
            category: 'learned',
            confidence: 0.6, // Start with moderate confidence
            successRate: 0,
            avgQuality: pattern.avgQuality,
            avgEfficiency: 0,
            usageCount: 0,
            lastUsed: new Date(),
            parameters: pattern.commonMetadata || {},
            applicableContexts: [pattern.taskType],
            createdAt: new Date()
        };
    }

    private getStrategyMetrics(strategy: Strategy): PerformanceMetrics[] {
        return this.performanceHistory.filter(m =>
            m.metadata?.strategyId === strategy.id
        );
    }

    private calculateAverageScore(metrics: PerformanceMetrics[]): number {
        if (metrics.length === 0) return 0;
        return metrics.reduce((sum, m) => {
            const successScore = m.success ? 1 : 0;
            return sum + (successScore * 0.5 + m.quality * 0.3 + m.efficiency * 0.2);
        }, 0) / metrics.length;
    }

    private findCommonMetadata(tasks: PerformanceMetrics[]): Record<string, any> {
        // Simplified - find common metadata across tasks
        const common: Record<string, any> = {};

        if (tasks.length === 0) return common;

        const firstMetadata = tasks[0].metadata || {};
        Object.keys(firstMetadata).forEach(key => {
            const allMatch = tasks.every(t =>
                t.metadata && t.metadata[key] === firstMetadata[key]
            );
            if (allMatch) {
                common[key] = firstMetadata[key];
            }
        });

        return common;
    }

    private calculateSessionDelta(): { successRate: number; avgQuality: number; avgEfficiency: number } {
        if (!this.currentSession || this.performanceHistory.length < 20) {
            return { successRate: 0, avgQuality: 0, avgEfficiency: 0 };
        }

        const sessionStart = this.currentSession.startTime;
        const beforeSession = this.performanceHistory.filter(m => m.timestamp < sessionStart).slice(-50);
        const duringSession = this.performanceHistory.filter(m => m.timestamp >= sessionStart);

        const calcStats = (metrics: PerformanceMetrics[]) => ({
            successRate: metrics.filter(m => m.success).length / metrics.length || 0,
            avgQuality: metrics.reduce((sum, m) => sum + m.quality, 0) / metrics.length || 0,
            avgEfficiency: metrics.reduce((sum, m) => sum + m.efficiency, 0) / metrics.length || 0
        });

        const before = calcStats(beforeSession);
        const during = calcStats(duringSession);

        return {
            successRate: during.successRate - before.successRate,
            avgQuality: during.avgQuality - before.avgQuality,
            avgEfficiency: during.avgEfficiency - before.avgEfficiency
        };
    }

    private calculateTrends(): any {
        const recent = this.performanceHistory.slice(-this.PERFORMANCE_WINDOW);
        const halfPoint = Math.floor(recent.length / 2);
        const firstHalf = recent.slice(0, halfPoint);
        const secondHalf = recent.slice(halfPoint);

        const calcAvg = (metrics: PerformanceMetrics[], field: 'quality' | 'efficiency') =>
            metrics.reduce((sum, m) => sum + m[field], 0) / metrics.length || 0;

        const qualityTrend = calcAvg(secondHalf, 'quality') - calcAvg(firstHalf, 'quality');
        const efficiencyTrend = calcAvg(secondHalf, 'efficiency') - calcAvg(firstHalf, 'efficiency');

        return {
            quality: qualityTrend,
            efficiency: efficiencyTrend,
            improving: qualityTrend > 0 && efficiencyTrend > 0
        };
    }

    private findImprovingCategories(): string[] {
        const categories: string[] = [];
        const taskTypes = [...new Set(this.performanceHistory.map(m => m.taskType))];

        taskTypes.forEach(type => {
            const typeTasks = this.performanceHistory
                .filter(m => m.taskType === type)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            if (typeTasks.length < 10) return;

            const halfPoint = Math.floor(typeTasks.length / 2);
            const earlyQuality = typeTasks.slice(0, halfPoint)
                .reduce((sum, m) => sum + m.quality, 0) / halfPoint;
            const lateQuality = typeTasks.slice(halfPoint)
                .reduce((sum, m) => sum + m.quality, 0) / (typeTasks.length - halfPoint);

            if (lateQuality > earlyQuality + 0.1) {
                categories.push(type);
            }
        });

        return categories;
    }

    private findStrategySynergies(): Array<{ combination: string; strategies: string[]; improvement: number }> {
        // Placeholder for strategy synergy detection
        return [];
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Export singleton
export const selfImprovementEngine = SelfImprovementEngine.getInstance();
