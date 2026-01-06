/**
 * WebSocket Manager
 * 
 * Generate WebSocket server/client code
 * for real-time applications.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface WebSocketEvent {
    name: string;
    payload?: Record<string, any>;
    description?: string;
    direction: 'client-to-server' | 'server-to-client' | 'bidirectional';
}

export interface WebSocketRoom {
    name: string;
    events: string[];
    description?: string;
}

export interface WebSocketConfig {
    events: WebSocketEvent[];
    rooms?: WebSocketRoom[];
    auth?: {
        type: 'jwt' | 'apikey' | 'custom';
        tokenPath?: string;
    };
    pingInterval?: number;
    reconnect?: boolean;
}

export type WebSocketFramework = 'socket.io' | 'ws' | 'uwebsockets' | 'sockjs';

// ============================================================================
// WEBSOCKET MANAGER
// ============================================================================

export class WebSocketManager extends EventEmitter {
    private static instance: WebSocketManager;

    private constructor() {
        super();
    }

    static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    // ========================================================================
    // SOCKET.IO SERVER
    // ========================================================================

    generateSocketIOServer(config: WebSocketConfig): string {
        const events = config.events;
        const rooms = config.rooms || [];

        return `import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: ${config.pingInterval || 25000},
  pingTimeout: 5000,
});

// Types
interface ServerToClientEvents {
${events.filter(e => e.direction !== 'client-to-server').map(e =>
            `  ${e.name}: (${e.payload ? `data: ${JSON.stringify(e.payload).replace(/"/g, '')}` : ''}) => void;`
        ).join('\n')}
}

interface ClientToServerEvents {
${events.filter(e => e.direction !== 'server-to-client').map(e =>
            `  ${e.name}: (${e.payload ? `data: ${JSON.stringify(e.payload).replace(/"/g, '')}, ` : ''}callback?: (response: any) => void) => void;`
        ).join('\n')}
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  userId: string;
  username: string;
}

${config.auth ? this.generateAuthMiddleware(config.auth) : ''}

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  console.log('Client connected:', socket.id);

  // Event handlers
${events.filter(e => e.direction !== 'server-to-client').map(e => `
  // ${e.description || e.name}
  socket.on('${e.name}', ${e.payload ? '(data, callback)' : '(callback)'} => {
    try {
      // TODO: Implement ${e.name} handler
      console.log('${e.name}', ${e.payload ? 'data' : ''});
      callback?.({ success: true });
    } catch (error) {
      callback?.({ success: false, error: (error as Error).message });
    }
  });
`).join('')}

${rooms.length > 0 ? `
  // Room management
  socket.on('join-room', (roomName: string) => {
    socket.join(roomName);
    socket.to(roomName).emit('user-joined', { 
      userId: socket.data.userId,
      room: roomName 
    });
  });

  socket.on('leave-room', (roomName: string) => {
    socket.leave(roomName);
    socket.to(roomName).emit('user-left', { 
      userId: socket.data.userId,
      room: roomName 
    });
  });
` : ''}

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', socket.id, error);
  });
});

// Broadcast helpers
export function broadcast(event: keyof ServerToClientEvents, data: any) {
  io.emit(event, data);
}

export function broadcastToRoom(room: string, event: keyof ServerToClientEvents, data: any) {
  io.to(room).emit(event, data);
}

export function sendToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
  io.to(\`user:\${userId}\`).emit(event, data);
}

const PORT = process.env.WS_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(\`WebSocket server running on port \${PORT}\`);
});

export { io };
`;
    }

    private generateAuthMiddleware(auth: WebSocketConfig['auth']): string {
        if (auth?.type === 'jwt') {
            return `
// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; username: string };
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username;
    socket.join(\`user:\${decoded.userId}\`);
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});
`;
        }
        return '';
    }

    // ========================================================================
    // SOCKET.IO CLIENT
    // ========================================================================

    generateSocketIOClient(config: WebSocketConfig): string {
        const events = config.events;

        return `import { io, Socket } from 'socket.io-client';

// Types
interface ServerToClientEvents {
${events.filter(e => e.direction !== 'client-to-server').map(e =>
            `  ${e.name}: (${e.payload ? `data: ${JSON.stringify(e.payload).replace(/"/g, '')}` : ''}) => void;`
        ).join('\n')}
}

interface ClientToServerEvents {
${events.filter(e => e.direction !== 'server-to-client').map(e =>
            `  ${e.name}: (${e.payload ? `data: ${JSON.stringify(e.payload).replace(/"/g, '')}, ` : ''}callback?: (response: any) => void) => void;`
        ).join('\n')}
}

class WebSocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(url: string = '${config.auth ? '' : 'http://localhost:3001'}') {
    this.url = url;
  }

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        auth: token ? { token } : undefined,
        reconnection: ${config.reconnect !== false},
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
      });

      // Set up event listeners
${events.filter(e => e.direction !== 'client-to-server').map(e => `
      this.socket.on('${e.name}', (data) => {
        this.handleEvent('${e.name}', data);
      });
`).join('')}
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  private handleEvent(event: string, data: any): void {
    // Override this method or add specific handlers
    console.log(\`Received \${event}:\`, data);
  }

  // Emit methods
${events.filter(e => e.direction !== 'server-to-client').map(e => `
  ${this.toCamelCase(e.name)}(${e.payload ? 'data: ' + JSON.stringify(e.payload).replace(/"/g, '') : ''}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }
      this.socket.emit('${e.name}', ${e.payload ? 'data, ' : ''}(response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }
`).join('')}

  // Event subscription
  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    this.socket?.on(event, handler as any);
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ): void {
    this.socket?.off(event, handler as any);
  }

  // Room management
  joinRoom(roomName: string): void {
    this.socket?.emit('join-room' as any, roomName);
  }

  leaveRoom(roomName: string): void {
    this.socket?.emit('leave-room' as any, roomName);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsClient = new WebSocketClient();
export default WebSocketClient;
`;
    }

    // ========================================================================
    // REACT HOOK
    // ========================================================================

    generateReactHook(config: WebSocketConfig): string {
        return `import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
  reconnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
${config.events.filter(e => e.direction !== 'server-to-client').map(e =>
            `  ${this.toCamelCase(e.name)}: (${e.payload ? 'data: any' : ''}) => Promise<any>;`
        ).join('\n')}
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { 
    url = 'http://localhost:3001', 
    token, 
    autoConnect = true,
    reconnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    socketRef.current = io(url, {
      auth: token ? { token } : undefined,
      reconnection: reconnect,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      setError(err);
      setIsConnected(false);
    });
  }, [url, token, reconnect]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

${config.events.filter(e => e.direction !== 'server-to-client').map(e => `
  const ${this.toCamelCase(e.name)} = useCallback((${e.payload ? 'data: any' : ''}): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Not connected'));
        return;
      }
      socketRef.current.emit('${e.name}', ${e.payload ? 'data, ' : ''}(response: any) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, []);
`).join('')}

  return {
    isConnected,
    error,
    connect,
    disconnect,
${config.events.filter(e => e.direction !== 'server-to-client').map(e =>
            `    ${this.toCamelCase(e.name)},`
        ).join('\n')}
  };
}

// Hook for listening to specific events
export function useWebSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  socket: Socket | null
) {
  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}
`;
    }

    // ========================================================================
    // WS (RAW WEBSOCKET) SERVER
    // ========================================================================

    generateWSServer(config: WebSocketConfig): string {
        return `import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

const server = createServer();
const wss = new WebSocketServer({ server });

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  isAlive: boolean;
}

interface Message {
  type: string;
  payload?: any;
  id?: string;
}

const clients = new Map<string, ExtendedWebSocket>();

wss.on('connection', (ws: ExtendedWebSocket, req) => {
  ws.isAlive = true;

  ${config.auth ? `
  // Authentication
  const token = new URL(req.url!, 'http://localhost').searchParams.get('token');
  if (!token) {
    ws.close(4001, 'Authentication required');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    ws.userId = decoded.userId;
    clients.set(decoded.userId, ws);
  } catch (err) {
    ws.close(4002, 'Invalid token');
    return;
  }
  ` : ''}

  console.log('Client connected');

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      const message: Message = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (err) {
      send(ws, { type: 'error', payload: { message: 'Invalid message format' } });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (ws.userId) {
      clients.delete(ws.userId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

function handleMessage(ws: ExtendedWebSocket, message: Message) {
  switch (message.type) {
${config.events.filter(e => e.direction !== 'server-to-client').map(e => `
    case '${e.name}':
      // TODO: Implement ${e.name}
      send(ws, { type: '${e.name}:response', id: message.id, payload: { success: true } });
      break;
`).join('')}
    default:
      send(ws, { type: 'error', payload: { message: 'Unknown message type' } });
  }
}

function send(ws: WebSocket, message: Message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(message: Message, exclude?: string) {
  clients.forEach((client, userId) => {
    if (userId !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function sendToUser(userId: string, message: Message) {
  const client = clients.get(userId);
  if (client?.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// Heartbeat to detect broken connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as ExtendedWebSocket;
    if (!extWs.isAlive) {
      return extWs.terminate();
    }
    extWs.isAlive = false;
    extWs.ping();
  });
}, ${config.pingInterval || 30000});

wss.on('close', () => {
  clearInterval(interval);
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(\`WebSocket server running on port \${PORT}\`);
});

export { wss, broadcast, sendToUser };
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private toCamelCase(str: string): string {
        return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }
}

export const webSocketManager = WebSocketManager.getInstance();
