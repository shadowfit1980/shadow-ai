/**
 * 💚 Emotion Engine
 * 
 * AI-powered emotion and mood system for NPCs:
 * - Dynamic emotion states (joy, fear, anger, sadness, surprise)
 * - Mood influenced by events and other NPCs
 * - Personality types affecting reactions
 * - Emotional memory and relationships
 * - Behavioral modifiers based on mood
 */

import { EventEmitter } from 'events';

export type Emotion = 'joy' | 'fear' | 'anger' | 'sadness' | 'surprise' | 'disgust' | 'trust' | 'anticipation';
export type PersonalityTrait = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

export interface EmotionalState {
    emotions: Map<Emotion, number>; // 0-100 intensity
    mood: number; // -100 to 100 (negative to positive)
    arousal: number; // 0-100 (calm to excited)
    dominantEmotion: Emotion;
}

export interface Personality {
    traits: Map<PersonalityTrait, number>; // 0-100
    temperament: 'sanguine' | 'choleric' | 'melancholic' | 'phlegmatic';
    emotionalStability: number; // 0-100
}

export interface EmotionalMemory {
    entityId: string;
    emotion: Emotion;
    intensity: number;
    timestamp: number;
    decayRate: number;
    reason: string;
}

export interface Relationship {
    targetId: string;
    trust: number; // -100 to 100
    familiarity: number; // 0-100
    attraction: number; // -100 to 100
    respect: number; // -100 to 100
}

export interface NPC {
    id: string;
    name: string;
    personality: Personality;
    emotionalState: EmotionalState;
    memories: EmotionalMemory[];
    relationships: Map<string, Relationship>;
}

export class EmotionEngine extends EventEmitter {
    private static instance: EmotionEngine;
    private npcs: Map<string, NPC> = new Map();

    private constructor() { super(); }

    static getInstance(): EmotionEngine {
        if (!EmotionEngine.instance) {
            EmotionEngine.instance = new EmotionEngine();
        }
        return EmotionEngine.instance;
    }

    // ========================================================================
    // NPC CREATION
    // ========================================================================

    createNPC(id: string, name: string, personalityType?: string): NPC {
        const personality = this.generatePersonality(personalityType);

        const npc: NPC = {
            id,
            name,
            personality,
            emotionalState: this.createNeutralState(),
            memories: [],
            relationships: new Map()
        };

        this.npcs.set(id, npc);
        return npc;
    }

    private generatePersonality(type?: string): Personality {
        const traits = new Map<PersonalityTrait, number>();

        // OCEAN model - Big Five personality traits
        switch (type) {
            case 'brave':
                traits.set('openness', 70);
                traits.set('conscientiousness', 60);
                traits.set('extraversion', 80);
                traits.set('agreeableness', 50);
                traits.set('neuroticism', 20);
                break;
            case 'timid':
                traits.set('openness', 30);
                traits.set('conscientiousness', 70);
                traits.set('extraversion', 20);
                traits.set('agreeableness', 80);
                traits.set('neuroticism', 70);
                break;
            case 'aggressive':
                traits.set('openness', 40);
                traits.set('conscientiousness', 30);
                traits.set('extraversion', 70);
                traits.set('agreeableness', 20);
                traits.set('neuroticism', 60);
                break;
            default:
                // Random balanced personality
                traits.set('openness', 40 + Math.random() * 40);
                traits.set('conscientiousness', 40 + Math.random() * 40);
                traits.set('extraversion', 40 + Math.random() * 40);
                traits.set('agreeableness', 40 + Math.random() * 40);
                traits.set('neuroticism', 40 + Math.random() * 40);
        }

        return {
            traits,
            temperament: this.determineTemperament(traits),
            emotionalStability: 100 - (traits.get('neuroticism') || 50)
        };
    }

    private determineTemperament(traits: Map<PersonalityTrait, number>): 'sanguine' | 'choleric' | 'melancholic' | 'phlegmatic' {
        const ext = traits.get('extraversion') || 50;
        const neu = traits.get('neuroticism') || 50;

        if (ext > 50 && neu < 50) return 'sanguine';
        if (ext > 50 && neu > 50) return 'choleric';
        if (ext < 50 && neu > 50) return 'melancholic';
        return 'phlegmatic';
    }

