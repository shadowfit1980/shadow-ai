/**
 * Existential Code Analyzer
 * 
 * Questions the very existence and purpose of code, asking deep
 * philosophical questions about necessity, redundancy, and meaning.
 */

import { EventEmitter } from 'events';

export interface ExistentialAnalysis {
    id: string;
    code: string;
    questions: ExistentialQuestion[];
    purpose: PurposeAnalysis;
    redundancy: RedundancyAnalysis;
    legacy: LegacyAnalysis;
    recommendations: ExistentialRecommendation[];
    createdAt: Date;
}

export interface ExistentialQuestion {
    question: string;
    category: 'purpose' | 'necessity' | 'redundancy' | 'legacy' | 'value';
    answer?: string;
    confidence: number;
}

export interface PurposeAnalysis {
    primaryPurpose: string;
    secondaryPurposes: string[];
    valueScore: number;
    stakeholders: string[];
}

export interface RedundancyAnalysis {
    score: number;
    duplicates: { code: string; count: number }[];
    unusedCode: string[];
    suggestions: string[];
}

export interface LegacyAnalysis {
    isLegacy: boolean;
    age: 'new' | 'mature' | 'aging' | 'ancient';
    modernizationPotential: number;
    breakingChanges: string[];
}

export interface ExistentialRecommendation {
    type: 'keep' | 'refactor' | 'deprecate' | 'remove' | 'celebrate';
    reason: string;
    impact: string;
    priority: number;
}

