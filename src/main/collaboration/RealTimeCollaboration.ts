/**
 * Real-Time Collaboration Engine
 * Enable multiple users to edit simultaneously
 */

import { EventEmitter } from 'events';

export interface CollaboratorInfo {
    id: string;
    name: string;
    color: string;
    cursor?: CursorPosition;
    selection?: SelectionRange;
    connected: boolean;
    lastSeen: number;
}

export interface CursorPosition {
    file: string;
    line: number;
    column: number;
}

export interface SelectionRange {
    file: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export interface CollaborationSession {
    id: string;
    projectPath: string;
    host: CollaboratorInfo;
    collaborators: CollaboratorInfo[];
    createdAt: number;
    active: boolean;
}

export interface EditOperation {
    id: string;
    userId: string;
    file: string;
    type: 'insert' | 'delete' | 'replace';
    position: { line: number; column: number };
    text?: string;
    length?: number;
    timestamp: number;
}

/**
 * RealTimeCollaboration
 * Enables live editing with multiple users
 */
export class RealTimeCollaboration extends EventEmitter {
    private static instance: RealTimeCollaboration;
    private sessions: Map<string, CollaborationSession> = new Map();
    private currentSession: string | null = null;
    private localUser: CollaboratorInfo | null = null;
    private operationBuffer: EditOperation[] = [];
    private colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

    private constructor() {
        super();
    }

    static getInstance(): RealTimeCollaboration {
        if (!RealTimeCollaboration.instance) {
            RealTimeCollaboration.instance = new RealTimeCollaboration();
        }
        return RealTimeCollaboration.instance;
    }

    /**
     * Set local user info
     */
    setLocalUser(name: string): void {
        this.localUser = {
            id: `user_${Date.now()}`,
            name,
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            connected: true,
            lastSeen: Date.now(),
        };
    }

    /**
     * Create a new collaboration session
     */
    createSession(projectPath: string): CollaborationSession {
        if (!this.localUser) {
            throw new Error('Local user not set');
        }

        const session: CollaborationSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            projectPath,
            host: this.localUser,
            collaborators: [],
            createdAt: Date.now(),
            active: true,
        };

        this.sessions.set(session.id, session);
        this.currentSession = session.id;

        this.emit('sessionCreated', session);
        return session;
    }

    /**
     * Join an existing session
     */
    joinSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session || !session.active || !this.localUser) {
            return false;
        }

        session.collaborators.push(this.localUser);
        this.currentSession = sessionId;

        this.emit('sessionJoined', { session, user: this.localUser });
        return true;
    }

    /**
     * Leave current session
     */
    leaveSession(): void {
        if (!this.currentSession || !this.localUser) return;

        const session = this.sessions.get(this.currentSession);
        if (session) {
            session.collaborators = session.collaborators.filter(c => c.id !== this.localUser!.id);
            this.emit('userLeft', { sessionId: this.currentSession, userId: this.localUser.id });
        }

        this.currentSession = null;
    }

    /**
     * Update cursor position
     */
    updateCursor(cursor: CursorPosition): void {
        if (!this.localUser) return;

        this.localUser.cursor = cursor;
        this.localUser.lastSeen = Date.now();

        this.emit('cursorMoved', {
            userId: this.localUser.id,
            cursor,
        });
    }

    /**
     * Update selection
     */
    updateSelection(selection: SelectionRange | undefined): void {
        if (!this.localUser) return;

        this.localUser.selection = selection;
        this.emit('selectionChanged', {
            userId: this.localUser.id,
            selection,
        });
    }

    /**
     * Broadcast an edit operation
     */
    broadcastEdit(operation: Omit<EditOperation, 'id' | 'userId' | 'timestamp'>): void {
        if (!this.localUser) return;

        const fullOperation: EditOperation = {
            ...operation,
            id: `op_${Date.now()}`,
            userId: this.localUser.id,
            timestamp: Date.now(),
        };

        this.operationBuffer.push(fullOperation);
        this.emit('editBroadcast', fullOperation);
    }

    /**
     * Apply remote edit
     */
    applyRemoteEdit(operation: EditOperation): void {
        this.emit('remoteEdit', operation);
    }

    /**
     * Get current session
     */
    getCurrentSession(): CollaborationSession | null {
        if (!this.currentSession) return null;
        return this.sessions.get(this.currentSession) || null;
    }

    /**
     * Get collaborators in current session
     */
    getCollaborators(): CollaboratorInfo[] {
        const session = this.getCurrentSession();
        if (!session) return [];

        const all = [session.host, ...session.collaborators];
        return all.filter(c => c.id !== this.localUser?.id);
    }

    /**
     * Get collaborator by ID
     */
    getCollaborator(id: string): CollaboratorInfo | null {
        const session = this.getCurrentSession();
        if (!session) return null;

        if (session.host.id === id) return session.host;
        return session.collaborators.find(c => c.id === id) || null;
    }

    /**
     * Send chat message
     */
    sendMessage(message: string): void {
        if (!this.localUser || !this.currentSession) return;

        this.emit('chatMessage', {
            userId: this.localUser.id,
            userName: this.localUser.name,
            message,
            timestamp: Date.now(),
        });
    }

    /**
     * End session (host only)
     */
    endSession(): void {
        if (!this.currentSession) return;

        const session = this.sessions.get(this.currentSession);
        if (session && session.host.id === this.localUser?.id) {
            session.active = false;
            this.emit('sessionEnded', this.currentSession);
        }

        this.currentSession = null;
    }

    /**
     * Get session share link
     */
    getShareLink(): string {
        if (!this.currentSession) return '';
        return `shadow-ai://collab/${this.currentSession}`;
    }

    /**
     * Check if user is host
     */
    isHost(): boolean {
        const session = this.getCurrentSession();
        return session?.host.id === this.localUser?.id;
    }
}

// Singleton getter
export function getRealTimeCollaboration(): RealTimeCollaboration {
    return RealTimeCollaboration.getInstance();
}
