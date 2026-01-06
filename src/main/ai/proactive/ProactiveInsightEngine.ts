/**
 * Proactive Insight Engine
 * 
 * Anticipates user needs before they ask by detecting patterns,
 * monitoring code quality trends, and suggesting optimizations.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectContext {
    projectPath: string;
    language: string;
    framework?: string;
    recentFiles: string[];
    recentCommands: string[];
    userPatterns: UserPattern[];
}

export interface UserPattern {
    type: 'workflow' | 'preference' | 'habit';
    description: string;
    frequency: number;
    lastOccurrence: Date;
    confidence: number;
}

export interface ProactiveInsight {
    id: string;
    type: 'optimization' | 'warning' | 'suggestion' | 'automation' | 'learning';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    suggestedAction?: string;
    command?: string;
    relatedFiles?: string[];
    confidence: number;
    createdAt: Date;
    dismissed?: boolean;
}

export interface CodeQualityTrend {
    metric: string;
    current: number;
    previous: number;
    trend: 'improving' | 'stable' | 'declining';
    history: { date: Date; value: number }[];
}

export interface DependencyHealth {
    name: string;
    currentVersion: string;
    latestVersion: string;
    outdated: boolean;
    vulnerabilities: number;
    lastChecked: Date;
}

export interface WorkflowAutomation {
    id: string;
    name: string;
    trigger: string;
    actions: string[];
    timeSaved: number; // minutes per occurrence
    occurrences: number;
}

// ============================================================================
// PROACTIVE INSIGHT ENGINE
// ============================================================================

export class ProactiveInsightEngine extends EventEmitter {
    private static instance: ProactiveInsightEngine;

    // Pattern tracking
    private userPatterns: Map<string, UserPattern> = new Map();
    private actionHistory: { action: string; timestamp: Date }[] = [];

    // Insights
    private insights: ProactiveInsight[] = [];
    private dismissedInsights: Set<string> = new Set();

    // Quality tracking
    private qualityTrends: Map<string, CodeQualityTrend> = new Map();
    private dependencyHealth: Map<string, DependencyHealth> = new Map();

    // Automation suggestions
    private automations: WorkflowAutomation[] = [];

    private constructor() {
        super();
        this.initializeDefaultPatterns();
        console.log('[ProactiveInsightEngine] Initialized');
    }

    static getInstance(): ProactiveInsightEngine {
        if (!ProactiveInsightEngine.instance) {
            ProactiveInsightEngine.instance = new ProactiveInsightEngine();
        }
        return ProactiveInsightEngine.instance;
    }

    // ========================================================================
    // ACTION TRACKING
    // ========================================================================

    /**
     * Track a user action for pattern detection
     */
    trackAction(action: string, metadata?: Record<string, any>): void {
        this.actionHistory.push({
            action,
            timestamp: new Date()
        });

        // Keep only last 1000 actions
        if (this.actionHistory.length > 1000) {
            this.actionHistory = this.actionHistory.slice(-500);
        }

        // Detect patterns from action
        this.detectPatterns(action, metadata);
        this.emit('action:tracked', { action, metadata });
    }

    /**
     * Detect patterns from user actions
     */
    private detectPatterns(action: string, metadata?: Record<string, any>): void {
        // Check for repetitive actions
        const recentActions = this.actionHistory.slice(-10).map(a => a.action);
        const actionCount = recentActions.filter(a => a === action).length;

        if (actionCount >= 3) {
            const patternKey = `repeat:${action}`;
            const existing = this.userPatterns.get(patternKey);

            if (existing) {
                existing.frequency++;
                existing.lastOccurrence = new Date();
                existing.confidence = Math.min(0.95, existing.confidence + 0.05);
            } else {
                this.userPatterns.set(patternKey, {
                    type: 'habit',
                    description: `Frequently performs: ${action}`,
                    frequency: actionCount,
                    lastOccurrence: new Date(),
                    confidence: 0.6
                });

                // Generate automation suggestion
                this.suggestAutomation(action, actionCount);
            }
        }

        // Detect workflow patterns (sequences)
        if (this.actionHistory.length >= 5) {
            const sequence = this.actionHistory.slice(-5).map(a => a.action).join(' → ');
            this.detectSequencePattern(sequence);
        }
    }

    /**
     * Detect repeating sequence patterns
     */
    private detectSequencePattern(sequence: string): void {
        const sequences = this.getRecentSequences(5);
        const matchCount = sequences.filter(s => s === sequence).length;

        if (matchCount >= 2) {
            const patternKey = `sequence:${sequence.slice(0, 50)}`;

            if (!this.userPatterns.has(patternKey)) {
                this.userPatterns.set(patternKey, {
                    type: 'workflow',
                    description: `Common workflow: ${sequence}`,
                    frequency: matchCount,
                    lastOccurrence: new Date(),
                    confidence: 0.7
                });

                // Suggest workflow automation
                this.createInsight({
                    type: 'automation',
                    title: 'Workflow Automation Opportunity',
                    description: `You frequently perform this sequence: ${sequence}. Consider creating a shortcut.`,
                    impact: 'medium',
                    actionable: true,
                    suggestedAction: 'Create workflow command',
                    confidence: 0.75
                });
            }
        }
    }

    /**
     * Get recent action sequences
     */
    private getRecentSequences(length: number): string[] {
        const sequences: string[] = [];

        for (let i = length; i < this.actionHistory.length; i++) {
            const seq = this.actionHistory
                .slice(i - length, i)
                .map(a => a.action)
                .join(' → ');
            sequences.push(seq);
        }

        return sequences;
    }

    // ========================================================================
    // INSIGHT GENERATION
    // ========================================================================

    /**
     * Generate insights from current context
     */
    generateInsights(context: ProjectContext): ProactiveInsight[] {
        const newInsights: ProactiveInsight[] = [];

        // Code quality insights
        const qualityInsights = this.generateQualityInsights();
        newInsights.push(...qualityInsights);

        // Workflow optimization insights
        const workflowInsights = this.generateWorkflowInsights(context);
        newInsights.push(...workflowInsights);

        // Dependency health insights
        const depInsights = this.generateDependencyInsights();
        newInsights.push(...depInsights);

        // Learning opportunity insights
        const learningInsights = this.generateLearningInsights(context);
        newInsights.push(...learningInsights);

        // Filter already dismissed
        const filtered = newInsights.filter(i => !this.dismissedInsights.has(i.id));

        // Add to main list
        this.insights.push(...filtered);

        for (const insight of filtered) {
            this.emit('insight:generated', insight);
        }

        return filtered;
    }

    /**
     * Generate code quality insights
     */
    private generateQualityInsights(): ProactiveInsight[] {
        const insights: ProactiveInsight[] = [];

        for (const [metric, trend] of this.qualityTrends) {
            if (trend.trend === 'declining' && trend.current < 0.7 * trend.previous) {
                insights.push(this.createInsight({
                    type: 'warning',
                    title: `${metric} Quality Declining`,
                    description: `${metric} has dropped from ${trend.previous.toFixed(1)} to ${trend.current.toFixed(1)}`,
                    impact: 'high',
                    actionable: true,
                    suggestedAction: `Review recent changes affecting ${metric}`,
                    confidence: 0.85
                }));
            }
        }

        return insights;
    }

    /**
     * Generate workflow optimization insights
     */
    private generateWorkflowInsights(context: ProjectContext): ProactiveInsight[] {
        const insights: ProactiveInsight[] = [];

        // Check for inefficient patterns
        for (const [_, pattern] of this.userPatterns) {
            if (pattern.type === 'habit' && pattern.frequency >= 10) {
                insights.push(this.createInsight({
                    type: 'optimization',
                    title: 'Repetitive Task Detected',
                    description: pattern.description,
                    impact: 'medium',
                    actionable: true,
                    suggestedAction: 'Create a shortcut or automation',
                    confidence: pattern.confidence
                }));
            }
        }

        // Suggest based on project type
        if (context.framework === 'react' && !context.recentCommands.some(c => c.includes('test'))) {
            insights.push(this.createInsight({
                type: 'suggestion',
                title: 'Consider Running Tests',
                description: "You haven't run tests recently. Regular testing helps catch issues early.",
                impact: 'medium',
                actionable: true,
                command: 'npm test',
                confidence: 0.7
            }));
        }

        return insights;
    }

    /**
     * Generate dependency health insights
     */
    private generateDependencyInsights(): ProactiveInsight[] {
        const insights: ProactiveInsight[] = [];

        for (const [name, health] of this.dependencyHealth) {
            if (health.vulnerabilities > 0) {
                insights.push(this.createInsight({
                    type: 'warning',
                    title: `Security Vulnerability in ${name}`,
                    description: `${health.vulnerabilities} known vulnerabilities found`,
                    impact: 'high',
                    actionable: true,
                    command: `npm update ${name}`,
                    suggestedAction: `Update ${name} from ${health.currentVersion} to ${health.latestVersion}`,
                    confidence: 0.95
                }));
            } else if (health.outdated) {
                insights.push(this.createInsight({
                    type: 'suggestion',
                    title: `Update Available for ${name}`,
                    description: `${health.currentVersion} → ${health.latestVersion}`,
                    impact: 'low',
                    actionable: true,
                    command: `npm install ${name}@latest`,
                    confidence: 0.8
                }));
            }
        }

        return insights;
    }

    /**
     * Generate learning opportunity insights
     */
    private generateLearningInsights(context: ProjectContext): ProactiveInsight[] {
        const insights: ProactiveInsight[] = [];

        // Detect potential for learning
        const uniquePatterns = Array.from(this.userPatterns.values())
            .filter(p => p.confidence > 0.7);

        if (uniquePatterns.length >= 5) {
            insights.push(this.createInsight({
                type: 'learning',
                title: 'Your Productivity Patterns',
                description: `I've identified ${uniquePatterns.length} distinct work patterns. Would you like recommendations to optimize your workflow?`,
                impact: 'medium',
                actionable: true,
                confidence: 0.8
            }));
        }

        return insights;
    }

    /**
     * Create an insight with defaults
     */
    private createInsight(partial: Omit<ProactiveInsight, 'id' | 'createdAt'>): ProactiveInsight {
        return {
            ...partial,
            id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            createdAt: new Date()
        };
    }

    // ========================================================================
    // AUTOMATIONS
    // ========================================================================

    /**
     * Suggest an automation for a repetitive action
     */
    private suggestAutomation(action: string, frequency: number): void {
        const automation: WorkflowAutomation = {
            id: `auto-${Date.now()}`,
            name: `Shortcut for: ${action.slice(0, 30)}`,
            trigger: action,
            actions: [action],
            timeSaved: 0.5, // 30 seconds per occurrence
            occurrences: frequency
        };

        this.automations.push(automation);
        this.emit('automation:suggested', automation);
    }

    /**
     * Get all automation suggestions
     */
    getAutomations(): WorkflowAutomation[] {
        return this.automations;
    }

    // ========================================================================
    // QUALITY TRACKING
    // ========================================================================

    /**
     * Update a quality metric
     */
    updateQualityMetric(metric: string, value: number): void {
        const existing = this.qualityTrends.get(metric);

        if (existing) {
            existing.previous = existing.current;
            existing.current = value;
            existing.history.push({ date: new Date(), value });

            // Determine trend
            if (value > existing.previous * 1.05) {
                existing.trend = 'improving';
            } else if (value < existing.previous * 0.95) {
                existing.trend = 'declining';
            } else {
                existing.trend = 'stable';
            }
        } else {
            this.qualityTrends.set(metric, {
                metric,
                current: value,
                previous: value,
                trend: 'stable',
                history: [{ date: new Date(), value }]
            });
        }
    }

    /**
     * Update dependency health
     */
    updateDependencyHealth(health: DependencyHealth): void {
        this.dependencyHealth.set(health.name, health);
    }

    // ========================================================================
    // INSIGHT MANAGEMENT
    // ========================================================================

    /**
     * Get all active insights
     */
    getActiveInsights(): ProactiveInsight[] {
        return this.insights.filter(i => !i.dismissed && !this.dismissedInsights.has(i.id));
    }

    /**
     * Get insights by type
     */
    getInsightsByType(type: ProactiveInsight['type']): ProactiveInsight[] {
        return this.getActiveInsights().filter(i => i.type === type);
    }

    /**
     * Dismiss an insight
     */
    dismissInsight(insightId: string): void {
        this.dismissedInsights.add(insightId);
        const insight = this.insights.find(i => i.id === insightId);
        if (insight) {
            insight.dismissed = true;
            this.emit('insight:dismissed', insight);
        }
    }

    /**
     * Mark insight as acted upon
     */
    markActedUpon(insightId: string): void {
        const insight = this.insights.find(i => i.id === insightId);
        if (insight) {
            this.dismissedInsights.add(insightId);
            this.emit('insight:acted', insight);
        }
    }

    // ========================================================================
    // INITIALIZATION & UTILITIES
    // ========================================================================

    /**
     * Initialize default patterns
     */
    private initializeDefaultPatterns(): void {
        // Add some common patterns
        this.userPatterns.set('default:commit-before-push', {
            type: 'workflow',
            description: 'Always commit before pushing',
            frequency: 0,
            lastOccurrence: new Date(),
            confidence: 0.9
        });
    }

    /**
     * Get all detected patterns
     */
    getPatterns(): UserPattern[] {
        return Array.from(this.userPatterns.values());
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalInsights: number;
        activeInsights: number;
        patternsDetected: number;
        automationsSuggested: number;
        metricsTracked: number;
    } {
        return {
            totalInsights: this.insights.length,
            activeInsights: this.getActiveInsights().length,
            patternsDetected: this.userPatterns.size,
            automationsSuggested: this.automations.length,
            metricsTracked: this.qualityTrends.size
        };
    }
}

// Export singleton
export const proactiveInsightEngine = ProactiveInsightEngine.getInstance();
