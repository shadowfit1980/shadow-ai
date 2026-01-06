/**
 * Background Task Panel Component
 * Shows background agent tasks and their progress
 */

import React, { useState, useEffect } from 'react';
import './BackgroundTaskPanel.css';

interface BackgroundTask {
    id: string;
    type: string;
    description: string;
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    startTime: number;
    endTime?: number;
    result?: any;
    error?: string;
}

interface BackgroundTaskPanelProps {
    isMinimized?: boolean;
    onToggle?: () => void;
}

export const BackgroundTaskPanel: React.FC<BackgroundTaskPanelProps> = ({
    isMinimized = false,
    onToggle
}) => {
    const [tasks, setTasks] = useState<BackgroundTask[]>([]);
    const [stats, setStats] = useState({
        queueSize: 0,
        runningTaskCount: 0,
        completedTaskCount: 0,
        idleWorkers: 0,
        busyWorkers: 0,
    });

    useEffect(() => {
        loadTasks();
        loadStats();

        // Poll for updates
        const interval = setInterval(() => {
            loadTasks();
            loadStats();
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const loadTasks = async () => {
        try {
            // Get running and queued tasks
            const running = await window.electronAPI?.invoke('bgagent:running');
            const queued = await window.electronAPI?.invoke('bgagent:queued');
            const completed = await window.electronAPI?.invoke('bgagent:completed', { limit: 10 });

            const allTasks: BackgroundTask[] = [
                ...(running?.tasks || []).map((t: any) => ({ ...t, status: 'running' })),
                ...(queued?.tasks || []).map((t: any) => ({ ...t, status: 'queued' })),
                ...(completed?.tasks || []).slice(0, 5).map((t: any) => ({ ...t })),
            ];

            setTasks(allTasks);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    };

    const loadStats = async () => {
        try {
            const result = await window.electronAPI?.invoke('bgagent:stats');
            if (result?.success) {
                setStats(result.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleCancelTask = async (taskId: string) => {
        try {
            await window.electronAPI?.invoke('bgagent:cancel', { taskId });
            await loadTasks();
        } catch (error) {
            console.error('Failed to cancel task:', error);
        }
    };

    const handleClearCompleted = async () => {
        try {
            await window.electronAPI?.invoke('bgagent:clearCompleted');
            await loadTasks();
        } catch (error) {
            console.error('Failed to clear completed:', error);
        }
    };

    const getStatusIcon = (status: BackgroundTask['status']) => {
        switch (status) {
            case 'running': return '⏳';
            case 'queued': return '📋';
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'cancelled': return '🚫';
            default: return '•';
        }
    };

    const getStatusColor = (status: BackgroundTask['status']) => {
        switch (status) {
            case 'running': return 'var(--accent-color, #58a6ff)';
            case 'queued': return 'var(--text-secondary, #8b949e)';
            case 'completed': return 'var(--success-color, #3fb950)';
            case 'failed': return 'var(--danger-color, #f85149)';
            case 'cancelled': return 'var(--warning-color, #d29922)';
            default: return 'var(--text-secondary, #8b949e)';
        }
    };

    const formatDuration = (startTime: number, endTime?: number) => {
        const end = endTime || Date.now();
        const duration = Math.floor((end - startTime) / 1000);
        if (duration < 60) return `${duration}s`;
        if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
        return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
    };

    const runningCount = tasks.filter(t => t.status === 'running').length;
    const queuedCount = tasks.filter(t => t.status === 'queued').length;

    if (isMinimized) {
        return (
            <div className="bg-task-panel minimized" onClick={onToggle}>
                <span className="mini-indicator">
                    {runningCount > 0 && (
                        <span className="running-badge">{runningCount}</span>
                    )}
                    {queuedCount > 0 && (
                        <span className="queued-badge">+{queuedCount}</span>
                    )}
                    {runningCount === 0 && queuedCount === 0 && (
                        <span className="idle-badge">Idle</span>
                    )}
                </span>
            </div>
        );
    }

    return (
        <div className="bg-task-panel">
            <div className="panel-header">
                <div className="header-left">
                    <h3>🔄 Background Tasks</h3>
                    <span className="task-summary">
                        {runningCount > 0 && `${runningCount} running`}
                        {runningCount > 0 && queuedCount > 0 && ' • '}
                        {queuedCount > 0 && `${queuedCount} queued`}
                        {runningCount === 0 && queuedCount === 0 && 'No active tasks'}
                    </span>
                </div>
                <div className="header-actions">
                    <button
                        className="clear-btn"
                        onClick={handleClearCompleted}
                        title="Clear completed"
                    >
                        Clear
                    </button>
                    {onToggle && (
                        <button className="minimize-btn" onClick={onToggle}>−</button>
                    )}
                </div>
            </div>

            <div className="worker-status">
                <span className="workers-indicator">
                    ⚙️ {stats.busyWorkers} busy / {stats.busyWorkers + stats.idleWorkers} workers
                </span>
            </div>

            <div className="task-list">
                {tasks.length === 0 ? (
                    <div className="empty-state">
                        No background tasks
                    </div>
                ) : (
                    tasks.map(task => (
                        <div
                            key={task.id}
                            className={`task-item ${task.status}`}
                        >
                            <div className="task-status">
                                <span
                                    className="status-icon"
                                    style={{ color: getStatusColor(task.status) }}
                                >
                                    {getStatusIcon(task.status)}
                                </span>
                            </div>

                            <div className="task-content">
                                <div className="task-description">{task.description}</div>
                                <div className="task-meta">
                                    <span className="task-type">{task.type}</span>
                                    <span className="task-duration">
                                        {formatDuration(task.startTime, task.endTime)}
                                    </span>
                                </div>
                                {task.error && (
                                    <div className="task-error">{task.error}</div>
                                )}
                            </div>

                            {task.status === 'running' && (
                                <button
                                    className="cancel-btn"
                                    onClick={() => handleCancelTask(task.id)}
                                    title="Cancel task"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BackgroundTaskPanel;
