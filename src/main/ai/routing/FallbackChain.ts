/**
 * FallbackChain - Intelligent Model Fallback & Retry Logic
 * 
 * Provides robust fallback chains with:
 * - Automatic retry with different models
 * - Confidence-based escalation
 * - Ensemble verification for critical tasks
 * - Graceful degradation
 */

import { ModelManager } from '../ModelManager';
import { ModelProfiler, modelProfiler } from './ModelProfiler';
import { EventEmitter } from 'events';
import { modelCapabilityMatcher, TaskComplexity } from './ModelCapabilityMatcher';

export interface FallbackConfig {
    maxRetries: number;
    timeoutMs: number;
    confidenceThreshold: number;  // Below this, escalate to ensemble
    useEnsembleForCritical: boolean;
}

export interface FallbackResult {
    success: boolean;
    response: string;
    modelUsed: string;
    attempts: number;
    totalLatencyMs: number;
    fallbacksUsed: string[];
    confidenceScore: number;
}

export interface ModelChain {
    primary: string;
    fallbacks: string[];
    ensembleModels?: string[];
}

const DEFAULT_CONFIG: FallbackConfig = {
    maxRetries: 3,
    timeoutMs: 30000,
    confidenceThreshold: 0.7,
    useEnsembleForCritical: true
};

export class FallbackChain extends EventEmitter {
    private static instance: FallbackChain;
    private modelManager: ModelManager;
    private profiler: ModelProfiler;
    private config: FallbackConfig;

    // Predefined fallback chains by provider type
    private chains: Map<string, ModelChain> = new Map([
        ['openai', {
            primary: 'gpt-4o',
            fallbacks: ['gpt-4o-mini', 'gpt-3.5-turbo'],
            ensembleModels: ['gpt-4o', 'claude-3-sonnet']
        }],
        ['anthropic', {
            primary: 'claude-3-opus',
            fallbacks: ['claude-3-sonnet', 'claude-3-haiku'],
            ensembleModels: ['claude-3-opus', 'gpt-4o']
        }],
        ['gemini', {
            primary: 'gemini-2.0-flash',
            fallbacks: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
            ensembleModels: ['gemini-2.0-flash', 'gpt-4o-mini']
        }],
        ['openrouter', {
            primary: 'openrouter/auto',
            fallbacks: [],  // OpenRouter has its own fallback
            ensembleModels: []
        }],
        ['deepseek', {
            primary: 'deepseek-chat',
            fallbacks: ['deepseek-coder'],
            ensembleModels: ['deepseek-chat', 'gpt-3.5-turbo']
        }]
    ]);

    private constructor(config: Partial<FallbackConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.modelManager = ModelManager.getInstance();
        this.profiler = modelProfiler;
        console.log('[FallbackChain] Initialized with', this.chains.size, 'chains');
    }

    static getInstance(): FallbackChain {
        if (!FallbackChain.instance) {
            FallbackChain.instance = new FallbackChain();
        }
        return FallbackChain.instance;
    }

