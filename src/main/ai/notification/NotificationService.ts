/**
 * Notification System
 * 
 * Centralized notification management with:
 * - Multiple notification types
 * - Priority levels
 * - Action buttons
 * - Persistence
 */

import { EventEmitter } from 'events';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    source: string;
    timestamp: Date;
    read: boolean;
    dismissed: boolean;
    actions?: NotificationAction[];
    metadata?: Record<string, any>;
    expiresAt?: Date;
}

export type NotificationType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'task'
    | 'security'
    | 'update';

export interface NotificationAction {
    id: string;
    label: string;
    action: string;
    primary?: boolean;
}

/**
 * NotificationService manages application notifications
 */
export class NotificationService extends EventEmitter {
    private static instance: NotificationService;
    private notifications: Map<string, Notification> = new Map();
    private maxNotifications: number = 100;

    private constructor() {
        super();
    }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Send a notification
     */
    notify(params: {
        type: NotificationType;
        title: string;
        message: string;
        priority?: Notification['priority'];
        source?: string;
        actions?: NotificationAction[];
        metadata?: Record<string, any>;
        expiresIn?: number; // ms
    }): Notification {
        const notification: Notification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            type: params.type,
            title: params.title,
            message: params.message,
            priority: params.priority || 'medium',
            source: params.source || 'system',
            timestamp: new Date(),
            read: false,
            dismissed: false,
            actions: params.actions,
            metadata: params.metadata,
            expiresAt: params.expiresIn ? new Date(Date.now() + params.expiresIn) : undefined,
        };

        this.notifications.set(notification.id, notification);
        this.emit('notification:created', notification);

        // Trim old notifications
        if (this.notifications.size > this.maxNotifications) {
            const oldest = [...this.notifications.values()]
                .filter(n => n.dismissed)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
            if (oldest) this.notifications.delete(oldest.id);
        }

        return notification;
    }

    /**
     * Quick notification helpers
     */
    info(title: string, message: string, source?: string): Notification {
        return this.notify({ type: 'info', title, message, source });
    }

    success(title: string, message: string, source?: string): Notification {
        return this.notify({ type: 'success', title, message, source });
    }

    warning(title: string, message: string, source?: string): Notification {
        return this.notify({ type: 'warning', title, message, priority: 'high', source });
    }

    error(title: string, message: string, source?: string): Notification {
        return this.notify({ type: 'error', title, message, priority: 'urgent', source });
    }

    /**
     * Mark as read
     */
    markRead(id: string): boolean {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.read = true;
            this.emit('notification:read', notification);
            return true;
        }
        return false;
    }

    /**
     * Mark all as read
     */
    markAllRead(): number {
        let count = 0;
        for (const notification of this.notifications.values()) {
            if (!notification.read) {
                notification.read = true;
                count++;
            }
        }
        this.emit('notifications:allRead');
        return count;
    }

    /**
     * Dismiss a notification
     */
    dismiss(id: string): boolean {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.dismissed = true;
            this.emit('notification:dismissed', notification);
            return true;
        }
        return false;
    }

    /**
     * Get all notifications
     */
    getAll(includeExpired: boolean = false): Notification[] {
        const now = new Date();
        return [...this.notifications.values()]
            .filter(n => !n.dismissed)
            .filter(n => includeExpired || !n.expiresAt || n.expiresAt > now)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Get unread count
     */
    getUnreadCount(): number {
        return [...this.notifications.values()]
            .filter(n => !n.read && !n.dismissed)
            .length;
    }

    /**
     * Get notifications by type
     */
    getByType(type: NotificationType): Notification[] {
        return [...this.notifications.values()]
            .filter(n => n.type === type && !n.dismissed);
    }

    /**
     * Clear all dismissed
     */
    clearDismissed(): number {
        let count = 0;
        for (const [id, notification] of this.notifications) {
            if (notification.dismissed) {
                this.notifications.delete(id);
                count++;
            }
        }
        return count;
    }

    /**
     * Execute action
     */
    executeAction(notificationId: string, actionId: string): void {
        const notification = this.notifications.get(notificationId);
        if (notification) {
            const action = notification.actions?.find(a => a.id === actionId);
            if (action) {
                this.emit('notification:action', { notification, action });
            }
        }
    }
}

export default NotificationService;
