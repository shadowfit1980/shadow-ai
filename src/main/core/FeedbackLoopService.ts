/**
 * 📊 FeedbackLoopService - Self-Improving AI System
 * 
 * Claude's Recommendation: Every user interaction is sent back
 * Model literally becomes smarter from real dev sessions
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// Types
export interface Interaction {
    id: string;
    timestamp: Date;
    type: InteractionType;
    input: string;
    output: string;
    model: string;
    userFeedback?: UserFeedback;
    metrics: InteractionMetrics;
    context: InteractionContext;
}

export type InteractionType =
    | 'code_generation'
    | 'code_review'
    | 'refactoring'
    | 'debugging'
    | 'explanation'
    | 'test_generation'
    | 'documentation'
    | 'conversation';

export interface UserFeedback {
    accepted: boolean;
    editDistance?: number;
    rating?: 1 | 2 | 3 | 4 | 5;
    tags?: string[];
    comment?: string;
}

export interface InteractionMetrics {
    latency: number;
    tokensIn: number;
    tokensOut: number;
    cost: number;
}

export interface InteractionContext {
    language?: string;
    framework?: string;
    projectType?: string;
    filePatterns?: string[];
}

export interface LearningInsight {
    pattern: string;
    frequency: number;
    successRate: number;
    recommendations: string[];
}

export interface AnalyticsReport {
    period: 'day' | 'week' | 'month';
    totalInteractions: number;
    acceptanceRate: number;
    avgRating: number;
    topPatterns: LearningInsight[];
    modelPerformance: Record<string, { success: number; total: number }>;
    improvementAreas: string[];
}

export class FeedbackLoopService extends EventEmitter {
    private static instance: FeedbackLoopService;
    private interactions: Interaction[] = [];
    private dataDir: string;
    private isOptedIn = false;
    private anonymizationEnabled = true;

    private constructor() {
        super();
        this.dataDir = path.join(process.env.HOME || '/tmp', '.shadow-ai', 'feedback');
        this.initialize();
    }

    static getInstance(): FeedbackLoopService {
        if (!FeedbackLoopService.instance) {
            FeedbackLoopService.instance = new FeedbackLoopService();
        }
        return FeedbackLoopService.instance;
    }

    private async initialize(): Promise<void> {
        await fs.mkdir(this.dataDir, { recursive: true });
        await this.loadInteractions();
    }

    /**
     * Record an interaction
     */
    async recordInteraction(
        type: InteractionType,
        input: string,
        output: string,
        model: string,
        metrics: InteractionMetrics,
        context: InteractionContext
    ): Promise<Interaction> {
        const interaction: Interaction = {
            id: crypto.randomBytes(16).toString('hex'),
            timestamp: new Date(),
            type,
            input: this.anonymizationEnabled ? this.anonymize(input) : input,
            output: this.anonymizationEnabled ? this.anonymize(output) : output,
            model,
            metrics,
            context
        };

        this.interactions.push(interaction);
        this.emit('interaction:recorded', { id: interaction.id, type });

        // Persist periodically
        if (this.interactions.length % 50 === 0) {
            await this.persistInteractions();
        }

        return interaction;
    }

    /**
     * Record user feedback on an interaction
     */
    async recordFeedback(interactionId: string, feedback: UserFeedback): Promise<void> {
        const interaction = this.interactions.find(i => i.id === interactionId);
        if (!interaction) return;

        interaction.userFeedback = feedback;
        this.emit('feedback:recorded', { interactionId, feedback });

        // Trigger learning if enough feedback accumulated
        if (this.getRecentFeedbackCount() >= 100) {
            this.emit('learning:trigger', { reason: 'feedback_accumulated' });
        }
    }

    /**
     * Analyze patterns for learning
     */
    analyzePatterns(): LearningInsight[] {
        const patterns = new Map<string, { success: number; total: number; examples: string[] }>();

        for (const interaction of this.interactions) {
            if (!interaction.userFeedback) continue;

            // Create pattern key from context
            const patternKey = `${interaction.type}:${interaction.context.language || 'any'}:${interaction.context.framework || 'any'}`;

            const existing = patterns.get(patternKey) || { success: 0, total: 0, examples: [] };
            existing.total++;
            if (interaction.userFeedback.accepted) {
                existing.success++;
            }
            if (existing.examples.length < 5) {
                existing.examples.push(interaction.input.slice(0, 100));
            }
            patterns.set(patternKey, existing);
        }

        const insights: LearningInsight[] = [];

        for (const [pattern, stats] of patterns) {
            if (stats.total >= 10) {
                insights.push({
                    pattern,
                    frequency: stats.total,
                    successRate: stats.success / stats.total,
                    recommendations: this.generateRecommendations(pattern, stats)
                });
            }
        }

        // Sort by frequency
        insights.sort((a, b) => b.frequency - a.frequency);

        return insights;
    }

    /**
     * Generate analytics report
     */
    generateReport(period: 'day' | 'week' | 'month'): AnalyticsReport {
        const now = new Date();
        const periodMs = {
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        };

        const cutoff = new Date(now.getTime() - periodMs[period]);
        const periodInteractions = this.interactions.filter(i => i.timestamp >= cutoff);

        // Calculate metrics
        const withFeedback = periodInteractions.filter(i => i.userFeedback);
        const accepted = withFeedback.filter(i => i.userFeedback?.accepted);
        const rated = withFeedback.filter(i => i.userFeedback?.rating);

        const acceptanceRate = withFeedback.length > 0 ? accepted.length / withFeedback.length : 0;
        const avgRating = rated.length > 0
            ? rated.reduce((sum, i) => sum + (i.userFeedback?.rating || 0), 0) / rated.length
            : 0;

        // Model performance
        const modelPerformance: Record<string, { success: number; total: number }> = {};
        for (const interaction of withFeedback) {
            const model = interaction.model;
            if (!modelPerformance[model]) {
                modelPerformance[model] = { success: 0, total: 0 };
            }
            modelPerformance[model].total++;
            if (interaction.userFeedback?.accepted) {
                modelPerformance[model].success++;
            }
        }

        // Improvement areas (low success patterns)
        const patterns = this.analyzePatterns();
        const lowSuccess = patterns.filter(p => p.successRate < 0.7);

        return {
            period,
            totalInteractions: periodInteractions.length,
            acceptanceRate,
            avgRating,
            topPatterns: patterns.slice(0, 10),
            modelPerformance,
            improvementAreas: lowSuccess.map(p => p.pattern)
        };
    }

    /**
     * Generate training data for fine-tuning
     */
    async generateTrainingData(): Promise<string> {
        const acceptedInteractions = this.interactions.filter(
            i => i.userFeedback?.accepted && i.userFeedback?.rating && i.userFeedback.rating >= 4
        );

        const trainingLines: string[] = [];

        for (const interaction of acceptedInteractions) {
            const trainingSample = {
                messages: [
                    { role: 'user', content: interaction.input },
                    { role: 'assistant', content: interaction.output }
                ],
                metadata: {
                    type: interaction.type,
                    language: interaction.context.language,
                    rating: interaction.userFeedback?.rating
                }
            };
            trainingLines.push(JSON.stringify(trainingSample));
        }

        return trainingLines.join('\n');
    }

    /**
     * Export data for external training
     */
    async exportForTraining(): Promise<string> {
        if (!this.isOptedIn) {
            throw new Error('User has not opted in to data sharing');
        }

        const exportPath = path.join(this.dataDir, `training_export_${Date.now()}.jsonl`);
        const data = await this.generateTrainingData();
        await fs.writeFile(exportPath, data);

        return exportPath;
    }

    // Helper methods
    private anonymize(text: string): string {
        // Remove potential PII
        return text
            .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[EMAIL]')
            .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
            .replace(/\b(?:sk-|pk_|rk_)[a-zA-Z0-9]{20,}\b/g, '[API_KEY]')
            .replace(/\/Users\/\w+/g, '/Users/[USER]')
            .replace(/C:\\Users\\\w+/g, 'C:\\Users\\[USER]');
    }

    private generateRecommendations(pattern: string, stats: { success: number; total: number }): string[] {
        const recommendations: string[] = [];
        const successRate = stats.success / stats.total;

        if (successRate < 0.5) {
            recommendations.push('Consider using a more capable model for this pattern');
            recommendations.push('Add more context in prompts');
        } else if (successRate < 0.7) {
            recommendations.push('Fine-tune prompts for better accuracy');
        }

        return recommendations;
    }

    private getRecentFeedbackCount(): number {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return this.interactions.filter(
            i => i.timestamp >= oneHourAgo && i.userFeedback
        ).length;
    }

    private async loadInteractions(): Promise<void> {
        try {
            const dataPath = path.join(this.dataDir, 'interactions.json');
            const data = await fs.readFile(dataPath, 'utf-8');
            this.interactions = JSON.parse(data);
        } catch {
            this.interactions = [];
        }
    }

    private async persistInteractions(): Promise<void> {
        const dataPath = path.join(this.dataDir, 'interactions.json');
        await fs.writeFile(dataPath, JSON.stringify(this.interactions, null, 2));
    }

    /**
     * Opt in/out of data sharing
     */
    setOptIn(optIn: boolean): void {
        this.isOptedIn = optIn;
        this.emit('optin:changed', { optIn });
    }

    /**
     * Get opt-in status
     */
    getOptInStatus(): boolean {
        return this.isOptedIn;
    }

    /**
     * Clear all data
     */
    async clearData(): Promise<void> {
        this.interactions = [];
        await fs.rm(this.dataDir, { recursive: true, force: true });
        await fs.mkdir(this.dataDir, { recursive: true });
    }
}

export const feedbackLoopService = FeedbackLoopService.getInstance();
