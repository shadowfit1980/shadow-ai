/**
 * Ethereal Event Emitter Pro
 */
import { EventEmitter } from 'events';
export class EtherealEventEmitterPro extends EventEmitter {
    private static instance: EtherealEventEmitterPro;
    private subscriptions: Map<string, Map<number, (...args: unknown[]) => void>> = new Map();
    private nextId = 0;
    private constructor() { super(); }
    static getInstance(): EtherealEventEmitterPro { if (!EtherealEventEmitterPro.instance) { EtherealEventEmitterPro.instance = new EtherealEventEmitterPro(); } return EtherealEventEmitterPro.instance; }
    subscribe(eventName: string, callback: (...args: unknown[]) => void): { unsubscribe: () => void } { if (!this.subscriptions.has(eventName)) this.subscriptions.set(eventName, new Map()); const id = this.nextId++; this.subscriptions.get(eventName)!.set(id, callback); return { unsubscribe: () => this.subscriptions.get(eventName)?.delete(id) }; }
    emitEvent(eventName: string, args: unknown[] = []): unknown[] { const results: unknown[] = []; for (const cb of this.subscriptions.get(eventName)?.values() || []) results.push(cb(...args)); return results; }
    getStats(): { events: number } { return { events: this.subscriptions.size }; }
}
export const etherealEventEmitterPro = EtherealEventEmitterPro.getInstance();
