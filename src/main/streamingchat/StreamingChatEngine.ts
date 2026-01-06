/**
 * Streaming Chat - SSE streaming responses
 */
import { EventEmitter } from 'events';

export interface StreamChunk { model: string; createdAt: string; message: { role: string; content: string }; done: boolean; totalDuration?: number; loadDuration?: number; evalCount?: number; }

export class StreamingChatEngine extends EventEmitter {
    private static instance: StreamingChatEngine;
    private activeStreams: Map<string, { aborted: boolean }> = new Map();
    private constructor() { super(); }
    static getInstance(): StreamingChatEngine { if (!StreamingChatEngine.instance) StreamingChatEngine.instance = new StreamingChatEngine(); return StreamingChatEngine.instance; }

    async *stream(model: string, messages: { role: string; content: string }[]): AsyncGenerator<StreamChunk> {
        const streamId = `stream_${Date.now()}`;
        this.activeStreams.set(streamId, { aborted: false });
        const response = `This is a streaming response for: ${messages[messages.length - 1]?.content || ''}`;
        const words = response.split(' ');
        for (let i = 0; i < words.length; i++) {
            if (this.activeStreams.get(streamId)?.aborted) break;
            yield { model, createdAt: new Date().toISOString(), message: { role: 'assistant', content: words[i] + ' ' }, done: false };
            await new Promise(r => setTimeout(r, 50));
        }
        yield { model, createdAt: new Date().toISOString(), message: { role: 'assistant', content: '' }, done: true, totalDuration: words.length * 50, evalCount: words.length };
        this.activeStreams.delete(streamId);
    }

    abort(streamId: string): boolean { const stream = this.activeStreams.get(streamId); if (stream) { stream.aborted = true; return true; } return false; }
    getActiveCount(): number { return this.activeStreams.size; }
}
export function getStreamingChatEngine(): StreamingChatEngine { return StreamingChatEngine.getInstance(); }
