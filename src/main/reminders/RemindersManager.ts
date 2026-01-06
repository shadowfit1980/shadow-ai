/**
 * Reminders Manager - Reminders
 */
import { EventEmitter } from 'events';

export interface Reminder { id: string; title: string; time: Date; repeat?: 'daily' | 'weekly' | 'monthly'; completed: boolean; }

export class RemindersManager extends EventEmitter {
    private static instance: RemindersManager;
    private reminders: Map<string, Reminder> = new Map();
    private constructor() { super(); }
    static getInstance(): RemindersManager { if (!RemindersManager.instance) RemindersManager.instance = new RemindersManager(); return RemindersManager.instance; }

    create(title: string, time: Date, repeat?: Reminder['repeat']): Reminder {
        const reminder: Reminder = { id: `rem_${Date.now()}`, title, time, repeat, completed: false };
        this.reminders.set(reminder.id, reminder);
        this.emit('created', reminder);
        return reminder;
    }

    complete(id: string): boolean { const r = this.reminders.get(id); if (!r) return false; r.completed = true; this.emit('completed', r); return true; }
    getUpcoming(): Reminder[] { const now = new Date(); return Array.from(this.reminders.values()).filter(r => !r.completed && r.time > now); }
    getAll(): Reminder[] { return Array.from(this.reminders.values()); }
    delete(id: string): boolean { return this.reminders.delete(id); }
}
export function getRemindersManager(): RemindersManager { return RemindersManager.getInstance(); }
