import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';

const COMMANDS = [
    { name: '/build', description: 'Build a complete project', icon: '🏗️' },
    { name: '/debug', description: 'Detect and fix code issues', icon: '🐛' },
    { name: '/design', description: 'Generate or import UI design', icon: '🎨' },
    { name: '/deploy', description: 'Deploy website or app', icon: '🚀' },
    { name: '/evolve', description: 'Improve agent intelligence', icon: '🧬' },
    { name: '/analyze', description: 'Analyze files or code', icon: '🔍' },
];

// Optimized helper function to extract code blocks from markdown
const extractCodeFromResponse = (text: string): string | null => {
    const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
};

// Fast function to remove code blocks from text
const stripCodeBlocks = (text: string): string => {
    return text.replace(/```[\s\S]*?```/g, '[Code sent to Code tab]').trim();
};

export default function PromptEditor() {
    const { messages, addMessage, setCodeContent, setActiveTab } = useAppStore();
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCommands, setShowCommands] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    useEffect(() => {
        console.log('✅ PromptEditor mounted. Messages count:', messages.length);
        console.log('✅ Store functions available:', {
            addMessage: !!addMessage,
            setCodeContent: !!setCodeContent,
            setActiveTab: !!setActiveTab
        });
    }, []);

    // Fetch AI suggestions when prompt changes
    useEffect(() => {
        if (prompt.length > 10 && !isProcessing && !prompt.startsWith('/')) {
            const timeout = setTimeout(async () => {
                setIsLoadingSuggestions(true);
                try {
                    // Check if promptSuggestions API exists
                    const api = (window as any).shadowAPI?.promptSuggestions;
                    if (!api?.getSuggestions) {
                        setAiSuggestions([]);
                        return;
                    }
                    const suggestions = await api.getSuggestions(prompt);
                    setAiSuggestions(suggestions.slice(0, 3)); // Max 3 suggestions
                } catch (error) {
                    console.error('Failed to get AI suggestions:', error);
                    setAiSuggestions([]);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            }, 1000); // Debounce for 1 second
            return () => clearTimeout(timeout);
        } else {
            setAiSuggestions([]);
            setIsLoadingSuggestions(false);
        }
    }, [prompt, isProcessing]);

    const handleSubmit = async () => {
        if (!prompt.trim()) return;

        const userPrompt = prompt.trim();
        setPrompt(''); // Clear immediately for better UX
        setIsProcessing(true);

        // Add user message immediately
        addMessage({
            role: 'user' as const,
            content: userPrompt,
        });

        try {
            const isCommand = userPrompt.startsWith('/');

            if (isCommand) {
                const [command, ...args] = userPrompt.split(' ');
                const result = await window.shadowAPI.executeCommand(command, {
                    task: args.join(' '),
                });

                addMessage({
                    role: 'agent',
                    content: JSON.stringify(result, null, 2),
                });
            } else {
                // Send to AI
                const response = await window.shadowAPI.chat([{
                    role: 'user',
                    content: userPrompt,
                    timestamp: new Date()
                }]);

                // Fast code extraction (optimized regex)
                const code = extractCodeFromResponse(response);
                const isHTML = code && code.includes('<');

                // Update UI immediately
                if (code) {
                    setCodeContent(code);
                    setActiveTab(isHTML ? 'preview' : 'code');
                }

                // Add message (stripped of code)
                addMessage({
                    role: 'agent',
                    content: code ? stripCodeBlocks(response) : response
                });
            }
        } catch (error: any) {
            addMessage({
                role: 'system',
                content: `Error: ${error.message}`,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }

        if (prompt.startsWith('/') && !showCommands) {
            setShowCommands(true);
        } else if (!prompt.startsWith('/') && showCommands) {
            setShowCommands(false);
        }
    };

    const insertCommand = (command: string) => {
        setPrompt(command + ' ');
        setShowCommands(false);
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Header */}
            <div className="p-4 border-b border-neon-cyan/20">
                <h2 className="text-lg font-semibold text-neon-cyan">Smart Prompt Editor</h2>
                <p className="text-xs text-gray-500 mt-1">
                    Type a command or natural language prompt
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-2">Try typing or ask a question</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <motion.div
                            key={`${msg.role}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-neon-cyan/10 border border-neon-cyan/30 ml-8'
                                : msg.role === 'system'
                                    ? 'bg-red-500/10 border border-red-500/30'
                                    : 'bg-gray-800/50 border border-gray-700/30 mr-8'
                                }`}
                        >
                            <div className="text-xs text-gray-400 mb-1">
                                {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Shadow AI'}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Command Palette */}
            {showCommands && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-2 cyber-panel"
                >
                    <div className="text-xs text-gray-400 mb-2">Available Commands:</div>
                    <div className="space-y-1">
                        {COMMANDS.filter((cmd) => cmd.name.startsWith(prompt)).map((cmd) => (
                            <button
                                key={cmd.name}
                                onClick={() => insertCommand(cmd.name)}
                                className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 transition-colors flex items-center space-x-2"
                            >
                                <span>{cmd.icon}</span>
                                <span className="text-neon-cyan font-mono">{cmd.name}</span>
                                <span className="text-xs text-gray-500">{cmd.description}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-neon-cyan/20 bg-gray-900">
                {/* DIAGNOSTIC PANEL */}
                <div style={{
                    background: '#000',
                    color: '#0f0',
                    padding: '10px',
                    marginBottom: '10px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    border: '1px solid #0f0'
                }}>
                    🔍 DIAGNOSTICS:<br />
                    • isProcessing: {isProcessing ? 'TRUE (BLOCKING!)' : 'false'}<br />
                    • prompt length: {prompt.length}<br />
                    • prompt value: "{prompt}"
                </div>

                {/* TEST: Simple HTML Input (not textarea) */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: 'yellow', marginBottom: '5px' }}>⚠️ TEST INPUT (should work):</div>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => {
                            console.log('✅ INPUT WORKS! Value:', e.target.value);
                            setPrompt(e.target.value);
                        }}
                        placeholder="Try typing here..."
                        style={{
                            width: '100%',
                            height: '40px',
                            padding: '10px',
                            backgroundColor: '#1f2937',
                            border: '3px solid yellow',
                            borderRadius: '5px',
                            color: '#ffffff',
                            fontSize: '16px'
                        }}
                    />
                </div>

                {/* Google AI Prompt Suggestions */}
                {(aiSuggestions.length > 0 || isLoadingSuggestions) && prompt.length > 10 && !isProcessing && (
                    <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="text-xs text-blue-400 font-semibold mb-2">
                            💡 Google AI Suggestions:
                            {isLoadingSuggestions && <span className="ml-2 animate-pulse">●●●</span>}
                        </div>
                        {isLoadingSuggestions && aiSuggestions.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">Generating suggestions...</div>
                        ) : (
                            <div className="text-xs text-gray-300 space-y-1">
                                {aiSuggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="cursor-pointer hover:text-blue-300 transition-colors"
                                        onClick={() => setPrompt(suggestion)}
                                    >
                                        • {suggestion}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Original Textarea */}
                <div className="flex space-x-2">
                    <textarea
                        value={prompt}
                        onChange={(e) => {
                            console.log('✅ TEXTAREA works! Value:', e.target.value);
                            setPrompt(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        onMouseDown={(e) => {
                            console.log('✅ Mouse down on textarea');
                            e.stopPropagation();
                        }}
                        onFocus={() => console.log('✅ Textarea focused')}
                        placeholder="Original textarea..."
                        disabled={isProcessing}
                        style={{
                            width: '100%',
                            height: '80px',
                            padding: '12px',
                            backgroundColor: '#1f2937',
                            border: '2px solid #06b6d4',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'none',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing || !prompt.trim()}
                        className="cyber-button px-6"
                    >
                        {isProcessing ? '⏳' : '▶'}
                    </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    Press Enter to send • Check diagnostics above
                </div>
            </div>
        </div>
    );
}
