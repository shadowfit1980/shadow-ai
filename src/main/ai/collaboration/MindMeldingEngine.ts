/**
 * Mind Melding Collaboration Engine
 * 
 * Enables seamless collaboration between multiple developers and AI,
 * with shared context, real-time synchronization, and collective intelligence.
 */

import { EventEmitter } from 'events';

export interface MindMeldSession {
    id: string;
    name: string;
    participants: Participant[];
    sharedContext: SharedContext;
    thoughtStream: Thought[];
    decisions: CollaborativeDecision[];
    status: SessionStatus;
    createdAt: Date;
    lastActivity: Date;
}

export type SessionStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Participant {
    id: string;
    name: string;
    type: 'human' | 'ai';
    role: 'lead' | 'contributor' | 'observer';
    expertise: string[];
    status: 'online' | 'away' | 'offline';
    contributions: number;
    lastSeen: Date;
}

export interface SharedContext {
    id: string;
    codebase: CodebaseSnapshot;
    objectives: string[];
    constraints: string[];
    sharedKnowledge: KnowledgeItem[];
    activeFiles: string[];
    focusArea?: string;
}

export interface CodebaseSnapshot {
    files: { path: string; hash: string }[];
    lastSync: Date;
    version: string;
}

export interface KnowledgeItem {
    id: string;
    type: 'fact' | 'decision' | 'insight' | 'question';
    content: string;
    author: string;
    confidence: number;
    timestamp: Date;
}

export interface Thought {
    id: string;
    participantId: string;
    type: ThoughtType;
    content: string;
    references?: string[];
    reactions: Reaction[];
    timestamp: Date;
}

export type ThoughtType =
    | 'idea'
    | 'question'
    | 'suggestion'
    | 'concern'
    | 'approval'
    | 'insight'
    | 'code';

export interface Reaction {
    participantId: string;
    type: 'agree' | 'disagree' | 'question' | 'expand';
    comment?: string;
}

export interface CollaborativeDecision {
    id: string;
    topic: string;
    options: DecisionOption[];
    votes: Map<string, string>;
    status: 'open' | 'closed';
    outcome?: string;
    timestamp: Date;
}

export interface DecisionOption {
    id: string;
    description: string;
    proposedBy: string;
    pros: string[];
    cons: string[];
}

export interface SyncEvent {
    type: 'thought' | 'decision' | 'context' | 'participant';
    data: any;
    timestamp: Date;
}

export class MindMeldingEngine extends EventEmitter {
    private static instance: MindMeldingEngine;
    private sessions: Map<string, MindMeldSession> = new Map();
    private syncQueue: SyncEvent[] = [];

    private constructor() {
        super();
    }

    static getInstance(): MindMeldingEngine {
        if (!MindMeldingEngine.instance) {
            MindMeldingEngine.instance = new MindMeldingEngine();
        }
        return MindMeldingEngine.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    createSession(name: string, objectives: string[]): MindMeldSession {
        const session: MindMeldSession = {
            id: `meld_${Date.now()}`,
            name,
            participants: [],
            sharedContext: {
                id: `ctx_${Date.now()}`,
                codebase: {
                    files: [],
                    lastSync: new Date(),
                    version: '1.0.0',
                },
                objectives,
                constraints: [],
                sharedKnowledge: [],
                activeFiles: [],
            },
            thoughtStream: [],
            decisions: [],
            status: 'active',
            createdAt: new Date(),
            lastActivity: new Date(),
        };

        this.sessions.set(session.id, session);

        // Add AI participant by default
        this.joinSession(session.id, {
            id: 'shadow_ai',
            name: 'Shadow AI',
            type: 'ai',
            role: 'contributor',
            expertise: ['code-generation', 'review', 'debugging', 'optimization'],
            status: 'online',
            contributions: 0,
            lastSeen: new Date(),
        });

        this.emit('session:created', session);
        return session;
    }

    joinSession(sessionId: string, participant: Participant): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.participants.push(participant);
        session.lastActivity = new Date();

        this.queueSync({
            type: 'participant',
            data: { action: 'join', participant },
            timestamp: new Date(),
        });

        this.emit('participant:joined', { session, participant });
    }

