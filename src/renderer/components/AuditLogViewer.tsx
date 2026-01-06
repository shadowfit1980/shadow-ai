/**
 * AuditLogViewer Component
 * 
 * Displays action audit logs with filtering and search
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditEntry {
    id: string;
    timestamp: Date;
    action: string;
    category: 'code' | 'file' | 'terminal' | 'agent' | 'system' | 'security';
    status: 'success' | 'failure' | 'pending';
    duration?: number;
    userId?: string;
    details?: Record<string, any>;
}

const AuditLogViewer: React.FC = () => {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [filter, setFilter] = useState({ category: 'all', status: 'all' });
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadEntries();
        const interval = setInterval(loadEntries, 30000);
        return () => clearInterval(interval);
    }, [filter]);

    const loadEntries = async () => {
        try {
            const result = await (window as any).shadowAPI?.audit?.query?.({
                category: filter.category !== 'all' ? filter.category : undefined,
                status: filter.status !== 'all' ? filter.status : undefined,
                limit: 100,
            });
            if (result?.entries) {
                setEntries(result.entries.map((e: any) => ({
                    ...e,
                    timestamp: new Date(e.timestamp),
                })));
            }
        } catch (err) {
            console.error('Failed to load audit entries:', err);
        }
    };

    const getCategoryIcon = (category: AuditEntry['category']) => {
        const icons: Record<string, string> = {
            code: '💻',
            file: '📁',
            terminal: '🖥️',
            agent: '🤖',
            system: '⚙️',
            security: '🔒',
        };
        return icons[category] || '📋';
    };

    const getStatusColor = (status: AuditEntry['status']) => {
        const colors: Record<string, string> = {
            success: '#22c55e',
            failure: '#ef4444',
            pending: '#f59e0b',
        };
        return colors[status] || '#8b949e';
    };

    const filteredEntries = entries.filter(e => {
        if (searchQuery && !e.action.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    const stats = {
        total: entries.length,
        success: entries.filter(e => e.status === 'success').length,
        failure: entries.filter(e => e.status === 'failure').length,
        avgDuration: entries.reduce((sum, e) => sum + (e.duration || 0), 0) / entries.length || 0,
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>📋 Audit Log</h2>
                <button onClick={loadEntries} style={styles.refreshBtn}>🔄 Refresh</button>
            </div>

            {/* Filters */}
            <div style={styles.filters}>
                <input
                    type="text"
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
                <select
                    value={filter.category}
                    onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                    style={styles.select}
                >
                    <option value="all">All Categories</option>
                    <option value="code">Code</option>
                    <option value="file">File</option>
                    <option value="terminal">Terminal</option>
                    <option value="agent">Agent</option>
                    <option value="system">System</option>
                    <option value="security">Security</option>
                </select>
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    style={styles.select}
                >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Stats */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{stats.total}</span>
                    <span style={styles.statLabel}>Total</span>
                </div>
                <div style={styles.statCard}>
                    <span style={{ ...styles.statValue, color: '#22c55e' }}>{stats.success}</span>
                    <span style={styles.statLabel}>Success</span>
                </div>
                <div style={styles.statCard}>
                    <span style={{ ...styles.statValue, color: '#ef4444' }}>{stats.failure}</span>
                    <span style={styles.statLabel}>Failed</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{Math.round(stats.avgDuration)}ms</span>
                    <span style={styles.statLabel}>Avg Duration</span>
                </div>
            </div>

            {/* Log List */}
            <div style={styles.logList}>
                <AnimatePresence>
                    {filteredEntries.map((entry) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={styles.logEntry}
                        >
                            <span style={styles.categoryIcon}>{getCategoryIcon(entry.category)}</span>
                            <div style={styles.entryContent}>
                                <div style={styles.entryHeader}>
                                    <span style={styles.action}>{entry.action}</span>
                                    <span style={{ ...styles.status, color: getStatusColor(entry.status) }}>
                                        {entry.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={styles.entryMeta}>
                                    <span style={styles.timestamp}>
                                        {entry.timestamp.toLocaleString()}
                                    </span>
                                    {entry.duration && (
                                        <span style={styles.duration}>{entry.duration}ms</span>
                                    )}
                                    <span style={styles.category}>{entry.category}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredEntries.length === 0 && (
                    <div style={styles.empty}>
                        <span style={styles.emptyIcon}>📭</span>
                        <p>No audit entries found</p>
                    </div>
                )}
            </div>
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
    refreshBtn: {
        backgroundColor: '#21262d',
        color: '#e6edf3',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
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
    statsRow: {
        display: 'flex',
        gap: '12px',
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
        fontSize: '20px',
        fontWeight: 600,
        color: '#58a6ff',
    },
    statLabel: {
        fontSize: '11px',
        color: '#8b949e',
    },
    logList: {
        flex: 1,
        overflow: 'auto',
        padding: '12px',
    },
    logEntry: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#161b22',
        borderRadius: '6px',
        marginBottom: '8px',
        borderLeft: '3px solid #30363d',
    },
    categoryIcon: {
        fontSize: '20px',
        marginTop: '2px',
    },
    entryContent: {
        flex: 1,
    },
    entryHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    },
    action: {
        fontWeight: 500,
        fontSize: '14px',
    },
    status: {
        fontSize: '10px',
        fontWeight: 600,
    },
    entryMeta: {
        display: 'flex',
        gap: '12px',
        fontSize: '12px',
        color: '#8b949e',
    },
    timestamp: {},
    duration: {
        color: '#58a6ff',
    },
    category: {
        backgroundColor: '#21262d',
        padding: '1px 6px',
        borderRadius: '4px',
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
};

export default AuditLogViewer;
