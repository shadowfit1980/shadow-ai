/**
 * Self-Evolution Engine
 * 
 * Enables the agent to improve itself through performance analysis,
 * pattern learning, and capability enhancement.
 */

import { EventEmitter } from 'events';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
    id: string;
    taskType: string;
    success: boolean;
    executionTime: number;
    retryCount: number;
    errorTypes: string[];
    userFeedback?: 'positive' | 'negative' | 'neutral';
    timestamp: Date;
    context: Record<string, any>;
}

export interface LearnedPattern {
    id: string;
    name: string;
    description: string;
    taskTypes: string[];
    successRate: number;
    avgExecutionTime: number;
    strategy: string;
    examples: string[];
    createdAt: Date;
    updatedAt: Date;
    useCount: number;
}

export interface ImprovementSuggestion {
    area: string;
    currentPerformance: number;
    targetPerformance: number;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
}

export interface EvolutionStats {
    totalTasks: number;
    successRate: number;
    avgExecutionTime: number;
    learnedPatterns: number;
    improvementScore: number;
    lastEvolved: Date;
}

// ============================================================================
// SELF-EVOLUTION ENGINE
// ============================================================================

export class SelfEvolutionEngine extends EventEmitter {
    private static instance: SelfEvolutionEngine;
    private modelManager: ModelManager;

    private metrics: PerformanceMetric[] = [];
    private patterns: Map<string, LearnedPattern> = new Map();
    private strategySuggestions: Map<string, string> = new Map();

