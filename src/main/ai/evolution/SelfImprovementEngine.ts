/**
 * Self-Improvement Engine
 * 
 * Meta-cognitive layer that enables the agent to learn from its own performance.
 * Tracks outcomes, tunes prompts, and evolves strategies over time.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
    agentId: string;
    taskType: string;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgDuration: number;
    avgConfidence: number;
    improvedSince?: Date;
    trend: 'improving' | 'stable' | 'declining';
}

export interface TaskOutcome {
    id: string;
    agentId: string;
    taskType: string;
    success: boolean;
    duration: number;
    confidence: number;
    userFeedback?: 'positive' | 'negative' | 'neutral';
    errorType?: string;
    timestamp: Date;
}

export interface PromptVariant {
    id: string;
    basePromptId: string;
    variant: string;
    description: string;
    testCount: number;
    successRate: number;
    avgDuration: number;
    isActive: boolean;
    createdAt: Date;
}

export interface StrategyEvolution {
    id: string;
    agentId: string;
    strategy: string;
    parameters: Record<string, any>;
    generation: number;
    fitness: number;
    parentId?: string;
    createdAt: Date;
}

export interface ImprovementAction {
    type: 'prompt_update' | 'strategy_change' | 'parameter_tune' | 'training_suggested';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: number;
    details: Record<string, any>;
}

export interface FailurePattern {
    pattern: string;
    occurrences: number;
    commonCauses: string[];
    suggestedFixes: string[];
    affectedAgents: string[];
}

export interface LearningInsight {
    type: 'success_pattern' | 'failure_pattern' | 'optimization' | 'anomaly';
    description: string;
    confidence: number;
    evidence: any[];
    actionable: boolean;
    suggestedAction?: string;
}

// ============================================================================
// SELF-IMPROVEMENT ENGINE
// ============================================================================

export class SelfImprovementEngine extends EventEmitter {
    private static instance: SelfImprovementEngine;

    // Performance tracking
    private outcomes: TaskOutcome[] = [];
    private metrics: Map<string, PerformanceMetric> = new Map();

    // Prompt A/B testing
    private promptVariants: Map<string, PromptVariant[]> = new Map();
    private activePrompts: Map<string, string> = new Map();

    // Strategy evolution
    private strategies: StrategyEvolution[] = [];
    private currentStrategies: Map<string, StrategyEvolution> = new Map();

    // Settings
    private minSamplesForAnalysis = 10;
    private improvementThreshold = 0.05; // 5% improvement triggers promotion

    private constructor() {
        super();
        this.initializeDefaultStrategies();
        console.log('[SelfImprovementEngine] Initialized');
    }

    static getInstance(): SelfImprovementEngine {
        if (!SelfImprovementEngine.instance) {
            SelfImprovementEngine.instance = new SelfImprovementEngine();
        }
        return SelfImprovementEngine.instance;
    }

    // ========================================================================
    // OUTCOME TRACKING
    // ========================================================================

    /**
     * Record a task outcome
     */
    trackOutcome(outcome: Omit<TaskOutcome, 'id' | 'timestamp'>): TaskOutcome {
        const record: TaskOutcome = {
            ...outcome,
            id: `outcome-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date()
        };

        this.outcomes.push(record);
        this.updateMetrics(record);
        this.checkForLearningOpportunities(record);

        this.emit('outcome:recorded', record);
        return record;
    }

    /**
     * Update performance metrics based on new outcome
     */
    private updateMetrics(outcome: TaskOutcome): void {
        const key = `${outcome.agentId}:${outcome.taskType}`;
        let metric = this.metrics.get(key);

        if (!metric) {
            metric = {
                agentId: outcome.agentId,
                taskType: outcome.taskType,
                successCount: 0,
                failureCount: 0,
                successRate: 0,
                avgDuration: 0,
                avgConfidence: 0,
                trend: 'stable'
            };
        }

        // Update counts
        if (outcome.success) {
            metric.successCount++;
        } else {
            metric.failureCount++;
        }

        // Recalculate rates
        const total = metric.successCount + metric.failureCount;
        const oldSuccessRate = metric.successRate;
        metric.successRate = metric.successCount / total;

        // Update rolling averages
        metric.avgDuration = (metric.avgDuration * (total - 1) + outcome.duration) / total;
        metric.avgConfidence = (metric.avgConfidence * (total - 1) + outcome.confidence) / total;

        // Determine trend
        if (total >= this.minSamplesForAnalysis) {
            const recentOutcomes = this.getRecentOutcomes(outcome.agentId, outcome.taskType, 10);
            const recentSuccessRate = recentOutcomes.filter(o => o.success).length / recentOutcomes.length;

            if (recentSuccessRate > oldSuccessRate + this.improvementThreshold) {
                metric.trend = 'improving';
                metric.improvedSince = new Date();
            } else if (recentSuccessRate < oldSuccessRate - this.improvementThreshold) {
                metric.trend = 'declining';
            } else {
                metric.trend = 'stable';
            }
        }

        this.metrics.set(key, metric);
        this.emit('metrics:updated', metric);
    }

    /**
     * Get recent outcomes for an agent/task type
     */
    private getRecentOutcomes(agentId: string, taskType: string, limit: number): TaskOutcome[] {
        return this.outcomes
            .filter(o => o.agentId === agentId && o.taskType === taskType)
            .slice(-limit);
    }

    /**
     * Get all metrics
     */
    getMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Get metrics for a specific agent
     */
    getAgentMetrics(agentId: string): PerformanceMetric[] {
        return this.getMetrics().filter(m => m.agentId === agentId);
    }

    // ========================================================================
    // PROMPT A/B TESTING
    // ========================================================================

    /**
     * Register a prompt variant for testing
     */
    registerPromptVariant(
        basePromptId: string,
        variant: string,
        description: string
    ): PromptVariant {
        const record: PromptVariant = {
            id: `variant-${Date.now()}`,
            basePromptId,
            variant,
            description,
            testCount: 0,
            successRate: 0,
            avgDuration: 0,
            isActive: false,
            createdAt: new Date()
        };

        const variants = this.promptVariants.get(basePromptId) || [];
        variants.push(record);
        this.promptVariants.set(basePromptId, variants);

        this.emit('prompt:variant_registered', record);
        return record;
    }

    /**
     * Get the best-performing prompt variant
     */
    getBestPrompt(basePromptId: string): PromptVariant | null {
        const variants = this.promptVariants.get(basePromptId);
        if (!variants || variants.length === 0) return null;

        // Need minimum samples for comparison
        const testedVariants = variants.filter(v => v.testCount >= this.minSamplesForAnalysis);
        if (testedVariants.length === 0) {
            return variants[0]; // Return first if insufficient data
        }

        // Select by success rate, tie-break by duration
        return testedVariants.sort((a, b) => {
            if (Math.abs(a.successRate - b.successRate) < 0.01) {
                return a.avgDuration - b.avgDuration;
            }
            return b.successRate - a.successRate;
        })[0];
    }

    /**
     * Record prompt test result
     */
    recordPromptTest(
        variantId: string,
        success: boolean,
        duration: number
    ): void {
        for (const [_, variants] of this.promptVariants) {
            const variant = variants.find(v => v.id === variantId);
            if (variant) {
                variant.testCount++;
                const oldSuccesses = variant.successRate * (variant.testCount - 1);
                variant.successRate = (oldSuccesses + (success ? 1 : 0)) / variant.testCount;
                variant.avgDuration = (variant.avgDuration * (variant.testCount - 1) + duration) / variant.testCount;

                // Auto-promote if significantly better
                this.checkPromptPromotion(variant);
                break;
            }
        }
    }

    /**
     * Check if a prompt variant should be promoted
     */
    private checkPromptPromotion(variant: PromptVariant): void {
        if (variant.testCount < this.minSamplesForAnalysis * 2) return;

        const best = this.getBestPrompt(variant.basePromptId);
        if (best && variant.id === best.id && !variant.isActive) {
            // Promote this variant
            const variants = this.promptVariants.get(variant.basePromptId) || [];
            variants.forEach(v => v.isActive = false);
            variant.isActive = true;
            this.activePrompts.set(variant.basePromptId, variant.variant);

            this.emit('prompt:promoted', variant);
            console.log(`[SelfImprovementEngine] Promoted prompt variant: ${variant.description}`);
        }
    }

    /**
     * Suggest prompt improvements based on patterns
     */
    async suggestPromptImprovement(
        currentPrompt: string,
        outcomes: TaskOutcome[]
    ): Promise<PromptVariant | null> {
        const failures = outcomes.filter(o => !o.success);
        if (failures.length < 3) return null;

        // Analyze common failure patterns
        const errorPatterns = this.analyzeErrorPatterns(failures);

        // Create improved variant
        const improvement = {
            id: `variant-${Date.now()}`,
            basePromptId: 'suggested',
            variant: currentPrompt + `\n\nAdditional guidance based on common issues:\n${errorPatterns.map(p => `- ${p}`).join('\n')}`,
            description: 'Auto-suggested improvement based on failure analysis',
            testCount: 0,
            successRate: 0,
            avgDuration: 0,
            isActive: false,
            createdAt: new Date()
        };

        return improvement;
    }

    /**
     * Analyze error patterns from failures
     */
    private analyzeErrorPatterns(failures: TaskOutcome[]): string[] {
        const patterns: string[] = [];
        const errorCounts = new Map<string, number>();

        for (const failure of failures) {
            if (failure.errorType) {
                errorCounts.set(failure.errorType, (errorCounts.get(failure.errorType) || 0) + 1);
            }
        }

        for (const [error, count] of errorCounts.entries()) {
            if (count >= 2) {
                patterns.push(`Handle ${error} errors more carefully`);
            }
        }

        return patterns;
    }

    // ========================================================================
    // STRATEGY EVOLUTION
    // ========================================================================

    /**
     * Initialize default strategies for agents
     */
    private initializeDefaultStrategies(): void {
        const defaultStrategies = [
            { agentId: 'nexus', strategy: 'balanced', parameters: { riskTolerance: 0.5, autonomy: 0.7 } },
            { agentId: 'atlas', strategy: 'architecture-first', parameters: { depth: 3, includeTests: true } },
            { agentId: 'pixel', strategy: 'component-driven', parameters: { accessibility: true, responsive: true } },
            { agentId: 'server', strategy: 'security-conscious', parameters: { inputValidation: true, logging: true } },
            { agentId: 'sentinel', strategy: 'comprehensive', parameters: { depth: 'deep', includeStatic: true } }
        ];

        for (const config of defaultStrategies) {
            const strategy: StrategyEvolution = {
                id: `strategy-${config.agentId}-0`,
                agentId: config.agentId,
                strategy: config.strategy,
                parameters: config.parameters,
                generation: 0,
                fitness: 0.5,
                createdAt: new Date()
            };
            this.strategies.push(strategy);
            this.currentStrategies.set(config.agentId, strategy);
        }
    }

    /**
     * Evolve a strategy based on performance
     */
    evolveStrategy(agentId: string): StrategyEvolution | null {
        const current = this.currentStrategies.get(agentId);
        if (!current) return null;

        const metrics = this.getAgentMetrics(agentId);
        if (metrics.length === 0) return null;

        // Calculate fitness from recent performance
        const avgSuccess = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;

        // Mutate parameters slightly
        const mutatedParams = { ...current.parameters };
        for (const key of Object.keys(mutatedParams)) {
            if (typeof mutatedParams[key] === 'number') {
                mutatedParams[key] = Math.max(0, Math.min(1,
                    mutatedParams[key] + (Math.random() - 0.5) * 0.1
                ));
            }
        }

        const evolved: StrategyEvolution = {
            id: `strategy-${agentId}-${current.generation + 1}`,
            agentId,
            strategy: current.strategy,
            parameters: mutatedParams,
            generation: current.generation + 1,
            fitness: avgSuccess,
            parentId: current.id,
            createdAt: new Date()
        };

        this.strategies.push(evolved);

        // If better than current, promote
        if (evolved.fitness > current.fitness) {
            this.currentStrategies.set(agentId, evolved);
            this.emit('strategy:evolved', evolved);
            console.log(`[SelfImprovementEngine] Evolved strategy for ${agentId} (gen ${evolved.generation})`);
        }

        return evolved;
    }

    /**
     * Get current strategy for an agent
     */
    getStrategy(agentId: string): StrategyEvolution | undefined {
        return this.currentStrategies.get(agentId);
    }

    /**
     * Get strategy evolution history
     */
    getStrategyHistory(agentId: string): StrategyEvolution[] {
        return this.strategies.filter(s => s.agentId === agentId)
            .sort((a, b) => a.generation - b.generation);
    }

    // ========================================================================
    // LEARNING & INSIGHTS
    // ========================================================================

    /**
     * Check for learning opportunities from an outcome
     */
    private checkForLearningOpportunities(outcome: TaskOutcome): void {
        // Check for failure patterns
        if (!outcome.success) {
            const recentFailures = this.outcomes
                .filter(o => o.agentId === outcome.agentId && !o.success)
                .slice(-5);

            if (recentFailures.length >= 3) {
                this.emit('learning:failure_pattern', {
                    agentId: outcome.agentId,
                    failures: recentFailures,
                    suggestion: 'Consider parameter tuning or strategy evolution'
                });
            }
        }

        // Check for success streaks
        const recentSuccesses = this.outcomes
            .filter(o => o.agentId === outcome.agentId)
            .slice(-5)
            .every(o => o.success);

        if (recentSuccesses && this.outcomes.length >= 5) {
            this.emit('learning:success_streak', {
                agentId: outcome.agentId,
                suggestion: 'Current approach is working well'
            });
        }
    }

    /**
     * Generate improvement plan for an agent
     */
    getImprovementPlan(agentId: string): ImprovementAction[] {
        const actions: ImprovementAction[] = [];
        const metrics = this.getAgentMetrics(agentId);

        for (const metric of metrics) {
            if (metric.successRate < 0.7) {
                actions.push({
                    type: 'prompt_update',
                    priority: 'high',
                    description: `Low success rate (${(metric.successRate * 100).toFixed(1)}%) for ${metric.taskType}`,
                    expectedImpact: 0.15,
                    details: { taskType: metric.taskType, currentRate: metric.successRate }
                });
            }

            if (metric.trend === 'declining') {
                actions.push({
                    type: 'strategy_change',
                    priority: 'high',
                    description: `Declining performance in ${metric.taskType}`,
                    expectedImpact: 0.2,
                    details: { taskType: metric.taskType, trend: metric.trend }
                });
            }

            if (metric.avgDuration > 5000) { // 5 seconds
                actions.push({
                    type: 'parameter_tune',
                    priority: 'medium',
                    description: `High latency (${(metric.avgDuration / 1000).toFixed(1)}s) for ${metric.taskType}`,
                    expectedImpact: 0.1,
                    details: { taskType: metric.taskType, avgDuration: metric.avgDuration }
                });
            }
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    /**
     * Generate learning insights
     */
    generateInsights(): LearningInsight[] {
        const insights: LearningInsight[] = [];
        const metrics = this.getMetrics();

        // Find top performers
        const topPerformers = metrics.filter(m => m.successRate > 0.9 && m.successCount >= 10);
        for (const metric of topPerformers) {
            insights.push({
                type: 'success_pattern',
                description: `${metric.agentId} excels at ${metric.taskType} (${(metric.successRate * 100).toFixed(1)}% success)`,
                confidence: 0.9,
                evidence: [metric],
                actionable: false
            });
        }

        // Find struggling areas
        const struggling = metrics.filter(m => m.successRate < 0.6 && m.failureCount >= 5);
        for (const metric of struggling) {
            insights.push({
                type: 'failure_pattern',
                description: `${metric.agentId} struggles with ${metric.taskType} (${(metric.successRate * 100).toFixed(1)}% success)`,
                confidence: 0.85,
                evidence: [metric],
                actionable: true,
                suggestedAction: `Review and improve ${metric.taskType} handling`
            });
        }

        // Find improving trends
        const improving = metrics.filter(m => m.trend === 'improving');
        for (const metric of improving) {
            insights.push({
                type: 'optimization',
                description: `${metric.agentId}'s ${metric.taskType} performance is improving`,
                confidence: 0.8,
                evidence: [metric],
                actionable: false
            });
        }

        return insights;
    }

    // ========================================================================
    // STATS & EXPORT
    // ========================================================================

    /**
     * Get overall statistics
     */
    getStats(): {
        totalOutcomes: number;
        overallSuccessRate: number;
        agentCount: number;
        promptVariantsCount: number;
        strategiesEvolved: number;
        insightCount: number;
    } {
        const successful = this.outcomes.filter(o => o.success).length;

        return {
            totalOutcomes: this.outcomes.length,
            overallSuccessRate: this.outcomes.length > 0 ? successful / this.outcomes.length : 0,
            agentCount: new Set(this.outcomes.map(o => o.agentId)).size,
            promptVariantsCount: Array.from(this.promptVariants.values()).flat().length,
            strategiesEvolved: this.strategies.length,
            insightCount: this.generateInsights().length
        };
    }

    /**
     * Export learning data for persistence
     */
    exportData(): {
        outcomes: TaskOutcome[];
        metrics: PerformanceMetric[];
        strategies: StrategyEvolution[];
    } {
        return {
            outcomes: this.outcomes,
            metrics: this.getMetrics(),
            strategies: this.strategies
        };
    }

    /**
     * Import learning data
     */
    importData(data: ReturnType<typeof this.exportData>): void {
        this.outcomes = data.outcomes;
        data.metrics.forEach(m => {
            this.metrics.set(`${m.agentId}:${m.taskType}`, m);
        });
        this.strategies = data.strategies;

        // Restore current strategies
        for (const strategy of data.strategies) {
            const current = this.currentStrategies.get(strategy.agentId);
            if (!current || strategy.generation > current.generation) {
                this.currentStrategies.set(strategy.agentId, strategy);
            }
        }

        console.log(`[SelfImprovementEngine] Imported ${data.outcomes.length} outcomes`);
    }
}

// Export singleton
export const selfImprovementEngine = SelfImprovementEngine.getInstance();
