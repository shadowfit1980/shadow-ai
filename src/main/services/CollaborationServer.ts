/**
 * Collaboration WebSocket Server
 * 
 * Real-time collaboration server for team features
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import * as http from 'http';

interface ConnectedClient {
    id: string;
    socket: WebSocket;
    userId: string;
    userName: string;
    sessionId?: string;
    lastActivity: Date;
}

interface Message {
    type: string;
    data: any;
    senderId?: string;
}

/**
 * CollaborationServer - WebSocket server for real-time collaboration
 */
export class CollaborationServer extends EventEmitter {
    private static instance: CollaborationServer;
    private wss: WebSocketServer | null = null;
    private clients: Map<string, ConnectedClient> = new Map();
    private sessions: Map<string, Set<string>> = new Map(); // sessionId -> clientIds
    private httpServer: http.Server | null = null;

    private constructor() {
        super();
    }

    static getInstance(): CollaborationServer {
        if (!CollaborationServer.instance) {
            CollaborationServer.instance = new CollaborationServer();
        }
        return CollaborationServer.instance;
    }

    /**
     * Start the WebSocket server
     */
    start(port: number = 8081): void {
        if (this.wss) {
            console.log('WebSocket server already running');
            return;
        }

        this.httpServer = http.createServer();
        this.wss = new WebSocketServer({ server: this.httpServer });

        this.wss.on('connection', (socket, req) => {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            console.log(`🔌 [CollabServer] Client connected: ${clientId}`);

            const client: ConnectedClient = {
                id: clientId,
                socket,
                userId: '',
                userName: 'Anonymous',
                lastActivity: new Date(),
            };

            this.clients.set(clientId, client);

            socket.on('message', (data) => {
                try {
                    const message: Message = JSON.parse(data.toString());
                    this.handleMessage(clientId, message);
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            });

            socket.on('close', () => {
                this.handleDisconnect(clientId);
            });

            socket.on('error', (error) => {
                console.error(`WebSocket error for ${clientId}:`, error);
            });

            // Send welcome message
            this.send(clientId, {
                type: 'welcome',
                data: { clientId },
            });
        });

        this.httpServer.listen(port, () => {
            console.log(`🔌 [CollabServer] WebSocket server started on port ${port}`);
            this.emit('server:started', port);
        });
    }

    /**
     * Stop the server
     */
    stop(): void {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
        }
        this.clients.clear();
        this.sessions.clear();
        console.log('🔌 [CollabServer] Server stopped');
        this.emit('server:stopped');
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(clientId: string, message: Message): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        client.lastActivity = new Date();

        switch (message.type) {
            case 'presence':
                this.handlePresence(clientId, message.data);
                break;

            case 'session_create':
                this.handleSessionCreate(clientId, message.data);
                break;

            case 'session_join':
                this.handleSessionJoin(clientId, message.data);
                break;

            case 'session_leave':
                this.handleSessionLeave(clientId);
                break;

            case 'cursor':
                this.handleCursor(clientId, message.data);
                break;

            case 'chat':
                this.handleChat(clientId, message.data);
                break;

            case 'activity':
                this.handleActivity(clientId, message.data);
                break;

            case 'file_edit':
                this.handleFileEdit(clientId, message.data);
                break;

            default:
                console.log(`Unknown message type: ${message.type}`);
        }

        this.emit('message', { clientId, message });
    }

    /**
     * Handle presence update
     */
    private handlePresence(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        client.userId = data.id;
        client.userName = data.name;

        // Broadcast to all clients
        this.broadcast({
            type: 'presence',
            data: {
                ...data,
                clientId,
                lastSeen: new Date().toISOString(),
            },
        });
    }

    /**
     * Handle session creation
     */
    private handleSessionCreate(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        const sessionId = data.id;
        this.sessions.set(sessionId, new Set([clientId]));
        client.sessionId = sessionId;

        this.broadcast({
            type: 'session_update',
            data: {
                ...data,
                participants: [{ id: client.userId, name: client.userName }],
            },
        });
    }

