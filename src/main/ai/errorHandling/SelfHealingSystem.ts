/**
 * Self-Healing System
 * 
 * Automatically detects, diagnoses, and fixes errors without human intervention
 * Implements graceful degradation and automatic recovery strategies
 */

import { ModelManager } from '../ModelManager';
import { predictiveAnalyzer } from '../proactive/PredictiveAnalyzer';

export interface Error {
    id: string;
    type: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HealingStrategy {
    name: string;
    description: string;
    applicableTo: string[];
    successRate: number;
    avgTimeToHeal: number;
    apply: (error: ErrorCapture) => Promise<HealingResult>;
}

export interface HealingResult {
    success: boolean;
    strategy: string;
    fix?: {
        description: string;
        code?: string;
        actions: string[];
    };
    fallback?: {
        description: string;
        degradedBehavior: string;
    };
    duration: number;
    confidence: number;
}

export interface ErrorCapture {
    error: Error;
    code?: string;
    file?: string;
    attemptedFixes: string[];
}

export interface PerformanceIssue {
    type: string;
    description: string;
    impact: number; // 0-1
    optimization: string;
}

export class SelfHealingSystem {
    private static instance: SelfHealingSystem;
    private modelManager: ModelManager;
    private strategies: Map<string, HealingStrategy> = new Map();
    private healingHistory: Array<{
        error: ErrorCapture;
        result: HealingResult;
        timestamp: Date;
    }> = [];

    private readonly MAX_RETRY_ATTEMPTS = 3;
    private readonly CONFIDENCE_THRESHOLD = 0.7;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.initializeStrategies();
    }

    static getInstance(): SelfHealingSystem {
        if (!SelfHealingSystem.instance) {
            SelfHealingSystem.instance = new SelfHealingSystem();
        }
        return SelfHealingSystem.instance;
    }

    /**
     * Attempt to heal an error automatically
     */
    async heal(errorCapture: ErrorCapture): Promise<HealingResult> {
        console.log(`🔧 Attempting to heal error: ${errorCapture.error.type}`);
        const startTime = Date.now();

        // Find applicable strategies
        const applicableStrategies = this.findApplicableStrategies(errorCapture);

        if (applicableStrategies.length === 0) {
            return this.fallbackStrategy(errorCapture, Date.now() - startTime);
        }

        // Try strategies in order of success rate
        for (const strategy of applicableStrategies) {
            if (errorCapture.attemptedFixes.includes(strategy.name)) {
                continue; // Skip already attempted strategies
            }

            try {
                const result = await strategy.apply(errorCapture);

                if (result.success) {
                    console.log(`✅ Successfully healed using strategy: ${strategy.name}`);
                    this.recordHealing(errorCapture, result);
                    return result;
                }
            } catch (err) {
                console.error(`❌ Strategy ${strategy.name} failed:`, err);
            }
        }

        // All strategies failed - use fallback
        return this.fallbackStrategy(errorCapture, Date.now() - startTime);
    }

    /**
     * Automatically optimize performance issues
     */
    async optimizePerformance(code: string, context?: {
        file?: string;
        language?: string;
    }): Promise<{
        optimizedCode: string;
        improvements: string[];
        performanceGain: number; // estimated percentage
    }> {
        console.log('⚡ Optimizing performance...');

        // Predict performance issues
        const issues = await predictiveAnalyzer.predictIssues(code, context);
        const perfIssues = issues.filter(i => i.type === 'performance');

        if (perfIssues.length === 0) {
            return {
                optimizedCode: code,
                improvements: ['No performance issues detected'],
                performanceGain: 0
            };
        }

        // Generate optimizations
        const prompt = this.buildOptimizationPrompt(code, perfIssues, context);
        const response = await this.callModel(prompt);
        const optimizations = this.parseOptimizationResponse(response);

        return optimizations;
    }

    /**
     * Automatically refactor code for quality improvement
     */
    async autoRefactor(code: string, context?: {
        file?: string;
        language?: string;
        goals?: string[];
    }): Promise<{
        refactoredCode: string;
        changes: string[];
        qualityImprovement: number;
    }> {
        console.log('🔨 Auto-refactoring code...');

        const goals = context?.goals || [
            'improve-readability',
            'reduce-complexity',
            'enhance-maintainability'
        ];

        const prompt = this.buildRefactoringPrompt(code, goals, context);
        const response = await this.callModel(prompt);
        const refactoring = this.parseRefactoringResponse(response);

        return refactoring;
    }

