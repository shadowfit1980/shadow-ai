/**
 * Consciousness Bridge
 * 
 * Creates a bridge between human developer consciousness and
 * AI code understanding, enabling deeper collaboration.
 */

import { EventEmitter } from 'events';

export interface ConsciousnessSession {
    id: string;
    humanInput: HumanInput[];
    aiUnderstanding: AIUnderstanding[];
    bridgeState: BridgeState;
    synchronization: number;
    createdAt: Date;
}

export interface HumanInput {
    id: string;
    type: 'thought' | 'question' | 'instruction' | 'feedback';
    content: string;
    clarity: number;
    timestamp: Date;
}

export interface AIUnderstanding {
    id: string;
    inputId: string;
    interpretation: string;
    confidence: number;
    alternatives: string[];
    response?: string;
}

export interface BridgeState {
    connected: boolean;
    bandwidth: number;
    latency: number;
    rapport: number;
}

export class ConsciousnessBridge extends EventEmitter {
    private static instance: ConsciousnessBridge;
    private sessions: Map<string, ConsciousnessSession> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): ConsciousnessBridge {
        if (!ConsciousnessBridge.instance) {
            ConsciousnessBridge.instance = new ConsciousnessBridge();
        }
        return ConsciousnessBridge.instance;
    }

    createSession(): ConsciousnessSession {
        const session: ConsciousnessSession = {
            id: `consciousness_${Date.now()}`,
            humanInput: [],
            aiUnderstanding: [],
            bridgeState: {
                connected: true,
                bandwidth: 1.0,
                latency: 0.1,
                rapport: 0.5,
            },
            synchronization: 0.5,
            createdAt: new Date(),
        };

        this.sessions.set(session.id, session);
        this.emit('session:created', session);
        return session;
    }

    transmit(sessionId: string, type: HumanInput['type'], content: string): AIUnderstanding | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        const input: HumanInput = {
            id: `input_${Date.now()}`,
            type,
            content,
            clarity: this.assessClarity(content),
            timestamp: new Date(),
        };

        session.humanInput.push(input);

        const understanding = this.processInput(input);
        session.aiUnderstanding.push(understanding);

        // Update synchronization
        session.synchronization = this.calculateSync(session);
        session.bridgeState.rapport = Math.min(1, session.bridgeState.rapport + 0.05);

        this.emit('transmission:complete', { session, input, understanding });
        return understanding;
    }

    private assessClarity(content: string): number {
        let clarity = 0.5;

        // Clearer if specific
        if (content.includes('function') || content.includes('class')) clarity += 0.2;
        if (content.includes('should') || content.includes('must')) clarity += 0.1;
        if (content.length > 20 && content.length < 200) clarity += 0.1;
        if (content.includes('?')) clarity += 0.1; // Questions are clear intent

        return Math.min(1, clarity);
    }

    private processInput(input: HumanInput): AIUnderstanding {
        const interpretations = this.generateInterpretations(input);

        return {
            id: `understanding_${Date.now()}`,
            inputId: input.id,
            interpretation: interpretations[0] || 'Processing input...',
            confidence: input.clarity * 0.9,
            alternatives: interpretations.slice(1),
            response: this.generateResponse(input, interpretations[0]),
        };
    }

    private generateInterpretations(input: HumanInput): string[] {
        const interpretations: string[] = [];
        const content = input.content.toLowerCase();

        if (input.type === 'question') {
            if (content.includes('how')) {
                interpretations.push('Seeking implementation guidance');
                interpretations.push('Requesting step-by-step instructions');
            }
            if (content.includes('why')) {
                interpretations.push('Seeking rationale or reasoning');
                interpretations.push('Understanding design decisions');
            }
            if (content.includes('what')) {
                interpretations.push('Seeking definition or explanation');
                interpretations.push('Requesting overview');
            }
        } else if (input.type === 'instruction') {
            if (content.includes('create') || content.includes('add')) {
                interpretations.push('Request to implement new feature');
            }
            if (content.includes('fix') || content.includes('debug')) {
                interpretations.push('Request to resolve an issue');
            }
            if (content.includes('refactor') || content.includes('improve')) {
                interpretations.push('Request to enhance existing code');
            }
        } else if (input.type === 'thought') {
            interpretations.push('Developer brainstorming');
            interpretations.push('Exploring possibilities');
        }

        if (interpretations.length === 0) {
            interpretations.push('General communication received');
        }

        return interpretations;
    }

    private generateResponse(input: HumanInput, interpretation: string): string {
        if (input.type === 'question') {
            return `I understand you're ${interpretation.toLowerCase()}. Let me help with that...`;
        }
        if (input.type === 'instruction') {
            return `Processing: ${interpretation}. I'll work on this right away.`;
        }
        return `Acknowledged: ${interpretation}`;
    }

    private calculateSync(session: ConsciousnessSession): number {
        if (session.aiUnderstanding.length === 0) return 0.5;

        const avgConfidence = session.aiUnderstanding.reduce(
            (s, u) => s + u.confidence, 0
        ) / session.aiUnderstanding.length;

        return avgConfidence;
    }

    getSession(id: string): ConsciousnessSession | undefined {
        return this.sessions.get(id);
    }

    getStats(): { total: number; avgSync: number; avgRapport: number } {
        const sessions = Array.from(this.sessions.values());
        return {
            total: sessions.length,
            avgSync: sessions.length > 0
                ? sessions.reduce((s, sess) => s + sess.synchronization, 0) / sessions.length
                : 0,
            avgRapport: sessions.length > 0
                ? sessions.reduce((s, sess) => s + sess.bridgeState.rapport, 0) / sessions.length
                : 0,
        };
    }
}

export const consciousnessBridge = ConsciousnessBridge.getInstance();
