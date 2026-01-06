import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const [apiKeys, setApiKeys] = useState({
        openai: '',
        anthropic: '',
        mistral: '',
        deepseek: '',
        gemini: '',
        openrouter: '',
        ollama: '',
    });

    const [localModels, setLocalModels] = useState({
        ollamaUrl: 'http://localhost:11434',
        lmStudioUrl: 'http://localhost:1234',
        gpt4allPath: '',
    });

    const [externalServices, setExternalServices] = useState({
        canvaClientId: '',
        canvaClientSecret: '',
        supabaseUrl: '',
        supabaseKey: '',
        figmaToken: '',
    });

    const [mcpRunning, setMCPRunning] = useState(false);
    const [mcpAutoStart, setMCPAutoStart] = useState(false);
    const [activeTab, setActiveTab] = useState<'cloud' | 'local' | 'services'>('cloud');
    const [savedMessage, setSavedMessage] = useState<string | null>(null);
    const [onRefreshModels, setOnRefreshModels] = useState<(() => void) | null>(null);

    useEffect(() => {
        loadSettings();
        checkMCPStatus();
    }, []);

    const loadSettings = async () => {
        // Load saved keys
        const savedKeys = {
            openai: localStorage.getItem('api_key_openai') || '',
            anthropic: localStorage.getItem('api_key_anthropic') || '',
            mistral: localStorage.getItem('api_key_mistral') || '',
            deepseek: localStorage.getItem('api_key_deepseek') || '',
            gemini: localStorage.getItem('api_key_gemini') || '',
            openrouter: localStorage.getItem('api_key_openrouter') || '',
            ollama: localStorage.getItem('api_key_ollama') || '',
        };
        setApiKeys(savedKeys);

        const savedLocal = {
            ollamaUrl: localStorage.getItem('local_ollamaUrl') || 'http://localhost:11434',
            lmStudioUrl: localStorage.getItem('local_lmStudioUrl') || 'http://localhost:1234',
            gpt4allPath: localStorage.getItem('local_gpt4allPath') || '',
        };
        setLocalModels(savedLocal);

        const savedServices = {
            canvaClientId: localStorage.getItem('service_canvaClientId') || '',
            canvaClientSecret: localStorage.getItem('service_canvaClientSecret') || '',
            supabaseUrl: localStorage.getItem('service_supabaseUrl') || '',
            supabaseKey: localStorage.getItem('service_supabaseKey') || '',
            figmaToken: localStorage.getItem('service_figmaToken') || '',
        };
        setExternalServices(savedServices);

        const savedAutoStart = localStorage.getItem('mcp_auto_start') === 'true';
        setMCPAutoStart(savedAutoStart);
    };

    const checkMCPStatus = async () => {
        if (window.shadowAPI && window.shadowAPI.getMCPStatus) {
            const status = await window.shadowAPI.getMCPStatus();
            setMCPRunning(status.running);
        }
    };

    const toggleMCPServer = async () => {
        try {
            if (mcpRunning) {
                await window.shadowAPI.stopMCPServer();
                setMCPRunning(false);
                setSavedMessage('MCP Server stopped.');
            } else {
                await window.shadowAPI.startMCPServer();
                setMCPRunning(true);
                setSavedMessage('MCP Server started!');
            }
            setTimeout(() => setSavedMessage(null), 3000);
        } catch (error: any) {
            alert(`MCP Error: ${error.message}`);
        }
    };

    const handleSetMCPAutoStart = async (autoStart: boolean) => {
        setMCPAutoStart(autoStart);
        localStorage.setItem('mcp_auto_start', String(autoStart));
        if (window.shadowAPI && window.shadowAPI.setMCPAutoStart) {
            await window.shadowAPI.setMCPAutoStart(autoStart);
            setSavedMessage(`MCP auto-start ${autoStart ? 'enabled' : 'disabled'}.`);
            setTimeout(() => setSavedMessage(null), 3000);
        }
    };

    const handleSaveApiKey = async (provider: string) => {
        const key = apiKeys[provider as keyof typeof apiKeys];
        if (!key || key.trim() === '') {
            alert('Please enter an API key');
            return;
        }

        // Save to localStorage
        localStorage.setItem(`api_key_${provider}`, key);

        // Send to main process to update ModelManager
        try {
            if (window.shadowAPI && window.shadowAPI.updateApiKeys) {
                const allKeys = {
                    openai: localStorage.getItem('api_key_openai') || '',
                    anthropic: localStorage.getItem('api_key_anthropic') || '',
                    mistral: localStorage.getItem('api_key_mistral') || '',
                    deepseek: localStorage.getItem('api_key_deepseek') || '',
                    gemini: localStorage.getItem('api_key_gemini') || '',
                    openrouter: localStorage.getItem('api_key_openrouter') || '',
                    ollama: localStorage.getItem('api_key_ollama') || '',
                };

                const models = await window.shadowAPI.updateApiKeys(allKeys);
                setSavedMessage(`${provider.toUpperCase()} API key saved! ${models.length} models available`);

                // Trigger model refresh in parent component
                if (onRefreshModels) {
                    setTimeout(() => onRefreshModels(), 500);
                }
            } else {
                setSavedMessage(`${provider.toUpperCase()} API key saved!`);
            }
        } catch (error) {
            console.error('Failed to update API keys:', error);
            setSavedMessage(`${provider.toUpperCase()} saved (restart app to activate)`);
        }

        setTimeout(() => setSavedMessage(null), 3000);
    };

    const handleSaveLocalModel = (setting: string) => {
        const value = localModels[setting as keyof typeof localModels];
        localStorage.setItem(`local_${setting}`, value);
        setSavedMessage(`${setting} saved!`);
        setTimeout(() => setSavedMessage(null), 3000);
    };

    const handleSaveExternalService = (service: string) => {
        const value = externalServices[service as keyof typeof externalServices];
        if (!value || value.trim() === '') {
            alert(`Please enter a value for ${service}`);
            return;
        }
        localStorage.setItem(`service_${service}`, value);
        setSavedMessage(`${service} saved securely!`);
        setTimeout(() => setSavedMessage(null), 3000);
    };

    useEffect(() => {
        // Load saved keys
        const savedKeys = {
            openai: localStorage.getItem('api_key_openai') || '',
            anthropic: localStorage.getItem('api_key_anthropic') || '',
            mistral: localStorage.getItem('api_key_mistral') || '',
            deepseek: localStorage.getItem('api_key_deepseek') || '',
            gemini: localStorage.getItem('api_key_gemini') || '',
            openrouter: localStorage.getItem('api_key_openrouter') || '',
            ollama: localStorage.getItem('api_key_ollama') || '',
        };
        setApiKeys(savedKeys);

        const savedLocal = {
            ollamaUrl: localStorage.getItem('local_ollamaUrl') || 'http://localhost:11434',
            lmStudioUrl: localStorage.getItem('local_lmStudioUrl') || 'http://localhost:1234',
            gpt4allPath: localStorage.getItem('local_gpt4allPath') || '',
        };
        setLocalModels(savedLocal);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="cyber-panel w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-950">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-semibold text-neon-cyan">⚙️ Settings</h2>
                        {savedMessage && (
                            <div className="text-sm text-green-400 bg-green-500/20 px-3 py-1 rounded border border-green-500/50">
                                ✓ {savedMessage}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('cloud')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeTab === 'cloud'
                            ? 'text-neon-cyan border-b-2 border-neon-cyan'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        ☁️ Cloud Models
                    </button>
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeTab === 'local'
                            ? 'text-neon-cyan border-b-2 border-neon-cyan'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        💻 Local Models
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeTab === 'services'
                            ? 'text-neon-cyan border-b-2 border-neon-cyan'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        🔌 Services
                    </button>
                </div>

                {/* MCP Server Section */}
                <div className="space-y-4 p-6 border-b border-gray-800">
                    <h3 className="text-lg font-semibold text-neon-cyan">MCP Server</h3>

                    {/* MCP Status */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="font-medium text-gray-200">MCP Server Status</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Model Context Protocol server for external tools
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${mcpRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                <span className="text-sm font-medium">
                                    {mcpRunning ? 'Running' : 'Stopped'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleMCPServer}
                                className={`cyber-button text-sm px-4 py-2 ${mcpRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {mcpRunning ? '🛑 Stop Server' : '▶️ Start Server'}
                            </button>

                            <button
                                onClick={() => window.open('http://localhost:3001', '_blank')}
                                className="cyber-button-secondary text-sm px-4 py-2"
                                disabled={!mcpRunning}
                            >
                                🔍 Inspector
                            </button>
                        </div>

                        {mcpRunning && (
                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
                                <div className="font-semibold text-blue-400 mb-1">✅ MCP Server Active</div>
                                <div className="text-gray-300">
                                    Available tools: generate_code, import_figma, query_database, create_canva_design
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Auto-start Option */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div>
                                <div className="font-medium text-gray-200">Auto-start MCP Server</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Start MCP server automatically when app launches
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={mcpAutoStart}
                                onChange={(e) => handleSetMCPAutoStart(e.target.checked)}
                                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-neon-cyan focus:ring-neon-cyan"
                            />
                        </label>
                    </div>

                    {/* MCP Info */}
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="text-sm text-gray-300 space-y-2">
                            <div className="font-semibold text-neon-cyan mb-2">📚 What is MCP?</div>
                            <p>Model Context Protocol allows other AI applications to use Shadow AI's tools.</p>
                            <div className="mt-3 space-y-1 text-xs">
                                <div>✅ Use Shadow AI from Claude Desktop</div>
                                <div>✅ Expose code generation to other apps</div>
                                <div>✅ Share Figma, Supabase, Canva services</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'cloud' && (
                        <div className="space-y-6">
                            <div className="text-sm text-gray-400 mb-4">
                                Add your API keys to enable cloud AI models. Keys are stored locally and never sent anywhere except to the respective AI providers.
                            </div>

                            {/* OpenAI */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    OpenAI API Key
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        value={apiKeys.openai}
                                        onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                                        placeholder="sk-..."
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveApiKey('openai')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-neon-cyan hover:underline">platform.openai.com</a>
                                </p>
                            </div>

                            {/* Anthropic */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Anthropic API Key (Claude)
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        value={apiKeys.anthropic}
                                        onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                                        placeholder="sk-ant-..."
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveApiKey('anthropic')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your key from <a href="https://console.anthropic.com/" target="_blank" className="text-neon-cyan hover:underline">console.anthropic.com</a>
                                </p>
                            </div>

                            {/* Mistral */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Mistral API Key
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        value={apiKeys.mistral}
                                        onChange={(e) => setApiKeys({ ...apiKeys, mistral: e.target.value })}
                                        placeholder="..."
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveApiKey('mistral')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your key from <a href="https://console.mistral.ai/" target="_blank" className="text-neon-cyan hover:underline">console.mistral.ai</a>
                                </p>
                            </div>

                            {/* DeepSeek */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    DeepSeek API Key
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        value={apiKeys.deepseek}
                                        onChange={(e) => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
                                        placeholder="..."
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveApiKey('deepseek')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your key from <a href="https://platform.deepseek.com/" target="_blank" className="text-neon-cyan hover:underline">platform.deepseek.com</a>
                                </p>
                            </div>

                            {/* Gemini */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Google Gemini API Key
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        value={apiKeys.gemini}
                                        onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                                        placeholder="..."
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveApiKey('gemini')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-neon-cyan hover:underline">Google AI Studio</a>
                                </p>
                            </div>

                            {/* OpenRouter */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    OpenRouter API Key
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        value={apiKeys.openrouter}
                                        onChange={(e) => setApiKeys({ ...apiKeys, openrouter: e.target.value })}
                                        placeholder="sk-or-v1-..."
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveApiKey('openrouter')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">openrouter.ai/keys</a>
                                    <br />
                                    <span className="text-blue-400">💡 Access GPT-4, Claude, Gemini, Llama and more with one key!</span>
                                </p>
                            </div>

                            {/* Ollama Cloud */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    🦙 Ollama Cloud API Key
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        value={apiKeys.ollama}
                                        onChange={(e) => setApiKeys({ ...apiKeys, ollama: e.target.value })}
                                        placeholder="Enter your Ollama API key..."
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveApiKey('ollama')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    For cloud-hosted Ollama services. Leave empty to use local Ollama instance.
                                    <br />
                                    <span className="text-green-400">🚀 Access Llama, CodeLlama, Mistral, and more via cloud!</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'local' && (
                        <div className="space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300 mb-4">
                                ℹ️ <strong>Local AI Servers:</strong> These settings are for configuring local AI model servers like Ollama or LM Studio that run on your computer.
                                You need to install and run these applications separately - they're not for loading .gguf files directly.
                            </div>

                            {/* Ollama */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Ollama URL
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={localModels.ollamaUrl}
                                        onChange={(e) => setLocalModels({ ...localModels, ollamaUrl: e.target.value })}
                                        placeholder="http://localhost:11434"
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveLocalModel('ollamaUrl')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Install Ollama from <a href="https://ollama.ai/" target="_blank" className="text-neon-cyan hover:underline">ollama.ai</a>
                                </p>
                            </div>

                            {/* LM Studio */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    LM Studio URL
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={localModels.lmStudioUrl}
                                        onChange={(e) => setLocalModels({ ...localModels, lmStudioUrl: e.target.value })}
                                        placeholder="http://localhost:1234"
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveLocalModel('lmStudioUrl')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Download from <a href="https://lmstudio.ai/" target="_blank" className="text-neon-cyan hover:underline">lmstudio.ai</a>
                                </p>
                            </div>

                            {/* GPT4All */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    GPT4All Model Path
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={localModels.gpt4allPath}
                                        onChange={(e) => setLocalModels({ ...localModels, gpt4allPath: e.target.value })}
                                        placeholder="/path/to/model.gguf"
                                        className="cyber-input flex-1"
                                    />
                                    <button
                                        onClick={() => handleSaveLocalModel('gpt4allPath')}
                                        className="cyber-button text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Download from <a href="https://gpt4all.io/" target="_blank" className="text-neon-cyan hover:underline">gpt4all.io</a>
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'services' && (
                        <div className="space-y-6">
                            <div className="text-sm text-gray-400 mb-4">
                                Configure external services to enable advanced features like Canva design creation, Firebase/Supabase data storage, and Figma imports.
                                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300">
                                    🔒 All credentials are encrypted using machine-ID based keys and stored securely.
                                </div>
                            </div>

                            {/* Canva */}
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-neon-cyan mb-3">🎨 Canva API</h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Client ID
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={externalServices.canvaClientId}
                                                onChange={(e) => setExternalServices({ ...externalServices, canvaClientId: e.target.value })}
                                                placeholder="Enter Canva Client ID"
                                                className="cyber-input flex-1"
                                            />
                                            <button
                                                onClick={() => handleSaveExternalService('canvaClientId')}
                                                className="cyber-button text-sm"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Client Secret
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="password"
                                                value={externalServices.canvaClientSecret}
                                                onChange={(e) => setExternalServices({ ...externalServices, canvaClientSecret: e.target.value })}
                                                placeholder="Enter Canva Client Secret"
                                                className="cyber-input flex-1"
                                            />
                                            <button
                                                onClick={() => handleSaveExternalService('canvaClientSecret')}
                                                className="cyber-button text-sm"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                                    Get your credentials from <a href="https://www.canva.com/developers/apps" target="_blank" className="text-neon-cyan hover:underline">Canva Developers Portal</a>
                                </p>
                            </div>

                            {/* Supabase/Firebase */}
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-neon-cyan mb-3">🔥 Supabase / Firebase</h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Project URL
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={externalServices.supabaseUrl}
                                                onChange={(e) => setExternalServices({ ...externalServices, supabaseUrl: e.target.value })}
                                                placeholder="https://your-project.supabase.co"
                                                className="cyber-input flex-1"
                                            />
                                            <button
                                                onClick={() => handleSaveExternalService('supabaseUrl')}
                                                className="cyber-button text-sm"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            API Key (anon public)
                                        </label>
                                        <div className="flex space-x-2">
                                            <input
                                                type="password"
                                                value={externalServices.supabaseKey}
                                                onChange={(e) => setExternalServices({ ...externalServices, supabaseKey: e.target.value })}
                                                placeholder="eyJhbGci..."
                                                className="cyber-input flex-1"
                                            />
                                            <button
                                                onClick={() => handleSaveExternalService('supabaseKey')}
                                                className="cyber-button text-sm"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                                    Get your credentials from <a href="https://app.supabase.com/" target="_blank" className="text-neon-cyan hover:underline">Supabase Dashboard</a> → Settings → API
                                </p>
                            </div>

                            {/* Figma */}
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-neon-cyan mb-3">🎨 Figma API</h3>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Personal Access Token
                                    </label>
                                    <div className="flex space-x-2">
                                        <input
                                            type="password"
                                            value={externalServices.figmaToken}
                                            onChange={(e) => setExternalServices({ ...externalServices, figmaToken: e.target.value })}
                                            placeholder="figd_..."
                                            className="cyber-input flex-1"
                                        />
                                        <button
                                            onClick={() => handleSaveExternalService('figmaToken')}
                                            className="cyber-button text-sm"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500 mt-3">
                                    Generate a token from <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" className="text-neon-cyan hover:underline">Figma Account Settings</a> → Personal Access Tokens
                                </p>
                            </div>

                            {/* Features Enabled */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                <div className="font-semibold text-blue-400 mb-2">✨ Features Enabled:</div>
                                <div className="text-xs text-gray-300 space-y-1">
                                    <div>🎨 <strong>Canva:</strong> Generate and export designs directly from the agent</div>
                                    <div>🔥 <strong>Supabase:</strong> Store and sync project data in real-time database</div>
                                    <div>🎨 <strong>Figma:</strong> Import Figma designs and export to code</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 flex justify-end space-x-2">
                    <button onClick={onClose} className="cyber-button text-sm">
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
