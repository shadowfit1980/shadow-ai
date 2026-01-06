/**
 * Self-Improving Agent
 * 
 * Learns from user corrections, tracks suggestion acceptance,
 * and personalizes responses based on coding style.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface Suggestion {
    id: string;
    type: 'code' | 'refactor' | 'fix' | 'test' | 'docs';
    content: string;
    context: string;
    accepted: boolean | null;
    timestamp: Date;
    feedback?: string;
}

export interface CodingPattern {
    pattern: string;
    frequency: number;
    examples: string[];
    preference: 'preferred' | 'avoided' | 'neutral';
}

export interface UserProfile {
    id: string;
    codingStyle: {
        indentation: 'tabs' | 'spaces';
        indentSize: number;
        semicolons: boolean;
        quotes: 'single' | 'double';
        trailingComma: boolean;
    };
    preferences: {
        verboseComments: boolean;
        preferFunctional: boolean;
        preferClasses: boolean;
        testFramework: string;
    };
    patterns: CodingPattern[];
    acceptanceRate: number;
}

export interface Correction {
    original: string;
    corrected: string;
    reason?: string;
    timestamp: Date;
    context: string;
}

// ============================================================================
// SELF-IMPROVING AGENT
// ============================================================================

export class SelfImprovingAgent extends EventEmitter {
    private static instance: SelfImprovingAgent;
    private suggestions: Map<string, Suggestion> = new Map();
    private corrections: Correction[] = [];
    private userProfile: UserProfile;
    private persistPath: string = '';

    private constructor() {
        super();
        this.userProfile = this.getDefaultProfile();
    }

    static getInstance(): SelfImprovingAgent {
        if (!SelfImprovingAgent.instance) {
            SelfImprovingAgent.instance = new SelfImprovingAgent();
        }
        return SelfImprovingAgent.instance;
    }

    private getDefaultProfile(): UserProfile {
        return {
            id: 'default',
            codingStyle: {
                indentation: 'spaces',
                indentSize: 2,
                semicolons: true,
                quotes: 'single',
                trailingComma: true,
            },
            preferences: {
                verboseComments: false,
                preferFunctional: true,
                preferClasses: true,
                testFramework: 'jest',
            },
            patterns: [],
            acceptanceRate: 0.5,
        };
    }

    // ========================================================================
    // SUGGESTION TRACKING
    // ========================================================================

    /**
     * Record a suggestion
     */
    recordSuggestion(suggestion: Omit<Suggestion, 'id' | 'accepted' | 'timestamp'>): string {
        const id = `sug_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        const fullSuggestion: Suggestion = {
            ...suggestion,
            id,
            accepted: null,
            timestamp: new Date(),
        };

        this.suggestions.set(id, fullSuggestion);
        this.emit('suggestion:recorded', fullSuggestion);

        return id;
    }

    /**
     * Mark suggestion as accepted
     */
    acceptSuggestion(id: string, feedback?: string): void {
        const suggestion = this.suggestions.get(id);
        if (suggestion) {
            suggestion.accepted = true;
            suggestion.feedback = feedback;
            this.updateAcceptanceRate();
            this.emit('suggestion:accepted', suggestion);
        }
    }

    /**
     * Mark suggestion as rejected
     */
    rejectSuggestion(id: string, feedback?: string): void {
        const suggestion = this.suggestions.get(id);
        if (suggestion) {
            suggestion.accepted = false;
            suggestion.feedback = feedback;
            this.updateAcceptanceRate();
            this.emit('suggestion:rejected', suggestion);
        }
    }

    /**
     * Update acceptance rate
     */
    private updateAcceptanceRate(): void {
        const all = Array.from(this.suggestions.values()).filter(s => s.accepted !== null);
        const accepted = all.filter(s => s.accepted === true);
        this.userProfile.acceptanceRate = all.length > 0 ? accepted.length / all.length : 0.5;
    }

    // ========================================================================
    // LEARNING FROM CORRECTIONS
    // ========================================================================

    /**
     * Learn from a user correction
     */
    learnFromCorrection(correction: Omit<Correction, 'timestamp'>): void {
        const fullCorrection: Correction = {
            ...correction,
            timestamp: new Date(),
        };

        this.corrections.push(fullCorrection);

        // Analyze patterns in correction
        this.analyzeCorrection(fullCorrection);

        this.emit('correction:learned', fullCorrection);
    }

    /**
     * Analyze correction to learn patterns
     */
    private analyzeCorrection(correction: Correction): void {
        const { original, corrected } = correction;

        // Detect style changes
        if (original.includes('  ') && corrected.includes('\t')) {
            this.userProfile.codingStyle.indentation = 'tabs';
        }
        if (original.includes('"') && corrected.includes("'")) {
            this.userProfile.codingStyle.quotes = 'single';
        }
        if (original.includes("'") && corrected.includes('"')) {
            this.userProfile.codingStyle.quotes = 'double';
        }
        if (original.endsWith(';') && !corrected.endsWith(';')) {
            this.userProfile.codingStyle.semicolons = false;
        }

        // Detect pattern preferences
        if (original.includes('function') && corrected.includes('=>')) {
            this.addPattern('arrow functions', 'preferred');
        }
        if (original.includes('=>') && corrected.includes('function')) {
            this.addPattern('arrow functions', 'avoided');
        }
        if (original.includes('class') && corrected.includes('function')) {
            this.userProfile.preferences.preferClasses = false;
        }
    }

    /**
     * Add or update a pattern preference
     */
    private addPattern(pattern: string, preference: 'preferred' | 'avoided' | 'neutral'): void {
        const existing = this.userProfile.patterns.find(p => p.pattern === pattern);
        if (existing) {
            existing.frequency++;
            existing.preference = preference;
        } else {
            this.userProfile.patterns.push({
                pattern,
                frequency: 1,
                examples: [],
                preference,
            });
        }
    }

    // ========================================================================
    // PERSONALIZATION
    // ========================================================================

    /**
     * Get personalized system prompt
     */
    getPersonalizedPrompt(): string {
        const { codingStyle, preferences, patterns } = this.userProfile;

        const styleGuide = `
Coding Style Preferences:
- Use ${codingStyle.indentation} for indentation (${codingStyle.indentSize} spaces)
- ${codingStyle.semicolons ? 'Use' : 'Omit'} semicolons
- Use ${codingStyle.quotes} quotes
- ${codingStyle.trailingComma ? 'Include' : 'Omit'} trailing commas
- ${preferences.preferFunctional ? 'Prefer functional patterns' : 'Use imperative style'}
- ${preferences.preferClasses ? 'Use classes when appropriate' : 'Prefer functions over classes'}
- Test framework: ${preferences.testFramework}
`;

        const patternGuide = patterns.length > 0 ? `
Pattern Preferences:
${patterns.map(p => `- ${p.pattern}: ${p.preference}`).join('\n')}
` : '';

        return `${styleGuide}${patternGuide}

Acceptance rate: ${(this.userProfile.acceptanceRate * 100).toFixed(1)}%
Adjust suggestions to match user preferences.`;
    }

    /**
     * Apply style to generated code
     */
    applyStyleToCode(code: string): string {
        const { codingStyle } = this.userProfile;
        let styled = code;

        // Apply indentation
        if (codingStyle.indentation === 'tabs') {
            styled = styled.replace(/^( {2,})/gm, (match) =>
                '\t'.repeat(Math.floor(match.length / codingStyle.indentSize))
            );
        }

        // Apply quotes
        if (codingStyle.quotes === 'double') {
            styled = styled.replace(/'/g, '"');
        } else {
            styled = styled.replace(/"/g, "'");
        }

        // Apply semicolons
        if (!codingStyle.semicolons) {
            styled = styled.replace(/;(\s*\n)/g, '$1');
        }

        return styled;
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    /**
     * Get user profile
     */
    getProfile(): UserProfile {
        return { ...this.userProfile };
    }

    /**
     * Update user profile
     */
    updateProfile(updates: Partial<UserProfile>): void {
        this.userProfile = { ...this.userProfile, ...updates };
        this.emit('profile:updated', this.userProfile);
    }

    /**
     * Set persistence path
     */
    setPersistPath(dir: string): void {
        this.persistPath = dir;
    }

    /**
     * Save state to disk
     */
    async save(): Promise<void> {
        if (!this.persistPath) return;

        const data = {
            profile: this.userProfile,
            suggestions: Array.from(this.suggestions.entries()),
            corrections: this.corrections,
        };

        await fs.mkdir(this.persistPath, { recursive: true });
        await fs.writeFile(
            path.join(this.persistPath, 'self-improving.json'),
            JSON.stringify(data, null, 2)
        );
    }

    /**
     * Load state from disk
     */
    async load(): Promise<void> {
        if (!this.persistPath) return;

        try {
            const content = await fs.readFile(
                path.join(this.persistPath, 'self-improving.json'),
                'utf-8'
            );
            const data = JSON.parse(content);

            this.userProfile = data.profile;
            this.suggestions = new Map(data.suggestions);
            this.corrections = data.corrections;
        } catch {
            // No saved state
        }
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    /**
     * Get improvement analytics
     */
    getAnalytics(): {
        totalSuggestions: number;
        acceptanceRate: number;
        totalCorrections: number;
        learnedPatterns: number;
    } {
        return {
            totalSuggestions: this.suggestions.size,
            acceptanceRate: this.userProfile.acceptanceRate,
            totalCorrections: this.corrections.length,
            learnedPatterns: this.userProfile.patterns.length,
        };
    }
}

// Export singleton
export const selfImprovingAgent = SelfImprovingAgent.getInstance();
