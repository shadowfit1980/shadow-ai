/**
 * PatternLibrary Component
 * 
 * UI for browsing, applying, and managing code patterns
 */

import React, { useState, useEffect } from 'react';

interface Pattern {
    id: string;
    name: string;
    type: string;
    description: string;
    language: string;
    template: string;
    parameters: { name: string; type: string; description: string; required: boolean }[];
    tags: string[];
    usageCount: number;
    successRate: number;
}

const PatternLibrary: React.FC = () => {
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
    const [filterType, setFilterType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [paramValues, setParamValues] = useState<Record<string, string>>({});
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPatterns();
    }, []);

    const loadPatterns = async () => {
        try {
            const data = await (window as any).shadowAPI.learning.getAllPatterns();
            setPatterns(data);
        } catch (error) {
            console.error('Failed to load patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectPattern = (pattern: Pattern) => {
        setSelectedPattern(pattern);
        setParamValues({});
        setGeneratedCode('');
    };

    const applyPattern = async () => {
        if (!selectedPattern) return;

        try {
            const result = await (window as any).shadowAPI.learning.applyPattern(
                selectedPattern.id,
                paramValues
            );
            if (result.success) {
                setGeneratedCode(result.code);
            }
        } catch (error) {
            console.error('Failed to apply pattern:', error);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCode);
    };

    const recordFeedback = async (success: boolean) => {
        if (!selectedPattern) return;
        await (window as any).shadowAPI.learning.recordFeedback(selectedPattern.id, success);
        loadPatterns();
    };

    const patternTypes = ['all', ...new Set(patterns.map(p => p.type))];

    const filteredPatterns = patterns.filter(p => {
        const matchesType = filterType === 'all' || p.type === filterType;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesType && matchesSearch;
    });

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading patterns...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>📚 Pattern Library</h2>
                <div style={styles.stats}>
                    {patterns.length} patterns
                </div>
            </div>

            <div style={styles.layout}>
                {/* Left: Pattern List */}
                <div style={styles.sidebar}>
                    <input
                        type="text"
                        placeholder="Search patterns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />

                    <div style={styles.typeFilter}>
                        {patternTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    ...styles.filterButton,
                                    ...(filterType === type ? styles.filterButtonActive : {}),
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div style={styles.patternList}>
                        {filteredPatterns.map((pattern) => (
                            <div
                                key={pattern.id}
                                onClick={() => selectPattern(pattern)}
                                style={{
                                    ...styles.patternCard,
                                    ...(selectedPattern?.id === pattern.id ? styles.patternCardActive : {}),
                                }}
                            >
                                <div style={styles.patternHeader}>
                                    <span style={styles.patternName}>{pattern.name}</span>
                                    <span style={styles.patternType}>{pattern.type}</span>
                                </div>
                                <div style={styles.patternDescription}>
                                    {pattern.description.substring(0, 80)}...
                                </div>
                                <div style={styles.patternMeta}>
                                    <span>{pattern.language}</span>
                                    <span>Used: {pattern.usageCount}x</span>
                                    <span style={{
                                        color: pattern.successRate > 0.8 ? '#7bed9f' : '#ffa502'
                                    }}>
                                        {(pattern.successRate * 100).toFixed(0)}% success
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Pattern Details */}
                <div style={styles.main}>
                    {selectedPattern ? (
                        <>
                            <div style={styles.patternDetails}>
                                <h3 style={styles.patternTitle}>{selectedPattern.name}</h3>
                                <p style={styles.patternDesc}>{selectedPattern.description}</p>

                                <div style={styles.tags}>
                                    {selectedPattern.tags.map((tag) => (
                                        <span key={tag} style={styles.tag}>{tag}</span>
                                    ))}
                                </div>

                                {/* Parameters */}
                                {selectedPattern.parameters.length > 0 && (
                                    <div style={styles.paramsSection}>
                                        <h4>Parameters</h4>
                                        {selectedPattern.parameters.map((param) => (
                                            <div key={param.name} style={styles.paramRow}>
                                                <label style={styles.paramLabel}>
                                                    {param.name}
                                                    {param.required && <span style={styles.required}>*</span>}
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={param.description}
                                                    value={paramValues[param.name] || ''}
                                                    onChange={(e) => setParamValues({
                                                        ...paramValues,
                                                        [param.name]: e.target.value,
                                                    })}
                                                    style={styles.paramInput}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button onClick={applyPattern} style={styles.applyButton}>
                                    ✨ Generate Code
                                </button>
                            </div>

                            {/* Template Preview */}
                            <div style={styles.templateSection}>
                                <h4>Template</h4>
                                <pre style={styles.codeBlock}>{selectedPattern.template}</pre>
                            </div>

                            {/* Generated Code */}
                            {generatedCode && (
                                <div style={styles.generatedSection}>
                                    <div style={styles.generatedHeader}>
                                        <h4>Generated Code</h4>
                                        <button onClick={copyToClipboard} style={styles.copyButton}>
                                            📋 Copy
                                        </button>
                                    </div>
                                    <pre style={styles.codeBlock}>{generatedCode}</pre>
                                    <div style={styles.feedbackRow}>
                                        <span>Was this helpful?</span>
                                        <button onClick={() => recordFeedback(true)} style={styles.feedbackButton}>
                                            👍 Yes
                                        </button>
                                        <button onClick={() => recordFeedback(false)} style={styles.feedbackButton}>
                                            👎 No
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            Select a pattern from the list to view details
                        </div>
                    )}
                </div>
            </div>
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
    stats: {
        color: '#a4b0be',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#a4b0be',
    },
    layout: {
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '20px',
        height: 'calc(100vh - 120px)',
    },
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden',
    },
    searchInput: {
        padding: '12px',
        backgroundColor: '#16213e',
        border: '1px solid #3d3d5c',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
    },
    typeFilter: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
    },
    filterButton: {
        padding: '6px 12px',
        backgroundColor: 'transparent',
        border: '1px solid #3d3d5c',
        borderRadius: '4px',
        color: '#a4b0be',
        cursor: 'pointer',
        fontSize: '12px',
    },
    filterButtonActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
        color: 'white',
    },
    patternList: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    patternCard: {
        backgroundColor: '#16213e',
        padding: '16px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: '1px solid transparent',
        transition: 'border-color 0.2s',
    },
    patternCardActive: {
        borderColor: '#4a90d9',
    },
    patternHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    patternName: {
        fontWeight: 'bold',
        fontSize: '14px',
    },
    patternType: {
        fontSize: '11px',
        color: '#4a90d9',
        backgroundColor: '#16213e',
        padding: '2px 6px',
        borderRadius: '4px',
    },
    patternDescription: {
        fontSize: '12px',
        color: '#a4b0be',
        marginBottom: '8px',
    },
    patternMeta: {
        display: 'flex',
        gap: '12px',
        fontSize: '11px',
        color: '#a4b0be',
    },
    main: {
        backgroundColor: '#16213e',
        borderRadius: '12px',
        padding: '20px',
        overflowY: 'auto',
    },
    patternDetails: {
        marginBottom: '20px',
    },
    patternTitle: {
        fontSize: '20px',
        marginBottom: '8px',
    },
    patternDesc: {
        color: '#a4b0be',
        marginBottom: '16px',
    },
    tags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '20px',
    },
    tag: {
        padding: '4px 10px',
        backgroundColor: '#3d3d5c',
        borderRadius: '12px',
        fontSize: '12px',
    },
    paramsSection: {
        marginBottom: '20px',
    },
    paramRow: {
        marginBottom: '12px',
    },
    paramLabel: {
        display: 'block',
        marginBottom: '4px',
        fontSize: '13px',
    },
    required: {
        color: '#ff6b6b',
        marginLeft: '4px',
    },
    paramInput: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#1a1a2e',
        border: '1px solid #3d3d5c',
        borderRadius: '6px',
        color: 'white',
        fontSize: '14px',
    },
    applyButton: {
        padding: '12px 24px',
        backgroundColor: '#4a90d9',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
    },
    templateSection: {
        marginBottom: '20px',
    },
    codeBlock: {
        backgroundColor: '#1a1a2e',
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        maxHeight: '300px',
    },
    generatedSection: {
        marginTop: '20px',
    },
    generatedHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    copyButton: {
        padding: '6px 12px',
        backgroundColor: '#3d3d5c',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '12px',
    },
    feedbackRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '12px',
        color: '#a4b0be',
        fontSize: '13px',
    },
    feedbackButton: {
        padding: '6px 12px',
        backgroundColor: '#3d3d5c',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
    },
    emptyState: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        color: '#a4b0be',
    },
};

export default PatternLibrary;
