/**
 * Collab Editor - Real-time collaboration
 */
import { EventEmitter } from 'events';

export interface Collaborator { id: string; name: string; email: string; avatar?: string; cursor: { x: number; y: number } | null; color: string; }
export interface CollabSession { id: string; canvasId: string; collaborators: Collaborator[]; owner: string; startedAt: number; }

export class CollabEditorEngine extends EventEmitter {
    private static instance: CollabEditorEngine;
    private sessions: Map<string, CollabSession> = new Map();
    private colors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    private constructor() { super(); }
    static getInstance(): CollabEditorEngine { if (!CollabEditorEngine.instance) CollabEditorEngine.instance = new CollabEditorEngine(); return CollabEditorEngine.instance; }

    startSession(canvasId: string, owner: Collaborator): CollabSession {
        owner.color = this.colors[0];
        const session: CollabSession = { id: `session_${Date.now()}`, canvasId, collaborators: [owner], owner: owner.id, startedAt: Date.now() };
        this.sessions.set(session.id, session); this.emit('started', session); return session;
    }

    join(sessionId: string, collaborator: Collaborator): boolean {
        const session = this.sessions.get(sessionId); if (!session) return false;
        collaborator.color = this.colors[session.collaborators.length % this.colors.length];
        session.collaborators.push(collaborator); this.emit('joined', { sessionId, collaborator }); return true;
    }

    leave(sessionId: string, collaboratorId: string): void { const session = this.sessions.get(sessionId); if (session) { session.collaborators = session.collaborators.filter(c => c.id !== collaboratorId); this.emit('left', { sessionId, collaboratorId }); } }
    updateCursor(sessionId: string, collaboratorId: string, x: number, y: number): void { const collab = this.sessions.get(sessionId)?.collaborators.find(c => c.id === collaboratorId); if (collab) { collab.cursor = { x, y }; this.emit('cursorMove', { sessionId, collaboratorId, x, y }); } }
    broadcast(sessionId: string, event: string, data: unknown): void { this.emit('broadcast', { sessionId, event, data }); }
    get(sessionId: string): CollabSession | null { return this.sessions.get(sessionId) || null; }
    endSession(sessionId: string): void { this.sessions.delete(sessionId); this.emit('ended', sessionId); }
}
export function getCollabEditorEngine(): CollabEditorEngine { return CollabEditorEngine.getInstance(); }
