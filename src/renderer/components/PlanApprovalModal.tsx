import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImplementationPlan {
    id: string;
    title: string;
    summary: string;
    phases: Phase[];
    files: FileChange[];
    risks: Risk[];
    estimatedTime: number;
}

interface Phase {
    id: string;
    name: string;
    description: string;
    steps: Step[];
    status: string;
}

interface Step {
    id: string;
    description: string;
    file?: string;
    action: string;
    completed: boolean;
}

interface FileChange {
    path: string;
    action: 'create' | 'modify' | 'delete';
    description: string;
}

interface Risk {
    level: 'low' | 'medium' | 'high';
    description: string;
    mitigation?: string;
}

interface PlanApprovalModalProps {
    plan: ImplementationPlan;
    onApprove: () => void;
    onReject: () => void;
    onModify?: (feedback: string) => void;
}

export default function PlanApprovalModal({
    plan,
    onApprove,
    onReject,
    onModify,
}: PlanApprovalModalProps) {
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set([plan.phases[0]?.id]));
    const [feedback, setFeedback] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);

    const togglePhase = (phaseId: string) => {
        const newExpanded = new Set(expandedPhases);
        if (newExpanded.has(phaseId)) {
            newExpanded.delete(phaseId);
        } else {
            newExpanded.add(phaseId);
        }
        setExpandedPhases(newExpanded);
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
            case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getActionBadge = (action: string) => {
        const colors = {
            create: 'bg-green-600/20 text-green-400 border-green-600/30',
            modify: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
            delete: 'bg-red-600/20 text-red-400 border-red-600/30',
        };
        return colors[action as keyof typeof colors] || colors.modify;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={onReject}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gray-900 border border-neon-cyan/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-neon-cyan mb-2">{plan.title}</h2>
                            <p className="text-gray-400 text-sm">{plan.summary}</p>
                            <div className="mt-3 flex items-center space-x-4 text-xs">
                                <span className="text-gray-500">
                                    ⏱️ Est. Time: <span className="text-neon-cyan font-semibold">{plan.estimatedTime}min</span>
                                </span>
                                <span className="text-gray-500">
                                    📋 Phases: <span className="text-neon-cyan font-semibold">{plan.phases.length}</span>
                                </span>
                                <span className="text-gray-500">
                                    📁 Files: <span className="text-neon-cyan font-semibold">{plan.files.length}</span>
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onReject}
                            className="text-gray-500 hover:text-gray-300"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Risks */}
                    {plan.risks.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-yellow-500 mb-3">⚠️ Risks</h3>
                            <div className="space-y-2">
                                {plan.risks.map((risk, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded border ${getRiskColor(risk.level)}`}
                                    >
                                        <div className="flex items-start">
                                            <span className="font-semibold text-xs uppercase mr-2">{risk.level}:</span>
                                            <div className="flex-1">
                                                <div className="text-sm">{risk.description}</div>
                                                {risk.mitigation && (
                                                    <div className="text-xs opacity-75 mt-1">
                                                        💡 {risk.mitigation}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Phases */}
                    <div>
                        <h3 className="text-lg font-semibold text-neon-cyan mb-3">📋 Implementation Phases</h3>
                        <div className="space-y-3">
                            {plan.phases.map((phase, index) => (
                                <div key={phase.id} className="bg-gray-800/50 rounded-lg border border-gray-700">
                                    <button
                                        onClick={() => togglePhase(phase.id)}
                                        className="w-full p-4 text-left hover:bg-gray-800/70 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="font-semibold text-neon-cyan">
                                                    Phase {index + 1}: {phase.name}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">{phase.description}</div>
                                            </div>
                                            <div className="text-gray-500">
                                                {expandedPhases.has(phase.id) ? '▼' : '▶'}
                                            </div>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedPhases.has(phase.id) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 pt-0 space-y-2">
                                                    {phase.steps.map((step, stepIndex) => (
                                                        <div
                                                            key={step.id}
                                                            className="flex items-start space-x-3 text-sm"
                                                        >
                                                            <div className="text-gray-500 mt-0.5">
                                                                {stepIndex + 1}.
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-gray-300">{step.description}</div>
                                                                {step.file && (
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        📄 {step.file}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Files */}
                    {plan.files.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-neon-cyan mb-3">📁 Files to Change</h3>
                            <div className="space-y-2">
                                {plan.files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded border border-gray-700"
                                    >
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getActionBadge(file.action)}`}>
                                            {file.action.toUpperCase()}
                                        </span>
                                        <div className="flex-1">
                                            <div className="font-mono text-sm text-neon-cyan">{file.path}</div>
                                            <div className="text-xs text-gray-400 mt-1">{file.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-800 bg-gray-900/50">
                    {showFeedback ? (
                        <div className="space-y-3">
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Enter your feedback or modifications..."
                                className="w-full h-24 bg-gray-800 border border-gray-700 rounded p-3 text-sm text-gray-300 resize-none focus:outline-none focus:border-neon-cyan/50"
                            />
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        if (onModify) onModify(feedback);
                                        setShowFeedback(false);
                                    }}
                                    className="cyber-button flex-1"
                                >
                                    Submit Feedback
                                </button>
                                <button
                                    onClick={() => setShowFeedback(false)}
                                    className="cyber-button-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onApprove}
                                className="cyber-button flex-1 bg-green-600 hover:bg-green-700"
                            >
                                ✅ Approve & Execute
                            </button>
                            {onModify && (
                                <button
                                    onClick={() => setShowFeedback(true)}
                                    className="cyber-button-secondary flex-1"
                                >
                                    ✏️ Request Changes
                                </button>
                            )}
                            <button
                                onClick={onReject}
                                className="cyber-button-secondary flex-1 bg-red-600/20 hover:bg-red-600/30 border-red-600/30"
                            >
                                ❌ Reject
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
