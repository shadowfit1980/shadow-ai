/**
 * ReasoningTracer - Agent Thought Process Inspector
 * 
 * Provides deep inspection of agent reasoning and decision-making
 * for debugging, transparency, and learning purposes.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface TraceStep {
    id: string;
    timestamp: Date;
    type: 'thought' | 'decision' | 'action' | 'observation' | 'reflection';
    content: string;
    confidence: number;
    metadata?: Record<string, any>;
}

export interface Decision {
    id: string;
    timestamp: Date;
    decision: string;
    alternatives: string[];
    rationale: string;
    selectedIndex: number;
    confidence: number;
}

export interface TraceSession {
    id: string;
    taskId: string;
    startTime: Date;
    endTime?: Date;
    steps: TraceStep[];
    decisions: Decision[];
    status: 'active' | 'completed' | 'failed';
    summary?: string;
}

export interface TraceExportOptions {
    format: 'json' | 'markdown' | 'mermaid';
    includeTimestamps?: boolean;
    includeConfidence?: boolean;
    includeMetadata?: boolean;
}

// ============================================================================
// REASONING TRACER
// ============================================================================

export class ReasoningTracer extends EventEmitter {
    private static instance: ReasoningTracer;
    private sessions: Map<string, TraceSession> = new Map();
    private activeSession: TraceSession | null = null;

    private constructor() {
        super();
    }

    static getInstance(): ReasoningTracer {
        if (!ReasoningTracer.instance) {
            ReasoningTracer.instance = new ReasoningTracer();
        }
        return ReasoningTracer.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    /**
     * Start a new trace session for a task
     */
    startTrace(taskId: string): TraceSession {
        const session: TraceSession = {
            id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            taskId,
            startTime: new Date(),
            steps: [],
            decisions: [],
            status: 'active'
        };

        this.sessions.set(session.id, session);
        this.activeSession = session;

        this.emit('trace:started', { sessionId: session.id, taskId });
        console.log(`🔍 [ReasoningTracer] Started trace session: ${session.id}`);

        return session;
    }

    /**
     * End the current trace session
     */
    endTrace(summary?: string): TraceSession | null {
        if (!this.activeSession) {
            return null;
        }

        this.activeSession.endTime = new Date();
        this.activeSession.status = 'completed';
        this.activeSession.summary = summary;

        const completedSession = this.activeSession;
        this.activeSession = null;

        this.emit('trace:ended', { sessionId: completedSession.id, summary });
        console.log(`✅ [ReasoningTracer] Ended trace session: ${completedSession.id}`);

        return completedSession;
    }

    /**
     * Mark session as failed
     */
    failTrace(error: string): TraceSession | null {
        if (!this.activeSession) {
            return null;
        }

        this.activeSession.endTime = new Date();
        this.activeSession.status = 'failed';
        this.activeSession.summary = `Failed: ${error}`;

        const failedSession = this.activeSession;
        this.activeSession = null;

        this.emit('trace:failed', { sessionId: failedSession.id, error });
        return failedSession;
    }

    // ========================================================================
    // STEP RECORDING
    // ========================================================================

    /**
     * Record a thought step in the reasoning process
     */
    recordThought(content: string, confidence: number = 0.8, metadata?: Record<string, any>): void {
        this.recordStep('thought', content, confidence, metadata);
    }

    /**
     * Record an action being taken
     */
    recordAction(content: string, confidence: number = 0.9, metadata?: Record<string, any>): void {
        this.recordStep('action', content, confidence, metadata);
    }

    /**
     * Record an observation from the environment
     */
    recordObservation(content: string, metadata?: Record<string, any>): void {
        this.recordStep('observation', content, 1.0, metadata);
    }

    /**
     * Record a reflection on previous steps
     */
    recordReflection(content: string, confidence: number = 0.7, metadata?: Record<string, any>): void {
        this.recordStep('reflection', content, confidence, metadata);
    }

    /**
     * Record a decision point with alternatives
     */
    recordDecision(
        decision: string,
        alternatives: string[],
        rationale: string,
        selectedIndex: number = 0,
        confidence: number = 0.8
    ): void {
        if (!this.activeSession) {
            console.warn('[ReasoningTracer] No active session for decision');
            return;
        }

        const decisionRecord: Decision = {
            id: `decision-${Date.now()}`,
            timestamp: new Date(),
            decision,
            alternatives,
            rationale,
            selectedIndex,
            confidence
        };

        this.activeSession.decisions.push(decisionRecord);

        // Also record as a step for timeline
        this.recordStep('decision', `${decision} (selected from ${alternatives.length} options)`, confidence, {
            alternatives,
            rationale,
            selectedIndex
        });

        this.emit('decision:recorded', decisionRecord);
    }

    private recordStep(
        type: TraceStep['type'],
        content: string,
        confidence: number,
        metadata?: Record<string, any>
    ): void {
        if (!this.activeSession) {
            console.warn(`[ReasoningTracer] No active session for ${type}`);
            return;
        }

        const step: TraceStep = {
            id: `step-${Date.now()}-${this.activeSession.steps.length}`,
            timestamp: new Date(),
            type,
            content,
            confidence,
            metadata
        };

        this.activeSession.steps.push(step);
        this.emit('step:recorded', step);
    }

    // ========================================================================
    // EXPORT & RETRIEVAL
    // ========================================================================

    /**
     * Get a trace session by ID
     */
    getSession(sessionId: string): TraceSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Get the current active session
     */
    getActiveSession(): TraceSession | null {
        return this.activeSession;
    }

    /**
     * Get all sessions for a task
     */
    getSessionsByTask(taskId: string): TraceSession[] {
        return Array.from(this.sessions.values())
            .filter(s => s.taskId === taskId)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    }

    /**
     * Export a trace session to various formats
     */
    exportTrace(sessionId: string, options: TraceExportOptions): string {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        switch (options.format) {
            case 'json':
                return this.exportToJSON(session, options);
            case 'markdown':
                return this.exportToMarkdown(session, options);
            case 'mermaid':
                return this.exportToMermaid(session, options);
            default:
                throw new Error(`Unknown format: ${options.format}`);
        }
    }

    private exportToJSON(session: TraceSession, options: TraceExportOptions): string {
        const data = {
            ...session,
            steps: session.steps.map(step => ({
                ...step,
                timestamp: options.includeTimestamps ? step.timestamp : undefined,
                confidence: options.includeConfidence ? step.confidence : undefined,
                metadata: options.includeMetadata ? step.metadata : undefined
            }))
        };
        return JSON.stringify(data, null, 2);
    }

    private exportToMarkdown(session: TraceSession, options: TraceExportOptions): string {
        const lines: string[] = [
            `# Reasoning Trace: ${session.taskId}`,
            '',
            `**Session ID:** ${session.id}`,
            `**Status:** ${session.status}`,
            `**Duration:** ${this.formatDuration(session.startTime, session.endTime)}`,
            ''
        ];

        if (session.summary) {
            lines.push(`## Summary`, '', session.summary, '');
        }

        lines.push('## Timeline', '');

        for (const step of session.steps) {
            const icon = this.getStepIcon(step.type);
            const timestamp = options.includeTimestamps
                ? ` [${step.timestamp.toISOString().substr(11, 8)}]`
                : '';
            const confidence = options.includeConfidence
                ? ` (${(step.confidence * 100).toFixed(0)}%)`
                : '';

            lines.push(`${icon}${timestamp} **${step.type.toUpperCase()}**${confidence}: ${step.content}`);
        }

        if (session.decisions.length > 0) {
            lines.push('', '## Key Decisions', '');
            for (const decision of session.decisions) {
                lines.push(
                    `### ${decision.decision}`,
                    '',
                    `**Rationale:** ${decision.rationale}`,
                    '',
                    '**Alternatives considered:**',
                    ...decision.alternatives.map((alt, i) =>
                        `${i === decision.selectedIndex ? '✅' : '  '} ${i + 1}. ${alt}`
                    ),
                    ''
                );
            }
        }

        return lines.join('\n');
    }

    private exportToMermaid(session: TraceSession, _options: TraceExportOptions): string {
        const lines: string[] = [
            '```mermaid',
            'graph TD'
        ];

        let prevNodeId = 'START';
        lines.push(`    ${prevNodeId}((Start))`);

        for (let i = 0; i < session.steps.length; i++) {
            const step = session.steps[i];
            const nodeId = `S${i}`;
            const shape = this.getMermaidShape(step.type);
            const label = step.content.substring(0, 50).replace(/"/g, "'");

            lines.push(`    ${nodeId}${shape[0]}"${step.type}: ${label}"${shape[1]}`);
            lines.push(`    ${prevNodeId} --> ${nodeId}`);
            prevNodeId = nodeId;
        }

        lines.push(`    ${prevNodeId} --> END((End))`);
        lines.push('```');

        return lines.join('\n');
    }

    private getStepIcon(type: TraceStep['type']): string {
        const icons: Record<TraceStep['type'], string> = {
            thought: '💭',
            decision: '🔀',
            action: '⚡',
            observation: '👁️',
            reflection: '🔄'
        };
        return icons[type] || '•';
    }

    private getMermaidShape(type: TraceStep['type']): [string, string] {
        const shapes: Record<TraceStep['type'], [string, string]> = {
            thought: ['[', ']'],
            decision: ['{', '}'],
            action: ['[[', ']]'],
            observation: ['[(', ')]'],
            reflection: ['(', ')']
        };
        return shapes[type] || ['[', ']'];
    }

    private formatDuration(start: Date, end?: Date): string {
        const endTime = end || new Date();
        const ms = endTime.getTime() - start.getTime();
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Get statistics about all traces
     */
    getStats(): {
        totalSessions: number;
        activeSessions: number;
        completedSessions: number;
        failedSessions: number;
        averageStepsPerSession: number;
    } {
        const sessions = Array.from(this.sessions.values());
        const completed = sessions.filter(s => s.status === 'completed');
        const failed = sessions.filter(s => s.status === 'failed');
        const active = sessions.filter(s => s.status === 'active');

        const totalSteps = sessions.reduce((sum, s) => sum + s.steps.length, 0);

        return {
            totalSessions: sessions.length,
            activeSessions: active.length,
            completedSessions: completed.length,
            failedSessions: failed.length,
            averageStepsPerSession: sessions.length > 0 ? totalSteps / sessions.length : 0
        };
    }

    /**
     * Clear all sessions
     */
    clear(): void {
        this.sessions.clear();
        this.activeSession = null;
    }

    /**
     * Clear old sessions (keep last N)
     */
    prune(keepLast: number = 100): number {
        const sessions = Array.from(this.sessions.entries())
            .sort((a, b) => b[1].startTime.getTime() - a[1].startTime.getTime());

        let pruned = 0;
        for (let i = keepLast; i < sessions.length; i++) {
            this.sessions.delete(sessions[i][0]);
            pruned++;
        }

        return pruned;
    }
}

// Export singleton
export const reasoningTracer = ReasoningTracer.getInstance();
