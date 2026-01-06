/**
 * Real-time Features Generator
 * 
 * Generate WebSocket, Server-Sent Events, and real-time
 * database integration code.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type RealtimeProvider = 'socket.io' | 'ws' | 'pusher' | 'ably' | 'supabase' | 'firebase';
export type RealtimeFeature = 'chat' | 'notifications' | 'presence' | 'collaboration' | 'live-updates';

export interface RealtimeConfig {
    provider: RealtimeProvider;
    features: RealtimeFeature[];
}

// ============================================================================
// REALTIME GENERATOR
// ============================================================================

export class RealtimeFeaturesGenerator extends EventEmitter {
    private static instance: RealtimeFeaturesGenerator;

    private constructor() {
        super();
    }

    static getInstance(): RealtimeFeaturesGenerator {
        if (!RealtimeFeaturesGenerator.instance) {
            RealtimeFeaturesGenerator.instance = new RealtimeFeaturesGenerator();
        }
        return RealtimeFeaturesGenerator.instance;
    }

    // ========================================================================
    // SOCKET.IO
    // ========================================================================

    /**
     * Generate Socket.IO server
     */
    generateSocketIOServer(): string {
        return `import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Room management
const rooms = new Map<string, Set<string>>();

// User presence
const users = new Map<string, { id: string; name: string; status: string }>();

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  // Authentication
  const userId = socket.handshake.auth.userId;
  const userName = socket.handshake.auth.userName;

  if (userId) {
    users.set(socket.id, { id: userId, name: userName, status: 'online' });
    io.emit('presence:update', Array.from(users.values()));
  }

  // Join room
  socket.on('room:join', (roomId: string) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId)!.add(socket.id);
    
    socket.to(roomId).emit('room:user-joined', { socketId: socket.id, userId, userName });
  });

  // Leave room
  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId);
    rooms.get(roomId)?.delete(socket.id);
    socket.to(roomId).emit('room:user-left', { socketId: socket.id, userId });
  });

  // Chat message
  socket.on('chat:message', (data: { roomId: string; message: string }) => {
    io.to(data.roomId).emit('chat:message', {
      id: Date.now().toString(),
      userId,
      userName,
      message: data.message,
      timestamp: new Date(),
    });
  });

  // Typing indicator
  socket.on('chat:typing', (data: { roomId: string; isTyping: boolean }) => {
    socket.to(data.roomId).emit('chat:typing', {
      userId,
      userName,
      isTyping: data.isTyping,
    });
  });

  // Live cursor (for collaboration)
  socket.on('cursor:move', (data: { roomId: string; x: number; y: number }) => {
    socket.to(data.roomId).emit('cursor:move', {
      socketId: socket.id,
      userId,
      userName,
      x: data.x,
      y: data.y,
    });
  });

  // Broadcast notification
  socket.on('notification:send', (data: { to: string; message: string }) => {
    const targetSocket = Array.from(users.entries()).find(([, u]) => u.id === data.to)?.[0];
    if (targetSocket) {
      io.to(targetSocket).emit('notification', { message: data.message, from: userName });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('presence:update', Array.from(users.values()));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(\`Socket.IO server running on port \${PORT}\`);
});

export { io };
`;
    }

    /**
     * Generate Socket.IO React client
     */
    generateSocketIOClient(): string {
        return `import { io, Socket } from 'socket.io-client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Socket context
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: User[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

interface User {
  id: string;
  name: string;
  status: string;
}

export function SocketProvider({ children, userId, userName }: {
  children: ReactNode;
  userId?: string;
  userName?: string;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { userId, userName },
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));
    newSocket.on('presence:update', setOnlineUsers);

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId, userName]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

// Chat hook
export function useChat(roomId: string) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('room:join', roomId);

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('chat:typing', ({ userName, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping ? [...prev, userName] : prev.filter((u) => u !== userName)
      );
    });

    return () => {
      socket.emit('room:leave', roomId);
      socket.off('chat:message');
      socket.off('chat:typing');
    };
  }, [socket, roomId]);

  const sendMessage = (message: string) => {
    socket?.emit('chat:message', { roomId, message });
  };

  const setTyping = (isTyping: boolean) => {
    socket?.emit('chat:typing', { roomId, isTyping });
  };

  return { messages, typingUsers, sendMessage, setTyping };
}

// Presence hook
export function usePresence() {
  const { onlineUsers } = useSocket();
  return { onlineUsers };
}

// Live cursor hook
export function useLiveCursors(roomId: string) {
  const { socket } = useSocket();
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; userName: string }>>(new Map());

  useEffect(() => {
    if (!socket) return;

    socket.on('cursor:move', ({ socketId, userName, x, y }) => {
      setCursors((prev) => new Map(prev).set(socketId, { x, y, userName }));
    });

    return () => {
      socket.off('cursor:move');
    };
  }, [socket]);

  const updateCursor = (x: number, y: number) => {
    socket?.emit('cursor:move', { roomId, x, y });
  };

  return { cursors, updateCursor };
}
`;
    }

    // ========================================================================
    // SUPABASE REALTIME
    // ========================================================================

    /**
     * Generate Supabase Realtime
     */
    generateSupabaseRealtime(): string {
        return `import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hook for real-time database changes
export function useRealtimeTable<T>(
  table: string,
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      let query = supabase.from(table).select('*');
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }
      const { data: initialData } = await query;
      setData(initialData as T[] || []);
      setLoading(false);
    };
    fetchData();

    // Subscribe to changes
    const channel = supabase
      .channel(\`\${table}-changes\`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter ? \`\${filter.column}=eq.\${filter.value}\` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === (payload.new as any).id ? payload.new as T : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item: any) => item.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, filter?.column, filter?.value]);

  return { data, loading };
}

// Presence hook
export function useSupabasePresence(roomId: string, userId: string, userName: string) {
  const [presenceState, setPresenceState] = useState<any>({});

  useEffect(() => {
    const channel = supabase.channel(roomId);

    channel
      .on('presence', { event: 'sync' }, () => {
        setPresenceState(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: userId,
            name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, userId, userName]);

  return { presenceState };
}

// Broadcast hook
export function useSupabaseBroadcast(channelName: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const ch = supabase.channel(channelName);
    ch.subscribe();
    setChannel(ch);

    return () => {
      ch.unsubscribe();
    };
  }, [channelName]);

  const broadcast = (event: string, payload: any) => {
    channel?.send({
      type: 'broadcast',
      event,
      payload,
    });
  };

  const onBroadcast = (event: string, callback: (payload: any) => void) => {
    channel?.on('broadcast', { event }, ({ payload }) => callback(payload));
  };

  return { broadcast, onBroadcast };
}
`;
    }

    // ========================================================================
    // FIREBASE REALTIME
    // ========================================================================

    /**
     * Generate Firebase Realtime
     */
    generateFirebaseRealtime(): string {
        return `import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  serverTimestamp,
  onDisconnect,
} from 'firebase/database';
import { useEffect, useState } from 'react';

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = getDatabase(app);

// Real-time data hook
export function useFirebaseRealtime<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataRef = ref(db, path);
    
    const unsubscribe = onValue(dataRef, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  return { data, loading };
}

// Chat functionality
export const chatService = {
  sendMessage: async (roomId: string, userId: string, userName: string, message: string) => {
    const messagesRef = ref(db, \`chats/\${roomId}/messages\`);
    await push(messagesRef, {
      userId,
      userName,
      message,
      timestamp: serverTimestamp(),
    });
  },

  useMessages: (roomId: string) => {
    const { data, loading } = useFirebaseRealtime<Record<string, any>>(\`chats/\${roomId}/messages\`);
    const messages = data ? Object.entries(data).map(([id, msg]) => ({ id, ...msg })) : [];
    return { messages, loading };
  },
};

// Presence functionality
export const presenceService = {
  goOnline: async (userId: string, userName: string) => {
    const userRef = ref(db, \`presence/\${userId}\`);
    await set(userRef, {
      name: userName,
      online: true,
      lastSeen: serverTimestamp(),
    });

    // Set offline on disconnect
    onDisconnect(userRef).set({
      name: userName,
      online: false,
      lastSeen: serverTimestamp(),
    });
  },

  useOnlineUsers: () => {
    const { data } = useFirebaseRealtime<Record<string, any>>('presence');
    const onlineUsers = data
      ? Object.entries(data)
          .filter(([, user]) => user.online)
          .map(([id, user]) => ({ id, ...user }))
      : [];
    return { onlineUsers };
  },
};

// Live updates
export const liveUpdateService = {
  subscribe: (path: string, callback: (data: any) => void) => {
    const dataRef = ref(db, path);
    return onValue(dataRef, (snapshot) => callback(snapshot.val()));
  },

  update: async (path: string, data: any) => {
    const dataRef = ref(db, path);
    await update(dataRef, data);
  },

  push: async (path: string, data: any) => {
    const listRef = ref(db, path);
    await push(listRef, { ...data, timestamp: serverTimestamp() });
  },
};
`;
    }

    // ========================================================================
    // FLUTTER REALTIME
    // ========================================================================

    /**
     * Generate Flutter WebSocket
     */
    generateFlutterWebSocket(): string {
        return `import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  bool _isConnected = false;

  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  bool get isConnected => _isConnected;

  Future<void> connect(String url, {String? userId, String? token}) async {
    final uri = Uri.parse(url).replace(
      queryParameters: {
        if (userId != null) 'userId': userId,
        if (token != null) 'token': token,
      },
    );

    _channel = WebSocketChannel.connect(uri);
    _isConnected = true;

    _channel!.stream.listen(
      (data) {
        final message = jsonDecode(data);
        _messageController.add(message);
      },
      onError: (error) {
        _isConnected = false;
        _messageController.addError(error);
      },
      onDone: () {
        _isConnected = false;
      },
    );
  }

  void send(String event, Map<String, dynamic> data) {
    if (_isConnected && _channel != null) {
      _channel!.sink.add(jsonEncode({
        'event': event,
        'data': data,
      }));
    }
  }

  void joinRoom(String roomId) {
    send('room:join', {'roomId': roomId});
  }

  void leaveRoom(String roomId) {
    send('room:leave', {'roomId': roomId});
  }

  void sendMessage(String roomId, String message) {
    send('chat:message', {'roomId': roomId, 'message': message});
  }

  void setTyping(String roomId, bool isTyping) {
    send('chat:typing', {'roomId': roomId, 'isTyping': isTyping});
  }

  void disconnect() {
    _channel?.sink.close();
    _isConnected = false;
  }

  void dispose() {
    disconnect();
    _messageController.close();
  }
}

// Riverpod provider
final webSocketProvider = Provider<WebSocketService>((ref) {
  final service = WebSocketService();
  ref.onDispose(() => service.dispose());
  return service;
});

// Chat messages provider
final chatMessagesProvider = StreamProvider.family<List<ChatMessage>, String>((ref, roomId) {
  final ws = ref.watch(webSocketProvider);
  return ws.messages
      .where((msg) => msg['event'] == 'chat:message' && msg['data']['roomId'] == roomId)
      .map((msg) => ChatMessage.fromJson(msg['data']));
});

class ChatMessage {
  final String id;
  final String userId;
  final String userName;
  final String message;
  final DateTime timestamp;

  ChatMessage({
    required this.id,
    required this.userId,
    required this.userName,
    required this.message,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      message: json['message'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }
}
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Generate env template
     */
    generateEnvTemplate(provider: RealtimeProvider): string {
        switch (provider) {
            case 'supabase':
                return `# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
`;
            case 'firebase':
                return `# Firebase Realtime
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
`;
            case 'pusher':
                return `# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
`;
            default:
                return '';
        }
    }
}

// Export singleton
export const realtimeFeaturesGenerator = RealtimeFeaturesGenerator.getInstance();
