/**
 * Workflow Results
 * 
 * Comprehensive display of autonomous workflow results
 */

import React, { useState, useEffect } from 'react';

interface Props {
    jobId: string;
    onClose: () => void;
}

export function WorkflowResults({ jobId, onClose }: Props) {
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        loadResults();
    }, [jobId]);

    const loadResults = async () => {
        try {
            const data = await window.shadowAPI.autonomous.getResults(jobId);
            setResults(data);
        } catch (error) {
            console.error('Failed to load results:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                    <p className="text-white mt-4">Loading results...</p>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-8">
                    <p className="text-white">No results found</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'summary', label: 'Summary', icon: '📊' },
        { id: 'architecture', label: 'Architecture', icon: '🏗️' },
        { id: 'code', label: 'Code & Tests', icon: '💻' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'performance', label: 'Performance', icon: '⚡' },
        { id: 'documentation', label: 'Documentation', icon: '📚' },
        { id: 'provenance', label: 'Audit Trail', icon: '📝' },
    ];

    const exportResults = () => {
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `workflow-${jobId}-results.json`;
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-800 p-6 border-b border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Workflow Results</h2>
                            <p className="text-sm text-gray-400 font-mono">{jobId}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={exportResults}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                📥 Export
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 flex items-center gap-4">
                        <StatusBadge status={results.status} />
                        {results.readyForProduction && (
                            <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                                ✅ Production Ready
                            </span>
                        )}
                        <span className="text-gray-400 text-sm">
                            Confidence: {(results.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="text-gray-400 text-sm">
                            Duration: {(results.totalDuration / 1000).toFixed(1)}s
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-gray-800 border-b border-gray-700 px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'text-blue-400 border-b-2 border-blue-400'
                                        : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'summary' && <SummaryTab results={results} />}
                    {activeTab === 'architecture' && <ArchitectureTab data={results.architecture} />}
                    {activeTab === 'code' && <CodeTab code={results.code} tests={results.tests} />}
                    {activeTab === 'security' && <SecurityTab data={results.security} />}
                    {activeTab === 'performance' && <PerformanceTab data={results.performance} />}
                    {activeTab === 'documentation' && <DocumentationTab data={results.documentation} />}
                    {activeTab === 'provenance' && <ProvenanceTab data={results.provenance} />}
                </div>
            </div>
        </div>
    );
}

function SummaryTab({ results }: { results: any }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <MetricCard title="Overall Confidence" value={`${(results.confidence * 100).toFixed(1)}%`} />
                <MetricCard title="Duration" value={`${(results.totalDuration / 1000).toFixed(1)}s`} />
                <MetricCard title="Status" value={results.status} />
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Execution Summary</h3>
                <div className="space-y-2 text-sm">
                    <ResultRow label="Architecture" value={results.architecture ? '✅ Generated' : '❌ N/A'} />
                    <ResultRow label="Data Model" value={results.dataModel ? '✅ Generated' : '❌ N/A'} />
                    <ResultRow label="Code Generated" value={`${results.code?.length || 0} characters`} />
                    <ResultRow label="Tests" value={`${results.tests?.length || 0} suites`} />
                    <ResultRow label="Security Findings" value={results.security?.findings?.length || 0} />
                    <ResultRow label="Sandbox Status" value={results.sandboxResults?.status || 'N/A'} />
                    <ResultRow label="CI/CD Stages" value={results.cicdResults?.stages?.length || 0} />
                </div>
            </div>
        </div>
    );
}

function ArchitectureTab({ data }: { data: any }) {
    if (!data) return <EmptyState message="No architecture data available" />;

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

function CodeTab({ code, tests }: { code: string; tests: any }) {
    return (
        <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Generated Code</h3>
                <pre className="bg-gray-900 p-4 rounded text-sm text-green-400 overflow-auto max-h-96">
                    {code}
                </pre>
            </div>
            {tests && (
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Tests</h3>
                    <pre className="bg-gray-900 p-4 rounded text-sm text-blue-400 overflow-auto max-h-96">
                        {JSON.stringify(tests, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

function SecurityTab({ data }: { data: any }) {
    if (!data) return <EmptyState message="No security data available" />;

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Security Analysis</h3>
            <pre className="text-sm text-gray-300 overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

function PerformanceTab({ data }: { data: any }) {
    if (!data) return <EmptyState message="No performance data available" />;

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

function DocumentationTab({ data }: { data: any }) {
    if (!data) return <EmptyState message="No documentation available" />;

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

function ProvenanceTab({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <EmptyState message="No audit trail available" />;

    return (
        <div className="space-y-3">
            {data.map((record, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Decision #{index + 1}</div>
                    <pre className="text-sm text-gray-300 mt-2">
                        {JSON.stringify(record, null, 2)}
                    </pre>
                </div>
            ))}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        success: 'bg-green-600',
        failed: 'bg-red-600',
        pending_approval: 'bg-yellow-600',
    };

    return (
        <span className={`px-3 py-1 text-sm font-semibold text-white rounded ${colors[status as keyof typeof colors] || 'bg-gray-600'}`}>
            {status.toUpperCase()}
        </span>
    );
}

function MetricCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">{title}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}

function ResultRow({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-gray-700">
            <span className="text-gray-400">{label}</span>
            <span className="text-white font-medium">{value}</span>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center h-64 text-gray-500">
            {message}
        </div>
    );
}