    leaveSession(sessionId: string, participantId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const participant = session.participants.find(p => p.id === participantId);
        if (participant) {
            participant.status = 'offline';
            session.lastActivity = new Date();
            this.emit('participant:left', { session, participant });
        }
    }

    // ========================================================================
    // THOUGHT STREAM
    // ========================================================================

    shareThought(sessionId: string, participantId: string, type: ThoughtType, content: string, references?: string[]): Thought {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const thought: Thought = {
            id: `thought_${Date.now()}`,
            participantId,
            type,
            content,
            references,
            reactions: [],
            timestamp: new Date(),
        };

        session.thoughtStream.push(thought);
        session.lastActivity = new Date();

        // Update contributor count
        const participant = session.participants.find(p => p.id === participantId);
        if (participant) {
            participant.contributions++;
        }

        // AI can automatically respond to certain thoughts
        if (type === 'question' && participantId !== 'shadow_ai') {
            this.scheduleAIResponse(session, thought);
        }

        this.queueSync({
            type: 'thought',
            data: thought,
            timestamp: new Date(),
        });

        this.emit('thought:shared', { session, thought });
        return thought;
    }

    reactToThought(sessionId: string, thoughtId: string, participantId: string, reaction: Omit<Reaction, 'participantId'>): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const thought = session.thoughtStream.find(t => t.id === thoughtId);
        if (thought) {
            thought.reactions.push({ ...reaction, participantId });
            this.emit('thought:reaction', { session, thought, reaction });
        }
    }

    private async scheduleAIResponse(session: MindMeldSession, question: Thought): Promise<void> {
        // Simulate AI thinking time
        await new Promise(r => setTimeout(r, 500));

        const response = this.generateAIResponse(question, session.sharedContext);
        this.shareThought(session.id, 'shadow_ai', 'insight', response, [question.id]);
    }

    private generateAIResponse(question: Thought, context: SharedContext): string {
        const responses: Record<string, string> = {
            default: `Analyzing your question: "${question.content.slice(0, 50)}..."\n\nBased on the current context and objectives, here's my insight:`,
            code: `Let me suggest an approach for: ${question.content.slice(0, 50)}...\n\nConsider implementing this pattern:`,
        };

        return question.type === 'code' ? responses.code : responses.default;
    }

    // ========================================================================
    // SHARED KNOWLEDGE
    // ========================================================================

    addKnowledge(sessionId: string, item: Omit<KnowledgeItem, 'id' | 'timestamp'>): KnowledgeItem {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const knowledge: KnowledgeItem = {
            ...item,
            id: `knowledge_${Date.now()}`,
            timestamp: new Date(),
        };

        session.sharedContext.sharedKnowledge.push(knowledge);
        session.lastActivity = new Date();

        this.queueSync({
            type: 'context',
            data: { action: 'knowledge', knowledge },
            timestamp: new Date(),
        });

        this.emit('knowledge:added', { session, knowledge });
        return knowledge;
    }

    updateFocus(sessionId: string, focusArea: string, activeFiles: string[]): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.sharedContext.focusArea = focusArea;
        session.sharedContext.activeFiles = activeFiles;
        session.lastActivity = new Date();

        this.queueSync({
            type: 'context',
            data: { action: 'focus', focusArea, activeFiles },
            timestamp: new Date(),
        });

        this.emit('focus:updated', { session, focusArea });
    }

    // ========================================================================
    // COLLABORATIVE DECISIONS
    // ========================================================================

    proposeDecision(sessionId: string, topic: string, options: Omit<DecisionOption, 'id'>[]): CollaborativeDecision {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const decision: CollaborativeDecision = {
            id: `decision_${Date.now()}`,
            topic,
            options: options.map((o, i) => ({ ...o, id: `option_${i}` })),
            votes: new Map(),
            status: 'open',
            timestamp: new Date(),
        };

        session.decisions.push(decision);
        session.lastActivity = new Date();

        this.queueSync({
            type: 'decision',
            data: { action: 'proposed', decision },
            timestamp: new Date(),
        });

        this.emit('decision:proposed', { session, decision });
        return decision;
    }

    vote(sessionId: string, decisionId: string, participantId: string, optionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const decision = session.decisions.find(d => d.id === decisionId);
        if (decision && decision.status === 'open') {
            decision.votes.set(participantId, optionId);
            this.emit('decision:voted', { session, decision, participantId, optionId });
        }
    }

    closeDecision(sessionId: string, decisionId: string): string | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        const decision = session.decisions.find(d => d.id === decisionId);
        if (!decision || decision.status === 'closed') return undefined;

        // Count votes
        const voteCounts = new Map<string, number>();
        for (const optionId of decision.votes.values()) {
            voteCounts.set(optionId, (voteCounts.get(optionId) || 0) + 1);
        }

        // Find winner
        let winner = '';
        let maxVotes = 0;
        for (const [optionId, count] of voteCounts) {
            if (count > maxVotes) {
                maxVotes = count;
                winner = optionId;
            }
        }

        decision.status = 'closed';
        decision.outcome = winner;

        // Add to shared knowledge
        const winningOption = decision.options.find(o => o.id === winner);
        if (winningOption) {
            this.addKnowledge(sessionId, {
                type: 'decision',
                content: `Decision: ${decision.topic} → ${winningOption.description}`,
                author: 'collaborative',
                confidence: maxVotes / decision.votes.size,
            });
        }

        this.emit('decision:closed', { session, decision, outcome: winner });
        return winner;
    }

    // ========================================================================
    // SYNCHRONIZATION
    // ========================================================================

    private queueSync(event: SyncEvent): void {
        this.syncQueue.push(event);
        this.emit('sync:queued', event);
    }

    getSyncQueue(): SyncEvent[] {
        return [...this.syncQueue];
    }

    clearSyncQueue(): void {
        this.syncQueue = [];
    }

    // ========================================================================
    // COLLECTIVE INTELLIGENCE
    // ========================================================================

    async synthesizeInsights(sessionId: string): Promise<string[]> {
        const session = this.sessions.get(sessionId);
        if (!session) return [];

        const insights: string[] = [];

        // Analyze thought patterns
        const thoughtTypes = new Map<ThoughtType, number>();
        for (const thought of session.thoughtStream) {
            thoughtTypes.set(thought.type, (thoughtTypes.get(thought.type) || 0) + 1);
        }

        if (thoughtTypes.get('concern')! > thoughtTypes.get('approval')!) {
            insights.push('Team has more concerns than approvals - consider addressing blockers');
        }

        if (thoughtTypes.get('question')! > 5) {
            insights.push('Many questions raised - consider a focused clarification session');
        }

        // Analyze participation
        const contributions = session.participants.map(p => p.contributions);
        const avgContributions = contributions.reduce((a, b) => a + b, 0) / contributions.length;
        const lowContributors = session.participants.filter(p => p.contributions < avgContributions * 0.5);

        if (lowContributors.length > 0 && lowContributors[0].type === 'human') {
            insights.push(`${lowContributors.length} participant(s) have low engagement - consider direct input`);
        }

        // Analyze decisions
        const openDecisions = session.decisions.filter(d => d.status === 'open');
        if (openDecisions.length > 2) {
            insights.push('Multiple open decisions - consider prioritizing and resolving');
        }

        return insights;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSession(id: string): MindMeldSession | undefined {
        return this.sessions.get(id);
    }

    getAllSessions(): MindMeldSession[] {
        return Array.from(this.sessions.values());
    }

    getActiveSessions(): MindMeldSession[] {
        return Array.from(this.sessions.values()).filter(s => s.status === 'active');
    }

    getStats(sessionId: string): {
        participants: number;
        thoughts: number;
        decisions: number;
        knowledge: number;
        activeHours: number;
    } | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        const activeHours = (Date.now() - session.createdAt.getTime()) / (1000 * 60 * 60);

        return {
            participants: session.participants.length,
            thoughts: session.thoughtStream.length,
            decisions: session.decisions.length,
            knowledge: session.sharedContext.sharedKnowledge.length,
            activeHours: Math.round(activeHours * 10) / 10,
        };
    }
}

export const mindMeldingEngine = MindMeldingEngine.getInstance();
