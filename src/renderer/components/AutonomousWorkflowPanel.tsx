/**
 * Autonomous Workflow Panel
 * 
 * Main interface for submitting and managing autonomous workflows
 */

import React, { useState, useEffect } from 'react';

interface AutonomousRequest {
    description: string;
    requirements: string[];
    constraints?: string[];
    targetAudience?: string[];
    complianceNeeds?: string[];
    riskTolerance: 'low' | 'medium' | 'high';
    autonomyLevel: 'autonomous' | 'assist' | 'audit';
}

interface WorkflowStatus {
    jobId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    currentPhase?: string;
    progress: number;
    startTime: number;
    endTime?: number;
    error?: string;
}

export function AutonomousWorkflowPanel() {
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState<string[]>(['']);
    const [constraints, setConstraints] = useState<string[]>([]);
    const [complianceNeeds, setComplianceNeeds] = useState<string[]>([]);
    const [targetAudience, setTargetAudience] = useState<string[]>(['developer']);
    const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
    const [autonomyLevel, setAutonomyLevel] = useState<'autonomous' | 'assist' | 'audit'>('assist');
    const [activeWorkflows, setActiveWorkflows] = useState<WorkflowStatus[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults, setShowResults] = useState<string | null>(null);

    useEffect(() => {
        loadActiveWorkflows();
    }, []);

    const loadActiveWorkflows = async () => {
        try {
            const workflows = await window.shadowAPI.autonomous.getAllWorkflows();
            setActiveWorkflows(workflows);
        } catch (error) {
            console.error('Failed to load workflows:', error);
        }
    };

    const addRequirement = () => {
        setRequirements([...requirements, '']);
    };

    const updateRequirement = (index: number, value: string) => {
        const newReqs = [...requirements];
        newReqs[index] = value;
        setRequirements(newReqs);
    };

    const removeRequirement = (index: number) => {
        setRequirements(requirements.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!description || requirements.filter(r => r.trim()).length === 0) {
            alert('Please provide a description and at least one requirement');
            return;
        }

        setIsSubmitting(true);

        try {
            const request: AutonomousRequest = {
                description,
                requirements: requirements.filter(r => r.trim()),
                constraints: constraints.filter(c => c.trim()),
                targetAudience: targetAudience.filter(t => t.trim()),
                complianceNeeds: complianceNeeds.filter(c => c.trim()),
                riskTolerance,
                autonomyLevel
            };

            const result = await window.shadowAPI.autonomous.submit(request);
            console.log('Workflow submitted:', result);

            // Reload workflows
            await loadActiveWorkflows();

            // Reset form
            setDescription('');
            setRequirements(['']);
            setConstraints([]);
            setComplianceNeeds([]);

        } catch (error) {
            console.error('Failed to submit workflow:', error);
            alert('Failed to submit workflow: ' + (error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelWorkflow = async (jobId: string) => {
        try {
            await window.shadowAPI.autonomous.cancel(jobId);
            await loadActiveWorkflows();
        } catch (error) {
            console.error('Failed to cancel workflow:', error);
        }
    };

    const viewResults = (jobId: string) => {
        setShowResults(jobId);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="border-b border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-white mb-2">Autonomous Workflows</h2>
                <p className="text-gray-400">
                    Submit complex tasks to the autonomous system for end-to-end implementation
                </p>
            </div>

            {/* Request Form */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">New Workflow Request</h3>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what you want to build..."
                        className="w-full h-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Requirements */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Requirements
                    </label>
                    {requirements.map((req, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={req}
                                onChange={(e) => updateRequirement(index, e.target.value)}
                                placeholder="Enter a requirement..."
                                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {requirements.length > 1 && (
                                <button
                                    onClick={() => removeRequirement(index)}
                                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addRequirement}
                        className="mt-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                        + Add Requirement
                    </button>
                </div>

                {/* Configuration Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Risk Tolerance */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Risk Tolerance
                        </label>
                        <select
                            value={riskTolerance}
                            onChange={(e) => setRiskTolerance(e.target.value as any)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    {/* Autonomy Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Autonomy Level
                        </label>
                        <select
                            value={autonomyLevel}
                            onChange={(e) => setAutonomyLevel(e.target.value as any)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="autonomous">Autonomous (Full auto-approve)</option>
                            <option value="assist">Assist (Require approval)</option>
                            <option value="audit">Audit (Review only)</option>
                        </select>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Workflow'}
                </button>
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
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-gray-400">
                                                {workflow.jobId}
                                            </span>
                                            <StatusBadge status={workflow.status} />
                                        </div>
                                        {workflow.currentPhase && (
                                            <p className="text-sm text-gray-300 mt-1">
                                                Phase: {workflow.currentPhase}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {workflow.status === 'completed' && (
                                            <button
                                                onClick={() => viewResults(workflow.jobId)}
                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                                View Results
                                            </button>
                                        )}
                                        {workflow.status === 'running' && (
                                            <button
                                                onClick={() => cancelWorkflow(workflow.jobId)}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {workflow.status === 'running' && (
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${workflow.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {workflow.progress.toFixed(0)}% complete
                                        </p>
                                    </div>
                                )}
                                {workflow.error && (
                                    <p className="text-sm text-red-400 mt-2">Error: {workflow.error}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        pending: 'bg-yellow-600',
        running: 'bg-blue-600',
        completed: 'bg-green-600',
        failed: 'bg-red-600',
        cancelled: 'bg-gray-600',
    };

    return (
        <span className={`px-2 py-1 text-xs font-semibold text-white rounded ${colors[status as keyof typeof colors] || 'bg-gray-600'}`}>
            {status.toUpperCase()}
        </span>
    );
}
