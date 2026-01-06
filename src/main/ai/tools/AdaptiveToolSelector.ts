/**
 * AdaptiveToolSelector - AI-Powered Tool Selection
 * 
 * Analyzes task descriptions and recommends optimal tools
 * based on semantic matching, historical performance, and context.
 */

import { EventEmitter } from 'events';
import { Tool, ToolMetadata } from './types';
import { toolRegistry } from './ToolRegistry';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface ToolRecommendation {
    toolName: string;
    score: number;
    confidence: number;
    reasoning: string;
    suggestedParams?: Record<string, any>;
}

export interface TaskContext {
    description: string;
    fileTypes?: string[];
    language?: string;
    projectType?: string;
    previousTools?: string[];
    constraints?: string[];
}

export interface ToolPerformanceRecord {
    toolName: string;
    taskPatterns: string[];
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
    lastUsed: Date;
}

export interface RecommendedToolChain {
    steps: ToolRecommendation[];
    totalConfidence: number;
    estimatedDuration: string;
    rationale: string;
}

// ============================================================================
// ADAPTIVE TOOL SELECTOR
// ============================================================================

export class AdaptiveToolSelector extends EventEmitter {
    private static instance: AdaptiveToolSelector;
    private modelManager: ModelManager;
    private performanceRecords: Map<string, ToolPerformanceRecord> = new Map();

