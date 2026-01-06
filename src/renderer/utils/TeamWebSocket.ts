/**
 * WebSocket Team Connection
 * 
 * Connect TeamPanel to CollaborationServer via WebSocket
 */

import { EventEmitter } from 'events';

interface TeamMember {
    id: string;
    name: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    currentFile?: string;
}

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
}

interface Activity {
    id: string;
    type: string;
    userName: string;
    description: string;
    timestamp: Date;
}

/**
 * TeamWebSocket - Client-side WebSocket for team collaboration
 */
export class TeamWebSocket extends EventEmitter {
    private ws: WebSocket | null = null;
    private url: string = '';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private userId: string = '';
    private userName: string = '';

    /**
     * Connect to collaboration server
     */
    connect(url: string, userId: string, userName: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.url = url;
            this.userId = userId;
            this.userName = userName;

            try {
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    this.reconnectAttempts = 0;
                    this.sendMessage('join', { userId, userName });
                    this.emit('connected');
                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                    } catch (e) {
                        console.error('Failed to parse message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.emit('error', error);
                };

                this.ws.onclose = () => {
                    this.emit('disconnected');
                    this.attemptReconnect();
                };
            } catch (error) {
                console.error('Failed to connect:', error);
                resolve(false);
            }
        });
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(data: { type: string; payload: any }): void {
        switch (data.type) {
            case 'members':
                this.emit('members', data.payload as TeamMember[]);
                break;
            case 'member_joined':
                this.emit('memberJoined', data.payload as TeamMember);
                break;
            case 'member_left':
                this.emit('memberLeft', data.payload as string);
                break;
            case 'chat':
                this.emit('chat', data.payload as ChatMessage);
                break;
            case 'activity':
                this.emit('activity', data.payload as Activity);
                break;
            case 'cursor':
                this.emit('cursor', data.payload);
                break;
            case 'file_changed':
                this.emit('fileChanged', data.payload);
                break;
            default:
                this.emit('message', data);
        }
    }

    /**
     * Send a message to the server
     */
    private sendMessage(type: string, payload: any): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    /**
     * Send a chat message
     */
    sendChatMessage(content: string): void {
        this.sendMessage('chat', {
            userId: this.userId,
            userName: this.userName,
            content,
            timestamp: new Date(),
        });
    }

    /**
     * Update cursor position
     */
    updateCursor(file: string, line: number, column: number): void {
        this.sendMessage('cursor', {
            userId: this.userId,
            file,
            line,
            column,
        });
    }

    /**
     * Update current file
     */
    updateCurrentFile(file: string): void {
        this.sendMessage('file_changed', {
            userId: this.userId,
            file,
        });
    }

    /**
     * Update status
     */
    updateStatus(status: 'online' | 'away' | 'busy'): void {
        this.sendMessage('status', {
            userId: this.userId,
            status,
        });
    }

    /**
     * Attempt to reconnect
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('reconnectFailed');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        this.reconnectTimeout = setTimeout(() => {
            this.connect(this.url, this.userId, this.userName);
        }, delay);
    }

    /**
     * Disconnect from server
     */
    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

// Singleton instance for the renderer
let instance: TeamWebSocket | null = null;

export function getTeamWebSocket(): TeamWebSocket {
    if (!instance) {
        instance = new TeamWebSocket();
    }
    return instance;
}

export default TeamWebSocket;
