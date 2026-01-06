/**
 * Real-time & WebSocket Generator
 * 
 * Generate WebSocket servers, Socket.IO integrations,
 * real-time collaboration, and CRDT implementations.
 */

import { EventEmitter } from 'events';

// ============================================================================
// REAL-TIME GENERATOR
// ============================================================================

export class RealTimeGenerator extends EventEmitter {
    private static instance: RealTimeGenerator;

    private constructor() {
        super();
    }

    static getInstance(): RealTimeGenerator {
        if (!RealTimeGenerator.instance) {
            RealTimeGenerator.instance = new RealTimeGenerator();
        }
        return RealTimeGenerator.instance;
    }

    // ========================================================================
    // SOCKET.IO SERVER
    // ========================================================================

    generateSocketIOServer(): string {
        return `import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

const app = express();
const httpServer = createServer(app);

// ============================================================================
// SOCKET.IO CONFIGURATION
// ============================================================================

const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Middleware for authentication
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Authentication error'));
    }
    
    try {
        // Verify token and attach user
        const user = await verifyToken(token);
        socket.data.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

// ============================================================================
// CONNECTION HANDLER
// ============================================================================

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    const user = socket.data.user;

    // Join user's personal room
    socket.join(\`user:\${user.id}\`);

    // Join room
    socket.on('join:room', (roomId: string) => {
        socket.join(\`room:\${roomId}\`);
        io.to(\`room:\${roomId}\`).emit('user:joined', {
            userId: user.id,
            username: user.name,
        });
    });

    // Leave room
    socket.on('leave:room', (roomId: string) => {
        socket.leave(\`room:\${roomId}\`);
        io.to(\`room:\${roomId}\`).emit('user:left', {
            userId: user.id,
        });
    });

    // Send message
    socket.on('message:send', (data: { roomId: string; message: string }) => {
        io.to(\`room:\${data.roomId}\`).emit('message:new', {
            id: generateId(),
            userId: user.id,
            username: user.name,
            message: data.message,
            timestamp: Date.now(),
        });
    });

    // Typing indicator
    socket.on('typing:start', (roomId: string) => {
        socket.to(\`room:\${roomId}\`).emit('user:typing', {
            userId: user.id,
            username: user.name,
        });
    });

    socket.on('typing:stop', (roomId: string) => {
        socket.to(\`room:\${roomId}\`).emit('user:stopped_typing', {
            userId: user.id,
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ============================================================================
// BROADCASTING UTILITIES
// ============================================================================

export const broadcast = {
    toUser: (userId: string, event: string, data: any) => {
        io.to(\`user:\${userId}\`).emit(event, data);
    },

    toRoom: (roomId: string, event: string, data: any) => {
        io.to(\`room:\${roomId}\`).emit(event, data);
    },

    toAll: (event: string, data: any) => {
        io.emit(event, data);
    },
};

httpServer.listen(3001, () => {
    console.log('WebSocket server listening on port 3001');
});
`;
    }

    // ========================================================================
    // SOCKET.IO CLIENT (REACT)
    // ========================================================================

    generateSocketIOClient(): string {
        return `import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// ============================================================================
// SOCKET CONNECTION
// ============================================================================

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        socket = io('http://localhost:3001', {
            auth: { token },
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
            setIsConnected(false);
        });

        return () => {
            socket?.disconnect();
        };
    }, []);

    return { socket, isConnected };
}

// ============================================================================
// ROOM MANAGEMENT
// ============================================================================

export function useRoom(roomId: string) {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket || !roomId) return;

        socket.emit('join:room', roomId);

        return () => {
            socket.emit('leave:room', roomId);
        };
    }, [socket, roomId]);
}

// ============================================================================
// REAL-TIME MESSAGES
// ============================================================================

export function useMessages(roomId: string) {
    const [messages, setMessages] = useState<any[]>([]);
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('message:new', (message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('message:new');
        };
    }, [socket]);

    const sendMessage = useCallback((message: string) => {
        socket?.emit('message:send', { roomId, message });
    }, [socket, roomId]);

    return { messages, sendMessage };
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================

export function useTypingIndicator(roomId: string) {
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('user:typing', ({ username }) => {
            setTypingUsers(prev => [...new Set([...prev, username])]);
        });

        socket.on('user:stopped_typing', ({ userId }) => {
            setTypingUsers(prev => prev.filter(u => u !== userId));
        });

        return () => {
            socket.off('user:typing');
            socket.off('user:stopped_typing');
        };
    }, [socket]);

    const startTyping = useCallback(() => {
        socket?.emit('typing:start', roomId);
    }, [socket, roomId]);

    const stopTyping = useCallback(() => {
        socket?.emit('typing:stop', roomId);
    }, [socket, roomId]);

    return { typingUsers, startTyping, stopTyping };
}
`;
    }

