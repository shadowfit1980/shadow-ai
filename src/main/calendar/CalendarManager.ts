/**
 * Calendar Manager - Calendar integration
 */
import { EventEmitter } from 'events';

export interface CalendarEvent { id: string; title: string; start: Date; end: Date; location?: string; attendees?: string[]; recurring?: boolean; }

export class CalendarManager extends EventEmitter {
    private static instance: CalendarManager;
    private events: Map<string, CalendarEvent> = new Map();
    private constructor() { super(); }
    static getInstance(): CalendarManager { if (!CalendarManager.instance) CalendarManager.instance = new CalendarManager(); return CalendarManager.instance; }

    createEvent(title: string, start: Date, end: Date, location?: string): CalendarEvent {
        const event: CalendarEvent = { id: `evt_${Date.now()}`, title, start, end, location };
        this.events.set(event.id, event);
        this.emit('created', event);
        return event;
    }

    updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null { const evt = this.events.get(id); if (!evt) return null; Object.assign(evt, updates); this.emit('updated', evt); return evt; }
    deleteEvent(id: string): boolean { return this.events.delete(id); }
    getToday(): CalendarEvent[] { const now = new Date(); return Array.from(this.events.values()).filter(e => e.start.toDateString() === now.toDateString()); }
    getUpcoming(days = 7): CalendarEvent[] { const now = Date.now(); const limit = now + days * 86400000; return Array.from(this.events.values()).filter(e => e.start.getTime() >= now && e.start.getTime() <= limit); }
    getAll(): CalendarEvent[] { return Array.from(this.events.values()); }
}
export function getCalendarManager(): CalendarManager { return CalendarManager.getInstance(); }
