import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { detectCodingIntent, getActionOrientedPrompt } from '../utils/codingIntent';

interface Message {
    role: 'user' | 'agent' | 'system';
    content: string;
}

export default function AutonomousChatV2() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { setCodeContent, setActiveTab } = useAppStore();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    // AI Suggestion Enhancement
    useEffect(() => {
        if (input.length > 5) {
            setIsLoadingSuggestion(true);
            const timeout = setTimeout(async () => {
                try {
                    const api = (window as any).shadowAPI?.promptSuggestions;
                    if (api?.enhance) {
                        // enhance returns a string directly, not an object
                        const enhanced = await api.enhance(input);
                        console.log('[Suggestions] Got enhanced:', enhanced);
                        if (enhanced && enhanced !== input && enhanced.length > input.length) {
                            setSuggestion(enhanced);
                        } else {
                            setSuggestion('');
                        }
                    } else {
                        console.log('[Suggestions] API not available');
                    }
                } catch (error) {
                    console.error('Failed to get AI suggestion:', error);
                    setSuggestion('');
                } finally {
                    setIsLoadingSuggestion(false);
                }
            }, 800); // Debounce 800ms
            return () => clearTimeout(timeout);
        } else {
            setSuggestion('');
            setIsLoadingSuggestion(false);
        }
    }, [input]);

    const addMessage = (message: Message) => {
        setMessages(prev => [...prev, message]);
    };

    const extractCode = (text: string): string | null => {
        const patterns = [
            /```(?:javascript|typescript|tsx|jsx|html|css|python|java|go|rust)?[\s\n]+([\s\S]*?)```/gi,
            /```([\s\S]*?)```/g
        ];

        const allMatches: string[] = [];
        for (const pattern of patterns) {
            let match;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(text)) !== null) {
                const codeContent = match[1]?.trim();
                if (codeContent && codeContent.length > 10) {
                    if (!allMatches.some(m => m === codeContent)) {
                        allMatches.push(codeContent);
                    }
                }
            }
        }

        if (allMatches.length > 0) {
            return allMatches.reduce((a, b) => a.length > b.length ? a : b);
        }
        return null;
    };

    const stripCode = (text: string): string => {
        let stripped = text.replace(/```[\w]*\s*[\s\S]*?```/g, '\n✅ [Code generated - see Code tab]\n');
        return stripped.replace(/\n{3,}/g, '\n\n').trim();
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;

        const userPrompt = input.trim();
        setInput('');
        setIsProcessing(true);

        addMessage({ role: 'user', content: userPrompt });

        try {
            // 🎯 STEP 1: Detect coding intent
            const codingIntent = detectCodingIntent(userPrompt);

            console.log('🚀 Intent:', codingIntent);

            // 🎯 STEP 2: Handle slash commands for direct project creation
            if (codingIntent.shouldCode && codingIntent.action === 'create_project') {
                addMessage({
                    role: 'system',
                    content: `🚀 Creating project: "${codingIntent.params.description}"...\n⏳ This may take a moment...`
                });

                // Try autonomous project creation
                try {
                    // Use window.shadowAPI if available
                    if ((window as any).shadowAPI?.project?.create) {
                        const result = await (window as any).shadowAPI.project.create(
                            codingIntent.params.description,
                            './'
                        );

                        if (result.success) {
                            addMessage({
                                role: 'agent',
                                content: `✅ Project created!\n📁 Location: ${result.projectPath}\n📝 Files: ${result.filesCreated.join(', ')}\n⚡ Setup complete!`
                            });
                            setIsProcessing(false);
                            return;
                        }
                    }
                } catch (error: any) {
                    console.warn('Autonomous creation failed, falling back to AI:', error.message);
                }
            }

            // 🐳 STEP 2.5: Handle Docker commands
            if (codingIntent.shouldCode && codingIntent.action === 'docker_command') {
                const { subCommand, args } = codingIntent.params;

                addMessage({
                    role: 'system',
                    content: `🐳 Docker ${subCommand}...`
                });

                try {
                    const api = (window as any).shadowAPI;

                    if (subCommand === 'build') {
                        const result = await api?.docker?.build?.('./', args || 'shadow-ai-app');
                        if (result?.success) {
                            addMessage({
                                role: 'agent',
                                content: `✅ Docker image built!\n🏷️ Image: ${result.imageName}:latest\n📦 Ready to run with: docker run ${result.imageName}`
                            });
                        } else {
                            addMessage({
                                role: 'system',
                                content: `❌ Docker build failed: ${result?.error || 'Unknown error'}`
                            });
                        }
                    } else if (subCommand === 'run') {
                        const result = await api?.docker?.run?.(args || 'shadow-ai-app');
                        if (result?.success) {
                            addMessage({
                                role: 'agent',
                                content: `✅ Container running!\n🆔 Container: ${result.containerId?.substring(0, 12)}\n🌐 Port: ${result.port}\n🔗 URL: http://localhost:${result.port}`
                            });
                        } else {
                            addMessage({
                                role: 'system',
                                content: `❌ Docker run failed: ${result?.error || 'Unknown error'}`
                            });
                        }
                    } else if (subCommand === 'status') {
                        const result = await api?.docker?.status?.();
                        if (result?.success) {
                            addMessage({
                                role: 'agent',
                                content: `🐳 Docker Status:\n📦 Version: ${result.version}\n🏃 Running: ${result.containers?.join(', ') || 'No containers'}`
                            });
                        } else {
                            addMessage({
                                role: 'system',
                                content: `⚠️ Docker not running. Start Docker Desktop first.`
                            });
                        }
                    }

                    setIsProcessing(false);
                    return;
                } catch (error: any) {
                    addMessage({
                        role: 'system',
                        content: `❌ Docker error: ${error.message}`
                    });
                }
            }

            // 📱 STEP 2.7: Handle Flutter commands
            if (codingIntent.shouldCode && codingIntent.action === 'flutter_command') {
                const { subCommand, args } = codingIntent.params;

                addMessage({
                    role: 'system',
                    content: `📱 Flutter ${subCommand}...`
                });

                try {
                    const api = (window as any).shadowAPI;

                    if (subCommand === 'create') {
                        const projectName = args || 'my_flutter_app';
                        const result = await api?.flutter?.create?.(projectName);
                        if (result?.success) {
                            addMessage({
                                role: 'agent',
                                content: `✅ Flutter project created!\n📁 Project: ${result.projectName}\n📂 Path: ${result.projectPath}\n🚀 Run with: /flutter run`
                            });
                        } else {
                            addMessage({
                                role: 'system',
                                content: `❌ Flutter create failed: ${result?.error || 'Unknown error'}`
                            });
                        }
                    } else if (subCommand === 'run') {
                        const result = await api?.flutter?.run?.(args || './', 'chrome');
                        if (result?.success) {
                            addMessage({
                                role: 'agent',
                                content: `✅ Flutter app running!\n🌐 Check your browser or connected device`
                            });
                        } else {
                            addMessage({
                                role: 'system',
                                content: `❌ Flutter run failed: ${result?.error || 'Unknown error'}`
                            });
                        }
                    } else if (subCommand === 'build') {
                        const target = args || 'apk';
                        const result = await api?.flutter?.build?.('./', target);
                        if (result?.success) {
                            addMessage({
                                role: 'agent',
                                content: `✅ Flutter ${target.toUpperCase()} built!\n📁 Output: ${result.outputPath}`
                            });
                        } else {
                            addMessage({
                                role: 'system',
                                content: `❌ Flutter build failed: ${result?.error || 'Unknown error'}`
                            });
                        }
                    } else if (subCommand === 'status') {
                        const result = await api?.flutter?.status?.();
                        if (result?.success) {
                            addMessage({
                                role: 'agent',
                                content: `📱 Flutter Status:\n📦 Version: ${result.version}\n📱 Devices: ${result.devices?.join('\n') || 'No devices connected'}`
                            });
                        } else {
                            addMessage({
                                role: 'system',
                                content: `⚠️ Flutter not available: ${result?.error}`
                            });
                        }
                    }

                    setIsProcessing(false);
                    return;
                } catch (error: any) {
                    addMessage({
                        role: 'system',
                        content: `❌ Flutter error: ${error.message}`
                    });
                }
            }

            // 📤 STEP 2.6: Handle export commands
            if (codingIntent.shouldCode && codingIntent.action === 'export_code') {
                const { codeContent } = useAppStore.getState();

                if (!codeContent) {
                    addMessage({
                        role: 'system',
                        content: `⚠️ No code to export. Generate some code first!`
                    });
                    setIsProcessing(false);
                    return;
                }

                addMessage({
                    role: 'system',
                    content: `📤 Exporting code...`
                });

                try {
                    const result = await (window as any).shadowAPI?.build?.exportHtml?.(codeContent);
                    if (result?.success) {
                        addMessage({
                            role: 'agent',
                            content: `✅ Code exported!\n📁 File: ${result.outputPath}\n📊 Size: ${(result.fileSize / 1024).toFixed(1)} KB`
                        });
                    } else if (result?.error === 'Export cancelled') {
                        addMessage({
                            role: 'system',
                            content: `Export cancelled.`
                        });
                    } else {
                        addMessage({
                            role: 'system',
                            content: `❌ Export failed: ${result?.error}`
                        });
                    }
                } catch (error: any) {
                    addMessage({
                        role: 'system',
                        content: `❌ Export error: ${error.message}`
                    });
                }

                setIsProcessing(false);
                return;
            }

            // 🎯 STEP 3: Get AI response with ACTION-ORIENTED prompt
            const isCodingMode = codingIntent.shouldCode;
            const systemPrompt = {
                role: 'system' as const,
                content: getActionOrientedPrompt(isCodingMode),
                timestamp: new Date()
            };

            const conversationHistory = messages.map(msg => ({
                role: msg.role === 'agent' ? 'assistant' as const : msg.role as 'user' | 'system',
                content: msg.content,
                timestamp: new Date()
            }));

            conversationHistory.push({
                role: 'user' as const,
                content: userPrompt,
                timestamp: new Date()
            });

            const fullMessages = [systemPrompt, ...conversationHistory];

            console.log('📤 Sending', fullMessages.length, 'messages (coding mode:', isCodingMode, ')');

            // Set up streaming
            setIsStreaming(true);
            setStreamingContent('');
            let fullResponse = '';

            // Use shadowAPI for streaming if available
            if ((window as any).shadowAPI?.chatStream) {
                (window as any).shadowAPI.onStreamToken?.((data: any) => {
                    setStreamingContent(data.buffer);
                    fullResponse = data.buffer;
                });

                (window as any).shadowAPI.onStreamComplete?.(() => {
                    setIsStreaming(false);
                    (window as any).shadowAPI.removeStreamListeners?.();
                });

                (window as any).shadowAPI.onStreamError?.((data: any) => {
                    console.error('Stream error:', data.error);
                    setIsStreaming(false);
                    (window as any).shadowAPI.removeStreamListeners?.();
                });

                try {
                    fullResponse = await (window as any).shadowAPI.chatStream(fullMessages);
                } finally {
                    setIsStreaming(false);
                    setStreamingContent('');
                    (window as any).shadowAPI.removeStreamListeners?.();
                }
            } else {
                // Fallback to model.chat if no streaming
                fullResponse = await (window as any).shadowAPI?.model?.chat?.(fullMessages) || 'No AI response available.';
            }

            console.log('📥 AI Response:', fullResponse.length, 'chars');

            // 🎯 STEP 4: Extract and display code
            const code = extractCode(fullResponse);

            if (code) {
                console.log('✅ Extracted code:', code.length, 'chars');

                // Send to Code Editor
                setCodeContent(code);

                // Auto-switch to preview for HTML, code tab otherwise
                const isHTML = code.includes('<html') || code.includes('<!DOCTYPE') ||
                    (code.includes('<') && code.includes('</'));
                setActiveTab(isHTML ? 'preview' : 'code');

                // Show stripped message
                const strippedMessage = stripCode(fullResponse);
                addMessage({ role: 'agent', content: strippedMessage });
            } else {
                // No code found
                addMessage({ role: 'agent', content: fullResponse });
            }

        } catch (error: any) {
            console.error('Error:', error);
            addMessage({
                role: 'system',
                content: `❌ Error: ${error.message}`
            });
        } finally {
            setIsProcessing(false);
            setIsStreaming(false);
            setStreamingContent('');
            inputRef.current?.focus();
        }
    };

    const useSuggestion = () => {
        setInput(suggestion);
        setSuggestion('');
        inputRef.current?.focus();
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Header */}
            <div className="p-4 border-b border-neon-cyan/20">
                <h2 className="text-lg font-semibold text-neon-cyan">🤖 Autonomous Agent</h2>
                <p className="text-xs text-gray-500 mt-1">
                    Action-oriented coding agent • Slash commands: /create, /build, /code
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                {messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-gray-500 mt-8 space-y-4"
                    >
                        <p className="text-sm">👋 I'm an autonomous coding agent - I BUILD, not chat</p>
                        <div className="text-xs space-y-1">
                            <p>Try:</p>
                            <p className="text-neon-cyan">• "build a calculator app"</p>
                            <p className="text-neon-cyan">• "/create todo list"</p>
                            <p className="text-neon-cyan">• "code a snake game"</p>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, index) => (
                            <motion.div
                                key={`${msg.role}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg ${msg.role === 'user'
                                    ? 'bg-neon-cyan/10 border border-neon-cyan/30 ml-8'
                                    : msg.role === 'system'
                                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                                        : 'bg-gray-800/50 border border-gray-700/30 mr-8'
                                    }`}
                            >
                                <div className="text-xs text-gray-400 mb-1">
                                    {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : '🤖 Agent'}
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            </motion.div>
                        ))}

                        {/* Streaming indicator */}
                        {isStreaming && streamingContent && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 mr-8"
                            >
                                <div className="text-xs text-purple-400 mb-1 flex items-center">
                                    <span className="animate-pulse mr-2">●</span>
                                    🤖 Agent
                                    <span className="ml-2 text-gray-500">streaming...</span>
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{streamingContent}</div>
                            </motion.div>
                        )}

                        {isProcessing && !isStreaming && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30"
                            >
                                <div className="text-xs text-gray-400 animate-pulse">
                                    ⚙️ Processing...
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestion */}
            {(suggestion || isLoadingSuggestion) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="text-xs text-blue-400 font-semibold mb-1">
                                ✨ AI Enhancement:
                                {isLoadingSuggestion && <span className="ml-2 animate-pulse">●●●</span>}
                            </div>
                            {suggestion && <div className="text-sm text-gray-300">{suggestion}</div>}
                            {isLoadingSuggestion && !suggestion && (
                                <div className="text-sm text-gray-500 italic">Analyzing your prompt...</div>
                            )}
                        </div>
                        {suggestion && (
                            <button
                                onClick={useSuggestion}
                                className="ml-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-xs text-blue-300 transition-colors"
                            >
                                Use This
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-neon-cyan/20 bg-gray-900">
                <div className="flex space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder="What do you want to build? (or use /create, /build, /code)"
                        disabled={isProcessing}
                        autoFocus
                        className="flex-1 px-4 py-3 bg-gray-800 border-2 border-neon-cyan rounded-lg text-white text-sm outline-none focus:border-neon-cyan/80"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing || !input.trim()}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${isProcessing || !input.trim()
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-neon-cyan text-black hover:bg-neon-cyan/80'
                            }`}
                    >
                        {isProcessing ? '⏳' : '🚀'}
                    </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    Press Enter to build • Slash commands: /create, /build, /code, /react, /next
                </div>
            </div>
        </div>
    );
}
