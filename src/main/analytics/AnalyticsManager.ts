/**
 * Analytics Manager - Usage analytics
 */
import { EventEmitter } from 'events';

export interface AnalyticsEvent { name: string; properties?: Record<string, any>; timestamp: number; userId?: string; }

export class AnalyticsManager extends EventEmitter {
    private static instance: AnalyticsManager;
    private events: AnalyticsEvent[] = [];
    private userId?: string;
    private constructor() { super(); }
    static getInstance(): AnalyticsManager { if (!AnalyticsManager.instance) AnalyticsManager.instance = new AnalyticsManager(); return AnalyticsManager.instance; }

    setUserId(id: string): void { this.userId = id; }

    track(name: string, properties?: Record<string, any>): void {
        const event: AnalyticsEvent = { name, properties, timestamp: Date.now(), userId: this.userId };
        this.events.push(event);
        this.emit('tracked', event);
    }

    page(name: string): void { this.track('page_view', { page: name }); }
    identify(traits: Record<string, any>): void { this.track('identify', traits); }

    getEvents(name?: string): AnalyticsEvent[] { return name ? this.events.filter(e => e.name === name) : [...this.events]; }
    getMetrics(): { total: number; unique: number } { return { total: this.events.length, unique: new Set(this.events.map(e => e.name)).size }; }
    clear(): void { this.events = []; }
}

export function getAnalyticsManager(): AnalyticsManager { return AnalyticsManager.getInstance(); }
