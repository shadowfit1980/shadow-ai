/**
 * Mixture-of-Agents Orchestrator
 * 
 * Dynamic multi-model routing and consensus-based response
 * aggregation inspired by Genspark's architecture.
 * 
 * Features:
 * - Parallel query execution across multiple models
 * - Task-based model specialization routing
 * - Consensus aggregation for improved accuracy
 * - Model performance tracking and adaptive selection
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ModelSpecialization =
    | 'code'       // Code generation, debugging, refactoring
    | 'reasoning'  // Logic, math, problem-solving
    | 'creative'   // Writing, storytelling, brainstorming
    | 'analysis'   // Data analysis, research, summarization
    | 'vision'     // Image understanding, visual tasks
    | 'general';   // General purpose

export interface AgentModel {
    id: string;
    provider: 'openai' | 'anthropic' | 'google' | 'ollama' | 'groq' | 'mistral';
    model: string;
    specializations: ModelSpecialization[];
    maxTokens: number;
    costPer1kTokens: number;
    latencyMs: number;
    successRate: number;
    enabled: boolean;
}

export interface TaskClassification {
    type: ModelSpecialization;
    confidence: number;
    complexity: 'simple' | 'moderate' | 'complex';
    requiresMultiModel: boolean;
}

export interface ModelResponse {
    modelId: string;
    content: string;
    tokensUsed: number;
    latencyMs: number;
    confidence: number;
    error?: string;
}

export interface ConsensusResult {
    finalResponse: string;
    confidence: number;
    participatingModels: string[];
    consensusMethod: 'single' | 'majority' | 'weighted' | 'synthesis';
    individualResponses: ModelResponse[];
}

export interface OrchestratorConfig {
    enableParallelQueries: boolean;
    maxParallelModels: number;
    consensusThreshold: number;
    timeoutMs: number;
    costOptimization: boolean;
    qualityPriority: 'speed' | 'quality' | 'balanced';
}

// ============================================================================
// MIXTURE OF AGENTS ORCHESTRATOR
// ============================================================================

export class MixtureOfAgentsOrchestrator extends EventEmitter {
    private static instance: MixtureOfAgentsOrchestrator;
    private models: Map<string, AgentModel> = new Map();
    private performanceHistory: Map<string, number[]> = new Map();
    private config: OrchestratorConfig;

    private constructor() {
        super();
        this.config = {
            enableParallelQueries: true,
            maxParallelModels: 3,
            consensusThreshold: 0.7,
            timeoutMs: 30000,
            costOptimization: true,
            qualityPriority: 'balanced',
        };
        this.initializeDefaultModels();
    }

    static getInstance(): MixtureOfAgentsOrchestrator {
        if (!MixtureOfAgentsOrchestrator.instance) {
            MixtureOfAgentsOrchestrator.instance = new MixtureOfAgentsOrchestrator();
        }
        return MixtureOfAgentsOrchestrator.instance;
    }

    // ========================================================================
    // MODEL MANAGEMENT
    // ========================================================================

    private initializeDefaultModels(): void {
        const defaultModels: AgentModel[] = [
            {
                id: 'gpt-4o',
                provider: 'openai',
                model: 'gpt-4o',
                specializations: ['code', 'reasoning', 'analysis', 'general'],
                maxTokens: 128000,
                costPer1kTokens: 0.005,
                latencyMs: 2000,
                successRate: 0.95,
                enabled: true,
            },
            {
                id: 'claude-3-5-sonnet',
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
                specializations: ['code', 'reasoning', 'creative', 'analysis'],
                maxTokens: 200000,
                costPer1kTokens: 0.003,
                latencyMs: 1800,
                successRate: 0.96,
                enabled: true,
            },
            {
                id: 'gemini-2.0-flash',
                provider: 'google',
                model: 'gemini-2.0-flash-exp',
                specializations: ['code', 'reasoning', 'vision', 'general'],
                maxTokens: 1000000,
                costPer1kTokens: 0.00,
                latencyMs: 1500,
                successRate: 0.94,
                enabled: true,
            },
            {
                id: 'gemini-2.5-pro',
                provider: 'google',
                model: 'gemini-2.5-pro-preview-06-05',
                specializations: ['code', 'reasoning', 'analysis', 'creative'],
                maxTokens: 1000000,
                costPer1kTokens: 0.00,
                latencyMs: 3000,
                successRate: 0.97,
                enabled: true,
            },
            {
                id: 'deepseek-coder',
                provider: 'ollama',
                model: 'deepseek-coder:33b',
                specializations: ['code'],
                maxTokens: 16000,
                costPer1kTokens: 0.0,
                latencyMs: 5000,
                successRate: 0.88,
                enabled: false,
            },
            {
                id: 'llama-3.3-70b',
                provider: 'groq',
                model: 'llama-3.3-70b-versatile',
                specializations: ['general', 'reasoning', 'creative'],
                maxTokens: 128000,
                costPer1kTokens: 0.00059,
                latencyMs: 500,
                successRate: 0.90,
                enabled: true,
            },
            {
                id: 'mistral-large',
                provider: 'mistral',
                model: 'mistral-large-latest',
                specializations: ['code', 'reasoning', 'general'],
                maxTokens: 128000,
                costPer1kTokens: 0.002,
                latencyMs: 1200,
                successRate: 0.92,
                enabled: true,
            },
        ];

        defaultModels.forEach(model => this.models.set(model.id, model));
    }

    registerModel(model: AgentModel): void {
        this.models.set(model.id, model);
        this.emit('modelRegistered', model);
    }

    enableModel(modelId: string): void {
        const model = this.models.get(modelId);
        if (model) {
            model.enabled = true;
            this.emit('modelEnabled', modelId);
        }
    }

    disableModel(modelId: string): void {
        const model = this.models.get(modelId);
        if (model) {
            model.enabled = false;
            this.emit('modelDisabled', modelId);
        }
    }

    getEnabledModels(): AgentModel[] {
        return Array.from(this.models.values()).filter(m => m.enabled);
    }

    // ========================================================================
    // TASK CLASSIFICATION
    // ========================================================================

    classifyTask(prompt: string): TaskClassification {
        const lowerPrompt = prompt.toLowerCase();

        // Code-related keywords
        const codeKeywords = ['code', 'function', 'implement', 'debug', 'fix', 'refactor',
            'typescript', 'javascript', 'python', 'api', 'class', 'method', 'bug'];

        // Reasoning keywords
        const reasoningKeywords = ['calculate', 'solve', 'prove', 'logic', 'math',
            'algorithm', 'optimize', 'analyze'];

        // Creative keywords
        const creativeKeywords = ['write', 'story', 'creative', 'brainstorm', 'idea',
            'design', 'suggest', 'imagine'];

        // Analysis keywords
        const analysisKeywords = ['analyze', 'research', 'compare', 'summarize', 'report',
            'data', 'insights', 'trends'];

        // Vision keywords
        const visionKeywords = ['image', 'picture', 'screenshot', 'visual', 'diagram'];

        // Score each type
        const scores: Record<ModelSpecialization, number> = {
            code: this.countKeywords(lowerPrompt, codeKeywords),
            reasoning: this.countKeywords(lowerPrompt, reasoningKeywords),
            creative: this.countKeywords(lowerPrompt, creativeKeywords),
            analysis: this.countKeywords(lowerPrompt, analysisKeywords),
            vision: this.countKeywords(lowerPrompt, visionKeywords),
            general: 1, // Base score
        };

        // Find highest scoring type
        const maxScore = Math.max(...Object.values(scores));
        const type = (Object.entries(scores).find(([, s]) => s === maxScore)?.[0] || 'general') as ModelSpecialization;

        // Determine complexity
        const wordCount = prompt.split(/\s+/).length;
        const complexity = wordCount < 50 ? 'simple' : wordCount < 200 ? 'moderate' : 'complex';

        // Multi-model for complex tasks or ambiguous classification
        const requiresMultiModel = complexity === 'complex' || maxScore < 2;

        return {
            type,
            confidence: Math.min(maxScore / 5, 1),
            complexity,
            requiresMultiModel,
        };
    }

    private countKeywords(text: string, keywords: string[]): number {
        return keywords.reduce((count, kw) => count + (text.includes(kw) ? 1 : 0), 0);
    }

    // ========================================================================
    // MODEL SELECTION
    // ========================================================================

    selectModels(classification: TaskClassification): AgentModel[] {
        const enabledModels = this.getEnabledModels();

        // Filter by specialization
        let candidates = enabledModels.filter(m =>
            m.specializations.includes(classification.type) ||
            m.specializations.includes('general')
        );

        // Sort by quality priority
        if (this.config.qualityPriority === 'speed') {
            candidates.sort((a, b) => a.latencyMs - b.latencyMs);
        } else if (this.config.qualityPriority === 'quality') {
            candidates.sort((a, b) => b.successRate - a.successRate);
        } else {
            // Balanced: weighted score
            candidates.sort((a, b) => {
                const scoreA = a.successRate * 100 - a.latencyMs / 100;
                const scoreB = b.successRate * 100 - b.latencyMs / 100;
                return scoreB - scoreA;
            });
        }

        // Cost optimization
        if (this.config.costOptimization && classification.complexity === 'simple') {
            candidates.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);
        }

        // Return top N models based on config
        const count = classification.requiresMultiModel ?
            Math.min(this.config.maxParallelModels, candidates.length) : 1;

        return candidates.slice(0, count);
    }

    // ========================================================================
    // QUERY EXECUTION
    // ========================================================================

    async query(prompt: string, options?: {
        forceModels?: string[];
        systemPrompt?: string;
        temperature?: number;
    }): Promise<ConsensusResult> {
        const startTime = Date.now();

        // Classify the task
        const classification = this.classifyTask(prompt);
        this.emit('taskClassified', classification);

        // Select models
        const selectedModels = options?.forceModels
            ? options.forceModels.map(id => this.models.get(id)).filter(Boolean) as AgentModel[]
            : this.selectModels(classification);

        if (selectedModels.length === 0) {
            throw new Error('No models available for this task');
        }

        this.emit('modelsSelected', selectedModels.map(m => m.id));

        // Execute queries
        let responses: ModelResponse[];

        if (this.config.enableParallelQueries && selectedModels.length > 1) {
            responses = await this.executeParallel(selectedModels, prompt, options);
        } else {
            responses = await this.executeSequential(selectedModels, prompt, options);
        }

        // Build consensus
        const result = this.buildConsensus(responses, classification);

        // Update performance metrics
        this.updatePerformanceMetrics(responses);

        result.individualResponses = responses;

        this.emit('queryComplete', {
            duration: Date.now() - startTime,
            models: selectedModels.map(m => m.id),
            consensusMethod: result.consensusMethod,
        });

        return result;
    }

    private async executeParallel(
        models: AgentModel[],
        prompt: string,
        options?: { systemPrompt?: string; temperature?: number }
    ): Promise<ModelResponse[]> {
        const promises = models.map(model =>
            this.queryModel(model, prompt, options)
                .catch(error => ({
                    modelId: model.id,
                    content: '',
                    tokensUsed: 0,
                    latencyMs: 0,
                    confidence: 0,
                    error: error.message,
                }))
        );

        // Race with timeout
        const timeoutPromise = new Promise<ModelResponse[]>(resolve =>
            setTimeout(() => resolve([]), this.config.timeoutMs)
        );

        const results = await Promise.race([
            Promise.all(promises),
            timeoutPromise,
        ]);

        return results.filter(r => !r.error);
    }

    private async executeSequential(
        models: AgentModel[],
        prompt: string,
        options?: { systemPrompt?: string; temperature?: number }
    ): Promise<ModelResponse[]> {
        const responses: ModelResponse[] = [];

        for (const model of models) {
            try {
                const response = await this.queryModel(model, prompt, options);
                responses.push(response);

                // For sequential, stop at first successful response
                if (!response.error) break;
            } catch (error) {
                // Continue to next model
            }
        }

        return responses;
    }

    private async queryModel(
        model: AgentModel,
        prompt: string,
        options?: { systemPrompt?: string; temperature?: number }
    ): Promise<ModelResponse> {
        const startTime = Date.now();

        // This would integrate with your ModelManager
        // For now, return a placeholder that shows the structure
        this.emit('modelQueryStart', model.id);

        try {
            // Simulated API call - replace with actual ModelManager integration
            // const response = await modelManager.generateWithModel(model.provider, model.model, {
            //     prompt,
            //     systemPrompt: options?.systemPrompt,
            //     temperature: options?.temperature,
            // });

            const latencyMs = Date.now() - startTime;

            return {
                modelId: model.id,
                content: `[Response from ${model.id}]`, // Replace with actual response
                tokensUsed: 0,
                latencyMs,
                confidence: model.successRate,
            };
        } catch (error: any) {
            return {
                modelId: model.id,
                content: '',
                tokensUsed: 0,
                latencyMs: Date.now() - startTime,
                confidence: 0,
                error: error.message,
            };
        }
    }

    // ========================================================================
    // CONSENSUS BUILDING
    // ========================================================================

    private buildConsensus(
        responses: ModelResponse[],
        classification: TaskClassification
    ): ConsensusResult {
        const validResponses = responses.filter(r => !r.error && r.content);

        if (validResponses.length === 0) {
            throw new Error('No valid responses from any model');
        }

        if (validResponses.length === 1) {
            return {
                finalResponse: validResponses[0].content,
                confidence: validResponses[0].confidence,
                participatingModels: [validResponses[0].modelId],
                consensusMethod: 'single',
                individualResponses: responses,
            };
        }

        // For complex tasks, synthesize responses
        if (classification.complexity === 'complex') {
            return this.synthesizeResponses(validResponses);
        }

        // For simpler tasks, use weighted voting
        return this.weightedConsensus(validResponses);
    }

    private synthesizeResponses(responses: ModelResponse[]): ConsensusResult {
        // In practice, this would use an LLM to synthesize
        // For now, use the highest confidence response
        const sorted = [...responses].sort((a, b) => b.confidence - a.confidence);
        const best = sorted[0];

        return {
            finalResponse: best.content,
            confidence: this.calculateAverageConfidence(responses),
            participatingModels: responses.map(r => r.modelId),
            consensusMethod: 'synthesis',
            individualResponses: responses,
        };
    }

    private weightedConsensus(responses: ModelResponse[]): ConsensusResult {
        // Weight by model success rate and response confidence
        const weighted = responses.map(r => ({
            ...r,
            weight: r.confidence * (this.models.get(r.modelId)?.successRate || 0.5),
        }));

        const sorted = weighted.sort((a, b) => b.weight - a.weight);
        const best = sorted[0];

        return {
            finalResponse: best.content,
            confidence: best.weight,
            participatingModels: responses.map(r => r.modelId),
            consensusMethod: 'weighted',
            individualResponses: responses,
        };
    }

    private calculateAverageConfidence(responses: ModelResponse[]): number {
        const sum = responses.reduce((acc, r) => acc + r.confidence, 0);
        return sum / responses.length;
    }

    // ========================================================================
    // PERFORMANCE TRACKING
    // ========================================================================

    private updatePerformanceMetrics(responses: ModelResponse[]): void {
        responses.forEach(r => {
            if (!this.performanceHistory.has(r.modelId)) {
                this.performanceHistory.set(r.modelId, []);
            }

            const history = this.performanceHistory.get(r.modelId)!;
            const score = r.error ? 0 : r.confidence;
            history.push(score);

            // Keep last 100 entries
            if (history.length > 100) {
                history.shift();
            }

            // Update model success rate
            const model = this.models.get(r.modelId);
            if (model) {
                const avgScore = history.reduce((a, b) => a + b, 0) / history.length;
                model.successRate = avgScore;
            }
        });
    }

    getModelPerformance(modelId: string): { avgScore: number; recentScores: number[] } | null {
        const history = this.performanceHistory.get(modelId);
        if (!history || history.length === 0) return null;

        return {
            avgScore: history.reduce((a, b) => a + b, 0) / history.length,
            recentScores: history.slice(-10),
        };
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    updateConfig(config: Partial<OrchestratorConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('configUpdated', this.config);
    }

    getConfig(): OrchestratorConfig {
        return { ...this.config };
    }
}

export const mixtureOfAgents = MixtureOfAgentsOrchestrator.getInstance();
