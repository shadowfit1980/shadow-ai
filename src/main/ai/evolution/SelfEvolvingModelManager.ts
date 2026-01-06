/**
 * Self-Evolving Model Manager
 * 
 * Manages on-device model evolution through continuous learning,
 * fine-tuning based on user interactions, and autonomous improvement.
 */

import { EventEmitter } from 'events';

export interface EvolvedModel {
    id: string;
    baseModel: string;
    version: number;
    adaptations: Adaptation[];
    performance: PerformanceMetrics;
    trainingData: TrainingRecord[];
    state: ModelState;
    createdAt: Date;
    lastEvolution: Date;
}

export type ModelState = 'stable' | 'evolving' | 'testing' | 'degraded';

export interface Adaptation {
    id: string;
    type: AdaptationType;
    description: string;
    improvement: number;
    appliedAt: Date;
    rollbackable: boolean;
}

export type AdaptationType =
    | 'style'
    | 'domain'
    | 'behavior'
    | 'accuracy'
    | 'speed'
    | 'context';

export interface PerformanceMetrics {
    accuracy: number;
    responseTime: number;
    userSatisfaction: number;
    contextRetention: number;
    codeQuality: number;
    innovationScore: number;
}

export interface TrainingRecord {
    id: string;
    input: string;
    expectedOutput?: string;
    actualOutput: string;
    feedback: FeedbackType;
    timestamp: Date;
}

export type FeedbackType = 'positive' | 'negative' | 'neutral' | 'correction';

export interface EvolutionRule {
    id: string;
    trigger: string;
    condition: (metrics: PerformanceMetrics) => boolean;
    action: AdaptationType;
    description: string;
}

export interface EvolutionConfig {
    autoEvolve: boolean;
    evolutionThreshold: number;
    maxAdaptationsPerDay: number;
    rollbackOnDegradation: boolean;
    preserveUserPreferences: boolean;
}

export class SelfEvolvingModelManager extends EventEmitter {
    private static instance: SelfEvolvingModelManager;
    private models: Map<string, EvolvedModel> = new Map();
    private rules: EvolutionRule[] = [];
    private config: EvolutionConfig = {
        autoEvolve: true,
        evolutionThreshold: 0.7,
        maxAdaptationsPerDay: 5,
        rollbackOnDegradation: true,
        preserveUserPreferences: true,
    };

    private constructor() {
        super();
        this.initializeEvolutionRules();
    }

    static getInstance(): SelfEvolvingModelManager {
        if (!SelfEvolvingModelManager.instance) {
            SelfEvolvingModelManager.instance = new SelfEvolvingModelManager();
        }
        return SelfEvolvingModelManager.instance;
    }

    private initializeEvolutionRules(): void {
        this.rules = [
            {
                id: 'rule_accuracy',
                trigger: 'Low accuracy detected',
                condition: (m) => m.accuracy < 0.8,
                action: 'accuracy',
                description: 'Trigger fine-tuning when accuracy drops below 80%',
            },
            {
                id: 'rule_speed',
                trigger: 'Slow response times',
                condition: (m) => m.responseTime > 2000,
                action: 'speed',
                description: 'Optimize model when responses exceed 2 seconds',
            },
            {
                id: 'rule_satisfaction',
                trigger: 'User dissatisfaction',
                condition: (m) => m.userSatisfaction < 0.7,
                action: 'behavior',
                description: 'Adapt behavior when satisfaction drops below 70%',
            },
            {
                id: 'rule_context',
                trigger: 'Context loss',
                condition: (m) => m.contextRetention < 0.6,
                action: 'context',
                description: 'Improve context retention when below 60%',
            },
            {
                id: 'rule_quality',
                trigger: 'Code quality issues',
                condition: (m) => m.codeQuality < 0.75,
                action: 'accuracy',
                description: 'Enhance code quality when below 75%',
            },
        ];
    }

    // ========================================================================
    // MODEL CREATION
    // ========================================================================

