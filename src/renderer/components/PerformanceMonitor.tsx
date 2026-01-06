import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    status: 'good' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
    history: number[];
}

interface ResourceUsage {
    cpu: number;
    memory: number;
    disk: number;
    network: { upload: number; download: number };
}

export default function PerformanceMonitor() {
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([
        { name: 'Response Time', value: 145, unit: 'ms', status: 'good', trend: 'down', history: [180, 165, 155, 150, 145] },
        { name: 'Tokens/sec', value: 42, unit: 't/s', status: 'good', trend: 'up', history: [35, 38, 40, 41, 42] },
        { name: 'Cache Hit Rate', value: 87, unit: '%', status: 'good', trend: 'up', history: [80, 82, 84, 85, 87] },
        { name: 'Error Rate', value: 0.3, unit: '%', status: 'good', trend: 'down', history: [0.8, 0.6, 0.5, 0.4, 0.3] },
        { name: 'Active Sessions', value: 3, unit: '', status: 'good', trend: 'stable', history: [3, 3, 3, 3, 3] },
        { name: 'Queue Length', value: 0, unit: '', status: 'good', trend: 'stable', history: [1, 0, 0, 0, 0] }
    ]);

    const [resources, setResources] = useState<ResourceUsage>({
        cpu: 23,
        memory: 45,
        disk: 62,
        network: { upload: 1.2, download: 3.8 }
    });

    const [modelStats, setModelStats] = useState({
        totalRequests: 1247,
        avgLatency: 145,
        successRate: 99.7,
        activeModel: 'Gemini 2.0 Flash'
    });

    const [isLive, setIsLive] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isLive) {
            intervalRef.current = setInterval(() => {
                // Simulate metric updates
                setMetrics(prev => prev.map(m => ({
                    ...m,
                    value: m.value + (Math.random() - 0.5) * (m.value * 0.1),
                    history: [...m.history.slice(1), m.value]
                })));

                setResources(prev => ({
                    cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
                    memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
                    disk: prev.disk,
                    network: {
                        upload: Math.max(0, prev.network.upload + (Math.random() - 0.5) * 0.5),
                        download: Math.max(0, prev.network.download + (Math.random() - 0.5) * 0.5)
                    }
                }));

                setModelStats(prev => ({
                    ...prev,
                    totalRequests: prev.totalRequests + Math.floor(Math.random() * 3)
                }));
            }, 2000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isLive]);

    const getStatusColor = (status: PerformanceMetric['status']) => {
        switch (status) {
            case 'good': return 'text-green-400';
            case 'warning': return 'text-yellow-400';
            case 'critical': return 'text-red-400';
        }
    };

    const getTrendIcon = (trend: PerformanceMetric['trend']) => {
        switch (trend) {
            case 'up': return '↑';
            case 'down': return '↓';
            case 'stable': return '→';
        }
    };

    const getResourceColor = (value: number) => {
        if (value < 50) return 'bg-green-500';
        if (value < 75) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="cyber-panel h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>📊</span>
                        <span>Performance Monitor</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Real-time system metrics</p>
                </div>
                <div className="flex items-center space-x-3">
                    <span className={`text-xs flex items-center space-x-1 ${isLive ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        <span>{isLive ? 'Live' : 'Paused'}</span>
                    </span>
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className="cyber-button-secondary text-xs"
                    >
                        {isLive ? '⏸ Pause' : '▶ Resume'}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Model Stats */}
                <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-neon-cyan/10 to-purple-500/10 border border-neon-cyan/30">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-300">Active Model</h3>
                        <span className="text-neon-cyan font-medium">{modelStats.activeModel}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{modelStats.totalRequests.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Total Requests</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{modelStats.avgLatency}ms</p>
                            <p className="text-xs text-gray-500">Avg Latency</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{modelStats.successRate}%</p>
                            <p className="text-xs text-gray-500">Success Rate</p>
                        </div>
                    </div>
                </div>

                {/* Resource Usage */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Resource Usage</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {/* CPU */}
                        <div className="p-3 rounded-lg bg-gray-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">CPU</span>
                                <span className="text-sm font-medium text-white">{resources.cpu.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${getResourceColor(resources.cpu)}`}
                                    animate={{ width: `${resources.cpu}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Memory */}
                        <div className="p-3 rounded-lg bg-gray-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Memory</span>
                                <span className="text-sm font-medium text-white">{resources.memory.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${getResourceColor(resources.memory)}`}
                                    animate={{ width: `${resources.memory}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Disk */}
                        <div className="p-3 rounded-lg bg-gray-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Disk</span>
                                <span className="text-sm font-medium text-white">{resources.disk.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${getResourceColor(resources.disk)}`}
                                    animate={{ width: `${resources.disk}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>

                        {/* Network */}
                        <div className="p-3 rounded-lg bg-gray-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Network</span>
                                <span className="text-xs text-gray-500">
                                    ↑{resources.network.upload.toFixed(1)} ↓{resources.network.download.toFixed(1)} MB/s
                                </span>
                            </div>
                            <div className="flex space-x-1">
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-blue-500"
                                        animate={{ width: `${Math.min(resources.network.upload * 10, 100)}%` }}
                                    />
                                </div>
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-green-500"
                                        animate={{ width: `${Math.min(resources.network.download * 10, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {metrics.map(metric => (
                            <div key={metric.name} className="p-3 rounded-lg bg-gray-800/50">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">{metric.name}</span>
                                    <span className={`text-xs ${getStatusColor(metric.status)}`}>
                                        {getTrendIcon(metric.trend)}
                                    </span>
                                </div>
                                <p className="text-xl font-bold text-white">
                                    {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                                    <span className="text-xs text-gray-500 ml-1">{metric.unit}</span>
                                </p>
                                {/* Mini sparkline */}
                                <div className="flex items-end h-4 space-x-0.5 mt-2">
                                    {metric.history.map((v, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-neon-cyan/40 rounded-sm"
                                            style={{ height: `${(v / Math.max(...metric.history)) * 100}%` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </span>
                <div className="flex space-x-2">
                    <button className="cyber-button-secondary text-xs">
                        📥 Export
                    </button>
                    <button className="cyber-button-secondary text-xs">
                        ⚙️ Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
