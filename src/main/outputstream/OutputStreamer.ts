/**
 * Output Streamer - Real-time streaming
 */
import { EventEmitter } from 'events';

export interface StreamSession { id: string; status: 'streaming' | 'complete' | 'error'; chunks: string[]; totalTokens: number; startTime: number; endTime?: number; }

export class OutputStreamer extends EventEmitter {
    private static instance: OutputStreamer;
    private sessions: Map<string, StreamSession> = new Map();
    private constructor() { super(); }
    static getInstance(): OutputStreamer { if (!OutputStreamer.instance) OutputStreamer.instance = new OutputStreamer(); return OutputStreamer.instance; }

    startStream(): StreamSession {
        const session: StreamSession = { id: `stream_${Date.now()}`, status: 'streaming', chunks: [], totalTokens: 0, startTime: Date.now() };
        this.sessions.set(session.id, session);
        this.emit('started', session);
        return session;
    }

    pushChunk(sessionId: string, chunk: string): boolean {
        const session = this.sessions.get(sessionId); if (!session || session.status !== 'streaming') return false;
        session.chunks.push(chunk);
        session.totalTokens += Math.ceil(chunk.length / 4);
        this.emit('chunk', { sessionId, chunk });
        return true;
    }

    complete(sessionId: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'complete'; s.endTime = Date.now(); this.emit('complete', s); return true; }
    error(sessionId: string, error: string): boolean { const s = this.sessions.get(sessionId); if (!s) return false; s.status = 'error'; this.emit('error', { sessionId, error }); return true; }
    get(sessionId: string): StreamSession | null { return this.sessions.get(sessionId) || null; }
    getFullOutput(sessionId: string): string { return this.sessions.get(sessionId)?.chunks.join('') || ''; }
}
export function getOutputStreamer(): OutputStreamer { return OutputStreamer.getInstance(); }
