/**
 * AI Pair Programmer
 * 
 * Provides real-time coding assistance with intelligent suggestions,
 * code explanations, and collaborative problem-solving.
 */

import { EventEmitter } from 'events';

export interface PairSession {
    id: string;
    mode: PairMode;
    context: SessionContext;
    history: PairInteraction[];
    suggestions: ActiveSuggestion[];
    startedAt: Date;
    lastActivityAt: Date;
    stats: SessionStats;
}

export type PairMode =
    | 'active' // AI actively suggests
    | 'passive' // AI responds to requests
    | 'teaching' // AI explains concepts
    | 'review' // AI reviews code
    | 'debugging' // AI helps debug;

export interface SessionContext {
    file: string;
    language: string;
    cursorLine: number;
    visibleCode: string;
    recentChanges: CodeChange[];
    currentTask?: string;
    errors: CodeError[];
}

export interface CodeChange {
    line: number;
    type: 'insert' | 'delete' | 'modify';
    content: string;
    timestamp: Date;
}

export interface CodeError {
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    code?: string;
}

export interface PairInteraction {
    id: string;
    type: 'suggestion' | 'question' | 'explanation' | 'action';
    from: 'ai' | 'user';
    content: string;
    code?: string;
    timestamp: Date;
    accepted?: boolean;
}

export interface ActiveSuggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    code?: string;
    line?: number;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
}

export type SuggestionType =
    | 'completion'
    | 'refactor'
    | 'fix'
    | 'improvement'
    | 'documentation'
    | 'test';

export interface SessionStats {
    suggestionsShown: number;
    suggestionsAccepted: number;
    questionsAsked: number;
    linesWritten: number;
    errorsFixed: number;
}

export class AIPairProgrammerEngine extends EventEmitter {
    private static instance: AIPairProgrammerEngine;
    private sessions: Map<string, PairSession> = new Map();
    private activeSession: string | null = null;

    private constructor() {
        super();
    }

    static getInstance(): AIPairProgrammerEngine {
        if (!AIPairProgrammerEngine.instance) {
            AIPairProgrammerEngine.instance = new AIPairProgrammerEngine();
        }
        return AIPairProgrammerEngine.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    startSession(mode: PairMode = 'active'): PairSession {
        const session: PairSession = {
            id: `pair_${Date.now()}`,
            mode,
            context: {
                file: '',
                language: 'typescript',
                cursorLine: 1,
                visibleCode: '',
                recentChanges: [],
                errors: [],
            },
            history: [],
            suggestions: [],
            startedAt: new Date(),
            lastActivityAt: new Date(),
            stats: {
                suggestionsShown: 0,
                suggestionsAccepted: 0,
                questionsAsked: 0,
                linesWritten: 0,
                errorsFixed: 0,
            },
        };

        this.sessions.set(session.id, session);
        this.activeSession = session.id;

        // Add greeting based on mode
        this.addInteraction(session.id, {
            type: 'explanation',
            from: 'ai',
            content: this.getGreeting(mode),
        });

        this.emit('session:started', session);
        return session;
    }

    private getGreeting(mode: PairMode): string {
        switch (mode) {
            case 'active':
                return "I'm ready to help! I'll proactively suggest improvements as you code.";
            case 'passive':
                return "I'm here when you need me. Just ask if you want help.";
            case 'teaching':
                return "Teaching mode active! I'll explain concepts as we go.";
            case 'review':
                return "Review mode active. I'll analyze your code for improvements.";
            case 'debugging':
                return "Debugging mode active. Let's find and fix those bugs!";
            default:
                return "Ready to pair program!";
        }
    }

    setMode(sessionId: string, mode: PairMode): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.mode = mode;
        this.emit('mode:changed', { sessionId, mode });
        return true;
    }

    endSession(sessionId: string): PairSession | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        if (this.activeSession === sessionId) {
            this.activeSession = null;
        }