    // Keyword-to-category mappings for fast matching
    private categoryKeywords: Map<string, string[]> = new Map([
        ['file', ['read', 'write', 'create', 'delete', 'file', 'folder', 'directory', 'path']],
        ['code', ['refactor', 'analyze', 'lint', 'format', 'parse', 'compile', 'build']],
        ['search', ['find', 'search', 'grep', 'locate', 'query', 'filter']],
        ['git', ['commit', 'push', 'pull', 'branch', 'merge', 'git', 'version']],
        ['test', ['test', 'spec', 'coverage', 'assert', 'mock', 'jest', 'vitest']],
        ['security', ['vulnerability', 'security', 'scan', 'audit', 'credential', 'secret']],
        ['api', ['api', 'request', 'http', 'rest', 'graphql', 'endpoint']],
        ['database', ['database', 'sql', 'query', 'migration', 'schema', 'table']],
        ['deploy', ['deploy', 'publish', 'release', 'docker', 'kubernetes', 'ci/cd']]
    ]);

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): AdaptiveToolSelector {
        if (!AdaptiveToolSelector.instance) {
            AdaptiveToolSelector.instance = new AdaptiveToolSelector();
        }
        return AdaptiveToolSelector.instance;
    }

    // ========================================================================
    // TASK ANALYSIS
    // ========================================================================

    /**
     * Analyze a task and return tool recommendations
     */
    async analyzeTask(description: string, context?: Partial<TaskContext>): Promise<ToolRecommendation[]> {
        console.log(`🔧 [AdaptiveToolSelector] Analyzing task: ${description.substring(0, 50)}...`);

        const taskContext: TaskContext = {
            description,
            ...context
        };

        // Get all available tools
        const tools = toolRegistry.list();

        // Fast keyword-based scoring
        const keywordScores = this.scoreByKeywords(taskContext, tools);

        // Combine with historical performance
        const recommendations = this.combineScores(keywordScores, tools);

        // Sort by score
        recommendations.sort((a, b) => b.score - a.score);

        // Return top recommendations
        const topRecommendations = recommendations.slice(0, 5);

        this.emit('task:analyzed', { description, recommendations: topRecommendations });

        return topRecommendations;
    }

    /**
     * Get AI-enhanced recommendations using the model
     */
    async getAIRecommendations(
        description: string,
        context?: Partial<TaskContext>
    ): Promise<ToolRecommendation[]> {
        const tools = toolRegistry.list();
        const toolSummary = tools.map(t => `- ${t.metadata.name}: ${t.metadata.description}`).join('\n');

        const prompt = `Analyze this task and recommend the best tools to use.

Task: ${description}
${context?.fileTypes ? `File types: ${context.fileTypes.join(', ')}` : ''}
${context?.language ? `Language: ${context.language}` : ''}
${context?.projectType ? `Project type: ${context.projectType}` : ''}

Available tools:
${toolSummary}

Respond in JSON format:
\`\`\`json
{
    "recommendations": [
        {
            "toolName": "tool_name",
            "score": 0.0-1.0,
            "confidence": 0.0-1.0,
            "reasoning": "why this tool is recommended",
            "suggestedParams": {}
        }
    ]
}
\`\`\``;

        try {
            const response = await this.modelManager.chat([
                { role: 'system', content: 'You are a tool selection expert.', timestamp: new Date() },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            const parsed = this.parseJSON(response);
            return parsed.recommendations || [];
        } catch (error) {
            console.error('[AdaptiveToolSelector] AI recommendation failed:', error);
            return this.analyzeTask(description, context);
        }
    }

    // ========================================================================
    // SCORING
    // ========================================================================

    /**
     * Score tools based on keyword matching
     */
    private scoreByKeywords(context: TaskContext, tools: Tool[]): Map<string, number> {
        const scores = new Map<string, number>();
        const descLower = context.description.toLowerCase();

        for (const tool of tools) {
            let score = 0;
            const metadata = tool.metadata;

            // Check tool name relevance
            const nameParts = metadata.name.toLowerCase().split(/[_-]/);
            for (const part of nameParts) {
                if (descLower.includes(part) && part.length > 2) {
                    score += 0.3;
                }
            }

            // Check description keywords
            const descParts = metadata.description.toLowerCase().split(/\s+/);
            for (const part of descParts) {
                if (descLower.includes(part) && part.length > 3) {
                    score += 0.1;
                }
            }

            // Check category keywords
            const category = metadata.category;
            const categoryKw = this.categoryKeywords.get(category) || [];
            for (const kw of categoryKw) {
                if (descLower.includes(kw)) {
                    score += 0.2;
                }
            }

            // Check tags
            for (const tag of metadata.tags || []) {
                if (descLower.includes(tag.toLowerCase())) {
                    score += 0.15;
                }
            }

            // Bonus for file type matches
            if (context.fileTypes) {
                for (const ft of context.fileTypes) {
                    if (metadata.description.toLowerCase().includes(ft.toLowerCase())) {
                        score += 0.2;
                    }
                }
            }

            // Normalize score to 0-1
            scores.set(metadata.name, Math.min(1, score));
        }

        return scores;
    }

    /**
     * Combine keyword scores with historical performance
     */
    private combineScores(keywordScores: Map<string, number>, tools: Tool[]): ToolRecommendation[] {
        const recommendations: ToolRecommendation[] = [];

        for (const tool of tools) {
            const keywordScore = keywordScores.get(tool.metadata.name) || 0;
            const perfRecord = this.performanceRecords.get(tool.metadata.name);

            let perfScore = 0.5; // Default performance score
            if (perfRecord) {
                const total = perfRecord.successCount + perfRecord.failureCount;
                if (total > 0) {
                    perfScore = perfRecord.successCount / total;
                }
            }

            // Weighted combination: 70% keyword, 30% performance
            const finalScore = (keywordScore * 0.7) + (perfScore * 0.3);

            // Only include tools with meaningful scores
            if (finalScore > 0.1) {
                recommendations.push({
                    toolName: tool.metadata.name,
                    score: finalScore,
                    confidence: Math.min(0.95, finalScore + 0.1),
                    reasoning: this.generateReasoning(tool, keywordScore, perfScore)
                });
            }
        }

        return recommendations;
    }

    private generateReasoning(tool: Tool, keywordScore: number, perfScore: number): string {
        const parts: string[] = [];

        if (keywordScore > 0.5) {
            parts.push('High keyword relevance');
        } else if (keywordScore > 0.2) {
            parts.push('Moderate keyword match');
        }

        if (perfScore > 0.8) {
            parts.push('excellent historical performance');
        } else if (perfScore > 0.6) {
            parts.push('good historical performance');
        }

        parts.push(`matches ${tool.metadata.category} category`);

        return parts.join(', ') || 'General purpose tool';
    }

    // ========================================================================
    // TOOL CHAIN GENERATION
    // ========================================================================

    /**
     * Generate a recommended tool chain for complex tasks
     */
    async getSuggestions(description: string): Promise<RecommendedToolChain> {
        const recommendations = await this.analyzeTask(description);

        // Filter to high-confidence recommendations
        const steps = recommendations.filter(r => r.confidence > 0.5);

        // Calculate total confidence
        const totalConfidence = steps.length > 0
            ? steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length
            : 0;

        return {
            steps,
            totalConfidence,
            estimatedDuration: this.estimateDuration(steps),
            rationale: `Selected ${steps.length} tools based on task analysis`
        };
    }

    private estimateDuration(steps: ToolRecommendation[]): string {
        // Rough estimate: 2 seconds per tool + overhead
        const ms = (steps.length * 2000) + 1000;
        if (ms < 10000) return `~${Math.ceil(ms / 1000)}s`;
        return `~${Math.ceil(ms / 60000)}m`;
    }

    // ========================================================================
    // LEARNING
    // ========================================================================

    /**
     * Record tool execution result for learning
     */
    learnFromExecution(
        toolName: string,
        success: boolean,
        executionTimeMs: number,
        taskPattern?: string
    ): void {
        let record = this.performanceRecords.get(toolName);

        if (!record) {
            record = {
                toolName,
                taskPatterns: [],
                successCount: 0,
                failureCount: 0,
                averageExecutionTime: 0,
                lastUsed: new Date()
            };
        }

        // Update counts
        if (success) {
            record.successCount++;
        } else {
            record.failureCount++;
        }

        // Update average execution time
        const total = record.successCount + record.failureCount;
        record.averageExecutionTime =
            (record.averageExecutionTime * (total - 1) + executionTimeMs) / total;

        record.lastUsed = new Date();

        // Track task patterns
        if (taskPattern && !record.taskPatterns.includes(taskPattern)) {
            record.taskPatterns.push(taskPattern);
            if (record.taskPatterns.length > 20) {
                record.taskPatterns.shift();
            }
        }

        this.performanceRecords.set(toolName, record);
        this.emit('tool:learned', { toolName, success, executionTimeMs });
    }

    /**
     * Get performance record for a tool
     */
    getPerformanceRecord(toolName: string): ToolPerformanceRecord | undefined {
        return this.performanceRecords.get(toolName);
    }

    /**
     * Get all performance records
     */
    getAllPerformanceRecords(): ToolPerformanceRecord[] {
        return Array.from(this.performanceRecords.values());
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Score how well a tool fits a specific task
     */
    scoreToolFit(toolName: string, taskDescription: string): number {
        const tool = toolRegistry.get(toolName);
        if (!tool) return 0;

        const scores = this.scoreByKeywords({ description: taskDescription }, [tool]);
        return scores.get(toolName) || 0;
    }

    private parseJSON(text: string): any {
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : text;
            return JSON.parse(jsonStr);
        } catch {
            return {};
        }
    }

    /**
     * Get selector statistics
     */
    getStats(): {
        totalRecords: number;
        topPerformers: string[];
        averageSuccessRate: number;
    } {
        const records = Array.from(this.performanceRecords.values());

        const successRates = records.map(r => {
            const total = r.successCount + r.failureCount;
            return total > 0 ? r.successCount / total : 0.5;
        });

        const avgRate = successRates.length > 0
            ? successRates.reduce((a, b) => a + b, 0) / successRates.length
            : 0.5;

        const topPerformers = records
            .filter(r => r.successCount + r.failureCount >= 3)
            .sort((a, b) => {
                const rateA = a.successCount / (a.successCount + a.failureCount);
                const rateB = b.successCount / (b.successCount + b.failureCount);
                return rateB - rateA;
            })
            .slice(0, 5)
            .map(r => r.toolName);

        return {
            totalRecords: records.length,
            topPerformers,
            averageSuccessRate: avgRate
        };
    }

    /**
     * Clear all performance records
     */
    clear(): void {
        this.performanceRecords.clear();
    }
}

// Export singleton
export const adaptiveToolSelector = AdaptiveToolSelector.getInstance();
