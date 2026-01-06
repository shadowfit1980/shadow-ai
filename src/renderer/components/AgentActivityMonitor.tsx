import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AgentStatus {
    action: string;
    status: 'idle' | 'thinking' | 'processing' | 'success' | 'error';
}

export default function AgentActivityMonitor() {
    const [agentStatus, setAgentStatus] = useState<AgentStatus>({
        action: 'Ready',
        status: 'idle',
    });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Listen for agent activity events
        const handleAgentActivity = (event: CustomEvent) => {
            setAgentStatus(event.detail);
            setIsVisible(true);

            // Auto-hide after success/error
            if (event.detail.status === 'success' || event.detail.status === 'error') {
                setTimeout(() => setIsVisible(false), 3000);
            }
        };

        window.addEventListener('agent-activity' as any, handleAgentActivity);
        return () => window.removeEventListener('agent-activity' as any, handleAgentActivity);
    }, []);

    const getStatusColor = () => {
        switch (agentStatus.status) {
            case 'thinking': return 'bg-blue-500';
            case 'processing': return 'bg-yellow-500';
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusIcon = () => {
        switch (agentStatus.status) {
            case 'thinking': return '🤔';
            case 'processing': return '⚙️';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '💤';
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="fixed top-20 right-6 z-40"
            >
                <div className="cyber-panel p-3 min-w-[250px]">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className={`w-3 h-3 ${getStatusColor()} rounded-full`}>
                                {agentStatus.status === 'processing' && (
                                    <motion.div
                                        className={`absolute inset-0 ${getStatusColor()} rounded-full`}
                                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="text-xs text-gray-400">Agent Status</div>
                            <div className="text-sm font-semibold text-neon-cyan flex items-center space-x-1">
                                <span>{getStatusIcon()}</span>
                                <span>{agentStatus.action}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Helper function to dispatch agent activity
export const emitAgentActivity = (action: string, status: AgentStatus['status']) => {
    window.dispatchEvent(
        new CustomEvent('agent-activity', {
            detail: { action, status },
        })
    );
};
