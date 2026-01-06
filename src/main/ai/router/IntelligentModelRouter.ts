/**
 * 🔀 Intelligent Model Router
 * 
 * Hyper-agnostic LLM orchestration with:
 * - Dynamic routing based on task type, cost, latency
 * - Automatic fallback chains
 * - Model performance tracking
 * - Cost optimization
 * - Domain-specific model selection
 * 
 * This replaces the "dumb router" with TRUE intelligence.
 */

import { EventEmitter } from 'events';

// Model Provider Types
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'local';

export interface ModelConfig {
    id: string;
    provider: ModelProvider;
    name: string;
    displayName: string;

    // Capabilities
    capabilities: {
        maxContext: number;
        outputTokenLimit: number;
        supportsVision: boolean;
        supportsFunctionCalling: boolean;
        supportsStreaming: boolean;
        supportsJson: boolean;
    };

    // Performance characteristics
    performance: {
        averageLatency: number; // ms
        tokensPerSecond: number;
        reliability: number; // 0-1
    };

    // Cost (per 1M tokens)
    cost: {
        input: number;
        output: number;
        currency: 'USD';
    };

    // Best for
    strengths: string[];
    weaknesses: string[];
    recommendedTasks: TaskType[];
}

export type TaskType =
    | 'code_generation'
    | 'code_review'
    | 'code_explanation'
    | 'debugging'
    | 'refactoring'
    | 'documentation'
    | 'testing'
    | 'chat'
    | 'analysis'
    | 'vision'
    | 'function_calling'
    | 'long_context'
    | 'fast_response'
    | 'creative';

export interface RoutingRequest {
    taskType: TaskType;
    inputTokens: number;
    expectedOutputTokens?: number;
    priority: 'cost' | 'speed' | 'quality' | 'balanced';
    constraints?: {
        maxLatency?: number;
        maxCost?: number;
        requiredCapabilities?: string[];
        preferredProviders?: ModelProvider[];
        excludeProviders?: ModelProvider[];
    };
    context?: {
        language?: string;
        framework?: string;
        complexity?: 'low' | 'medium' | 'high';
    };
}

export interface RoutingDecision {
    selectedModel: ModelConfig;
    reasoning: string;
    alternatives: { model: ModelConfig; score: number; reason: string }[];
    estimatedCost: number;
    estimatedLatency: number;
    fallbackChain: ModelConfig[];
}

export interface ModelPerformanceMetrics {
    modelId: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    p95Latency: number;
    totalTokensProcessed: number;
    totalCost: number;
    lastUsed: Date;
    errorRate: number;
    taskTypePerformance: Map<TaskType, { success: number; latency: number }>;
}

class IntelligentModelRouter extends EventEmitter {
    private static instance: IntelligentModelRouter;
    private models: Map<string, ModelConfig> = new Map();
    private metrics: Map<string, ModelPerformanceMetrics> = new Map();
    private fallbackChains: Map<string, string[]> = new Map();

    private constructor() {
        super();
        this.initializeModels();
        this.initializeFallbackChains();
    }

    public static getInstance(): IntelligentModelRouter {
        if (!IntelligentModelRouter.instance) {
            IntelligentModelRouter.instance = new IntelligentModelRouter();
        }
        return IntelligentModelRouter.instance;
    }

