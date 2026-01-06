/**
 * ContextGraphViewer Component
 * 
 * Visualizes the project context graph showing file dependencies,
 * symbols, imports/exports, and impact analysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface FileNode {
    path: string;
    name: string;
    imports: string[];
    exports: string[];
    symbols: Symbol[];
}

interface Symbol {
    name: string;
    type: 'function' | 'class' | 'interface' | 'variable' | 'type';
    line: number;
    exported: boolean;
}

interface GraphStats {
    totalFiles: number;
    totalSymbols: number;
    totalImports: number;
    circularDeps: number;
}

const ContextGraphViewer: React.FC = () => {
    const [files, setFiles] = useState<FileNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [stats, setStats] = useState<GraphStats>({ totalFiles: 0, totalSymbols: 0, totalImports: 0, circularDeps: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [impactAnalysis, setImpactAnalysis] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'files' | 'symbols' | 'dependencies'>('files');

    useEffect(() => {
        buildGraph();
    }, []);

    const buildGraph = async () => {
        setLoading(true);
        try {
            // Call the context graph API
            const result = await (window as any).shadowAPI?.contextGraph?.buildGraph?.('.');
            if (result) {
                setFiles(result.files || []);
                setStats({
                    totalFiles: result.files?.length || 0,
                    totalSymbols: result.totalSymbols || 0,
                    totalImports: result.totalImports || 0,
                    circularDeps: result.circularDeps?.length || 0,
                });
            }
        } catch (err) {
            console.error('Failed to build graph:', err);
            // Generate mock data for demo
            setFiles([
                {
                    path: 'src/main.ts', name: 'main.ts', imports: ['./utils', './config'], exports: ['main'], symbols: [
                        { name: 'main', type: 'function', line: 10, exported: true },
                        { name: 'init', type: 'function', line: 25, exported: false },
                    ]
                },
                {
                    path: 'src/utils.ts', name: 'utils.ts', imports: ['lodash'], exports: ['formatDate', 'parseJSON'], symbols: [
                        { name: 'formatDate', type: 'function', line: 5, exported: true },
                        { name: 'parseJSON', type: 'function', line: 20, exported: true },
                    ]
                },
            ]);
            setStats({ totalFiles: 2, totalSymbols: 4, totalImports: 3, circularDeps: 0 });
        } finally {
            setLoading(false);
        }
    };

    const analyzeImpact = async (filePath: string) => {
        try {
            const result = await (window as any).shadowAPI?.contextGraph?.analyzeImpact?.(filePath);
            if (result?.affectedFiles) {
                setImpactAnalysis(result.affectedFiles);
            }
        } catch (err) {
            console.error('Failed to analyze impact:', err);
            // Demo data
            setImpactAnalysis(['src/components/App.tsx', 'src/index.tsx', 'src/utils.ts']);
        }
    };

    const getSymbolIcon = (type: Symbol['type']) => {
        const icons: Record<string, string> = {
            function: 'ƒ',
            class: 'C',
            interface: 'I',
            variable: 'V',
            type: 'T',
        };
        return icons[type] || '?';
    };

    const getSymbolColor = (type: Symbol['type']) => {
        const colors: Record<string, string> = {
            function: '#f59e0b',
            class: '#8b5cf6',
            interface: '#3b82f6',
            variable: '#22c55e',
            type: '#ec4899',
        };
        return colors[type] || '#8b949e';
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.symbols.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>🔍 Code Intelligence</h2>
                <div style={styles.headerActions}>
                    <button onClick={buildGraph} style={styles.rebuildBtn} disabled={loading}>
                        {loading ? '⏳ Building...' : '🔄 Rebuild Graph'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{stats.totalFiles}</span>
                    <span style={styles.statLabel}>Files</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{stats.totalSymbols}</span>
                    <span style={styles.statLabel}>Symbols</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{stats.totalImports}</span>
                    <span style={styles.statLabel}>Imports</span>
                </div>
                <div style={styles.statCard}>
                    <span style={{ ...styles.statValue, color: stats.circularDeps > 0 ? '#ef4444' : '#22c55e' }}>
                        {stats.circularDeps}
                    </span>
                    <span style={styles.statLabel}>Circular Deps</span>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div style={styles.viewTabs}>
                {(['files', 'symbols', 'dependencies'] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        style={{
                            ...styles.viewTab,
                            backgroundColor: viewMode === mode ? '#238636' : '#21262d',
                        }}
                    >
                        {mode === 'files' ? '📁 Files' : mode === 'symbols' ? '🔣 Symbols' : '🔗 Dependencies'}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search files or symbols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                {/* File List */}
                <div style={styles.fileList}>
                    <h3 style={styles.sectionTitle}>
                        {viewMode === 'files' ? 'Project Files' : viewMode === 'symbols' ? 'All Symbols' : 'Dependency Tree'}
                    </h3>

                    {viewMode === 'files' && filteredFiles.map((file) => (
                        <motion.div
                            key={file.path}
                            style={{
                                ...styles.fileCard,
                                borderColor: selectedFile?.path === file.path ? '#58a6ff' : '#30363d',
                            }}
                            onClick={() => {
                                setSelectedFile(file);
                                analyzeImpact(file.path);
                            }}
                            whileHover={{ scale: 1.01 }}
                        >
                            <div style={styles.fileName}>📄 {file.name}</div>
                            <div style={styles.fileMeta}>
                                <span>{file.symbols.length} symbols</span>
                                <span>{file.imports.length} imports</span>
                            </div>
                        </motion.div>
                    ))}

                    {viewMode === 'symbols' && (
                        <div style={styles.symbolGrid}>
                            {files.flatMap(f => f.symbols.map(s => ({ ...s, file: f.name }))).map((sym, i) => (
                                <div key={i} style={styles.symbolCard}>
                                    <span style={{
                                        ...styles.symbolIcon,
                                        backgroundColor: getSymbolColor(sym.type),
                                    }}>
                                        {getSymbolIcon(sym.type)}
                                    </span>
                                    <div style={styles.symbolInfo}>
                                        <span style={styles.symbolName}>{sym.name}</span>
                                        <span style={styles.symbolFile}>{sym.file}:{sym.line}</span>
                                    </div>
                                    {sym.exported && <span style={styles.exportedBadge}>exported</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'dependencies' && filteredFiles.map((file) => (
                        <div key={file.path} style={styles.depNode}>
                            <div style={styles.depNodeHeader}>📁 {file.name}</div>
                            {file.imports.length > 0 && (
                                <div style={styles.depImports}>
                                    {file.imports.map((imp, i) => (
                                        <span key={i} style={styles.depImport}>→ {imp}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Detail Panel */}
                <div style={styles.detailPanel}>
                    {selectedFile ? (
                        <>
                            <h3 style={styles.sectionTitle}>📄 {selectedFile.name}</h3>

                            {/* Symbols */}
                            <div style={styles.detailSection}>
                                <h4 style={styles.detailSectionTitle}>Symbols ({selectedFile.symbols.length})</h4>
                                {selectedFile.symbols.map((sym, i) => (
                                    <div key={i} style={styles.symbolRow}>
                                        <span style={{
                                            ...styles.symbolIcon,
                                            backgroundColor: getSymbolColor(sym.type),
                                        }}>
                                            {getSymbolIcon(sym.type)}
                                        </span>
                                        <span style={styles.symbolRowName}>{sym.name}</span>
                                        <span style={styles.symbolRowLine}>L{sym.line}</span>
                                        {sym.exported && <span style={styles.exportedBadge}>exported</span>}
                                    </div>
                                ))}
                            </div>

                            {/* Imports */}
                            <div style={styles.detailSection}>
                                <h4 style={styles.detailSectionTitle}>Imports ({selectedFile.imports.length})</h4>
                                {selectedFile.imports.map((imp, i) => (
                                    <div key={i} style={styles.importRow}>
                                        <span style={styles.importArrow}>→</span>
                                        <span>{imp}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Impact Analysis */}
                            {impactAnalysis.length > 0 && (
                                <div style={styles.detailSection}>
                                    <h4 style={styles.detailSectionTitle}>🎯 Impact Analysis</h4>
                                    <p style={styles.impactNote}>
                                        Changes to this file would affect:
                                    </p>
                                    {impactAnalysis.map((file, i) => (
                                        <div key={i} style={styles.impactFile}>
                                            ⚠️ {file}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={styles.noSelection}>
                            <span style={styles.noSelectionIcon}>👆</span>
                            <p>Select a file to view details</p>
                        </div>
                    )}
                </div>
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
    headerActions: {
        display: 'flex',
        gap: '8px',
    },
    rebuildBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        cursor: 'pointer',
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
    viewTabs: {
        display: 'flex',
        gap: '8px',
        padding: '12px 20px',
        borderBottom: '1px solid #30363d',
    },
    viewTab: {
        padding: '6px 16px',
        borderRadius: '6px',
        border: 'none',
        color: '#e6edf3',
        cursor: 'pointer',
        fontSize: '13px',
    },
    searchContainer: {
        padding: '12px 20px',
        borderBottom: '1px solid #30363d',
    },
    searchInput: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '6px',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        fontSize: '14px',
    },
    content: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
    },
    fileList: {
        width: '40%',
        borderRight: '1px solid #30363d',
        padding: '16px',
        overflow: 'auto',
    },
    sectionTitle: {
        margin: '0 0 12px',
        fontSize: '14px',
        color: '#8b949e',
    },
    fileCard: {
        backgroundColor: '#161b22',
        borderRadius: '6px',
        padding: '10px 14px',
        marginBottom: '8px',
        border: '1px solid #30363d',
        cursor: 'pointer',
    },
    fileName: {
        fontWeight: 500,
        marginBottom: '4px',
    },
    fileMeta: {
        display: 'flex',
        gap: '12px',
        fontSize: '12px',
        color: '#8b949e',
    },
    symbolGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    symbolCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#161b22',
        borderRadius: '6px',
        padding: '8px 12px',
    },
    symbolIcon: {
        width: '24px',
        height: '24px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: '12px',
        color: 'white',
    },
    symbolInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    symbolName: {
        fontWeight: 500,
    },
    symbolFile: {
        fontSize: '12px',
        color: '#8b949e',
    },
    exportedBadge: {
        backgroundColor: '#238636',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '10px',
    },
    depNode: {
        backgroundColor: '#161b22',
        borderRadius: '6px',
        padding: '10px 14px',
        marginBottom: '8px',
    },
    depNodeHeader: {
        fontWeight: 500,
        marginBottom: '8px',
    },
    depImports: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        paddingLeft: '16px',
    },
    depImport: {
        fontSize: '13px',
        color: '#58a6ff',
    },
    detailPanel: {
        flex: 1,
        padding: '16px',
        overflow: 'auto',
    },
    detailSection: {
        marginBottom: '20px',
    },
    detailSectionTitle: {
        margin: '0 0 10px',
        fontSize: '13px',
        color: '#8b949e',
    },
    symbolRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '6px 0',
        borderBottom: '1px solid #21262d',
    },
    symbolRowName: {
        flex: 1,
        fontWeight: 500,
    },
    symbolRowLine: {
        fontSize: '12px',
        color: '#8b949e',
    },
    importRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        color: '#58a6ff',
    },
    importArrow: {
        color: '#8b949e',
    },
    impactNote: {
        fontSize: '13px',
        color: '#8b949e',
        marginBottom: '8px',
    },
    impactFile: {
        padding: '6px 10px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: '4px',
        marginBottom: '4px',
        color: '#f59e0b',
        fontSize: '13px',
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
};

export default ContextGraphViewer;
