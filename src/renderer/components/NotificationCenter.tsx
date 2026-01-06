/**
 * NotificationCenter Component
 * 
 * Displays and manages notifications from the NotificationService
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'security' | 'update';
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    timestamp: Date;
    read: boolean;
    dismissed: boolean;
    actions?: Array<{ label: string; action: string }>;
}

const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const result = await (window as any).shadowAPI?.notification?.getAll?.();
            if (result) {
                setNotifications(result.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp),
                })));
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await (window as any).shadowAPI?.notification?.markRead?.(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const dismiss = async (id: string) => {
        try {
            await (window as any).shadowAPI?.notification?.dismiss?.(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to dismiss:', err);
        }
    };

    const dismissAll = async () => {
        try {
            await (window as any).shadowAPI?.notification?.dismissAll?.();
            setNotifications([]);
        } catch (err) {
            console.error('Failed to dismiss all:', err);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'urgent') return n.priority === 'urgent' || n.priority === 'high';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    const getTypeIcon = (type: Notification['type']) => {
        const icons: Record<string, string> = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            task: '📋',
            security: '🔒',
            update: '🔄',
        };
        return icons[type] || '📌';
    };

    const getPriorityColor = (priority: Notification['priority']) => {
        const colors: Record<string, string> = {
            low: '#6b7280',
            normal: '#3b82f6',
            high: '#f59e0b',
            urgent: '#ef4444',
        };
        return colors[priority] || '#6b7280';
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <h2 style={styles.title}>🔔 Notifications</h2>
                    {unreadCount > 0 && (
                        <span style={styles.badge}>{unreadCount}</span>
                    )}
                </div>
                <div style={styles.actions}>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        style={styles.select}
                    >
                        <option value="all">All</option>
                        <option value="unread">Unread</option>
                        <option value="urgent">Urgent</option>
                    </select>
                    <button onClick={dismissAll} style={styles.clearBtn}>
                        Clear All
                    </button>
                </div>
            </div>

            {/* Notification List */}
            <div style={styles.list}>
                <AnimatePresence>
                    {filteredNotifications.length === 0 ? (
                        <div style={styles.empty}>
                            <span style={styles.emptyIcon}>🔕</span>
                            <p>No notifications</p>
                        </div>
                    ) : (
                        filteredNotifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{
                                    ...styles.notification,
                                    borderLeftColor: getPriorityColor(notif.priority),
                                    opacity: notif.read ? 0.7 : 1,
                                }}
                                onClick={() => !notif.read && markAsRead(notif.id)}
                            >
                                <div style={styles.notifHeader}>
                                    <span style={styles.icon}>{getTypeIcon(notif.type)}</span>
                                    <span style={styles.notifTitle}>{notif.title}</span>
                                    <span style={styles.time}>{formatTime(notif.timestamp)}</span>
                                </div>
                                <p style={styles.message}>{notif.message}</p>

                                {notif.actions && notif.actions.length > 0 && (
                                    <div style={styles.actionBtns}>
                                        {notif.actions.map((action, i) => (
                                            <button
                                                key={i}
                                                style={styles.actionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Action:', action.action);
                                                }}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <button
                                    style={styles.dismissBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        dismiss(notif.id);
                                    }}
                                >
                                    ✕
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Stats */}
            <div style={styles.stats}>
                <div style={styles.stat}>
                    <span style={styles.statValue}>{notifications.length}</span>
                    <span style={styles.statLabel}>Total</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statValue}>{unreadCount}</span>
                    <span style={styles.statLabel}>Unread</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statValue}>
                        {notifications.filter(n => n.priority === 'urgent').length}
                    </span>
                    <span style={styles.statLabel}>Urgent</span>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #30363d',
        backgroundColor: '#161b22',
    },
    titleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
    },
    badge: {
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    select: {
        backgroundColor: '#21262d',
        color: '#e6edf3',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
    },
    clearBtn: {
        backgroundColor: 'transparent',
        color: '#8b949e',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
    },
    list: {
        flex: 1,
        overflow: 'auto',
        padding: '12px',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: '#8b949e',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '12px',
    },
    notification: {
        position: 'relative',
        backgroundColor: '#161b22',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '8px',
        borderLeft: '3px solid',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    notifHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '6px',
    },
    icon: {
        fontSize: '16px',
    },
    notifTitle: {
        fontWeight: 600,
        flex: 1,
    },
    time: {
        fontSize: '12px',
        color: '#8b949e',
    },
    message: {
        margin: '0 0 8px 24px',
        fontSize: '14px',
        color: '#8b949e',
        lineHeight: 1.5,
    },
    actionBtns: {
        display: 'flex',
        gap: '8px',
        marginLeft: '24px',
    },
    actionBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 12px',
        fontSize: '12px',
        cursor: 'pointer',
    },
    dismissBtn: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        backgroundColor: 'transparent',
        color: '#8b949e',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '4px',
    },
    stats: {
        display: 'flex',
        justifyContent: 'space-around',
        padding: '16px',
        borderTop: '1px solid #30363d',
        backgroundColor: '#161b22',
    },
    stat: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    statValue: {
        fontSize: '24px',
        fontWeight: 600,
        color: '#58a6ff',
    },
    statLabel: {
        fontSize: '12px',
        color: '#8b949e',
    },
};

export default NotificationCenter;
