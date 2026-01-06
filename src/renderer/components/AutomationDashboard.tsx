/**
 * AutomationDashboard Component
 * 
 * Displays and manages automation tasks from TaskAutomationEngine
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutomationTask {
    id: string;
    name: string;
    description: string;
    type: 'scheduled' | 'triggered' | 'manual';
    enabled: boolean;
    schedule?: {
        type: 'interval' | 'cron' | 'once';
        interval?: number;
    };
    trigger?: {
        event: string;
        filter?: Record<string, any>;
    };
    lastRun?: string;
    nextRun?: string;
    runCount: number;
}

const AutomationDashboard: React.FC = () => {
    const [tasks, setTasks] = useState<AutomationTask[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<AutomationTask | null>(null);
    const [newTask, setNewTask] = useState({
        name: '',
        description: '',
        type: 'manual' as const,
        actions: [{ type: 'send_notification', config: {} }],
    });

    useEffect(() => {
        loadTasks();
        const interval = setInterval(loadTasks, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadTasks = async () => {
        try {
            const result = await (window as any).shadowAPI?.automation?.getTasks?.();
            if (result) {
                setTasks(result);
            }
        } catch (err) {
            console.error('Failed to load tasks:', err);
        }
    };

    const toggleEnabled = async (taskId: string, enabled: boolean) => {
        try {
            await (window as any).shadowAPI?.automation?.setEnabled?.(taskId, enabled);
            setTasks(prev =>
                prev.map(t => t.id === taskId ? { ...t, enabled } : t)
            );
        } catch (err) {
            console.error('Failed to toggle task:', err);
        }
    };

    const executeTask = async (taskId: string) => {
        try {
            const result = await (window as any).shadowAPI?.automation?.executeTask?.(taskId);
            console.log('Task result:', result);
            loadTasks();
        } catch (err) {
            console.error('Failed to execute task:', err);
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            await (window as any).shadowAPI?.automation?.deleteTask?.(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) {
            console.error('Failed to delete task:', err);
        }
    };

    const createTask = async () => {
        try {
            await (window as any).shadowAPI?.automation?.createTask?.(newTask);
            setShowCreateModal(false);
            setNewTask({ name: '', description: '', type: 'manual', actions: [{ type: 'send_notification', config: {} }] });
            loadTasks();
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            scheduled: '⏰',
            triggered: '⚡',
            manual: '🖐️',
        };
        return icons[type] || '📋';
    };

    const formatInterval = (ms?: number) => {
        if (!ms) return 'N/A';
        const hours = Math.floor(ms / 3600000);
        if (hours >= 24) return `${Math.floor(hours / 24)}d`;
        if (hours >= 1) return `${hours}h`;
        return `${Math.floor(ms / 60000)}m`;
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>⚙️ Automation Dashboard</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={styles.createBtn}
                >
                    + Create Task
                </button>
            </div>

            {/* Stats */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{tasks.length}</span>
                    <span style={styles.statLabel}>Total Tasks</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{tasks.filter(t => t.enabled).length}</span>
                    <span style={styles.statLabel}>Active</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{tasks.filter(t => t.type === 'scheduled').length}</span>
                    <span style={styles.statLabel}>Scheduled</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{tasks.reduce((sum, t) => sum + t.runCount, 0)}</span>
                    <span style={styles.statLabel}>Total Runs</span>
                </div>
            </div>

            {/* Task List */}
            <div style={styles.taskList}>
                <AnimatePresence>
                    {tasks.map((task) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                ...styles.taskCard,
                                opacity: task.enabled ? 1 : 0.6,
                            }}
                        >
                            <div style={styles.taskHeader}>
                                <span style={styles.typeIcon}>{getTypeIcon(task.type)}</span>
                                <div style={styles.taskInfo}>
                                    <h3 style={styles.taskName}>{task.name}</h3>
                                    <p style={styles.taskDesc}>{task.description}</p>
                                </div>
                                <div style={styles.taskMeta}>
                                    <span style={styles.taskType}>{task.type}</span>
                                    {task.schedule && (
                                        <span style={styles.interval}>
                                            Every {formatInterval(task.schedule.interval)}
                                        </span>
                                    )}
                                    {task.trigger && (
                                        <span style={styles.trigger}>
                                            On: {task.trigger.event}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={styles.taskStats}>
                                <div style={styles.statItem}>
                                    <span style={styles.statItemLabel}>Runs</span>
                                    <span style={styles.statItemValue}>{task.runCount}</span>
                                </div>
                                <div style={styles.statItem}>
                                    <span style={styles.statItemLabel}>Last Run</span>
                                    <span style={styles.statItemValue}>
                                        {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.taskActions}>
                                <label style={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={task.enabled}
                                        onChange={(e) => toggleEnabled(task.id, e.target.checked)}
                                    />
                                    <span style={styles.toggleSlider}></span>
                                </label>
                                <button
                                    onClick={() => executeTask(task.id)}
                                    style={styles.runBtn}
                                    disabled={!task.enabled}
                                >
                                    ▶ Run
                                </button>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    style={styles.deleteBtn}
                                >
                                    🗑️
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {tasks.length === 0 && (
                    <div style={styles.empty}>
                        <span style={styles.emptyIcon}>🤖</span>
                        <p>No automation tasks yet</p>
                        <button onClick={() => setShowCreateModal(true)} style={styles.emptyBtn}>
                            Create your first task
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <motion.div
                        style={styles.modal}
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h3 style={styles.modalTitle}>Create Automation Task</h3>

                        <div style={styles.formGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={newTask.name}
                                onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                                style={styles.input}
                                placeholder="Task name..."
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={newTask.description}
                                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                style={styles.textarea}
                                placeholder="What does this task do?"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label>Type</label>
                            <select
                                value={newTask.type}
                                onChange={e => setNewTask({ ...newTask, type: e.target.value as any })}
                                style={styles.select}
                            >
                                <option value="manual">Manual</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="triggered">Event Triggered</option>
                            </select>
                        </div>

                        <div style={styles.modalActions}>
                            <button onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={createTask} style={styles.submitBtn}>
                                Create Task
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
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
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
    },
    createBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
        fontWeight: 500,
    },
    statsRow: {
        display: 'flex',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid #30363d',
    },
    statCard: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#161b22',
        borderRadius: '8px',
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
    taskList: {
        flex: 1,
        overflow: 'auto',
        padding: '16px',
    },
    taskCard: {
        backgroundColor: '#161b22',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        border: '1px solid #30363d',
    },
    taskHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '12px',
    },
    typeIcon: {
        fontSize: '24px',
    },
    taskInfo: {
        flex: 1,
    },
    taskName: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
    },
    taskDesc: {
        margin: '4px 0 0',
        fontSize: '14px',
        color: '#8b949e',
    },
    taskMeta: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '4px',
    },
    taskType: {
        backgroundColor: '#21262d',
        color: '#8b949e',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
    },
    interval: {
        fontSize: '12px',
        color: '#58a6ff',
    },
    trigger: {
        fontSize: '12px',
        color: '#f59e0b',
    },
    taskStats: {
        display: 'flex',
        gap: '24px',
        padding: '12px 0',
        borderTop: '1px solid #30363d',
        borderBottom: '1px solid #30363d',
        marginBottom: '12px',
    },
    statItem: {
        display: 'flex',
        flexDirection: 'column',
    },
    statItemLabel: {
        fontSize: '12px',
        color: '#8b949e',
    },
    statItemValue: {
        fontSize: '14px',
        fontWeight: 500,
    },
    taskActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    toggle: {
        position: 'relative',
        display: 'inline-block',
        width: '40px',
        height: '22px',
    },
    toggleSlider: {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#30363d',
        borderRadius: '22px',
        transition: '0.3s',
    },
    runBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    deleteBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        marginLeft: 'auto',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '300px',
        color: '#8b949e',
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '16px',
    },
    emptyBtn: {
        marginTop: '12px',
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#161b22',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90%',
        border: '1px solid #30363d',
    },
    modalTitle: {
        margin: '0 0 20px',
        fontSize: '18px',
    },
    formGroup: {
        marginBottom: '16px',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
    },
    textarea: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
        minHeight: '80px',
        resize: 'vertical',
    },
    select: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '20px',
    },
    cancelBtn: {
        backgroundColor: 'transparent',
        color: '#8b949e',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
    },
    submitBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
    },
};

export default AutomationDashboard;
