/**
 * Self-Improvement Loop
 * 
 * Enables the agent to improve itself through:
 * - A/B testing different prompts/strategies
 * - Tracking success metrics per approach
 * - Automatically adopting better strategies
 * - Feedback-based learning
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Strategy {
    id: string;
    name: string;
    type: StrategyType;
    prompt?: string;
    parameters: Record<string, any>;
    metrics: StrategyMetrics;
    isActive: boolean;
    isControl: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type StrategyType =
    | 'prompt'        // Different prompt templates
    | 'temperature'   // Model temperature settings
    | 'context'       // Context inclusion strategies
    | 'reasoning'     // Reasoning approaches
    | 'validation';   // Response validation strategies

export interface StrategyMetrics {
    attempts: number;
    successes: number;
    failures: number;
    successRate: number;
    avgResponseTime: number;
    avgTokens: number;
    userSatisfaction: number;
    confidenceScore: number;
}

export interface Experiment {
    id: string;
    name: string;
    description: string;
    strategyIds: string[];
    status: 'running' | 'completed' | 'paused';
    trafficSplit: Record<string, number>; // Strategy ID -> percentage
    minSampleSize: number;
    currentSamples: number;
    results: ExperimentResult[];
    winner?: string;
    startedAt: Date;
    completedAt?: Date;
}

export interface ExperimentResult {
    strategyId: string;
    timestamp: Date;
    success: boolean;
    responseTime: number;
    tokens: number;
    feedback?: number;
    context: string;
}

export interface ImprovementSuggestion {
    id: string;
    type: 'prompt' | 'parameter' | 'workflow';
    description: string;
    expectedImprovement: number;
    confidence: number;
    basedOn: string[];
}

/**
 * SelfImprovementLoop manages continuous improvement
 */
export class SelfImprovementLoop extends EventEmitter {
    private static instance: SelfImprovementLoop;
    private strategies: Map<string, Strategy> = new Map();
    private experiments: Map<string, Experiment> = new Map();
    private storagePath: string;

    private constructor() {
        super();
        this.storagePath = path.join(process.cwd(), '.shadow-improvement');
        this.initialize();
    }

    static getInstance(): SelfImprovementLoop {
        if (!SelfImprovementLoop.instance) {
            SelfImprovementLoop.instance = new SelfImprovementLoop();
        }
        return SelfImprovementLoop.instance;
    }

    /**
     * Initialize with default strategies
     */
    private async initialize(): Promise<void> {
        await this.loadFromDisk();

        // Add default strategies if empty
        if (this.strategies.size === 0) {
            this.createDefaultStrategies();
        }

        console.log(`🔄 [SelfImprovementLoop] Initialized with ${this.strategies.size} strategies`);
    }

    /**
     * Create default strategies
     */
    private createDefaultStrategies(): void {
        // Prompt strategies
        this.addStrategy({
            name: 'Default Prompt',
            type: 'prompt',
            prompt: 'You are a helpful coding assistant. Answer the user\'s question directly and concisely.',
            parameters: {},
            isControl: true,
        });

        this.addStrategy({
            name: 'Chain of Thought',
            type: 'prompt',
            prompt: 'You are a helpful coding assistant. Think step by step before answering. First outline your approach, then provide the solution.',
            parameters: {},
            isControl: false,
        });

        this.addStrategy({
            name: 'Expert Persona',
            type: 'prompt',
            prompt: 'You are an expert software architect with 20 years of experience. Provide professional-grade solutions with best practices.',
            parameters: {},
            isControl: false,
        });

        // Temperature strategies
        this.addStrategy({
            name: 'Conservative (0.3)',
            type: 'temperature',
            parameters: { temperature: 0.3 },
            isControl: true,
        });

        this.addStrategy({
            name: 'Balanced (0.7)',
            type: 'temperature',
            parameters: { temperature: 0.7 },
            isControl: false,
        });

        this.addStrategy({
            name: 'Creative (0.9)',
            type: 'temperature',
            parameters: { temperature: 0.9 },
            isControl: false,
        });

        // Reasoning strategies
        this.addStrategy({
            name: 'Direct Answer',
            type: 'reasoning',
            parameters: { showReasoning: false },
            isControl: true,
        });

        this.addStrategy({
            name: 'Show Work',
            type: 'reasoning',
            parameters: { showReasoning: true },
            isControl: false,
        });
    }

