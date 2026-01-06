/**
 * Notification Center
 * Unified notification system for all app events
 */

import { EventEmitter } from 'events';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    actions?: NotificationAction[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    timestamp: number;
    read: boolean;
    dismissed: boolean;
    source?: string;
    data?: Record<string, any>;
}

export type NotificationType =
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'task'
    | 'build'
    | 'deploy'
    | 'review';

export interface NotificationAction {
    id: string;
    label: string;
    primary?: boolean;
}

export interface NotificationPreferences {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    showPreviews: boolean;
    groupByType: boolean;
    maxVisible: number;
}

/**
 * NotificationCenter
 * Manage all app notifications
 */
export class NotificationCenter extends EventEmitter {
    private static instance: NotificationCenter;
    private notifications: Map<string, Notification> = new Map();
    private preferences: NotificationPreferences = {
        enabled: true,
        sound: true,
        desktop: true,
        showPreviews: true,
        groupByType: true,
        maxVisible: 5,
    };

    private constructor() {
        super();
    }

    static getInstance(): NotificationCenter {
        if (!NotificationCenter.instance) {
            NotificationCenter.instance = new NotificationCenter();
        }
        return NotificationCenter.instance;
    }

    /**
     * Show a notification
     */
    notify(options: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>): Notification {
        const notification: Notification = {
            ...options,
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            timestamp: Date.now(),
            read: false,
            dismissed: false,
        };

        this.notifications.set(notification.id, notification);
        this.emit('notification', notification);

        // Show desktop notification if enabled
        if (this.preferences.desktop && this.preferences.enabled) {
            this.showDesktopNotification(notification);
        }

        return notification;
    }

    /**
     * Show success notification
     */
    success(title: string, message: string, data?: Record<string, any>): Notification {
        return this.notify({ type: 'success', title, message, priority: 'normal', data });
    }

    /**
     * Show error notification
     */
    error(title: string, message: string, data?: Record<string, any>): Notification {
        return this.notify({ type: 'error', title, message, priority: 'high', data });
    }

    /**
     * Show warning notification
     */
    warning(title: string, message: string, data?: Record<string, any>): Notification {
        return this.notify({ type: 'warning', title, message, priority: 'normal', data });
    }

    /**
     * Show info notification
     */
    info(title: string, message: string, data?: Record<string, any>): Notification {
        return this.notify({ type: 'info', title, message, priority: 'low', data });
    }

    /**
     * Show desktop notification
     */
    private async showDesktopNotification(notification: Notification): Promise<void> {
        try {
            const { Notification: ElectronNotification } = await import('electron');

            if (ElectronNotification.isSupported()) {
                const desktopNotif = new ElectronNotification({
                    title: notification.title,
                    body: notification.message,
                    silent: !this.preferences.sound,
                });

                desktopNotif.on('click', () => {
                    this.emit('notificationClicked', notification);
                });

                desktopNotif.show();
            }
        } catch {
            // Desktop notifications not available
        }
    }

    /**
     * Mark notification as read
     */
    markAsRead(id: string): boolean {
        const notification = this.notifications.get(id);
        if (!notification) return false;

        notification.read = true;
        this.emit('notificationRead', notification);
        return true;
    }

    /**
     * Mark all as read
     */
    markAllAsRead(): number {
        let count = 0;
        for (const notification of this.notifications.values()) {
            if (!notification.read) {
                notification.read = true;
                count++;
            }
        }
        this.emit('allRead', { count });
        return count;
    }

    /**
     * Dismiss notification
     */
    dismiss(id: string): boolean {
        const notification = this.notifications.get(id);
        if (!notification) return false;

        notification.dismissed = true;
        this.emit('notificationDismissed', notification);
        return true;
    }

    /**
     * Dismiss all
     */
    dismissAll(): number {
        let count = 0;
        for (const notification of this.notifications.values()) {
            if (!notification.dismissed) {
                notification.dismissed = true;
                count++;
            }
        }
        this.emit('allDismissed', { count });
        return count;
    }

    /**
     * Get notification by ID
     */
    get(id: string): Notification | null {
        return this.notifications.get(id) || null;
    }

    /**
     * Get all notifications
     */
    getAll(includeDissmissed = false): Notification[] {
        return Array.from(this.notifications.values())
            .filter(n => includeDissmissed || !n.dismissed)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get unread count
     */
    getUnreadCount(): number {
        return Array.from(this.notifications.values())
            .filter(n => !n.read && !n.dismissed)
            .length;
    }

    /**
     * Get by type
     */
    getByType(type: NotificationType): Notification[] {
        return Array.from(this.notifications.values())
            .filter(n => n.type === type && !n.dismissed);
    }

    /**
     * Get by priority
     */
    getByPriority(priority: Notification['priority']): Notification[] {
        return Array.from(this.notifications.values())
            .filter(n => n.priority === priority && !n.dismissed);
    }

    /**
     * Clear all
     */
    clearAll(): void {
        this.notifications.clear();
        this.emit('cleared');
    }

    /**
     * Set preferences
     */
    setPreferences(prefs: Partial<NotificationPreferences>): void {
        this.preferences = { ...this.preferences, ...prefs };
        this.emit('preferencesChanged', this.preferences);
    }

    /**
     * Get preferences
     */
    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    /**
     * Handle action
     */
    handleAction(notificationId: string, actionId: string): void {
        const notification = this.notifications.get(notificationId);
        if (!notification) return;

        this.emit('actionClicked', { notification, actionId });
    }
}

// Singleton getter
export function getNotificationCenter(): NotificationCenter {
    return NotificationCenter.getInstance();
}
