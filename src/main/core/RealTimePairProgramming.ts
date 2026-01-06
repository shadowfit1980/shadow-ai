/**
 * 👥 RealTimePairProgramming - AI Pair Programmer That Types With You
 * 
 * Claude's Recommendation: Real-Time Pair Programming with AI
 * AI types with you, sees your cursor, suggests in real-time
 */

import { EventEmitter } from 'events';
import { UnifiedExecutionEngine, unifiedExecutionEngine } from './UnifiedExecutionEngine';
import { InfiniteContextEngine, infiniteContextEngine } from './InfiniteContextEngine';

// Types
export interface PairSession {
    id: string;
    file: string;
    language: string;
    startTime: Date;
    participants: Participant[];
    status: 'active' | 'paused' | 'ended';
    suggestions: CodeSuggestion[];
    metrics: SessionMetrics;
}

export interface Participant {
    id: string;
    type: 'human' | 'ai';
    name: string;
    cursor: CursorPosition;
    lastActive: Date;
}

export interface CursorPosition {
    line: number;
    column: number;
    selection?: Selection;
}

export interface Selection {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export interface CodeSuggestion {
    id: string;
    type: SuggestionType;
    content: string;
    position: CursorPosition;
    confidence: number;
    reasoning?: string;
    accepted?: boolean;
    timestamp: Date;
}

export type SuggestionType =
    | 'completion'
    | 'refactor'
    | 'bug_fix'
    | 'optimization'
    | 'documentation'
    | 'test';

export interface SessionMetrics {
    suggestionsShown: number;
    suggestionsAccepted: number;
    charactersTyped: number;
    linesChanged: number;
    aiContribution: number; // percentage
}

export interface LiveEdit {
    position: CursorPosition;
    type: 'insert' | 'delete' | 'replace';
    content: string;
    author: string;
}

export class RealTimePairProgramming extends EventEmitter {
    private static instance: RealTimePairProgramming;
    private sessions: Map<string, PairSession> = new Map();
    private executionEngine: UnifiedExecutionEngine;
    private contextEngine: InfiniteContextEngine;
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

    private constructor() {
        super();
        this.executionEngine = unifiedExecutionEngine;
        this.contextEngine = infiniteContextEngine;
    }

    static getInstance(): RealTimePairProgramming {
        if (!RealTimePairProgramming.instance) {
            RealTimePairProgramming.instance = new RealTimePairProgramming();
        }
        return RealTimePairProgramming.instance;
    }

    /**
     * Start a pair programming session
     */
    startSession(file: string, language: string): PairSession {
        const session: PairSession = {
            id: `pair_${Date.now()}`,
            file,
            language,
            startTime: new Date(),
            participants: [
                {
                    id: 'human_1',
                    type: 'human',
                    name: 'Developer',
                    cursor: { line: 1, column: 1 },
                    lastActive: new Date()
                },
                {
                    id: 'ai_copilot',
                    type: 'ai',
                    name: 'Shadow AI',
                    cursor: { line: 1, column: 1 },
                    lastActive: new Date()
                }
            ],
            status: 'active',
            suggestions: [],
            metrics: {
                suggestionsShown: 0,
                suggestionsAccepted: 0,
                charactersTyped: 0,
                linesChanged: 0,
                aiContribution: 0
            }
        };

        this.sessions.set(session.id, session);
        this.emit('session:started', { session });

        return session;
    }

    /**
     * Update cursor position
     */
    updateCursor(sessionId: string, participantId: string, cursor: CursorPosition): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const participant = session.participants.find(p => p.id === participantId);
        if (participant) {
            participant.cursor = cursor;
            participant.lastActive = new Date();

            this.emit('cursor:updated', { sessionId, participantId, cursor });

            // Debounce AI suggestions
            if (participantId.startsWith('human')) {
                this.debounceSuggestion(session, cursor);
            }
        }
    }

    /**
     * Handle text change
     */
    async onTextChange(
        sessionId: string,
        content: string,
        cursor: CursorPosition
    ): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.metrics.charactersTyped += Math.abs(content.length);

