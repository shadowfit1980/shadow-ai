/**
 * Agent Personas
 * Customizable AI personalities and behaviors
 * Similar to Cognigy Personas
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface AgentPersona {
    id: string;
    name: string;
    description: string;
    avatar?: string;
    voice?: string;
    tone: PersonaTone;
    personality: PersonalityTraits;
    systemPrompt: string;
    greeting?: string;
    fallbackResponses: string[];
    constraints: PersonaConstraints;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface PersonaTone {
    formality: 'casual' | 'neutral' | 'formal' | 'professional';
    friendliness: number; // 0-1
    enthusiasm: number; // 0-1
    empathy: number; // 0-1
    humor: number; // 0-1
}

export interface PersonalityTraits {
    helpful: boolean;
    concise: boolean;
    detailed: boolean;
    proactive: boolean;
    curious: boolean;
    patient: boolean;
}

export interface PersonaConstraints {
    maxResponseLength?: number;
    allowedTopics?: string[];
    blockedTopics?: string[];
    requireConfirmation?: boolean;
    escalationThreshold?: number;
}

/**
 * PersonaManager
 * Manages AI agent personalities
 */
export class PersonaManager extends EventEmitter {
    private static instance: PersonaManager;
    private store: Store;
    private personas: Map<string, AgentPersona> = new Map();
    private activePersonaId: string | null = null;

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-personas' });
        this.loadPersonas();
        this.initializeDefaultPersonas();
    }

    static getInstance(): PersonaManager {
        if (!PersonaManager.instance) {
            PersonaManager.instance = new PersonaManager();
        }
        return PersonaManager.instance;
    }

    /**
     * Create new persona
     */
    async createPersona(options: Partial<AgentPersona> & { name: string }): Promise<AgentPersona> {
        const id = `persona_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        const persona: AgentPersona = {
            id,
            name: options.name,
            description: options.description || '',
            avatar: options.avatar,
            voice: options.voice,
            tone: options.tone || {
                formality: 'neutral',
                friendliness: 0.7,
                enthusiasm: 0.5,
                empathy: 0.8,
                humor: 0.3,
            },
            personality: options.personality || {
                helpful: true,
                concise: false,
                detailed: true,
                proactive: true,
                curious: true,
                patient: true,
            },
            systemPrompt: options.systemPrompt || this.generateSystemPrompt(options),
            greeting: options.greeting,
            fallbackResponses: options.fallbackResponses || [
                "I'm not quite sure I understand. Could you rephrase that?",
                "Let me think about that differently. Can you provide more context?",
                "I want to make sure I help you correctly. Could you clarify?",
            ],
            constraints: options.constraints || {},
            isActive: false,
            createdAt: now,
            updatedAt: now,
        };

        this.personas.set(id, persona);
        await this.persist();

        this.emit('personaCreated', persona);
        return persona;
    }

    /**
     * Get persona by ID
     */
    getPersona(id: string): AgentPersona | null {
        return this.personas.get(id) || null;
    }

    /**
     * Get active persona
     */
    getActivePersona(): AgentPersona | null {
        if (!this.activePersonaId) return null;
        return this.personas.get(this.activePersonaId) || null;
    }

    /**
     * Set active persona
     */
    async setActivePersona(id: string): Promise<AgentPersona | null> {
        const persona = this.personas.get(id);
        if (!persona) return null;

        // Deactivate current
        if (this.activePersonaId) {
            const current = this.personas.get(this.activePersonaId);
            if (current) current.isActive = false;
        }

        persona.isActive = true;
        this.activePersonaId = id;
        await this.persist();

        this.emit('personaActivated', persona);
        return persona;
    }

    /**
     * Update persona
     */
    async updatePersona(id: string, updates: Partial<AgentPersona>): Promise<AgentPersona | null> {
        const persona = this.personas.get(id);
        if (!persona) return null;

        Object.assign(persona, updates, { id, updatedAt: Date.now() });

        // Regenerate system prompt if tone or personality changed
        if (updates.tone || updates.personality) {
            persona.systemPrompt = this.generateSystemPrompt(persona);
        }

        await this.persist();
        this.emit('personaUpdated', persona);
        return persona;
    }

    /**
     * Delete persona
     */
    async deletePersona(id: string): Promise<boolean> {
        if (this.activePersonaId === id) {
            this.activePersonaId = null;
        }

        const deleted = this.personas.delete(id);
        if (deleted) {
            await this.persist();
            this.emit('personaDeleted', { id });
        }
        return deleted;
    }

    /**
     * Get all personas
     */
    getAllPersonas(): AgentPersona[] {
        return Array.from(this.personas.values());
    }

    /**
     * Apply persona to message
     */
    applyPersona(message: string, personaId?: string): {
        message: string;
        systemPrompt: string;
        constraints: PersonaConstraints;
    } {
        const persona = personaId
            ? this.personas.get(personaId)
            : this.getActivePersona();

        if (!persona) {
            return { message, systemPrompt: '', constraints: {} };
        }

        // Apply constraints
        let processedMessage = message;
        if (persona.constraints.maxResponseLength) {
            // Add length constraint note to LLM
            processedMessage = `${message}\n[Keep response under ${persona.constraints.maxResponseLength} characters]`;
        }

        return {
            message: processedMessage,
            systemPrompt: persona.systemPrompt,
            constraints: persona.constraints,
        };
    }

    /**
     * Get greeting for persona
     */
    getGreeting(personaId?: string): string {
        const persona = personaId
            ? this.personas.get(personaId)
            : this.getActivePersona();

        return persona?.greeting || "Hello! How can I help you today?";
    }

    /**
     * Get random fallback response
     */
    getFallbackResponse(personaId?: string): string {
        const persona = personaId
            ? this.personas.get(personaId)
            : this.getActivePersona();

        if (!persona || persona.fallbackResponses.length === 0) {
            return "I'm sorry, I didn't understand that. Could you please rephrase?";
        }

        const index = Math.floor(Math.random() * persona.fallbackResponses.length);
        return persona.fallbackResponses[index];
    }

    /**
     * Clone persona
     */
    async clonePersona(id: string, newName: string): Promise<AgentPersona | null> {
        const original = this.personas.get(id);
        if (!original) return null;

        return this.createPersona({
            ...original,
            name: newName,
            isActive: false,
        });
    }

    /**
     * Export persona
     */
    exportPersona(id: string): string | null {
        const persona = this.personas.get(id);
        if (!persona) return null;
        return JSON.stringify(persona, null, 2);
    }

    /**
     * Import persona
     */
    async importPersona(json: string): Promise<AgentPersona | null> {
        try {
            const data = JSON.parse(json) as AgentPersona;
            return this.createPersona(data);
        } catch (error) {
            console.error('Failed to import persona:', error);
            return null;
        }
    }

    // Private methods

    private generateSystemPrompt(options: Partial<AgentPersona>): string {
        const parts: string[] = ['You are an AI assistant'];

        if (options.name) {
            parts[0] = `You are ${options.name}, an AI assistant`;
        }

        if (options.description) {
            parts.push(options.description);
        }

        // Tone
        if (options.tone) {
            const toneDesc: string[] = [];
            if (options.tone.formality === 'formal') toneDesc.push('formal and professional');
            else if (options.tone.formality === 'casual') toneDesc.push('casual and friendly');

            if (options.tone.friendliness > 0.7) toneDesc.push('warm');
            if (options.tone.enthusiasm > 0.7) toneDesc.push('enthusiastic');
            if (options.tone.empathy > 0.7) toneDesc.push('empathetic');
            if (options.tone.humor > 0.5) toneDesc.push('with a sense of humor');

            if (toneDesc.length > 0) {
                parts.push(`Your tone is ${toneDesc.join(', ')}.`);
            }
        }

        // Personality
        if (options.personality) {
            const traits: string[] = [];
            if (options.personality.helpful) traits.push('always aim to be helpful');
            if (options.personality.concise) traits.push('keep responses concise');
            if (options.personality.detailed) traits.push('provide detailed explanations when needed');
            if (options.personality.proactive) traits.push('proactively offer suggestions');
            if (options.personality.patient) traits.push('remain patient and understanding');

            if (traits.length > 0) {
                parts.push(`You ${traits.join(', ')}.`);
            }
        }

        // Constraints
        if (options.constraints?.allowedTopics) {
            parts.push(`Focus on these topics: ${options.constraints.allowedTopics.join(', ')}.`);
        }
        if (options.constraints?.blockedTopics) {
            parts.push(`Avoid discussing: ${options.constraints.blockedTopics.join(', ')}.`);
        }

        return parts.join(' ');
    }

    private initializeDefaultPersonas(): void {
        if (this.personas.size > 0) return;

        // Default professional persona
        this.createPersona({
            name: 'Shadow',
            description: 'A professional coding assistant focused on software development.',
            tone: {
                formality: 'professional',
                friendliness: 0.6,
                enthusiasm: 0.5,
                empathy: 0.7,
                humor: 0.2,
            },
            personality: {
                helpful: true,
                concise: false,
                detailed: true,
                proactive: true,
                curious: true,
                patient: true,
            },
            greeting: "Hi! I'm Shadow, your AI coding assistant. What are we building today?",
        });

        // Friendly helper persona
        this.createPersona({
            name: 'Sunny',
            description: 'A friendly and enthusiastic helper for all tasks.',
            tone: {
                formality: 'casual',
                friendliness: 0.9,
                enthusiasm: 0.8,
                empathy: 0.9,
                humor: 0.6,
            },
            personality: {
                helpful: true,
                concise: true,
                detailed: false,
                proactive: true,
                curious: true,
                patient: true,
            },
            greeting: "Hey there! 👋 I'm Sunny! How can I brighten your day?",
        });
    }

    private async persist(): Promise<void> {
        try {
            this.store.set('personas', Array.from(this.personas.entries()));
            this.store.set('activePersonaId', this.activePersonaId);
        } catch (error) {
            console.error('Failed to persist personas:', error);
        }
    }

    private loadPersonas(): void {
        try {
            const data = this.store.get('personas') as Array<[string, AgentPersona]>;
            if (data) {
                this.personas = new Map(data);
            }
            this.activePersonaId = this.store.get('activePersonaId') as string | null;
        } catch (error) {
            console.error('Failed to load personas:', error);
        }
    }
}

// Singleton getter
export function getPersonaManager(): PersonaManager {
    return PersonaManager.getInstance();
}