    /**
     * Add a new strategy
     */
    addStrategy(params: {
        name: string;
        type: StrategyType;
        prompt?: string;
        parameters: Record<string, any>;
        isControl?: boolean;
    }): Strategy {
        const strategy: Strategy = {
            id: `strat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: params.name,
            type: params.type,
            prompt: params.prompt,
            parameters: params.parameters,
            metrics: {
                attempts: 0,
                successes: 0,
                failures: 0,
                successRate: 0,
                avgResponseTime: 0,
                avgTokens: 0,
                userSatisfaction: 0,
                confidenceScore: 0.5,
            },
            isActive: true,
            isControl: params.isControl || false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.strategies.set(strategy.id, strategy);
        this.scheduleSave();
        this.emit('strategy:added', strategy);

        return strategy;
    }

    /**
     * Create an experiment
     */
    createExperiment(params: {
        name: string;
        description: string;
        strategyIds: string[];
        minSampleSize?: number;
    }): Experiment {
        const strategyCount = params.strategyIds.length;
        const equalSplit = Math.floor(100 / strategyCount);
        const trafficSplit: Record<string, number> = {};

        for (const id of params.strategyIds) {
            trafficSplit[id] = equalSplit;
        }

        const experiment: Experiment = {
            id: `exp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: params.name,
            description: params.description,
            strategyIds: params.strategyIds,
            status: 'running',
            trafficSplit,
            minSampleSize: params.minSampleSize || 100,
            currentSamples: 0,
            results: [],
            startedAt: new Date(),
        };

        this.experiments.set(experiment.id, experiment);
        this.scheduleSave();
        this.emit('experiment:created', experiment);

        return experiment;
    }

    /**
     * Select a strategy for a request (for A/B testing)
     */
    selectStrategy(type: StrategyType, experimentId?: string): Strategy | undefined {
        if (experimentId) {
            const experiment = this.experiments.get(experimentId);
            if (experiment && experiment.status === 'running') {
                return this.selectByTrafficSplit(experiment);
            }
        }

        // Select best performing active strategy
        const activeStrategies = [...this.strategies.values()]
            .filter(s => s.type === type && s.isActive);

        if (activeStrategies.length === 0) return undefined;

        // Epsilon-greedy: 80% best, 20% random
        if (Math.random() < 0.8) {
            return activeStrategies.sort((a, b) =>
                b.metrics.successRate - a.metrics.successRate
            )[0];
        } else {
            return activeStrategies[Math.floor(Math.random() * activeStrategies.length)];
        }
    }

    /**
     * Select strategy based on traffic split
     */
    private selectByTrafficSplit(experiment: Experiment): Strategy | undefined {
        const rand = Math.random() * 100;
        let cumulative = 0;

        for (const [strategyId, percentage] of Object.entries(experiment.trafficSplit)) {
            cumulative += percentage;
            if (rand <= cumulative) {
                return this.strategies.get(strategyId);
            }
        }

        return undefined;
    }

    /**
     * Record a result
     */
    recordResult(params: {
        strategyId: string;
        experimentId?: string;
        success: boolean;
        responseTime: number;
        tokens: number;
        feedback?: number;
        context?: string;
    }): void {
        const strategy = this.strategies.get(params.strategyId);
        if (!strategy) return;

        // Update strategy metrics
        const m = strategy.metrics;
        m.attempts++;
        if (params.success) m.successes++;
        else m.failures++;
        m.successRate = m.successes / m.attempts;

        // Update averages with exponential moving average
        const alpha = 0.1;
        m.avgResponseTime = m.avgResponseTime * (1 - alpha) + params.responseTime * alpha;
        m.avgTokens = m.avgTokens * (1 - alpha) + params.tokens * alpha;

        if (params.feedback !== undefined) {
            m.userSatisfaction = m.userSatisfaction * (1 - alpha) + params.feedback * alpha;
        }

        // Calculate confidence score
        m.confidenceScore = this.calculateConfidence(m);

        strategy.updatedAt = new Date();

        // Record experiment result
        if (params.experimentId) {
            const experiment = this.experiments.get(params.experimentId);
            if (experiment) {
                experiment.results.push({
                    strategyId: params.strategyId,
                    timestamp: new Date(),
                    success: params.success,
                    responseTime: params.responseTime,
                    tokens: params.tokens,
                    feedback: params.feedback,
                    context: params.context || '',
                });
                experiment.currentSamples++;

                // Check if experiment should complete
                if (experiment.currentSamples >= experiment.minSampleSize) {
                    this.evaluateExperiment(experiment.id);
                }
            }
        }

        this.scheduleSave();
        this.emit('result:recorded', { strategyId: params.strategyId, success: params.success });
    }

    /**
     * Calculate confidence score
     */
    private calculateConfidence(metrics: StrategyMetrics): number {
        // More samples = higher confidence
        const sampleConfidence = Math.min(1, metrics.attempts / 100);

        // Combine with success rate
        return (sampleConfidence + metrics.successRate) / 2;
    }

