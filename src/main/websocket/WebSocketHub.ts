/**
 * WebSocket Hub - Manage WebSocket connections
 */
import { EventEmitter } from 'events';

export interface WSConnection { id: string; url: string; status: 'connecting' | 'connected' | 'disconnected'; createdAt: number; }

export class WebSocketHub extends EventEmitter {
    private static instance: WebSocketHub;
    private connections: Map<string, WSConnection> = new Map();
    private constructor() { super(); }
    static getInstance(): WebSocketHub { if (!WebSocketHub.instance) WebSocketHub.instance = new WebSocketHub(); return WebSocketHub.instance; }

    connect(url: string): WSConnection {
        const conn: WSConnection = { id: `ws_${Date.now()}`, url, status: 'connecting', createdAt: Date.now() };
        this.connections.set(conn.id, conn);
        conn.status = 'connected';
        this.emit('connected', conn);
        return conn;
    }

    disconnect(id: string): boolean { const conn = this.connections.get(id); if (!conn) return false; conn.status = 'disconnected'; this.emit('disconnected', conn); return true; }
    send(id: string, message: any): boolean { const conn = this.connections.get(id); if (!conn || conn.status !== 'connected') return false; this.emit('message', { id, message }); return true; }
    getAll(): WSConnection[] { return Array.from(this.connections.values()); }
    getConnected(): WSConnection[] { return this.getAll().filter(c => c.status === 'connected'); }
}

export function getWebSocketHub(): WebSocketHub { return WebSocketHub.getInstance(); }
