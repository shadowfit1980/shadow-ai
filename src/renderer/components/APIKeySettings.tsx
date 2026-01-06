/**
 * API Key Settings Component
 * 
 * Manage API keys for all AI providers
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface APIProvider {
    id: string;
    name: string;
    icon: string;
    keyPrefix?: string;
    docsUrl: string;
}

const providers: APIProvider[] = [
    { id: 'openai', name: 'OpenAI', icon: '🟢', keyPrefix: 'sk-', docsUrl: 'https://platform.openai.com/api-keys' },
    { id: 'anthropic', name: 'Anthropic', icon: '🧠', keyPrefix: 'sk-ant-', docsUrl: 'https://console.anthropic.com/' },
    { id: 'gemini', name: 'Google Gemini', icon: '💎', keyPrefix: 'AIza', docsUrl: 'https://aistudio.google.com/' },
    { id: 'mistral', name: 'Mistral AI', icon: '🌊', docsUrl: 'https://console.mistral.ai/' },
    { id: 'cohere', name: 'Cohere', icon: '🔷', docsUrl: 'https://dashboard.cohere.com/' },
    { id: 'groq', name: 'Groq', icon: '⚡', keyPrefix: 'gsk_', docsUrl: 'https://console.groq.com/' },
    { id: 'together', name: 'Together AI', icon: '🤝', docsUrl: 'https://api.together.xyz/' },
    { id: 'deepseek', name: 'DeepSeek', icon: '🔍', docsUrl: 'https://platform.deepseek.com/' },
    { id: 'openrouter', name: 'OpenRouter', icon: '🔄', keyPrefix: 'sk-or-', docsUrl: 'https://openrouter.ai/' },
];

const APIKeySettings: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});

    useEffect(() => {
        loadKeys();
    }, []);

    const loadKeys = async () => {
        try {
            const savedKeys = await (window as any).shadowAPI?.settings?.getApiKeys?.();
            if (savedKeys) {
                setKeys(savedKeys);
            }
        } catch (err) {
            console.error('Failed to load API keys:', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await (window as any).shadowAPI?.settings?.saveApiKeys?.(keys);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save API keys:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (providerId: string) => {
        setTesting(providerId);
        try {
            const result = await (window as any).shadowAPI?.settings?.testApiKey?.(providerId, keys[providerId]);
            setTestResults(prev => ({ ...prev, [providerId]: result }));
        } catch {
            setTestResults(prev => ({ ...prev, [providerId]: false }));
        } finally {
            setTesting(null);
        }
    };

    const toggleShowKey = (id: string) => {
        setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const maskKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '••••••••';
        return key.slice(0, 4) + '••••••••' + key.slice(-4);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.overlay}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                style={styles.modal}
            >
                <div style={styles.header}>
                    <h2 style={styles.title}>🔑 API Key Settings</h2>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div style={styles.content}>
                    <p style={styles.description}>
                        Configure API keys to enable AI providers. Keys are stored securely and encrypted.
                    </p>

                    <div style={styles.providerList}>
                        {providers.map((provider) => (
                            <div key={provider.id} style={styles.providerCard}>
                                <div style={styles.providerHeader}>
                                    <span style={styles.providerIcon}>{provider.icon}</span>
                                    <span style={styles.providerName}>{provider.name}</span>
                                    <a
                                        href={provider.docsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={styles.docsLink}
                                    >
                                        Docs →
                                    </a>
                                </div>
                                <div style={styles.inputRow}>
                                    <input
                                        type={showKey[provider.id] ? 'text' : 'password'}
                                        value={showKey[provider.id] ? (keys[provider.id] || '') : maskKey(keys[provider.id] || '')}
                                        onChange={(e) => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                        placeholder={provider.keyPrefix ? `${provider.keyPrefix}...` : 'Enter API key'}
                                        style={styles.input}
                                    />
                                    <button
                                        onClick={() => toggleShowKey(provider.id)}
                                        style={styles.toggleBtn}
                                    >
                                        {showKey[provider.id] ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                    <button
                                        onClick={() => handleTest(provider.id)}
                                        disabled={!keys[provider.id] || testing === provider.id}
                                        style={{
                                            ...styles.testBtn,
                                            opacity: keys[provider.id] ? 1 : 0.5,
                                        }}
                                    >
                                        {testing === provider.id ? '...' :
                                            testResults[provider.id] === true ? '✅' :
                                                testResults[provider.id] === false ? '❌' : 'Test'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                        {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Keys'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#161b22',
        borderRadius: '12px',
        border: '1px solid #30363d',
        width: '600px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #30363d',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        color: '#e6edf3',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        color: '#8b949e',
        cursor: 'pointer',
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: '20px',
    },
    description: {
        color: '#8b949e',
        fontSize: '14px',
        marginBottom: '20px',
    },
    providerList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    providerCard: {
        backgroundColor: '#0d1117',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid #30363d',
    },
    providerHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
    },
    providerIcon: {
        fontSize: '18px',
        marginRight: '8px',
    },
    providerName: {
        fontWeight: 500,
        color: '#e6edf3',
        flex: 1,
    },
    docsLink: {
        fontSize: '12px',
        color: '#58a6ff',
        textDecoration: 'none',
    },
    inputRow: {
        display: 'flex',
        gap: '8px',
    },
    input: {
        flex: 1,
        backgroundColor: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '8px 12px',
        color: '#e6edf3',
        fontSize: '13px',
        fontFamily: 'monospace',
    },
    toggleBtn: {
        backgroundColor: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '8px',
        cursor: 'pointer',
    },
    testBtn: {
        backgroundColor: '#238636',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '12px',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 20px',
        borderTop: '1px solid #30363d',
    },
    cancelBtn: {
        backgroundColor: '#21262d',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '8px 16px',
        color: '#e6edf3',
        cursor: 'pointer',
    },
    saveBtn: {
        backgroundColor: '#238636',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 20px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 500,
    },
};

export default APIKeySettings;