    private initializeModels(): void {
        const modelConfigs: ModelConfig[] = [
            // OpenAI Models
            {
                id: 'gpt-4o',
                provider: 'openai',
                name: 'gpt-4o',
                displayName: 'GPT-4o',
                capabilities: {
                    maxContext: 128000,
                    outputTokenLimit: 16384,
                    supportsVision: true,
                    supportsFunctionCalling: true,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 2000,
                    tokensPerSecond: 100,
                    reliability: 0.99
                },
                cost: { input: 5, output: 15, currency: 'USD' },
                strengths: ['Multimodal', 'Fast', 'Vision', 'Function calling'],
                weaknesses: ['Cost'],
                recommendedTasks: ['code_generation', 'vision', 'function_calling', 'analysis']
            },
            {
                id: 'gpt-4o-mini',
                provider: 'openai',
                name: 'gpt-4o-mini',
                displayName: 'GPT-4o Mini',
                capabilities: {
                    maxContext: 128000,
                    outputTokenLimit: 16384,
                    supportsVision: true,
                    supportsFunctionCalling: true,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 800,
                    tokensPerSecond: 200,
                    reliability: 0.99
                },
                cost: { input: 0.15, output: 0.6, currency: 'USD' },
                strengths: ['Very fast', 'Cheap', 'Good quality'],
                weaknesses: ['Less capable than full GPT-4o'],
                recommendedTasks: ['chat', 'fast_response', 'documentation']
            },
            {
                id: 'o1',
                provider: 'openai',
                name: 'o1',
                displayName: 'O1 (Reasoning)',
                capabilities: {
                    maxContext: 200000,
                    outputTokenLimit: 100000,
                    supportsVision: true,
                    supportsFunctionCalling: false,
                    supportsStreaming: false,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 30000,
                    tokensPerSecond: 50,
                    reliability: 0.98
                },
                cost: { input: 15, output: 60, currency: 'USD' },
                strengths: ['Deep reasoning', 'Complex problems', 'Math'],
                weaknesses: ['Very slow', 'Expensive', 'No streaming'],
                recommendedTasks: ['debugging', 'analysis', 'refactoring']
            },
            // Anthropic Models
            {
                id: 'claude-3-5-sonnet',
                provider: 'anthropic',
                name: 'claude-3-5-sonnet-20241022',
                displayName: 'Claude 3.5 Sonnet',
                capabilities: {
                    maxContext: 200000,
                    outputTokenLimit: 8192,
                    supportsVision: true,
                    supportsFunctionCalling: true,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 1500,
                    tokensPerSecond: 150,
                    reliability: 0.99
                },
                cost: { input: 3, output: 15, currency: 'USD' },
                strengths: ['Excellent coding', 'Long context', 'Nuanced'],
                weaknesses: ['Slightly more expensive'],
                recommendedTasks: ['code_generation', 'code_review', 'long_context', 'refactoring']
            },
            {
                id: 'claude-3-5-haiku',
                provider: 'anthropic',
                name: 'claude-3-5-haiku-20241022',
                displayName: 'Claude 3.5 Haiku',
                capabilities: {
                    maxContext: 200000,
                    outputTokenLimit: 8192,
                    supportsVision: true,
                    supportsFunctionCalling: true,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 500,
                    tokensPerSecond: 300,
                    reliability: 0.99
                },
                cost: { input: 1, output: 5, currency: 'USD' },
                strengths: ['Very fast', 'Cheap', 'Good coding'],
                weaknesses: ['Less nuanced'],
                recommendedTasks: ['chat', 'fast_response', 'testing', 'documentation']
            },
            // Google Models
            {
                id: 'gemini-2-flash',
                provider: 'google',
                name: 'gemini-2.0-flash-exp',
                displayName: 'Gemini 2.0 Flash',
                capabilities: {
                    maxContext: 1000000,
                    outputTokenLimit: 8192,
                    supportsVision: true,
                    supportsFunctionCalling: true,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 600,
                    tokensPerSecond: 400,
                    reliability: 0.97
                },
                cost: { input: 0.075, output: 0.3, currency: 'USD' },
                strengths: ['1M context', 'Very fast', 'Very cheap'],
                weaknesses: ['Newer, less proven'],
                recommendedTasks: ['long_context', 'fast_response', 'analysis']
            },
            {
                id: 'gemini-1-5-pro',
                provider: 'google',
                name: 'gemini-1.5-pro',
                displayName: 'Gemini 1.5 Pro',
                capabilities: {
                    maxContext: 2000000,
                    outputTokenLimit: 8192,
                    supportsVision: true,
                    supportsFunctionCalling: true,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 2000,
                    tokensPerSecond: 100,
                    reliability: 0.98
                },
                cost: { input: 1.25, output: 5, currency: 'USD' },
                strengths: ['2M context (largest)', 'Good quality'],
                weaknesses: ['Slower than Flash'],
                recommendedTasks: ['long_context', 'code_review', 'analysis']
            },
            // Local Models (Ollama)
            {
                id: 'llama3-70b',
                provider: 'ollama',
                name: 'llama3:70b',
                displayName: 'Llama 3 70B',
                capabilities: {
                    maxContext: 8192,
                    outputTokenLimit: 4096,
                    supportsVision: false,
                    supportsFunctionCalling: false,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 3000,
                    tokensPerSecond: 30,
                    reliability: 0.95
                },
                cost: { input: 0, output: 0, currency: 'USD' },
                strengths: ['Free', 'Private', 'No API limits'],
                weaknesses: ['Requires local GPU', 'Slower'],
                recommendedTasks: ['code_generation', 'chat']
            },
            {
                id: 'codellama-34b',
                provider: 'ollama',
                name: 'codellama:34b',
                displayName: 'Code Llama 34B',
                capabilities: {
                    maxContext: 16384,
                    outputTokenLimit: 4096,
                    supportsVision: false,
                    supportsFunctionCalling: false,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 2000,
                    tokensPerSecond: 50,
                    reliability: 0.95
                },
                cost: { input: 0, output: 0, currency: 'USD' },
                strengths: ['Free', 'Code-specialized', 'Private'],
                weaknesses: ['Requires local GPU', 'Limited context'],
                recommendedTasks: ['code_generation', 'debugging', 'code_explanation']
            },
            {
                id: 'deepseek-coder',
                provider: 'ollama',
                name: 'deepseek-coder:33b',
                displayName: 'DeepSeek Coder 33B',
                capabilities: {
                    maxContext: 16384,
                    outputTokenLimit: 4096,
                    supportsVision: false,
                    supportsFunctionCalling: false,
                    supportsStreaming: true,
                    supportsJson: true
                },
                performance: {
                    averageLatency: 1500,
                    tokensPerSecond: 60,
                    reliability: 0.95
                },
                cost: { input: 0, output: 0, currency: 'USD' },
                strengths: ['Excellent coding', 'Free', 'Fast for local'],
                weaknesses: ['Limited context'],
                recommendedTasks: ['code_generation', 'code_review', 'debugging']
            }
        ];

        for (const config of modelConfigs) {
            this.models.set(config.id, config);
            this.metrics.set(config.id, this.initializeMetrics(config.id));
        }
    }

