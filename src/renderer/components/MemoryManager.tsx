/**
 * MemoryManager Component
 * 
 * Displays and manages persistent memory entries
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MemoryEntry {
    id: string;
    type: 'preference' | 'pattern' | 'project' | 'behavior';
    content: any;
    tags: string[];
    accessCount: number;
    lastAccessed: Date;
    createdAt: Date;
}

const MemoryManager: React.FC = () => {
    const [memories, setMemories] = useState<MemoryEntry[]>([]);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMemory, setNewMemory] = useState({ type: 'preference', content: '', tags: '' });

    useEffect(() => {
        loadMemories();
    }, [selectedType]);

    const loadMemories = async () => {
        try {
            const query: any = { limit: 50 };
            if (selectedType !== 'all') query.type = selectedType;

            const result = await (window as any).shadowAPI?.memory?.query?.(query);
            if (result) {
                setMemories(result.map((m: any) => ({
                    ...m,
                    lastAccessed: new Date(m.lastAccessed),
                    createdAt: new Date(m.createdAt),
                })));
            }
        } catch (err) {
            console.error('Failed to load memories:', err);
        }
    };

    const addMemory = async () => {
        try {
            await (window as any).shadowAPI?.memory?.store?.({
                type: newMemory.type,
                content: newMemory.content,
                tags: newMemory.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            });
            setShowAddModal(false);
            setNewMemory({ type: 'preference', content: '', tags: '' });
            loadMemories();
        } catch (err) {
            console.error('Failed to add memory:', err);
        }
    };

    const deleteMemory = async (id: string) => {
        try {
            await (window as any).shadowAPI?.memory?.delete?.(id);
            setMemories(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error('Failed to delete memory:', err);
        }
    };

    const consolidate = async () => {
        try {
            await (window as any).shadowAPI?.memory?.consolidate?.();
            loadMemories();
        } catch (err) {
            console.error('Failed to consolidate:', err);
        }
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            preference: '⚙️',
            pattern: '🔄',
            project: '📁',
            behavior: '🎯',
        };
        return icons[type] || '💾';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            preference: '#8b5cf6',
            pattern: '#3b82f6',
            project: '#22c55e',
            behavior: '#f59e0b',
        };
        return colors[type] || '#8b949e';
    };

    const filteredMemories = memories.filter(m => {
        if (!searchQuery) return true;
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    const stats = {
        total: memories.length,
        byType: {
            preference: memories.filter(m => m.type === 'preference').length,
            pattern: memories.filter(m => m.type === 'pattern').length,
            project: memories.filter(m => m.type === 'project').length,
            behavior: memories.filter(m => m.type === 'behavior').length,
        },
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>🧠 Memory Manager</h2>
                <div style={styles.headerActions}>
                    <button onClick={consolidate} style={styles.consolidateBtn}>
                        🔄 Consolidate
                    </button>
                    <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>
                        + Add Memory
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{stats.total}</span>
                    <span style={styles.statLabel}>Total Memories</span>
                </div>
                {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} style={styles.statCard}>
                        <span style={{ ...styles.statValue, color: getTypeColor(type) }}>{count}</span>
                        <span style={styles.statLabel}>{type}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={styles.filters}>
                <input
                    type="text"
                    placeholder="Search memories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={styles.select}
                >
                    <option value="all">All Types</option>
                    <option value="preference">Preferences</option>
                    <option value="pattern">Patterns</option>
                    <option value="project">Projects</option>
                    <option value="behavior">Behaviors</option>
                </select>
            </div>

            {/* Memory List */}
            <div style={styles.memoryList}>
                <AnimatePresence>
                    {filteredMemories.map((memory) => (
                        <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{
                                ...styles.memoryCard,
                                borderLeftColor: getTypeColor(memory.type),
                            }}
                        >
                            <div style={styles.memoryHeader}>
                                <span style={styles.typeIcon}>{getTypeIcon(memory.type)}</span>
                                <span style={{ ...styles.typeBadge, backgroundColor: getTypeColor(memory.type) }}>
                                    {memory.type}
                                </span>
                                <span style={styles.accessCount}>
                                    Accessed {memory.accessCount}x
                                </span>
                                <button
                                    onClick={() => deleteMemory(memory.id)}
                                    style={styles.deleteBtn}
                                >
                                    🗑️
                                </button>
                            </div>

                            <div style={styles.memoryContent}>
                                {typeof memory.content === 'string'
                                    ? memory.content
                                    : JSON.stringify(memory.content, null, 2)}
                            </div>

                            {memory.tags.length > 0 && (
                                <div style={styles.tags}>
                                    {memory.tags.map((tag, i) => (
                                        <span key={i} style={styles.tag}>#{tag}</span>
                                    ))}
                                </div>
                            )}

                            <div style={styles.memoryMeta}>
                                <span>Created: {memory.createdAt.toLocaleDateString()}</span>
                                <span>Last accessed: {memory.lastAccessed.toLocaleDateString()}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredMemories.length === 0 && (
                    <div style={styles.empty}>
                        <span style={styles.emptyIcon}>🧠</span>
                        <p>No memories found</p>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <motion.div
                        style={styles.modal}
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <h3 style={styles.modalTitle}>Add Memory</h3>

                        <div style={styles.formGroup}>
                            <label>Type</label>
                            <select
                                value={newMemory.type}
                                onChange={e => setNewMemory({ ...newMemory, type: e.target.value })}
                                style={styles.formSelect}
                            >
                                <option value="preference">Preference</option>
                                <option value="pattern">Pattern</option>
                                <option value="project">Project</option>
                                <option value="behavior">Behavior</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label>Content</label>
                            <textarea
                                value={newMemory.content}
                                onChange={e => setNewMemory({ ...newMemory, content: e.target.value })}
                                style={styles.formTextarea}
                                placeholder="Memory content..."
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={newMemory.tags}
                                onChange={e => setNewMemory({ ...newMemory, tags: e.target.value })}
                                style={styles.formInput}
                                placeholder="tag1, tag2, tag3"
                            />
                        </div>

                        <div style={styles.modalActions}>
                            <button onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>
                                Cancel
                            </button>
                            <button onClick={addMemory} style={styles.submitBtn}>
                                Add Memory
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
    headerActions: {
        display: 'flex',
        gap: '8px',
    },
    consolidateBtn: {
        backgroundColor: '#21262d',
        color: '#e6edf3',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
    },
    addBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
    },
    statsRow: {
        display: 'flex',
        gap: '8px',
        padding: '12px 20px',
        borderBottom: '1px solid #30363d',
    },
    statCard: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        backgroundColor: '#161b22',
        borderRadius: '6px',
    },
    statValue: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#58a6ff',
    },
    statLabel: {
        fontSize: '10px',
        color: '#8b949e',
        textTransform: 'capitalize',
    },
    filters: {
        display: 'flex',
        gap: '12px',
        padding: '12px 20px',
        borderBottom: '1px solid #30363d',
    },
    searchInput: {
        flex: 1,
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
    },
    select: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#21262d',
        color: '#e6edf3',
    },
    memoryList: {
        flex: 1,
        overflow: 'auto',
        padding: '12px',
    },
    memoryCard: {
        backgroundColor: '#161b22',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '10px',
        borderLeft: '3px solid',
    },
    memoryHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
    },
    typeIcon: {
        fontSize: '18px',
    },
    typeBadge: {
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
    },
    accessCount: {
        fontSize: '12px',
        color: '#8b949e',
        marginLeft: 'auto',
    },
    deleteBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
    },
    memoryContent: {
        backgroundColor: '#0d1117',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '13px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        marginBottom: '8px',
    },
    tags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '8px',
    },
    tag: {
        backgroundColor: '#21262d',
        color: '#8b949e',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
    },
    memoryMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#6e7681',
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
        width: '400px',
        maxWidth: '90%',
        border: '1px solid #30363d',
    },
    modalTitle: {
        margin: '0 0 20px',
        fontSize: '18px',
    },
    formGroup: {
        marginBottom: '16px',
    },
    formInput: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
    },
    formTextarea: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
        minHeight: '100px',
        resize: 'vertical',
        fontFamily: 'monospace',
    },
    formSelect: {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        marginTop: '6px',
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

export default MemoryManager;
