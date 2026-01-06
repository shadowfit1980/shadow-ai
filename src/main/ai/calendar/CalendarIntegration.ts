/**
 * Calendar & Scheduling Integration
 * 
 * AI-powered calendar management with Google/Outlook
 * integration and smart scheduling.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type CalendarProvider = 'google' | 'outlook' | 'apple';

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    attendees: Attendee[];
    isAllDay: boolean;
    recurrence?: RecurrenceRule;
    reminders: Reminder[];
    status: 'confirmed' | 'tentative' | 'cancelled';
    calendarId: string;
}

export interface Attendee {
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
    optional?: boolean;
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: Date;
    count?: number;
    daysOfWeek?: string[];
}

export interface Reminder {
    type: 'email' | 'popup';
    minutesBefore: number;
}

export interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
}

export interface SchedulingRequest {
    title: string;
    duration: number; // minutes
    attendees: string[];
    preferredTimes?: TimePreference[];
    constraints?: SchedulingConstraints;
}

export interface TimePreference {
    dayOfWeek?: number; // 0-6
    startHour?: number;
    endHour?: number;
    priority: 'high' | 'medium' | 'low';
}

export interface SchedulingConstraints {
    noWeekends?: boolean;
    noEarlyMornings?: boolean; // Before 9am
    noLateEvenings?: boolean;  // After 6pm
    bufferBetweenMeetings?: number; // minutes
    maxMeetingsPerDay?: number;
}

export interface MeetingNotes {
    meetingId: string;
    title: string;
    date: Date;
    attendees: string[];
    summary: string;
    keyPoints: string[];
    actionItems: ActionItem[];
    decisions: string[];
    nextSteps: string[];
}

export interface ActionItem {
    task: string;
    assignee: string;
    dueDate?: Date;
    completed: boolean;
}

// ============================================================================
// CALENDAR INTEGRATION
// ============================================================================

export class CalendarIntegration extends EventEmitter {
    private static instance: CalendarIntegration;
    private provider: CalendarProvider = 'google';
    private events: Map<string, CalendarEvent> = new Map();
    private workingHours = { start: 9, end: 17 };

    private constructor() {
        super();
    }

    static getInstance(): CalendarIntegration {
        if (!CalendarIntegration.instance) {
            CalendarIntegration.instance = new CalendarIntegration();
        }
        return CalendarIntegration.instance;
    }

    setProvider(provider: CalendarProvider): void {
        this.provider = provider;
        this.emit('providerChanged', provider);
    }

    // ========================================================================
    // EVENT MANAGEMENT
    // ========================================================================

    async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
        const newEvent: CalendarEvent = {
            ...event,
            id: `event_${Date.now()}`,
        };

        // In production, call provider API
        // await this.providerAPI.createEvent(newEvent);

        this.events.set(newEvent.id, newEvent);
        this.emit('eventCreated', newEvent);
        return newEvent;
    }

    async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
        const event = this.events.get(id);
        if (!event) return null;

        const updated = { ...event, ...updates };
        this.events.set(id, updated);
        this.emit('eventUpdated', updated);
        return updated;
    }

    async deleteEvent(id: string): Promise<boolean> {
        const deleted = this.events.delete(id);
        if (deleted) {
            this.emit('eventDeleted', id);
        }
        return deleted;
    }

    async getEvent(id: string): Promise<CalendarEvent | undefined> {
        return this.events.get(id);
    }

    async listEvents(options?: {
        start?: Date;
        end?: Date;
        calendarId?: string;
    }): Promise<CalendarEvent[]> {
        let events = Array.from(this.events.values());

        if (options?.start) {
            events = events.filter(e => e.start >= options.start!);
        }
        if (options?.end) {
            events = events.filter(e => e.start <= options.end!);
        }
        if (options?.calendarId) {
            events = events.filter(e => e.calendarId === options.calendarId);
        }

        return events.sort((a, b) => a.start.getTime() - b.start.getTime());
    }

    // ========================================================================
    // SMART SCHEDULING
    // ========================================================================

    async findAvailableSlots(
        attendees: string[],
        duration: number,
        options?: {
            startDate?: Date;
            endDate?: Date;
            constraints?: SchedulingConstraints;
        }
    ): Promise<TimeSlot[]> {
        const startDate = options?.startDate || new Date();
        const endDate = options?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const constraints = options?.constraints || {};

        const slots: TimeSlot[] = [];
        const currentDate = new Date(startDate);

        while (currentDate < endDate) {
            // Skip weekends if constrained
            const dayOfWeek = currentDate.getDay();
            if (constraints.noWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            // Check working hours
            const startHour = constraints.noEarlyMornings ? 9 : this.workingHours.start;
            const endHour = constraints.noLateEvenings ? 18 : this.workingHours.end;

            for (let hour = startHour; hour < endHour; hour++) {
                const slotStart = new Date(currentDate);
                slotStart.setHours(hour, 0, 0, 0);

                const slotEnd = new Date(slotStart);
                slotEnd.setMinutes(slotEnd.getMinutes() + duration);

                // Check if slot conflicts with existing events
                const isAvailable = await this.checkAvailability(slotStart, slotEnd, attendees);

                if (isAvailable) {
                    slots.push({
                        start: slotStart,
                        end: slotEnd,
                        available: true,
                    });
                }
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return slots.slice(0, 10); // Return top 10 slots
    }

    private async checkAvailability(
        start: Date,
        end: Date,
        attendees: string[]
    ): Promise<boolean> {
        const events = await this.listEvents({ start, end });

        // Check for conflicts
        for (const event of events) {
            if (event.start < end && event.end > start) {
                // Check if any attendee is in this event
                const hasConflict = event.attendees.some(a =>
                    attendees.includes(a.email)
                );
                if (hasConflict) return false;
            }
        }

        return true;
    }

    async scheduleMeeting(request: SchedulingRequest): Promise<CalendarEvent | null> {
        // Find available slots
        const slots = await this.findAvailableSlots(
            request.attendees,
            request.duration,
            { constraints: request.constraints }
        );

        if (slots.length === 0) {
            this.emit('noSlotsAvailable', request);
            return null;
        }

        // Score slots based on preferences
        const scoredSlots = this.scoreSlots(slots, request.preferredTimes);
        const bestSlot = scoredSlots[0];

        // Create the event
        const event = await this.createEvent({
            title: request.title,
            start: bestSlot.start,
            end: bestSlot.end,
            attendees: request.attendees.map(email => ({
                email,
                status: 'pending',
            })),
            isAllDay: false,
            reminders: [
                { type: 'popup', minutesBefore: 15 },
                { type: 'email', minutesBefore: 60 },
            ],
            status: 'tentative',
            calendarId: 'primary',
        });

        return event;
    }

    private scoreSlots(
        slots: TimeSlot[],
        preferences?: TimePreference[]
    ): TimeSlot[] {
        if (!preferences || preferences.length === 0) {
            return slots;
        }

        const scored = slots.map(slot => {
            let score = 0;

            for (const pref of preferences) {
                const weight = pref.priority === 'high' ? 3 : pref.priority === 'medium' ? 2 : 1;

                if (pref.dayOfWeek !== undefined && slot.start.getDay() === pref.dayOfWeek) {
                    score += weight;
                }

                const hour = slot.start.getHours();
                if (pref.startHour !== undefined && pref.endHour !== undefined) {
                    if (hour >= pref.startHour && hour < pref.endHour) {
                        score += weight;
                    }
                }
            }

            return { slot, score };
        });

        return scored
            .sort((a, b) => b.score - a.score)
            .map(s => s.slot);
    }

    // ========================================================================
    // MEETING NOTES
    // ========================================================================

    async generateMeetingNotes(
        transcript: string,
        eventId?: string
    ): Promise<MeetingNotes> {
        // In production, use LLM to analyze transcript
        const event = eventId ? await this.getEvent(eventId) : undefined;

        const notes: MeetingNotes = {
            meetingId: eventId || `notes_${Date.now()}`,
            title: event?.title || 'Meeting Notes',
            date: event?.start || new Date(),
            attendees: event?.attendees.map(a => a.email) || [],
            summary: await this.summarizeTranscript(transcript),
            keyPoints: await this.extractKeyPoints(transcript),
            actionItems: await this.extractActionItems(transcript),
            decisions: await this.extractDecisions(transcript),
            nextSteps: [],
        };

        this.emit('notesGenerated', notes);
        return notes;
    }

    private async summarizeTranscript(transcript: string): Promise<string> {
        // In production, use LLM
        return `Summary of meeting with ${transcript.split(' ').length} words discussed.`;
    }

    private async extractKeyPoints(transcript: string): Promise<string[]> {
        // In production, use LLM
        return [
            'Key point 1 from discussion',
            'Key point 2 from discussion',
            'Key point 3 from discussion',
        ];
    }

    private async extractActionItems(transcript: string): Promise<ActionItem[]> {
        // In production, use LLM to extract action items
        return [
            {
                task: 'Follow up on discussed items',
                assignee: 'TBD',
                completed: false,
            },
        ];
    }

    private async extractDecisions(transcript: string): Promise<string[]> {
        // In production, use LLM
        return ['Decision made during meeting'];
    }

    // ========================================================================
    // GOOGLE CALENDAR INTEGRATION TEMPLATE
    // ========================================================================

    generateGoogleCalendarIntegration(): string {
        return `// Google Calendar Integration
import { google } from 'googleapis';

const calendar = google.calendar('v3');

// OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function listEvents(accessToken: string, options?: {
    timeMin?: Date;
    timeMax?: Date;
}) {
    oauth2Client.setCredentials({ access_token: accessToken });

    const response = await calendar.events.list({
        auth: oauth2Client,
        calendarId: 'primary',
        timeMin: options?.timeMin?.toISOString(),
        timeMax: options?.timeMax?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
    });

    return response.data.items;
}

export async function createEvent(accessToken: string, event: {
    summary: string;
    start: Date;
    end: Date;
    attendees?: string[];
}) {
    oauth2Client.setCredentials({ access_token: accessToken });

    const response = await calendar.events.insert({
        auth: oauth2Client,
        calendarId: 'primary',
        requestBody: {
            summary: event.summary,
            start: { dateTime: event.start.toISOString() },
            end: { dateTime: event.end.toISOString() },
            attendees: event.attendees?.map(email => ({ email })),
        },
    });

    return response.data;
}

export async function getFreeBusy(accessToken: string, options: {
    timeMin: Date;
    timeMax: Date;
    items: string[];
}) {
    oauth2Client.setCredentials({ access_token: accessToken });

    const response = await calendar.freebusy.query({
        auth: oauth2Client,
        requestBody: {
            timeMin: options.timeMin.toISOString(),
            timeMax: options.timeMax.toISOString(),
            items: options.items.map(id => ({ id })),
        },
    });

    return response.data.calendars;
}
`;
    }
}

export const calendarIntegration = CalendarIntegration.getInstance();
