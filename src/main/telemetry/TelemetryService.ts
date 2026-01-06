/**
 * Telemetry Service - Usage analytics
 */
import { EventEmitter } from 'events';

export interface TelemetryEvent { name: string; properties: Record<string, any>; timestamp: number; sessionId: string; }

export class TelemetryService extends EventEmitter {
    private static instance: TelemetryService;
    private events: TelemetryEvent[] = [];
    private sessionId = `session_${Date.now()}`;
    private enabled = true;
    private constructor() { super(); }
    static getInstance(): TelemetryService { if (!TelemetryService.instance) TelemetryService.instance = new TelemetryService(); return TelemetryService.instance; }

    track(name: string, properties: Record<string, any> = {}): void {
        if (!this.enabled) return;
        const event: TelemetryEvent = { name, properties, timestamp: Date.now(), sessionId: this.sessionId };
        this.events.push(event);
        this.emit('tracked', event);
    }

    trackFeature(feature: string): void { this.track('feature_used', { feature }); }
    trackError(error: string, stack?: string): void { this.track('error', { error, stack }); }
    trackPerformance(action: string, durationMs: number): void { this.track('performance', { action, durationMs }); }

    enable(): void { this.enabled = true; }
    disable(): void { this.enabled = false; }
    isEnabled(): boolean { return this.enabled; }
    getEvents(): TelemetryEvent[] { return [...this.events]; }
    clear(): void { this.events = []; }
}

export function getTelemetryService(): TelemetryService { return TelemetryService.getInstance(); }
