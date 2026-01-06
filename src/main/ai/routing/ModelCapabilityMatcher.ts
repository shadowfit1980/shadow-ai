/**
 * ModelCapabilityMatcher - Task-to-Model Matching
 * 
 * Matches tasks to the most capable models based on
 * task complexity, required capabilities, and model strengths.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface ModelCapabilities {
    modelId: string;
    provider: string;
    strengths: string[];
    weaknesses: string[];
    maxTokens: number;
    costPerToken: number;
    avgLatencyMs: number;
    supportedTasks: string[];
    preferredFor: string[];
}

export interface TaskComplexity {
    level: 'simple' | 'medium' | 'complex' | 'critical';
    score: number;
    requiresReasoning: boolean;
    requiresCodeGen: boolean;
    requiresAnalysis: boolean;
    estimatedTokens: number;
}

export interface ModelMatch {
    modelId: string;
    score: number;
    reasoning: string;
    estimatedCost: number;
    estimatedLatency: number;
}

// ============================================================================
// CAPABILITY DEFINITIONS
// ============================================================================

const MODEL_CAPABILITIES: Record<string, Partial<ModelCapabilities>> = {
    // OpenAI Models
    'gpt-4': {
        provider: 'openai',
        strengths: ['reasoning', 'coding', 'analysis', 'creative'],
        weaknesses: ['cost', 'speed'],
        maxTokens: 128000,
        costPerToken: 0.00003,
        avgLatencyMs: 3000,
        supportedTasks: ['code', 'analysis', 'creative', 'reasoning', 'refactoring'],
        preferredFor: ['complex', 'critical', 'architecture']
    },
    'gpt-4o': {
        provider: 'openai',
        strengths: ['reasoning', 'coding', 'multimodal', 'speed'],
        weaknesses: ['cost'],
        maxTokens: 128000,
        costPerToken: 0.000015,
        avgLatencyMs: 1500,
        supportedTasks: ['code', 'analysis', 'vision', 'creative'],
        preferredFor: ['general', 'multimodal', 'fast-reasoning']
    },
    'gpt-4o-mini': {
        provider: 'openai',
        strengths: ['speed', 'cost', 'general'],
        weaknesses: ['complex-reasoning'],
        maxTokens: 128000,
        costPerToken: 0.0000015,
        avgLatencyMs: 800,
        supportedTasks: ['chat', 'simple-code', 'formatting'],
        preferredFor: ['simple', 'fast', 'cost-sensitive']
    },
    // Anthropic Models
    'claude-3-5-sonnet': {
        provider: 'anthropic',
        strengths: ['reasoning', 'coding', 'analysis', 'safety'],
        weaknesses: ['cost'],
        maxTokens: 200000,
        costPerToken: 0.00003,
        avgLatencyMs: 2500,
        supportedTasks: ['code', 'analysis', 'security', 'documentation'],
        preferredFor: ['security', 'complex', 'large-context']
    },
    'claude-3-haiku': {
        provider: 'anthropic',
        strengths: ['speed', 'cost', 'general'],
        weaknesses: ['complex-reasoning'],
        maxTokens: 200000,
        costPerToken: 0.0000025,
        avgLatencyMs: 500,
        supportedTasks: ['chat', 'simple-code', 'summarization'],
        preferredFor: ['simple', 'fast']
    },
    // Google Models
    'gemini-2.0-flash': {
        provider: 'google',
        strengths: ['speed', 'multimodal', 'reasoning'],
        weaknesses: [],
        maxTokens: 1000000,
        costPerToken: 0.00001,
        avgLatencyMs: 1000,
        supportedTasks: ['code', 'analysis', 'vision', 'reasoning'],
        preferredFor: ['large-context', 'multimodal', 'general']
    },
    // Mistral Models
    'mistral-large': {
        provider: 'mistral',
        strengths: ['coding', 'multilingual', 'cost'],
        weaknesses: ['complex-reasoning'],
        maxTokens: 128000,
        costPerToken: 0.00002,
        avgLatencyMs: 2000,
        supportedTasks: ['code', 'translation', 'chat'],
        preferredFor: ['coding', 'multilingual']
    }
};

// Task complexity indicators
const COMPLEXITY_INDICATORS = {
    simple: ['format', 'convert', 'list', 'rename', 'move', 'copy', 'explain'],
    medium: ['analyze', 'compare', 'refactor', 'optimize', 'summarize', 'review'],
    complex: ['architect', 'debug', 'design', 'implement', 'integrate', 'migrate'],
    critical: ['security', 'deploy', 'production', 'database', 'infrastructure', 'rollback']
};

// ============================================================================
// MODEL CAPABILITY MATCHER
// ============================================================================

export class ModelCapabilityMatcher extends EventEmitter {
    private static instance: ModelCapabilityMatcher;
    private modelManager: ModelManager;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): ModelCapabilityMatcher {
        if (!ModelCapabilityMatcher.instance) {
            ModelCapabilityMatcher.instance = new ModelCapabilityMatcher();
        }
        return ModelCapabilityMatcher.instance;
    }

    // ========================================================================
    // TASK ANALYSIS
    // ========================================================================

    /**
     * Analyze task complexity
     */
    analyzeTaskComplexity(description: string): TaskComplexity {
        const descLower = description.toLowerCase();

        let level: TaskComplexity['level'] = 'simple';
        let score = 0;

        // Check for complexity indicators
        for (const [complexityLevel, keywords] of Object.entries(COMPLEXITY_INDICATORS)) {
            for (const keyword of keywords) {
                if (descLower.includes(keyword)) {
                    const levelScores = { simple: 1, medium: 2, complex: 3, critical: 4 };
                    const keywordScore = levelScores[complexityLevel as keyof typeof levelScores];
                    if (keywordScore > score) {
                        score = keywordScore;
                        level = complexityLevel as TaskComplexity['level'];
                    }
                }
            }
        }

        // Determine required capabilities
        const requiresReasoning = /why|how|analyze|debug|design|architect/i.test(description);
        const requiresCodeGen = /create|implement|write|generate|build|code/i.test(description);
        const requiresAnalysis = /analyze|review|check|find|detect|scan/i.test(description);

        // Estimate tokens based on complexity
        const tokenEstimates = { simple: 1000, medium: 4000, complex: 10000, critical: 20000 };

        return {
            level,
            score: score / 4, // Normalize to 0-1
            requiresReasoning,
            requiresCodeGen,
            requiresAnalysis,
            estimatedTokens: tokenEstimates[level]
        };
    }

    // ========================================================================
    // MODEL MATCHING
    // ========================================================================

    /**
     * Get capabilities for a model
     */
    getCapabilities(modelId: string): ModelCapabilities | undefined {
        const baseCapabilities = MODEL_CAPABILITIES[modelId];
        if (!baseCapabilities) return undefined;

        return {
            modelId,
            provider: baseCapabilities.provider || 'unknown',
            strengths: baseCapabilities.strengths || [],
            weaknesses: baseCapabilities.weaknesses || [],
            maxTokens: baseCapabilities.maxTokens || 8000,
            costPerToken: baseCapabilities.costPerToken || 0.00001,
            avgLatencyMs: baseCapabilities.avgLatencyMs || 2000,
            supportedTasks: baseCapabilities.supportedTasks || [],
            preferredFor: baseCapabilities.preferredFor || []
        };
    }

    /**
     * Get all known model capabilities
     */
    getAllCapabilities(): ModelCapabilities[] {
        return Object.keys(MODEL_CAPABILITIES).map(id => this.getCapabilities(id)!);
    }

    /**
     * Match a task to the best models
     */
    matchTaskToModel(
        taskDescription: string,
        requiredCapabilities: string[] = []
    ): ModelMatch[] {
        const complexity = this.analyzeTaskComplexity(taskDescription);
        const matches: ModelMatch[] = [];

        for (const [modelId, capabilities] of Object.entries(MODEL_CAPABILITIES)) {
            const score = this.calculateMatchScore(
                modelId,
                complexity,
                requiredCapabilities,
                capabilities
            );

            if (score > 0.3) { // Only include decent matches
                matches.push({
                    modelId,
                    score,
                    reasoning: this.generateMatchReasoning(modelId, complexity, score),
                    estimatedCost: this.estimateCost(capabilities, complexity.estimatedTokens),
                    estimatedLatency: capabilities.avgLatencyMs || 2000
                });
            }
        }

        // Sort by score descending
        matches.sort((a, b) => b.score - a.score);

        this.emit('task:matched', { taskDescription, complexity, matches: matches.slice(0, 3) });

        return matches;
    }

    /**
     * Get the optimal model for a task
     */
    getOptimalModel(taskDescription: string, constraints?: {
        maxCost?: number;
        maxLatency?: number;
        preferredProvider?: string;
    }): ModelMatch | null {
        let matches = this.matchTaskToModel(taskDescription);

        // Apply constraints
        if (constraints) {
            if (constraints.maxCost) {
                matches = matches.filter(m => m.estimatedCost <= constraints.maxCost!);
            }
            if (constraints.maxLatency) {
                matches = matches.filter(m => m.estimatedLatency <= constraints.maxLatency!);
            }
            if (constraints.preferredProvider) {
                const preferred = matches.filter(m =>
                    MODEL_CAPABILITIES[m.modelId]?.provider === constraints.preferredProvider
                );
                if (preferred.length > 0) {
                    matches = preferred;
                }
            }
        }

        return matches[0] || null;
    }

    // ========================================================================
    // SCORING
    // ========================================================================

    private calculateMatchScore(
        modelId: string,
        complexity: TaskComplexity,
        requiredCapabilities: string[],
        capabilities: Partial<ModelCapabilities>
    ): number {
        let score = 0.5; // Base score

        // Check if complexity level matches preferred usage
        const preferredFor = capabilities.preferredFor || [];
        if (preferredFor.includes(complexity.level)) {
            score += 0.2;
        }

        // Check strengths alignment
        const strengths = capabilities.strengths || [];
        if (complexity.requiresReasoning && strengths.includes('reasoning')) {
            score += 0.15;
        }
        if (complexity.requiresCodeGen && strengths.includes('coding')) {
            score += 0.15;
        }
        if (complexity.requiresAnalysis && strengths.includes('analysis')) {
            score += 0.1;
        }

        // Check required capabilities
        const supportedTasks = capabilities.supportedTasks || [];
        for (const req of requiredCapabilities) {
            if (supportedTasks.includes(req) || strengths.includes(req)) {
                score += 0.1;
            }
        }

        // Penalize for weaknesses
        const weaknesses = capabilities.weaknesses || [];
        if (complexity.level === 'complex' && weaknesses.includes('complex-reasoning')) {
            score -= 0.2;
        }

        // Cost consideration for simple tasks
        if (complexity.level === 'simple' && (capabilities.costPerToken || 0) > 0.00002) {
            score -= 0.1;
        }

        return Math.max(0, Math.min(1, score));
    }

    private generateMatchReasoning(
        modelId: string,
        complexity: TaskComplexity,
        score: number
    ): string {
        const capabilities = MODEL_CAPABILITIES[modelId];
        if (!capabilities) return 'Unknown model';

        const parts: string[] = [];

        if (score > 0.8) {
            parts.push('Excellent match');
        } else if (score > 0.6) {
            parts.push('Good match');
        } else {
            parts.push('Acceptable match');
        }

        if (capabilities.preferredFor?.includes(complexity.level)) {
            parts.push(`optimized for ${complexity.level} tasks`);
        }

        if (capabilities.strengths?.length) {
            parts.push(`strong in ${capabilities.strengths.slice(0, 2).join(', ')}`);
        }

        return parts.join(', ');
    }

    private estimateCost(
        capabilities: Partial<ModelCapabilities>,
        estimatedTokens: number
    ): number {
        const costPerToken = capabilities.costPerToken || 0.00001;
        return costPerToken * estimatedTokens;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Get a quick complexity assessment
     */
    quickComplexityCheck(description: string): 'simple' | 'medium' | 'complex' | 'critical' {
        return this.analyzeTaskComplexity(description).level;
    }

    /**
     * Get statistics about available models
     */
    getStats(): {
        totalModels: number;
        byProvider: Record<string, number>;
        avgCostPerToken: number;
    } {
        const models = Object.values(MODEL_CAPABILITIES);
        const byProvider: Record<string, number> = {};
        let totalCost = 0;

        for (const model of models) {
            const provider = model.provider || 'unknown';
            byProvider[provider] = (byProvider[provider] || 0) + 1;
            totalCost += model.costPerToken || 0;
        }

        return {
            totalModels: models.length,
            byProvider,
            avgCostPerToken: totalCost / models.length
        };
    }
}

// Export singleton
export const modelCapabilityMatcher = ModelCapabilityMatcher.getInstance();
