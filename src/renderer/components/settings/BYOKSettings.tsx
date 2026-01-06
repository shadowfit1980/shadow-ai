/**
 * BYOK (Bring Your Own Key) Settings Component
 * UI for managing custom API keys for multiple providers
 */

import React, { useState, useEffect } from 'react';
import './BYOKSettings.css';

interface Provider {
    id: string;
    name: string;
    hasKey: boolean;
    isValid?: boolean;
    lastUsed?: string;
}

interface BYOKSettingsProps {
    onClose?: () => void;
}

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4, GPT-4o, GPT-3.5' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude 3 Opus, Sonnet, Haiku' },
    { id: 'google', name: 'Google AI', description: 'Gemini Pro, Gemini 2.0' },
    { id: 'mistral', name: 'Mistral AI', description: 'Mistral Large, Mixtral' },
    { id: 'groq', name: 'Groq', description: 'Llama 3, Mixtral (fast inference)' },
    { id: 'cohere', name: 'Cohere', description: 'Command R, Command R+' },
    { id: 'ollama', name: 'Ollama (Local)', description: 'Local models - no API key needed' },
];

export const BYOKSettings: React.FC<BYOKSettingsProps> = ({ onClose }) => {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProviderStatus();
    }, []);

    const loadProviderStatus = async () => {
        setIsLoading(true);
        try {
            const status = await window.electronAPI?.invoke('apikeys:list');
            if (status?.success) {
                const providerList = PROVIDERS.map(p => ({
                    id: p.id,
                    name: p.name,
                    hasKey: (status.providers || []).includes(p.id),
                    isValid: true,
                }));
                setProviders(providerList);
            }
        } catch (error) {
            console.error('Failed to load provider status:', error);
        }
        setIsLoading(false);
    };

    const handleSelectProvider = (providerId: string) => {
        setSelectedProvider(providerId);
        setApiKey('');
        setValidationResult(null);
    };

    const handleValidateKey = async () => {
        if (!selectedProvider || !apiKey) return;

        setIsValidating(true);
        setValidationResult(null);

        try {
            const result = await window.electronAPI?.invoke('apikeys:validate', {
                provider: selectedProvider,
                key: apiKey,
            });

            if (result?.success) {
                setValidationResult({
                    valid: result.valid,
                    message: result.message || (result.valid ? 'Key is valid' : 'Key is invalid'),
                });
            } else {
                setValidationResult({ valid: false, message: result?.error || 'Validation failed' });
            }
        } catch (error: any) {
            setValidationResult({ valid: false, message: error.message });
        }

        setIsValidating(false);
    };

    const handleSaveKey = async () => {
        if (!selectedProvider || !apiKey) return;

        try {
            const result = await window.electronAPI?.invoke('apikeys:set', {
                provider: selectedProvider,
                key: apiKey,
            });

            if (result?.success) {
                setApiKey('');
                setSelectedProvider(null);
                setValidationResult(null);
                await loadProviderStatus();
            }
        } catch (error) {
            console.error('Failed to save key:', error);
        }
    };

    const handleDeleteKey = async (providerId: string) => {
        if (!confirm(`Are you sure you want to remove the API key for ${providerId}?`)) return;

        try {
            await window.electronAPI?.invoke('apikeys:delete', { provider: providerId });
            await loadProviderStatus();
        } catch (error) {
            console.error('Failed to delete key:', error);
        }
    };

    const selectedProviderInfo = PROVIDERS.find(p => p.id === selectedProvider);

    return (
        <div className="byok-settings">
            <div className="byok-header">
                <h2>🔑 API Keys</h2>
                <p className="byok-subtitle">
                    Bring your own keys to use preferred AI providers
                </p>
            </div>

            {isLoading ? (
                <div className="byok-loading">Loading...</div>
            ) : (
                <>
                    <div className="provider-list">
                        {providers.map(provider => {
                            const info = PROVIDERS.find(p => p.id === provider.id);
                            return (
                                <div
                                    key={provider.id}
                                    className={`provider-item ${selectedProvider === provider.id ? 'selected' : ''} ${provider.hasKey ? 'has-key' : ''}`}
                                    onClick={() => handleSelectProvider(provider.id)}
                                >
                                    <div className="provider-info">
                                        <div className="provider-name">
                                            {provider.hasKey && <span className="key-indicator">✓</span>}
                                            {info?.name}
                                        </div>
                                        <div className="provider-description">{info?.description}</div>
                                    </div>
                                    {provider.hasKey && (
                                        <button
                                            className="delete-key-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteKey(provider.id);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {selectedProvider && selectedProvider !== 'ollama' && (
                        <div className="key-input-section">
                            <h3>Configure {selectedProviderInfo?.name}</h3>

                            <div className="input-group">
                                <label>API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={`Enter your ${selectedProviderInfo?.name} API key`}
                                    className="api-key-input"
                                />
                            </div>

                            {validationResult && (
                                <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                                    {validationResult.valid ? '✓' : '✕'} {validationResult.message}
                                </div>
                            )}

                            <div className="action-buttons">
                                <button
                                    onClick={handleValidateKey}
                                    disabled={!apiKey || isValidating}
                                    className="validate-btn"
                                >
                                    {isValidating ? 'Validating...' : 'Validate Key'}
                                </button>
                                <button
                                    onClick={handleSaveKey}
                                    disabled={!apiKey || !validationResult?.valid}
                                    className="save-btn"
                                >
                                    Save Key
                                </button>
                            </div>

                            <div className="provider-help">
                                <a
                                    href={getProviderDocsUrl(selectedProvider)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Get an API key from {selectedProviderInfo?.name} →
                                </a>
                            </div>
                        </div>
                    )}

                    {selectedProvider === 'ollama' && (
                        <div className="ollama-section">
                            <h3>Ollama (Local Models)</h3>
                            <p>Ollama runs locally and doesn't require an API key.</p>
                            <button
                                onClick={async () => {
                                    const result = await window.electronAPI?.invoke('apikeys:validate', {
                                        provider: 'ollama',
                                        key: '',
                                    });
                                    if (result?.valid) {
                                        alert(`✓ Ollama is running! Available models: ${result.models?.join(', ')}`);
                                    } else {
                                        alert('✕ Ollama is not running. Install from https://ollama.com');
                                    }
                                }}
                                className="check-ollama-btn"
                            >
                                Check Ollama Status
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

function getProviderDocsUrl(provider: string): string {
    const urls: Record<string, string> = {
        openai: 'https://platform.openai.com/api-keys',
        anthropic: 'https://console.anthropic.com/settings/keys',
        google: 'https://aistudio.google.com/app/apikey',
        mistral: 'https://console.mistral.ai/api-keys/',
        groq: 'https://console.groq.com/keys',
        cohere: 'https://dashboard.cohere.com/api-keys',
    };
    return urls[provider] || '#';
}

export default BYOKSettings;