    async createEvolvingModel(baseModel: string): Promise<EvolvedModel> {
        const model: EvolvedModel = {
            id: `model_${Date.now()}`,
            baseModel,
            version: 1,
            adaptations: [],
            performance: {
                accuracy: 0.85,
                responseTime: 1000,
                userSatisfaction: 0.8,
                contextRetention: 0.75,
                codeQuality: 0.8,
                innovationScore: 0.5,
            },
            trainingData: [],
            state: 'stable',
            createdAt: new Date(),
            lastEvolution: new Date(),
        };

        this.models.set(model.id, model);
        this.emit('model:created', model);
        return model;
    }

    // ========================================================================
    // FEEDBACK & LEARNING
    // ========================================================================

    async recordInteraction(
        modelId: string,
        input: string,
        output: string,
        feedback: FeedbackType,
        expectedOutput?: string
    ): Promise<void> {
        const model = this.models.get(modelId);
        if (!model) return;

        const record: TrainingRecord = {
            id: `train_${Date.now()}`,
            input,
            expectedOutput,
            actualOutput: output,
            feedback,
            timestamp: new Date(),
        };

        model.trainingData.push(record);

        // Update performance based on feedback
        this.updatePerformanceFromFeedback(model, feedback);

        // Check if evolution is needed
        if (this.config.autoEvolve) {
            await this.checkEvolutionTriggers(model);
        }

        this.emit('interaction:recorded', { model, record });
    }

    private updatePerformanceFromFeedback(model: EvolvedModel, feedback: FeedbackType): void {
        const delta = {
            positive: 0.02,
            negative: -0.05,
            neutral: 0,
            correction: -0.03,
        }[feedback];

        model.performance.userSatisfaction = Math.max(0, Math.min(1,
            model.performance.userSatisfaction + delta
        ));

        if (feedback === 'positive') {
            model.performance.accuracy = Math.min(1, model.performance.accuracy + 0.01);
        } else if (feedback === 'correction') {
            model.performance.accuracy = Math.max(0, model.performance.accuracy - 0.02);
        }
    }

    // ========================================================================
    // EVOLUTION
    // ========================================================================

    private async checkEvolutionTriggers(model: EvolvedModel): Promise<void> {
        for (const rule of this.rules) {
            if (rule.condition(model.performance)) {
                await this.evolve(model.id, rule.action, rule.description);
                break; // One evolution at a time
            }
        }
    }

    async evolve(modelId: string, type: AdaptationType, reason?: string): Promise<Adaptation | undefined> {
        const model = this.models.get(modelId);
        if (!model) return undefined;

        // Check daily limit
        const today = new Date().toDateString();
        const todayAdaptations = model.adaptations.filter(
            a => a.appliedAt.toDateString() === today
        ).length;

        if (todayAdaptations >= this.config.maxAdaptationsPerDay) {
            this.emit('evolution:limited', { model, reason: 'Daily limit reached' });
            return undefined;
        }

        model.state = 'evolving';
        this.emit('evolution:started', { model, type });

        // Simulate evolution process
        const adaptation = await this.performAdaptation(model, type, reason);

        model.adaptations.push(adaptation);
        model.version++;
        model.lastEvolution = new Date();
        model.state = 'testing';

        // Validate the adaptation
        const valid = await this.validateAdaptation(model, adaptation);

        if (valid) {
            model.state = 'stable';
            this.emit('evolution:completed', { model, adaptation });
        } else if (this.config.rollbackOnDegradation) {
            await this.rollbackAdaptation(model, adaptation);
            model.state = 'stable';
            this.emit('evolution:rolledback', { model, adaptation });
        } else {
            model.state = 'degraded';
            this.emit('evolution:degraded', { model, adaptation });
        }

        return adaptation;
    }