    private initializeMetrics(modelId: string): ModelPerformanceMetrics {
        return {
            modelId,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageLatency: 0,
            p95Latency: 0,
            totalTokensProcessed: 0,
            totalCost: 0,
            lastUsed: new Date(0),
            errorRate: 0,
            taskTypePerformance: new Map()
        };
    }

    private initializeFallbackChains(): void {
        // Define fallback chains for each model
        this.fallbackChains.set('gpt-4o', ['claude-3-5-sonnet', 'gemini-1-5-pro', 'gpt-4o-mini']);
        this.fallbackChains.set('claude-3-5-sonnet', ['gpt-4o', 'gemini-1-5-pro', 'claude-3-5-haiku']);
        this.fallbackChains.set('gpt-4o-mini', ['claude-3-5-haiku', 'gemini-2-flash', 'llama3-70b']);
        this.fallbackChains.set('o1', ['claude-3-5-sonnet', 'gpt-4o', 'gemini-1-5-pro']);
        this.fallbackChains.set('gemini-2-flash', ['gpt-4o-mini', 'claude-3-5-haiku', 'llama3-70b']);
    }

    // ==================== ROUTING LOGIC ====================

    /**
     * Route a request to the best model
     */
    public route(request: RoutingRequest): RoutingDecision {
        const candidates = this.getCandidates(request);
        const scored = this.scoreModels(candidates, request);

        if (scored.length === 0) {
            throw new Error('No suitable models available for this request');
        }

        const selected = scored[0].model;
        const fallbackChain = this.getFallbackChain(selected.id);

        const decision: RoutingDecision = {
            selectedModel: selected,
            reasoning: this.generateReasoning(selected, request, scored[0].score),
            alternatives: scored.slice(1, 4).map(s => ({
                model: s.model,
                score: s.score,
                reason: s.reason
            })),
            estimatedCost: this.estimateCost(selected, request),
            estimatedLatency: selected.performance.averageLatency,
            fallbackChain
        };

        this.emit('route', decision);
        return decision;
    }