    /**
     * Execute with automatic fallback
     */
    async executeWithFallback(
        messages: Array<{ role: string; content: string; timestamp: Date }>,
        options?: {
            primaryModel?: string;
            isCritical?: boolean;
            timeoutMs?: number;
        }
    ): Promise<FallbackResult> {
        const startTime = Date.now();
        const fallbacksUsed: string[] = [];
        let attempts = 0;
        let lastError: Error | null = null;

        // Determine the chain to use
        const chain = this.getChainForModel(options?.primaryModel);
        const modelsToTry = [chain.primary, ...chain.fallbacks];

        for (const modelId of modelsToTry) {
            if (attempts >= this.config.maxRetries) break;

            attempts++;
            const attemptStart = Date.now();

            try {
                // Check model health before trying
                if (!this.profiler.isModelHealthy(modelId, 40)) {
                    console.log(`[FallbackChain] Skipping unhealthy model: ${modelId}`);
                    continue;
                }

                // Select and execute
                await this.modelManager.selectModel(modelId);

                // Set up timeout
                const timeout = options?.timeoutMs || this.config.timeoutMs;
                const response = await this.executeWithTimeout(
                    () => this.modelManager.chat(messages as any),
                    timeout
                );

                const latencyMs = Date.now() - attemptStart;

                // Record success
                this.profiler.recordMetric(modelId, {
                    latencyMs,
                    success: true,
                    tokenCount: response.length / 4, // Rough estimate
                    cost: this.estimateCost(modelId, response.length)
                });

                // Calculate confidence (rough heuristic)
                const confidence = this.estimateConfidence(response);

                // Check if we need ensemble verification for critical tasks
                if (options?.isCritical &&
                    confidence < this.config.confidenceThreshold &&
                    this.config.useEnsembleForCritical) {
                    console.log('[FallbackChain] Low confidence on critical task, running ensemble...');
                    return await this.executeEnsemble(messages, chain);
                }

                this.emit('success', { modelId, attempts, latencyMs });

                return {
                    success: true,
                    response,
                    modelUsed: modelId,
                    attempts,
                    totalLatencyMs: Date.now() - startTime,
                    fallbacksUsed,
                    confidenceScore: confidence
                };

            } catch (error) {
                lastError = error as Error;
                fallbacksUsed.push(modelId);

                console.log(`[FallbackChain] Model ${modelId} failed:`, (error as Error).message);

                // Record failure
                this.profiler.recordMetric(modelId, {
                    latencyMs: Date.now() - attemptStart,
                    success: false,
                    tokenCount: 0,
                    cost: 0
                });

                this.emit('fallback', {
                    failedModel: modelId,
                    error: (error as Error).message,
                    attempt: attempts
                });
            }
        }

        // All models failed
        this.emit('allFailed', { attempts, fallbacksUsed, error: lastError?.message });

        return {
            success: false,
            response: `All ${attempts} attempts failed. Last error: ${lastError?.message}`,
            modelUsed: '',
            attempts,
            totalLatencyMs: Date.now() - startTime,
            fallbacksUsed,
            confidenceScore: 0
        };
    }

    /**
     * Execute with ensemble verification
     */
    private async executeEnsemble(
        messages: Array<{ role: string; content: string; timestamp: Date }>,
        chain: ModelChain
    ): Promise<FallbackResult> {
        const startTime = Date.now();
        const ensembleModels = chain.ensembleModels || [chain.primary, ...chain.fallbacks.slice(0, 1)];

        console.log(`[FallbackChain] Running ensemble with ${ensembleModels.length} models`);

        const results: Array<{ modelId: string; response: string; latency: number }> = [];

        // Execute in parallel
        const promises = ensembleModels.map(async (modelId) => {
            try {
                const start = Date.now();
                await this.modelManager.selectModel(modelId);
                const response = await this.modelManager.chat(messages as any);
                return { modelId, response, latency: Date.now() - start };
            } catch {
                return null;
            }
        });

        const settled = await Promise.allSettled(promises);
        for (const result of settled) {
            if (result.status === 'fulfilled' && result.value) {
                results.push(result.value);
            }
        }

        if (results.length === 0) {
            return {
                success: false,
                response: 'Ensemble failed - no models responded',
                modelUsed: '',
                attempts: ensembleModels.length,
                totalLatencyMs: Date.now() - startTime,
                fallbacksUsed: ensembleModels,
                confidenceScore: 0
            };
        }

        // Pick the best response (longest, assuming more complete)
        const best = results.reduce((a, b) =>
            a.response.length > b.response.length ? a : b
        );

        // Calculate ensemble confidence based on agreement
        const confidence = this.calculateEnsembleConfidence(results);

        return {
            success: true,
            response: best.response,
            modelUsed: `ensemble(${results.map(r => r.modelId).join(',')})`,
            attempts: ensembleModels.length,
            totalLatencyMs: Date.now() - startTime,
            fallbacksUsed: [],
            confidenceScore: confidence
        };
    }

    /**
     * Calculate confidence based on ensemble agreement
     */
    private calculateEnsembleConfidence(
        results: Array<{ modelId: string; response: string }>
    ): number {
        if (results.length <= 1) return 0.7;

        // Simple similarity check - look for common patterns
        const responses = results.map(r => r.response.toLowerCase());
        let agreementScore = 0;

        for (let i = 0; i < responses.length; i++) {
            for (let j = i + 1; j < responses.length; j++) {
                // Simple word overlap
                const words1 = new Set(responses[i].split(/\s+/));
                const words2 = new Set(responses[j].split(/\s+/));
                const intersection = new Set([...words1].filter(w => words2.has(w)));
                const union = new Set([...words1, ...words2]);
                const jaccard = intersection.size / union.size;
                agreementScore += jaccard;
            }
        }

        const pairs = (results.length * (results.length - 1)) / 2;
        return Math.min(0.95, 0.5 + (agreementScore / pairs) * 0.5);
    }