    private dataPath: string;
    private maxMetricsHistory = 1000;
    private evolutionInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
        this.dataPath = join(process.cwd(), '.shadow-ai', 'evolution');
        this.initialize();
    }

    static getInstance(): SelfEvolutionEngine {
        if (!SelfEvolutionEngine.instance) {
            SelfEvolutionEngine.instance = new SelfEvolutionEngine();
        }
        return SelfEvolutionEngine.instance;
    }

    private async initialize(): Promise<void> {
        try {
            await mkdir(this.dataPath, { recursive: true });
            await this.loadState();
            console.log('🧬 Self-Evolution Engine initialized');
        } catch (error) {
            console.error('Evolution engine init failed:', error);
        }
    }

    // ========================================================================
    // PERFORMANCE TRACKING
    // ========================================================================

    /**
     * Record a task execution for analysis
     */
    recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): string {
        const fullMetric: PerformanceMetric = {
            ...metric,
            id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date()
        };

        this.metrics.push(fullMetric);

        // Trim history if too long
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics = this.metrics.slice(-this.maxMetricsHistory);
        }

        this.emit('metric:recorded', fullMetric);

        // Trigger pattern analysis every 10 metrics
        if (this.metrics.length % 10 === 0) {
            this.analyzePatterns();
        }

        return fullMetric.id;
    }

    /**
     * Record user feedback for a task
     */
    recordFeedback(metricId: string, feedback: 'positive' | 'negative' | 'neutral'): void {
        const metric = this.metrics.find(m => m.id === metricId);
        if (metric) {
            metric.userFeedback = feedback;
            this.emit('feedback:recorded', { metricId, feedback });
        }
    }

    // ========================================================================
    // PATTERN LEARNING
    // ========================================================================

    /**
     * Analyze metrics to discover patterns
     */
    async analyzePatterns(): Promise<LearnedPattern[]> {
        console.log('🔍 Analyzing performance patterns...');

        // Group metrics by task type
        const byTaskType = new Map<string, PerformanceMetric[]>();
        for (const metric of this.metrics) {
            const existing = byTaskType.get(metric.taskType) || [];
            existing.push(metric);
            byTaskType.set(metric.taskType, existing);
        }

        const newPatterns: LearnedPattern[] = [];

        for (const [taskType, taskMetrics] of byTaskType) {
            if (taskMetrics.length < 5) continue; // Need enough data

            const successfulMetrics = taskMetrics.filter(m => m.success);
            const failedMetrics = taskMetrics.filter(m => !m.success);

            if (successfulMetrics.length === 0) continue;

            // Calculate statistics
            const successRate = successfulMetrics.length / taskMetrics.length;
            const avgTime = successfulMetrics.reduce((sum, m) => sum + m.executionTime, 0) / successfulMetrics.length;

            // Analyze what makes successful attempts different
            const pattern = await this.extractSuccessPattern(taskType, successfulMetrics, failedMetrics);

            if (pattern) {
                const existingPattern = this.patterns.get(pattern.id);
                if (existingPattern) {
                    // Update existing pattern
                    existingPattern.successRate = successRate;
                    existingPattern.avgExecutionTime = avgTime;
                    existingPattern.useCount++;
                    existingPattern.updatedAt = new Date();
                } else {
                    this.patterns.set(pattern.id, pattern);
                    newPatterns.push(pattern);
                }
            }
        }

        if (newPatterns.length > 0) {
            console.log(`  📊 Discovered ${newPatterns.length} new patterns`);
            this.emit('patterns:discovered', newPatterns);
            await this.saveState();
        }

        return newPatterns;
    }

    /**
     * Extract what makes successful attempts work
     */
    private async extractSuccessPattern(
        taskType: string,
        successMetrics: PerformanceMetric[],
        failedMetrics: PerformanceMetric[]
    ): Promise<LearnedPattern | null> {
        const prompt = `Analyze these task execution results and identify the success pattern.

Task Type: ${taskType}

Successful executions (${successMetrics.length}):
${JSON.stringify(successMetrics.slice(-5).map(m => ({
            time: m.executionTime,
            retries: m.retryCount,
            context: m.context
        })), null, 2)}

Failed executions (${failedMetrics.length}):
${JSON.stringify(failedMetrics.slice(-3).map(m => ({
            errors: m.errorTypes,
            context: m.context
        })), null, 2)}

Identify the key pattern that leads to success. Respond in JSON:
\`\`\`json
{
    "patternName": "short descriptive name",
    "description": "what makes this pattern successful",
    "strategy": "recommended approach for this task type",
    "keyFactors": ["factor1", "factor2"]
}
\`\`\``;

        try {
            const response = await this.callModel(prompt);
            const parsed = this.parseJSON(response);

            if (!parsed.patternName) return null;

            return {
                id: `pattern-${taskType}-${Date.now()}`,
                name: parsed.patternName,
                description: parsed.description,
                taskTypes: [taskType],
                successRate: successMetrics.length / (successMetrics.length + failedMetrics.length),
                avgExecutionTime: successMetrics.reduce((s, m) => s + m.executionTime, 0) / successMetrics.length,
                strategy: parsed.strategy,
                examples: parsed.keyFactors || [],
                createdAt: new Date(),
                updatedAt: new Date(),
                useCount: 0
            };
        } catch {
            return null;
        }
    }

    // ========================================================================
    // STRATEGY OPTIMIZATION
    // ========================================================================

    /**
     * Get optimized strategy for a task type
     */
    async getOptimizedStrategy(taskType: string, context?: Record<string, any>): Promise<string> {
        // Check cached strategies
        const cached = this.strategySuggestions.get(taskType);
        if (cached) return cached;

        // Find relevant patterns
        const relevantPatterns = Array.from(this.patterns.values())
            .filter(p => p.taskTypes.includes(taskType))
            .sort((a, b) => b.successRate - a.successRate);

        if (relevantPatterns.length > 0) {
            const bestPattern = relevantPatterns[0];
            return bestPattern.strategy;
        }

        // Generate new strategy
        const strategy = await this.generateStrategy(taskType, context);
        this.strategySuggestions.set(taskType, strategy);
        return strategy;
    }

    /**
     * Generate a new strategy for a task type
     */
    private async generateStrategy(taskType: string, context?: Record<string, any>): Promise<string> {
        const recentMetrics = this.metrics
            .filter(m => m.taskType === taskType)
            .slice(-10);

        const prompt = `Generate an optimized strategy for this task type.

Task Type: ${taskType}
Context: ${JSON.stringify(context || {}, null, 2)}

Recent performance:
- Total attempts: ${recentMetrics.length}
- Success rate: ${(recentMetrics.filter(m => m.success).length / Math.max(recentMetrics.length, 1) * 100).toFixed(1)}%
- Common errors: ${[...new Set(recentMetrics.flatMap(m => m.errorTypes))].join(', ') || 'None'}

Provide a concise, actionable strategy (2-3 sentences max).`;

        try {
            return await this.callModel(prompt);
        } catch {
            return 'Apply standard approach with careful error handling.';
        }
    }

    // ========================================================================
    // IMPROVEMENT SUGGESTIONS
    // ========================================================================

    /**
     * Generate improvement suggestions based on performance
     */
    async generateImprovements(): Promise<ImprovementSuggestion[]> {
        console.log('💡 Generating improvement suggestions...');

        const stats = this.getStats();
        const suggestions: ImprovementSuggestion[] = [];

        // Analyze task type performance
        const byTaskType = new Map<string, PerformanceMetric[]>();
        for (const metric of this.metrics) {
            const existing = byTaskType.get(metric.taskType) || [];
            existing.push(metric);
            byTaskType.set(metric.taskType, existing);
        }

        for (const [taskType, metrics] of byTaskType) {
            const successRate = metrics.filter(m => m.success).length / metrics.length;
            const avgRetries = metrics.reduce((s, m) => s + m.retryCount, 0) / metrics.length;

            if (successRate < 0.7) {
                suggestions.push({
                    area: taskType,
                    currentPerformance: successRate,
                    targetPerformance: 0.85,
                    suggestion: `Improve ${taskType} handling - current success rate is ${(successRate * 100).toFixed(1)}%`,
                    priority: successRate < 0.5 ? 'high' : 'medium',
                    actionable: true
                });
            }

            if (avgRetries > 2) {
                suggestions.push({
                    area: `${taskType}-retries`,
                    currentPerformance: avgRetries,
                    targetPerformance: 1,
                    suggestion: `Reduce retry count for ${taskType} - averaging ${avgRetries.toFixed(1)} retries`,
                    priority: 'medium',
                    actionable: true
                });
            }
        }

        // Check for patterns with declining performance
        for (const pattern of this.patterns.values()) {
            const recentUses = this.metrics
                .filter(m => pattern.taskTypes.includes(m.taskType))
                .slice(-20);

            if (recentUses.length >= 10) {
                const recentSuccess = recentUses.filter(m => m.success).length / recentUses.length;
                if (recentSuccess < pattern.successRate * 0.8) {
                    suggestions.push({
                        area: pattern.name,
                        currentPerformance: recentSuccess,
                        targetPerformance: pattern.successRate,
                        suggestion: `Pattern "${pattern.name}" performance declining - review and update strategy`,
                        priority: 'high',
                        actionable: true
                    });
                }
            }
        }

        this.emit('improvements:generated', suggestions);
        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    // ========================================================================
    // CAPABILITY EXTENSION
    // ========================================================================

    /**
     * Learn a new capability from examples
     */
    async learnCapability(
        name: string,
        description: string,
        examples: Array<{ input: string; output: string }>
    ): Promise<LearnedPattern> {
        console.log(`📚 Learning new capability: ${name}`);

        const prompt = `Analyze these examples and extract the pattern for this capability.

Capability: ${name}
Description: ${description}

Examples:
${examples.map((e, i) => `${i + 1}. Input: ${e.input}\n   Output: ${e.output}`).join('\n\n')}

Extract the core strategy. Respond in JSON:
\`\`\`json
{
    "strategy": "step by step approach",
    "keyPrinciples": ["principle1", "principle2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        const pattern: LearnedPattern = {
            id: `capability-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
            name,
            description,
            taskTypes: [name],
            successRate: 1.0,
            avgExecutionTime: 0,
            strategy: parsed.strategy || description,
            examples: parsed.keyPrinciples || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            useCount: 0
        };

        this.patterns.set(pattern.id, pattern);
        await this.saveState();

        this.emit('capability:learned', pattern);
        return pattern;
    }

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    private async saveState(): Promise<void> {
        try {
            const state = {
                metrics: this.metrics.slice(-500),
                patterns: Array.from(this.patterns.entries()),
                strategies: Array.from(this.strategySuggestions.entries()),
                savedAt: new Date()
            };
            await writeFile(
                join(this.dataPath, 'evolution-state.json'),
                JSON.stringify(state, null, 2)
            );
        } catch (error) {
            console.error('Failed to save evolution state:', error);
        }
    }

    private async loadState(): Promise<void> {
        try {
            const data = await readFile(join(this.dataPath, 'evolution-state.json'), 'utf-8');
            const state = JSON.parse(data);

            this.metrics = state.metrics || [];
            this.patterns = new Map(state.patterns || []);
            this.strategySuggestions = new Map(state.strategies || []);

            console.log(`  Loaded ${this.metrics.length} metrics, ${this.patterns.size} patterns`);
        } catch {
            // No existing state
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async callModel(prompt: string): Promise<string> {
        try {
            return await this.modelManager.chat([
                {
                    role: 'system' as const,
                    content: 'You are an AI performance analyst. Analyze patterns and suggest improvements.',
                    timestamp: new Date()
                },
                {
                    role: 'user' as const,
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
        } catch {
            return '{}';
        }
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    getStats(): EvolutionStats {
        const successfulMetrics = this.metrics.filter(m => m.success);
        return {
            totalTasks: this.metrics.length,
            successRate: this.metrics.length > 0
                ? successfulMetrics.length / this.metrics.length
                : 0,
            avgExecutionTime: successfulMetrics.length > 0
                ? successfulMetrics.reduce((s, m) => s + m.executionTime, 0) / successfulMetrics.length
                : 0,
            learnedPatterns: this.patterns.size,
            improvementScore: this.calculateImprovementScore(),
            lastEvolved: new Date()
        };
    }

    private calculateImprovementScore(): number {
        if (this.metrics.length < 20) return 0.5;

        const recentMetrics = this.metrics.slice(-50);
        const olderMetrics = this.metrics.slice(-100, -50);

        if (olderMetrics.length === 0) return 0.5;

        const recentSuccess = recentMetrics.filter(m => m.success).length / recentMetrics.length;
        const olderSuccess = olderMetrics.filter(m => m.success).length / olderMetrics.length;

        return Math.min(1, Math.max(0, 0.5 + (recentSuccess - olderSuccess)));
    }

    getPatterns(): LearnedPattern[] {
        return Array.from(this.patterns.values());
    }

    getPattern(id: string): LearnedPattern | undefined {
        return this.patterns.get(id);
    }

    getRecentMetrics(limit: number = 20): PerformanceMetric[] {
        return this.metrics.slice(-limit);
    }

    clearMetrics(): void {
        this.metrics = [];
        this.emit('metrics:cleared');
    }
}

// Export singleton
export const selfEvolutionEngine = SelfEvolutionEngine.getInstance();
