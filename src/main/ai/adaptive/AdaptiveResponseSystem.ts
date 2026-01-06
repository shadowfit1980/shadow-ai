/**
 * Adaptive Response System
 * 
 * Dynamically adjusts AI response style based on user preferences,
 * context, and historical interaction patterns.
 */

import { EventEmitter } from 'events';

export interface ResponseProfile {
    id: string;
    name: string;
    settings: ResponseSettings;
    triggers: ResponseTrigger[];
    isActive: boolean;
}

export interface ResponseSettings {
    verbosity: 'concise' | 'normal' | 'detailed';
    formality: 'casual' | 'professional' | 'technical';
    codeComments: 'none' | 'minimal' | 'comprehensive';
    explanationDepth: 'brief' | 'moderate' | 'thorough';
    examplesCount: number;
    includeAlternatives: boolean;
    includeWarnings: boolean;
    includePerformanceTips: boolean;
    useEmoji: boolean;
    defaultLanguage: string;
}

export interface ResponseTrigger {
    type: 'keyword' | 'context' | 'time' | 'project' | 'emotion';
    condition: string;
    profileId: string;
}

export interface AdaptationFactor {
    factor: string;
    weight: number;
    currentValue: number;
    history: { value: number; timestamp: Date }[];
}

export interface UserInteraction {
    id: string;
    timestamp: Date;
    inputLength: number;
    responseLength: number;
    wasEdited: boolean;
    feedback?: 'positive' | 'negative' | 'neutral';
    responseTime: number;
    retries: number;
}

export interface ResponseRecommendation {
    setting: keyof ResponseSettings;
    currentValue: any;
    recommendedValue: any;
    reason: string;
    confidence: number;
}

// Default profiles
const DEFAULT_PROFILES: ResponseProfile[] = [
    {
        id: 'expert',
        name: 'Expert Mode',
        settings: {
            verbosity: 'concise',
            formality: 'technical',
            codeComments: 'minimal',
            explanationDepth: 'brief',
            examplesCount: 1,
            includeAlternatives: false,
            includeWarnings: true,
            includePerformanceTips: true,
            useEmoji: false,
            defaultLanguage: 'typescript',
        },
        triggers: [
            { type: 'keyword', condition: 'quick', profileId: 'expert' },
            { type: 'keyword', condition: 'just show me', profileId: 'expert' },
        ],
        isActive: false,
    },
    {
        id: 'learning',
        name: 'Learning Mode',
        settings: {
            verbosity: 'detailed',
            formality: 'casual',
            codeComments: 'comprehensive',
            explanationDepth: 'thorough',
            examplesCount: 3,
            includeAlternatives: true,
            includeWarnings: true,
            includePerformanceTips: true,
            useEmoji: true,
            defaultLanguage: 'typescript',
        },
        triggers: [
            { type: 'keyword', condition: 'explain', profileId: 'learning' },
            { type: 'keyword', condition: 'how does', profileId: 'learning' },
            { type: 'keyword', condition: 'teach me', profileId: 'learning' },
        ],
        isActive: false,
    },
    {
        id: 'production',
        name: 'Production Mode',
        settings: {
            verbosity: 'normal',
            formality: 'professional',
            codeComments: 'minimal',
            explanationDepth: 'moderate',
            examplesCount: 1,
            includeAlternatives: false,
            includeWarnings: true,
            includePerformanceTips: true,
            useEmoji: false,
            defaultLanguage: 'typescript',
        },
        triggers: [
            { type: 'keyword', condition: 'production', profileId: 'production' },
            { type: 'keyword', condition: 'deploy', profileId: 'production' },
        ],
        isActive: false,
    },
    {
        id: 'default',
        name: 'Balanced',
        settings: {
            verbosity: 'normal',
            formality: 'professional',
            codeComments: 'minimal',
            explanationDepth: 'moderate',
            examplesCount: 2,
            includeAlternatives: true,
            includeWarnings: true,
            includePerformanceTips: false,
            useEmoji: false,
            defaultLanguage: 'typescript',
        },
        triggers: [],
        isActive: true,
    },
];

export class AdaptiveResponseSystem extends EventEmitter {
    private static instance: AdaptiveResponseSystem;
    private profiles: Map<string, ResponseProfile> = new Map();
    private activeProfileId: string = 'default';
    private interactions: UserInteraction[] = [];
    private adaptationFactors: Map<string, AdaptationFactor> = new Map();

