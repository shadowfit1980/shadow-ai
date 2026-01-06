import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UESEStatus {
    isRunning: boolean;
    activeSessions: number;
    totalExecutions: number;
    subsystems: Record<string, boolean>;
}

interface HardwareMetrics {
    cpuUsage: number[];
    gpuUsage: number;
    memoryUsedMB: number;
    temperature: number;
    batteryLevel: number;
    thermalThrottling: boolean;
}

interface SecurityResult {
    score: number;
    vulnerabilities: { id: string; type: string; severity: string }[];
    attacksBlocked: number;
}

type Tab = 'overview' | 'execution' | 'devices' | 'security' | 'chaos';

export default function UESEDashboard() {
    const [tab, setTab] = useState<Tab>('overview');
    const [status, setStatus] = useState<UESEStatus | null>(null);
    const [metrics, setMetrics] = useState<HardwareMetrics | null>(null);
    const [code, setCode] = useState('console.log("Hello UESE!");');
    const [output, setOutput] = useState<string[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [deviceProfile, setDeviceProfile] = useState('macbook-pro-m3');
    const [networkProfile, setNetworkProfile] = useState('wifi-fast');
    const [securityResult, setSecurityResult] = useState<SecurityResult | null>(null);

    const TABS: { id: Tab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'execution', label: 'Execution', icon: '▶️' },
        { id: 'devices', label: 'Devices', icon: '📱' },
        { id: 'security', label: 'Security', icon: '🛡️' },
        { id: 'chaos', label: 'Chaos', icon: '🌪️' }
    ];

    const DEVICE_PROFILES = [
        { id: 'iphone-15-pro', name: 'iPhone 15 Pro', icon: '📱' },
        { id: 'pixel-8-pro', name: 'Pixel 8 Pro', icon: '📱' },
        { id: 'macbook-pro-m3', name: 'MacBook Pro M3', icon: '💻' },
        { id: 'gaming-desktop', name: 'Gaming Desktop', icon: '🖥️' },
        { id: 'cloud-server', name: 'Cloud Server', icon: '☁️' }
    ];

    const NETWORK_PROFILES = [
        { id: 'fiber', name: 'Fiber (1Gbps)', icon: '⚡' },
        { id: 'wifi-fast', name: 'Fast WiFi', icon: '📶' },
        { id: 'wifi-slow', name: 'Slow WiFi', icon: '📶' },
        { id: '5g', name: '5G Mobile', icon: '📡' },
        { id: '4g-lte', name: '4G LTE', icon: '📱' },
        { id: '3g', name: '3G Slow', icon: '🐌' },
        { id: 'offline', name: 'Offline', icon: '❌' }
    ];

    // Simulated metrics for demo
    useEffect(() => {
        setStatus({
            isRunning: true,
            activeSessions: 1,
            totalExecutions: 42,
            subsystems: {
                core: true, os: true, browser: true, hardware: true,
                network: true, security: true, users: true, learning: true
            }
        });
        setMetrics({
            cpuUsage: [25, 30, 15, 40, 35, 20, 45, 30],
            gpuUsage: 15,
            memoryUsedMB: 4096,
            temperature: 42,
            batteryLevel: 85,
            thermalThrottling: false
        });
    }, []);

    const handleExecute = useCallback(async () => {
        setIsExecuting(true);
        setOutput([]);

        // Simulate execution
        await new Promise(r => setTimeout(r, 500));
        setOutput([
            `[UESE] Executing JavaScript...`,
            `[UESE] Device: ${deviceProfile}`,
            `[UESE] Network: ${networkProfile}`,
            `Hello UESE!`,
            `[UESE] ✓ Execution completed in 42ms`
        ]);

        setIsExecuting(false);
    }, [deviceProfile, networkProfile]);

    const handleSecurityScan = useCallback(async () => {
        setSecurityResult(null);
        await new Promise(r => setTimeout(r, 1500));
        setSecurityResult({
            score: 85,
            vulnerabilities: [
                { id: '1', type: 'XSS', severity: 'medium' },
                { id: '2', type: 'CSRF', severity: 'low' }
            ],
            attacksBlocked: 11
        });
    }, []);

    const handleChaos = useCallback((type: string) => {
        setOutput(prev => [...prev, `[CHAOS] Injecting ${type}...`]);
        setTimeout(() => {
            setOutput(prev => [...prev, `[CHAOS] ${type} recovered`]);
        }, 3000);
    }, []);

    return (
        <div className="h-full flex flex-col bg-gray-950 text-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌌</span>
                    <div>
                        <h1 className="text-lg font-bold text-neon-cyan">UESE</h1>
                        <p className="text-xs text-gray-500">Universal Embedded Super Emulator</p>
                    </div>
                </div>
                {status && (
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-400">
                            {status.activeSessions} sessions • {status.totalExecutions} executions
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-2 text-xs transition-colors flex items-center justify-center gap-1 ${tab === t.id
                                ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                    {tab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* Subsystems */}
                            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                <h3 className="text-xs text-gray-400 mb-2">Subsystems</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {status && Object.entries(status.subsystems).map(([name, active]) => (
                                        <div key={name} className="flex items-center gap-1 text-xs">
                                            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="text-gray-300 capitalize">{name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hardware Metrics */}
                            {metrics && (
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <h3 className="text-xs text-gray-400 mb-2">Hardware</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">CPU</p>
                                            <p className="text-lg font-mono text-neon-cyan">
                                                {Math.round(metrics.cpuUsage.reduce((a, b) => a + b) / metrics.cpuUsage.length)}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Memory</p>
                                            <p className="text-lg font-mono text-purple-400">
                                                {(metrics.memoryUsedMB / 1024).toFixed(1)}GB
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Temp</p>
                                            <p className="text-lg font-mono text-orange-400">
                                                {metrics.temperature}°C
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'execution' && (
                        <motion.div
                            key="execution"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm text-gray-300 focus:border-neon-cyan/50 focus:outline-none"
                                placeholder="Enter code to execute..."
                            />
                            <button
                                onClick={handleExecute}
                                disabled={isExecuting}
                                className="w-full py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 disabled:opacity-50"
                            >
                                {isExecuting ? '⏳ Executing...' : '▶️ Execute in UESE'}
                            </button>
                            {output.length > 0 && (
                                <div className="p-3 bg-gray-900 rounded-lg font-mono text-xs space-y-1">
                                    {output.map((line, i) => (
                                        <div key={i} className={line.includes('✓') ? 'text-green-400' : 'text-gray-400'}>
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'devices' && (
                        <motion.div
                            key="devices"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div>
                                <h3 className="text-xs text-gray-400 mb-2">Device Profile</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {DEVICE_PROFILES.map(d => (
                                        <button
                                            key={d.id}
                                            onClick={() => setDeviceProfile(d.id)}
                                            className={`p-2 rounded-lg text-left text-sm flex items-center gap-2 ${deviceProfile === d.id
                                                    ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan'
                                                    : 'bg-gray-900 border border-gray-700 text-gray-300'
                                                }`}
                                        >
                                            <span>{d.icon}</span>
                                            <span>{d.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs text-gray-400 mb-2">Network Condition</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {NETWORK_PROFILES.map(n => (
                                        <button
                                            key={n.id}
                                            onClick={() => setNetworkProfile(n.id)}
                                            className={`p-2 rounded-lg text-left text-sm flex items-center gap-2 ${networkProfile === n.id
                                                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                                                    : 'bg-gray-900 border border-gray-700 text-gray-300'
                                                }`}
                                        >
                                            <span>{n.icon}</span>
                                            <span>{n.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'security' && (
                        <motion.div
                            key="security"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <button
                                onClick={handleSecurityScan}
                                className="w-full py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                            >
                                🛡️ Run Security Scan
                            </button>
                            {securityResult && (
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Security Score</span>
                                        <span className={`text-2xl font-bold ${securityResult.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {securityResult.score}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Attacks Blocked</span>
                                        <span className="text-green-400">{securityResult.attacksBlocked}/13</span>
                                    </div>
                                    {securityResult.vulnerabilities.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Vulnerabilities Found</p>
                                            {securityResult.vulnerabilities.map(v => (
                                                <div key={v.id} className="text-xs text-yellow-400">
                                                    ⚠️ {v.type} ({v.severity})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {tab === 'chaos' && (
                        <motion.div
                            key="chaos"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <p className="text-xs text-gray-500">Inject failure conditions:</p>
                            {[
                                { id: 'network_failure', label: '🌐 Network Outage', color: 'red' },
                                { id: 'latency_spike', label: '⏱️ Latency Spike', color: 'orange' },
                                { id: 'cpu_spike', label: '🔥 CPU Overload', color: 'red' },
                                { id: 'memory_exhaustion', label: '💾 Memory Exhaustion', color: 'purple' },
                                { id: 'disk_full', label: '💿 Disk Full', color: 'yellow' }
                            ].map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleChaos(c.id)}
                                    className={`w-full py-2 bg-${c.color}-500/10 border border-${c.color}-500/30 text-${c.color}-400 rounded-lg hover:bg-${c.color}-500/20 text-sm`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
