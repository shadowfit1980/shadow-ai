/**
 * Multi-File Editor - Cross-file editing
 */
import { EventEmitter } from 'events';

export interface FileEdit { file: string; changes: { line: number; original: string; modified: string }[]; }
export interface MultiFileEditSession { id: string; files: FileEdit[]; description: string; status: 'pending' | 'applied' | 'reverted'; }

export class MultiFileEditor extends EventEmitter {
    private static instance: MultiFileEditor;
    private sessions: Map<string, MultiFileEditSession> = new Map();
    private constructor() { super(); }
    static getInstance(): MultiFileEditor { if (!MultiFileEditor.instance) MultiFileEditor.instance = new MultiFileEditor(); return MultiFileEditor.instance; }

    createSession(description: string): MultiFileEditSession {
        const session: MultiFileEditSession = { id: `mfe_${Date.now()}`, files: [], description, status: 'pending' };
        this.sessions.set(session.id, session);
        return session;
    }

    addFileEdit(sessionId: string, file: string, changes: FileEdit['changes']): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        session.files.push({ file, changes });
        return true;
    }

    async apply(sessionId: string): Promise<boolean> { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'applied'; this.emit('applied', s); return true; }
    async revert(sessionId: string): Promise<boolean> { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'reverted'; this.emit('reverted', s); return true; }
    getAll(): MultiFileEditSession[] { return Array.from(this.sessions.values()); }
}
export function getMultiFileEditor(): MultiFileEditor { return MultiFileEditor.getInstance(); }
