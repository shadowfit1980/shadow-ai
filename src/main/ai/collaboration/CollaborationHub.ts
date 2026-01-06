/**
 * Real-time Collaboration Hub
 * 
 * Enables real-time collaboration between developers with
 * presence tracking, cursor sharing, and synchronized editing.
 */

import { EventEmitter } from 'events';

export interface Collaborator {
    id: string;
    name: string;
    avatar?: string;
    color: string;
    status: CollaboratorStatus;
    cursor?: CursorPosition;
    selection?: SelectionRange;
    lastActive: Date;
}

export type CollaboratorStatus = 'active' | 'idle' | 'away' | 'offline';

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
    name: string;
    projectPath: string;
    host: string;
    collaborators: Map<string, Collaborator>;
    sharedFiles: string[];
    chat: ChatMessage[];
    createdAt: Date;
    isActive: boolean;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'code' | 'system';
    codeBlock?: {
        language: string;
        code: string;
    };
}

export interface FileChange {
    file: string;
    type: 'insert' | 'delete' | 'replace';
    range: { start: number; end: number };
    content?: string;
    author: string;
    timestamp: Date;
}

// Collaboration colors for participants
const COLLABORATOR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
];

export class CollaborationHub extends EventEmitter {
    private static instance: CollaborationHub;
    private sessions: Map<string, CollaborationSession> = new Map();
    private currentSession: string | null = null;
    private localUser: Collaborator | null = null;
    private changeBuffer: FileChange[] = [];
    private colorIndex = 0;

    private constructor() {
        super();
    }

    static getInstance(): CollaborationHub {
        if (!CollaborationHub.instance) {
            CollaborationHub.instance = new CollaborationHub();
        }
        return CollaborationHub.instance;
    }

    // ========================================================================
    // USER SETUP
    // ========================================================================

    setLocalUser(id: string, name: string, avatar?: string): Collaborator {
        this.localUser = {
            id,
            name,
            avatar,
            color: this.getNextColor(),
            status: 'active',
            lastActive: new Date(),
        };
        this.emit('user:set', this.localUser);
        return this.localUser;
    }

    getLocalUser(): Collaborator | null {
        return this.localUser;
    }

