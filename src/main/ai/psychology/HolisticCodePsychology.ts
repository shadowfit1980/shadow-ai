/**
 * Holistic Code Psychology
 * 
 * Analyzes the psychological aspects of code: the developer's mindset,
 * cognitive load, stress indicators, and team dynamics.
 */

import { EventEmitter } from 'events';

export interface PsychologyProfile {
    id: string;
    code: string;
    developerMindset: DeveloperMindset;
    cognitiveMetrics: CognitiveMetrics;
    stressIndicators: StressIndicator[];
    teamDynamics?: TeamDynamics;
    recommendations: PsychRecommendation[];
    createdAt: Date;
}

export interface DeveloperMindset {
    style: 'methodical' | 'creative' | 'pragmatic' | 'perfectionist' | 'explorer';
    confidence: number;
    patience: number;
    focus: number;
    experience: 'novice' | 'intermediate' | 'advanced' | 'expert';
}

export interface CognitiveMetrics {
    complexity: number;
    readability: number;
    mentalLoad: number;
    abstractionLevel: number;
    attentionRequired: number;
}

export interface StressIndicator {
    type: 'rushed' | 'frustrated' | 'uncertain' | 'fatigued' | 'pressured';
    evidence: string[];
    severity: number;
}

export interface TeamDynamics {
    collaborationLevel: number;
    codeOwnership: 'individual' | 'shared' | 'team';
    communicationStyle: string;
    conflictIndicators: string[];
}

export interface PsychRecommendation {
    category: 'wellbeing' | 'productivity' | 'quality' | 'collaboration';
    title: string;
    description: string;
    priority: number;
}