    private getCandidates(request: RoutingRequest): ModelConfig[] {
        return Array.from(this.models.values()).filter(model => {
            // Check provider constraints
            if (request.constraints?.preferredProviders?.length) {
                if (!request.constraints.preferredProviders.includes(model.provider)) {
                    return false;
                }
            }
            if (request.constraints?.excludeProviders?.includes(model.provider)) {
                return false;
            }

            // Check context size
            if (request.inputTokens > model.capabilities.maxContext) {
                return false;
            }

            // Check latency constraint
            if (request.constraints?.maxLatency && model.performance.averageLatency > request.constraints.maxLatency) {
                return false;
            }

            // Check required capabilities
            if (request.constraints?.requiredCapabilities) {
                for (const cap of request.constraints.requiredCapabilities) {
                    if (cap === 'vision' && !model.capabilities.supportsVision) return false;
                    if (cap === 'function_calling' && !model.capabilities.supportsFunctionCalling) return false;
                    if (cap === 'streaming' && !model.capabilities.supportsStreaming) return false;
                }
            }

            return true;
        });
    }

    private scoreModels(candidates: ModelConfig[], request: RoutingRequest): { model: ModelConfig; score: number; reason: string }[] {
        const scored = candidates.map(model => {
            let score = 50; // Base score
            const reasons: string[] = [];

            // Task type match
            if (model.recommendedTasks.includes(request.taskType)) {
                score += 20;
                reasons.push(`Recommended for ${request.taskType}`);
            }

            // Priority-based scoring
            switch (request.priority) {
                case 'cost':
                    const costScore = 30 - (model.cost.input + model.cost.output) / 2;
                    score += Math.max(0, costScore);
                    if (model.cost.input === 0) {
                        score += 30;
                        reasons.push('Free (local model)');
                    }
                    break;

                case 'speed':
                    const speedScore = 30 - (model.performance.averageLatency / 1000);
                    score += Math.max(0, speedScore);
                    if (model.performance.averageLatency < 1000) {
                        reasons.push('Very fast');
                    }
                    break;

                case 'quality':
                    // Premium models get bonus
                    if (['gpt-4o', 'claude-3-5-sonnet', 'o1', 'gemini-1-5-pro'].includes(model.id)) {
                        score += 25;
                        reasons.push('Premium quality');
                    }
                    break;

                case 'balanced':
                    // Balance all factors
                    score += (100 - model.cost.input * 5) / 10;
                    score += (5000 - model.performance.averageLatency) / 500;
                    score += model.performance.reliability * 10;
                    break;
            }

            // Reliability bonus
            score += model.performance.reliability * 10;

            // Historical performance adjustment
            const metrics = this.metrics.get(model.id);
            if (metrics && metrics.totalRequests > 10) {
                const successRate = metrics.successfulRequests / metrics.totalRequests;
                score += (successRate - 0.9) * 20; // Adjust based on actual success rate
            }

            // Context size bonus for long inputs
            if (request.inputTokens > 30000) {
                const contextRatio = model.capabilities.maxContext / request.inputTokens;
                score += Math.min(10, contextRatio * 2);
            }

            return {
                model,
                score,
                reason: reasons.join('; ') || 'General purpose match'
            };
        });

        return scored.sort((a, b) => b.score - a.score);
    }

    private generateReasoning(model: ModelConfig, request: RoutingRequest, score: number): string {
        const reasons: string[] = [];

        reasons.push(`Selected ${model.displayName} (score: ${score.toFixed(1)})`);

        if (model.recommendedTasks.includes(request.taskType)) {
            reasons.push(`optimized for ${request.taskType}`);
        }

        switch (request.priority) {
            case 'cost':
                reasons.push(`cost-optimized at $${(model.cost.input + model.cost.output).toFixed(2)}/M tokens`);
                break;
            case 'speed':
                reasons.push(`fast with ~${model.performance.averageLatency}ms latency`);
                break;
            case 'quality':
                reasons.push(`high quality with ${(model.performance.reliability * 100).toFixed(1)}% reliability`);
                break;
        }

        return reasons.join(', ');
    }

    private estimateCost(model: ModelConfig, request: RoutingRequest): number {
        const inputCost = (request.inputTokens / 1000000) * model.cost.input;
        const outputCost = ((request.expectedOutputTokens || 1000) / 1000000) * model.cost.output;
        return inputCost + outputCost;
    }

    private getFallbackChain(modelId: string): ModelConfig[] {
        const chainIds = this.fallbackChains.get(modelId) || [];
        return chainIds
            .map(id => this.models.get(id))
            .filter(Boolean) as ModelConfig[];
    }