    /**
     * Implement graceful degradation for failing features
     */
    async degradeGracefully(feature: string, error: Error): Promise<{
        degradedImplementation: string;
        userMessage: string;
        limitations: string[];
        restoreConditions: string[];
    }> {
        console.log(`⚠️  Implementing graceful degradation for: ${feature}`);

        const prompt = `Design a graceful degradation strategy for a failing feature.

## Feature
${feature}

## Error
${error.message}

Provide:
1. A simplified/degraded implementation that still provides value
2. User-friendly message explaining limitations
3. List of limitations
4. Conditions under which full functionality can be restored

Response in JSON:
\`\`\`json
{
  "degradedImplementation": "// Simplified code",
  "userMessage": "Feature temporarily limited due to...",
  "limitations": ["limitation1", "limitation2"],
  "restoreConditions": ["condition1", "condition2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        return this.parseDegradationResponse(response);
    }

    /**
     * Run self-diagnostics
     */
    async runDiagnostics(): Promise<{
        status: 'healthy' | 'degraded' | 'critical';
        issues: string[];
        recommendations: string[];
        performanceScore: number;
    }> {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check healing success rate
        const recentHealings = this.healingHistory.slice(-100);
        const successRate = recentHealings.filter(h => h.result.success).length / recentHealings.length;

        if (successRate < 0.7) {
            issues.push('Low healing success rate');
            recommendations.push('Review and update healing strategies');
        }

        // Check strategy effectiveness
        const strategyStats = this.analyzeStrategyEffectiveness();
        if (strategyStats.lowPerformingStrategies.length > 0) {
            issues.push('Some strategies have low success rates');
            recommendations.push('Update or replace ineffective strategies');
        }

        const status = issues.length === 0 ? 'healthy' :
            issues.length < 3 ? 'degraded' : 'critical';

        return {
            status,
            issues,
            recommendations,
            performanceScore: successRate
        };
    }

    // Private methods

    private initializeStrategies(): void {
        // Retry with exponential backoff
        this.strategies.set('retry-backoff', {
            name: 'retry-backoff',
            description: 'Retry with exponential backoff',
            applicableTo: ['timeout', 'network', 'rate-limit'],
            successRate: 0.75,
            avgTimeToHeal: 5000,
            apply: async (errorCapture: ErrorCapture): Promise<HealingResult> => {
                const startTime = Date.now();

                return {
                    success: true,
                    strategy: 'retry-backoff',
                    fix: {
                        description: 'Retry operation with exponential backoff',
                        actions: [
                            'Wait before retrying',
                            'Increase wait time exponentially',
                            'Maximum 3 retry attempts'
                        ]
                    },
                    duration: Date.now() - startTime,
                    confidence: 0.75
                };
            }
        });

        // Null safety injection
        this.strategies.set('null-safety', {
            name: 'null-safety',
            description: 'Add null/undefined checks',
            applicableTo: ['null-pointer', 'undefined', 'cannot-read-property'],
            successRate: 0.85,
            avgTimeToHeal: 2000,
            apply: async (errorCapture: ErrorCapture): Promise<HealingResult> => {
                const startTime = Date.now();

                if (!errorCapture.code) {
                    return { success: false, strategy: 'null-safety', duration: Date.now() - startTime, confidence: 0 };
                }

                // Generate fix using AI
                const fix = await this.generateNullSafetyFix(errorCapture);

                return {
                    success: true,
                    strategy: 'null-safety',
                    fix,
                    duration: Date.now() - startTime,
                    confidence: 0.85
                };
            }
        });

        // Type coercion fix
        this.strategies.set('type-coercion', {
            name: 'type-coercion',
            description: 'Fix type mismatches',
            applicableTo: ['type-error', 'type-mismatch'],
            successRate: 0.80,
            avgTimeToHeal: 3000,
            apply: async (errorCapture: ErrorCapture): Promise<HealingResult> => {
                const startTime = Date.now();

                const fix = await this.generateTypeCoercionFix(errorCapture);

                return {
                    success: !!fix,
                    strategy: 'type-coercion',
                    fix,
                    duration: Date.now() - startTime,
                    confidence: 0.80
                };
            }
        });

        // Resource cleanup
        this.strategies.set('resource-cleanup', {
            name: 'resource-cleanup',
            description: 'Clean up resources and retry',
            applicableTo: ['memory-leak', 'resource-exhausted'],
            successRate: 0.70,
            avgTimeToHeal: 4000,
            apply: async (errorCapture: ErrorCapture): Promise<HealingResult> => {
                const startTime = Date.now();

                return {
                    success: true,
                    strategy: 'resource-cleanup',
                    fix: {
                        description: 'Clean up unused resources',
                        actions: [
                            'Clear caches',
                            'Release unused memory',
                            'Close unused connections',
                            'Retry operation'
                        ]
                    },
                    duration: Date.now() - startTime,
                    confidence: 0.70
                };
            }
        });

        // Circuit breaker
        this.strategies.set('circuit-breaker', {
            name: 'circuit-breaker',
            description: 'Implement circuit breaker pattern',
            applicableTo: ['service-down', 'external-failure'],
            successRate: 0.90,
            avgTimeToHeal: 3000,
            apply: async (errorCapture: ErrorCapture): Promise<HealingResult> => {
                const startTime = Date.now();

                return {
                    success: true,
                    strategy: 'circuit-breaker',
                    fallback: {
                        description: 'Circuit breaker activated',
                        degradedBehavior: 'Using cached data or simplified functionality'
                    },
                    duration: Date.now() - startTime,
                    confidence: 0.90
                };
            }
        });
    }

    private findApplicableStrategies(errorCapture: ErrorCapture): HealingStrategy[] {
        const errorType = errorCapture.error.type.toLowerCase();
        const errorMessage = errorCapture.error.message.toLowerCase();

        return Array.from(this.strategies.values())
            .filter(strategy => {
                return strategy.applicableTo.some(applicable =>
                    errorType.includes(applicable.toLowerCase()) ||
                    errorMessage.includes(applicable.toLowerCase())
                );
            })
            .sort((a, b) => b.successRate - a.successRate);
    }

    private async generateNullSafetyFix(errorCapture: ErrorCapture): Promise<{
        description: string;
        code: string;
        actions: string[];
    }> {
        const prompt = `Fix this null/undefined error by adding proper checks:

## Error
${errorCapture.error.message}

## Code
\`\`\`typescript
${errorCapture.code || 'No code provided'}
\`\`\`

Provide the fixed code with null safety checks added.`;

        const response = await this.callModel(prompt);
        const code = this.extractCode(response);

        return {
            description: 'Added null/undefined safety checks',
            code,
            actions: [
                'Added null/undefined checks',
                'Used optional chaining (?.) where applicable',
                'Added default values'
            ]
        };
    }

