/**
 * Reasoning Chain Visualizer
 * 
 * Real-time visualization of agent reasoning for transparency and debugging.
 * Shows thought steps, confidence levels, and decision branches.
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ReasoningStep {
    id: string;
    type: 'observation' | 'thought' | 'action' | 'result';
    agent: string;
    content: string;
    confidence: number;
    timestamp: Date;
    children?: ReasoningStep[];
    status: 'pending' | 'active' | 'completed' | 'failed';
    duration?: number;
}

interface ReasoningChain {
    id: string;
    taskId: string;
    taskDescription: string;
    steps: ReasoningStep[];
    status: 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    totalSteps: number;
    currentStepIndex: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ReasoningChainVisualizer() {
    const [chains, setChains] = useState<ReasoningChain[]>([]);
    const [selectedChain, setSelectedChain] = useState<ReasoningChain | null>(null);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
    const [isLive, setIsLive] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    // Simulate incoming reasoning data
    useEffect(() => {
        // In production, this would connect to IPC/WebSocket
        const mockChain = generateMockChain();
        setChains([mockChain]);
        setSelectedChain(mockChain);
    }, []);

    const toggleStep = useCallback((stepId: string) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepId)) {
                next.delete(stepId);
            } else {
                next.add(stepId);
            }
            return next;
        });
    }, []);

    const getStepIcon = (type: ReasoningStep['type']) => {
        switch (type) {
            case 'observation': return '👁️';
            case 'thought': return '💭';
            case 'action': return '⚡';
            case 'result': return '✅';
            default: return '•';
        }
    };

    const getStatusColor = (status: ReasoningStep['status']) => {
        switch (status) {
            case 'pending': return 'text-gray-400';
            case 'active': return 'text-cyan-400 animate-pulse';
            case 'completed': return 'text-green-400';
            case 'failed': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getConfidenceBar = (confidence: number) => {
        const width = Math.round(confidence * 100);
        const color = confidence > 0.8 ? 'bg-green-500' : confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500';
        return (
            <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all`} style={{ width: `${width}%` }} />
            </div>
        );
    };

    const renderStep = (step: ReasoningStep, depth: number = 0) => {
        const isExpanded = expandedSteps.has(step.id);
        const hasChildren = step.children && step.children.length > 0;

        return (
            <div key={step.id} className="relative">
                {/* Connection line */}
                {depth > 0 && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-px bg-gray-700"
                        style={{ left: `${depth * 24 - 12}px` }}
                    />
                )}

                <div
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer
                        hover:bg-gray-800/50 transition-colors
                        ${step.status === 'active' ? 'bg-gray-800/30 border-l-2 border-cyan-500' : ''}`}
                    style={{ paddingLeft: `${depth * 24 + 12}px` }}
                    onClick={() => hasChildren && toggleStep(step.id)}
                >
                    {/* Expand toggle */}
                    {hasChildren && (
                        <span className="text-gray-500 w-4">
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    )}
                    {!hasChildren && <span className="w-4" />}

                    {/* Icon */}
                    <span className="text-lg">{getStepIcon(step.type)}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium uppercase ${getStatusColor(step.status)}`}>
                                {step.type}
                            </span>
                            <span className="text-xs text-gray-500">{step.agent}</span>
                            {step.duration && (
                                <span className="text-xs text-gray-600">{step.duration}ms</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-300 mt-1 break-words">{step.content}</p>

                        {/* Confidence bar */}
                        <div className="flex items-center gap-2 mt-2">
                            {getConfidenceBar(step.confidence)}
                            <span className="text-xs text-gray-500">
                                {(step.confidence * 100).toFixed(0)}% confidence
                            </span>
                        </div>
                    </div>

                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full ${step.status === 'completed' ? 'bg-green-500' :
                            step.status === 'active' ? 'bg-cyan-500 animate-pulse' :
                                step.status === 'failed' ? 'bg-red-500' : 'bg-gray-600'
                        }`} />
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="ml-4">
                        {step.children!.map(child => renderStep(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const filteredChains = chains.filter(c => {
        if (filter === 'active') return c.status === 'running';
        if (filter === 'completed') return c.status === 'completed' || c.status === 'failed';
        return true;
    });

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🧠</span>
                        <h2 className="text-lg font-semibold text-white">Reasoning Chain</h2>
                        {isLive && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                Live
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter */}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"
                        >
                            <option value="all">All Chains</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                        </select>

                        {/* Live toggle */}
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isLive
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                                }`}
                        >
                            {isLive ? '⏸ Pause' : '▶ Resume'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Chain list */}
                <div className="w-64 border-r border-gray-800 overflow-y-auto">
                    <div className="p-2">
                        <h3 className="text-xs font-medium text-gray-500 uppercase px-2 py-1">
                            Reasoning Chains ({filteredChains.length})
                        </h3>
                        {filteredChains.map(chain => (
                            <button
                                key={chain.id}
                                onClick={() => setSelectedChain(chain)}
                                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${selectedChain?.id === chain.id
                                        ? 'bg-cyan-500/20 border border-cyan-500/30'
                                        : 'hover:bg-gray-800/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium ${chain.status === 'running' ? 'text-cyan-400' :
                                            chain.status === 'completed' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {chain.status === 'running' ? '● Running' :
                                            chain.status === 'completed' ? '✓ Done' : '✗ Failed'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {chain.currentStepIndex}/{chain.totalSteps}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 mt-1 truncate">
                                    {chain.taskDescription}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {new Date(chain.startTime).toLocaleTimeString()}
                                </p>
                            </button>
                        ))}

                        {filteredChains.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-2xl mb-2">🔍</p>
                                <p className="text-sm">No reasoning chains</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chain detail */}
                <div className="flex-1 overflow-y-auto">
                    {selectedChain ? (
                        <div className="p-4">
                            {/* Chain header */}
                            <div className="mb-4 pb-4 border-b border-gray-800">
                                <h3 className="text-lg font-semibold text-white">
                                    {selectedChain.taskDescription}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                    <span>Task: {selectedChain.taskId}</span>
                                    <span>Steps: {selectedChain.steps.length}</span>
                                    {selectedChain.endTime && (
                                        <span>
                                            Duration: {Math.round((new Date(selectedChain.endTime).getTime() - new Date(selectedChain.startTime).getTime()) / 1000)}s
                                        </span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3">
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${selectedChain.status === 'completed' ? 'bg-green-500' :
                                                    selectedChain.status === 'failed' ? 'bg-red-500' : 'bg-cyan-500'
                                                }`}
                                            style={{
                                                width: `${(selectedChain.currentStepIndex / selectedChain.totalSteps) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="space-y-1">
                                {selectedChain.steps.map(step => renderStep(step))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <p className="text-4xl mb-3">🧠</p>
                                <p className="font-medium">Select a reasoning chain</p>
                                <p className="text-sm mt-1">View the agent's thought process</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MOCK DATA
// ============================================================================

function generateMockChain(): ReasoningChain {
    const steps: ReasoningStep[] = [
        {
            id: 'step-1',
            type: 'observation',
            agent: 'nexus',
            content: 'User requested to build a REST API for user management with authentication',
            confidence: 0.95,
            timestamp: new Date(),
            status: 'completed',
            duration: 50
        },
        {
            id: 'step-2',
            type: 'thought',
            agent: 'nexus',
            content: 'This requires: database schema, authentication middleware, CRUD endpoints, and validation',
            confidence: 0.88,
            timestamp: new Date(),
            status: 'completed',
            duration: 120,
            children: [
                {
                    id: 'step-2a',
                    type: 'thought',
                    agent: 'atlas',
                    content: 'Recommending Express.js with JWT authentication for scalability',
                    confidence: 0.92,
                    timestamp: new Date(),
                    status: 'completed',
                    duration: 80
                },
                {
                    id: 'step-2b',
                    type: 'thought',
                    agent: 'schema',
                    content: 'PostgreSQL with User, Session, and Role tables',
                    confidence: 0.85,
                    timestamp: new Date(),
                    status: 'completed',
                    duration: 100
                }
            ]
        },
        {
            id: 'step-3',
            type: 'action',
            agent: 'server',
            content: 'Generating Express.js server with authentication routes...',
            confidence: 0.90,
            timestamp: new Date(),
            status: 'active',
            duration: 250
        },
        {
            id: 'step-4',
            type: 'action',
            agent: 'tester',
            content: 'Writing unit tests for authentication flow',
            confidence: 0.75,
            timestamp: new Date(),
            status: 'pending'
        },
        {
            id: 'step-5',
            type: 'result',
            agent: 'nexus',
            content: 'API implementation complete with tests',
            confidence: 0.85,
            timestamp: new Date(),
            status: 'pending'
        }
    ];

    return {
        id: 'chain-1',
        taskId: 'task-12345',
        taskDescription: 'Build REST API with authentication',
        steps,
        status: 'running',
        startTime: new Date(Date.now() - 5000),
        totalSteps: 5,
        currentStepIndex: 3
    };
}
