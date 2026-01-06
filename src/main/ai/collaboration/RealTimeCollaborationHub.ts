/**
 * Real-Time Collaboration Hub
 * WebSocket-based real-time collaboration features
 * Grok Recommendation: Enhanced Real-Time Collaboration
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface CollaborationSession {
    id: string;
    name: string;
    hostId: string;
    participants: Participant[];
    document: CollaborativeDocument;
    chat: ChatMessage[];
    cursors: Map<string, CursorPosition>;
    status: 'active' | 'paused' | 'ended';
    createdAt: Date;
    settings: SessionSettings;
}

interface Participant {
    id: string;
    name: string;
    color: string;
    avatar?: string;
    role: 'host' | 'editor' | 'viewer';
    status: 'online' | 'away' | 'typing';
    joinedAt: Date;
    cursor?: CursorPosition;
}

interface CursorPosition {
    line: number;
    column: number;
    selection?: { startLine: number; startCol: number; endLine: number; endCol: number };
    timestamp: Date;
}

interface CollaborativeDocument {
    id: string;
    path: string;
    language: string;
    content: string;
    version: number;
    operations: Operation[];
    checkpoints: Checkpoint[];
}

interface Operation {
    id: string;
    type: 'insert' | 'delete' | 'replace';
    userId: string;
    position: { line: number; column: number };
    content?: string;
    length?: number;
    timestamp: Date;
}

interface Checkpoint {
    id: string;
    version: number;
    content: string;
    createdAt: Date;
    createdBy: string;
    description?: string;
}

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    content: string;
    type: 'text' | 'code' | 'system' | 'suggestion';
    timestamp: Date;
    reactions: { emoji: string; users: string[] }[];
}

interface SessionSettings {
    maxParticipants: number;
    allowAnonymous: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    requireApproval: boolean;
    allowChat: boolean;
    allowVoice: boolean;
    syntaxHighlighting: boolean;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];

export class RealTimeCollaborationHub extends EventEmitter {
    private static instance: RealTimeCollaborationHub;
    private sessions: Map<string, CollaborationSession> = new Map();
    private userSessions: Map<string, string> = new Map(); // userId -> sessionId

    private constructor() {
        super();
    }

    static getInstance(): RealTimeCollaborationHub {
        if (!RealTimeCollaborationHub.instance) {
            RealTimeCollaborationHub.instance = new RealTimeCollaborationHub();
        }
        return RealTimeCollaborationHub.instance;
    }

    createSession(config: {
        name: string;
        hostId: string;
        hostName: string;
        documentPath: string;
        content: string;
        language?: string;
        settings?: Partial<SessionSettings>;
    }): CollaborationSession {
        const session: CollaborationSession = {
            id: crypto.randomUUID(),
            name: config.name,
            hostId: config.hostId,
            participants: [{
                id: config.hostId,
                name: config.hostName,
                color: COLORS[0],
                role: 'host',
                status: 'online',
                joinedAt: new Date()
            }],
            document: {
                id: crypto.randomUUID(),
                path: config.documentPath,
                language: config.language || 'typescript',
                content: config.content,
                version: 1,
                operations: [],
                checkpoints: [{
                    id: crypto.randomUUID(),
                    version: 1,
                    content: config.content,
                    createdAt: new Date(),
                    createdBy: config.hostId,
                    description: 'Initial version'
                }]
            },
            chat: [],
            cursors: new Map(),
            status: 'active',
            createdAt: new Date(),
            settings: {
                maxParticipants: 10,
                allowAnonymous: false,
                autoSave: true,
                autoSaveInterval: 30000,
                requireApproval: false,
                allowChat: true,
                allowVoice: false,
                syntaxHighlighting: true,
                ...config.settings
            }
        };

        this.sessions.set(session.id, session);
        this.userSessions.set(config.hostId, session.id);
        this.emit('sessionCreated', session);
        return session;
    }

    joinSession(sessionId: string, userId: string, userName: string, asViewer = false): { success: boolean; session?: CollaborationSession; error?: string } {
        const session = this.sessions.get(sessionId);
        if (!session) return { success: false, error: 'Session not found' };
        if (session.status !== 'active') return { success: false, error: 'Session is not active' };
        if (session.participants.length >= session.settings.maxParticipants) {
            return { success: false, error: 'Session is full' };
        }

        const colorIndex = session.participants.length % COLORS.length;
        const participant: Participant = {
            id: userId,
            name: userName,
            color: COLORS[colorIndex],
            role: asViewer ? 'viewer' : 'editor',
            status: 'online',
            joinedAt: new Date()
        };

        session.participants.push(participant);
        this.userSessions.set(userId, sessionId);

        // Send system message
        this.sendChat(sessionId, 'system', 'System', `${userName} joined the session`, 'system');

        this.emit('participantJoined', { session, participant });
        return { success: true, session };
    }

    leaveSession(sessionId: string, userId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const index = session.participants.findIndex(p => p.id === userId);
        if (index === -1) return false;

        const participant = session.participants[index];
        session.participants.splice(index, 1);
        session.cursors.delete(userId);
        this.userSessions.delete(userId);

        this.sendChat(sessionId, 'system', 'System', `${participant.name} left the session`, 'system');

        // If host leaves, assign new host or end session
        if (userId === session.hostId && session.participants.length > 0) {
            session.hostId = session.participants[0].id;
            session.participants[0].role = 'host';
            this.sendChat(sessionId, 'system', 'System', `${session.participants[0].name} is now the host`, 'system');
        } else if (session.participants.length === 0) {
            this.endSession(sessionId);
        }

        this.emit('participantLeft', { session, participant });
        return true;
    }

    applyOperation(sessionId: string, userId: string, operation: Omit<Operation, 'id' | 'timestamp'>): { success: boolean; version: number } {
        const session = this.sessions.get(sessionId);
        if (!session) return { success: false, version: 0 };

        const participant = session.participants.find(p => p.id === userId);
        if (!participant || participant.role === 'viewer') {
            return { success: false, version: session.document.version };
        }

        const fullOperation: Operation = {
            id: crypto.randomUUID(),
            ...operation,
            timestamp: new Date()
        };

        session.document.operations.push(fullOperation);
        session.document.version++;

        // Apply operation to content
        this.applyToContent(session.document, fullOperation);

        this.emit('operationApplied', { session, operation: fullOperation });
        return { success: true, version: session.document.version };
    }

    private applyToContent(doc: CollaborativeDocument, op: Operation): void {
        const lines = doc.content.split('\n');

        switch (op.type) {
            case 'insert':
                if (op.content) {
                    const line = lines[op.position.line] || '';
                    lines[op.position.line] = line.slice(0, op.position.column) + op.content + line.slice(op.position.column);
                }
                break;
            case 'delete':
                if (op.length) {
                    const line = lines[op.position.line] || '';
                    lines[op.position.line] = line.slice(0, op.position.column) + line.slice(op.position.column + op.length);
                }
                break;
            case 'replace':
                if (op.content && op.length) {
                    const line = lines[op.position.line] || '';
                    lines[op.position.line] = line.slice(0, op.position.column) + op.content + line.slice(op.position.column + op.length);
                }
                break;
        }

        doc.content = lines.join('\n');
    }

    updateCursor(sessionId: string, userId: string, cursor: CursorPosition): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const participant = session.participants.find(p => p.id === userId);
        if (participant) {
            participant.cursor = cursor;
            session.cursors.set(userId, cursor);
            this.emit('cursorUpdated', { sessionId, userId, cursor });
        }
    }

    sendChat(sessionId: string, userId: string, userName: string, content: string, type: ChatMessage['type'] = 'text'): ChatMessage | null {
        const session = this.sessions.get(sessionId);
        if (!session || !session.settings.allowChat) return null;

        const message: ChatMessage = {
            id: crypto.randomUUID(),
            userId,
            userName,
            content,
            type,
            timestamp: new Date(),
            reactions: []
        };

        session.chat.push(message);
        this.emit('chatMessage', { sessionId, message });
        return message;
    }

    addReaction(sessionId: string, messageId: string, userId: string, emoji: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const message = session.chat.find(m => m.id === messageId);
        if (!message) return false;

        let reaction = message.reactions.find(r => r.emoji === emoji);
        if (!reaction) {
            reaction = { emoji, users: [] };
            message.reactions.push(reaction);
        }

        if (!reaction.users.includes(userId)) {
            reaction.users.push(userId);
        }

        this.emit('reactionAdded', { sessionId, messageId, emoji, userId });
        return true;
    }

    createCheckpoint(sessionId: string, userId: string, description?: string): Checkpoint | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const checkpoint: Checkpoint = {
            id: crypto.randomUUID(),
            version: session.document.version,
            content: session.document.content,
            createdAt: new Date(),
            createdBy: userId,
            description
        };

        session.document.checkpoints.push(checkpoint);
        this.emit('checkpointCreated', { sessionId, checkpoint });
        return checkpoint;
    }

    restoreCheckpoint(sessionId: string, checkpointId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const checkpoint = session.document.checkpoints.find(c => c.id === checkpointId);
        if (!checkpoint) return false;

        session.document.content = checkpoint.content;
        session.document.version++;
        session.document.operations.push({
            id: crypto.randomUUID(),
            type: 'replace',
            userId: 'system',
            position: { line: 0, column: 0 },
            content: checkpoint.content,
            timestamp: new Date()
        });

        this.emit('checkpointRestored', { sessionId, checkpoint });
        return true;
    }

    setParticipantStatus(sessionId: string, userId: string, status: Participant['status']): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        const participant = session.participants.find(p => p.id === userId);
        if (!participant) return false;

        participant.status = status;
        this.emit('statusChanged', { sessionId, userId, status });
        return true;
    }

    changeRole(sessionId: string, hostId: string, targetUserId: string, role: Participant['role']): boolean {
        const session = this.sessions.get(sessionId);
        if (!session || session.hostId !== hostId) return false;

        const participant = session.participants.find(p => p.id === targetUserId);
        if (!participant || role === 'host') return false;

        participant.role = role;
        this.emit('roleChanged', { sessionId, userId: targetUserId, role });
        return true;
    }

    endSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.status = 'ended';

        for (const participant of session.participants) {
            this.userSessions.delete(participant.id);
        }

        this.emit('sessionEnded', session);
        return true;
    }

    getSession(id: string): CollaborationSession | undefined {
        return this.sessions.get(id);
    }

    getActiveSessions(): CollaborationSession[] {
        return Array.from(this.sessions.values()).filter(s => s.status === 'active');
    }

    getUserSession(userId: string): CollaborationSession | undefined {
        const sessionId = this.userSessions.get(userId);
        return sessionId ? this.sessions.get(sessionId) : undefined;
    }

    getDocumentContent(sessionId: string): string | undefined {
        return this.sessions.get(sessionId)?.document.content;
    }

    getChatHistory(sessionId: string, limit = 50): ChatMessage[] {
        const session = this.sessions.get(sessionId);
        return session ? session.chat.slice(-limit) : [];
    }
}

export const realTimeCollaborationHub = RealTimeCollaborationHub.getInstance();
