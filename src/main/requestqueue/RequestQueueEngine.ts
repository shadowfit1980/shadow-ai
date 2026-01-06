/**
 * Request Queue - Queue management
 */
import { EventEmitter } from 'events';

export interface QueuedRequest { id: string; endpointId: string; payload: Record<string, unknown>; priority: number; enqueuedAt: number; status: 'queued' | 'processing' | 'complete' | 'failed'; result?: unknown; }

export class RequestQueueEngine extends EventEmitter {
    private static instance: RequestQueueEngine;
    private queues: Map<string, QueuedRequest[]> = new Map();
    private processing: Map<string, QueuedRequest[]> = new Map();
    private maxQueueSize = 1000;
    private constructor() { super(); }
    static getInstance(): RequestQueueEngine { if (!RequestQueueEngine.instance) RequestQueueEngine.instance = new RequestQueueEngine(); return RequestQueueEngine.instance; }

    enqueue(endpointId: string, payload: Record<string, unknown>, priority = 5): QueuedRequest | null {
        const queue = this.queues.get(endpointId) || []; if (queue.length >= this.maxQueueSize) return null;
        const req: QueuedRequest = { id: `req_${Date.now()}_${Math.random().toString(36).slice(2)}`, endpointId, payload, priority, enqueuedAt: Date.now(), status: 'queued' };
        queue.push(req); queue.sort((a, b) => b.priority - a.priority); this.queues.set(endpointId, queue); this.emit('enqueued', req); return req;
    }

    dequeue(endpointId: string): QueuedRequest | null { const queue = this.queues.get(endpointId) || []; const req = queue.shift(); if (req) { req.status = 'processing'; const proc = this.processing.get(endpointId) || []; proc.push(req); this.processing.set(endpointId, proc); } return req || null; }
    complete(requestId: string, result: unknown): boolean { for (const [epId, procs] of this.processing) { const idx = procs.findIndex(r => r.id === requestId); if (idx !== -1) { procs[idx].status = 'complete'; procs[idx].result = result; procs.splice(idx, 1); return true; } } return false; }
    getQueueLength(endpointId: string): number { return (this.queues.get(endpointId) || []).length; }
    getProcessingCount(endpointId: string): number { return (this.processing.get(endpointId) || []).length; }
}
export function getRequestQueueEngine(): RequestQueueEngine { return RequestQueueEngine.getInstance(); }
