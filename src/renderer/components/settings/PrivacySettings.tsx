/**
 * Privacy Settings Component
 * UI for managing privacy modes (Cloud/Hybrid/Local)
 */

import React, { useState, useEffect } from 'react';
import './PrivacySettings.css';

type PrivacyMode = 'cloud' | 'hybrid' | 'local';

interface PrivacySettingsState {
    mode: PrivacyMode;
    sendTelemetry: boolean;
    sendCrashReports: boolean;
    allowExternalConnections: boolean;
    localModelEndpoint: string;
    storeChatsLocally: boolean;
    encryptLocalData: boolean;
}

interface LocalModelStatus {
    available: boolean;
    models: string[];
}

export const PrivacySettings: React.FC = () => {
    const [settings, setSettings] = useState<PrivacySettingsState>({
        mode: 'cloud',
        sendTelemetry: true,
        sendCrashReports: true,
        allowExternalConnections: true,
        localModelEndpoint: 'http://localhost:11434',
        storeChatsLocally: true,
        encryptLocalData: true,
    });

    const [localStatus, setLocalStatus] = useState<LocalModelStatus>({ available: false, models: [] });
    const [isCheckingLocal, setIsCheckingLocal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
        checkLocalModels();
    }, []);

    const loadSettings = async () => {
        try {
            const result = await window.electronAPI?.invoke('privacy:get');
            if (result?.success) {
                setSettings(result.settings);
            }
        } catch (error) {
            console.error('Failed to load privacy settings:', error);
        }
    };

    const checkLocalModels = async () => {
        setIsCheckingLocal(true);
        try {
            const result = await window.electronAPI?.invoke('privacy:checkLocal');
            if (result?.success) {
                setLocalStatus(result.status);
            }
        } catch (error) {
            console.error('Failed to check local models:', error);
        }
        setIsCheckingLocal(false);
    };

    const handleModeChange = async (mode: PrivacyMode) => {
        const newSettings = { ...settings, mode };

        // Auto-adjust settings based on mode
        if (mode === 'local') {
            newSettings.sendTelemetry = false;
            newSettings.allowExternalConnections = false;
        }

        setSettings(newSettings);
        await saveSettings(newSettings);
    };

    const handleSettingChange = async (key: keyof PrivacySettingsState, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        await saveSettings(newSettings);
    };

    const saveSettings = async (newSettings: PrivacySettingsState) => {
        setIsSaving(true);
        try {
            await window.electronAPI?.invoke('privacy:set', newSettings);
        } catch (error) {
            console.error('Failed to save privacy settings:', error);
        }
        setIsSaving(false);
    };

    const getModeInfo = (mode: PrivacyMode) => {
        switch (mode) {
            case 'cloud':
                return {
                    icon: '☁️',
                    title: 'Cloud',
                    description: 'Full cloud features enabled. Best performance and model selection.',
                    features: ['Access to GPT-4, Claude 3, Gemini', 'Fastest responses', 'Auto-updates'],
                };
            case 'hybrid':
                return {
                    icon: '🔄',
                    title: 'Hybrid',
                    description: 'Uses local models when available, cloud as fallback.',
                    features: ['Privacy-first approach', 'Cloud fallback for quality', 'Balanced performance'],
                };
            case 'local':
                return {
                    icon: '🔒',
                    title: 'Local Only',
                    description: 'All processing on your device. No data leaves your machine.',
                    features: ['Maximum privacy', 'Works offline', 'Requires Ollama'],
                };
        }
    };

    return (
        <div className="privacy-settings">
            <div className="privacy-header">
                <h2>🔐 Privacy Mode</h2>
                <p className="privacy-subtitle">
                    Control how your code and data are processed
                </p>
            </div>

            <div className="mode-selector">
                {(['cloud', 'hybrid', 'local'] as PrivacyMode[]).map((mode) => {
                    const info = getModeInfo(mode);
                    const isSelected = settings.mode === mode;

                    return (
                        <div
                            key={mode}
                            className={`mode-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleModeChange(mode)}
                        >
                            <div className="mode-icon">{info.icon}</div>
                            <div className="mode-title">{info.title}</div>
                            <div className="mode-description">{info.description}</div>
                            <ul className="mode-features">
                                {info.features.map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                            {isSelected && <div className="mode-selected-indicator">✓</div>}
                        </div>
                    );
                })}
            </div>

            {settings.mode === 'local' && (
                <div className="local-model-status">
                    <h3>Local Model Status</h3>
                    <div className="status-row">
                        <span className={`status-indicator ${localStatus.available ? 'online' : 'offline'}`}>
                            {localStatus.available ? '● Online' : '○ Offline'}
                        </span>
                        <button
                            onClick={checkLocalModels}
                            disabled={isCheckingLocal}
                            className="refresh-btn"
                        >
                            {isCheckingLocal ? 'Checking...' : 'Refresh'}
                        </button>
                    </div>

                    {localStatus.available ? (
                        <div className="available-models">
                            <p>Available models: {localStatus.models.length}</p>
                            <ul>
                                {localStatus.models.slice(0, 5).map((model, i) => (
                                    <li key={i}>{model}</li>
                                ))}
                                {localStatus.models.length > 5 && (
                                    <li className="more">+{localStatus.models.length - 5} more</li>
                                )}
                            </ul>
                        </div>
                    ) : (
                        <div className="ollama-install-prompt">
                            <p>Ollama is not running.</p>
                            <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">
                                Install Ollama →
                            </a>
                        </div>
                    )}
                </div>
            )}

            <div className="settings-section">
                <h3>Additional Settings</h3>

                <label className="setting-row">
                    <div className="setting-info">
                        <span className="setting-name">Send anonymous usage data</span>
                        <span className="setting-description">Help us improve Shadow AI</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.sendTelemetry}
                        onChange={(e) => handleSettingChange('sendTelemetry', e.target.checked)}
                        disabled={settings.mode === 'local'}
                    />
                </label>

                <label className="setting-row">
                    <div className="setting-info">
                        <span className="setting-name">Send crash reports</span>
                        <span className="setting-description">Automatically report errors</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.sendCrashReports}
                        onChange={(e) => handleSettingChange('sendCrashReports', e.target.checked)}
                        disabled={settings.mode === 'local'}
                    />
                </label>

                <label className="setting-row">
                    <div className="setting-info">
                        <span className="setting-name">Store chats locally</span>
                        <span className="setting-description">Keep conversation history on your device</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.storeChatsLocally}
                        onChange={(e) => handleSettingChange('storeChatsLocally', e.target.checked)}
                    />
                </label>

                <label className="setting-row">
                    <div className="setting-info">
                        <span className="setting-name">Encrypt local data</span>
                        <span className="setting-description">Protect stored data with encryption</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.encryptLocalData}
                        onChange={(e) => handleSettingChange('encryptLocalData', e.target.checked)}
                    />
                </label>
            </div>

            {isSaving && <div className="saving-indicator">Saving...</div>}
        </div>
    );
};

export default PrivacySettings;
