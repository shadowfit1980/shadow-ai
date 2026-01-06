/**
 * Composer Engine - Multi-file generation
 */
import { EventEmitter } from 'events';

export interface ComposerSession { id: string; prompt: string; files: { path: string; content: string; status: 'pending' | 'generating' | 'complete' }[]; status: 'active' | 'complete' | 'error'; }

export class ComposerEngine extends EventEmitter {
    private static instance: ComposerEngine;
    private sessions: Map<string, ComposerSession> = new Map();
    private constructor() { super(); }
    static getInstance(): ComposerEngine { if (!ComposerEngine.instance) ComposerEngine.instance = new ComposerEngine(); return ComposerEngine.instance; }

    start(prompt: string): ComposerSession {
        const session: ComposerSession = { id: `comp_${Date.now()}`, prompt, files: [], status: 'active' };
        this.sessions.set(session.id, session); this.emit('started', session); return session;
    }

    addFile(sessionId: string, path: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.files.push({ path, content: '', status: 'pending' }); return true; }
    async generateFile(sessionId: string, path: string, content: string): Promise<boolean> { const s = this.sessions.get(sessionId); if (!s) return false; const f = s.files.find(f => f.path === path); if (!f) return false; f.content = content; f.status = 'complete'; this.emit('fileGenerated', { sessionId, path }); return true; }
    complete(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'complete'; return true; }
    get(sessionId: string): ComposerSession | null { return this.sessions.get(sessionId) || null; }
    getAll(): ComposerSession[] { return Array.from(this.sessions.values()); }
}
export function getComposerEngine(): ComposerEngine { return ComposerEngine.getInstance(); }
