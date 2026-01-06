/**
 * Collaborative AI Swarm
 * 
 * Multi-model orchestra where different AI models collaborate
 * on complex tasks, each contributing their strengths.
 */

import { EventEmitter } from 'events';

export interface AIModel {
    id: string;
    name: string;
    provider: Provider;
    specialty: ModelSpecialty[];
    costPerToken: number;
    maxTokens: number;
    speed: 'fast' | 'medium' | 'slow';
    enabled: boolean;
}

export type Provider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'mistral' | 'cohere';

export type ModelSpecialty =
    | 'code_generation'
    | 'code_review'
    | 'documentation'
    | 'debugging'
    | 'creative_writing'
    | 'analysis'
    | 'math'
    | 'reasoning'
    | 'fast_response';

export interface SwarmTask {
    id: string;
    type: TaskType;
    input: string;
    context?: any;
    priority: 'low' | 'normal' | 'high' | 'critical';
    status: 'pending' | 'assigned' | 'processing' | 'complete' | 'failed';
    assignedModel?: string;
    result?: SwarmResult;
    createdAt: Date;
    completedAt?: Date;
}

export type TaskType =
    | 'generate'
    | 'review'
    | 'document'
    | 'debug'
    | 'optimize'
    | 'explain'
    | 'translate'
    | 'test';

export interface SwarmResult {
    modelId: string;
    response: string;
    confidence: number;
    tokensUsed: number;
    latencyMs: number;
    alternatives?: { modelId: string; response: string }[];
}

export interface ConsensusResult {
    taskId: string;
    responses: { modelId: string; response: string; weight: number }[];
    consensus: string;
    agreementScore: number;
    disagreements: string[];
}

export interface OrchestratorConfig {
    strategy: 'single' | 'parallel' | 'consensus' | 'cascade';
    maxConcurrent: number;
    timeoutMs: number;
    costLimit: number;
    preferLocal: boolean;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
    strategy: 'single',
    maxConcurrent: 3,
    timeoutMs: 30000,
    costLimit: 1.0,
    preferLocal: true,
};

export class CollaborativeAISwarm extends EventEmitter {
    private static instance: CollaborativeAISwarm;
    private models: Map<string, AIModel> = new Map();
    private tasks: Map<string, SwarmTask> = new Map();
    private config: OrchestratorConfig = DEFAULT_CONFIG;
    private usageStats: Map<string, { tokens: number; cost: number; tasks: number }> = new Map();

    private constructor() {
        super();
        this.initializeModels();
    }

