/**
 * Debug Assistant - AI debugging help
 */
import { EventEmitter } from 'events';

export interface DebugSession { id: string; error: string; stackTrace: string; code: string; language: string; analysis?: string; suggestions: string[]; rootCause?: string; }

export class DebugAssistantEngine extends EventEmitter {
    private static instance: DebugAssistantEngine;
    private sessions: Map<string, DebugSession> = new Map();
    private constructor() { super(); }
    static getInstance(): DebugAssistantEngine { if (!DebugAssistantEngine.instance) DebugAssistantEngine.instance = new DebugAssistantEngine(); return DebugAssistantEngine.instance; }

    async analyze(error: string, stackTrace: string, code: string, language: string): Promise<DebugSession> {
        const session: DebugSession = { id: `debug_${Date.now()}`, error, stackTrace, code, language, suggestions: [] };
        this.sessions.set(session.id, session);
        await new Promise(r => setTimeout(r, 100));
        if (error.includes('undefined')) { session.rootCause = 'Accessing property on undefined value'; session.suggestions.push('Add null/undefined check before access', 'Use optional chaining (?.)'); }
        else if (error.includes('network')) { session.rootCause = 'Network connectivity issue'; session.suggestions.push('Check API endpoint', 'Add retry logic', 'Verify CORS settings'); }
        else { session.rootCause = 'Logic error in code'; session.suggestions.push('Review the algorithm', 'Add console.log for debugging'); }
        session.analysis = `Error "${error}" in ${language} code. Root cause: ${session.rootCause}`;
        this.emit('analyzed', session); return session;
    }

    async suggestBreakpoints(code: string): Promise<number[]> { const lines = code.split('\n'); return lines.map((l, i) => l.includes('=') || l.includes('return') ? i + 1 : -1).filter(n => n > 0).slice(0, 5); }
    async explainError(error: string): Promise<string> { return `The error "${error}" typically occurs when...`; }
    get(sessionId: string): DebugSession | null { return this.sessions.get(sessionId) || null; }
}
export function getDebugAssistantEngine(): DebugAssistantEngine { return DebugAssistantEngine.getInstance(); }