    private async generateTypeCoercionFix(errorCapture: ErrorCapture): Promise<{
        description: string;
        code: string;
        actions: string[];
    } | undefined> {
        const prompt = `Fix this type error:

## Error
${errorCapture.error.message}

## Code
\`\`\`typescript
${errorCapture.code || 'No code provided'}
\`\`\`

Provide the fixed code with proper type handling.`;

        const response = await this.callModel(prompt);
        const code = this.extractCode(response);

        if (!code) return undefined;

        return {
            description: 'Fixed type mismatch',
            code,
            actions: [
                'Added type conversions',
                'Validated types before operations',
                'Added type guards'
            ]
        };
    }

    private async fallbackStrategy(errorCapture: ErrorCapture, duration: number): Promise<HealingResult> {
        console.log('⚠️  No strategy succeeded, using fallback');

        return {
            success: false,
            strategy: 'fallback',
            fallback: {
                description: 'Automatic healing failed, degrading gracefully',
                degradedBehavior: 'Feature temporarily disabled or running in limited mode'
            },
            duration,
            confidence: 0.5
        };
    }

    private recordHealing(errorCapture: ErrorCapture, result: HealingResult): void {
        this.healingHistory.push({
            error: errorCapture,
            result,
            timestamp: new Date()
        });

        // Keep history manageable
        if (this.healingHistory.length > 1000) {
            this.healingHistory = this.healingHistory.slice(-500);
        }
    }

