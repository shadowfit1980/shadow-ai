/**
 * Workflow Visualization
 * 
 * Real-time visualization of autonomous workflow execution
 */

import React, { useState, useEffect } from 'react';

interface WorkflowPhase {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    startTime?: number;
    endTime?: number;
}

interface WorkflowMessage {
    type: string;
    data: any;
    timestamp: number;
}

interface Props {
    jobId: string;
}

export function WorkflowVisualization({ jobId }: Props) {
    const [phases, setPhases] = useState<WorkflowPhase[]>([
        { name: 'Design & Architecture', status: 'pending', progress: 0 },
        { name: 'Security & Compliance', status: 'pending', progress: 0 },
        { name: 'Implementation', status: 'pending', progress: 0 },
        { name: 'Quality Assurance', status: 'pending', progress: 0 },
        { name: 'Sandbox Validation', status: 'pending', progress: 0 },
        { name: 'Impact Analysis', status: 'pending', progress: 0 },
        { name: 'CI/CD Pipeline', status: 'pending', progress: 0 },
        { name: 'Documentation', status: 'pending', progress: 0 },
        { name: 'Audit & Provenance', status: 'pending', progress: 0 },
    ]);
    const [logs, setLogs] = useState<string[]>([]);
    const [currentAgent, setCurrentAgent] = useState<string>('');
    const [metrics, setMetrics] = useState({
        duration: 0,
        confidence: 0,
        agentsActive: 0,
    });

    useEffect(() => {
        // Listen for real-time updates
        const handleUpdate = (message: WorkflowMessage) => {
            if (message.data.jobId !== jobId) return;

            switch (message.type) {
                case 'workflow:started':
                    addLog('🚀 Workflow started');
                    break;

                case 'workflow:progress':
                    updatePhaseProgress(message.data.phase, message.data.progress);
                    addLog(`📊 ${message.data.phase}: ${message.data.progress.toFixed(0)}%`);
                    break;

                case 'workflow:phase:complete':
                    completePhase(message.data.phase);
                    addLog(`✅ ${message.data.phase} completed`);
                    break;

                case 'workflow:agent:activity':
                    setCurrentAgent(message.data.agentName);
                    addLog(`🤖 ${message.data.agentName}: ${message.data.action}`);
                    break;

                case 'workflow:completed':
                    addLog('🎉 Workflow completed successfully!');
                    break;

                case 'workflow:failed':
                    addLog(`❌ Workflow failed: ${message.data.error}`);
                    break;

                case 'workflow:log':
                    addLog(message.data.message);
                    break;
            }
        };

        window.shadowAPI.autonomous.onUpdate(handleUpdate);

        return () => {
            window.shadowAPI.autonomous.offUpdate(handleUpdate);
        };
    }, [jobId]);

    const updatePhaseProgress = (phaseName: string, progress: number) => {
        setPhases(prevPhases =>
            prevPhases.map(phase => {
                if (phase.name === phaseName) {
                    return {
                        ...phase,
                        status: progress >= 100 ? 'completed' : 'running',
                        progress,
                        startTime: phase.startTime || Date.now(),
                    };
                }
                return phase;
            })
        );
    };

    const completePhase = (phaseName: string) => {
        setPhases(prevPhases =>
            prevPhases.map(phase => {
                if (phase.name === phaseName) {
                    return {
                        ...phase,
                        status: 'completed',
                        progress: 100,
                        endTime: Date.now(),
                    };
                }
                return phase;
            })
        );
    };

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`].slice(-50));
    };

    const getPhaseIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return '✅';
            case 'running':
                return '⏳';
            case 'failed':
                return '❌';
            default:
                return '⏸️';
        }
    };

    const getPhaseColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-600';
            case 'running':
                return 'bg-blue-600';
            case 'failed':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
        }
    };

    const overallProgress = phases.reduce((sum, phase) => sum + phase.progress, 0) / phases.length;

    return (
        <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Workflow Progress</h3>
                    <span className="text-2xl font-bold text-blue-400">
                        {overallProgress.toFixed(0)}%
                    </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                    <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
                {currentAgent && (
                    <p className="text-sm text-gray-400 mt-2">
                        🤖 Active Agent: <span className="text-blue-400 font-semibold">{currentAgent}</span>
                    </p>
                )}
            </div>

            {/* Phase Timeline */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Execution Phases</h3>
                <div className="space-y-3">
                    {phases.map((phase, index) => (
                        <div key={index} className="relative">
                            {/* Phase Header */}
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getPhaseIcon(phase.status)}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-medium text-white">{phase.name}</h4>
                                        <span className="text-sm text-gray-400">
                                            {phase.progress.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${getPhaseColor(phase.status)}`}
                                            style={{ width: `${phase.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < phases.length - 1 && (
                                <div className="ml-4 h-4 w-0.5 bg-gray-700 my-1" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Logs */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Live Activity Log</h3>
                <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm text-gray-300 space-y-1">
                    {logs.length === 0 ? (
                        <p className="text-gray-500">Waiting for activity...</p>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="hover:bg-gray-800 px-2 py-1 rounded">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
                <MetricCard
                    label="Duration"
                    value={`${metrics.duration}s`}
                    icon="⏱️"
                />
                <MetricCard
                    label="Confidence"
                    value={`${metrics.confidence.toFixed(0)}%`}
                    icon="🎯"
                />
                <MetricCard
                    label="Agents Active"
                    value={metrics.agentsActive.toString()}
                    icon="🤖"
                />
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}
