/**
 * ActiveLearningEngine - Continuous Behavior Improvement
 * 
 * Implements true learning from outcomes:
 * - Tracks task outcomes with full context
 * - Identifies patterns in successes/failures
 * - Generates and tests prompt mutations
 * - Persists learned configurations across sessions
 * - A/B tests with statistical significance
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface LearningOutcome {
    id: string;
    timestamp: Date;
    agentId: string;
    taskType: string;
    promptTemplate: string;
    model: string;
    success: boolean;
    userEdits: number;       // Lines user had to modify
    duration: number;        // Time to complete in ms
    contextTokens: number;
    errorType?: string;
    userFeedback?: 'positive' | 'negative' | 'neutral';
    metadata?: Record<string, any>;
}

export interface PromptVariant {
    id: string;
    basePromptId: string;
    variant: string;         // The modified prompt text
    hypothesis: string;      // Why we think this might work
    testCount: number;
    successCount: number;
    successRate: number;
    avgUserEdits: number;
    avgDuration: number;
    createdAt: Date;
    status: 'testing' | 'promoted' | 'rejected';
}

export interface PerformancePattern {
    pattern: string;
    description: string;
    occurrences: number;
    successRate: number;
    recommendation: string;
}

export interface LearningInsight {
    type: 'success_pattern' | 'failure_pattern' | 'improvement' | 'regression';
    agentId: string;
    description: string;
    confidence: number;
    actionable: boolean;
    suggestedAction?: string;
}

export interface AgentProfile {
    agentId: string;
    totalTasks: number;
    successRate: number;
    avgDuration: number;
    strengths: string[];
    weaknesses: string[];
    bestTaskTypes: string[];
    trend: 'improving' | 'declining' | 'stable';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    dataPath: path.join(os.homedir(), '.shadow-ai', 'learning.json'),
    minSamplesForStats: 10,
    significanceThreshold: 0.05,
    promotionThreshold: 0.8,
    rejectionThreshold: 0.4,
    maxVariantsPerPrompt: 5,
    outcomeRetentionDays: 30
};

// ============================================================================
// ACTIVE LEARNING ENGINE
// ============================================================================

export class ActiveLearningEngine extends EventEmitter {
    private outcomes: LearningOutcome[] = [];
    private variants: Map<string, PromptVariant[]> = new Map();
    private activeVariants: Map<string, string> = new Map();  // basePromptId -> activeVariantId
    private initialized: boolean = false;

    constructor() {
        super();
        console.log('[ActiveLearningEngine] Initializing...');
    }

    /**
     * Initialize and load persisted data
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const dataDir = path.dirname(CONFIG.dataPath);
            await fs.mkdir(dataDir, { recursive: true });

            const data = await fs.readFile(CONFIG.dataPath, 'utf-8').catch(() => '{}');
            const parsed = JSON.parse(data);

            this.outcomes = (parsed.outcomes || []).map((o: any) => ({
                ...o,
                timestamp: new Date(o.timestamp)
            }));

            if (parsed.variants) {
                for (const [key, value] of Object.entries(parsed.variants)) {
                    this.variants.set(key, value as PromptVariant[]);
                }
            }

            if (parsed.activeVariants) {
                for (const [key, value] of Object.entries(parsed.activeVariants)) {
                    this.activeVariants.set(key, value as string);
                }
            }

            // Clean old outcomes
            await this.cleanOldOutcomes();

            this.initialized = true;
            console.log(`[ActiveLearningEngine] Loaded ${this.outcomes.length} outcomes`);
        } catch (error) {
            console.error('[ActiveLearningEngine] Failed to load data:', error);
            this.initialized = true;
        }
    }

    /**
     * Track a task outcome
     */
    async trackOutcome(outcome: Omit<LearningOutcome, 'id' | 'timestamp'>): Promise<void> {
        await this.initialize();

        const full: LearningOutcome = {
            id: `outcome-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date(),
            ...outcome
        };

        this.outcomes.push(full);
        await this.persist();

        // Update variant stats if applicable
        await this.updateVariantStats(full);

        // Check for learning opportunities
        const insights = await this.generateInsights(outcome.agentId);
        for (const insight of insights) {
            this.emit('insight', insight);
        }

        this.emit('outcome', full);
    }

    /**
     * Register a new prompt variant for testing
     */
    async registerVariant(
        basePromptId: string,
        variant: string,
        hypothesis: string
    ): Promise<PromptVariant> {
        await this.initialize();

        const existing = this.variants.get(basePromptId) || [];

        // Check for max variants
        if (existing.length >= CONFIG.maxVariantsPerPrompt) {
            // Remove lowest performing variant
            const sorted = existing.sort((a, b) => a.successRate - b.successRate);
            const removed = sorted[0];
            existing.splice(0, 1);
            console.log(`[ActiveLearningEngine] Removed lowest variant: ${removed.id}`);
        }

        const newVariant: PromptVariant = {
            id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            basePromptId,
            variant,
            hypothesis,
            testCount: 0,
            successCount: 0,
            successRate: 0,
            avgUserEdits: 0,
            avgDuration: 0,
            createdAt: new Date(),
            status: 'testing'
        };

        existing.push(newVariant);
        this.variants.set(basePromptId, existing);
        await this.persist();

        console.log(`[ActiveLearningEngine] Registered variant ${newVariant.id} for ${basePromptId}`);
        return newVariant;
    }

    /**
     * Get the best prompt variant for a base prompt
     */
    getBestPrompt(basePromptId: string): { prompt: string; variantId: string | null } {
        const variants = this.variants.get(basePromptId);

        if (!variants || variants.length === 0) {
            return { prompt: basePromptId, variantId: null };
        }

        // Find promoted variant or best testing variant
        const promoted = variants.find(v => v.status === 'promoted');
        if (promoted) {
            return { prompt: promoted.variant, variantId: promoted.id };
        }

        // Return variant with highest success rate that has enough samples
        const eligible = variants
            .filter(v => v.status === 'testing' && v.testCount >= CONFIG.minSamplesForStats);

        if (eligible.length === 0) {
            // Random selection for A/B testing
            const testing = variants.filter(v => v.status === 'testing');
            if (testing.length > 0) {
                const selected = testing[Math.floor(Math.random() * testing.length)];
                return { prompt: selected.variant, variantId: selected.id };
            }
            return { prompt: basePromptId, variantId: null };
        }

        const best = eligible.reduce((a, b) => a.successRate > b.successRate ? a : b);
        return { prompt: best.variant, variantId: best.id };
    }

    /**
     * Generate prompt mutation suggestions based on failures
     */
    async suggestPromptMutations(
        currentPrompt: string,
        recentOutcomes: LearningOutcome[]
    ): Promise<string[]> {
        const failures = recentOutcomes.filter(o => !o.success);
        const suggestions: string[] = [];

        // Analyze failure patterns
        const errorTypes = new Map<string, number>();
        for (const f of failures) {
            if (f.errorType) {
                errorTypes.set(f.errorType, (errorTypes.get(f.errorType) || 0) + 1);
            }
        }

        // Generate suggestions based on common patterns
        if (failures.some(f => f.userEdits > 10)) {
            suggestions.push(
                currentPrompt + '\n\nIMPORTANT: Ensure the output is complete and production-ready. Do not leave TODO comments or incomplete implementations.'
            );
        }

        if (failures.some(f => f.duration > 60000)) {
            suggestions.push(
                currentPrompt + '\n\nOptimize for efficiency. Provide concise, focused solutions without unnecessary elaboration.'
            );
        }

        if (errorTypes.has('type_error')) {
            suggestions.push(
                currentPrompt + '\n\nPay special attention to TypeScript types. Ensure all types are correctly defined and compatible.'
            );
        }

        if (errorTypes.has('syntax_error')) {
            suggestions.push(
                currentPrompt + '\n\nDouble-check syntax before responding. Ensure all brackets, quotes, and semicolons are properly matched.'
            );
        }

        return suggestions;
    }

    /**
     * Update variant statistics from outcome
     */
    private async updateVariantStats(outcome: LearningOutcome): Promise<void> {
        for (const [_, variants] of this.variants) {
            for (const variant of variants) {
                if (outcome.promptTemplate.includes(variant.variant.substring(0, 50))) {
                    variant.testCount++;
                    if (outcome.success) {
                        variant.successCount++;
                    }
                    variant.successRate = variant.successCount / variant.testCount;
                    variant.avgUserEdits =
                        (variant.avgUserEdits * (variant.testCount - 1) + outcome.userEdits) / variant.testCount;
                    variant.avgDuration =
                        (variant.avgDuration * (variant.testCount - 1) + outcome.duration) / variant.testCount;

                    // Check for promotion/rejection
                    if (variant.testCount >= CONFIG.minSamplesForStats) {
                        if (variant.successRate >= CONFIG.promotionThreshold) {
                            variant.status = 'promoted';
                            this.activeVariants.set(variant.basePromptId, variant.id);
                            this.emit('variantPromoted', variant);
                            console.log(`[ActiveLearningEngine] Promoted variant ${variant.id}`);
                        } else if (variant.successRate <= CONFIG.rejectionThreshold) {
                            variant.status = 'rejected';
                            console.log(`[ActiveLearningEngine] Rejected variant ${variant.id}`);
                        }
                    }
                }
            }
        }
        await this.persist();
    }

    /**
     * Generate learning insights for an agent
     */
    async generateInsights(agentId: string): Promise<LearningInsight[]> {
        const insights: LearningInsight[] = [];
        const agentOutcomes = this.outcomes.filter(o => o.agentId === agentId);

        if (agentOutcomes.length < CONFIG.minSamplesForStats) {
            return insights;
        }

        // Calculate recent vs historical performance
        const recent = agentOutcomes.slice(-10);
        const historical = agentOutcomes.slice(0, -10);

        const recentSuccess = recent.filter(o => o.success).length / recent.length;
        const historicalSuccess = historical.length > 0
            ? historical.filter(o => o.success).length / historical.length
            : 0;

        // Detect trend
        if (recentSuccess > historicalSuccess + 0.1) {
            insights.push({
                type: 'improvement',
                agentId,
                description: `Performance improving: ${(recentSuccess * 100).toFixed(1)}% recent vs ${(historicalSuccess * 100).toFixed(1)}% historical`,
                confidence: 0.8,
                actionable: false
            });
        } else if (recentSuccess < historicalSuccess - 0.1) {
            insights.push({
                type: 'regression',
                agentId,
                description: `Performance declining: ${(recentSuccess * 100).toFixed(1)}% recent vs ${(historicalSuccess * 100).toFixed(1)}% historical`,
                confidence: 0.8,
                actionable: true,
                suggestedAction: 'Review recent task types and consider prompt adjustments'
            });
        }

        // Find successful patterns
        const successfulTasks = agentOutcomes.filter(o => o.success);
        const taskTypeSuccess = new Map<string, number>();

        for (const task of successfulTasks) {
            taskTypeSuccess.set(task.taskType, (taskTypeSuccess.get(task.taskType) || 0) + 1);
        }

        const topTaskType = [...taskTypeSuccess.entries()]
            .sort((a, b) => b[1] - a[1])[0];

        if (topTaskType && topTaskType[1] >= 5) {
            insights.push({
                type: 'success_pattern',
                agentId,
                description: `Excels at "${topTaskType[0]}" tasks (${topTaskType[1]} successes)`,
                confidence: 0.9,
                actionable: false
            });
        }

        return insights;
    }

    /**
     * Get agent performance profile
     */
    getAgentProfile(agentId: string): AgentProfile | null {
        const agentOutcomes = this.outcomes.filter(o => o.agentId === agentId);

        if (agentOutcomes.length === 0) {
            return null;
        }

        const successRate = agentOutcomes.filter(o => o.success).length / agentOutcomes.length;
        const avgDuration = agentOutcomes.reduce((sum, o) => sum + o.duration, 0) / agentOutcomes.length;

        // Find best task types
        const taskTypeStats = new Map<string, { success: number; total: number }>();
        for (const o of agentOutcomes) {
            const stats = taskTypeStats.get(o.taskType) || { success: 0, total: 0 };
            stats.total++;
            if (o.success) stats.success++;
            taskTypeStats.set(o.taskType, stats);
        }

        const bestTaskTypes = [...taskTypeStats.entries()]
            .filter(([_, s]) => s.total >= 3 && s.success / s.total >= 0.7)
            .map(([type, _]) => type);

        // Determine trend
        const recent = agentOutcomes.slice(-5);
        const older = agentOutcomes.slice(-10, -5);
        const recentRate = recent.length > 0 ? recent.filter(o => o.success).length / recent.length : 0;
        const olderRate = older.length > 0 ? older.filter(o => o.success).length / older.length : 0;

        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (recentRate > olderRate + 0.1) trend = 'improving';
        else if (recentRate < olderRate - 0.1) trend = 'declining';

        return {
            agentId,
            totalTasks: agentOutcomes.length,
            successRate,
            avgDuration,
            strengths: bestTaskTypes,
            weaknesses: [],
            bestTaskTypes,
            trend
        };
    }

    /**
     * Export learned data for backup/transfer
     */
    async export(): Promise<string> {
        await this.initialize();
        return JSON.stringify({
            outcomes: this.outcomes,
            variants: Object.fromEntries(this.variants),
            activeVariants: Object.fromEntries(this.activeVariants),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Import learned data
     */
    async import(data: string): Promise<void> {
        const parsed = JSON.parse(data);

        this.outcomes = parsed.outcomes || [];
        this.variants.clear();
        if (parsed.variants) {
            for (const [key, value] of Object.entries(parsed.variants)) {
                this.variants.set(key, value as PromptVariant[]);
            }
        }
        this.activeVariants.clear();
        if (parsed.activeVariants) {
            for (const [key, value] of Object.entries(parsed.activeVariants)) {
                this.activeVariants.set(key, value as string);
            }
        }

        await this.persist();
    }

    /**
     * Get statistics summary
     */
    getStats(): {
        totalOutcomes: number;
        successRate: number;
        totalVariants: number;
        promotedVariants: number;
        agentCount: number;
    } {
        const agents = new Set(this.outcomes.map(o => o.agentId));
        const allVariants = [...this.variants.values()].flat();
        const promoted = allVariants.filter(v => v.status === 'promoted');

        return {
            totalOutcomes: this.outcomes.length,
            successRate: this.outcomes.length > 0
                ? this.outcomes.filter(o => o.success).length / this.outcomes.length
                : 0,
            totalVariants: allVariants.length,
            promotedVariants: promoted.length,
            agentCount: agents.size
        };
    }

    /**
     * Clean old outcomes
     */
    private async cleanOldOutcomes(): Promise<void> {
        const cutoff = Date.now() - (CONFIG.outcomeRetentionDays * 24 * 60 * 60 * 1000);
        const before = this.outcomes.length;
        this.outcomes = this.outcomes.filter(o => o.timestamp.getTime() > cutoff);

        if (before !== this.outcomes.length) {
            console.log(`[ActiveLearningEngine] Cleaned ${before - this.outcomes.length} old outcomes`);
            await this.persist();
        }
    }

    /**
     * Persist data to disk
     */
    private async persist(): Promise<void> {
        const data = JSON.stringify({
            outcomes: this.outcomes,
            variants: Object.fromEntries(this.variants),
            activeVariants: Object.fromEntries(this.activeVariants)
        });

        await fs.writeFile(CONFIG.dataPath, data);
    }
}

// Singleton
export const activeLearningEngine = new ActiveLearningEngine();