    /**
     * Evaluate an experiment and determine winner
     */
    evaluateExperiment(experimentId: string): void {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        const strategyStats: Map<string, { successes: number; total: number; avgTime: number }> = new Map();

        // Aggregate results
        for (const result of experiment.results) {
            const stats = strategyStats.get(result.strategyId) || { successes: 0, total: 0, avgTime: 0 };
            stats.total++;
            if (result.success) stats.successes++;
            stats.avgTime = (stats.avgTime * (stats.total - 1) + result.responseTime) / stats.total;
            strategyStats.set(result.strategyId, stats);
        }

        // Find winner
        let winner: string | undefined;
        let bestScore = -1;

        for (const [strategyId, stats] of strategyStats) {
            const successRate = stats.total > 0 ? stats.successes / stats.total : 0;
            // Score combines success rate and speed
            const score = successRate - (stats.avgTime / 10000);
            if (score > bestScore) {
                bestScore = score;
                winner = strategyId;
            }
        }

        experiment.winner = winner;
        experiment.status = 'completed';
        experiment.completedAt = new Date();

        // Promote winning strategy
        if (winner) {
            const winningStrategy = this.strategies.get(winner);
            if (winningStrategy) {
                this.promoteStrategy(winner);
            }
        }

        this.scheduleSave();
        this.emit('experiment:completed', experiment);
    }

    /**
     * Promote a winning strategy
     */
    promoteStrategy(strategyId: string): void {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) return;

        // Demote other strategies of same type
        for (const s of this.strategies.values()) {
            if (s.type === strategy.type && s.id !== strategyId) {
                s.isControl = false;
            }
        }

        strategy.isControl = true;
        this.scheduleSave();
        this.emit('strategy:promoted', strategy);
    }

    /**
     * Get improvement suggestions
     */
    getSuggestions(): ImprovementSuggestion[] {
        const suggestions: ImprovementSuggestion[] = [];

        // Analyze current strategies
        for (const strategy of this.strategies.values()) {
            if (strategy.metrics.successRate < 0.5 && strategy.metrics.attempts > 20) {
                suggestions.push({
                    id: `sug-${Date.now()}`,
                    type: 'prompt',
                    description: `Strategy "${strategy.name}" has low success rate (${(strategy.metrics.successRate * 100).toFixed(1)}%). Consider revising.`,
                    expectedImprovement: 0.2,
                    confidence: 0.7,
                    basedOn: [strategy.id],
                });
            }

            if (strategy.metrics.avgResponseTime > 5000) {
                suggestions.push({
                    id: `sug-${Date.now()}`,
                    type: 'parameter',
                    description: `Strategy "${strategy.name}" is slow (avg ${strategy.metrics.avgResponseTime}ms). Consider reducing context or using smaller model.`,
                    expectedImprovement: 0.3,
                    confidence: 0.6,
                    basedOn: [strategy.id],
                });
            }
        }

        return suggestions;
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalStrategies: number;
        activeExperiments: number;
        totalResults: number;
        bestPerforming: Strategy | undefined;
    } {
        const strategies = [...this.strategies.values()];
        const totalResults = [...this.experiments.values()]
            .reduce((sum, exp) => sum + exp.results.length, 0);

        const bestPerforming = strategies
            .filter(s => s.metrics.attempts > 10)
            .sort((a, b) => b.metrics.successRate - a.metrics.successRate)[0];

        return {
            totalStrategies: strategies.length,
            activeExperiments: [...this.experiments.values()].filter(e => e.status === 'running').length,
            totalResults,
            bestPerforming,
        };
    }

    // Persistence
    private saveDebounce: NodeJS.Timeout | null = null;

    private scheduleSave(): void {
        if (this.saveDebounce) clearTimeout(this.saveDebounce);
        this.saveDebounce = setTimeout(() => this.saveToDisk(), 2000);
    }

    private async saveToDisk(): Promise<void> {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
            const data = {
                strategies: [...this.strategies.values()],
                experiments: [...this.experiments.values()],
            };
            await fs.writeFile(
                path.join(this.storagePath, 'improvement.json'),
                JSON.stringify(data, null, 2)
            );
        } catch (error: any) {
            console.error('Failed to save improvement data:', error.message);
        }
    }

    private async loadFromDisk(): Promise<void> {
        try {
            const content = await fs.readFile(
                path.join(this.storagePath, 'improvement.json'),
                'utf-8'
            );
            const data = JSON.parse(content);

            for (const s of data.strategies || []) {
                s.createdAt = new Date(s.createdAt);
                s.updatedAt = new Date(s.updatedAt);
                this.strategies.set(s.id, s);
            }

            for (const e of data.experiments || []) {
                e.startedAt = new Date(e.startedAt);
                if (e.completedAt) e.completedAt = new Date(e.completedAt);
                this.experiments.set(e.id, e);
            }
        } catch {
            // File doesn't exist yet
        }
    }

    // Public API
    getStrategies(): Strategy[] { return [...this.strategies.values()]; }
    getStrategy(id: string): Strategy | undefined { return this.strategies.get(id); }
    getExperiments(): Experiment[] { return [...this.experiments.values()]; }
    getExperiment(id: string): Experiment | undefined { return this.experiments.get(id); }
}

export default SelfImprovementLoop;
