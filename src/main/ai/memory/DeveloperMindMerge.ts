/**
 * DeveloperMindMerge
 * 
 * Learns developer's coding patterns, style preferences, and thought processes
 * to provide increasingly personalized assistance over time.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface CodingPattern {
    id: string;
    category: 'naming' | 'structure' | 'debugging' | 'refactoring' | 'testing' | 'documentation';
    pattern: string;
    frequency: number;
    lastSeen: Date;
    examples: string[];
}

export interface StylePreference {
    category: string;
    preference: string;
    confidence: number;
    examples: string[];
}

export interface ThoughtProcess {
    trigger: string;
    action: string;
    context: string;
    frequency: number;
}

export interface DeveloperProfile {
    id: string;
    createdAt: Date;
    lastActive: Date;
    totalInteractions: number;
    patterns: CodingPattern[];
    styles: StylePreference[];
    thoughts: ThoughtProcess[];
    preferences: Record<string, any>;
    learningProgress: number; // 0-100, how well we know this developer
}

export interface MindMergeConfig {
    enabled: boolean;
    learningRate: number; // How fast to learn patterns
    patternThreshold: number; // Min occurrences to consider a pattern
    profilePersistence: boolean;
}

// ============================================================================
// DEVELOPER MIND MERGE
// ============================================================================

export class DeveloperMindMerge extends EventEmitter {
    private static instance: DeveloperMindMerge;
    private profiles: Map<string, DeveloperProfile> = new Map();
    private activeProfile: DeveloperProfile | null = null;

    private config: MindMergeConfig = {
        enabled: true,
        learningRate: 0.1,
        patternThreshold: 3,
        profilePersistence: true
    };

    private constructor() {
        super();
    }

    static getInstance(): DeveloperMindMerge {
        if (!DeveloperMindMerge.instance) {
            DeveloperMindMerge.instance = new DeveloperMindMerge();
        }
        return DeveloperMindMerge.instance;
    }

    // -------------------------------------------------------------------------
    // Profile Management
    // -------------------------------------------------------------------------

    /**
     * Get or create developer profile
     */
    getOrCreateProfile(developerId: string): DeveloperProfile {
        if (!this.profiles.has(developerId)) {
            const profile: DeveloperProfile = {
                id: developerId,
                createdAt: new Date(),
                lastActive: new Date(),
                totalInteractions: 0,
                patterns: [],
                styles: [],
                thoughts: [],
                preferences: {},
                learningProgress: 0
            };
            this.profiles.set(developerId, profile);
            this.emit('profileCreated', profile);
        }

        return this.profiles.get(developerId)!;
    }

    /**
     * Set active profile
     */
    setActiveProfile(developerId: string): DeveloperProfile {
        this.activeProfile = this.getOrCreateProfile(developerId);
        this.activeProfile.lastActive = new Date();
        this.emit('profileActivated', this.activeProfile);
        return this.activeProfile;
    }

    // -------------------------------------------------------------------------
    // Pattern Learning
    // -------------------------------------------------------------------------

    /**
     * Learn from code written by developer
     */
    learnFromCode(code: string, context?: string): void {
        if (!this.config.enabled || !this.activeProfile) return;

        // Analyze naming patterns
        this.analyzeNamingPatterns(code);

        // Analyze structural patterns
        this.analyzeStructuralPatterns(code);

        // Analyze documentation style
        this.analyzeDocumentationStyle(code);

        this.activeProfile.totalInteractions++;
        this.updateLearningProgress();
        this.emit('codeLearned', { code: code.substring(0, 100), context });
    }

    /**
     * Learn from debugging session
     */
    learnFromDebugging(problem: string, solution: string): void {
        if (!this.config.enabled || !this.activeProfile) return;

        const pattern: CodingPattern = {
            id: `debug_${Date.now()}`,
            category: 'debugging',
            pattern: this.extractPattern(problem, solution),
            frequency: 1,
            lastSeen: new Date(),
            examples: [solution]
        };

        this.addOrUpdatePattern(pattern);
        this.emit('debuggingLearned', { problem, solution });
    }

    /**
     * Learn from refactoring action
     */
    learnFromRefactoring(before: string, after: string, reason?: string): void {
        if (!this.config.enabled || !this.activeProfile) return;

        const thought: ThoughtProcess = {
            trigger: this.summarizeCode(before),
            action: 'refactor',
            context: reason || 'Code improvement',
            frequency: 1
        };

        this.addOrUpdateThought(thought);
        this.emit('refactoringLearned', { before: before.substring(0, 50), after: after.substring(0, 50) });
    }

    // -------------------------------------------------------------------------
    // Pattern Application
    // -------------------------------------------------------------------------

    /**
     * Complete code based on learned patterns
     */
    predictCompletion(partialCode: string, context?: string): string[] {
        if (!this.activeProfile) return [];

        const predictions: string[] = [];

        // Check for matching patterns
        for (const pattern of this.activeProfile.patterns) {
            if (this.matchesPattern(partialCode, pattern)) {
                predictions.push(...pattern.examples.slice(0, 2));
            }
        }

        // Check for thought process triggers
        for (const thought of this.activeProfile.thoughts) {
            if (partialCode.includes(thought.trigger)) {
                predictions.push(`// Consider: ${thought.action} - ${thought.context}`);
            }
        }

        return predictions.slice(0, 5);
    }

    /**
     * Suggest based on developer's style
     */
    suggestStyle(category: string): StylePreference | null {
        if (!this.activeProfile) return null;

        return this.activeProfile.styles.find(s => s.category === category) || null;
    }

    /**
     * Predict what developer will do next
     */
    predictNextAction(currentContext: string): string[] {
        if (!this.activeProfile) return [];

        const predictions: string[] = [];

        // Based on thoughts and patterns
        for (const thought of this.activeProfile.thoughts) {
            if (currentContext.includes(thought.trigger)) {
                predictions.push(thought.action);
            }
        }

        return predictions;
    }

    // -------------------------------------------------------------------------
    // Profile Insights
    // -------------------------------------------------------------------------

    /**
     * Get developer insights
     */
    getInsights(): {
        strongPatterns: CodingPattern[];
        preferredStyles: StylePreference[];
        commonThoughts: ThoughtProcess[];
        learningProgress: number;
        recommendations: string[];
    } {
        if (!this.activeProfile) {
            return {
                strongPatterns: [],
                preferredStyles: [],
                commonThoughts: [],
                learningProgress: 0,
                recommendations: ['Start coding to build your profile']
            };
        }

        const strongPatterns = this.activeProfile.patterns
            .filter(p => p.frequency >= this.config.patternThreshold)
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);

        const preferredStyles = this.activeProfile.styles
            .filter(s => s.confidence > 0.7)
            .slice(0, 5);

        const commonThoughts = this.activeProfile.thoughts
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);

        const recommendations = this.generateRecommendations();

        return {
            strongPatterns,
            preferredStyles,
            commonThoughts,
            learningProgress: this.activeProfile.learningProgress,
            recommendations
        };
    }

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    setConfig(config: Partial<MindMergeConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): MindMergeConfig {
        return { ...this.config };
    }

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------

    private analyzeNamingPatterns(code: string): void {
        // Extract variable/function names
        const camelCase = code.match(/[a-z][a-zA-Z0-9]*/g) || [];
        const snakeCase = code.match(/[a-z]+_[a-z_]*/g) || [];

        if (camelCase.length > snakeCase.length * 2) {
            this.addOrUpdateStyle('naming', 'camelCase', camelCase.slice(0, 3));
        } else if (snakeCase.length > camelCase.length * 2) {
            this.addOrUpdateStyle('naming', 'snake_case', snakeCase.slice(0, 3));
        }
    }

    private analyzeStructuralPatterns(code: string): void {
        // Check for early returns
        if (code.includes('if (') && code.includes('return;')) {
            this.addOrUpdateStyle('structure', 'early-return', ['Prefers early returns']);
        }

        // Check for functional style
        if (code.includes('.map(') || code.includes('.filter(') || code.includes('.reduce(')) {
            this.addOrUpdateStyle('structure', 'functional', ['Uses functional methods']);
        }

        // Check for async style
        if (code.includes('async ') && code.includes('await ')) {
            this.addOrUpdateStyle('async', 'async-await', ['Prefers async/await']);
        }
    }

    private analyzeDocumentationStyle(code: string): void {
        const hasJSDoc = code.includes('/**');
        const hasLineComments = code.includes('//');

        if (hasJSDoc) {
            this.addOrUpdateStyle('documentation', 'jsdoc', ['Uses JSDoc']);
        }
        if (hasLineComments) {
            this.addOrUpdateStyle('documentation', 'inline-comments', ['Uses inline comments']);
        }
    }

    private addOrUpdatePattern(pattern: CodingPattern): void {
        if (!this.activeProfile) return;

        const existing = this.activeProfile.patterns.find(
            p => p.category === pattern.category && p.pattern === pattern.pattern
        );

        if (existing) {
            existing.frequency++;
            existing.lastSeen = new Date();
            existing.examples = [...new Set([...existing.examples, ...pattern.examples])].slice(0, 5);
        } else {
            this.activeProfile.patterns.push(pattern);
        }
    }

    private addOrUpdateStyle(category: string, preference: string, examples: string[]): void {
        if (!this.activeProfile) return;

        const existing = this.activeProfile.styles.find(
            s => s.category === category
        );

        if (existing) {
            if (existing.preference === preference) {
                existing.confidence = Math.min(1, existing.confidence + this.config.learningRate);
            } else {
                existing.confidence = Math.max(0, existing.confidence - this.config.learningRate / 2);
                if (existing.confidence < 0.3) {
                    existing.preference = preference;
                    existing.confidence = 0.5;
                }
            }
            existing.examples = [...new Set([...existing.examples, ...examples])].slice(0, 5);
        } else {
            this.activeProfile.styles.push({
                category,
                preference,
                confidence: 0.5,
                examples
            });
        }
    }

    private addOrUpdateThought(thought: ThoughtProcess): void {
        if (!this.activeProfile) return;

        const existing = this.activeProfile.thoughts.find(
            t => t.trigger === thought.trigger && t.action === thought.action
        );

        if (existing) {
            existing.frequency++;
        } else {
            this.activeProfile.thoughts.push(thought);
        }
    }

    private extractPattern(problem: string, solution: string): string {
        // Simple pattern extraction
        return `${problem.substring(0, 50)} → ${solution.substring(0, 50)}`;
    }

    private summarizeCode(code: string): string {
        // Extract first meaningful line
        const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('//'));
        return lines[0]?.substring(0, 50) || 'code';
    }

    private matchesPattern(code: string, pattern: CodingPattern): boolean {
        return code.toLowerCase().includes(pattern.pattern.toLowerCase().substring(0, 20));
    }

    private updateLearningProgress(): void {
        if (!this.activeProfile) return;

        const patternScore = Math.min(50, this.activeProfile.patterns.length * 5);
        const styleScore = Math.min(30, this.activeProfile.styles.length * 10);
        const thoughtScore = Math.min(20, this.activeProfile.thoughts.length * 5);

        this.activeProfile.learningProgress = patternScore + styleScore + thoughtScore;
    }

    private generateRecommendations(): string[] {
        const recommendations: string[] = [];

        if (!this.activeProfile) return recommendations;

        if (this.activeProfile.patterns.length < 5) {
            recommendations.push('Write more code to learn your patterns');
        }

        if (this.activeProfile.styles.length < 3) {
            recommendations.push('Your style preferences are still being learned');
        }

        if (this.activeProfile.learningProgress > 70) {
            recommendations.push('Profile is well-developed! AI will adapt to your style');
        }

        return recommendations;
    }
}

// Export singleton
export const developerMindMerge = DeveloperMindMerge.getInstance();
