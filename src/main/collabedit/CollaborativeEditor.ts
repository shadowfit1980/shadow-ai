/**
 * Collaborative Editor - Real-time multi-user editing
 */
import { EventEmitter } from 'events';

export interface Collaborator { id: string; name: string; color: string; cursor: { line: number; col: number }; selection?: { start: number; end: number }; }
export interface CollabSession { id: string; file: string; collaborators: Collaborator[]; createdAt: number; }

export class CollaborativeEditor extends EventEmitter {
    private static instance: CollaborativeEditor;
    private sessions: Map<string, CollabSession> = new Map();
    private constructor() { super(); }
    static getInstance(): CollaborativeEditor { if (!CollaborativeEditor.instance) CollaborativeEditor.instance = new CollaborativeEditor(); return CollaborativeEditor.instance; }

    startSession(file: string): CollabSession {
        const session: CollabSession = { id: `collab_${Date.now()}`, file, collaborators: [], createdAt: Date.now() };
        this.sessions.set(session.id, session);
        this.emit('sessionStarted', session);
        return session;
    }

    join(sessionId: string, name: string): Collaborator | null {
        const session = this.sessions.get(sessionId); if (!session) return null;
        const collab: Collaborator = { id: `user_${Date.now()}`, name, color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, cursor: { line: 0, col: 0 } };
        session.collaborators.push(collab);
        this.emit('userJoined', { session, collaborator: collab });
        return collab;
    }

    updateCursor(sessionId: string, collabId: string, line: number, col: number): void { const s = this.sessions.get(sessionId); const c = s?.collaborators.find(x => x.id === collabId); if (c) { c.cursor = { line, col }; this.emit('cursorMoved', { sessionId, collabId, line, col }); } }
    leave(sessionId: string, collabId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.collaborators = s.collaborators.filter(c => c.id !== collabId); return true; }
    getAll(): CollabSession[] { return Array.from(this.sessions.values()); }
}
export function getCollaborativeEditor(): CollaborativeEditor { return CollaborativeEditor.getInstance(); }