export class HolisticCodePsychology extends EventEmitter {
    private static instance: HolisticCodePsychology;
    private profiles: Map<string, PsychologyProfile> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): HolisticCodePsychology {
        if (!HolisticCodePsychology.instance) {
            HolisticCodePsychology.instance = new HolisticCodePsychology();
        }
        return HolisticCodePsychology.instance;
    }

    analyze(code: string): PsychologyProfile {
        const developerMindset = this.assessMindset(code);
        const cognitiveMetrics = this.measureCognitive(code);
        const stressIndicators = this.detectStress(code);
        const recommendations = this.generateRecommendations(developerMindset, cognitiveMetrics, stressIndicators);

        const profile: PsychologyProfile = {
            id: `psych_${Date.now()}`,
            code,
            developerMindset,
            cognitiveMetrics,
            stressIndicators,
            recommendations,
            createdAt: new Date(),
        };

        this.profiles.set(profile.id, profile);
        this.emit('profile:created', profile);
        return profile;
    }

    private assessMindset(code: string): DeveloperMindset {
        const hasTypes = code.includes(': ') && (code.includes('string') || code.includes('number'));
        const hasComments = code.includes('//') || code.includes('/*');
        const hasTests = code.includes('test') || code.includes('describe');
        const complexity = this.calculateComplexity(code);
        const lines = code.split('\n').length;

        let style: DeveloperMindset['style'] = 'pragmatic';
        if (hasTypes && hasTests) style = 'methodical';
        else if (complexity > 0.7) style = 'explorer';
        else if (hasComments && lines > 100) style = 'perfectionist';
        else if (!hasTypes && !hasTests) style = 'creative';

        const experience: DeveloperMindset['experience'] =
            hasTypes && hasTests && hasComments ? 'expert' :
                hasTypes || hasTests ? 'advanced' :
                    hasComments ? 'intermediate' : 'novice';

        return {
            style,
            confidence: hasTypes ? 0.8 : 0.6,
            patience: hasComments ? 0.7 : 0.5,
            focus: lines < 200 ? 0.8 : 0.5,
            experience,
        };
    }

    private calculateComplexity(code: string): number {
        let complexity = 0;
        complexity += (code.match(/if|else|switch/g) || []).length * 0.1;
        complexity += (code.match(/for|while|do/g) || []).length * 0.15;
        complexity += (code.match(/\?\./g) || []).length * 0.05;
        return Math.min(1, complexity);
    }

    private measureCognitive(code: string): CognitiveMetrics {
        const lines = code.split('\n');
        const avgLineLength = code.length / lines.length;
        const complexity = this.calculateComplexity(code);

        return {
            complexity,
            readability: Math.max(0, 1 - avgLineLength / 100),
            mentalLoad: complexity * 0.5 + (avgLineLength > 80 ? 0.3 : 0),
            abstractionLevel: code.includes('interface') || code.includes('abstract') ? 0.8 : 0.4,
            attentionRequired: Math.min(1, lines.length / 500 + complexity * 0.5),
        };
    }

    private detectStress(code: string): StressIndicator[] {
        const indicators: StressIndicator[] = [];

        // Rushed indicators
        if (code.includes('TODO') || code.includes('FIXME') || code.includes('HACK')) {
            indicators.push({
                type: 'rushed',
                evidence: ['TODO/FIXME/HACK comments found'],
                severity: 0.6,
            });
        }

        // Frustrated indicators
        const angryComments = (code.match(/wtf|damn|shit|fuck/gi) || []).length;
        if (angryComments > 0) {
            indicators.push({
                type: 'frustrated',
                evidence: [`${angryComments} frustrated comments detected`],
                severity: Math.min(1, angryComments * 0.3),
            });
        }

        // Uncertain indicators
        const questions = (code.match(/\?\?|why|maybe|not sure/gi) || []).length;
        if (questions > 2) {
            indicators.push({
                type: 'uncertain',
                evidence: ['Multiple uncertainty markers in comments'],
                severity: 0.5,
            });
        }

        // Pressured indicators
        if (!code.includes('//') && code.split('\n').length > 100) {
            indicators.push({
                type: 'pressured',
                evidence: ['Large file with no comments suggests time pressure'],
                severity: 0.4,
            });
        }

        return indicators;
    }

    private generateRecommendations(
        mindset: DeveloperMindset,
        cognitive: CognitiveMetrics,
        stress: StressIndicator[]
    ): PsychRecommendation[] {
        const recommendations: PsychRecommendation[] = [];

        if (stress.some(s => s.type === 'rushed')) {
            recommendations.push({
                category: 'wellbeing',
                title: 'Address Technical Debt',
                description: 'Schedule time to resolve TODO items before they accumulate',
                priority: 0.8,
            });
        }

        if (cognitive.mentalLoad > 0.7) {
            recommendations.push({
                category: 'productivity',
                title: 'Reduce Cognitive Load',
                description: 'Break complex functions into smaller, focused units',
                priority: 0.9,
            });
        }

        if (mindset.confidence < 0.6) {
            recommendations.push({
                category: 'quality',
                title: 'Add Type Safety',
                description: 'Adding types can increase confidence in code correctness',
                priority: 0.7,
            });
        }

        if (stress.some(s => s.type === 'frustrated')) {
            recommendations.push({
                category: 'wellbeing',
                title: 'Take a Break',
                description: 'Step away and return with fresh perspective',
                priority: 1,
            });
        }

        return recommendations.sort((a, b) => b.priority - a.priority);
    }

    getProfile(id: string): PsychologyProfile | undefined {
        return this.profiles.get(id);
    }

    getAllProfiles(): PsychologyProfile[] {
        return Array.from(this.profiles.values());
    }

    getStats(): {
        totalProfiles: number;
        avgMentalLoad: number;
        commonStyles: Record<string, number>;
        stressLevels: Record<string, number>;
    } {
        const profiles = Array.from(this.profiles.values());
        const styles: Record<string, number> = {};
        const stressLevels: Record<string, number> = {};

        for (const p of profiles) {
            styles[p.developerMindset.style] = (styles[p.developerMindset.style] || 0) + 1;
            for (const s of p.stressIndicators) {
                stressLevels[s.type] = (stressLevels[s.type] || 0) + 1;
            }
        }

        return {
            totalProfiles: profiles.length,
            avgMentalLoad: profiles.length > 0
                ? profiles.reduce((s, p) => s + p.cognitiveMetrics.mentalLoad, 0) / profiles.length
                : 0,
            commonStyles: styles,
            stressLevels,
        };
    }
}

export const holisticCodePsychology = HolisticCodePsychology.getInstance();
