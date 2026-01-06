/**
 * Real-time Collaboration Service
 * Enables multi-user editing and presence awareness
 */

import { EventEmitter } from 'events';

export interface User {
    id: string;
    name: string;
    color: string;
    cursor?: { line: number; column: number };
    selection?: { start: any; end: any };
}

export interface Message {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: number;
}

export interface CollaborationEvent {
    type: 'join' | 'leave' | 'cursor' | 'edit' | 'chat';
    userId: string;
    data: any;
}

export class CollaborationService extends EventEmitter {
    private static instance: CollaborationService;
    private users: Map<string, User> = new Map();
    private messages: Message[] = [];
    private currentUser: User | null = null;
    private ws: WebSocket | null = null;
    private roomId: string | null = null;

    static getInstance(): CollaborationService {
        if (!CollaborationService.instance) {
            CollaborationService.instance = new CollaborationService();
        }
        return CollaborationService.instance;
    }

    /**
     * Join a collaboration room
     */
    async joinRoom(roomId: string, user: User): Promise<void> {
        this.roomId = roomId;
        this.currentUser = user;

        // In a real implementation, connect to WebSocket server
        // For now, simulate local collaboration
        this.users.set(user.id, user);
        this.emit('user-joined', user);

        console.log(`✅ Joined collaboration room: ${roomId}`);
    }

    /**
     * Leave the current room
     */
    async leaveRoom(): Promise<void> {
        if (this.currentUser) {
            this.users.delete(this.currentUser.id);
            this.emit('user-left', this.currentUser);
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.roomId = null;
        this.currentUser = null;

        console.log('👋 Left collaboration room');
    }

    /**
     * Start a new collaboration session
     */
    async startSession(sessionId: string): Promise<{ sessionId: string; url: string }> {
        this.roomId = sessionId;
        console.log(`🚀 Started collaboration session: ${sessionId}`);

        return {
            sessionId,
            url: `shadow-ai://collaborate/${sessionId}`,
        };
    }

    /**
     * Join an existing collaboration session
     */
    async joinSession(sessionId: string, userId: string): Promise<{ success: boolean; users: User[] }> {
        const user: User = {
            id: userId,
            name: `User ${userId.slice(0, 6)}`,
            color: CollaborationService.generateUserColor(),
        };

        await this.joinRoom(sessionId, user);

        return {
            success: true,
            users: this.getUsers(),
        };
    }

    /**
     * Update cursor position
     */
    updateCursor(line: number, column: number): void {
        if (!this.currentUser) return;

        this.currentUser.cursor = { line, column };
        this.broadcastEvent({
            type: 'cursor',
            userId: this.currentUser.id,
            data: { line, column },
        });
    }

    /**
     * Broadcast code edit
     */
    broadcastEdit(edit: any): void {
        if (!this.currentUser) return;

        this.broadcastEvent({
            type: 'edit',
            userId: this.currentUser.id,
            data: edit,
        });
    }

    /**
     * Send chat message
     */
    sendMessage(content: string): void {
        if (!this.currentUser) return;

        const message: Message = {
            id: Date.now().toString(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            content,
            timestamp: Date.now(),
        };

        this.messages.push(message);
        this.emit('message', message);

        this.broadcastEvent({
            type: 'chat',
            userId: this.currentUser.id,
            data: message,
        });
    }

    /**
     * Get all users in the room
     */
    getUsers(): User[] {
        return Array.from(this.users.values());
    }

    /**
     * Get chat messages
     */
    getMessages(): Message[] {
        return this.messages;
    }

    /**
     * Broadcast event to all users
     */
    private broadcastEvent(event: CollaborationEvent): void {
        // In a real implementation, send via WebSocket
        // For now, just emit locally
        this.emit('event', event);
    }

    /**
     * Generate a random user color
     */
    static generateUserColor(): string {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
