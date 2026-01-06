/**
 * Emotional Intelligence Engine
 * 
 * Detects user frustration via text analysis and adjusts responses
 * to be more helpful, patient, or inject appropriate humor.
 */

import { EventEmitter } from 'events';

export interface EmotionalState {
    id: string;
    timestamp: Date;
    inputText: string;
    detectedEmotions: EmotionScore[];
    dominantEmotion: EmotionType;
    frustrationLevel: number; // 0-1
    confidence: number;
    suggestedTone: ResponseTone;
}

export type EmotionType =
    | 'neutral'
    | 'happy'
    | 'frustrated'
    | 'confused'
    | 'excited'
    | 'stressed'
    | 'impatient'
    | 'grateful'
    | 'curious'
    | 'disappointed';

export type ResponseTone =
    | 'professional'
    | 'empathetic'
    | 'encouraging'
    | 'patient'
    | 'humorous'
    | 'concise'
    | 'detailed';

export interface EmotionScore {
    emotion: EmotionType;
    score: number; // 0-1
    indicators: string[];
}

export interface ToneModifier {
    tone: ResponseTone;
    promptPrefix?: string;
    styleGuide: string;
    examples: string[];
}

// Emotion detection patterns
const EMOTION_PATTERNS: { emotion: EmotionType; patterns: RegExp[]; weight: number }[] = [
    {
        emotion: 'frustrated',
        patterns: [
            /why (won't|doesn't|isn't|can't)/gi,
            /not working/gi,
            /still (not|doesn't|won't)/gi,
            /already tried/gi,
            /for the \d+(st|nd|rd|th) time/gi,
            /!{2,}/g,
            /\?{2,}/g,
            /ugh|argh|grrr/gi,
            /this is (ridiculous|stupid|annoying)/gi,
        ],
        weight: 1.5,
    },
    {
        emotion: 'confused',
        patterns: [
            /i don'?t (understand|get)/gi,
            /what (do you mean|does this mean)/gi,
            /confused/gi,
            /makes no sense/gi,
            /huh\?|what\?$/gi,
            /lost (me|here)/gi,
        ],
        weight: 1.2,
    },
    {
        emotion: 'impatient',
        patterns: [
            /just (tell me|do it|show me)/gi,
            /hurry/gi,
            /quickly|quick|fast/gi,
            /asap|urgent/gi,
            /come on/gi,
            /enough (with|of)/gi,
        ],
        weight: 1.3,
    },
    {
        emotion: 'stressed',
        patterns: [
            /deadline/gi,
            /urgent|emergency/gi,
            /running out of time/gi,
            /help me please/gi,
            /desperately/gi,
            /need this (now|asap|immediately)/gi,
        ],
        weight: 1.4,
    },
    {
        emotion: 'grateful',
        patterns: [
            /thank(s| you)/gi,
            /appreciate/gi,
            /helpful/gi,
            /awesome|great|perfect/gi,
            /you('re| are) (the|a) (best|lifesaver)/gi,
        ],
        weight: 1.1,
    },
    {
        emotion: 'excited',
        patterns: [
            /!{1}$/g,
            /can't wait/gi,
            /excited|awesome|amazing/gi,
            /love (this|it)/gi,
            /yes!|yay|woohoo/gi,
        ],
        weight: 1.0,
    },
    {
        emotion: 'curious',
        patterns: [
            /how (does|do|can|would)/gi,
            /what if/gi,
            /i wonder/gi,
            /curious|interesting/gi,
            /tell me (more|about)/gi,
        ],
        weight: 0.9,
    },
    {
        emotion: 'disappointed',
        patterns: [
            /expected (more|better)/gi,
            /not what i (wanted|asked)/gi,
            /disappointing/gi,
            /meh|okay i guess/gi,
            /could be better/gi,
        ],
        weight: 1.2,
    },
];

const TONE_MODIFIERS: ToneModifier[] = [
    {
        tone: 'empathetic',
        promptPrefix: 'The user seems frustrated. Be understanding and supportive.',
        styleGuide: 'Acknowledge their frustration, validate their feelings, offer clear help.',
        examples: [
            "I understand this can be frustrating. Let's work through it together.",
            "I hear you. That's a tricky situation. Here's what we can try...",
        ],
    },
    {
        tone: 'patient',
        promptPrefix: 'The user is confused. Explain step-by-step with extra clarity.',
        styleGuide: 'Break down complex concepts, use analogies, check understanding.',
        examples: [
            "No problem! Let me explain this step by step...",
            "Great question! Think of it like this...",
        ],
    },
    {
        tone: 'encouraging',
        promptPrefix: 'The user is stressed or struggling. Be positive and reassuring.',
        styleGuide: 'Offer encouragement, highlight progress, provide clear next steps.',
        examples: [
            "You're on the right track! Just a small adjustment needed...",
            "Don't worry, this is a common challenge. Here's the solution...",
        ],
    },
    {
        tone: 'humorous',
        promptPrefix: 'Lighten the mood with appropriate humor while being helpful.',
        styleGuide: 'Add light jokes or wordplay, but keep focus on solving the problem.',
        examples: [
            "Ah, the classic 'works on my machine' scenario! 😄 Let's debug this...",
            "That error message is about as helpful as a screen door on a submarine. Here's what it actually means...",
        ],
    },
    {
        tone: 'concise',
        promptPrefix: 'The user wants quick answers. Be brief and direct.',
        styleGuide: 'Minimize explanation, get straight to the solution.',
        examples: [
            "Quick fix: Add `async` before the function.",
            "Solution: Run `npm install` then restart.",
        ],
    },
    {
        tone: 'detailed',
        promptPrefix: 'The user wants to understand deeply. Provide comprehensive explanation.',
        styleGuide: 'Cover background, implementation details, edge cases, and best practices.',
        examples: [
            "This involves several concepts. Let me break it down...",
            "To fully understand this, we need to consider...",
        ],
    },
];

export class EmotionalIntelligence extends EventEmitter {
    private static instance: EmotionalIntelligence;
    private stateHistory: EmotionalState[] = [];
    private conversationMood: number = 0.5; // Running average of frustration
    private humorThreshold: number = 0.3; // When to inject humor

    private constructor() {
        super();
    }

    static getInstance(): EmotionalIntelligence {
        if (!EmotionalIntelligence.instance) {
            EmotionalIntelligence.instance = new EmotionalIntelligence();
        }
        return EmotionalIntelligence.instance;
    }

    // ========================================================================
    // EMOTION DETECTION
    // ========================================================================

    /**
     * Analyze text for emotional content
     */
    analyzeEmotion(text: string): EmotionalState {
        const id = `emotion_${Date.now()}`;
        const detectedEmotions: EmotionScore[] = [];

        // Check each emotion pattern
        for (const { emotion, patterns, weight } of EMOTION_PATTERNS) {
            let totalMatches = 0;
            const indicators: string[] = [];

            for (const pattern of patterns) {
                const matches = text.match(pattern);
                if (matches) {
                    totalMatches += matches.length;
                    indicators.push(...matches.slice(0, 3)); // Keep first 3 examples
                }
            }

            if (totalMatches > 0) {
                const score = Math.min(1, (totalMatches * weight) / 5);
                detectedEmotions.push({ emotion, score, indicators });
            }
        }

        // Analyze punctuation and caps for intensity
        const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        const exclamationCount = (text.match(/!/g) || []).length;
        const questionCount = (text.match(/\?/g) || []).length;

        // Boost frustration if lots of caps or punctuation
        if (capsRatio > 0.3 || exclamationCount > 2) {
            const frustrationScore = detectedEmotions.find(e => e.emotion === 'frustrated');
            if (frustrationScore) {
                frustrationScore.score = Math.min(1, frustrationScore.score + 0.2);
            } else if (capsRatio > 0.3) {
                detectedEmotions.push({
                    emotion: 'frustrated',
                    score: 0.3,
                    indicators: ['CAPS DETECTED']
                });
            }
        }

        // Sort by score
        detectedEmotions.sort((a, b) => b.score - a.score);

        // Determine dominant emotion
        const dominantEmotion = detectedEmotions[0]?.emotion || 'neutral';

        // Calculate frustration level
        const frustrationLevel = this.calculateFrustrationLevel(detectedEmotions);

        // Update conversation mood
        this.updateConversationMood(frustrationLevel);

        // Determine appropriate response tone
        const suggestedTone = this.selectTone(dominantEmotion, frustrationLevel);

        const state: EmotionalState = {
            id,
            timestamp: new Date(),
            inputText: text,
            detectedEmotions,
            dominantEmotion,
            frustrationLevel,
            confidence: detectedEmotions[0]?.score || 0.5,
            suggestedTone,
        };

        this.stateHistory.push(state);
        this.emit('emotion:detected', state);

        return state;
    }

    private calculateFrustrationLevel(emotions: EmotionScore[]): number {
        const frustratingEmotions = ['frustrated', 'impatient', 'stressed', 'disappointed'];
        let level = 0;

        for (const emotion of emotions) {
            if (frustratingEmotions.includes(emotion.emotion)) {
                level += emotion.score;
            }
        }

        return Math.min(1, level);
    }

    private updateConversationMood(frustration: number): void {
        // Exponential moving average
        const alpha = 0.3;
        this.conversationMood = this.conversationMood * (1 - alpha) + frustration * alpha;
    }

    private selectTone(emotion: EmotionType, frustration: number): ResponseTone {
        // High frustration = empathetic tone
        if (frustration > 0.7) {
            return 'empathetic';
        }

        // Stressed = encouraging
        if (emotion === 'stressed') {
            return 'encouraging';
        }

        // Confused = patient
        if (emotion === 'confused') {
            return 'patient';
        }

        // Impatient = concise
        if (emotion === 'impatient') {
            return 'concise';
        }

        // Curious = detailed
        if (emotion === 'curious') {
            return 'detailed';
        }

        // Low frustration + some history = maybe inject humor
        if (frustration < this.humorThreshold && this.stateHistory.length > 3) {
            return 'humorous';
        }

        return 'professional';
    }

    // ========================================================================
    // RESPONSE MODIFICATION
    // ========================================================================

    /**
     * Get tone modifier for prompt engineering
     */
    getToneModifier(tone: ResponseTone): ToneModifier | undefined {
        return TONE_MODIFIERS.find(t => t.tone === tone);
    }

    /**
     * Generate modified system prompt based on emotional state
     */
    generateEmotionalPrompt(basePrompt: string, state: EmotionalState): string {
        const modifier = this.getToneModifier(state.suggestedTone);

        if (!modifier) {
            return basePrompt;
        }

        return `${modifier.promptPrefix}\n\nStyle Guide: ${modifier.styleGuide}\n\n${basePrompt}`;
    }

    /**
     * Suggest follow-up actions based on emotional state
     */
    suggestFollowUp(state: EmotionalState): string[] {
        const suggestions: string[] = [];

        if (state.frustrationLevel > 0.6) {
            suggestions.push('Consider offering to break down the problem into smaller steps');
            suggestions.push('Validate their experience before providing solution');
        }

        if (state.dominantEmotion === 'confused') {
            suggestions.push('Provide a simplified explanation first');
            suggestions.push('Ask clarifying questions to ensure understanding');
        }

        if (state.dominantEmotion === 'stressed') {
            suggestions.push('Prioritize the most critical solution first');
            suggestions.push('Reassure them that the issue is solvable');
        }

        return suggestions;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getConversationMood(): number {
        return this.conversationMood;
    }

    getRecentStates(limit: number = 5): EmotionalState[] {
        return this.stateHistory.slice(-limit);
    }

    getMoodTrend(): 'improving' | 'worsening' | 'stable' {
        const recent = this.getRecentStates(5);
        if (recent.length < 2) return 'stable';

        const first = recent[0].frustrationLevel;
        const last = recent[recent.length - 1].frustrationLevel;
        const diff = last - first;

        if (diff < -0.2) return 'improving';
        if (diff > 0.2) return 'worsening';
        return 'stable';
    }

    resetConversation(): void {
        this.conversationMood = 0.5;
        this.stateHistory = [];
        this.emit('conversation:reset');
    }
}

export const emotionalIntelligence = EmotionalIntelligence.getInstance();
