/**
 * Astral Event Sourcing
 * 
 * Implements event sourcing through the astral plane,
 * maintaining perfect history of all cosmic events.
 */

import { EventEmitter } from 'events';

export interface AstralEvent { id: string; type: string; data: unknown; version: number; timestamp: Date; }

export class AstralEventStore extends EventEmitter {
    private static instance: AstralEventStore;
    private events: AstralEvent[] = [];

    private constructor() { super(); }
    static getInstance(): AstralEventStore {
        if (!AstralEventStore.instance) { AstralEventStore.instance = new AstralEventStore(); }
        return AstralEventStore.instance;
    }

    append(type: string, data: unknown): AstralEvent {
        const event: AstralEvent = { id: `event_${Date.now()}`, type, data, version: this.events.length + 1, timestamp: new Date() };
        this.events.push(event);
        this.emit('event:appended', event);
        return event;
    }

    getEvents(afterVersion?: number): AstralEvent[] {
        if (afterVersion) return this.events.filter(e => e.version > afterVersion);
        return [...this.events];
    }

    getStats(): { totalEvents: number; latestVersion: number } {
        return { totalEvents: this.events.length, latestVersion: this.events.length };
    }
}

export const astralEventStore = AstralEventStore.getInstance();
