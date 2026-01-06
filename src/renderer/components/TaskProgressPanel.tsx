import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskStep {
    id: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: number;
    endTime?: number;
    output?: string;
    error?: string;
    agentId?: string;
    agentName?: string;
}

interface TaskProgress {
    taskId: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
    steps: TaskStep[];
    currentStepIndex: number;
    startTime: number;
    endTime?: number;
    estimatedDuration?: number;
    result?: any;
    error?: string;
}

interface StreamChunk {
    id: string;
    type: 'thought' | 'action' | 'result' | 'error' | 'progress';
    agentName: string;
    content: string;
    timestamp: number;
}

interface TaskProgressPanelProps {
    isVisible?: boolean;
    onClose?: () => void;
}

export default function TaskProgressPanel({ isVisible = true, onClose }: TaskProgressPanelProps) {
    const [currentTask, setCurrentTask] = useState<TaskProgress | null>(null);
    const [streamChunks, setStreamChunks] = useState<StreamChunk[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const streamRef = useRef<HTMLDivElement>(null);

    // Mock task for demo
    useEffect(() => {
        const mockTask: TaskProgress = {
            taskId: 'task_1',
            description: 'Creating authentication system with JWT tokens',
            status: 'running',
            steps: [
                { id: '1', description: 'Analyze requirements', status: 'completed', agentName: 'Architect Agent' },
                { id: '2', description: 'Design authentication flow', status: 'completed', agentName: 'Architect Agent' },
                { id: '3', description: 'Generate auth middleware', status: 'running', agentName: 'Coder Agent' },
                { id: '4', description: 'Create JWT utilities', status: 'pending', agentName: 'Coder Agent' },
                { id: '5', description: 'Write unit tests', status: 'pending', agentName: 'Test Agent' },
                { id: '6', description: 'Security audit', status: 'pending', agentName: 'Security Agent' },
            ],
            currentStepIndex: 2,
            startTime: Date.now() - 45000,
            estimatedDuration: 120000
        };
        setCurrentTask(mockTask);

        // Mock streaming
        const mockChunks: StreamChunk[] = [
            { id: '1', type: 'thought', agentName: 'Architect Agent', content: 'Analyzing authentication requirements...', timestamp: Date.now() - 40000 },
            { id: '2', type: 'action', agentName: 'Architect Agent', content: 'Identified: JWT-based stateless auth with refresh tokens', timestamp: Date.now() - 35000 },
            { id: '3', type: 'result', agentName: 'Architect Agent', content: 'Architecture design complete: middleware pattern with token validation', timestamp: Date.now() - 30000 },
            { id: '4', type: 'thought', agentName: 'Coder Agent', content: 'Generating authentication middleware with Express.js patterns...', timestamp: Date.now() - 25000 },
            { id: '5', type: 'progress', agentName: 'Coder Agent', content: 'Generated authMiddleware.ts with bearer token validation', timestamp: Date.now() - 20000 },
        ];
        setStreamChunks(mockChunks);
    }, []);

    // Auto-scroll stream
    useEffect(() => {
        if (autoScroll && streamRef.current) {
            streamRef.current.scrollTop = streamRef.current.scrollHeight;
        }
    }, [streamChunks, autoScroll]);

    const getProgress = useCallback(() => {
        if (!currentTask) return 0;
        const completed = currentTask.steps.filter(s => s.status === 'completed').length;
        return Math.round((completed / currentTask.steps.length) * 100);
    }, [currentTask]);

    const getElapsedTime = useCallback(() => {
        if (!currentTask) return '0s';
        const elapsed = Date.now() - currentTask.startTime;
        const seconds = Math.floor(elapsed / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    }, [currentTask]);

    const getEstimatedRemaining = useCallback(() => {
        if (!currentTask?.estimatedDuration) return 'Calculating...';
        const elapsed = Date.now() - currentTask.startTime;
        const remaining = currentTask.estimatedDuration - elapsed;
        if (remaining <= 0) return 'Almost done...';
        const seconds = Math.floor(remaining / 1000);
        if (seconds < 60) return `~${seconds}s remaining`;
        return `~${Math.ceil(seconds / 60)}m remaining`;
    }, [currentTask]);

    const getStepStatusIcon = (status: TaskStep['status']) => {
        switch (status) {
            case 'completed': return '✅';
            case 'running': return '⏳';
            case 'failed': return '❌';
            case 'skipped': return '⏭️';
            default: return '⬜';
        }
    };

    const getChunkTypeColor = (type: StreamChunk['type']) => {
        switch (type) {
            case 'thought': return 'text-blue-400';
            case 'action': return 'text-yellow-400';
            case 'result': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'progress': return 'text-neon-cyan';
        }
    };

    const getChunkTypeIcon = (type: StreamChunk['type']) => {
        switch (type) {
            case 'thought': return '💭';
            case 'action': return '⚡';
            case 'result': return '✨';
            case 'error': return '❌';
            case 'progress': return '📊';
        }
    };

    const handlePause = () => {
        if (currentTask) {
            setCurrentTask({ ...currentTask, status: currentTask.status === 'paused' ? 'running' : 'paused' });
        }
    };

    const handleCancel = () => {
        if (currentTask) {
            setCurrentTask({ ...currentTask, status: 'cancelled' });
        }
    };

    if (!isVisible || !currentTask) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 cyber-panel ${isMinimized ? 'w-80' : 'w-[500px]'
                } max-h-[600px] flex flex-col`}
        >
            {/* Header */}
            <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentTask.status === 'running' ? 'bg-green-400 animate-pulse' :
                            currentTask.status === 'paused' ? 'bg-yellow-400' :
                                currentTask.status === 'completed' ? 'bg-green-400' :
                                    currentTask.status === 'failed' ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                    <span className="text-sm font-semibold text-neon-cyan">Task Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-gray-500 hover:text-white text-xs"
                    >
                        {isMinimized ? '⬜' : '➖'}
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white text-xs"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Task Info */}
                    <div className="p-3 border-b border-gray-800">
                        <p className="text-sm text-white mb-2 line-clamp-2">{currentTask.description}</p>

                        {/* Progress Bar */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Progress: {getProgress()}%</span>
                                <span>{getElapsedTime()} elapsed</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-neon-cyan to-green-400"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getProgress()}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">{getEstimatedRemaining()}</p>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-2">
                            <button
                                onClick={handlePause}
                                className={`flex-1 py-1.5 text-xs rounded ${currentTask.status === 'paused'
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {currentTask.status === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-1.5 text-xs rounded bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                                ⏹️ Cancel
                            </button>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="p-3 border-b border-gray-800 max-h-48 overflow-y-auto">
                        <div className="text-xs text-gray-500 mb-2">Steps ({currentTask.currentStepIndex + 1}/{currentTask.steps.length})</div>
                        <div className="space-y-1">
                            {currentTask.steps.map((step, index) => (
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-2 p-2 rounded text-xs ${step.status === 'running' ? 'bg-neon-cyan/10 border border-neon-cyan/30' :
                                            step.status === 'completed' ? 'bg-green-500/10' :
                                                step.status === 'failed' ? 'bg-red-500/10' : 'bg-gray-900/50'
                                        }`}
                                >
                                    <span>{getStepStatusIcon(step.status)}</span>
                                    <span className={`flex-1 ${step.status === 'completed' ? 'text-gray-400' :
                                            step.status === 'running' ? 'text-white' : 'text-gray-500'
                                        }`}>
                                        {step.description}
                                    </span>
                                    {step.agentName && (
                                        <span className="text-gray-600">{step.agentName.split(' ')[0]}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stream Output */}
                    <div className="flex-1 min-h-0">
                        <div className="flex items-center justify-between p-2 border-b border-gray-800">
                            <span className="text-xs text-gray-500">Live Stream</span>
                            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoScroll}
                                    onChange={(e) => setAutoScroll(e.target.checked)}
                                    className="w-3 h-3"
                                />
                                Auto-scroll
                            </label>
                        </div>
                        <div
                            ref={streamRef}
                            className="p-3 space-y-2 overflow-y-auto max-h-40 scrollbar-thin"
                        >
                            <AnimatePresence>
                                {streamChunks.map((chunk) => (
                                    <motion.div
                                        key={chunk.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-xs"
                                    >
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span>{getChunkTypeIcon(chunk.type)}</span>
                                            <span className="text-gray-500">{chunk.agentName}</span>
                                            <span className={`text-xs ${getChunkTypeColor(chunk.type)}`}>
                                                [{chunk.type}]
                                            </span>
                                        </div>
                                        <p className="text-gray-300 pl-6">{chunk.content}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}

            {/* Minimized View */}
            {isMinimized && (
                <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-neon-cyan"
                                style={{ width: `${getProgress()}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-400">{getProgress()}%</span>
                    </div>
                    <span className="text-xs text-gray-500">{getElapsedTime()}</span>
                </div>
            )}
        </motion.div>
    );
}
