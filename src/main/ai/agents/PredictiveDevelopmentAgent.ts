/**
 * Predictive Development Agent
 * 
 * Anticipate developer needs:
 * - Predict next file to edit
 * - Suggest refactoring
 * - Detect burnout patterns
 * - Estimate completion time
 * - Identify blockers
 */

import { EventEmitter } from 'events';

export interface Prediction {
    id: string;
    type: 'file' | 'refactoring' | 'blocker' | 'estimate';
    confidence: number;
    prediction: any;
    context: string;
}

export interface BurnoutIndicator {
    level: 'normal' | 'elevated' | 'high';
    indicators: string[];
    recommendations: string[];
}

export interface TimeEstimate {
    optimistic: number; // hours
    realistic: number;
    pessimistic: number;
    factors: string[];
}

export class PredictiveDevelopmentAgent extends EventEmitter {
    private static instance: PredictiveDevelopmentAgent;
    private fileHistory: string[] = [];
    private actionHistory: Array<{ action: string; timestamp: number }> = [];
    private sessionStartTime: number = Date.now();

    private constructor() { super(); }

    static getInstance(): PredictiveDevelopmentAgent {
        if (!PredictiveDevelopmentAgent.instance) {
            PredictiveDevelopmentAgent.instance = new PredictiveDevelopmentAgent();
        }
        return PredictiveDevelopmentAgent.instance;
    }

    recordFileAccess(filePath: string): void {
        this.fileHistory.push(filePath);
        if (this.fileHistory.length > 100) {
            this.fileHistory = this.fileHistory.slice(-100);
        }
    }

    recordAction(action: string): void {
        this.actionHistory.push({ action, timestamp: Date.now() });
        if (this.actionHistory.length > 500) {
            this.actionHistory = this.actionHistory.slice(-500);
        }
    }

    predictNextFiles(currentFile: string): string[] {
        const predictions: Map<string, number> = new Map();

        // Find patterns in file history
        for (let i = 0; i < this.fileHistory.length - 1; i++) {
            if (this.fileHistory[i] === currentFile) {
                const nextFile = this.fileHistory[i + 1];
                predictions.set(nextFile, (predictions.get(nextFile) || 0) + 1);
            }
        }

        // Sort by frequency
        const sorted = Array.from(predictions.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([file]) => file);

        return sorted.slice(0, 5);
    }

    suggestRefactoring(): Array<{
        type: string;
        file: string;
        reason: string;
        confidence: number;
    }> {
        const suggestions: Array<{
            type: string;
            file: string;
            reason: string;
            confidence: number;
        }> = [];

        // Find frequently modified files
        const modificationCounts: Map<string, number> = new Map();
        for (const file of this.fileHistory) {
            modificationCounts.set(file, (modificationCounts.get(file) || 0) + 1);
        }

        for (const [file, count] of modificationCounts) {
            if (count > 10) {
                suggestions.push({
                    type: 'extract_module',
                    file,
                    reason: `File modified ${count} times - might benefit from modularization`,
                    confidence: Math.min(0.9, count / 20),
                });
            }
        }

        return suggestions.slice(0, 5);
    }

    detectBurnout(): BurnoutIndicator {
        const sessionDuration = (Date.now() - this.sessionStartTime) / (1000 * 60 * 60); // hours
        const actionsPerHour = this.actionHistory.length / Math.max(1, sessionDuration);

        const indicators: string[] = [];
        let level: 'normal' | 'elevated' | 'high' = 'normal';

        if (sessionDuration > 6) {
            indicators.push(`Long session: ${sessionDuration.toFixed(1)} hours`);
            level = 'elevated';
        }

        if (sessionDuration > 10) {
            level = 'high';
        }

        // Check for reduced activity (sign of fatigue)
        if (this.actionHistory.length > 50) {
            const recentActions = this.actionHistory.slice(-20);
            const olderActions = this.actionHistory.slice(-50, -30);

            const recentRate = this.calculateActivityRate(recentActions);
            const olderRate = this.calculateActivityRate(olderActions);

            if (recentRate < olderRate * 0.5) {
                indicators.push('Activity rate has dropped significantly');
                level = level === 'high' ? 'high' : 'elevated';
            }
        }

        const recommendations: string[] = [];
        if (level !== 'normal') {
            recommendations.push('Consider taking a break');
            recommendations.push('Step away from the screen for 10-15 minutes');
        }
        if (level === 'high') {
            recommendations.push('Extended work session detected - rest is important for productivity');
        }

        return { level, indicators, recommendations };
    }

    private calculateActivityRate(actions: Array<{ timestamp: number }>): number {
        if (actions.length < 2) return 0;
        const duration = (actions[actions.length - 1].timestamp - actions[0].timestamp) / 1000 / 60;
        return actions.length / Math.max(1, duration);
    }

    estimateCompletionTime(task: {
        description: string;
        filesInvolved: number;
        complexity: 'low' | 'medium' | 'high';
    }): TimeEstimate {
        const baseHours = {
            low: 1,
            medium: 4,
            high: 12,
        }[task.complexity];

        const fileMultiplier = Math.max(1, task.filesInvolved / 5);

        const realistic = baseHours * fileMultiplier;
        const optimistic = realistic * 0.6;
        const pessimistic = realistic * 2;

        return {
            optimistic,
            realistic,
            pessimistic,
            factors: [
                `Base estimate for ${task.complexity} complexity: ${baseHours}h`,
                `${task.filesInvolved} files involved`,
                'Includes buffer for testing and review',
            ],
        };
    }

    identifyBlockers(context: {
        currentTask: string;
        dependencies: string[];
        resources: string[];
    }): Array<{
        type: 'dependency' | 'resource' | 'knowledge' | 'external';
        description: string;
        suggestion: string;
    }> {
        const blockers: Array<{
            type: 'dependency' | 'resource' | 'knowledge' | 'external';
            description: string;
            suggestion: string;
        }> = [];

        // Check for missing dependencies
        for (const dep of context.dependencies) {
            if (dep.includes('pending') || dep.includes('waiting')) {
                blockers.push({
                    type: 'dependency',
                    description: `Waiting on: ${dep}`,
                    suggestion: 'Follow up on the blocking dependency',
                });
            }
        }

        // Check for resource constraints
        if (context.resources.length === 0) {
            blockers.push({
                type: 'resource',
                description: 'No resources defined for task',
                suggestion: 'Clarify required resources and permissions',
            });
        }

        return blockers;
    }

    getStats(): {
        filesTracked: number;
        actionsRecorded: number;
        sessionDuration: number;
    } {
        return {
            filesTracked: this.fileHistory.length,
            actionsRecorded: this.actionHistory.length,
            sessionDuration: (Date.now() - this.sessionStartTime) / (1000 * 60),
        };
    }
}

export const predictiveDevelopmentAgent = PredictiveDevelopmentAgent.getInstance();