    private async performAdaptation(
        model: EvolvedModel,
        type: AdaptationType,
        reason?: string
    ): Promise<Adaptation> {
        // Simulate improvement based on type
        const improvements: Record<AdaptationType, () => number> = {
            accuracy: () => {
                model.performance.accuracy = Math.min(1, model.performance.accuracy + 0.05);
                return 0.05;
            },
            speed: () => {
                model.performance.responseTime = Math.max(100, model.performance.responseTime - 200);
                return 0.1;
            },
            behavior: () => {
                model.performance.userSatisfaction = Math.min(1, model.performance.userSatisfaction + 0.08);
                return 0.08;
            },
            context: () => {
                model.performance.contextRetention = Math.min(1, model.performance.contextRetention + 0.1);
                return 0.1;
            },
            style: () => {
                model.performance.innovationScore = Math.min(1, model.performance.innovationScore + 0.05);
                return 0.05;
            },
            domain: () => {
                model.performance.codeQuality = Math.min(1, model.performance.codeQuality + 0.05);
                return 0.05;
            },
        };

        const improvement = improvements[type]();

        return {
            id: `adapt_${Date.now()}`,
            type,
            description: reason || `Automatic ${type} improvement`,
            improvement,
            appliedAt: new Date(),
            rollbackable: true,
        };
    }

    private async validateAdaptation(model: EvolvedModel, adaptation: Adaptation): Promise<boolean> {
        // Simulate validation - in practice, this would run tests
        const overallScore = Object.values(model.performance).reduce((s, v) => s + v, 0) / 6;
        return overallScore >= this.config.evolutionThreshold;
    }

    private async rollbackAdaptation(model: EvolvedModel, adaptation: Adaptation): Promise<void> {
        if (!adaptation.rollbackable) return;

        // Reverse the improvement
        const rollbacks: Record<AdaptationType, () => void> = {
            accuracy: () => { model.performance.accuracy -= adaptation.improvement; },
            speed: () => { model.performance.responseTime += 200; },
            behavior: () => { model.performance.userSatisfaction -= adaptation.improvement; },
            context: () => { model.performance.contextRetention -= adaptation.improvement; },
            style: () => { model.performance.innovationScore -= adaptation.improvement; },
            domain: () => { model.performance.codeQuality -= adaptation.improvement; },
        };

        rollbacks[adaptation.type]();
        model.version--;
        model.adaptations = model.adaptations.filter(a => a.id !== adaptation.id);
    }

    // ========================================================================
    // USER PREFERENCES
    // ========================================================================

    async applyUserPreferences(modelId: string, preferences: {
        verbosity?: 'concise' | 'detailed';
        codeStyle?: 'functional' | 'oop' | 'mixed';
        commentLevel?: 'minimal' | 'moderate' | 'extensive';
        riskTolerance?: 'conservative' | 'balanced' | 'aggressive';
    }): Promise<void> {
        const model = this.models.get(modelId);
        if (!model) return;

        const adaptation: Adaptation = {
            id: `pref_${Date.now()}`,
            type: 'style',
            description: `Applied user preferences: ${JSON.stringify(preferences)}`,
            improvement: 0,
            appliedAt: new Date(),
            rollbackable: true,
        };

        // Adjust performance based on preferences
        if (preferences.verbosity === 'detailed') {
            model.performance.contextRetention += 0.05;
        }
        if (preferences.codeStyle) {
            model.performance.codeQuality += 0.03;
        }

        model.adaptations.push(adaptation);
        this.emit('preferences:applied', { model, preferences });
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getModel(id: string): EvolvedModel | undefined {
        return this.models.get(id);
    }

    getAllModels(): EvolvedModel[] {
        return Array.from(this.models.values());
    }

    getEvolutionHistory(modelId: string): Adaptation[] {
        return this.models.get(modelId)?.adaptations || [];
    }

    getConfig(): EvolutionConfig {
        return { ...this.config };
    }

    updateConfig(updates: Partial<EvolutionConfig>): void {
        Object.assign(this.config, updates);
        this.emit('config:updated', this.config);
    }

    getStats(): {
        totalModels: number;
        totalAdaptations: number;
        avgPerformance: number;
        stableModels: number;
    } {
        const models = Array.from(this.models.values());
        const avgPerf = models.length > 0
            ? models.reduce((s, m) => {
                const perf = Object.values(m.performance).reduce((ps, v) => ps + v, 0) / 6;
                return s + perf;
            }, 0) / models.length
            : 0;

        return {
            totalModels: models.length,
            totalAdaptations: models.reduce((s, m) => s + m.adaptations.length, 0),
            avgPerformance: avgPerf,
            stableModels: models.filter(m => m.state === 'stable').length,
        };
    }
}

export const selfEvolvingModelManager = SelfEvolvingModelManager.getInstance();
