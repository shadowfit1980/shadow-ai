/**
 * Dictation Engine - Continuous dictation
 */
import { EventEmitter } from 'events';

export interface DictationSession { id: string; text: string; words: number; duration: number; status: 'active' | 'paused' | 'stopped'; }

export class DictationEngine extends EventEmitter {
    private static instance: DictationEngine;
    private sessions: Map<string, DictationSession> = new Map();
    private autoCorrect = true;
    private autoPunctuation = true;
    private constructor() { super(); }
    static getInstance(): DictationEngine { if (!DictationEngine.instance) DictationEngine.instance = new DictationEngine(); return DictationEngine.instance; }

    start(): DictationSession { const session: DictationSession = { id: `dict_${Date.now()}`, text: '', words: 0, duration: 0, status: 'active' }; this.sessions.set(session.id, session); return session; }

    append(sessionId: string, text: string): boolean {
        const s = this.sessions.get(sessionId); if (!s || s.status !== 'active') return false;
        let processed = text;
        if (this.autoPunctuation) processed = this.addPunctuation(processed);
        if (this.autoCorrect) processed = this.correctText(processed);
        s.text += (s.text ? ' ' : '') + processed; s.words = s.text.split(/\s+/).length;
        this.emit('appended', { sessionId, text: processed }); return true;
    }

    private addPunctuation(text: string): string { return text.replace(/\s+(question mark|period|comma|exclamation)/gi, (_, p) => p === 'period' ? '.' : p === 'comma' ? ',' : p === 'question mark' ? '?' : '!'); }
    private correctText(text: string): string { return text.charAt(0).toUpperCase() + text.slice(1); }
    pause(sessionId: string): void { const s = this.sessions.get(sessionId); if (s) s.status = 'paused'; }
    resume(sessionId: string): void { const s = this.sessions.get(sessionId); if (s) s.status = 'active'; }
    stop(sessionId: string): DictationSession | null { const s = this.sessions.get(sessionId); if (s) s.status = 'stopped'; return s || null; }
}
export function getDictationEngine(): DictationEngine { return DictationEngine.getInstance(); }
