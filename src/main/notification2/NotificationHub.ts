/**
 * Notification Hub - Advanced notifications
 */
import { EventEmitter } from 'events';

export interface Notification { id: string; title: string; body: string; type: 'info' | 'success' | 'warning' | 'error'; read: boolean; createdAt: number; actions?: { label: string; action: string }[]; }

export class NotificationHub extends EventEmitter {
    private static instance: NotificationHub;
    private notifications: Map<string, Notification> = new Map();
    private constructor() { super(); }
    static getInstance(): NotificationHub { if (!NotificationHub.instance) NotificationHub.instance = new NotificationHub(); return NotificationHub.instance; }

    send(title: string, body: string, type: Notification['type'] = 'info', actions?: Notification['actions']): Notification {
        const notif: Notification = { id: `notif_${Date.now()}`, title, body, type, read: false, createdAt: Date.now(), actions };
        this.notifications.set(notif.id, notif);
        this.emit('notification', notif);
        return notif;
    }

    info(title: string, body: string): Notification { return this.send(title, body, 'info'); }
    success(title: string, body: string): Notification { return this.send(title, body, 'success'); }
    warning(title: string, body: string): Notification { return this.send(title, body, 'warning'); }
    error(title: string, body: string): Notification { return this.send(title, body, 'error'); }

    markRead(id: string): boolean { const n = this.notifications.get(id); if (!n) return false; n.read = true; return true; }
    markAllRead(): void { this.notifications.forEach(n => n.read = true); }
    getUnread(): Notification[] { return Array.from(this.notifications.values()).filter(n => !n.read); }
    getAll(): Notification[] { return Array.from(this.notifications.values()); }
    clear(): void { this.notifications.clear(); }
}

export function getNotificationHub(): NotificationHub { return NotificationHub.getInstance(); }
