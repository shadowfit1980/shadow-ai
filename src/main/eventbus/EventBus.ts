/**
 * Event Bus
 * Pub/sub messaging system
 */

import { EventEmitter } from 'events';

export interface BusEvent {
    topic: string;
    payload: any;
    timestamp: number;
    source?: string;
}

/**
 * EventBus
 * Application-wide event system
 */
export class EventBus extends EventEmitter {
    private static instance: EventBus;
    private history: BusEvent[] = [];
    private maxHistory = 100;

    private constructor() {
        super();
        this.setMaxListeners(100);
    }

    static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    publish(topic: string, payload: any, source?: string): void {
        const event: BusEvent = {
            topic,
            payload,
            timestamp: Date.now(),
            source,
        };

        this.history.push(event);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.emit(topic, payload);
        this.emit('*', event);
    }

    subscribe(topic: string, handler: (payload: any) => void): () => void {
        this.on(topic, handler);
        return () => this.off(topic, handler);
    }

    subscribeOnce(topic: string, handler: (payload: any) => void): void {
        this.once(topic, handler);
    }

    subscribeAll(handler: (event: BusEvent) => void): () => void {
        this.on('*', handler);
        return () => this.off('*', handler);
    }

    unsubscribe(topic: string, handler?: (payload: any) => void): void {
        if (handler) {
            this.off(topic, handler);
        } else {
            this.removeAllListeners(topic);
        }
    }

    getHistory(topic?: string): BusEvent[] {
        if (topic) {
            return this.history.filter(e => e.topic === topic);
        }
        return [...this.history];
    }

    clearHistory(): void {
        this.history = [];
    }

    getTopics(): string[] {
        return [...new Set(this.history.map(e => e.topic))];
    }
}

export function getEventBus(): EventBus {
    return EventBus.getInstance();
}
