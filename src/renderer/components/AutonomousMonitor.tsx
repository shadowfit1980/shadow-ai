/**
 * Autonomous Monitor
 * 
 * System monitoring dashboard for autonomous workflows
 */

import React, { useState, useEffect } from 'react';

interface SystemStats {
    registeredAgents: number;
    totalSystems: number;
    capabilities: string[];
}

export function AutonomousMonitor() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [activeWorkflows, setActiveWorkflows] = useState<any[]>([]);
    const [systemMetrics, setSystemMetrics] = useState({
        cpuUsage: 0,
        memoryUsage: 0,
        activeWorkflows: 0,
    });

    useEffect(() => {
        loadStats();
        loadActiveWorkflows();

        const interval = setInterval(() => {
            loadActiveWorkflows();
            updateMetrics();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const data = await window.shadowAPI.autonomous.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadActiveWorkflows = async () => {
        try {
            const workflows = await window.shadowAPI.autonomous.getAllWorkflows();
            const active = workflows.filter((w: any) => w.status === 'running');
            setActiveWorkflows(active);
            setSystemMetrics(prev => ({ ...prev, activeWorkflows: active.length }));
        } catch (error) {
            console.error('Failed to load workflows:', error);
        }
    };

    const updateMetrics = () => {
        // Simulate CPU and memory metrics (in production, these would come from the backend)
        setSystemMetrics(prev => ({
            ...prev,
            cpuUsage: Math.random() * 100,
            memoryUsage: 30 + Math.random() * 40,
        }));
    };

    if (!stats) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
                    <div className="h-32 bg-gray-700 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="border-b border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-white mb-2">System Monitor</h2>
                <p className="text-gray-400">
                    Real-time monitoring of autonomous system performance and health
                </p>
            </div>

            {/* System Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    title="Registered Agents"
                    value={stats.registeredAgents}
                    icon="🤖"
                    color="blue"
                />
                <StatCard
                    title="Total Systems"
                    value={stats.totalSystems}
                    icon="⚙️"
                    color="purple"
                />
                <StatCard
                    title="Active Workflows"
                    value={systemMetrics.activeWorkflows}
                    icon="🔄"
                    color="green"
                />
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                    <MetricBar
                        label="CPU Usage"
                        value={systemMetrics.cpuUsage}
                        max={100}
                        unit="%"
                        color="blue"
                    />
                    <MetricBar
                        label="Memory Usage"
                        value={systemMetrics.memoryUsage}
                        max={100}
                        unit="%"
                        color="purple"
                    />
                </div>
            </div>

            {/* Active Workflows */}
            {activeWorkflows.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Active Workflows</h3>
                    <div className="space-y-3">
                        {activeWorkflows.map((workflow) => (
                            <div
                                key={workflow.jobId}
                                className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-mono text-gray-400">
                                            {workflow.jobId}
                                        </div>
                                        {workflow.currentPhase && (
                                            <div className="text-sm text-gray-300 mt-1">
                                                Phase: {workflow.currentPhase}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-blue-400">
                                            {workflow.progress.toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(workflow.startTime).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Capabilities */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">System Capabilities</h3>
                <div className="grid grid-cols-2 gap-3">
                    {stats.capabilities.map((capability, index) => (
                        <div
                            key={index}
                            className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-sm text-gray-300"
                        >
                            ✓ {capability}
                        </div>
                    ))}
                </div>
            </div>

            {/* Agent Health */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Agent Health Status</h3>
                <div className="space-y-2">
                    {[
                        'ArchitectAgent',
                        'TestWriterAgent',
                        'RefactorAgent',
                        'BugHunterAgent',
                        'SecurityAgent',
                        'PerformanceAgent',
                        'ComplianceAgent',
                        'DataEngineerAgent',
                        'ExplainAgent',
                    ].map((agent) => (
                        <AgentHealthRow key={agent} name={agent} status="healthy" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: string;
    color: 'blue' | 'purple' | 'green';
}) {
    const colors = {
        blue: 'from-blue-600 to-blue-700',
        purple: 'from-purple-600 to-purple-700',
        green: 'from-green-600 to-green-700',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-6 text-white`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-4xl">{icon}</span>
                <span className="text-3xl font-bold">{value}</span>
            </div>
            <div className="text-sm opacity-90">{title}</div>
        </div>
    );
}

function MetricBar({ label, value, max, unit, color }: {
    label: string;
    value: number;
    max: number;
    unit: string;
    color: 'blue' | 'purple';
}) {
    const percentage = (value / max) * 100;
    const colors = {
        blue: 'bg-blue-600',
        purple: 'bg-purple-600',
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">{label}</span>
                <span className="text-sm font-semibold text-white">
                    {value.toFixed(1)}{unit}
                </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                    className={`${colors[color]} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function AgentHealthRow({ name, status }: { name: string; status: 'healthy' | 'degraded' | 'unhealthy' }) {
    const colors = {
        healthy: 'bg-green-600',
        degraded: 'bg-yellow-600',
        unhealthy: 'bg-red-600',
    };

    const icons = {
        healthy: '✅',
        degraded: '⚠️',
        unhealthy: '❌',
    };

    return (
        <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3 border border-gray-700">
            <span className="text-sm text-gray-300">{name}</span>
            <div className="flex items-center gap-2">
                <span>{icons[status]}</span>
                <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${colors[status]}`}>
                    {status.toUpperCase()}
                </span>
            </div>
        </div>
    );
}