    /**
     * Execute with timeout
     */
    private async executeWithTimeout<T>(
        fn: () => Promise<T>,
        timeoutMs: number
    ): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
            )
        ]);
    }

    /**
     * Get the fallback chain for a model
     */
    private getChainForModel(modelId?: string): ModelChain {
        if (!modelId) {
            // Return first available chain
            return this.chains.get('openai') || { primary: 'gpt-4o', fallbacks: [] };
        }

        // Find by provider
        for (const [provider, chain] of this.chains) {
            if (modelId.toLowerCase().includes(provider)) {
                return chain;
            }
        }

        // Default to using the provided model as primary with openai fallback
        return {
            primary: modelId,
            fallbacks: ['gpt-4o-mini', 'gpt-3.5-turbo']
        };
    }

    /**
     * Estimate response confidence (heuristic)
     */
    private estimateConfidence(response: string): number {
        let confidence = 0.7;  // Base confidence

        // Longer responses generally more confident
        if (response.length > 500) confidence += 0.05;
        if (response.length > 1000) confidence += 0.05;

        // Check for uncertainty phrases
        const uncertainPhrases = [
            "i'm not sure", "i don't know", "might be", "possibly",
            "uncertain", "unclear", "may or may not"
        ];
        const lowerResponse = response.toLowerCase();
        for (const phrase of uncertainPhrases) {
            if (lowerResponse.includes(phrase)) {
                confidence -= 0.1;
            }
        }

        // Check for code blocks (higher confidence for code)
        if (response.includes('```')) {
            confidence += 0.1;
        }

        return Math.max(0.3, Math.min(0.95, confidence));
    }

    /**
     * Estimate cost (rough)
     */
    private estimateCost(modelId: string, responseLength: number): number {
        const tokenEstimate = responseLength / 4;
        const costPerToken: Record<string, number> = {
            'gpt-4o': 0.00003,
            'gpt-4o-mini': 0.000003,
            'gpt-3.5-turbo': 0.000002,
            'claude-3-opus': 0.00006,
            'claude-3-sonnet': 0.00001,
            'gemini': 0.000005,
            'deepseek': 0.000001
        };

        for (const [key, cost] of Object.entries(costPerToken)) {
            if (modelId.toLowerCase().includes(key.toLowerCase())) {
                return tokenEstimate * cost;
            }
        }

        return tokenEstimate * 0.00001; // Default cost
    }

    /**
     * Configure the fallback chain
     */
    configure(config: Partial<FallbackConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Add a custom chain
     */
    addChain(name: string, chain: ModelChain): void {
        this.chains.set(name, chain);
    }

    /**
     * Get current config
     */
    getConfig(): FallbackConfig {
        return { ...this.config };
    }

    /**
     * v24 APEX: Get optimal model for a task based on complexity analysis
     */
    getOptimalModelForTask(taskDescription: string): {
        modelId: string;
        complexity: TaskComplexity;
        reasoning: string;
    } | null {
        const complexity = modelCapabilityMatcher.analyzeTaskComplexity(taskDescription);
        const match = modelCapabilityMatcher.getOptimalModel(taskDescription);

        if (!match) return null;

        return {
            modelId: match.modelId,
            complexity,
            reasoning: match.reasoning
        };
    }

    /**
     * v24 APEX: Execute with complexity-aware model selection
     */
    async executeWithComplexityAwareFallback(
        messages: Array<{ role: string; content: string; timestamp: Date }>,
        taskDescription: string,
        options?: {
            isCritical?: boolean;
            timeoutMs?: number;
        }
    ): Promise<FallbackResult> {
        const optimal = this.getOptimalModelForTask(taskDescription);

        console.log(`[FallbackChain] Complexity: ${optimal?.complexity.level || 'unknown'}, using model: ${optimal?.modelId || 'default'}`);

        return this.executeWithFallback(messages, {
            primaryModel: optimal?.modelId,
            isCritical: options?.isCritical || optimal?.complexity.level === 'critical',
            timeoutMs: options?.timeoutMs
        });
    }
}

export const fallbackChain = FallbackChain.getInstance();
