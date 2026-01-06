/**
 * OrchestrationPanel Component
 * 
 * Displays and manages multi-agent workflows
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    status: 'idle' | 'running' | 'completed' | 'failed';
    createdAt: Date;
}

interface WorkflowStep {
    id: string;
    agentType: 'architect' | 'builder' | 'debugger' | 'reviewer' | 'documenter' | 'optimizer' | 'security';
    task: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
}

const OrchestrationPanel: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({
        name: '',
        description: '',
        steps: [] as Array<{ agentType: string; task: string }>,
    });

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const result = await (window as any).shadowAPI?.orchestration?.getWorkflows?.();
            if (result) {
                setWorkflows(result.map((w: any) => ({
                    ...w,
                    createdAt: new Date(w.createdAt),
                })));
            }
        } catch (err) {
            console.error('Failed to load workflows:', err);
        }
    };

    const runWorkflow = async (workflowId: string) => {
        try {
            await (window as any).shadowAPI?.orchestration?.runWorkflow?.(workflowId);
            loadWorkflows();
        } catch (err) {
            console.error('Failed to run workflow:', err);
        }
    };

    const createWorkflow = async () => {
        try {
            await (window as any).shadowAPI?.orchestration?.createWorkflow?.(newWorkflow);
            setShowCreateModal(false);
            setNewWorkflow({ name: '', description: '', steps: [] });
            loadWorkflows();
        } catch (err) {
            console.error('Failed to create workflow:', err);
        }
    };

    const getAgentIcon = (type: string) => {
        const icons: Record<string, string> = {
            architect: '📐',
            builder: '🔨',
            debugger: '🐛',
            reviewer: '👀',
            documenter: '📝',
            optimizer: '⚡',
            security: '🔒',
        };
        return icons[type] || '🤖';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            idle: '#8b949e',
            pending: '#8b949e',
            running: '#3b82f6',
            completed: '#22c55e',
            failed: '#ef4444',
        };
        return colors[status] || '#8b949e';
    };

    const addStep = () => {
        setNewWorkflow({
            ...newWorkflow,
            steps: [...newWorkflow.steps, { agentType: 'builder', task: '' }],
        });
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>🎭 Multi-Agent Orchestration</h2>
                <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
                    + Create Workflow
                </button>
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                {/* Workflow List */}
                <div style={styles.workflowList}>
                    <h3 style={styles.sectionTitle}>Workflows</h3>
                    {workflows.map((workflow) => (
                        <motion.div
                            key={workflow.id}
                            style={{
                                ...styles.workflowCard,
                                borderColor: selectedWorkflow?.id === workflow.id ? '#58a6ff' : '#30363d',
                            }}
                            onClick={() => setSelectedWorkflow(workflow)}
                            whileHover={{ scale: 1.01 }}
                        >
                            <div style={styles.workflowHeader}>
                                <span style={styles.workflowName}>{workflow.name}</span>
                                <span style={{
                                    ...styles.statusBadge,
                                    backgroundColor: getStatusColor(workflow.status),
                                }}>
                                    {workflow.status}
                                </span>
                            </div>
                            <p style={styles.workflowDesc}>{workflow.description}</p>
                            <div style={styles.workflowMeta}>
                                <span>{workflow.steps.length} steps</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        runWorkflow(workflow.id);
                                    }}
                                    style={styles.runBtn}
                                    disabled={workflow.status === 'running'}
                                >
                                    ▶ Run
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {workflows.length === 0 && (
                        <div style={styles.empty}>
                            <span style={styles.emptyIcon}>🎭</span>
                            <p>No workflows yet</p>
                        </div>
                    )}
                </div>

                {/* Workflow Details */}
                <div style={styles.workflowDetails}>
                    {selectedWorkflow ? (
                        <>
                            <h3 style={styles.sectionTitle}>
                                {selectedWorkflow.name}
                            </h3>
                            <div style={styles.stepsList}>
                                {selectedWorkflow.steps.map((step, i) => (
                                    <div key={step.id} style={styles.step}>
                                        <div style={styles.stepConnector}>
                                            <div style={{
                                                ...styles.stepDot,
                                                backgroundColor: getStatusColor(step.status),
                                            }} />
                                            {i < selectedWorkflow.steps.length - 1 && (
                                                <div style={styles.stepLine} />
                                            )}
                                        </div>
                                        <div style={styles.stepContent}>
                                            <div style={styles.stepHeader}>
                                                <span style={styles.agentIcon}>
                                                    {getAgentIcon(step.agentType)}
                                                </span>
                                                <span style={styles.agentType}>
                                                    {step.agentType.charAt(0).toUpperCase() + step.agentType.slice(1)}
                                                </span>
                                                <span style={{
                                                    ...styles.stepStatus,
                                                    color: getStatusColor(step.status),
                                                }}>
                                                    {step.status}
                                                </span>
                                            </div>
                                            <p style={styles.stepTask}>{step.task}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={styles.noSelection}>
                            <span style={styles.noSelectionIcon}>👆</span>
                            <p>Select a workflow to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <motion.div
                        style={styles.modal}
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h3 style={styles.modalTitle}>Create Workflow</h3>

                        <div style={styles.formGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                value={newWorkflow.name}
                                onChange={e => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={newWorkflow.description}
                                onChange={e => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label>Steps</label>
                            {newWorkflow.steps.map((step, i) => (
                                <div key={i} style={styles.stepInput}>
                                    <select
                                        value={step.agentType}
                                        onChange={e => {
                                            const steps = [...newWorkflow.steps];
                                            steps[i].agentType = e.target.value;
                                            setNewWorkflow({ ...newWorkflow, steps });
                                        }}
                                        style={styles.agentSelect}
                                    >
                                        <option value="architect">Architect</option>
                                        <option value="builder">Builder</option>
                                        <option value="debugger">Debugger</option>
                                        <option value="reviewer">Reviewer</option>
                                        <option value="documenter">Documenter</option>
                                        <option value="optimizer">Optimizer</option>
                                        <option value="security">Security</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={step.task}
                                        placeholder="Task description..."
                                        onChange={e => {
                                            const steps = [...newWorkflow.steps];
                                            steps[i].task = e.target.value;
                                            setNewWorkflow({ ...newWorkflow, steps });
                                        }}
                                        style={styles.taskInput}
                                    />
                                </div>
                            ))}
                            <button onClick={addStep} style={styles.addStepBtn}>
                                + Add Step
                            </button>
                        </div>

                        <div style={styles.modalActions}>
                            <button onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={createWorkflow} style={styles.submitBtn}>
                                Create
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #30363d',
        backgroundColor: '#161b22',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
    },
    createBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
    },
    content: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
    },
    workflowList: {
        width: '40%',
        borderRight: '1px solid #30363d',
        padding: '16px',
        overflow: 'auto',
    },
    sectionTitle: {
        margin: '0 0 16px',
        fontSize: '14px',
        color: '#8b949e',
    },
    workflowCard: {
        backgroundColor: '#161b22',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '10px',
        border: '1px solid #30363d',
        cursor: 'pointer',
    },
    workflowHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
    },
    workflowName: {
        fontWeight: 600,
    },
    statusBadge: {
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        textTransform: 'uppercase',
    },
    workflowDesc: {
        margin: '0 0 8px',
        fontSize: '13px',
        color: '#8b949e',
    },
    workflowMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#6e7681',
    },
    runBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 12px',
        fontSize: '11px',
        cursor: 'pointer',
    },
    workflowDetails: {
        flex: 1,
        padding: '16px',
        overflow: 'auto',
    },
    stepsList: {
        display: 'flex',
        flexDirection: 'column',
    },
    step: {
        display: 'flex',
        gap: '12px',
    },
    stepConnector: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '20px',
    },
    stepDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
    },
    stepLine: {
        width: '2px',
        flex: 1,
        backgroundColor: '#30363d',
        minHeight: '30px',
    },
    stepContent: {
        flex: 1,
        paddingBottom: '20px',
    },
    stepHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    agentIcon: {
        fontSize: '16px',
    },
    agentType: {
        fontWeight: 500,
    },
    stepStatus: {
        fontSize: '11px',
        marginLeft: 'auto',
    },
    stepTask: {
        margin: '6px 0 0',
        fontSize: '13px',
        color: '#8b949e',
    },
    noSelection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#8b949e',
    },
    noSelectionIcon: {
        fontSize: '48px',
        marginBottom: '12px',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: '#8b949e',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '12px',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#161b22',
        borderRadius: '12px',
        padding: '24px',
        width: '500px',
        maxWidth: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid #30363d',
    },
    modalTitle: {
        margin: '0 0 20px',
        fontSize: '18px',
    },
    formGroup: {
        marginBottom: '16px',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
    },
    textarea: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
        minHeight: '60px',
        resize: 'vertical',
    },
    stepInput: {
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
    },
    agentSelect: {
        width: '120px',
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
    },
    taskInput: {
        flex: 1,
        padding: '8px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
    },
    addStepBtn: {
        marginTop: '8px',
        backgroundColor: '#21262d',
        color: '#e6edf3',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
        width: '100%',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '20px',
    },
    cancelBtn: {
        backgroundColor: 'transparent',
        color: '#8b949e',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
    },
    submitBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
    },
};

export default OrchestrationPanel;
