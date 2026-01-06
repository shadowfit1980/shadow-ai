/**
 * User Intent Prediction System
 * 
 * Anticipates what the user wants to do next based on context and patterns
 * Provides proactive suggestions and prepares resources in advance
 */

import { ModelManager } from '../ModelManager';
import { getMemoryEngine } from '../memory';

export interface UserIntent {
    id: string;
    primary: string; // Main intent
    subIntents: string[]; // Related intentions
    confidence: number;
    evidence: string[]; // Why we believe this
    suggestedActions: Array<{
        action: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
    }>;
    timestamp: Date;
}

export interface UserContext {
    currentFile?: string;
    openFiles?: string[];
    recentEdits?: Array<{
        file: string;
        type: string;
        timestamp: Date;
    }>;
    recentCommands?: string[];
    projectPhase?: 'planning' | 'development' | 'debugging' | 'optimization' | 'deployment';
    currentTask?: string;
}

export interface IntentPattern {
    pattern: string;
    triggers: string[];
    nextLikelyActions: string[];
    confidence: number;
    occurrences: number;
}

export class UserIntentPredictor {
    private static instance: UserIntentPredictor;
    private modelManager: ModelManager;
    private memory = getMemoryEngine();

    // Learn patterns from user behavior
    private intentPatterns: Map<string, IntentPattern> = new Map();

