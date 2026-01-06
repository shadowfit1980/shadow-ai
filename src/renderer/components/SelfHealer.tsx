import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorLog {
    id: string;
    timestamp: Date;
    source: string;
    message: string;
    stack?: string;
    status: 'pending' | 'analyzing' | 'fixing' | 'resolved' | 'failed';
    fixApplied?: string;
}

export default function SelfHealer() {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(true);

    // Simulate error detection
    useEffect(() => {
        if (!isMonitoring) return;

        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const newError: ErrorLog = {
                    id: Math.random().toString(),
                    timestamp: new Date(),
                    source: Math.random() > 0.5 ? 'Runtime' : 'Network',
                    message: Math.random() > 0.5 ? 'Uncaught TypeError: Cannot read property of undefined' : 'NetworkError: Failed to fetch model',
                    status: 'pending'
                };
                setErrors(prev => [newError, ...prev].slice(0, 10));
                autoHeal(newError.id);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isMonitoring]);

    const autoHeal = async (id: string) => {
        // Analyze
        updateStatus(id, 'analyzing');
        await wait(1500);

        // Fixing
        updateStatus(id, 'fixing');
        await wait(2000);

        // Resolved
        setErrors(prev => prev.map(e => {
            if (e.id === id) {
                return {
                    ...e,
                    status: 'resolved',
                    fixApplied: e.message.includes('Type')
                        ? 'Added optional chaining checks (?.)'
                        : 'Retried request with exponential backoff'
                };
            }
            return e;
        }));
    };

    const updateStatus = (id: string, status: ErrorLog['status']) => {
        setErrors(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    };

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>🚑</span>
                        <span>Self-Healing Monitor</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Autonomously detecting and fixing runtime errors
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">
                        {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
                    </span>
                    <button
                        onClick={() => setIsMonitoring(!isMonitoring)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isMonitoring ? 'bg-green-500/20 border-green-500' : 'bg-gray-700 border-gray-600'} border`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isMonitoring ? 'translate-x-6 bg-green-400' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Error Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {errors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 opacity-50">
                            <div className="text-4xl animate-pulse">🛡️</div>
                            <p>System Healthy. Monitoring for issues...</p>
                        </div>
                    ) : (
                        errors.map(error => (
                            <motion.div
                                key={error.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 relative overflow-hidden"
                            >
                                {/* Status Stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${error.status === 'resolved' ? 'bg-green-500' :
                                        error.status === 'failed' ? 'bg-red-500' :
                                            'bg-yellow-500 animate-pulse'
                                    }`} />

                                <div className="pl-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                                                {error.timestamp.toLocaleTimeString()}
                                            </span>
                                            <span className="ml-2 text-xs text-gray-400 uppercase tracking-wide">
                                                {error.source}
                                            </span>
                                        </div>
                                        <StatusBadge status={error.status} />
                                    </div>

                                    <p className="text-red-300 font-mono text-sm mb-3">{error.message}</p>

                                    {error.status === 'resolved' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="bg-green-900/10 border border-green-500/20 rounded p-2 flex items-center space-x-2"
                                        >
                                            <span className="text-green-400">✓</span>
                                            <span className="text-sm text-green-300">
                                                Auto-fixed: <span className="text-white">{error.fixApplied}</span>
                                            </span>
                                        </motion.div>
                                    )}

                                    {['analyzing', 'fixing'].includes(error.status) && (
                                        <div className="text-xs text-yellow-500 flex items-center space-x-2 mt-2">
                                            <span className="animate-spin">⚙️</span>
                                            <span>
                                                {error.status === 'analyzing' ? 'Analyzing stack trace...' : 'Applying fix safely...'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: ErrorLog['status'] }) {
    const colors = {
        pending: 'bg-gray-500 text-white',
        analyzing: 'bg-yellow-500 text-black',
        fixing: 'bg-orange-500 text-white',
        resolved: 'bg-green-500 text-white',
        failed: 'bg-red-500 text-white'
    };

    return (
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${colors[status]}`}>
            {status}
        </span>
    );
}