    private createNeutralState(): EmotionalState {
        const emotions = new Map<Emotion, number>();
        const emotionList: Emotion[] = ['joy', 'fear', 'anger', 'sadness', 'surprise', 'disgust', 'trust', 'anticipation'];

        emotionList.forEach(e => emotions.set(e, 0));

        return {
            emotions,
            mood: 0,
            arousal: 30,
            dominantEmotion: 'trust'
        };
    }

    // ========================================================================
    // EMOTIONAL EVENTS
    // ========================================================================

    triggerEmotion(npcId: string, emotion: Emotion, intensity: number, reason: string): void {
        const npc = this.npcs.get(npcId);
        if (!npc) return;

        // Apply personality modifiers
        const modifier = this.getEmotionModifier(npc.personality, emotion);
        const adjustedIntensity = Math.min(100, intensity * modifier);

        // Update emotion
        const currentIntensity = npc.emotionalState.emotions.get(emotion) || 0;
        npc.emotionalState.emotions.set(emotion, Math.min(100, currentIntensity + adjustedIntensity));

        // Add memory
        npc.memories.push({
            entityId: 'event',
            emotion,
            intensity: adjustedIntensity,
            timestamp: Date.now(),
            decayRate: 0.1,
            reason
        });

        // Update dominant emotion and mood
        this.updateEmotionalState(npc);

        this.emit('emotionTriggered', { npcId, emotion, intensity: adjustedIntensity, reason });
    }

    private getEmotionModifier(personality: Personality, emotion: Emotion): number {
        const neuroticism = personality.traits.get('neuroticism') || 50;
        const agreeableness = personality.traits.get('agreeableness') || 50;

        // Neurotic personalities feel negative emotions more intensely
        if (['fear', 'anger', 'sadness', 'disgust'].includes(emotion)) {
            return 0.5 + (neuroticism / 100);
        }

        // Agreeable personalities feel positive emotions more intensely
        if (['joy', 'trust'].includes(emotion)) {
            return 0.5 + (agreeableness / 100);
        }

        return 1;
    }

    private updateEmotionalState(npc: NPC): void {
        // Find dominant emotion
        let maxEmotion: Emotion = 'trust';
        let maxIntensity = 0;

        npc.emotionalState.emotions.forEach((intensity, emotion) => {
            if (intensity > maxIntensity) {
                maxIntensity = intensity;
                maxEmotion = emotion;
            }
        });

        npc.emotionalState.dominantEmotion = maxEmotion;

        // Update mood based on emotions
        const positiveEmotions = ['joy', 'trust', 'anticipation', 'surprise'];
        let moodDelta = 0;

        npc.emotionalState.emotions.forEach((intensity, emotion) => {
            if (positiveEmotions.includes(emotion)) {
                moodDelta += intensity * 0.3;
            } else {
                moodDelta -= intensity * 0.3;
            }
        });

        npc.emotionalState.mood = Math.max(-100, Math.min(100, moodDelta));

        // Update arousal
        npc.emotionalState.arousal = Math.min(100, maxIntensity);
    }

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    updateRelationship(npcId: string, targetId: string, changes: Partial<Relationship>): void {
        const npc = this.npcs.get(npcId);
        if (!npc) return;

        let relationship = npc.relationships.get(targetId) || {
            targetId,
            trust: 0,
            familiarity: 0,
            attraction: 0,
            respect: 0
        };

        if (changes.trust) relationship.trust = Math.max(-100, Math.min(100, relationship.trust + changes.trust));
        if (changes.familiarity) relationship.familiarity = Math.min(100, relationship.familiarity + changes.familiarity);
        if (changes.attraction) relationship.attraction = Math.max(-100, Math.min(100, relationship.attraction + changes.attraction));
        if (changes.respect) relationship.respect = Math.max(-100, Math.min(100, relationship.respect + changes.respect));

        npc.relationships.set(targetId, relationship);
        this.emit('relationshipUpdated', { npcId, targetId, relationship });
    }

    // ========================================================================
    // BEHAVIOR MODIFIERS
    // ========================================================================

