/**
 * Notification System Generator
 * 
 * Generate notification systems for push, in-app, and email notifications.
 */

import { EventEmitter } from 'events';

interface NotificationConfig {
    types: ('push' | 'inapp' | 'email')[];
}

export class NotificationSystemGenerator extends EventEmitter {
    private static instance: NotificationSystemGenerator;

    private constructor() { super(); }

    static getInstance(): NotificationSystemGenerator {
        if (!NotificationSystemGenerator.instance) {
            NotificationSystemGenerator.instance = new NotificationSystemGenerator();
        }
        return NotificationSystemGenerator.instance;
    }

    generateNotificationService(): string {
        return `interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

class NotificationService {
  private notifications: Map<string, Notification[]> = new Map();
  private subscribers: Map<string, ((n: Notification) => void)[]> = new Map();

  send(userId: string, notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const n: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    
    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.push(n);
    this.notifications.set(userId, userNotifications);
    
    this.subscribers.get(userId)?.forEach(cb => cb(n));
    return n;
  }

  subscribe(userId: string, callback: (n: Notification) => void) {
    const subs = this.subscribers.get(userId) || [];
    subs.push(callback);
    this.subscribers.set(userId, subs);
    return () => {
      const filtered = subs.filter(cb => cb !== callback);
      this.subscribers.set(userId, filtered);
    };
  }

  getUnread(userId: string): Notification[] {
    return (this.notifications.get(userId) || []).filter(n => !n.read);
  }

  markAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId);
    const n = userNotifications?.find(x => x.id === notificationId);
    if (n) n.read = true;
  }
}

export const notificationService = new NotificationService();`;
    }

    generateReactNotificationHook(): string {
        return `import { useState, useEffect, useCallback } from 'react';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export function useNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string, duration = 5000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    notify: {
      info: (msg: string) => addToast('info', msg),
      success: (msg: string) => addToast('success', msg),
      warning: (msg: string) => addToast('warning', msg),
      error: (msg: string) => addToast('error', msg),
    },
    removeToast,
  };
}`;
    }

    generatePushNotificationSetup(): string {
        return `import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const subscriptions = new Map<string, PushSubscription>();

export function subscribe(userId: string, subscription: PushSubscription) {
  subscriptions.set(userId, subscription);
}

export async function sendPush(userId: string, title: string, body: string) {
  const sub = subscriptions.get(userId);
  if (!sub) return;
  
  await webpush.sendNotification(sub as any, JSON.stringify({ title, body }));
}`;
    }

    generateToastComponent(): string {
        return `import React from 'react';

const styles = {
  container: { position: 'fixed', top: 16, right: 16, zIndex: 9999 },
  toast: { padding: '12px 16px', borderRadius: 8, marginBottom: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  info: { background: '#3b82f6', color: 'white' },
  success: { background: '#10b981', color: 'white' },
  warning: { background: '#f59e0b', color: 'white' },
  error: { background: '#ef4444', color: 'white' },
};

export function ToastContainer({ toasts, onRemove }: { toasts: any[]; onRemove: (id: string) => void }) {
  return (
    <div style={styles.container as any}>
      {toasts.map(toast => (
        <div key={toast.id} style={{ ...styles.toast, ...styles[toast.type as keyof typeof styles] } as any} onClick={() => onRemove(toast.id)}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}`;
    }
}

export const notificationSystemGenerator = NotificationSystemGenerator.getInstance();