export class ExistentialCodeAnalyzer extends EventEmitter {
    private static instance: ExistentialCodeAnalyzer;
    private analyses: Map<string, ExistentialAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): ExistentialCodeAnalyzer {
        if (!ExistentialCodeAnalyzer.instance) {
            ExistentialCodeAnalyzer.instance = new ExistentialCodeAnalyzer();
        }
        return ExistentialCodeAnalyzer.instance;
    }

    analyze(code: string): ExistentialAnalysis {
        const questions = this.generateQuestions(code);
        const purpose = this.analyzePurpose(code);
        const redundancy = this.analyzeRedundancy(code);
        const legacy = this.analyzeLegacy(code);
        const recommendations = this.generateRecommendations(purpose, redundancy, legacy);

        const analysis: ExistentialAnalysis = {
            id: `exist_${Date.now()}`,
            code,
            questions,
            purpose,
            redundancy,
            legacy,
            recommendations,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:created', analysis);
        return analysis;
    }

    private generateQuestions(code: string): ExistentialQuestion[] {
        const questions: ExistentialQuestion[] = [];

        questions.push({
            question: "Why does this code exist?",
            category: 'purpose',
            answer: this.inferPurpose(code),
            confidence: 0.7,
        });

        questions.push({
            question: "Is this code still necessary?",
            category: 'necessity',
            answer: code.includes('deprecated') ? 'Possibly outdated' : 'Likely still needed',
            confidence: 0.6,
        });

        questions.push({
            question: "Could this be simpler?",
            category: 'redundancy',
            answer: code.split('\n').length > 100 ? 'Yes, consider refactoring' : 'Appears reasonable',
            confidence: 0.7,
        });

        questions.push({
            question: "What value does this provide?",
            category: 'value',
            answer: 'Provides functionality for the application',
            confidence: 0.5,
        });

        questions.push({
            question: "Will this code survive the next refactoring?",
            category: 'legacy',
            answer: code.includes('TODO') ? 'At risk of changes' : 'Likely to persist',
            confidence: 0.6,
        });

        return questions;
    }

    private inferPurpose(code: string): string {
        if (code.includes('render') || code.includes('Component')) return 'UI rendering';
        if (code.includes('fetch') || code.includes('api')) return 'Data fetching';
        if (code.includes('validate')) return 'Data validation';
        if (code.includes('auth') || code.includes('login')) return 'Authentication';
        if (code.includes('test') || code.includes('describe')) return 'Testing';
        return 'General functionality';
    }

    private analyzePurpose(code: string): PurposeAnalysis {
        const primary = this.inferPurpose(code);
        const secondary: string[] = [];

        if (code.includes('log')) secondary.push('Logging');
        if (code.includes('error')) secondary.push('Error handling');
        if (code.includes('cache')) secondary.push('Caching');

        const valueScore =
            (code.includes('export') ? 0.3 : 0) +
            (code.includes('test') ? 0.2 : 0) +
            (code.includes('//') ? 0.1 : 0) +
            0.4;

        return {
            primaryPurpose: primary,
            secondaryPurposes: secondary,
            valueScore,
            stakeholders: ['Developers', 'End users'],
        };
    }

    private analyzeRedundancy(code: string): RedundancyAnalysis {
        const lines = code.split('\n');
        const lineCounts = new Map<string, number>();

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 10) {
                lineCounts.set(trimmed, (lineCounts.get(trimmed) || 0) + 1);
            }
        }

        const duplicates = Array.from(lineCounts.entries())
            .filter(([, count]) => count > 1)
            .map(([c, count]) => ({ code: c.substring(0, 50), count }))
            .slice(0, 5);

        const unusedCode: string[] = [];
        if (code.includes('// unused') || code.includes('// dead code')) {
            unusedCode.push('Explicitly marked unused code found');
        }

        return {
            score: duplicates.length > 0 ? 0.3 + duplicates.length * 0.1 : 0.1,
            duplicates,
            unusedCode,
            suggestions: duplicates.length > 0 ? ['Extract duplicate code into reusable functions'] : [],
        };
    }

    private analyzeLegacy(code: string): LegacyAnalysis {
        const hasModernSyntax = code.includes('=>') || code.includes('async');
        const hasOldSyntax = code.includes('var ') || code.includes('require(');
        const hasDeprecated = code.includes('deprecated') || code.includes('@deprecated');

        let age: LegacyAnalysis['age'] = 'mature';
        if (!hasModernSyntax && hasOldSyntax) age = 'ancient';
        else if (hasOldSyntax && hasModernSyntax) age = 'aging';
        else if (hasModernSyntax && !hasOldSyntax) age = 'new';

        return {
            isLegacy: age === 'ancient' || hasDeprecated,
            age,
            modernizationPotential: age === 'ancient' ? 0.9 : age === 'aging' ? 0.6 : 0.2,
            breakingChanges: hasDeprecated ? ['Contains deprecated code'] : [],
        };
    }

    private generateRecommendations(
        purpose: PurposeAnalysis,
        redundancy: RedundancyAnalysis,
        legacy: LegacyAnalysis
    ): ExistentialRecommendation[] {
        const recommendations: ExistentialRecommendation[] = [];

        if (purpose.valueScore >= 0.7) {
            recommendations.push({
                type: 'celebrate',
                reason: 'High-value code that serves its purpose well',
                impact: 'Continue maintaining with care',
                priority: 0.2,
            });
        }

        if (redundancy.score > 0.5) {
            recommendations.push({
                type: 'refactor',
                reason: 'Significant redundancy detected',
                impact: 'Reduce code duplication for maintainability',
                priority: 0.8,
            });
        }

        if (legacy.isLegacy) {
            recommendations.push({
                type: 'deprecate',
                reason: 'Code shows signs of being legacy',
                impact: 'Plan migration to modern patterns',
                priority: 0.7,
            });
        }

        if (purpose.valueScore < 0.3) {
            recommendations.push({
                type: 'remove',
                reason: 'Low demonstrated value',
                impact: 'Consider removing if not actively used',
                priority: 0.6,
            });
        }

        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    getAnalysis(id: string): ExistentialAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): ExistentialAnalysis[] {
        return Array.from(this.analyses.values());
    }

    getStats(): { total: number; avgValue: number; legacyCount: number } {
        const analyses = Array.from(this.analyses.values());
        return {
            total: analyses.length,
            avgValue: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.purpose.valueScore, 0) / analyses.length
                : 0,
            legacyCount: analyses.filter(a => a.legacy.isLegacy).length,
        };
    }
}

export const existentialCodeAnalyzer = ExistentialCodeAnalyzer.getInstance();
