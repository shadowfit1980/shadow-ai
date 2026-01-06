import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeploymentTarget {
    id: string;
    name: string;
    icon: string;
    description: string;
    status: 'available' | 'connected' | 'deploying' | 'deployed' | 'error';
    url?: string;
    lastDeploy?: string;
}

interface DeploymentLog {
    id: string;
    timestamp: Date;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

const DEPLOYMENT_TARGETS: DeploymentTarget[] = [
    {
        id: 'vercel',
        name: 'Vercel',
        icon: '▲',
        description: 'Deploy to Vercel for instant global CDN',
        status: 'available'
    },
    {
        id: 'netlify',
        name: 'Netlify',
        icon: '◆',
        description: 'Deploy to Netlify with automatic CI/CD',
        status: 'available'
    },
    {
        id: 'cloudflare',
        name: 'Cloudflare Pages',
        icon: '☁️',
        description: 'Deploy to Cloudflare\'s edge network',
        status: 'available'
    },
    {
        id: 'github',
        name: 'GitHub Pages',
        icon: '🐙',
        description: 'Deploy static sites to GitHub Pages',
        status: 'available'
    },
    {
        id: 'railway',
        name: 'Railway',
        icon: '🚂',
        description: 'Deploy full-stack apps with databases',
        status: 'available'
    },
    {
        id: 'render',
        name: 'Render',
        icon: '🎨',
        description: 'Deploy web services and static sites',
        status: 'available'
    },
    {
        id: 'docker',
        name: 'Docker Hub',
        icon: '🐳',
        description: 'Build and push Docker containers',
        status: 'available'
    },
    {
        id: 'aws',
        name: 'AWS',
        icon: '☁️',
        description: 'Deploy to AWS (S3, EC2, Lambda)',
        status: 'available'
    }
];

export default function DeploymentPanel() {
    const [targets, setTargets] = useState<DeploymentTarget[]>(DEPLOYMENT_TARGETS);
    const [selectedTarget, setSelectedTarget] = useState<DeploymentTarget | null>(null);
    const [logs, setLogs] = useState<DeploymentLog[]>([]);
    const [activeDeployment, setActiveDeployment] = useState<string | null>(null);
    const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
        { key: 'NODE_ENV', value: 'production' },
        { key: 'API_URL', value: 'https://api.example.com' }
    ]);
    const [showEnvModal, setShowEnvModal] = useState(false);

    const addLog = (message: string, type: DeploymentLog['type'] = 'info') => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            message,
            type
        }]);
    };

    const deploy = async (target: DeploymentTarget) => {
        setActiveDeployment(target.id);
        setLogs([]);

        // Update status
        setTargets(prev => prev.map(t =>
            t.id === target.id ? { ...t, status: 'deploying' as const } : t
        ));

        addLog(`Starting deployment to ${target.name}...`);
        await sleep(500);

        addLog('Building project...');
        await sleep(1000);

        addLog('Running npm run build...', 'info');
        await sleep(1500);

        addLog('✓ Build completed successfully', 'success');
        await sleep(500);

        addLog('Uploading assets...');
        await sleep(1000);

        addLog('✓ 42 files uploaded', 'success');
        await sleep(500);

        addLog('Configuring environment variables...');
        await sleep(500);

        addLog('✓ Environment configured', 'success');
        await sleep(500);

        addLog('Invalidating CDN cache...');
        await sleep(800);

        addLog('✓ Cache invalidated', 'success');
        await sleep(300);

        const deployUrl = `https://my-app.${target.id}.app`;
        addLog(`🚀 Deployed successfully to ${deployUrl}`, 'success');

        // Update status
        setTargets(prev => prev.map(t =>
            t.id === target.id ? {
                ...t,
                status: 'deployed' as const,
                url: deployUrl,
                lastDeploy: new Date().toLocaleString()
            } : t
        ));

        setActiveDeployment(null);
    };

    const getStatusColor = (status: DeploymentTarget['status']) => {
        switch (status) {
            case 'deployed': return 'text-green-400';
            case 'deploying': return 'text-yellow-400';
            case 'connected': return 'text-blue-400';
            case 'error': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusBadge = (status: DeploymentTarget['status']) => {
        switch (status) {
            case 'deployed': return '✓ Live';
            case 'deploying': return '⏳ Deploying';
            case 'connected': return '🔗 Connected';
            case 'error': return '❌ Error';
            default: return '○ Available';
        }
    };

    const getLogColor = (type: DeploymentLog['type']) => {
        switch (type) {
            case 'success': return 'text-green-400';
            case 'warning': return 'text-yellow-400';
            case 'error': return 'text-red-400';
            default: return 'text-gray-300';
        }
    };

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>🚀</span>
                        <span>Deployment Center</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        {targets.filter(t => t.status === 'deployed').length} active deployments
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowEnvModal(true)}
                        className="cyber-button-secondary text-sm"
                    >
                        ⚙️ Env Vars
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Targets List */}
                <div className="w-1/2 border-r border-gray-700 overflow-y-auto p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-4">Deployment Targets</h3>
                    <div className="space-y-2">
                        {targets.map(target => (
                            <motion.div
                                key={target.id}
                                layoutId={target.id}
                                onClick={() => setSelectedTarget(target)}
                                className={`p-4 rounded-lg cursor-pointer transition-all border ${selectedTarget?.id === target.id
                                        ? 'bg-gray-800 border-neon-cyan/50'
                                        : target.status === 'deployed'
                                            ? 'bg-green-900/10 border-green-500/20'
                                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{target.icon}</span>
                                        <div>
                                            <h4 className="font-medium text-gray-200">{target.name}</h4>
                                            <p className="text-xs text-gray-500">{target.description}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs ${getStatusColor(target.status)}`}>
                                        {getStatusBadge(target.status)}
                                    </span>
                                </div>

                                {target.status === 'deployed' && target.url && (
                                    <div className="mt-3 flex items-center justify-between">
                                        <a
                                            href={target.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="text-xs text-neon-cyan hover:underline"
                                        >
                                            {target.url}
                                        </a>
                                        <span className="text-[10px] text-gray-500">
                                            {target.lastDeploy}
                                        </span>
                                    </div>
                                )}

                                <div className="mt-3 flex justify-end space-x-2">
                                    {target.status === 'deploying' ? (
                                        <span className="text-xs text-yellow-400 animate-pulse">
                                            Deploying...
                                        </span>
                                    ) : (
                                        <button
                                            onClick={e => { e.stopPropagation(); deploy(target); }}
                                            disabled={activeDeployment !== null}
                                            className="text-xs px-3 py-1 rounded bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
                                        >
                                            {target.status === 'deployed' ? '↻ Redeploy' : '🚀 Deploy'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Logs Panel */}
                <div className="flex-1 overflow-hidden flex flex-col p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-4">Deployment Logs</h3>

                    <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto font-mono text-sm">
                        {logs.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <div className="text-4xl mb-4">📋</div>
                                <p>Select a target and deploy to see logs</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {logs.map(log => (
                                    <div key={log.id} className={`${getLogColor(log.type)}`}>
                                        <span className="text-gray-500">
                                            [{log.timestamp.toLocaleTimeString()}]
                                        </span>{' '}
                                        {log.message}
                                    </div>
                                ))}
                                {activeDeployment && (
                                    <div className="animate-pulse text-gray-400">▌</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Environment Variables Modal */}
            <AnimatePresence>
                {showEnvModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowEnvModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="cyber-panel p-6 w-full max-w-lg"
                        >
                            <h3 className="text-lg font-semibold text-neon-cyan mb-4">
                                Environment Variables
                            </h3>

                            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                {envVars.map((env, i) => (
                                    <div key={i} className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={env.key}
                                            onChange={e => {
                                                const newVars = [...envVars];
                                                newVars[i].key = e.target.value;
                                                setEnvVars(newVars);
                                            }}
                                            placeholder="KEY"
                                            className="cyber-input flex-1 font-mono text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={env.value}
                                            onChange={e => {
                                                const newVars = [...envVars];
                                                newVars[i].value = e.target.value;
                                                setEnvVars(newVars);
                                            }}
                                            placeholder="value"
                                            className="cyber-input flex-1 font-mono text-sm"
                                        />
                                        <button
                                            onClick={() => setEnvVars(envVars.filter((_, idx) => idx !== i))}
                                            className="text-red-400 hover:text-red-300 px-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                                className="w-full py-2 text-sm text-neon-cyan border border-dashed border-gray-700 rounded-lg hover:border-neon-cyan/50"
                            >
                                + Add Variable
                            </button>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button onClick={() => setShowEnvModal(false)} className="cyber-button-secondary">
                                    Cancel
                                </button>
                                <button onClick={() => setShowEnvModal(false)} className="cyber-button">
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
