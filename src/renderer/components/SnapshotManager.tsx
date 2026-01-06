/**
 * SnapshotManager Component
 * 
 * UI for managing sandbox snapshots and branches
 */

import React, { useState, useEffect } from 'react';

interface Snapshot {
    id: string;
    name: string;
    description?: string;
    timestamp: Date;
    tags: string[];
    parentId?: string;
}

interface Branch {
    id: string;
    name: string;
    headSnapshotId: string;
    createdAt: Date;
}

interface SnapshotDiff {
    added: { path: string; size: number }[];
    removed: { path: string }[];
    modified: { before: { path: string }; after: { path: string } }[];
}

const SnapshotManager: React.FC = () => {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranch, setCurrentBranch] = useState<string>('');
    const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
    const [diff, setDiff] = useState<SnapshotDiff | null>(null);
    const [newSnapshotName, setNewSnapshotName] = useState('');
    const [newBranchName, setNewBranchName] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [snapshotList, branchList, current] = await Promise.all([
                (window as any).shadowAPI.snapshot.getAll(),
                (window as any).shadowAPI.snapshot.getAllBranches(),
                (window as any).shadowAPI.snapshot.getCurrentBranch(),
            ]);

            setSnapshots(snapshotList.map((s: any) => ({
                ...s,
                timestamp: new Date(s.timestamp),
            })));
            setBranches(branchList);
            setCurrentBranch(current);
        } catch (error) {
            console.error('Failed to load snapshots:', error);
        } finally {
            setLoading(false);
        }
    };

    const createSnapshot = async () => {
        if (!newSnapshotName.trim()) return;

        try {
            await (window as any).shadowAPI.snapshot.create({
                name: newSnapshotName,
                tags: [],
            });
            setNewSnapshotName('');
            setShowCreateModal(false);
            loadData();
        } catch (error) {
            console.error('Failed to create snapshot:', error);
        }
    };

    const restoreSnapshot = async (id: string) => {
        if (!confirm('Restore this snapshot? Current changes will be backed up.')) return;

        try {
            await (window as any).shadowAPI.snapshot.restore(id);
            loadData();
        } catch (error) {
            console.error('Failed to restore snapshot:', error);
        }
    };

    const deleteSnapshot = async (id: string) => {
        if (!confirm('Delete this snapshot?')) return;

        try {
            await (window as any).shadowAPI.snapshot.delete(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete snapshot:', error);
        }
    };

    const compareSnapshots = async () => {
        if (selectedSnapshots.length !== 2) return;

        try {
            const result = await (window as any).shadowAPI.snapshot.compare(
                selectedSnapshots[0],
                selectedSnapshots[1]
            );
            if (result.success) {
                setDiff(result.diff);
            }
        } catch (error) {
            console.error('Failed to compare snapshots:', error);
        }
    };

    const createBranch = async () => {
        if (!newBranchName.trim()) return;

        try {
            await (window as any).shadowAPI.snapshot.createBranch(newBranchName);
            setNewBranchName('');
            loadData();
        } catch (error) {
            console.error('Failed to create branch:', error);
        }
    };

    const switchBranch = async (branchName: string) => {
        try {
            await (window as any).shadowAPI.snapshot.switchBranch(branchName);
            setCurrentBranch(branchName);
            loadData();
        } catch (error) {
            console.error('Failed to switch branch:', error);
        }
    };

    const toggleSnapshotSelection = (id: string) => {
        if (selectedSnapshots.includes(id)) {
            setSelectedSnapshots(selectedSnapshots.filter(s => s !== id));
        } else if (selectedSnapshots.length < 2) {
            setSelectedSnapshots([...selectedSnapshots, id]);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading snapshots...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>📸 Snapshot Manager</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={styles.createButton}
                >
                    + Create Snapshot
                </button>
            </div>

            {/* Branch Selector */}
            <div style={styles.branchSection}>
                <span style={styles.branchLabel}>Branch:</span>
                <div style={styles.branchList}>
                    {branches.map((branch) => (
                        <button
                            key={branch.id}
                            onClick={() => switchBranch(branch.name)}
                            style={{
                                ...styles.branchButton,
                                ...(currentBranch === branch.name ? styles.branchButtonActive : {}),
                            }}
                        >
                            {branch.name}
                        </button>
                    ))}
                </div>
                <div style={styles.newBranch}>
                    <input
                        type="text"
                        placeholder="New branch name"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        style={styles.branchInput}
                    />
                    <button onClick={createBranch} style={styles.branchCreateButton}>
                        Create
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div style={styles.actions}>
                {selectedSnapshots.length === 2 && (
                    <button onClick={compareSnapshots} style={styles.compareButton}>
                        🔍 Compare Selected
                    </button>
                )}
                {selectedSnapshots.length > 0 && (
                    <button
                        onClick={() => setSelectedSnapshots([])}
                        style={styles.clearButton}
                    >
                        Clear Selection
                    </button>
                )}
            </div>

            <div style={styles.layout}>
                {/* Snapshot List */}
                <div style={styles.snapshotList}>
                    {snapshots.length === 0 ? (
                        <div style={styles.emptyState}>No snapshots yet</div>
                    ) : (
                        snapshots.map((snapshot) => (
                            <div
                                key={snapshot.id}
                                onClick={() => toggleSnapshotSelection(snapshot.id)}
                                style={{
                                    ...styles.snapshotCard,
                                    ...(selectedSnapshots.includes(snapshot.id) ? styles.snapshotCardSelected : {}),
                                }}
                            >
                                <div style={styles.snapshotHeader}>
                                    <span style={styles.snapshotName}>{snapshot.name}</span>
                                    <span style={styles.snapshotTime}>
                                        {snapshot.timestamp.toLocaleString()}
                                    </span>
                                </div>
                                {snapshot.description && (
                                    <div style={styles.snapshotDesc}>{snapshot.description}</div>
                                )}
                                {snapshot.tags.length > 0 && (
                                    <div style={styles.tagList}>
                                        {snapshot.tags.map((tag) => (
                                            <span key={tag} style={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <div style={styles.snapshotActions}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); restoreSnapshot(snapshot.id); }}
                                        style={styles.restoreButton}
                                    >
                                        ↩ Restore
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSnapshot(snapshot.id); }}
                                        style={styles.deleteButton}
                                    >
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Diff View */}
                {diff && (
                    <div style={styles.diffPanel}>
                        <h3>Comparison Results</h3>

                        {diff.added.length > 0 && (
                            <div style={styles.diffSection}>
                                <h4 style={styles.diffAdded}>+ Added ({diff.added.length})</h4>
                                {diff.added.map((file, i) => (
                                    <div key={i} style={styles.diffFile}>{file.path}</div>
                                ))}
                            </div>
                        )}

                        {diff.removed.length > 0 && (
                            <div style={styles.diffSection}>
                                <h4 style={styles.diffRemoved}>- Removed ({diff.removed.length})</h4>
                                {diff.removed.map((file, i) => (
                                    <div key={i} style={styles.diffFile}>{file.path}</div>
                                ))}
                            </div>
                        )}

                        {diff.modified.length > 0 && (
                            <div style={styles.diffSection}>
                                <h4 style={styles.diffModified}>~ Modified ({diff.modified.length})</h4>
                                {diff.modified.map((file, i) => (
                                    <div key={i} style={styles.diffFile}>{file.after.path}</div>
                                ))}
                            </div>
                        )}

                        <button onClick={() => setDiff(null)} style={styles.closeDiffButton}>
                            Close
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={styles.modal}>
                    <div style={styles.modalContent}>
                        <h3>Create Snapshot</h3>
                        <input
                            type="text"
                            placeholder="Snapshot name"
                            value={newSnapshotName}
                            onChange={(e) => setNewSnapshotName(e.target.value)}
                            style={styles.modalInput}
                            autoFocus
                        />
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowCreateModal(false)} style={styles.cancelButton}>
                                Cancel
                            </button>
                            <button onClick={createSnapshot} style={styles.confirmButton}>
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '20px',
        backgroundColor: '#1a1a2e',
        minHeight: '100%',
        color: '#eaeaea',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        margin: 0,
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#a4b0be',
    },
    createButton: {
        padding: '10px 20px',
        backgroundColor: '#4a90d9',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    branchSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
    },
    branchLabel: {
        color: '#a4b0be',
    },
    branchList: {
        display: 'flex',
        gap: '4px',
    },
    branchButton: {
        padding: '6px 12px',
        backgroundColor: 'transparent',
        border: '1px solid #3d3d5c',
        borderRadius: '4px',
        color: '#a4b0be',
        cursor: 'pointer',
    },
    branchButtonActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
        color: 'white',
    },
    newBranch: {
        display: 'flex',
        gap: '4px',
        marginLeft: 'auto',
    },
    branchInput: {
        padding: '6px 10px',
        backgroundColor: '#16213e',
        border: '1px solid #3d3d5c',
        borderRadius: '4px',
        color: 'white',
        fontSize: '13px',
    },
    branchCreateButton: {
        padding: '6px 12px',
        backgroundColor: '#3d3d5c',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
    },
    compareButton: {
        padding: '8px 16px',
        backgroundColor: '#4a90d9',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: 'pointer',
    },
    clearButton: {
        padding: '8px 16px',
        backgroundColor: '#3d3d5c',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: 'pointer',
    },
    layout: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px',
    },
    snapshotList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    emptyState: {
        backgroundColor: '#16213e',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#a4b0be',
    },
    snapshotCard: {
        backgroundColor: '#16213e',
        padding: '16px',
        borderRadius: '8px',
        border: '2px solid transparent',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
    },
    snapshotCardSelected: {
        borderColor: '#4a90d9',
    },
    snapshotHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    snapshotName: {
        fontWeight: 'bold',
    },
    snapshotTime: {
        fontSize: '12px',
        color: '#a4b0be',
    },
    snapshotDesc: {
        fontSize: '13px',
        color: '#a4b0be',
        marginBottom: '8px',
    },
    tagList: {
        display: 'flex',
        gap: '6px',
        marginBottom: '12px',
    },
    tag: {
        padding: '2px 8px',
        backgroundColor: '#3d3d5c',
        borderRadius: '4px',
        fontSize: '11px',
    },
    snapshotActions: {
        display: 'flex',
        gap: '8px',
    },
    restoreButton: {
        padding: '6px 12px',
        backgroundColor: '#7bed9f',
        border: 'none',
        borderRadius: '4px',
        color: '#1a1a2e',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: '6px 12px',
        backgroundColor: '#ff6b6b',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '12px',
    },
    diffPanel: {
        backgroundColor: '#16213e',
        borderRadius: '12px',
        padding: '20px',
        height: 'fit-content',
    },
    diffSection: {
        marginBottom: '16px',
    },
    diffAdded: {
        color: '#7bed9f',
    },
    diffRemoved: {
        color: '#ff6b6b',
    },
    diffModified: {
        color: '#ffa502',
    },
    diffFile: {
        fontSize: '12px',
        fontFamily: 'monospace',
        padding: '4px 8px',
        backgroundColor: '#1a1a2e',
        borderRadius: '4px',
        marginTop: '4px',
    },
    closeDiffButton: {
        padding: '8px 16px',
        backgroundColor: '#3d3d5c',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: 'pointer',
        marginTop: '16px',
    },
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#16213e',
        padding: '24px',
        borderRadius: '12px',
        width: '400px',
    },
    modalInput: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#1a1a2e',
        border: '1px solid #3d3d5c',
        borderRadius: '6px',
        color: 'white',
        fontSize: '14px',
        marginTop: '16px',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '20px',
    },
    cancelButton: {
        padding: '10px 20px',
        backgroundColor: '#3d3d5c',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: 'pointer',
    },
    confirmButton: {
        padding: '10px 20px',
        backgroundColor: '#4a90d9',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
};

export default SnapshotManager;