    // Track user action sequences
    private actionHistory: Array<{
        action: string;
        context: UserContext;
        timestamp: Date;
    }> = [];

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.initializeCommonPatterns();
    }

    static getInstance(): UserIntentPredictor {
        if (!UserIntentPredictor.instance) {
            UserIntentPredictor.instance = new UserIntentPredictor();
        }
        return UserIntentPredictor.instance;
    }

    /**
     * Predict user's intent based on current context
     */
    async predictIntent(context: UserContext): Promise<UserIntent> {
        console.log('🔮 Predicting user intent...');

        // Analyze recent patterns
        const recentPattern = this.findRecentPattern(context);

        // Use AI to predict intent
        const aiPrediction = await this.predictWithAI(context);

        // Combine pattern-based and AI predictions
        const combined = this.combinePredictions(recentPattern, aiPrediction);

        // Generate suggested actions
        const suggestedActions = await this.generateSuggestions(combined, context);

        const intent: UserIntent = {
            id: `intent-${Date.now()}`,
            primary: combined.primary,
            subIntents: combined.subIntents,
            confidence: combined.confidence,
            evidence: combined.evidence,
            suggestedActions,
            timestamp: new Date()
        };

        console.log(`✅ Predicted intent: ${intent.primary} (${(intent.confidence * 100).toFixed(0)}% confident)`);

        return intent;
    }

    /**
     * Learn from user actions to improve predictions
     */
    recordAction(action: string, context: UserContext): void {
        this.actionHistory.push({
            action,
            context,
            timestamp: new Date()
        });

        // Keep history manageable
        if (this.actionHistory.length > 1000) {
            this.actionHistory = this.actionHistory.slice(-500);
        }

        // Update patterns
        this.updatePatterns(action, context);
    }

    /**
     * Anticipate next actions based on sequence
     */
    async anticipateNextActions(
        currentAction: string,
        context: UserContext
    ): Promise<Array<{
        action: string;
        probability: number;
        reasoning: string;
    }>> {
        console.log('🎯 Anticipating next actions...');

        // Find similar historical sequences
        const similarSequences = this.findSimilarSequences(currentAction, context);

        // Use AI to predict next steps
        const prompt = `Given the current action and context, predict the next 3-5 most likely actions:

## Current Action
${currentAction}

## Context
- Current file: ${context.currentFile || 'none'}
- Open files: ${context.openFiles?.join(', ') || 'none'}
- Project phase: ${context.projectPhase || 'unknown'}
- Current task: ${context.currentTask || 'none'}

## Recent pattern
${similarSequences.slice(0, 3).map(seq => `- ${seq.pattern}`).join('\n')}

Predict next actions with probabilities and reasoning.

Response in JSON:
\`\`\`json
{
  "nextActions": [
    {
      "action": "Run tests",
      "probability": 0.85,
      "reasoning": "User typically tests after implementing feature"
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseNextActionsResponse(response);

        return parsed.nextActions || [];
    }

    /**
     * Detect user frustration or confusion
     */
    async detectUserState(context: UserContext): Promise<{
        state: 'productive' | 'frustrated' | 'confused' | 'stuck';
        confidence: number;
        indicators: string[];
        suggestions: string[];
    }> {
        console.log('🧠 Detecting user state...');

        const recentActions = this.actionHistory.slice(-10);

        // Look for frustration indicators
        const indicators: string[] = [];

        // Repeated similar actions
        const actionCounts = new Map<string, number>();
        recentActions.forEach(a => {
            actionCounts.set(a.action, (actionCounts.get(a.action) || 0) + 1);
        });

        const repeated = Array.from(actionCounts.entries())
            .filter(([_, count]) => count >= 3);

        if (repeated.length > 0) {
            indicators.push(`Repeated action: ${repeated[0][0]}`);
        }

        // Rapid file switching
        const fileSwitches = recentActions.filter(a =>
            a.action.includes('open') || a.action.includes('switch')
        ).length;

        if (fileSwitches > 5) {
            indicators.push('Rapid file switching');
        }

        // Determine state
        let state: 'productive' | 'frustrated' | 'confused' | 'stuck' = 'productive';
        let confidence = 0.6;

        if (indicators.length >= 2) {
            state = 'frustrated';
            confidence = 0.8;
        } else if (repeated.length > 0) {
            state = 'stuck';
            confidence = 0.7;
        }

        // Generate suggestions
        const suggestions = await this.generateHelpSuggestions(state, context);

        return {
            state,
            confidence,
            indicators,
            suggestions
        };
    }

    /**
     * Proactively suggest improvements
     */
    async suggestProactiveActions(context: UserContext): Promise<Array<{
        category: 'optimization' | 'refactoring' | 'testing' | 'documentation' | 'security';
        suggestion: string;
        impact: 'high' | 'medium' | 'low';
        effort: 'quick' | 'moderate' | 'significant';
    }>> {
        console.log('💡 Generating proactive suggestions...');

        const prompt = `Analyze the current context and suggest proactive improvements:

## Context
- Current file: ${context.currentFile || 'none'}
- Open files: ${context.openFiles?.slice(0, 5).join(', ') || 'none'}
- Project phase: ${context.projectPhase || 'unknown'}

Suggest 3-5 proactive actions across categories: optimization, refactoring, testing, documentation, security.

Response in JSON:
\`\`\`json
{
  "suggestions": [
    {
      "category": "testing",
      "suggestion": "Add unit tests for recently modified functions",
      "impact": "high",
      "effort": "moderate"
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseSuggestionsResponse(response);

        return parsed.suggestions || [];
    }

    // Private methods

    private findRecentPattern(context: UserContext): {
        pattern: string;
        nextLikelyActions: string[];
        confidence: number;
    } {
        // Look for matching patterns in recent history
        const recentActions = this.actionHistory.slice(-5).map(a => a.action);
        const pattern = recentActions.join(' → ');

        // Check learned patterns
        for (const [id, p] of this.intentPatterns) {
            const match = p.triggers.some(trigger =>
                pattern.toLowerCase().includes(trigger.toLowerCase())
            );

            if (match) {
                return {
                    pattern: p.pattern,
                    nextLikelyActions: p.nextLikelyActions,
                    confidence: p.confidence
                };
            }
        }

        return {
            pattern: 'No pattern matched',
            nextLikelyActions: [],
            confidence: 0.3
        };
    }

    private async predictWithAI(context: UserContext): Promise<{
        primary: string;
        subIntents: string[];
        confidence: number;
        evidence: string[];
    }> {
        const prompt = `Predict user intent based on context:

## Context
- Current file: ${context.currentFile || 'none'}
- Open files: ${context.openFiles?.join(', ') || 'none'}
- Recent edits: ${context.recentEdits?.slice(0, 3).map(e => `${e.type} in ${e.file}`).join(', ') || 'none'}
- Project phase: ${context.projectPhase || 'unknown'}

What is the user likely trying to accomplish?

Response in JSON:
\`\`\`json
{
  "primary": "Primary intent",
  "subIntents": ["Related intent 1", "Related intent 2"],
  "confidence": 0.8,
  "evidence": ["Evidence 1", "Evidence 2"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseIntentResponse(response);

        return {
            primary: parsed.primary || 'Unknown',
            subIntents: parsed.subIntents || [],
            confidence: parsed.confidence || 0.5,
            evidence: parsed.evidence || []
        };
    }

    private combinePredictions(
        patternBased: any,
        aiBased: any
    ): {
        primary: string;
        subIntents: string[];
        confidence: number;
        evidence: string[];
    } {
        // Weight AI prediction more heavily
        const aiWeight = 0.7;
        const patternWeight = 0.3;

        const combinedConfidence = (aiBased.confidence * aiWeight) +
            (patternBased.confidence * patternWeight);

        return {
            primary: aiBased.primary,
            subIntents: [...new Set([...aiBased.subIntents, ...patternBased.nextLikelyActions])],
            confidence: combinedConfidence,
            evidence: [
                ...aiBased.evidence,
                patternBased.pattern !== 'No pattern matched'
                    ? `Matches pattern: ${patternBased.pattern}`
                    : ''
            ].filter(Boolean)
        };
    }

    private async generateSuggestions(prediction: any, context: UserContext): Promise<Array<{
        action: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
    }>> {
        const suggestions: Array<{
            action: string
            description: string;
            priority: 'high' | 'medium' | 'low';
        }> = [];

        // Based on intent, suggest actions
        if (prediction.primary.toLowerCase().includes('debug')) {
            suggestions.push({
                action: 'Run debugger',
                description: 'Start debugging session',
                priority: 'high'
            });
            suggestions.push({
                action: 'Check logs',
                description: 'Review error logs',
                priority: 'medium'
            });
        } else if (prediction.primary.toLowerCase().includes('test')) {
            suggestions.push({
                action: 'Run tests',
                description: 'Execute test suite',
                priority: 'high'
            });
        } else if (prediction.primary.toLowerCase().includes('refactor')) {
            suggestions.push({
                action: 'Analyze code',
                description: 'Check for code smells',
                priority: 'medium'
            });
        }

        return suggestions;
    }

    private updatePatterns(action: string, context: UserContext): void {
        // Simple pattern learning - would use more sophisticated ML in production
        const recentActions = this.actionHistory.slice(-3).map(a => a.action);
        const pattern = recentActions.join(' → ');

        const existingPattern = Array.from(this.intentPatterns.values())
            .find(p => p.pattern === pattern);

        if (existingPattern) {
            existingPattern.occurrences++;
            existingPattern.confidence = Math.min(0.95, existingPattern.confidence + 0.05);
        }
    }

    private findSimilarSequences(currentAction: string, context: UserContext): Array<{
        pattern: string;
        similarity: number;
    }> {
        return Array.from(this.intentPatterns.values())
            .map(p => ({
                pattern: p.pattern,
                similarity: p.triggers.some(t => currentAction.includes(t)) ? 0.8 : 0.3
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5);
    }

    private async generateHelpSuggestions(state: string, context: UserContext): Promise<string[]> {
        if (state === 'stuck') {
            return [
                'Try breaking the problem into smaller pieces',
                'Search documentation for similar issues',
                'Take a short break and come back with fresh eyes'
            ];
        } else if (state === 'frustrated') {
            return [
                'Would you like me to help debug this?',
                'Consider using the tree-of-thought reasoning for this problem',
                'Let me analyze this from multiple perspectives'
            ];
        }
        return [];
    }

    private initializeCommonPatterns(): void {
        this.intentPatterns.set('edit-test-cycle', {
            pattern: 'Edit code → Save → Run tests',
            triggers: ['edit', 'modify', 'change'],
            nextLikelyActions: ['Run tests', 'Check output'],
            confidence: 0.85,
            occurrences: 0
        });

        this.intentPatterns.set('debug-cycle', {
            pattern: 'Error → Debug → Fix → Test',
            triggers: ['error', 'exception', 'failed'],
            nextLikelyActions: ['Start debugger', 'Add breakpoint', 'Check stacktrace'],
            confidence: 0.9,
            occurrences: 0
        });

        this.intentPatterns.set('refactor-pattern', {
            pattern: 'Review code → Extract function → Run tests',
            triggers: ['refactor', 'clean', 'improve'],
            nextLikelyActions: ['Extract function', 'Rename variable', 'Run tests'],
            confidence: 0.8,
            occurrences: 0
        });
    }

    // Response parsers

    private parseIntentResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { primary: 'Unknown', subIntents: [], confidence: 0.5, evidence: [] };
        }
    }

    private parseNextActionsResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { nextActions: [] };
        }
    }

    private parseSuggestionsResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { suggestions: [] };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at understanding user intent and anticipating needs.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
            return response;
        } catch (error) {
            console.error('Error calling model:', error);
            return '{}';
        }
    }
}

// Export singleton
export const userIntentPredictor = UserIntentPredictor.getInstance();
