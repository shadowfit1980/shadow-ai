/**
 * Model Router
 * 
 * Strategic model selection and routing based on task type.
 * Supports fallback, ensemble strategies, and cost-aware routing.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export type TaskCategory =
    | 'code_generation'
    | 'code_analysis'
    | 'debugging'
    | 'documentation'
    | 'chat'
    | 'summarization'
    | 'refactoring'
    | 'testing'
    | 'creative'
    | 'reasoning';

export type ModelTier = 'fast' | 'balanced' | 'smart' | 'creative';

export interface ModelProfile {
    id: string;
    name: string;
    provider: string;
    tier: ModelTier;
    strengths: TaskCategory[];
    costPerToken: number;
    avgLatencyMs: number;
    contextWindow: number;
    available: boolean;
}

export interface RoutingDecision {
    primaryModel: string;
    fallbackModels: string[];
    reasoning: string;
    estimatedCost: number;
    estimatedLatency: number;
}

export interface EnsembleResult {
    responses: Array<{
        model: string;
        response: string;
        confidence: number;
        latency: number;
    }>;
    synthesizedResponse: string;
    consensusConfidence: number;
}

// ============================================================================
// MODEL PROFILES
// ============================================================================

const DEFAULT_PROFILES: ModelProfile[] = [
    {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        tier: 'smart',
        strengths: ['code_generation', 'reasoning', 'debugging', 'refactoring'],
        costPerToken: 0.00003,
        avgLatencyMs: 3000,
        contextWindow: 128000,
        available: true
    },
    {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        tier: 'fast',
        strengths: ['chat', 'summarization', 'documentation'],
        costPerToken: 0.000002,
        avgLatencyMs: 800,
        contextWindow: 16385,
        available: true
    },
    {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        tier: 'smart',
        strengths: ['code_analysis', 'reasoning', 'documentation', 'refactoring'],
        costPerToken: 0.00006,
        avgLatencyMs: 4000,
        contextWindow: 200000,
        available: true
    },
    {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        tier: 'balanced',
        strengths: ['code_generation', 'chat', 'documentation'],
        costPerToken: 0.00001,
        avgLatencyMs: 1500,
        contextWindow: 200000,
        available: true
    },
    {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        tier: 'balanced',
        strengths: ['code_generation', 'reasoning', 'chat'],
        costPerToken: 0.000005,
        avgLatencyMs: 1200,
        contextWindow: 32000,
        available: true
    },
    {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        provider: 'deepseek',
        tier: 'fast',
        strengths: ['code_generation', 'debugging', 'testing'],
        costPerToken: 0.000001,
        avgLatencyMs: 600,
        contextWindow: 16000,
        available: true
    }
];

// ============================================================================
// MODEL ROUTER
// ============================================================================

export class ModelRouter extends EventEmitter {
    private static instance: ModelRouter;
    private modelManager: ModelManager;
    private profiles: Map<string, ModelProfile> = new Map();
    private performanceHistory: Map<string, { successes: number; failures: number; avgLatency: number }> = new Map();
    private currentStrategy: 'cost' | 'quality' | 'speed' | 'balanced' = 'balanced';

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
        this.initializeProfiles();
    }

    static getInstance(): ModelRouter {
        if (!ModelRouter.instance) {
            ModelRouter.instance = new ModelRouter();
        }
        return ModelRouter.instance;
    }

    private initializeProfiles(): void {
        for (const profile of DEFAULT_PROFILES) {
            this.profiles.set(profile.id, profile);
            this.performanceHistory.set(profile.id, { successes: 0, failures: 0, avgLatency: profile.avgLatencyMs });
        }
        console.log(`📊 Model Router initialized with ${this.profiles.size} model profiles`);
    }

    // ========================================================================
    // ROUTING
    // ========================================================================

    /**
     * Route a task to the best model
     */
    routeTask(task: TaskCategory, requirements?: {
        maxLatencyMs?: number;
        maxCostPerToken?: number;
        minContextWindow?: number;
        preferredTier?: ModelTier;
    }): RoutingDecision {
        console.log(`🔀 Routing ${task} task...`);

        const candidates = this.getCandidates(task, requirements);

        if (candidates.length === 0) {
            // Fallback to any available model
            const anyAvailable = Array.from(this.profiles.values()).find(p => p.available);
            return {
                primaryModel: anyAvailable?.id || 'gpt-3.5-turbo',
                fallbackModels: [],
                reasoning: 'No optimal model found, using fallback',
                estimatedCost: 0,
                estimatedLatency: 1000
            };
        }

        // Score candidates based on strategy
        const scored = candidates.map(profile => ({
            profile,
            score: this.scoreModel(profile, task)
        })).sort((a, b) => b.score - a.score);

        const primary = scored[0].profile;
        const fallbacks = scored.slice(1, 3).map(s => s.profile.id);

        const decision: RoutingDecision = {
            primaryModel: primary.id,
            fallbackModels: fallbacks,
            reasoning: `Selected ${primary.name} for ${task} (${this.currentStrategy} strategy, score: ${scored[0].score.toFixed(2)})`,
            estimatedCost: primary.costPerToken,
            estimatedLatency: primary.avgLatencyMs
        };

        this.emit('route:decided', decision);
        return decision;
    }

    /**
     * Get candidate models for a task
     */
    private getCandidates(task: TaskCategory, requirements?: {
        maxLatencyMs?: number;
        maxCostPerToken?: number;
        minContextWindow?: number;
        preferredTier?: ModelTier;
    }): ModelProfile[] {
        return Array.from(this.profiles.values()).filter(profile => {
            if (!profile.available) return false;
            if (requirements?.maxLatencyMs && profile.avgLatencyMs > requirements.maxLatencyMs) return false;
            if (requirements?.maxCostPerToken && profile.costPerToken > requirements.maxCostPerToken) return false;
            if (requirements?.minContextWindow && profile.contextWindow < requirements.minContextWindow) return false;
            return true;
        });
    }

    /**
     * Score a model for a specific task
     */
    private scoreModel(profile: ModelProfile, task: TaskCategory): number {
        let score = 0;

        // Strength match
        if (profile.strengths.includes(task)) {
            score += 40;
        }

        // Performance history
        const history = this.performanceHistory.get(profile.id);
        if (history) {
            const successRate = history.successes / (history.successes + history.failures + 1);
            score += successRate * 20;
        }

        // Strategy-based scoring
        switch (this.currentStrategy) {
            case 'cost':
                score += (1 - profile.costPerToken / 0.0001) * 20; // Normalize cost
                break;
            case 'speed':
                score += (1 - profile.avgLatencyMs / 5000) * 20; // Normalize latency
                break;
            case 'quality':
                score += profile.tier === 'smart' ? 30 : profile.tier === 'balanced' ? 20 : 10;
                break;
            case 'balanced':
            default:
                score += (1 - profile.costPerToken / 0.0001) * 10;
                score += (1 - profile.avgLatencyMs / 5000) * 10;
                score += profile.tier === 'smart' ? 15 : profile.tier === 'balanced' ? 10 : 5;
        }

        return score;
    }

    // ========================================================================
    // EXECUTION WITH ROUTING
    // ========================================================================

    /**
     * Execute a prompt with automatic routing and fallback
     */
    async executeWithRouting(
        prompt: string,
        task: TaskCategory,
        messages: Array<{ role: string; content: string; timestamp: Date }>
    ): Promise<{
        response: string;
        modelUsed: string;
        latency: number;
        attempts: number;
    }> {
        const routing = this.routeTask(task);
        const allModels = [routing.primaryModel, ...routing.fallbackModels];

        let attempts = 0;
        let lastError: Error | null = null;

        for (const modelId of allModels) {
            attempts++;
            const startTime = Date.now();

            try {
                // Select the model
                await this.modelManager.selectModel(modelId);

                // Execute
                const response = await this.modelManager.chat(messages as any);
                const latency = Date.now() - startTime;

                // Record success
                this.recordPerformance(modelId, true, latency);

                this.emit('execution:success', { modelId, latency, attempts });

                return {
                    response,
                    modelUsed: modelId,
                    latency,
                    attempts
                };

            } catch (error) {
                lastError = error as Error;
                console.log(`⚠️ Model ${modelId} failed, trying fallback...`);
                this.recordPerformance(modelId, false, Date.now() - startTime);
                this.emit('execution:fallback', { modelId, error: lastError.message });
            }
        }

        throw lastError || new Error('All models failed');
    }

    // ========================================================================
    // ENSEMBLE
    // ========================================================================

    /**
     * Execute with multiple models and synthesize response
     */
    async executeEnsemble(
        prompt: string,
        task: TaskCategory,
        numModels: number = 3
    ): Promise<EnsembleResult> {
        console.log(`🎭 Running ensemble with ${numModels} models...`);

        const routing = this.routeTask(task);
        const models = [routing.primaryModel, ...routing.fallbackModels].slice(0, numModels);

        const responses: EnsembleResult['responses'] = [];

        // Execute in parallel
        const results = await Promise.allSettled(
            models.map(async (modelId) => {
                const startTime = Date.now();
                await this.modelManager.selectModel(modelId);
                const response = await this.modelManager.chat([
                    { role: 'user' as const, content: prompt, timestamp: new Date() }
                ]);
                return {
                    model: modelId,
                    response,
                    confidence: 0.8, // Would be calculated based on model output
                    latency: Date.now() - startTime
                };
            })
        );

        for (const result of results) {
            if (result.status === 'fulfilled') {
                responses.push(result.value);
            }
        }

        // Synthesize best response
        const synthesized = this.synthesizeResponses(responses);

        return {
            responses,
            synthesizedResponse: synthesized.response,
            consensusConfidence: synthesized.confidence
        };
    }

    /**
     * Synthesize responses from multiple models
     */
    private synthesizeResponses(responses: EnsembleResult['responses']): {
        response: string;
        confidence: number;
    } {
        if (responses.length === 0) {
            return { response: '', confidence: 0 };
        }

        if (responses.length === 1) {
            return { response: responses[0].response, confidence: responses[0].confidence };
        }

        // Use the response with highest confidence, weighted by latency
        const scored = responses.map(r => ({
            ...r,
            score: r.confidence * (1 - r.latency / 10000)
        })).sort((a, b) => b.score - a.score);

        // Calculate consensus - how similar are the responses
        const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;

        return {
            response: scored[0].response,
            confidence: avgConfidence
        };
    }

    // ========================================================================
    // PERFORMANCE TRACKING
    // ========================================================================

    private recordPerformance(modelId: string, success: boolean, latency: number): void {
        const history = this.performanceHistory.get(modelId) || { successes: 0, failures: 0, avgLatency: 0 };

        if (success) {
            history.successes++;
            // Running average of latency
            history.avgLatency = (history.avgLatency * (history.successes - 1) + latency) / history.successes;
        } else {
            history.failures++;
        }

        this.performanceHistory.set(modelId, history);
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    setStrategy(strategy: 'cost' | 'quality' | 'speed' | 'balanced'): void {
        this.currentStrategy = strategy;
        console.log(`📊 Model routing strategy set to: ${strategy}`);
    }

    getStrategy(): string {
        return this.currentStrategy;
    }

    addProfile(profile: ModelProfile): void {
        this.profiles.set(profile.id, profile);
        this.performanceHistory.set(profile.id, { successes: 0, failures: 0, avgLatency: profile.avgLatencyMs });
    }

    setModelAvailability(modelId: string, available: boolean): void {
        const profile = this.profiles.get(modelId);
        if (profile) {
            profile.available = available;
        }
    }

    getProfiles(): ModelProfile[] {
        return Array.from(this.profiles.values());
    }

    getStats() {
        const stats: Record<string, any> = {};
        for (const [modelId, history] of this.performanceHistory) {
            const total = history.successes + history.failures;
            stats[modelId] = {
                totalCalls: total,
                successRate: total > 0 ? history.successes / total : 0,
                avgLatency: history.avgLatency
            };
        }
        return {
            strategy: this.currentStrategy,
            modelStats: stats
        };
    }
}

// Export singleton
export const modelRouter = ModelRouter.getInstance();