    private constructor() {
        super();
        this.initializeDefaults();
        this.initializeAdaptationFactors();
    }

    static getInstance(): AdaptiveResponseSystem {
        if (!AdaptiveResponseSystem.instance) {
            AdaptiveResponseSystem.instance = new AdaptiveResponseSystem();
        }
        return AdaptiveResponseSystem.instance;
    }

    private initializeDefaults(): void {
        for (const profile of DEFAULT_PROFILES) {
            this.profiles.set(profile.id, profile);
        }
    }

    private initializeAdaptationFactors(): void {
        const factors = [
            'userExpertise',
            'taskComplexity',
            'timeOfDay',
            'sessionLength',
            'errorRate',
            'editFrequency',
        ];

        for (const factor of factors) {
            this.adaptationFactors.set(factor, {
                factor,
                weight: 0.5,
                currentValue: 0.5,
                history: [],
            });
        }
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    createProfile(name: string, settings: ResponseSettings): ResponseProfile {
        const profile: ResponseProfile = {
            id: `profile_${Date.now()}`,
            name,
            settings,
            triggers: [],
            isActive: false,
        };

        this.profiles.set(profile.id, profile);
        this.emit('profile:created', profile);
        return profile;
    }

    updateProfile(id: string, updates: Partial<ResponseProfile>): ResponseProfile | undefined {
        const profile = this.profiles.get(id);
        if (!profile) return undefined;

        Object.assign(profile, updates);
        this.emit('profile:updated', profile);
        return profile;
    }

    deleteProfile(id: string): boolean {
        if (id === 'default') return false;
        const deleted = this.profiles.delete(id);
        if (deleted && this.activeProfileId === id) {
            this.activeProfileId = 'default';
        }
        return deleted;
    }

    setActiveProfile(id: string): ResponseProfile | undefined {
        const profile = this.profiles.get(id);
        if (!profile) return undefined;

        // Deactivate previous
        const previous = this.profiles.get(this.activeProfileId);
        if (previous) previous.isActive = false;

        // Activate new
        profile.isActive = true;
        this.activeProfileId = id;

        this.emit('profile:activated', profile);
        return profile;
    }

    getActiveProfile(): ResponseProfile {
        return this.profiles.get(this.activeProfileId) || this.profiles.get('default')!;
    }

    getAllProfiles(): ResponseProfile[] {
        return Array.from(this.profiles.values());
    }

    // ========================================================================
    // AUTOMATIC ADAPTATION
    // ========================================================================

    detectProfileFromInput(input: string): ResponseProfile | null {
        const lowerInput = input.toLowerCase();

        for (const profile of this.profiles.values()) {
            for (const trigger of profile.triggers) {
                if (trigger.type === 'keyword' && lowerInput.includes(trigger.condition.toLowerCase())) {
                    return profile;
                }
            }
        }

        return null;
    }

    recordInteraction(interaction: Omit<UserInteraction, 'id'>): void {
        const fullInteraction: UserInteraction = {
            ...interaction,
            id: `interaction_${Date.now()}`,
        };

        this.interactions.push(fullInteraction);

        // Keep only last 100 interactions
        if (this.interactions.length > 100) {
            this.interactions.shift();
        }

        // Update adaptation factors
        this.updateAdaptationFactors(fullInteraction);

        this.emit('interaction:recorded', fullInteraction);
    }

    private updateAdaptationFactors(interaction: UserInteraction): void {
        // Update user expertise based on interaction patterns
        const expertiseFactor = this.adaptationFactors.get('userExpertise')!;
        if (interaction.retries === 0 && !interaction.wasEdited) {
            expertiseFactor.currentValue = Math.min(1, expertiseFactor.currentValue + 0.05);
        } else if (interaction.retries > 2) {
            expertiseFactor.currentValue = Math.max(0, expertiseFactor.currentValue - 0.1);
        }

        // Update error rate
        const errorFactor = this.adaptationFactors.get('errorRate')!;
        if (interaction.feedback === 'negative') {
            errorFactor.currentValue = Math.min(1, errorFactor.currentValue + 0.1);
        } else if (interaction.feedback === 'positive') {
            errorFactor.currentValue = Math.max(0, errorFactor.currentValue - 0.05);
        }

        // Update edit frequency
        const editFactor = this.adaptationFactors.get('editFrequency')!;
        if (interaction.wasEdited) {
            editFactor.currentValue = Math.min(1, editFactor.currentValue + 0.1);
        } else {
            editFactor.currentValue = Math.max(0, editFactor.currentValue - 0.02);
        }
    }

    // ========================================================================
    // RECOMMENDATIONS
    // ========================================================================

    getRecommendations(): ResponseRecommendation[] {
        const recommendations: ResponseRecommendation[] = [];
        const currentSettings = this.getActiveProfile().settings;

        const expertise = this.adaptationFactors.get('userExpertise')!.currentValue;
        const errorRate = this.adaptationFactors.get('errorRate')!.currentValue;
        const editFrequency = this.adaptationFactors.get('editFrequency')!.currentValue;

        // Verbosity recommendation
        if (expertise > 0.7 && currentSettings.verbosity !== 'concise') {
            recommendations.push({
                setting: 'verbosity',
                currentValue: currentSettings.verbosity,
                recommendedValue: 'concise',
                reason: 'User shows high expertise, shorter responses may be preferred',
                confidence: expertise,
            });
        } else if (errorRate > 0.5 && currentSettings.verbosity !== 'detailed') {
            recommendations.push({
                setting: 'verbosity',
                currentValue: currentSettings.verbosity,
                recommendedValue: 'detailed',
                reason: 'Higher error rate suggests more detailed explanations needed',
                confidence: errorRate,
            });
        }

        // Code comments recommendation
        if (editFrequency > 0.5 && currentSettings.codeComments !== 'comprehensive') {
            recommendations.push({
                setting: 'codeComments',
                currentValue: currentSettings.codeComments,
                recommendedValue: 'comprehensive',
                reason: 'Frequent edits suggest more code comments would help',
                confidence: editFrequency,
            });
        }

        // Explanation depth
        if (errorRate > 0.4 && currentSettings.explanationDepth !== 'thorough') {
            recommendations.push({
                setting: 'explanationDepth',
                currentValue: currentSettings.explanationDepth,
                recommendedValue: 'thorough',
                reason: 'More thorough explanations may reduce errors',
                confidence: errorRate,
            });
        }

        return recommendations;
    }

    applyRecommendations(recommendations: ResponseRecommendation[]): void {
        const profile = this.getActiveProfile();

        for (const rec of recommendations) {
            if (rec.confidence >= 0.6) {
                (profile.settings as any)[rec.setting] = rec.recommendedValue;
            }
        }

        this.emit('recommendations:applied', recommendations);
    }

    // ========================================================================
    // RESPONSE FORMATTING
    // ========================================================================

    formatResponse(content: string, metadata?: { type?: string; hasCode?: boolean }): string {
        const settings = this.getActiveProfile().settings;
        let formatted = content;

        // Adjust code comments based on settings
        if (metadata?.hasCode && settings.codeComments === 'none') {
            formatted = formatted.replace(/\/\/.*$/gm, '');
            formatted = formatted.replace(/\/\*[\s\S]*?\*\//g, '');
        }

        // Add emoji if enabled
        if (settings.useEmoji) {
            if (content.includes('error') || content.includes('warning')) {
                formatted = '⚠️ ' + formatted;
            } else if (content.includes('success') || content.includes('done')) {
                formatted = '✅ ' + formatted;
            } else if (content.includes('tip') || content.includes('suggestion')) {
                formatted = '💡 ' + formatted;
            }
        }

        return formatted;
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    getInteractionStats(): {
        totalInteractions: number;
        avgResponseTime: number;
        editRate: number;
        feedbackBreakdown: { positive: number; negative: number; neutral: number };
    } {
        const total = this.interactions.length;
        if (total === 0) {
            return {
                totalInteractions: 0,
                avgResponseTime: 0,
                editRate: 0,
                feedbackBreakdown: { positive: 0, negative: 0, neutral: 0 },
            };
        }

        const avgResponseTime = this.interactions.reduce((sum, i) => sum + i.responseTime, 0) / total;
        const editRate = this.interactions.filter(i => i.wasEdited).length / total;

        const feedbackBreakdown = { positive: 0, negative: 0, neutral: 0 };
        for (const interaction of this.interactions) {
            if (interaction.feedback) {
                feedbackBreakdown[interaction.feedback]++;
            }
        }

        return {
            totalInteractions: total,
            avgResponseTime,
            editRate,
            feedbackBreakdown,
        };
    }

    getAdaptationFactors(): AdaptationFactor[] {
        return Array.from(this.adaptationFactors.values());
    }
}

export const adaptiveResponseSystem = AdaptiveResponseSystem.getInstance();
