/**
 * WebSocket Client Generator
 * 
 * Generate WebSocket client code for real-time applications.
 */

import { EventEmitter } from 'events';

interface WebSocketEvent {
    name: string;
    payload?: Record<string, string>;
}

export class WebSocketClientGenerator extends EventEmitter {
    private static instance: WebSocketClientGenerator;

    private constructor() { super(); }

    static getInstance(): WebSocketClientGenerator {
        if (!WebSocketClientGenerator.instance) {
            WebSocketClientGenerator.instance = new WebSocketClientGenerator();
        }
        return WebSocketClientGenerator.instance;
    }

    generateReactHook(events: WebSocketEvent[]): string {
        const handlers = events.map(e => `    '${e.name}': (data: any) => void;`).join('\n');
        return `import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions {
  url: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}

interface MessageHandlers {
${handlers}
}

export function useWebSocket(options: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const handlers = useRef<Partial<MessageHandlers>>({});

  const connect = useCallback(() => {
    ws.current = new WebSocket(options.url);
    
    ws.current.onopen = () => {
      setIsConnected(true);
      options.onOpen?.();
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      options.onClose?.();
      if (options.reconnect) {
        setTimeout(connect, options.reconnectInterval || 3000);
      }
    };
    
    ws.current.onerror = (e) => options.onError?.(e);
    
    ws.current.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        handlers.current[type as keyof MessageHandlers]?.(data);
      } catch (e) { console.error('WS parse error:', e); }
    };
  }, [options]);

  useEffect(() => { connect(); return () => ws.current?.close(); }, [connect]);

  const send = useCallback((type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  const on = useCallback(<K extends keyof MessageHandlers>(event: K, handler: MessageHandlers[K]) => {
    handlers.current[event] = handler;
  }, []);

  return { isConnected, send, on };
}
`;
    }

    generateSocketIOClient(events: WebSocketEvent[]): string {
        const typeUnion = events.map(e => `'${e.name}'`).join(' | ');
        return `import { io, Socket } from 'socket.io-client';

type EventType = ${typeUnion};

class SocketClient {
  private socket: Socket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.socket = io(this.url, { transports: ['websocket'] });
    
    this.socket.on('connect', () => console.log('Connected'));
    this.socket.on('disconnect', () => console.log('Disconnected'));
    this.socket.on('error', (err) => console.error('Socket error:', err));
    
    return this;
  }

  on(event: EventType, handler: (data: any) => void) {
    this.socket?.on(event, handler);
    return this;
  }

  emit(event: EventType, data: any) {
    this.socket?.emit(event, data);
    return this;
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketClient = new SocketClient('ws://localhost:3001');
`;
    }

    generateNodeServer(events: WebSocketEvent[]): string {
        const handlers = events.map(e =>
            `    socket.on('${e.name}', (data) => {\n      console.log('${e.name}:', data);\n      // Handle ${e.name}\n    });`
        ).join('\n\n');
        return `import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket: WebSocket) => {
  console.log('Client connected');

  socket.on('message', (raw) => {
    try {
      const { type, data } = JSON.parse(raw.toString());
      // Route to handlers
    } catch (e) { console.error('Parse error'); }
  });

${handlers}

  socket.on('close', () => console.log('Client disconnected'));
});

export function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

console.log('WebSocket server running on ws://localhost:8080');
`;
    }
}

export const websocketClientGenerator = WebSocketClientGenerator.getInstance();
