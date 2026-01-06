/**
 * Sync Settings Component
 * 
 * Cloud sync configuration and status UI
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SyncConfig {
    provider: 'local' | 'firebase' | 's3' | 'supabase';
    endpoint?: string;
    apiKey?: string;
    bucket?: string;
    autoSync: boolean;
    syncInterval: number;
}

interface SyncStatus {
    lastSync: Date | null;
    itemsSynced: number;
    status: 'idle' | 'syncing' | 'error' | 'conflict';
    error?: string;
    conflicts: number;
}

const SyncSettings: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [config, setConfig] = useState<SyncConfig>({
        provider: 'local',
        autoSync: false,
        syncInterval: 30,
    });
    const [status, setStatus] = useState<SyncStatus>({
        lastSync: null,
        itemsSynced: 0,
        status: 'idle',
        conflicts: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        loadConfig();
        loadStatus();
    }, []);

    const loadConfig = async () => {
        try {
            const saved = await (window as any).shadowAPI?.cloudSync?.getConfig?.();
            if (saved) setConfig(saved);
        } catch (err) {
            console.error('Failed to load config:', err);
        }
    };

    const loadStatus = async () => {
        try {
            const s = await (window as any).shadowAPI?.cloudSync?.getStatus?.();
            if (s) setStatus(s);
        } catch (err) {
            console.error('Failed to load status:', err);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await (window as any).shadowAPI?.cloudSync?.configure?.(config);
        } catch (err) {
            console.error('Failed to save config:', err);
        }
        setIsSaving(false);
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setStatus(prev => ({ ...prev, status: 'syncing' }));
        try {
            const result = await (window as any).shadowAPI?.cloudSync?.sync?.();
            setStatus(result);
        } catch (err) {
            setStatus(prev => ({ ...prev, status: 'error', error: (err as Error).message }));
        }
        setIsSyncing(false);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    };

    const providers = [
        { id: 'local', name: 'Local Only', icon: '💾' },
        { id: 'firebase', name: 'Firebase', icon: '🔥' },
        { id: 's3', name: 'AWS S3', icon: '☁️' },
        { id: 'supabase', name: 'Supabase', icon: '⚡' },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.overlay}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>☁️ Cloud Sync Settings</h2>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.content}>
                    {/* Status Card */}
                    <div style={styles.statusCard}>
                        <div style={styles.statusRow}>
                            <span>Status:</span>
                            <span style={{
                                color: status.status === 'idle' ? '#3fb950' :
                                    status.status === 'syncing' ? '#58a6ff' :
                                        status.status === 'error' ? '#f85149' : '#d29922'
                            }}>
                                {status.status === 'idle' && '✓ Up to date'}
                                {status.status === 'syncing' && '⟳ Syncing...'}
                                {status.status === 'error' && '✗ Error'}
                                {status.status === 'conflict' && '⚠ Conflicts'}
                            </span>
                        </div>
                        <div style={styles.statusRow}>
                            <span>Last sync:</span>
                            <span>{formatDate(status.lastSync)}</span>
                        </div>
                        <div style={styles.statusRow}>
                            <span>Items synced:</span>
                            <span>{status.itemsSynced}</span>
                        </div>
                        {status.conflicts > 0 && (
                            <div style={styles.statusRow}>
                                <span>Conflicts:</span>
                                <span style={{ color: '#d29922' }}>{status.conflicts}</span>
                            </div>
                        )}
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            style={styles.syncBtn}
                        >
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>

                    {/* Provider Selection */}
                    <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Sync Provider</h4>
                        <div style={styles.providerGrid}>
                            {providers.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setConfig({ ...config, provider: p.id as any })}
                                    style={{
                                        ...styles.providerCard,
                                        border: config.provider === p.id ?
                                            '2px solid #58a6ff' : '2px solid #30363d',
                                    }}
                                >
                                    <span style={styles.providerIcon}>{p.icon}</span>
                                    <span>{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Provider Config */}
                    {config.provider !== 'local' && (
                        <div style={styles.section}>
                            <h4 style={styles.sectionTitle}>Configuration</h4>

                            {config.provider === 'firebase' && (
                                <input
                                    type="text"
                                    value={config.endpoint || ''}
                                    onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                                    placeholder="Firebase Project URL"
                                    style={styles.input}
                                />
                            )}

                            {config.provider === 's3' && (
                                <>
                                    <input
                                        type="text"
                                        value={config.bucket || ''}
                                        onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                                        placeholder="S3 Bucket Name"
                                        style={styles.input}
                                    />
                                    <input
                                        type="password"
                                        value={config.apiKey || ''}
                                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                        placeholder="AWS Secret Key"
                                        style={{ ...styles.input, marginTop: '8px' }}
                                    />
                                </>
                            )}

                            {config.provider === 'supabase' && (
                                <>
                                    <input
                                        type="text"
                                        value={config.endpoint || ''}
                                        onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                                        placeholder="Supabase Project URL"
                                        style={styles.input}
                                    />
                                    <input
                                        type="password"
                                        value={config.apiKey || ''}
                                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                        placeholder="Supabase API Key"
                                        style={{ ...styles.input, marginTop: '8px' }}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* Auto Sync */}
                    <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Auto Sync</h4>
                        <label style={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={config.autoSync}
                                onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                            />
                            <span>Enable automatic sync</span>
                        </label>
                        {config.autoSync && (
                            <div style={styles.intervalRow}>
                                <span>Sync every</span>
                                <input
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={config.syncInterval}
                                    onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) })}
                                    style={styles.intervalInput}
                                />
                                <span>minutes</span>
                            </div>
                        )}
                    </div>

                    <button onClick={handleSave} disabled={isSaving} style={styles.saveBtn}>
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#161b22', borderRadius: '12px', border: '1px solid #30363d', width: '500px', maxHeight: '80vh', overflow: 'hidden' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #30363d' },
    title: { margin: 0, fontSize: '18px', color: '#e6edf3' },
    closeBtn: { background: 'none', border: 'none', fontSize: '24px', color: '#8b949e', cursor: 'pointer' },
    content: { padding: '20px', overflowY: 'auto', maxHeight: 'calc(80vh - 70px)' },
    statusCard: { backgroundColor: '#0d1117', borderRadius: '8px', padding: '16px', marginBottom: '20px' },
    statusRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8b949e', marginBottom: '8px' },
    syncBtn: { width: '100%', marginTop: '12px', padding: '10px', backgroundColor: '#238636', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' },
    section: { marginBottom: '20px' },
    sectionTitle: { margin: '0 0 12px', fontSize: '14px', color: '#e6edf3' },
    providerGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' },
    providerCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', backgroundColor: '#0d1117', borderRadius: '8px', cursor: 'pointer', color: '#e6edf3', fontSize: '12px' },
    providerIcon: { fontSize: '24px' },
    input: { width: '100%', padding: '10px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', color: '#e6edf3', fontSize: '13px' },
    toggle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e6edf3', cursor: 'pointer' },
    intervalRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px', color: '#8b949e' },
    intervalInput: { width: '60px', padding: '6px', backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '4px', color: '#e6edf3', textAlign: 'center' },
    saveBtn: { width: '100%', padding: '12px', backgroundColor: '#238636', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontSize: '14px' },
};

export default SyncSettings;
