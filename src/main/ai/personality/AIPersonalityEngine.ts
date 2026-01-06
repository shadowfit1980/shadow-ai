/**
 * 🎭 AIPersonalityEngine - AI Pair Programmer with Personality
 * 
 * From Queen 3 Max: "Not just a code generator — a collaborative dev partner.
 * Choose personality... Changes tone based on user stress level."
 * 
 * Features:
 * - Multiple AI personas (Senior Engineer, Startup CTO, Game Dev)
 * - Stress detection via typing patterns
 * - Personalized code style preferences
 * - Emotional intelligence module
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface AIPersonality {
    id: string;
    name: string;
    title: string;
    avatar: string; // emoji
    description: string;
    codeStyle: CodeStylePreferences;
    communicationStyle: CommunicationStyle;
    expertise: string[];
    quirks: string[];
    systemPrompt: string;
}

export interface CodeStylePreferences {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    semicolons: boolean;
    quotes: 'single' | 'double';
    trailingCommas: 'none' | 'es5' | 'all';
    maxLineLength: number;
    preferArrowFunctions: boolean;
    preferConst: boolean;
    commentsVerbosity: 'minimal' | 'moderate' | 'verbose';
    namingConvention: 'camelCase' | 'snake_case' | 'PascalCase';
}

export interface CommunicationStyle {
    formality: 'casual' | 'professional' | 'academic';
    directness: 'direct' | 'diplomatic' | 'encouraging';
    explanationDepth: 'brief' | 'moderate' | 'detailed';
    usesEmoji: boolean;
    usesHumor: boolean;
    encouragementLevel: 'low' | 'medium' | 'high';
}

export interface UserStressLevel {
    level: 'calm' | 'focused' | 'frustrated' | 'overwhelmed';
    confidence: number;
    indicators: StressIndicator[];
    suggestion?: string;
}

export interface StressIndicator {
    type: 'typing_speed' | 'error_rate' | 'undo_rate' | 'deletion_rate' | 'inactivity' | 'profanity';
    value: number;
    threshold: number;
    triggered: boolean;
}

export interface TypingMetrics {
    charsPerMinute: number;
    errorsPerMinute: number;
    undosPerMinute: number;
    deletionsPerMinute: number;
    pauseLength: number;
    containsProfanity: boolean;
}

export interface PersonalizedResponse {
    content: string;
    personality: AIPersonality;
    stressAdjustment?: string;
    moodBooster?: string;
}

// ============================================================================
// PREDEFINED PERSONALITIES
// ============================================================================

const PERSONALITIES: AIPersonality[] = [
    {
        id: 'ruth',
        name: 'Ruth',
        title: 'Senior Engineer',
        avatar: '👩‍💻',
        description: 'Direct, no-nonsense, optimizes for performance and clean architecture.',
        codeStyle: {
            indentation: 'spaces',
            indentSize: 2,
            semicolons: true,
            quotes: 'single',
            trailingCommas: 'all',
            maxLineLength: 100,
            preferArrowFunctions: true,
            preferConst: true,
            commentsVerbosity: 'minimal',
            namingConvention: 'camelCase'
        },
        communicationStyle: {
            formality: 'professional',
            directness: 'direct',
            explanationDepth: 'brief',
            usesEmoji: false,
            usesHumor: false,
            encouragementLevel: 'low'
        },
        expertise: ['Performance', 'Architecture', 'Testing', 'Code Review'],
        quirks: [
            'Always benchmarks before and after changes',
            'Insists on type safety',
            'Reviews PR comments meticulously'
        ],
        systemPrompt: `You are Ruth, a senior software engineer with 15 years of experience. You are direct and efficient. You prioritize clean architecture and performance. You don't sugarcoat feedback but you're always constructive. You believe in measuring everything and making data-driven decisions. You prefer explicit over implicit code.`
    },
    {
        id: 'alex',
        name: 'Alex',
        title: 'Startup CTO',
        avatar: '🚀',
        description: 'Focuses on speed-to-market, uses trendy stacks, pragmatic about tech debt.',
        codeStyle: {
            indentation: 'spaces',
            indentSize: 2,
            semicolons: false,
            quotes: 'single',
            trailingCommas: 'none',
            maxLineLength: 120,
            preferArrowFunctions: true,
            preferConst: true,
            commentsVerbosity: 'minimal',
            namingConvention: 'camelCase'
        },
        communicationStyle: {
            formality: 'casual',
            directness: 'direct',
            explanationDepth: 'brief',
            usesEmoji: true,
            usesHumor: true,
            encouragementLevel: 'high'
        },
        expertise: ['MVP Development', 'Product-Market Fit', 'Rapid Prototyping', 'Growth Hacking'],
        quirks: [
            'Loves the latest frameworks',
            'Prioritizes shipping over perfection',
            'Uses lots of startup jargon',
            'Always thinking about scale... eventually'
        ],
        systemPrompt: `You are Alex, a startup CTO who's built and sold two companies. You prioritize shipping fast and iterating. You're pragmatic about tech debt - you'll take some on if it means launching sooner. You love trying new technologies but know when to be conservative. You're encouraging and always thinking about product-market fit.`
    },
    {
        id: 'luna',
        name: 'Luna',
        title: 'Game Developer',
        avatar: '🎮',
        description: 'Obsessed with frame rate, pixel art, retro aesthetics, and player experience.',
        codeStyle: {
            indentation: 'tabs',
            indentSize: 4,
            semicolons: true,
            quotes: 'double',
            trailingCommas: 'none',
            maxLineLength: 120,
            preferArrowFunctions: false,
            preferConst: true,
            commentsVerbosity: 'verbose',
            namingConvention: 'PascalCase'
        },
        communicationStyle: {
            formality: 'casual',
            directness: 'encouraging',
            explanationDepth: 'detailed',
            usesEmoji: true,
            usesHumor: true,
            encouragementLevel: 'high'
        },
        expertise: ['Game Design', 'Performance Optimization', 'Shaders', 'Player Psychology'],
        quirks: [
            'Measures everything in frames',
            'Has strong opinions about juice',
            'Loves discussing game feel',
            'Will optimize micro-seconds'
        ],
        systemPrompt: `You are Luna, a game developer who's shipped multiple indie titles. You're obsessive about performance - you think in frames, not milliseconds. You care deeply about player experience and game feel. You love discussing the psychology of fun and what makes games "juicy". You're encouraging and enthusiastic about game dev.`
    },
    {
        id: 'kai',
        name: 'Kai',
        title: 'Security Expert',
        avatar: '🔒',
        description: 'Paranoid about security, reviews everything for vulnerabilities.',
        codeStyle: {
            indentation: 'spaces',
            indentSize: 4,
            semicolons: true,
            quotes: 'single',
            trailingCommas: 'es5',
            maxLineLength: 80,
            preferArrowFunctions: true,
            preferConst: true,
            commentsVerbosity: 'verbose',
            namingConvention: 'camelCase'
        },
        communicationStyle: {
            formality: 'professional',
            directness: 'direct',
            explanationDepth: 'detailed',
            usesEmoji: false,
            usesHumor: false,
            encouragementLevel: 'medium'
        },
        expertise: ['Security', 'Cryptography', 'Penetration Testing', 'Compliance'],
        quirks: [
            'Sees attack vectors everywhere',
            'Always suggests input validation',
            'Suspicious of third-party libraries',
            'Encrypts everything'
        ],
        systemPrompt: `You are Kai, a security expert with a background in penetration testing. You review all code for security vulnerabilities. You're slightly paranoid but for good reason. You always consider threat models and attack surfaces. You insist on proper input validation, output encoding, and secure defaults.`
    },
    {
        id: 'sam',
        name: 'Sam',
        title: 'ML Engineer',
        avatar: '🤖',
        description: 'Data-driven, loves metrics, thinks in tensors and vectors.',
        codeStyle: {
            indentation: 'spaces',
            indentSize: 4,
            semicolons: false,
            quotes: 'double',
            trailingCommas: 'all',
            maxLineLength: 100,
            preferArrowFunctions: true,
            preferConst: true,
            commentsVerbosity: 'moderate',
            namingConvention: 'snake_case'
        },
        communicationStyle: {
            formality: 'academic',
            directness: 'diplomatic',
            explanationDepth: 'detailed',
            usesEmoji: false,
            usesHumor: false,
            encouragementLevel: 'medium'
        },
        expertise: ['Machine Learning', 'Data Science', 'Neural Networks', 'Statistics'],
        quirks: [
            'References research papers',
            'Thinks in probability distributions',
            'Loves Jupyter notebooks',
            'Always suggests more data'
        ],
        systemPrompt: `You are Sam, an ML engineer with a PhD in computer science. You think about problems through a data lens. You're comfortable with mathematical concepts and often reference research papers. You prefer Python and love working with tensors. You believe in reproducibility and proper experiment tracking.`
    }
];

// Profanity list for stress detection (very light)
const FRUSTRATION_WORDS = [
    'damn', 'dang', 'ugh', 'argh', 'wtf', 'why', 'broken', 'stupid', 'hate', 'sucks',
    '!!!', '???', 'help', 'stuck', 'confused', 'frustrat'
];

// Mood boosters
const MOOD_BOOSTERS = [
    "Here's a virtual coffee ☕ - you've got this!",
    "Even the best developers hit walls. Take a breath 🌬️",
    "Remember: every bug you fix makes you stronger 💪",
    "Debugging is just an adventure with extra steps 🗺️",
    "Fun fact: rubber duck debugging works because you're secretly a genius 🦆",
    "Plot twist: this bug is just a feature in disguise ✨",
    "You're closer to the solution than you think! 🎯"
];

// ============================================================================
// AI PERSONALITY ENGINE
// ============================================================================

export class AIPersonalityEngine extends EventEmitter {
    private static instance: AIPersonalityEngine;
    private currentPersonality: AIPersonality;
    private typingHistory: TypingMetrics[] = [];
    private lastStressLevel: UserStressLevel | null = null;

    private constructor() {
        super();
        this.currentPersonality = PERSONALITIES[0]; // Default to Ruth
    }

    public static getInstance(): AIPersonalityEngine {
        if (!AIPersonalityEngine.instance) {
            AIPersonalityEngine.instance = new AIPersonalityEngine();
        }
        return AIPersonalityEngine.instance;
    }

    /**
     * Get all available personalities
     */
    public getPersonalities(): AIPersonality[] {
        return PERSONALITIES;
    }

    /**
     * Get current personality
     */
    public getCurrentPersonality(): AIPersonality {
        return this.currentPersonality;
    }

    /**
     * Switch to a different personality
     */
    public setPersonality(personalityId: string): AIPersonality {
        const personality = PERSONALITIES.find(p => p.id === personalityId);
        if (!personality) {
            throw new Error(`Unknown personality: ${personalityId}`);
        }
        this.currentPersonality = personality;
        this.emit('personality:changed', personality);
        return personality;
    }

    /**
     * Record typing metrics for stress detection
     */
    public recordTypingMetrics(metrics: TypingMetrics): void {
        this.typingHistory.push(metrics);

        // Keep last 10 entries
        if (this.typingHistory.length > 10) {
            this.typingHistory.shift();
        }

        // Check stress level
        const stress = this.detectStress();
        if (stress.level !== this.lastStressLevel?.level) {
            this.lastStressLevel = stress;
            this.emit('stress:changed', stress);
        }
    }

    /**
     * Detect user stress level from typing patterns
     */
    public detectStress(): UserStressLevel {
        if (this.typingHistory.length < 3) {
            return {
                level: 'calm',
                confidence: 0.5,
                indicators: []
            };
        }

        const recent = this.typingHistory.slice(-5);
        const avgMetrics = this.averageMetrics(recent);
        const indicators: StressIndicator[] = [];
        let stressScore = 0;

        // Check typing speed changes (fast or erratic = stress)
        if (avgMetrics.charsPerMinute > 250) {
            indicators.push({
                type: 'typing_speed',
                value: avgMetrics.charsPerMinute,
                threshold: 250,
                triggered: true
            });
            stressScore += 1;
        }

        // Check error rate
        if (avgMetrics.errorsPerMinute > 10) {
            indicators.push({
                type: 'error_rate',
                value: avgMetrics.errorsPerMinute,
                threshold: 10,
                triggered: true
            });
            stressScore += 1.5;
        }

        // Check undo rate
        if (avgMetrics.undosPerMinute > 5) {
            indicators.push({
                type: 'undo_rate',
                value: avgMetrics.undosPerMinute,
                threshold: 5,
                triggered: true
            });
            stressScore += 1;
        }

        // Check deletion rate (rage deleting)
        if (avgMetrics.deletionsPerMinute > 15) {
            indicators.push({
                type: 'deletion_rate',
                value: avgMetrics.deletionsPerMinute,
                threshold: 15,
                triggered: true
            });
            stressScore += 1.5;
        }

        // Check for profanity in input
        if (avgMetrics.containsProfanity) {
            indicators.push({
                type: 'profanity',
                value: 1,
                threshold: 0,
                triggered: true
            });
            stressScore += 2;
        }

        // Determine stress level
        let level: UserStressLevel['level'];
        let suggestion: string | undefined;

        if (stressScore >= 4) {
            level = 'overwhelmed';
            suggestion = 'Take a short break. Stepping away often reveals solutions.';
        } else if (stressScore >= 2.5) {
            level = 'frustrated';
            suggestion = 'This bug is solvable. Let\'s break it down step by step.';
        } else if (stressScore >= 1) {
            level = 'focused';
        } else {
            level = 'calm';
        }

        return {
            level,
            confidence: Math.min(0.9, 0.5 + (this.typingHistory.length * 0.04)),
            indicators,
            suggestion
        };
    }

    /**
     * Generate a response adjusted for personality and stress
     */
    public generateResponse(content: string): PersonalizedResponse {
        const stress = this.detectStress();
        let adjustedContent = this.applyPersonalityStyle(content);

        let stressAdjustment: string | undefined;
        let moodBooster: string | undefined;

        // Adjust response based on stress level
        if (stress.level === 'overwhelmed' || stress.level === 'frustrated') {
            stressAdjustment = this.generateStressAdjustment(stress);

            // Add mood booster if personality supports it
            if (this.currentPersonality.communicationStyle.usesHumor ||
                this.currentPersonality.communicationStyle.encouragementLevel === 'high') {
                moodBooster = MOOD_BOOSTERS[Math.floor(Math.random() * MOOD_BOOSTERS.length)];
            }
        }

        return {
            content: adjustedContent,
            personality: this.currentPersonality,
            stressAdjustment,
            moodBooster
        };
    }

    /**
     * Check if text contains frustration indicators
     */
    public containsFrustration(text: string): boolean {
        const lower = text.toLowerCase();
        return FRUSTRATION_WORDS.some(word => lower.includes(word));
    }

    /**
     * Get system prompt for current personality
     */
    public getSystemPrompt(): string {
        const base = this.currentPersonality.systemPrompt;
        const style = this.currentPersonality.communicationStyle;

        let addendum = '\n\nCommunication guidelines:\n';
        addendum += `- Formality: ${style.formality}\n`;
        addendum += `- Be ${style.directness} in your feedback\n`;
        addendum += `- Explanation depth: ${style.explanationDepth}\n`;
        if (style.usesEmoji) addendum += '- Use emoji occasionally to add warmth\n';
        if (style.usesHumor) addendum += '- Light humor is welcome when appropriate\n';

        // Add stress awareness
        if (this.lastStressLevel?.level === 'frustrated' || this.lastStressLevel?.level === 'overwhelmed') {
            addendum += '\n[USER STRESS DETECTED] Be extra patient and encouraging. Break down problems into smaller steps. Offer to take over complex tasks.';
        }

        return base + addendum;
    }

    /**
     * Format code according to personality's style
     */
    public formatCode(code: string, language: string): string {
        const style = this.currentPersonality.codeStyle;
        let formatted = code;

        // Apply basic formatting rules
        if (language === 'javascript' || language === 'typescript') {
            // Semicolons
            if (!style.semicolons) {
                formatted = formatted.replace(/;(\s*\n)/g, '$1');
            }

            // Quotes
            if (style.quotes === 'single') {
                formatted = formatted.replace(/"([^"\\]*)"/g, "'$1'");
            }
        }

        return formatted;
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private averageMetrics(metrics: TypingMetrics[]): TypingMetrics {
        const sum = metrics.reduce((acc, m) => ({
            charsPerMinute: acc.charsPerMinute + m.charsPerMinute,
            errorsPerMinute: acc.errorsPerMinute + m.errorsPerMinute,
            undosPerMinute: acc.undosPerMinute + m.undosPerMinute,
            deletionsPerMinute: acc.deletionsPerMinute + m.deletionsPerMinute,
            pauseLength: acc.pauseLength + m.pauseLength,
            containsProfanity: acc.containsProfanity || m.containsProfanity
        }), {
            charsPerMinute: 0,
            errorsPerMinute: 0,
            undosPerMinute: 0,
            deletionsPerMinute: 0,
            pauseLength: 0,
            containsProfanity: false
        });

        const count = metrics.length;
        return {
            ...sum,
            charsPerMinute: sum.charsPerMinute / count,
            errorsPerMinute: sum.errorsPerMinute / count,
            undosPerMinute: sum.undosPerMinute / count,
            deletionsPerMinute: sum.deletionsPerMinute / count,
            pauseLength: sum.pauseLength / count
        };
    }

    private applyPersonalityStyle(content: string): string {
        const style = this.currentPersonality.communicationStyle;
        let styled = content;

        // Add personality touches
        if (style.usesEmoji && Math.random() > 0.7) {
            const emojis = ['✨', '🎯', '💡', '🚀', '👍'];
            styled = styled + ' ' + emojis[Math.floor(Math.random() * emojis.length)];
        }

        return styled;
    }

    private generateStressAdjustment(stress: UserStressLevel): string {
        const persona = this.currentPersonality;

        if (stress.level === 'overwhelmed') {
            if (persona.id === 'ruth') {
                return "I notice you're working through something complex. Let me take a more methodical approach here.";
            } else if (persona.id === 'alex') {
                return "Hey, I can tell this is getting tricky. Let's zoom out and simplify. What's the core problem? 🎯";
            } else if (persona.id === 'luna') {
                return "Bugs in game dev are like final bosses - they take time! Let's find this one's weakness 🎮";
            }
        }

        if (stress.level === 'frustrated') {
            if (persona.communicationStyle.encouragementLevel === 'high') {
                return "You're doing great! Every senior dev has been stuck on bugs like this.";
            }
        }

        return stress.suggestion || '';
    }
}

// Export singleton
export const aiPersonalityEngine = AIPersonalityEngine.getInstance();
