/**
 * Team Collaboration Service
 * 
 * Enables real-time team collaboration features:
 * - User presence & status
 * - Shared sessions
 * - Real-time sync
 * - Activity feed
 */

import { EventEmitter } from 'events';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    currentFile?: string;
    cursor?: { line: number; column: number };
    lastSeen: Date;
}

export interface SharedSession {
    id: string;
    name: string;
    host: TeamMember;
    participants: TeamMember[];
    files: string[];
    createdAt: Date;
    isLive: boolean;
}

export interface ActivityEvent {
    id: string;
    type: 'file_edit' | 'commit' | 'review' | 'comment' | 'join' | 'leave';
    userId: string;
    userName: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface CollaborationMessage {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
}

/**
 * CollaborationService - Team collaboration manager
 */
export class CollaborationService extends EventEmitter {
    private static instance: CollaborationService;
    private members: Map<string, TeamMember> = new Map();
    private sessions: Map<string, SharedSession> = new Map();
    private activities: ActivityEvent[] = [];
    private currentUser: TeamMember | null = null;
    private currentSessionId: string | null = null;
    private wsConnection: WebSocket | null = null;
    private maxActivities = 500;

    private constructor() {
        super();
        this.initializeFromStorage();
    }

    static getInstance(): CollaborationService {
        if (!CollaborationService.instance) {
            CollaborationService.instance = new CollaborationService();
        }
        return CollaborationService.instance;
    }