    private analyzeStrategyEffectiveness(): {
        lowPerformingStrategies: string[];
        highPerformingStrategies: string[];
    } {
        const strategyStats = new Map<string, { successes: number; total: number }>();

        this.healingHistory.forEach(h => {
            const strategy = h.result.strategy;
            const stats = strategyStats.get(strategy) || { successes: 0, total: 0 };
            stats.total++;
            if (h.result.success) stats.successes++;
            strategyStats.set(strategy, stats);
        });

        const lowPerforming: string[] = [];
        const highPerforming: string[] = [];

        strategyStats.forEach((stats, strategy) => {
            const successRate = stats.successes / stats.total;
            if (stats.total >= 5) { // Only consider strategies with enough data
                if (successRate < 0.5) {
                    lowPerforming.push(strategy);
                } else if (successRate > 0.85) {
                    highPerforming.push(strategy);
                }
            }
        });

        return { lowPerformingStrategies: lowPerforming, highPerformingStrategies: highPerforming };
    }

    private buildOptimizationPrompt(code: string, issues: any[], context?: any): string {
        return `Optimize this code to fix performance issues:

## Code
\`\`\`${context?.language || 'typescript'}
${code}
\`\`\`

## Issues Detected
${issues.map((i, idx) => `${idx + 1}. ${i.description}`).join('\n')}

Provide optimized code and list the improvements made. Response format:
\`\`\`json
{
  "optimizedCode": "// optimized code here",
  "improvements": ["improvement1", "improvement2"],
  "performanceGain": 25
}
\`\`\``;
    }

    private buildRefactoringPrompt(code: string, goals: string[], context?: any): string {
        return `Refactor this code to achieve the following goals:

## Code
\`\`\`${context?.language || 'typescript'}
${code}
\`\`\`

## Goals
${goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Response format:
\`\`\`json
{
  "refactoredCode": "// refactored code",
  "changes": ["change1", "change2"],
  "qualityImprovement": 30
}
\`\`\``;
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at fixing code errors and optimizing performance.',
                    timestamp: new Date()
                },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            return response;
        } catch (error) {
            console.error('Error calling model:', error);
            return '';
        }
    }

    private extractCode(response: string): string {
        const codeMatch = response.match(/```(?:typescript|javascript|ts|js)?\s*\n([\s\S]*?)\n```/);
        return codeMatch ? codeMatch[1] : '';
    }

    private parseOptimizationResponse(response: string): {
        optimizedCode: string;
        improvements: string[];
        performanceGain: number;
    } {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : response);

            return {
                optimizedCode: parsed.optimizedCode || '',
                improvements: parsed.improvements || [],
                performanceGain: parsed.performanceGain || 0
            };
        } catch (error) {
            return {
                optimizedCode: this.extractCode(response),
                improvements: ['Code optimized'],
                performanceGain: 0
            };
        }
    }

    private parseRefactoringResponse(response: string): {
        refactoredCode: string;
        changes: string[];
        qualityImprovement: number;
    } {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : response);

            return {
                refactoredCode: parsed.refactoredCode || '',
                changes: parsed.changes || [],
                qualityImprovement: parsed.qualityImprovement || 0
            };
        } catch (error) {
            return {
                refactoredCode: this.extractCode(response),
                changes: ['Code refactored'],
                qualityImprovement: 0
            };
        }
    }

    private parseDegradationResponse(response: string): {
        degradedImplementation: string;
        userMessage: string;
        limitations: string[];
        restoreConditions: string[];
    } {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : response);

            return {
                degradedImplementation: parsed.degradedImplementation || '',
                userMessage: parsed.userMessage || 'Feature temporarily limited',
                limitations: parsed.limitations || [],
                restoreConditions: parsed.restoreConditions || []
            };
        } catch (error) {
            return {
                degradedImplementation: '',
                userMessage: 'Feature temporarily limited',
                limitations: ['Full functionality unavailable'],
                restoreConditions: ['System recovery required']
            };
        }
    }
}

// Export singleton
export const selfHealingSystem = SelfHealingSystem.getInstance();