    /**
     * Handle session join
     */
    private handleSessionJoin(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        const sessionId = data.sessionId;
        const session = this.sessions.get(sessionId);

        if (session) {
            session.add(clientId);
            client.sessionId = sessionId;

            // Notify session participants
            this.broadcastToSession(sessionId, {
                type: 'user_joined',
                data: {
                    userId: client.userId,
                    userName: client.userName,
                },
            });
        }
    }

    /**
     * Handle session leave
     */
    private handleSessionLeave(clientId: string): void {
        const client = this.clients.get(clientId);
        if (!client || !client.sessionId) return;

        const session = this.sessions.get(client.sessionId);
        if (session) {
            session.delete(clientId);

            // Notify remaining participants
            this.broadcastToSession(client.sessionId, {
                type: 'user_left',
                data: {
                    userId: client.userId,
                    userName: client.userName,
                },
            });

            // Clean up empty sessions
            if (session.size === 0) {
                this.sessions.delete(client.sessionId);
            }
        }

        client.sessionId = undefined;
    }

    /**
     * Handle cursor update
     */
    private handleCursor(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (!client || !client.sessionId) return;

        this.broadcastToSession(client.sessionId, {
            type: 'cursor',
            data: {
                userId: client.userId,
                userName: client.userName,
                ...data,
            },
        }, clientId);
    }

    /**
     * Handle chat message
     */
    private handleChat(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (!client || !client.sessionId) return;

        this.broadcastToSession(client.sessionId, {
            type: 'chat',
            data: {
                ...data,
                userId: client.userId,
                userName: client.userName,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Handle activity event
     */
    private handleActivity(clientId: string, data: any): void {
        this.broadcast({
            type: 'activity',
            data: {
                ...data,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Handle file edit
     */
    private handleFileEdit(clientId: string, data: any): void {
        const client = this.clients.get(clientId);
        if (!client || !client.sessionId) return;

        this.broadcastToSession(client.sessionId, {
            type: 'file_edit',
            data: {
                userId: client.userId,
                userName: client.userName,
                ...data,
            },
        }, clientId);
    }

    /**
     * Handle client disconnect
     */
    private handleDisconnect(clientId: string): void {
        const client = this.clients.get(clientId);
        if (!client) return;

        // Leave session if in one
        if (client.sessionId) {
            this.handleSessionLeave(clientId);
        }

        // Broadcast offline status
        this.broadcast({
            type: 'presence',
            data: {
                id: client.userId,
                name: client.userName,
                status: 'offline',
                lastSeen: new Date().toISOString(),
            },
        });

        this.clients.delete(clientId);
        console.log(`🔌 [CollabServer] Client disconnected: ${clientId}`);
    }

    /**
     * Send message to specific client
     */
    private send(clientId: string, message: Message): void {
        const client = this.clients.get(clientId);
        if (client && client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast to all clients
     */
    private broadcast(message: Message, excludeClientId?: string): void {
        const data = JSON.stringify(message);
        for (const [id, client] of this.clients) {
            if (id !== excludeClientId && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(data);
            }
        }
    }

    /**
     * Broadcast to session participants
     */
    private broadcastToSession(sessionId: string, message: Message, excludeClientId?: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const data = JSON.stringify(message);
        for (const clientId of session) {
            if (clientId !== excludeClientId) {
                const client = this.clients.get(clientId);
                if (client && client.socket.readyState === WebSocket.OPEN) {
                    client.socket.send(data);
                }
            }
        }
    }

    /**
     * Get connected client count
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Get session count
     */
    getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Get server stats
     */
    getStats(): { clients: number; sessions: number; uptime: number } {
        return {
            clients: this.clients.size,
            sessions: this.sessions.size,
            uptime: this.httpServer ? Date.now() : 0,
        };
    }
}

export default CollaborationServer;