    /**
     * Initialize from local storage
     */
    private initializeFromStorage(): void {
        // Load cached user if exists
        const storedUser = typeof localStorage !== 'undefined'
            ? localStorage.getItem('collaboration_user')
            : null;
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
            } catch (e) {
                console.error('Failed to parse stored user');
            }
        }
    }

    /**
     * Set the current user
     */
    setCurrentUser(user: Omit<TeamMember, 'status' | 'lastSeen'>): void {
        this.currentUser = {
            ...user,
            status: 'online',
            lastSeen: new Date(),
        };
        this.members.set(user.id, this.currentUser);

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('collaboration_user', JSON.stringify(this.currentUser));
        }

        this.emit('user:updated', this.currentUser);
    }

    /**
     * Connect to collaboration server
     */
    async connect(serverUrl: string): Promise<boolean> {
        try {
            this.wsConnection = new WebSocket(serverUrl);

            this.wsConnection.onopen = () => {
                console.log('🔗 [Collaboration] Connected to server');
                this.emit('connection:open');

                // Send presence
                if (this.currentUser) {
                    this.sendPresence();
                }
            };

            this.wsConnection.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (e) {
                    console.error('Failed to parse collaboration message:', e);
                }
            };

            this.wsConnection.onclose = () => {
                console.log('🔗 [Collaboration] Disconnected from server');
                this.emit('connection:close');
            };

            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.emit('connection:error', error);
            };

            return true;
        } catch (error) {
            console.error('Failed to connect to collaboration server:', error);
            return false;
        }
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(message: any): void {
        switch (message.type) {
            case 'presence':
                this.handlePresenceUpdate(message.data);
                break;
            case 'session_update':
                this.handleSessionUpdate(message.data);
                break;
            case 'activity':
                this.handleActivityEvent(message.data);
                break;
            case 'cursor':
                this.handleCursorUpdate(message.data);
                break;
            case 'chat':
                this.emit('chat:message', message.data);
                break;
        }
    }

    /**
     * Handle presence update
     */
    private handlePresenceUpdate(data: any): void {
        const member: TeamMember = {
            ...data,
            lastSeen: new Date(data.lastSeen),
        };
        this.members.set(member.id, member);
        this.emit('presence:update', member);
    }

    /**
     * Handle session update
     */
    private handleSessionUpdate(data: any): void {
        const session: SharedSession = {
            ...data,
            createdAt: new Date(data.createdAt),
        };
        this.sessions.set(session.id, session);
        this.emit('session:update', session);
    }

    /**
     * Handle activity event
     */
    private handleActivityEvent(data: any): void {
        const activity: ActivityEvent = {
            ...data,
            timestamp: new Date(data.timestamp),
        };
        this.activities.unshift(activity);
        if (this.activities.length > this.maxActivities) {
            this.activities.pop();
        }
        this.emit('activity:event', activity);
    }

    /**
     * Handle cursor update
     */
    private handleCursorUpdate(data: any): void {
        const member = this.members.get(data.userId);
        if (member) {
            member.cursor = data.cursor;
            member.currentFile = data.file;
            this.emit('cursor:update', { userId: data.userId, cursor: data.cursor, file: data.file });
        }
    }

    /**
     * Send presence update
     */
    private sendPresence(): void {
        if (this.wsConnection && this.currentUser) {
            this.wsConnection.send(JSON.stringify({
                type: 'presence',
                data: this.currentUser,
            }));
        }
    }

    /**
     * Update user status
     */
    setStatus(status: TeamMember['status']): void {
        if (this.currentUser) {
            this.currentUser.status = status;
            this.currentUser.lastSeen = new Date();
            this.sendPresence();
            this.emit('user:updated', this.currentUser);
        }
    }

    /**
     * Create a shared session
     */
    createSession(name: string, files: string[] = []): SharedSession | null {
        if (!this.currentUser) return null;

        const session: SharedSession = {
            id: `session_${Date.now()}`,
            name,
            host: this.currentUser,
            participants: [this.currentUser],
            files,
            createdAt: new Date(),
            isLive: true,
        };

        this.sessions.set(session.id, session);
        this.currentSessionId = session.id;

        // Notify server
        if (this.wsConnection) {
            this.wsConnection.send(JSON.stringify({
                type: 'session_create',
                data: session,
            }));
        }

        this.emit('session:created', session);
        this.logActivity('join', `Created session: ${name}`);

        return session;
    }

    /**
     * Join a session
     */
    async joinSession(sessionId: string): Promise<boolean> {
        if (!this.currentUser) return false;

        const session = this.sessions.get(sessionId);
        if (!session) return false;

        session.participants.push(this.currentUser);
        this.currentSessionId = sessionId;

        // Notify server
        if (this.wsConnection) {
            this.wsConnection.send(JSON.stringify({
                type: 'session_join',
                data: { sessionId, user: this.currentUser },
            }));
        }

        this.emit('session:joined', session);
        this.logActivity('join', `Joined session: ${session.name}`);

        return true;
    }

    /**
     * Leave current session
     */
    leaveSession(): void {
        if (!this.currentSessionId || !this.currentUser) return;

        const session = this.sessions.get(this.currentSessionId);
        if (session) {
            session.participants = session.participants.filter(p => p.id !== this.currentUser!.id);

            // Notify server
            if (this.wsConnection) {
                this.wsConnection.send(JSON.stringify({
                    type: 'session_leave',
                    data: { sessionId: this.currentSessionId, userId: this.currentUser.id },
                }));
            }

            this.logActivity('leave', `Left session: ${session.name}`);
        }

        this.currentSessionId = null;
        this.emit('session:left');
    }

    /**
     * Update cursor position
     */
    updateCursor(file: string, line: number, column: number): void {
        if (!this.currentUser || !this.wsConnection) return;

        this.currentUser.currentFile = file;
        this.currentUser.cursor = { line, column };

        this.wsConnection.send(JSON.stringify({
            type: 'cursor',
            data: {
                userId: this.currentUser.id,
                file,
                cursor: { line, column },
            },
        }));
    }

    /**
     * Send chat message
     */
    sendMessage(content: string): void {
        if (!this.currentUser || !this.currentSessionId || !this.wsConnection) return;

        const message: CollaborationMessage = {
            id: `msg_${Date.now()}`,
            sessionId: this.currentSessionId,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            content,
            timestamp: new Date(),
        };

        this.wsConnection.send(JSON.stringify({
            type: 'chat',
            data: message,
        }));

        this.emit('chat:sent', message);
    }

    /**
     * Log an activity
     */
    private logActivity(type: ActivityEvent['type'], description: string, metadata?: Record<string, any>): void {
        if (!this.currentUser) return;

        const activity: ActivityEvent = {
            id: `activity_${Date.now()}`,
            type,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            description,
            timestamp: new Date(),
            metadata,
        };

        this.activities.unshift(activity);
        if (this.activities.length > this.maxActivities) {
            this.activities.pop();
        }

        // Broadcast to server
        if (this.wsConnection) {
            this.wsConnection.send(JSON.stringify({
                type: 'activity',
                data: activity,
            }));
        }

        this.emit('activity:event', activity);
    }

    /**
     * Log file edit
     */
    logFileEdit(file: string): void {
        this.logActivity('file_edit', `Edited ${file}`, { file });
    }

    /**
     * Log commit
     */
    logCommit(message: string, hash: string): void {
        this.logActivity('commit', message, { hash });
    }

    /**
     * Log code review
     */
    logReview(file: string, comments: number): void {
        this.logActivity('review', `Reviewed ${file} with ${comments} comments`, { file, comments });
    }

    /**
     * Get online members
     */
    getOnlineMembers(): TeamMember[] {
        return Array.from(this.members.values())
            .filter(m => m.status !== 'offline');
    }

    /**
     * Get all members
     */
    getAllMembers(): TeamMember[] {
        return Array.from(this.members.values());
    }

    /**
     * Get active sessions
     */
    getActiveSessions(): SharedSession[] {
        return Array.from(this.sessions.values())
            .filter(s => s.isLive);
    }

    /**
     * Get recent activities
     */
    getRecentActivities(limit: number = 50): ActivityEvent[] {
        return this.activities.slice(0, limit);
    }

    /**
     * Get current session
     */
    getCurrentSession(): SharedSession | null {
        return this.currentSessionId ? this.sessions.get(this.currentSessionId) || null : null;
    }

    /**
     * Disconnect
     */
    disconnect(): void {
        if (this.currentUser) {
            this.currentUser.status = 'offline';
            this.sendPresence();
        }

        if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
        }

        this.emit('connection:close');
    }
}

export default CollaborationService;