        this.emit('session:ended', session);
        return session;
    }

    getActiveSession(): PairSession | undefined {
        return this.activeSession ? this.sessions.get(this.activeSession) : undefined;
    }

    // ========================================================================
    // CONTEXT UPDATES
    // ========================================================================

    updateContext(sessionId: string, context: Partial<SessionContext>): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        Object.assign(session.context, context);
        session.lastActivityAt = new Date();

        // Generate suggestions based on new context
        if (session.mode === 'active' || session.mode === 'debugging') {
            this.generateSuggestions(session);
        }

        this.emit('context:updated', { sessionId, context: session.context });
    }

    recordChange(sessionId: string, change: Omit<CodeChange, 'timestamp'>): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.context.recentChanges.push({
            ...change,
            timestamp: new Date(),
        });

        // Keep only recent changes
        if (session.context.recentChanges.length > 20) {
            session.context.recentChanges.shift();
        }

        session.stats.linesWritten++;
        session.lastActivityAt = new Date();

        this.emit('change:recorded', { sessionId, change });
    }

    reportError(sessionId: string, error: CodeError): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.context.errors.push(error);

        // Generate fix suggestion in debugging mode
        if (session.mode === 'debugging' || session.mode === 'active') {
            this.suggestFix(session, error);
        }

        this.emit('error:reported', { sessionId, error });
    }

    // ========================================================================
    // SUGGESTIONS
    // ========================================================================

    private generateSuggestions(session: PairSession): void {
        session.suggestions = [];

        const { visibleCode, cursorLine, errors, language } = session.context;
        const lines = visibleCode.split('\n');
        const currentLine = lines[cursorLine - 1] || '';

        // Check for common issues
        if (currentLine.includes('console.log')) {
            session.suggestions.push({
                id: `sug_${Date.now()}_1`,
                type: 'improvement',
                title: 'Consider using a logger',
                description: 'Replace console.log with a proper logging library for production code.',
                priority: 'low',
                confidence: 0.8,
                line: cursorLine,
            });
        }

        if (currentLine.includes('any')) {
            session.suggestions.push({
                id: `sug_${Date.now()}_2`,
                type: 'improvement',
                title: 'Avoid using "any" type',
                description: 'Consider using a more specific type for better type safety.',
                priority: 'medium',
                confidence: 0.9,
            });
        }

        // Suggest documentation for functions
        if (currentLine.match(/^(export\s+)?(async\s+)?function\s+\w+/) &&
            !lines[cursorLine - 2]?.includes('/**')) {
            session.suggestions.push({
                id: `sug_${Date.now()}_3`,
                type: 'documentation',
                title: 'Add JSDoc documentation',
                description: 'This function could benefit from documentation.',
                priority: 'low',
                confidence: 0.7,
            });
        }

        // Error fixes
        for (const error of errors) {
            if (error.message.includes('is not defined')) {
                session.suggestions.push({
                    id: `sug_${Date.now()}_fix`,
                    type: 'fix',
                    title: 'Fix undefined reference',
                    description: `Variable or function might need to be imported or declared.`,
                    priority: 'high',
                    confidence: 0.9,
                    line: error.line,
                });
            }
        }

        session.stats.suggestionsShown += session.suggestions.length;
        this.emit('suggestions:generated', { sessionId: session.id, count: session.suggestions.length });
    }

    private suggestFix(session: PairSession, error: CodeError): void {
        const suggestion: ActiveSuggestion = {
            id: `fix_${Date.now()}`,
            type: 'fix',
            title: `Fix: ${error.message.slice(0, 50)}`,
            description: this.generateFixDescription(error),
            line: error.line,
            priority: error.severity === 'error' ? 'high' : 'medium',
            confidence: 0.8,
        };

        session.suggestions.unshift(suggestion);
        this.emit('fix:suggested', { sessionId: session.id, suggestion });
    }

    private generateFixDescription(error: CodeError): string {
        if (error.message.includes('is not defined')) {
            return 'Check if the variable needs to be imported or declared above.';
        }
        if (error.message.includes('cannot find module')) {
            return 'The module might need to be installed: npm install <module>';
        }
        if (error.message.includes('type')) {
            return 'There may be a type mismatch. Check the expected type.';
        }
        return 'Review the error message and check the surrounding code.';
    }

    acceptSuggestion(sessionId: string, suggestionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const index = session.suggestions.findIndex(s => s.id === suggestionId);
        if (index === -1) return false;

        const suggestion = session.suggestions[index];
        session.suggestions.splice(index, 1);
        session.stats.suggestionsAccepted++;

        if (suggestion.type === 'fix') {
            session.stats.errorsFixed++;
        }

        this.addInteraction(sessionId, {
            type: 'action',
            from: 'user',
            content: `Accepted: ${suggestion.title}`,
        });

        this.emit('suggestion:accepted', { sessionId, suggestion });
        return true;
    }

    dismissSuggestion(sessionId: string, suggestionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const index = session.suggestions.findIndex(s => s.id === suggestionId);
        if (index === -1) return false;

        session.suggestions.splice(index, 1);
        this.emit('suggestion:dismissed', { sessionId, suggestionId });
        return true;
    }

    // ========================================================================
    // INTERACTIONS
    // ========================================================================

    askQuestion(sessionId: string, question: string): PairInteraction | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        // Record user question
        this.addInteraction(sessionId, {
            type: 'question',
            from: 'user',
            content: question,
        });

        session.stats.questionsAsked++;

        // Generate AI response
        const response = this.generateResponse(session, question);
        return this.addInteraction(sessionId, response);
    }

    private generateResponse(session: PairSession, question: string): Omit<PairInteraction, 'id' | 'timestamp'> {
        const lower = question.toLowerCase();

        // Pattern-based responses (in real implementation, would use AI)
        if (lower.includes('how do i') || lower.includes('how to')) {
            return {
                type: 'explanation',
                from: 'ai',
                content: `I can help you with that! Based on the current context, here's what I suggest...`,
            };
        }

        if (lower.includes('what is') || lower.includes("what's")) {
            return {
                type: 'explanation',
                from: 'ai',
                content: `Let me explain that concept...`,
            };
        }

        if (lower.includes('fix') || lower.includes('error') || lower.includes('bug')) {
            return {
                type: 'suggestion',
                from: 'ai',
                content: `I see the issue. Here's how we can fix it...`,
                code: session.context.errors.length > 0
                    ? `// Fix for: ${session.context.errors[0].message}`
                    : undefined,
            };
        }

        return {
            type: 'explanation',
            from: 'ai',
            content: `I'm analyzing your question in the context of ${session.context.file}. Let me help...`,
        };
    }

    private addInteraction(
        sessionId: string,
        data: Omit<PairInteraction, 'id' | 'timestamp'>
    ): PairInteraction {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const interaction: PairInteraction = {
            ...data,
            id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date(),
        };

        session.history.push(interaction);
        session.lastActivityAt = new Date();

        this.emit('interaction:added', { sessionId, interaction });
        return interaction;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSession(id: string): PairSession | undefined {
        return this.sessions.get(id);
    }

    getAllSessions(): PairSession[] {
        return Array.from(this.sessions.values());
    }

    getSuggestions(sessionId: string): ActiveSuggestion[] {
        const session = this.sessions.get(sessionId);
        return session ? session.suggestions : [];
    }

    getHistory(sessionId: string): PairInteraction[] {
        const session = this.sessions.get(sessionId);
        return session ? session.history : [];
    }

    getStats(sessionId: string): SessionStats | undefined {
        const session = this.sessions.get(sessionId);
        return session?.stats;
    }
}

export const aiPairProgrammerEngine = AIPairProgrammerEngine.getInstance();