    static getInstance(): CollaborativeAISwarm {
        if (!CollaborativeAISwarm.instance) {
            CollaborativeAISwarm.instance = new CollaborativeAISwarm();
        }
        return CollaborativeAISwarm.instance;
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    private initializeModels(): void {
        const defaultModels: Omit<AIModel, 'id'>[] = [
            {
                name: 'GPT-4',
                provider: 'openai',
                specialty: ['code_generation', 'reasoning', 'analysis'],
                costPerToken: 0.00003,
                maxTokens: 8192,
                speed: 'medium',
                enabled: true,
            },
            {
                name: 'Claude 3.5 Sonnet',
                provider: 'anthropic',
                specialty: ['code_review', 'documentation', 'reasoning'],
                costPerToken: 0.000015,
                maxTokens: 200000,
                speed: 'medium',
                enabled: true,
            },
            {
                name: 'Gemini Pro',
                provider: 'google',
                specialty: ['analysis', 'math', 'code_generation'],
                costPerToken: 0.00001,
                maxTokens: 32000,
                speed: 'fast',
                enabled: true,
            },
            {
                name: 'Mistral Large',
                provider: 'mistral',
                specialty: ['fast_response', 'code_generation'],
                costPerToken: 0.000008,
                maxTokens: 32000,
                speed: 'fast',
                enabled: true,
            },
            {
                name: 'Local Ollama',
                provider: 'ollama',
                specialty: ['fast_response', 'code_generation', 'debugging'],
                costPerToken: 0,
                maxTokens: 4096,
                speed: 'fast',
                enabled: true,
            },
        ];

        for (const model of defaultModels) {
            const id = `model_${model.provider}_${model.name.toLowerCase().replace(/\s+/g, '_')}`;
            this.models.set(id, { ...model, id });
            this.usageStats.set(id, { tokens: 0, cost: 0, tasks: 0 });
        }
    }

    // ========================================================================
    // TASK ORCHESTRATION
    // ========================================================================

    /**
     * Submit a task to the swarm
     */
    async submitTask(type: TaskType, input: string, priority: SwarmTask['priority'] = 'normal'): Promise<SwarmResult> {
        const task: SwarmTask = {
            id: `task_${Date.now()}`,
            type,
            input,
            priority,
            status: 'pending',
            createdAt: new Date(),
        };

        this.tasks.set(task.id, task);
        this.emit('task:submitted', task);

        try {
            const result = await this.orchestrate(task);
            task.status = 'complete';
            task.result = result;
            task.completedAt = new Date();
            return result;
        } catch (error) {
            task.status = 'failed';
            throw error;
        }
    }

    /**
     * Main orchestration logic
     */
    private async orchestrate(task: SwarmTask): Promise<SwarmResult> {
        switch (this.config.strategy) {
            case 'single':
                return this.orchestrateSingle(task);
            case 'parallel':
                return this.orchestrateParallel(task);
            case 'consensus':
                return this.orchestrateConsensus(task);
            case 'cascade':
                return this.orchestrateCascade(task);
            default:
                return this.orchestrateSingle(task);
        }
    }

    /**
     * Single model strategy - pick best model for task
     */
    private async orchestrateSingle(task: SwarmTask): Promise<SwarmResult> {
        const model = this.selectBestModel(task.type);
        if (!model) {
            throw new Error('No suitable model available');
        }

        task.assignedModel = model.id;
        task.status = 'processing';

        return this.executeOnModel(model, task);
    }

    /**
     * Parallel strategy - run on multiple models simultaneously
     */
    private async orchestrateParallel(task: SwarmTask): Promise<SwarmResult> {
        const models = this.selectModelsForTask(task.type, this.config.maxConcurrent);

        const results = await Promise.allSettled(
            models.map(m => this.executeOnModel(m, task))
        );

        const successful = results
            .filter((r): r is PromiseFulfilledResult<SwarmResult> => r.status === 'fulfilled')
            .map(r => r.value);

        if (successful.length === 0) {
            throw new Error('All models failed');
        }

        // Return highest confidence result
        const best = successful.sort((a, b) => b.confidence - a.confidence)[0];
        best.alternatives = successful.slice(1).map(r => ({
            modelId: r.modelId,
            response: r.response,
        }));

        return best;
    }

    /**
     * Consensus strategy - aggregate responses
     */
    private async orchestrateConsensus(task: SwarmTask): Promise<SwarmResult> {
        const models = this.selectModelsForTask(task.type, this.config.maxConcurrent);

        const results = await Promise.allSettled(
            models.map(m => this.executeOnModel(m, task))
        );

        const successful = results
            .filter((r): r is PromiseFulfilledResult<SwarmResult> => r.status === 'fulfilled')
            .map(r => r.value);

        if (successful.length === 0) {
            throw new Error('All models failed');
        }

        // Build consensus
        const consensus = this.buildConsensus(task.id, successful);

        return {
            modelId: 'consensus',
            response: consensus.consensus,
            confidence: consensus.agreementScore,
            tokensUsed: successful.reduce((sum, r) => sum + r.tokensUsed, 0),
            latencyMs: Math.max(...successful.map(r => r.latencyMs)),
        };
    }

    /**
     * Cascade strategy - try models in order until success
     */
    private async orchestrateCascade(task: SwarmTask): Promise<SwarmResult> {
        const models = this.selectModelsForTask(task.type, 5)
            .sort((a, b) => {
                // Sort by cost (prefer cheaper first), then speed
                if (a.costPerToken !== b.costPerToken) {
                    return a.costPerToken - b.costPerToken;
                }
                const speedOrder = { fast: 0, medium: 1, slow: 2 };
                return speedOrder[a.speed] - speedOrder[b.speed];
            });

        for (const model of models) {
            try {
                const result = await this.executeOnModel(model, task);
                if (result.confidence >= 0.7) {
                    return result;
                }
            } catch {
                // Try next model
                continue;
            }
        }

        throw new Error('All cascade attempts failed');
    }

    // ========================================================================
    // MODEL SELECTION
    // ========================================================================

    private selectBestModel(taskType: TaskType): AIModel | undefined {
        const typeToSpecialty: Record<TaskType, ModelSpecialty> = {
            generate: 'code_generation',
            review: 'code_review',
            document: 'documentation',
            debug: 'debugging',
            optimize: 'code_generation',
            explain: 'reasoning',
            translate: 'code_generation',
            test: 'code_generation',
        };

        const specialty = typeToSpecialty[taskType];

        const candidates = Array.from(this.models.values())
            .filter(m => m.enabled && m.specialty.includes(specialty));

        if (candidates.length === 0) {
            return Array.from(this.models.values()).find(m => m.enabled);
        }

        // Prefer local if configured
        if (this.config.preferLocal) {
            const local = candidates.find(m => m.provider === 'ollama');
            if (local) return local;
        }

        // Sort by specialty match strength and cost
        return candidates.sort((a, b) => {
            const aScore = a.specialty.indexOf(specialty);
            const bScore = b.specialty.indexOf(specialty);
            if (aScore !== bScore) return aScore - bScore;
            return a.costPerToken - b.costPerToken;
        })[0];
    }

    private selectModelsForTask(taskType: TaskType, limit: number): AIModel[] {
        const all = Array.from(this.models.values()).filter(m => m.enabled);

        // Diverse selection: different providers
        const byProvider = new Map<Provider, AIModel[]>();
        for (const model of all) {
            const list = byProvider.get(model.provider) || [];
            list.push(model);
            byProvider.set(model.provider, list);
        }

        const selected: AIModel[] = [];
        const providers = Array.from(byProvider.keys());

        let i = 0;
        while (selected.length < limit && i < 10) {
            const provider = providers[i % providers.length];
            const models = byProvider.get(provider) || [];
            const model = models.shift();
            if (model) {
                selected.push(model);
            }
            i++;
        }

        return selected;
    }

    // ========================================================================
    // EXECUTION
    // ========================================================================

    private async executeOnModel(model: AIModel, task: SwarmTask): Promise<SwarmResult> {
        const startTime = Date.now();

        // Simulate model execution (in real implementation, call actual API)
        await new Promise(resolve => setTimeout(resolve, model.speed === 'fast' ? 500 : 1500));

        const tokensUsed = Math.floor(Math.random() * 1000) + 100;
        const cost = tokensUsed * model.costPerToken;

        // Update stats
        const stats = this.usageStats.get(model.id)!;
        stats.tokens += tokensUsed;
        stats.cost += cost;
        stats.tasks++;

        const result: SwarmResult = {
            modelId: model.id,
            response: `[${model.name}] Response for ${task.type}: ${task.input.slice(0, 50)}...`,
            confidence: 0.7 + Math.random() * 0.3,
            tokensUsed,
            latencyMs: Date.now() - startTime,
        };

        this.emit('model:executed', { model: model.id, result });
        return result;
    }

    // ========================================================================
    // CONSENSUS BUILDING
    // ========================================================================

    private buildConsensus(taskId: string, results: SwarmResult[]): ConsensusResult {
        // Weight responses by confidence
        const weighted = results.map(r => ({
            modelId: r.modelId,
            response: r.response,
            weight: r.confidence,
        }));

        // Find most agreed-upon response (simplified - use response similarity in practice)
        const best = weighted.sort((a, b) => b.weight - a.weight)[0];

        return {
            taskId,
            responses: weighted,
            consensus: best.response,
            agreementScore: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
            disagreements: [],
        };
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    setStrategy(strategy: OrchestratorConfig['strategy']): void {
        this.config.strategy = strategy;
        this.emit('config:updated', this.config);
    }

    setConfig(updates: Partial<OrchestratorConfig>): void {
        this.config = { ...this.config, ...updates };
        this.emit('config:updated', this.config);
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getModels(): AIModel[] {
        return Array.from(this.models.values());
    }

    getUsageStats(): { modelId: string; tokens: number; cost: number; tasks: number }[] {
        return Array.from(this.usageStats.entries()).map(([modelId, stats]) => ({
            modelId,
            ...stats,
        }));
    }

    getRecentTasks(limit: number = 20): SwarmTask[] {
        return Array.from(this.tasks.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
}

export const collaborativeAISwarm = CollaborativeAISwarm.getInstance();
