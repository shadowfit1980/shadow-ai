/**
 * 🔌 PluginMarketplace - React UI Component
 * 
 * Displays the Plugin Marketplace with:
 * - Plugin search and filtering
 * - Category browsing
 * - Installation management
 * - Plugin settings
 */

import React, { useState, useEffect } from 'react';

// Types
interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: { name: string; verified: boolean };
    category: string;
    capabilities: { type: string; name: string; description: string }[];
    rating: { average: number; count: number };
    downloads: number;
    verified: boolean;
    premium: boolean;
    price?: number;
    status: 'available' | 'installed' | 'outdated' | 'disabled';
}

interface PluginCategory {
    category: string;
    count: number;
}

export const PluginMarketplace: React.FC = () => {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [categories, setCategories] = useState<PluginCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [installing, setInstalling] = useState<string | null>(null);
    const [view, setView] = useState<'marketplace' | 'installed'>('marketplace');

    const loadPlugins = async () => {
        setLoading(true);
        try {
            const result = await (window as any).shadowAPI.pluginMarketplace.search(searchQuery, {
                category: selectedCategory,
                sort: 'downloads'
            });
            if (result.success) {
                setPlugins(result.plugins);
            }
        } catch (err) {
            console.error('Failed to load plugins:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const result = await (window as any).shadowAPI.pluginMarketplace.getCategories();
            if (result.success) {
                setCategories(result.categories);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const installPlugin = async (pluginId: string) => {
        setInstalling(pluginId);
        try {
            const result = await (window as any).shadowAPI.pluginMarketplace.install(pluginId);
            if (result.success) {
                await loadPlugins();
            }
        } catch (err) {
            console.error('Failed to install plugin:', err);
        } finally {
            setInstalling(null);
        }
    };

    const uninstallPlugin = async (pluginId: string) => {
        try {
            const result = await (window as any).shadowAPI.pluginMarketplace.uninstall(pluginId);
            if (result.success) {
                await loadPlugins();
            }
        } catch (err) {
            console.error('Failed to uninstall plugin:', err);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadPlugins();
    }, [searchQuery, selectedCategory]);

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            'language': '📝',
            'framework': '🏗️',
            'testing': '🧪',
            'deployment': '🚀',
            'ai': '🤖',
            'database': '🗄️',
            'ui': '🎨',
            'devops': '⚙️',
            'security': '🔒',
            'productivity': '⚡',
            'entertainment': '🎮'
        };
        return icons[category] || '📦';
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} style={{ color: i <= rating ? '#FBBF24' : '#4B5563' }}>
                    ★
                </span>
            );
        }
        return stars;
    };

    const formatDownloads = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2>🔌 Plugin Marketplace</h2>
                <div style={styles.viewToggle}>
                    <button
                        style={{
                            ...styles.viewButton,
                            ...(view === 'marketplace' ? styles.viewButtonActive : {})
                        }}
                        onClick={() => setView('marketplace')}
                    >
                        🏪 Marketplace
                    </button>
                    <button
                        style={{
                            ...styles.viewButton,
                            ...(view === 'installed' ? styles.viewButtonActive : {})
                        }}
                        onClick={() => setView('installed')}
                    >
                        📦 Installed
                    </button>
                </div>
            </div>

            {/* Search */}
            <div style={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Search plugins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {/* Categories */}
            <div style={styles.categories}>
                <button
                    style={{
                        ...styles.categoryButton,
                        ...(selectedCategory === null ? styles.categoryButtonActive : {})
                    }}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.category}
                        style={{
                            ...styles.categoryButton,
                            ...(selectedCategory === cat.category ? styles.categoryButtonActive : {})
                        }}
                        onClick={() => setSelectedCategory(cat.category)}
                    >
                        {getCategoryIcon(cat.category)} {cat.category} ({cat.count})
                    </button>
                ))}
            </div>

            {/* Plugin Grid */}
            {loading ? (
                <div style={styles.loading}>
                    <span style={styles.spinner}>⏳</span>
                    Loading plugins...
                </div>
            ) : (
                <div style={styles.pluginGrid}>
                    {plugins
                        .filter(p => view === 'installed' ? p.status === 'installed' : true)
                        .map(plugin => (
                            <div key={plugin.id} style={styles.pluginCard}>
                                <div style={styles.pluginHeader}>
                                    <div style={styles.pluginTitle}>
                                        <span style={styles.pluginIcon}>
                                            {getCategoryIcon(plugin.category)}
                                        </span>
                                        <div>
                                            <h4 style={styles.pluginName}>
                                                {plugin.name}
                                                {plugin.verified && (
                                                    <span style={styles.verifiedBadge}>✓</span>
                                                )}
                                            </h4>
                                            <span style={styles.pluginVersion}>v{plugin.version}</span>
                                        </div>
                                    </div>
                                    {plugin.premium && (
                                        <span style={styles.premiumBadge}>
                                            💎 ${plugin.price}
                                        </span>
                                    )}
                                </div>

                                <p style={styles.pluginDescription}>{plugin.description}</p>

                                <div style={styles.pluginMeta}>
                                    <div style={styles.pluginRating}>
                                        {renderStars(Math.round(plugin.rating.average))}
                                        <span style={styles.ratingCount}>
                                            ({plugin.rating.count})
                                        </span>
                                    </div>
                                    <span style={styles.downloadCount}>
                                        ⬇️ {formatDownloads(plugin.downloads)}
                                    </span>
                                </div>

                                <div style={styles.pluginCapabilities}>
                                    {plugin.capabilities.slice(0, 2).map((cap, i) => (
                                        <span key={i} style={styles.capability}>
                                            {cap.name}
                                        </span>
                                    ))}
                                </div>

                                <div style={styles.pluginAuthor}>
                                    by {plugin.author.name}
                                    {plugin.author.verified && (
                                        <span style={styles.authorVerified}>✓</span>
                                    )}
                                </div>

                                <div style={styles.pluginActions}>
                                    {plugin.status === 'installed' ? (
                                        <button
                                            onClick={() => uninstallPlugin(plugin.id)}
                                            style={styles.uninstallButton}
                                        >
                                            🗑️ Uninstall
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => installPlugin(plugin.id)}
                                            style={styles.installButton}
                                            disabled={installing === plugin.id}
                                        >
                                            {installing === plugin.id ? '⏳ Installing...' : '📥 Install'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {!loading && plugins.length === 0 && (
                <div style={styles.emptyState}>
                    <span style={styles.emptyIcon}>🔍</span>
                    <h3>No plugins found</h3>
                    <p>Try a different search or category</p>
                </div>
            )}
        </div>
    );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '20px',
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        color: '#F9FAFB',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        height: '100%',
        overflow: 'auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    viewToggle: {
        display: 'flex',
        gap: '4px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        padding: '4px'
    },
    viewButton: {
        padding: '8px 16px',
        backgroundColor: 'transparent',
        color: '#9CA3AF',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    viewButtonActive: {
        backgroundColor: '#4B5563',
        color: 'white'
    },
    searchBar: {
        marginBottom: '16px'
    },
    searchInput: {
        width: '100%',
        padding: '12px 16px',
        backgroundColor: '#374151',
        border: '1px solid #4B5563',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        outline: 'none'
    },
    categories: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '20px'
    },
    categoryButton: {
        padding: '6px 12px',
        backgroundColor: '#374151',
        color: '#D1D5DB',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '13px',
        textTransform: 'capitalize'
    },
    categoryButtonActive: {
        backgroundColor: '#3B82F6',
        color: 'white'
    },
    pluginGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
    },
    pluginCard: {
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '12px',
        border: '1px solid #4B5563'
    },
    pluginHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
    },
    pluginTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    pluginIcon: {
        fontSize: '24px'
    },
    pluginName: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600
    },
    verifiedBadge: {
        marginLeft: '6px',
        color: '#3B82F6',
        fontSize: '12px'
    },
    pluginVersion: {
        fontSize: '12px',
        color: '#9CA3AF'
    },
    premiumBadge: {
        padding: '4px 8px',
        backgroundColor: '#8B5CF6',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600
    },
    pluginDescription: {
        fontSize: '14px',
        color: '#D1D5DB',
        marginBottom: '12px',
        lineHeight: 1.5
    },
    pluginMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    pluginRating: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
    },
    ratingCount: {
        marginLeft: '6px',
        fontSize: '12px',
        color: '#9CA3AF'
    },
    downloadCount: {
        fontSize: '13px',
        color: '#9CA3AF'
    },
    pluginCapabilities: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginBottom: '12px'
    },
    capability: {
        padding: '4px 8px',
        backgroundColor: '#4B5563',
        color: '#D1D5DB',
        borderRadius: '4px',
        fontSize: '11px'
    },
    pluginAuthor: {
        fontSize: '12px',
        color: '#9CA3AF',
        marginBottom: '12px'
    },
    authorVerified: {
        marginLeft: '4px',
        color: '#10B981'
    },
    pluginActions: {
        display: 'flex',
        gap: '8px'
    },
    installButton: {
        flex: 1,
        padding: '8px 16px',
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500
    },
    uninstallButton: {
        flex: 1,
        padding: '8px 16px',
        backgroundColor: '#EF4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 500
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        color: '#9CA3AF'
    },
    spinner: {
        fontSize: '32px',
        marginBottom: '16px'
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        textAlign: 'center',
        color: '#9CA3AF'
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    }
};

export default PluginMarketplace;
