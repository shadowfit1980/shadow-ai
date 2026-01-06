/**
 * Dimensional Message Queue
 * 
 * A message queue that spans dimensions,
 * ensuring reliable delivery across the multiverse.
 */

import { EventEmitter } from 'events';

export interface DimensionalMessage { id: string; topic: string; payload: unknown; dimension: number; delivered: boolean; }

export class DimensionalMessageQueue extends EventEmitter {
    private static instance: DimensionalMessageQueue;
    private queues: Map<string, DimensionalMessage[]> = new Map();

    private constructor() { super(); }
    static getInstance(): DimensionalMessageQueue {
        if (!DimensionalMessageQueue.instance) { DimensionalMessageQueue.instance = new DimensionalMessageQueue(); }
        return DimensionalMessageQueue.instance;
    }

    enqueue(topic: string, payload: unknown): DimensionalMessage {
        const message: DimensionalMessage = { id: `msg_${Date.now()}`, topic, payload, dimension: Math.floor(Math.random() * 7), delivered: false };
        const queue = this.queues.get(topic) || [];
        queue.push(message);
        this.queues.set(topic, queue);
        return message;
    }

    dequeue(topic: string): DimensionalMessage | undefined {
        const queue = this.queues.get(topic);
        if (!queue || queue.length === 0) return undefined;
        const message = queue.shift();
        if (message) message.delivered = true;
        return message;
    }

    getStats(): { totalTopics: number; totalMessages: number } {
        let total = 0;
        for (const q of this.queues.values()) total += q.length;
        return { totalTopics: this.queues.size, totalMessages: total };
    }
}

export const dimensionalMessageQueue = DimensionalMessageQueue.getInstance();