    // ========================================================================
    // WEBSOCKET SERVER (NATIVE)
    // ========================================================================

    generateWebSocketServer(): string {
        return `import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

const wss = new WebSocketServer({ port: 8080 });

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

interface Client {
    ws: WebSocket;
    id: string;
    userId?: string;
    rooms: Set<string>;
}

const clients = new Map<string, Client>();

// ============================================================================
// CONNECTION HANDLER
// ============================================================================

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientId = generateId();
    
    const client: Client = {
        ws,
        id: clientId,
        rooms: new Set(),
    };
    
    clients.set(clientId, client);
    console.log(\`Client connected: \${clientId}\`);

    ws.on('message', (data: string) => {
        try {
            const message = JSON.parse(data.toString());
            handleMessage(client, message);
        } catch (error) {
            console.error('Invalid message:', error);
        }
    });

    ws.on('close', () => {
        clients.delete(clientId);
        broadcastToRooms(client.rooms, {
            type: 'user:left',
            userId: client.userId,
        });
        console.log(\`Client disconnected: \${clientId}\`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

function handleMessage(client: Client, message: any) {
    switch (message.type) {
        case 'auth':
            client.userId = message.userId;
            send(client, { type: 'auth:success' });
            break;

        case 'join':
            client.rooms.add(message.roomId);
            broadcastToRoom(message.roomId, {
                type: 'user:joined',
                userId: client.userId,
            }, client.id);
            break;

        case 'leave':
            client.rooms.delete(message.roomId);
            broadcastToRoom(message.roomId, {
                type: 'user:left',
                userId: client.userId,
            });
            break;

        case 'message':
            broadcastToRoom(message.roomId, {
                type: 'message',
                userId: client.userId,
                content: message.content,
                timestamp: Date.now(),
            });
            break;
    }
}

// ============================================================================
// BROADCASTING
// ============================================================================

function send(client: Client, data: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
    }
}

function broadcastToRoom(roomId: string, data: any, excludeId?: string) {
    clients.forEach((client) => {
        if (client.rooms.has(roomId) && client.id !== excludeId) {
            send(client, data);
        }
    });
}

function broadcastToRooms(rooms: Set<string>, data: any) {
    rooms.forEach(roomId => broadcastToRoom(roomId, data));
}

function broadcastToAll(data: any) {
    clients.forEach((client) => {
        send(client, data);
    });
}

console.log('WebSocket server listening on port 8080');
`;
    }

    // ========================================================================
    // CRDT IMPLEMENTATION
    // ========================================================================

    generateCRDT(): string {
        return `// ============================================================================
// CONFLICT-FREE REPLICATED DATA TYPE (CRDT)
// ============================================================================

export class LWWRegister<T> {
    private value: T;
    private timestamp: number;
    private replicaId: string;

    constructor(initialValue: T, replicaId: string) {
        this.value = initialValue;
        this.timestamp = Date.now();
        this.replicaId = replicaId;
    }

    set(newValue: T): void {
        this.value = newValue;
        this.timestamp = Date.now();
    }

    get(): T {
        return this.value;
    }

    merge(other: LWWRegister<T>): void {
        if (other.timestamp > this.timestamp ||
            (other.timestamp === this.timestamp && other.replicaId > this.replicaId)) {
            this.value = other.value;
            this.timestamp = other.timestamp;
            this.replicaId = other.replicaId;
        }
    }
}

// ============================================================================
// COLLABORATIVE TEXT EDITOR (OT-like)
// ============================================================================

export class CollaborativeText {
    private text: string = '';
    private version: number = 0;

    insert(position: number, content: string): void {
        this.text = this.text.slice(0, position) + content + this.text.slice(position);
        this.version++;
    }

    delete(position: number, length: number): void {
        this.text = this.text.slice(0, position) + this.text.slice(position + length);
        this.version++;
    }

    getText(): string {
        return this.text;
    }

    getVersion(): number {
        return this.version;
    }

    applyOperation(op: { type: 'insert' | 'delete'; position: number; content?: string; length?: number }): void {
        if (op.type === 'insert' && op.content) {
            this.insert(op.position, op.content);
        } else if (op.type === 'delete' && op.length) {
            this.delete(op.position, op.length);
        }
    }
}

// ============================================================================
// Y.JS CRDT INTEGRATION
// ============================================================================

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function setupYjsCollaboration(documentId: string) {
    const ydoc = new Y.Doc();
    
    const provider = new WebsocketProvider(
        'ws://localhost:1234',
        documentId,
        ydoc
    );

    const ytext = ydoc.getText('content');
    const ymap = ydoc.getMap('metadata');

    return { ydoc, provider, ytext, ymap };
}
`;
    }
}

export const realTimeGenerator = RealTimeGenerator.getInstance();