        // Generate real-time suggestions
        this.debounceSuggestion(session, cursor, content);
    }

    /**
     * Debounce suggestion generation
     */
    private debounceSuggestion(
        session: PairSession,
        cursor: CursorPosition,
        recentContent?: string
    ): void {
        const existingTimer = this.debounceTimers.get(session.id);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(async () => {
            await this.generateSuggestion(session, cursor, recentContent);
        }, 300); // 300ms debounce

        this.debounceTimers.set(session.id, timer);
    }

    /**
     * Generate AI suggestion
     */
    private async generateSuggestion(
        session: PairSession,
        cursor: CursorPosition,
        recentContent?: string
    ): Promise<void> {
        try {
            // Get context from the codebase
            const context = await this.contextEngine.getContextWindow(
                session.file,
                cursor.line,
                50
            );

            const result = await this.executionEngine.execute({
                id: `suggestion_${Date.now()}`,
                prompt: `You are pair programming on a ${session.language} file.
Current cursor: line ${cursor.line}, column ${cursor.column}
Recent typing: ${recentContent || 'none'}

Code context:
${context}

Provide a helpful code completion or suggestion. Be concise.
If no suggestion needed, respond with "NONE".`,
                model: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
                options: { temperature: 0.3, maxTokens: 200 }
            });

            if (result.content.trim() === 'NONE') return;

            const suggestion: CodeSuggestion = {
                id: `sug_${Date.now()}`,
                type: this.detectSuggestionType(result.content),
                content: result.content,
                position: cursor,
                confidence: 0.85,
                timestamp: new Date()
            };

            session.suggestions.push(suggestion);
            session.metrics.suggestionsShown++;

            this.emit('suggestion', { sessionId: session.id, suggestion });

        } catch (error) {
            console.error('Failed to generate suggestion:', error);
        }
    }

    /**
     * Accept a suggestion
     */
    acceptSuggestion(sessionId: string, suggestionId: string): CodeSuggestion | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const suggestion = session.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.accepted = true;
            session.metrics.suggestionsAccepted++;
            session.metrics.aiContribution =
                (session.metrics.suggestionsAccepted / session.metrics.suggestionsShown) * 100;

            this.emit('suggestion:accepted', { sessionId, suggestion });
            return suggestion;
        }
    }

    /**
     * Reject a suggestion
     */
    rejectSuggestion(sessionId: string, suggestionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const suggestion = session.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.accepted = false;
            this.emit('suggestion:rejected', { sessionId, suggestionId });
        }
    }

    /**
     * Request specific help
     */
    async requestHelp(
        sessionId: string,
        cursor: CursorPosition,
        helpType: SuggestionType
    ): Promise<CodeSuggestion> {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const context = await this.contextEngine.getContextWindow(session.file, cursor.line, 100);

        const prompts: Record<SuggestionType, string> = {
            completion: 'Complete this code',
            refactor: 'Suggest how to refactor this code for better quality',
            bug_fix: 'Find and fix potential bugs in this code',
            optimization: 'Optimize this code for performance',
            documentation: 'Generate documentation for this code',
            test: 'Generate unit tests for this code'
        };

        const result = await this.executionEngine.execute({
            id: `help_${Date.now()}`,
            prompt: `${prompts[helpType]}:

${context}

Provide ${session.language} code.`,
            model: { provider: 'anthropic' },
            options: { maxTokens: 1000 }
        });

        const suggestion: CodeSuggestion = {
            id: `help_${Date.now()}`,
            type: helpType,
            content: result.content,
            position: cursor,
            confidence: 0.9,
            reasoning: `Generated ${helpType} for selected code`,
            timestamp: new Date()
        };

        session.suggestions.push(suggestion);
        session.metrics.suggestionsShown++;

        this.emit('help:provided', { sessionId, suggestion });
        return suggestion;
    }

    /**
     * AI takes over typing
     */
    async aiTakeover(
        sessionId: string,
        task: string,
        durationSeconds = 30
    ): Promise<string> {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        this.emit('takeover:started', { sessionId, task });

        const result = await this.executionEngine.execute({
            id: `takeover_${Date.now()}`,
            prompt: `Take over coding and ${task}.
Language: ${session.language}
Time limit: ${durationSeconds} seconds

Provide complete, working code.`,
            model: { provider: 'anthropic' },
            options: { maxTokens: 2000 }
        });

        this.emit('takeover:completed', { sessionId, result: result.content });
        return result.content;
    }

    /**
     * End session
     */
    endSession(sessionId: string): SessionMetrics | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.status = 'ended';

        // Clear debounce timer
        const timer = this.debounceTimers.get(sessionId);
        if (timer) clearTimeout(timer);
        this.debounceTimers.delete(sessionId);

        this.emit('session:ended', { sessionId, metrics: session.metrics });
        return session.metrics;
    }

    // Helpers
    private detectSuggestionType(content: string): SuggestionType {
        const lower = content.toLowerCase();
        if (lower.includes('test') || lower.includes('expect')) return 'test';
        if (lower.includes('bug') || lower.includes('fix')) return 'bug_fix';
        if (lower.includes('optimize') || lower.includes('performance')) return 'optimization';
        if (lower.includes('/**') || lower.includes('///')) return 'documentation';
        if (lower.includes('refactor') || lower.includes('extract')) return 'refactor';
        return 'completion';
    }

    /**
     * Get active sessions
     */
    getActiveSessions(): PairSession[] {
        return Array.from(this.sessions.values())
            .filter(s => s.status === 'active');
    }

    /**
     * Get session
     */
    getSession(sessionId: string): PairSession | undefined {
        return this.sessions.get(sessionId);
    }
}

export const realTimePairProgramming = RealTimePairProgramming.getInstance();
