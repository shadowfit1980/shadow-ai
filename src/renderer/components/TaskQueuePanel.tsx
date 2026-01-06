import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
    id: string;
    type: string;
    command: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    priority: string;
    progress?: number;
    createdAt: string;
    error?: string;
}

interface QueueStats {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
}

export default function TaskQueuePanel() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<QueueStats>({
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        total: 0,
    });
    const [isExpanded, setIsExpanded] = useState(false);

    // Poll for task updates
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const allTasks = await window.shadowAPI.getAllTasks();
                const queueStats = await window.shadowAPI.getQueueStats();
                setTasks(allTasks || []);
                setStats(queueStats || stats);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            }
        };

        fetchTasks();
        const interval = setInterval(fetchTasks, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, []);

    const createDemoTask = async () => {
        try {
            const demoTypes = ['build', 'analyze', 'deploy'];
            const randomType = demoTypes[Math.floor(Math.random() * demoTypes.length)];

            await window.shadowAPI.queueTask(
                randomType,
                { demo: true, description: `Demo ${randomType} task` },
                'normal'
            );

            console.log('✅ Demo task created');
        } catch (error) {
            console.error('Failed to create demo task:', error);
        }
    };

    const cancelTask = async (taskId: string) => {
        try {
            await window.shadowAPI.cancelTask(taskId);
        } catch (error) {
            console.error('Failed to cancel task:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'running':
                return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            case 'failed':
                return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'cancelled':
                return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
            default:
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical':
                return 'text-red-400';
            case 'high':
                return 'text-orange-400';
            case 'normal':
                return 'text-blue-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isExpanded ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="cyber-panel w-96 h-[500px] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">📋</span>
                                <span className="text-sm font-semibold text-neon-cyan">Task Queue</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={createDemoTask}
                                    className="cyber-button-secondary text-xs px-2 py-1"
                                    title="Create a demo task to test the queue"
                                >
                                    🧪 Test
                                </button>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="text-gray-400 hover:text-neon-cyan transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="p-3 border-b border-gray-800 grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                                <div className="text-yellow-400 font-semibold">{stats.pending}</div>
                                <div className="text-gray-500">Pending</div>
                            </div>
                            <div className="text-center">
                                <div className="text-blue-400 font-semibold">{stats.running}</div>
                                <div className="text-gray-500">Running</div>
                            </div>
                            <div className="text-center">
                                <div className="text-green-400 font-semibold">{stats.completed}</div>
                                <div className="text-gray-500">Done</div>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
                            {tasks.length === 0 ? (
                                <div className="text-center text-gray-500 text-xs mt-4">
                                    No tasks in queue
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-gray-900/50 border border-gray-800 rounded p-2 space-y-1"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs font-semibold text-white">
                                                        {task.command}
                                                    </span>
                                                    <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {task.type}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                                                    {task.status}
                                                </span>
                                                {(task.status === 'pending' || task.status === 'running') && (
                                                    <button
                                                        onClick={() => cancelTask(task.id)}
                                                        className="text-xs text-red-400 hover:text-red-300 px-1"
                                                        title="Cancel"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {task.status === 'running' && task.progress !== undefined && (
                                            <div className="w-full bg-gray-800 rounded-full h-1 mt-1">
                                                <div
                                                    className="bg-neon-cyan h-1 rounded-full transition-all"
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                        )}

                                        {/* Error */}
                                        {task.error && (
                                            <div className="text-xs text-red-400 bg-red-500/10 p-1 rounded mt-1">
                                                {task.error}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setIsExpanded(true)}
                        className="cyber-panel p-3 flex items-center space-x-2 hover:border-neon-cyan/50 transition-all"
                    >
                        <span className="text-lg">⚙️</span>
                        <div>
                            <div className="text-sm text-neon-cyan font-semibold">Queue</div>
                            <div className="text-xs text-gray-500">
                                {stats.running} running · {stats.pending} pending
                            </div>
                        </div>
                        {stats.running > 0 && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