    // ==================== METRICS TRACKING ====================

    /**
     * Record a completed request
     */
    public recordRequest(
        modelId: string,
        success: boolean,
        latency: number,
        inputTokens: number,
        outputTokens: number,
        taskType: TaskType
    ): void {
        const metrics = this.metrics.get(modelId);
        if (!metrics) return;

        metrics.totalRequests++;
        if (success) {
            metrics.successfulRequests++;
        } else {
            metrics.failedRequests++;
        }

        // Update average latency
        metrics.averageLatency = (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests;

        metrics.totalTokensProcessed += inputTokens + outputTokens;
        metrics.lastUsed = new Date();
        metrics.errorRate = metrics.failedRequests / metrics.totalRequests;

        // Track by task type
        const taskPerf = metrics.taskTypePerformance.get(taskType) || { success: 0, latency: 0 };
        if (success) taskPerf.success++;
        taskPerf.latency = (taskPerf.latency + latency) / 2;
        metrics.taskTypePerformance.set(taskType, taskPerf);

        // Calculate cost
        const model = this.models.get(modelId);
        if (model) {
            const cost = (inputTokens / 1000000) * model.cost.input + (outputTokens / 1000000) * model.cost.output;
            metrics.totalCost += cost;
        }

        this.emit('metrics_updated', { modelId, metrics });
    }

    // ==================== COST OPTIMIZATION ====================

    /**
     * Get cost optimization recommendations
     */
    public getCostOptimizationReport(): {
        totalCost: number;
        costByModel: { modelId: string; cost: number; percentage: number }[];
        recommendations: string[];
        potentialSavings: number;
    } {
        let totalCost = 0;
        const costByModel: { modelId: string; cost: number; percentage: number }[] = [];

        for (const [modelId, metrics] of this.metrics) {
            totalCost += metrics.totalCost;
            costByModel.push({
                modelId,
                cost: metrics.totalCost,
                percentage: 0
            });
        }

        // Calculate percentages
        for (const entry of costByModel) {
            entry.percentage = totalCost > 0 ? (entry.cost / totalCost) * 100 : 0;
        }

        costByModel.sort((a, b) => b.cost - a.cost);

        const recommendations: string[] = [];
        let potentialSavings = 0;

        // Analyze for optimization opportunities
        for (const [modelId, metrics] of this.metrics) {
            const model = this.models.get(modelId);
            if (!model) continue;

            // Suggest cheaper alternatives for simple tasks
            if (model.cost.input > 2 && metrics.totalRequests > 100) {
                const chatPerf = metrics.taskTypePerformance.get('chat');
                if (chatPerf && chatPerf.success > 50) {
                    recommendations.push(
                        `Consider using a cheaper model for chat tasks (currently using ${model.displayName})`
                    );
                    potentialSavings += metrics.totalCost * 0.3;
                }
            }

            // Suggest local models if using cloud heavily
            if (model.provider !== 'ollama' && metrics.totalRequests > 500) {
                recommendations.push(
                    `High usage of ${model.displayName} (${metrics.totalRequests} requests). Consider local models for cost savings.`
                );
                potentialSavings += metrics.totalCost * 0.8;
            }
        }

        return {
            totalCost,
            costByModel,
            recommendations,
            potentialSavings
        };
    }

    // ==================== PUBLIC API ====================

    public getModels(): ModelConfig[] {
        return Array.from(this.models.values());
    }

    public getModel(id: string): ModelConfig | undefined {
        return this.models.get(id);
    }

    public getMetrics(modelId: string): ModelPerformanceMetrics | undefined {
        return this.metrics.get(modelId);
    }

    public getAllMetrics(): ModelPerformanceMetrics[] {
        return Array.from(this.metrics.values());
    }

    /**
     * Recommend the best model for a specific task
     */
    public recommendForTask(taskType: TaskType): ModelConfig {
        const request: RoutingRequest = {
            taskType,
            inputTokens: 5000,
            priority: 'balanced',
            constraints: {}
        };

        const decision = this.route(request);
        return decision.selectedModel;
    }
}

export const intelligentModelRouter = IntelligentModelRouter.getInstance();
export default intelligentModelRouter;