    getBehaviorModifiers(npcId: string): Record<string, number> {
        const npc = this.npcs.get(npcId);
        if (!npc) return {};

        const state = npc.emotionalState;

        return {
            // Combat modifiers
            attackDamage: 1 + (state.emotions.get('anger') || 0) / 200,
            defensiveness: 1 + (state.emotions.get('fear') || 0) / 150,
            accuracy: 1 - (state.arousal) / 500, // High arousal = less accurate

            // Social modifiers
            persuasion: 1 + (state.emotions.get('trust') || 0) / 200,
            intimidation: 1 + (state.emotions.get('anger') || 0) / 150,

            // Movement modifiers
            speed: 1 + (state.emotions.get('fear') || 0) / 300, // Fear makes you faster

            // Decision modifiers
            riskTolerance: 1 - (state.emotions.get('fear') || 0) / 200,
            patience: 1 - (state.emotions.get('anger') || 0) / 150,

            // Overall modifier
            overallMood: state.mood / 100
        };
    }

    // ========================================================================
    // EMOTION DECAY
    // ========================================================================

    updateEmotions(npcId: string, deltaTime: number): void {
        const npc = this.npcs.get(npcId);
        if (!npc) return;

        // Decay memories
        npc.memories = npc.memories.filter(memory => {
            memory.intensity -= memory.decayRate * deltaTime;
            return memory.intensity > 0;
        });

        // Decay emotions towards baseline
        const stability = npc.personality.emotionalStability / 100;
        const decayRate = 0.1 * stability; // More stable = faster return to neutral

        npc.emotionalState.emotions.forEach((intensity, emotion) => {
            const newIntensity = Math.max(0, intensity - decayRate * deltaTime);
            npc.emotionalState.emotions.set(emotion, newIntensity);
        });

        // Slowly return mood to neutral
        npc.emotionalState.mood *= (1 - 0.01 * stability * deltaTime);

        this.updateEmotionalState(npc);
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateEmotionSystemCode(): string {
        return `
// Emotion System for Game NPCs
const EMOTIONS = ['joy', 'fear', 'anger', 'sadness', 'surprise', 'disgust', 'trust', 'anticipation'];

class NPCEmotionSystem {
    constructor(npc) {
        this.npc = npc;
        this.emotions = new Map(EMOTIONS.map(e => [e, 0]));
        this.mood = 0;  // -100 to 100
        this.personality = this.generatePersonality();
    }

    generatePersonality() {
        return {
            neuroticism: Math.random() * 100,
            extraversion: Math.random() * 100,
            agreeableness: Math.random() * 100,
            openness: Math.random() * 100,
            conscientiousness: Math.random() * 100
        };
    }

    triggerEmotion(emotion, intensity, reason) {
        const modifier = this.getPersonalityModifier(emotion);
        const adjustedIntensity = Math.min(100, intensity * modifier);
        
        this.emotions.set(emotion, 
            Math.min(100, this.emotions.get(emotion) + adjustedIntensity)
        );
        
        this.updateMood();
        this.applyBehaviorChanges();
    }

    getPersonalityModifier(emotion) {
        const { neuroticism, agreeableness } = this.personality;
        
        if (['fear', 'anger', 'sadness'].includes(emotion)) {
            return 0.5 + neuroticism / 100;
        }
        if (['joy', 'trust'].includes(emotion)) {
            return 0.5 + agreeableness / 100;
        }
        return 1;
    }

    updateMood() {
        const positive = ['joy', 'trust', 'anticipation'];
        let moodDelta = 0;
        
        this.emotions.forEach((intensity, emotion) => {
            moodDelta += positive.includes(emotion) ? intensity : -intensity;
        });
        
        this.mood = Math.max(-100, Math.min(100, moodDelta / EMOTIONS.length));
    }

    applyBehaviorChanges() {
        const anger = this.emotions.get('anger') / 100;
        const fear = this.emotions.get('fear') / 100;
        
        this.npc.attackMultiplier = 1 + anger * 0.3;
        this.npc.speedMultiplier = 1 + fear * 0.2;
        this.npc.riskTolerance = 1 - fear * 0.5;
    }

    update(deltaTime) {
        // Decay emotions over time
        const decayRate = 0.05;
        this.emotions.forEach((intensity, emotion) => {
            this.emotions.set(emotion, Math.max(0, intensity - decayRate * deltaTime));
        });
        this.updateMood();
    }

    getDominantEmotion() {
        let max = 0, dominant = 'neutral';
        this.emotions.forEach((intensity, emotion) => {
            if (intensity > max) { max = intensity; dominant = emotion; }
        });
        return { emotion: dominant, intensity: max };
    }
}`;
    }

    getNPC(id: string): NPC | undefined {
        return this.npcs.get(id);
    }
}

export const emotionEngine = EmotionEngine.getInstance();