    private getNextColor(): string {
        const color = COLLABORATOR_COLORS[this.colorIndex % COLLABORATOR_COLORS.length];
        this.colorIndex++;
        return color;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    createSession(name: string, projectPath: string): CollaborationSession {
        if (!this.localUser) throw new Error('Local user not set');

        const session: CollaborationSession = {
            id: `collab_${Date.now()}`,
            name,
            projectPath,
            host: this.localUser.id,
            collaborators: new Map([[this.localUser.id, this.localUser]]),
            sharedFiles: [],
            chat: [],
            createdAt: new Date(),
            isActive: true,
        };

        this.sessions.set(session.id, session);
        this.currentSession = session.id;

        this.emit('session:created', session);
        return session;
    }

    joinSession(sessionId: string): CollaborationSession | undefined {
        if (!this.localUser) throw new Error('Local user not set');

        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        session.collaborators.set(this.localUser.id, this.localUser);
        this.currentSession = sessionId;

        // Broadcast join
        this.broadcastMessage(sessionId, {
            id: `chat_${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            content: `${this.localUser.name} joined the session`,
            timestamp: new Date(),
            type: 'system',
        });

        this.emit('session:joined', { session, user: this.localUser });
        return session;
    }

    leaveSession(sessionId: string): boolean {
        if (!this.localUser) return false;

        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.collaborators.delete(this.localUser.id);

        if (this.currentSession === sessionId) {
            this.currentSession = null;
        }

        // Broadcast leave
        this.broadcastMessage(sessionId, {
            id: `chat_${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            content: `${this.localUser.name} left the session`,
            timestamp: new Date(),
            type: 'system',
        });

        // End session if host leaves
        if (session.host === this.localUser.id) {
            session.isActive = false;
            this.emit('session:ended', session);
        }

        this.emit('session:left', { sessionId, userId: this.localUser.id });
        return true;
    }

    getSession(id: string): CollaborationSession | undefined {
        return this.sessions.get(id);
    }

    getCurrentSession(): CollaborationSession | undefined {
        return this.currentSession ? this.sessions.get(this.currentSession) : undefined;
    }

    getAllSessions(): CollaborationSession[] {
        return Array.from(this.sessions.values());
    }

    // ========================================================================
    // PRESENCE & CURSORS
    // ========================================================================

    updateCursor(position: CursorPosition): void {
        if (!this.localUser || !this.currentSession) return;

        const session = this.sessions.get(this.currentSession);
        if (!session) return;

        this.localUser.cursor = position;
        this.localUser.lastActive = new Date();
        this.localUser.status = 'active';

        this.emit('cursor:updated', {
            sessionId: this.currentSession,
            userId: this.localUser.id,
            cursor: position,
        });
    }

    updateSelection(selection: SelectionRange | undefined): void {
        if (!this.localUser || !this.currentSession) return;

        this.localUser.selection = selection;
        this.localUser.lastActive = new Date();

        this.emit('selection:updated', {
            sessionId: this.currentSession,
            userId: this.localUser.id,
            selection,
        });
    }

    updateStatus(status: CollaboratorStatus): void {
        if (!this.localUser) return;

        this.localUser.status = status;
        this.localUser.lastActive = new Date();

        if (this.currentSession) {
            this.emit('status:updated', {
                sessionId: this.currentSession,
                userId: this.localUser.id,
                status,
            });
        }
    }

    getCollaborators(): Collaborator[] {
        const session = this.getCurrentSession();
        if (!session) return [];
        return Array.from(session.collaborators.values());
    }

    // ========================================================================
    // FILE SHARING
    // ========================================================================

    shareFile(filePath: string): boolean {
        const session = this.getCurrentSession();
        if (!session) return false;

        if (!session.sharedFiles.includes(filePath)) {
            session.sharedFiles.push(filePath);
            this.emit('file:shared', { sessionId: session.id, file: filePath });
        }

        return true;
    }

    unshareFile(filePath: string): boolean {
        const session = this.getCurrentSession();
        if (!session) return false;

        const index = session.sharedFiles.indexOf(filePath);
        if (index > -1) {
            session.sharedFiles.splice(index, 1);
            this.emit('file:unshared', { sessionId: session.id, file: filePath });
        }

        return true;
    }

    getSharedFiles(): string[] {
        const session = this.getCurrentSession();
        return session ? [...session.sharedFiles] : [];
    }

    // ========================================================================
    // SYNCHRONIZED EDITING
    // ========================================================================

    broadcastChange(change: Omit<FileChange, 'author' | 'timestamp'>): void {
        if (!this.localUser || !this.currentSession) return;

        const fullChange: FileChange = {
            ...change,
            author: this.localUser.id,
            timestamp: new Date(),
        };

        this.changeBuffer.push(fullChange);
        this.emit('change:broadcast', {
            sessionId: this.currentSession,
            change: fullChange,
        });
    }

    getRecentChanges(limit = 50): FileChange[] {
        return this.changeBuffer.slice(-limit);
    }

    // ========================================================================
    // CHAT
    // ========================================================================

    sendMessage(content: string, codeBlock?: { language: string; code: string }): ChatMessage | undefined {
        if (!this.localUser || !this.currentSession) return undefined;

        const session = this.sessions.get(this.currentSession);
        if (!session) return undefined;

        const message: ChatMessage = {
            id: `chat_${Date.now()}`,
            senderId: this.localUser.id,
            senderName: this.localUser.name,
            content,
            timestamp: new Date(),
            type: codeBlock ? 'code' : 'text',
            codeBlock,
        };

        session.chat.push(message);
        this.emit('chat:message', { sessionId: this.currentSession, message });
        return message;
    }

    private broadcastMessage(sessionId: string, message: ChatMessage): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.chat.push(message);
        this.emit('chat:message', { sessionId, message });
    }

    getChatHistory(limit = 100): ChatMessage[] {
        const session = this.getCurrentSession();
        return session ? session.chat.slice(-limit) : [];
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    generateInviteLink(sessionId: string): string {
        // In real implementation, would generate a shareable link
        return `shadow://collab/${sessionId}`;
    }

    getSessionStats(): {
        activeSessions: number;
        totalCollaborators: number;
        totalMessages: number;
    } {
        const sessions = Array.from(this.sessions.values()).filter(s => s.isActive);

        return {
            activeSessions: sessions.length,
            totalCollaborators: sessions.reduce((sum, s) => sum + s.collaborators.size, 0),
            totalMessages: sessions.reduce((sum, s) => sum + s.chat.length, 0),
        };
    }
}

export const collaborationHub = CollaborationHub.getInstance();
