/**
 * Telemetry Control - Telemetry management
 */
import { EventEmitter } from 'events';

export interface TelemetryEvent { id: string; type: string; data: any; timestamp: number; sent: boolean; }

export class TelemetryControl extends EventEmitter {
    private static instance: TelemetryControl;
    private enabled = false;
    private events: TelemetryEvent[] = [];
    private blockedTypes: Set<string> = new Set();
    private constructor() { super(); }
    static getInstance(): TelemetryControl { if (!TelemetryControl.instance) TelemetryControl.instance = new TelemetryControl(); return TelemetryControl.instance; }

    setEnabled(enabled: boolean): void { this.enabled = enabled; this.emit('stateChanged', enabled); }
    isEnabled(): boolean { return this.enabled; }

    record(type: string, data: any): TelemetryEvent | null {
        if (!this.enabled || this.blockedTypes.has(type)) return null;
        const event: TelemetryEvent = { id: `tel_${Date.now()}`, type, data, timestamp: Date.now(), sent: false };
        this.events.push(event);
        this.emit('recorded', event);
        return event;
    }

    blockType(type: string): void { this.blockedTypes.add(type); }
    unblockType(type: string): void { this.blockedTypes.delete(type); }
    getBlockedTypes(): string[] { return Array.from(this.blockedTypes); }
    getHistory(): TelemetryEvent[] { return [...this.events]; }
    clear(): void { this.events = []; }
}
export function getTelemetryControl(): TelemetryControl { return TelemetryControl.getInstance(); }
