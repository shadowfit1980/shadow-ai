/**
 * Ethereal Event Emitter
 * 
 * Emits events through the ethereal plane, enabling
 * communication between disconnected code entities.
 */

import { EventEmitter } from 'events';

export interface EtherealEvent {
    id: string;
    name: string;
    payload: unknown;
    frequency: number;
    resonance: number;
}

export class EtherealEventEmitter extends EventEmitter {
    private static instance: EtherealEventEmitter;
    private events: Map<string, EtherealEvent> = new Map();

    private constructor() { super(); }

    static getInstance(): EtherealEventEmitter {
        if (!EtherealEventEmitter.instance) {
            EtherealEventEmitter.instance = new EtherealEventEmitter();
        }
        return EtherealEventEmitter.instance;
    }

    broadcast(name: string, payload: unknown): EtherealEvent {
        const event: EtherealEvent = {
            id: `event_${Date.now()}`,
            name,
            payload,
            frequency: 432 + Math.random() * 100,
            resonance: 0.7 + Math.random() * 0.3,
        };

        this.events.set(event.id, event);
        this.emit('ethereal:broadcast', event);
        return event;
    }

    tune(frequency: number): EtherealEvent[] {
        return Array.from(this.events.values()).filter(e =>
            Math.abs(e.frequency - frequency) < 50
        );
    }

    getStats(): { total: number; avgResonance: number } {
        const events = Array.from(this.events.values());
        return {
            total: events.length,
            avgResonance: events.length > 0 ? events.reduce((s, e) => s + e.resonance, 0) / events.length : 0,
        };
    }
}

export const etherealEventEmitter = EtherealEventEmitter.getInstance();
