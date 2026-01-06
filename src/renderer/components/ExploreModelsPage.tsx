import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ExploreModelsPage.css';

interface ProviderConfig {
    id: string;
    name: string;
    icon: string;
    iconColor: string;
    description: string;
    apiKeyUrl?: string;
    fields: {
        id: string;
        label: string;
        placeholder: string;
        type: 'text' | 'password';
    }[];
}

interface LocalModelConfig {
    id: string;
    name: string;
    icon: string;
    iconColor: string;
    description: string;
    downloadUrl?: string;
    fields: {
        id: string;
        label: string;
        placeholder: string;
        type: 'text' | 'select';
        options?: string[];
    }[];
    installed?: boolean;
    active?: boolean;
}

const PROVIDERS: ProviderConfig[] = [
    {
        id: 'groq',
        name: 'Groq',
        icon: '⚡',
        iconColor: '#f97316',
        description: 'Groq offers a high-performance AI inference engine designed for low-latency and efficient processing. Optimized for real-time applications, Groq\'s technology is ideal for users who need fast responses from open, large language models and other AI workloads.',
        apiKeyUrl: 'https://groq.com/',
        fields: [
            { id: 'apiKey', label: 'API Key', placeholder: 'enter $API_KEY', type: 'password' }
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI',
        icon: '⚙️',
        iconColor: '#10b981',
        description: 'OpenAI provides access to advanced AI models, including GPT-4 supporting a wide range of applications, from conversational AI to content generation and code completion.',
        apiKeyUrl: 'https://openai.com/',
        fields: [
            { id: 'apiKey', label: 'API Key', placeholder: 'enter $API_KEY', type: 'password' }
        ]
    },
    {
        id: 'mistral',
        name: 'Mistral',
        icon: '🌊',
        iconColor: '#f59e0b',
        description: 'Mistral AI specializes in efficient, open-weight language models optimized for various natural language processing tasks. Their models are designed for flexibility and performance, making them a solid option for applications requiring scalable AI solutions.',
        apiKeyUrl: 'https://mistral.ai/',
        fields: [
            { id: 'apiKey', label: 'API Key', placeholder: 'enter $API_KEY', type: 'password' }
        ]
    },
    {
        id: 'custom',
        name: 'Custom',
        icon: '🔧',
        iconColor: '#6b7280',
        description: 'The custom provider option allows users to connect their own OpenAI-compatible AI models or third-party inference services. This is useful for organizations with proprietary models or those leveraging niche AI providers not listed here.',
        fields: [
            { id: 'apiKey', label: 'API Key', placeholder: 'enter $API_KEY', type: 'password' },
            { id: 'baseUrl', label: 'Base Url', placeholder: 'enter $BASE_URL', type: 'text' },
            { id: 'modelName', label: 'Model Name', placeholder: 'enter $MODEL_NAME', type: 'text' }
        ]
    }
];

const LOCAL_MODELS: LocalModelConfig[] = [
    {
        id: 'ollama',
        name: 'Ollama',
        icon: '🦙',
        iconColor: '#8b5cf6',
        description: 'Ollama is a lightweight, local AI runtime that makes it easy to run large language models on your machine. It supports GGUF models and provides a simple API for chat and completion, with automatic GPU acceleration when available.',
        downloadUrl: 'https://ollama.ai/',
        fields: [
            { id: 'endpoint', label: 'Endpoint', placeholder: 'http://localhost:11434', type: 'text' },
            { id: 'model', label: 'Model Name', placeholder: 'llama3.2', type: 'text' }
        ]
    },
    {
        id: 'lmstudio',
        name: 'LM Studio',
        icon: '🎯',
        iconColor: '#3b82f6',
        description: 'LM Studio is a powerful desktop application for running local LLMs. It provides a user-friendly interface for model management, supports multiple model formats including GGUF and safetensors, and offers an OpenAI-compatible API server.',
        downloadUrl: 'https://lmstudio.ai/',
        fields: [
            { id: 'endpoint', label: 'API Endpoint', placeholder: 'http://localhost:1234/v1', type: 'text' },
            { id: 'model', label: 'Model Name', placeholder: 'local-model', type: 'text' }
        ]
    },
    {
        id: 'gpt4all',
        name: 'GPT4All',
        icon: '🖥️',
        iconColor: '#22c55e',
        description: 'GPT4All is an open-source ecosystem for running local AI models. It provides easy model downloading, CPU and GPU inference, and supports a variety of open-weight models optimized for desktop performance without requiring cloud access.',
        downloadUrl: 'https://gpt4all.io/',
        fields: [
            { id: 'modelPath', label: 'Model Path', placeholder: '/path/to/model.gguf', type: 'text' },
            { id: 'device', label: 'Device', placeholder: 'CPU', type: 'select', options: ['CPU', 'GPU', 'Metal'] }
        ]
    },
    {
        id: 'llamacpp',
        name: 'llama.cpp',
        icon: '⚡',
        iconColor: '#ef4444',
        description: 'llama.cpp is a highly optimized C++ implementation for running LLaMA models locally. It supports GGUF quantized models, multiple backends (CPU, CUDA, Metal, ROCm), and provides excellent performance on consumer hardware.',
        downloadUrl: 'https://github.com/ggerganov/llama.cpp',
        fields: [
            { id: 'modelPath', label: 'Model Path', placeholder: '/path/to/model.gguf', type: 'text' },
            { id: 'contextSize', label: 'Context Size', placeholder: '4096', type: 'text' },
            { id: 'gpuLayers', label: 'GPU Layers', placeholder: '0', type: 'text' }
        ]
    },
    {
        id: 'mlx',
        name: 'MLX (Apple)',
        icon: '🍎',
        iconColor: '#a855f7',
        description: 'MLX is Apple\'s machine learning framework optimized for Apple Silicon. Run models locally with native Metal acceleration on M1/M2/M3 Macs. Supports safetensors format and provides excellent performance for local inference.',
        downloadUrl: 'https://github.com/ml-explore/mlx',
        fields: [
            { id: 'modelPath', label: 'Model Path', placeholder: '/path/to/mlx-model', type: 'text' },
            { id: 'model', label: 'Model Name', placeholder: 'mistral-7b-mlx', type: 'text' }
        ]
    },
    {
        id: 'custom-local',
        name: 'Custom Local',
        icon: '🔧',
        iconColor: '#6b7280',
        description: 'Configure a custom local model runtime. Use this option to connect to any OpenAI-compatible local server or custom inference endpoint running on your machine or local network.',
        fields: [
            { id: 'endpoint', label: 'API Endpoint', placeholder: 'http://localhost:8080/v1', type: 'text' },
            { id: 'model', label: 'Model Name', placeholder: 'custom-model', type: 'text' },
            { id: 'apiKey', label: 'API Key (optional)', placeholder: 'sk-...', type: 'text' }
        ]
    }
];

const HUGGINGFACE_MODELS: LocalModelConfig[] = [
    {
        id: 'hf-transformers',
        name: 'Transformers',
        icon: '🤗',
        iconColor: '#fcd34d',
        description: 'Use HuggingFace Transformers library to run models locally. Supports thousands of open-source models including LLaMA, Mistral, Falcon, and more. Requires Python and the transformers library installed.',
        downloadUrl: 'https://huggingface.co/models',
        fields: [
            { id: 'modelId', label: 'Model ID', placeholder: 'meta-llama/Llama-2-7b-chat-hf', type: 'text' },
            { id: 'device', label: 'Device', placeholder: 'cuda', type: 'select', options: ['cpu', 'cuda', 'mps'] },
            { id: 'tokenPath', label: 'HF Token (optional)', placeholder: 'hf_...', type: 'text' }
        ]
    },
    {
        id: 'hf-tgi',
        name: 'Text Generation Inference',
        icon: '🚀',
        iconColor: '#ec4899',
        description: 'HuggingFace Text Generation Inference (TGI) is a high-performance inference server. It supports continuous batching, tensor parallelism, and streaming. Ideal for production-grade local deployments.',
        downloadUrl: 'https://huggingface.co/docs/text-generation-inference',
        fields: [
            { id: 'endpoint', label: 'TGI Endpoint', placeholder: 'http://localhost:8080', type: 'text' },
            { id: 'model', label: 'Model Name', placeholder: 'tgi-model', type: 'text' }
        ]
    },
    {
        id: 'hf-gguf',
        name: 'GGUF Models',
        icon: '📦',
        iconColor: '#06b6d4',
        description: 'Download and run quantized GGUF models from HuggingFace. These models are optimized for CPU inference and work great with llama.cpp, Ollama, and other GGUF-compatible runtimes.',
        downloadUrl: 'https://huggingface.co/models?library=gguf',
        fields: [
            { id: 'modelId', label: 'Model ID', placeholder: 'TheBloke/Llama-2-7B-GGUF', type: 'text' },
            { id: 'quantization', label: 'Quantization', placeholder: 'Q4_K_M', type: 'select', options: ['Q2_K', 'Q3_K_M', 'Q4_K_M', 'Q5_K_M', 'Q6_K', 'Q8_0'] },
            { id: 'downloadPath', label: 'Download Path', placeholder: '~/models/', type: 'text' }
        ]
    },
    {
        id: 'hf-custom',
        name: 'Custom HF Model',
        icon: '🔧',
        iconColor: '#6b7280',
        description: 'Configure a custom HuggingFace model with specific settings. Use this for private models, gated models, or custom configurations not covered by other options.',
        fields: [
            { id: 'modelId', label: 'Model ID', placeholder: 'organization/model-name', type: 'text' },
            { id: 'revision', label: 'Revision', placeholder: 'main', type: 'text' },
            { id: 'tokenPath', label: 'HF Token', placeholder: 'hf_...', type: 'text' }
        ]
    }
];

type TabType = 'gpt4all' | 'remote' | 'huggingface';

interface ExploreModelsPageProps {
    onBack?: () => void;
    onInstall?: (providerId: string, config: Record<string, string>) => void;
}

export default function ExploreModelsPage({ onBack, onInstall }: ExploreModelsPageProps) {
    const [activeTab, setActiveTab] = useState<TabType>('remote');
    const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
    const [installingProvider, setInstallingProvider] = useState<string | null>(null);
    const [installedModels, setInstalledModels] = useState<Set<string>>(new Set());
    const [activeModel, setActiveModel] = useState<string | null>(null);

    useEffect(() => {
        // Load installed models from backend
        const loadInstalledModels = async () => {
            try {
                const api = (window as any).shadowAPI;
                if (api?.getInstalledModels) {
                    const models = await api.getInstalledModels();
                    setInstalledModels(new Set(models));
                }
                if (api?.getActiveModel) {
                    const active = await api.getActiveModel();
                    setActiveModel(active);
                }
            } catch (e) {
                console.log('Could not load installed models');
            }
        };
        loadInstalledModels();
    }, []);

    const handleInputChange = useCallback((providerId: string, fieldId: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [providerId]: {
                ...(prev[providerId] || {}),
                [fieldId]: value
            }
        }));
    }, []);

    const handleInstall = useCallback(async (providerId: string, isLocal: boolean = false) => {
        const providerData = formData[providerId] || {};
        setInstallingProvider(providerId);

        try {
            const api = (window as any).shadowAPI;

            if (isLocal) {
                // Local model installation
                if (api?.configureLocalModel) {
                    await api.configureLocalModel(providerId, providerData);
                }
            } else {
                // Remote provider
                if (api?.setApiKey) {
                    await api.setApiKey(providerId, providerData.apiKey || '');
                }
            }

            setInstalledModels(prev => new Set([...prev, providerId]));
            onInstall?.(providerId, providerData);
            console.log(`✅ ${providerId} configured successfully`);
        } catch (error) {
            console.error(`Failed to configure ${providerId}:`, error);
        } finally {
            setInstallingProvider(null);
        }
    }, [formData, onInstall]);

    const handleActivate = useCallback(async (providerId: string) => {
        try {
            const api = (window as any).shadowAPI;
            if (api?.activateModel) {
                await api.activateModel(providerId);
                setActiveModel(providerId);
                console.log(`✅ ${providerId} activated`);
            }
        } catch (error) {
            console.error(`Failed to activate ${providerId}:`, error);
        }
    }, []);

    const renderProviderCard = (provider: ProviderConfig) => {
        const providerFormData = formData[provider.id] || {};
        const isInstalling = installingProvider === provider.id;
        const isInstalled = installedModels.has(provider.id);

        return (
            <motion.div
                key={provider.id}
                className="provider-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="provider-card-header">
                    <span className="provider-icon" style={{ color: provider.iconColor }}>
                        {provider.icon}
                    </span>
                    <span className="provider-name">{provider.name}</span>
                    {isInstalled && <span className="installed-badge">✓ Configured</span>}
                </div>

                <p className="provider-description">{provider.description}</p>

                {provider.apiKeyUrl && (
                    <p className="api-key-link">
                        Get your API key: <a href={provider.apiKeyUrl} target="_blank" rel="noopener noreferrer">{provider.apiKeyUrl}</a>
                    </p>
                )}

                <div className="provider-form">
                    {provider.fields.map(field => (
                        <div key={field.id}>
                            <label className="form-label">{field.label}</label>
                            <input
                                type={field.type}
                                className="form-input"
                                placeholder={field.placeholder}
                                value={providerFormData[field.id] || ''}
                                onChange={(e) => handleInputChange(provider.id, field.id, e.target.value)}
                            />
                        </div>
                    ))}

                    <button
                        className="install-button"
                        onClick={() => handleInstall(provider.id)}
                        disabled={isInstalling}
                    >
                        {isInstalling ? 'Installing...' : isInstalled ? 'Update' : 'Install'}
                    </button>
                </div>
            </motion.div>
        );
    };

    const renderLocalModelCard = (model: LocalModelConfig) => {
        const modelFormData = formData[model.id] || {};
        const isInstalling = installingProvider === model.id;
        const isInstalled = installedModels.has(model.id);
        const isActive = activeModel === model.id;

        return (
            <motion.div
                key={model.id}
                className={`provider-card ${isActive ? 'active-model' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="provider-card-header">
                    <span className="provider-icon" style={{ color: model.iconColor }}>
                        {model.icon}
                    </span>
                    <span className="provider-name">{model.name}</span>
                    {isInstalled && <span className="installed-badge">✓ Configured</span>}
                    {isActive && <span className="active-badge">● Active</span>}
                </div>

                <p className="provider-description">{model.description}</p>

                {model.downloadUrl && (
                    <p className="api-key-link">
                        Download: <a href={model.downloadUrl} target="_blank" rel="noopener noreferrer">{model.downloadUrl}</a>
                    </p>
                )}

                <div className="provider-form">
                    {model.fields.map(field => (
                        <div key={field.id}>
                            <label className="form-label">{field.label}</label>
                            {field.type === 'select' && field.options ? (
                                <select
                                    className="form-input form-select"
                                    value={modelFormData[field.id] || ''}
                                    onChange={(e) => handleInputChange(model.id, field.id, e.target.value)}
                                >
                                    <option value="">{field.placeholder}</option>
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={field.placeholder}
                                    value={modelFormData[field.id] || ''}
                                    onChange={(e) => handleInputChange(model.id, field.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}

                    <div className="button-group">
                        <button
                            className="install-button"
                            onClick={() => handleInstall(model.id, true)}
                            disabled={isInstalling}
                        >
                            {isInstalling ? 'Configuring...' : isInstalled ? 'Update' : 'Configure'}
                        </button>
                        {isInstalled && !isActive && (
                            <button
                                className="activate-button"
                                onClick={() => handleActivate(model.id)}
                            >
                                Activate
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'gpt4all':
                return (
                    <>
                        <p className="explore-models-subtitle">
                            Run AI models locally on your machine without internet connection. Configure local runtimes and model paths.
                        </p>
                        <div className="provider-cards-grid">
                            {LOCAL_MODELS.map(renderLocalModelCard)}
                        </div>
                    </>
                );
            case 'huggingface':
                return (
                    <>
                        <p className="explore-models-subtitle">
                            Access thousands of open-source models from HuggingFace. Download and run models locally or connect to inference servers.
                        </p>
                        <div className="provider-cards-grid">
                            {HUGGINGFACE_MODELS.map(renderLocalModelCard)}
                        </div>
                    </>
                );
            case 'remote':
            default:
                return (
                    <>
                        <p className="explore-models-subtitle">
                            Various remote model providers that use network resources for inference.
                        </p>
                        <div className="provider-cards-grid">
                            {PROVIDERS.map(renderProviderCard)}
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="explore-models-page">
            {/* Header with back button */}
            <div className="explore-models-header">
                <button className="back-button" onClick={onBack}>
                    ← Existing Models
                </button>
            </div>

            {/* Title */}
            <div className="explore-models-title">
                <h1>Explore Models</h1>
            </div>

            {/* Tabs */}
            <div className="explore-models-tabs">
                <button
                    className={`explore-models-tab ${activeTab === 'gpt4all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gpt4all')}
                >
                    Local Models
                </button>
                <button
                    className={`explore-models-tab ${activeTab === 'remote' ? 'active' : ''}`}
                    onClick={() => setActiveTab('remote')}
                >
                    Remote Providers
                </button>
                <button
                    className={`explore-models-tab ${activeTab === 'huggingface' ? 'active' : ''}`}
                    onClick={() => setActiveTab('huggingface')}
                >
                    HuggingFace
                </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderTabContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
