import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import TypingIndicator from './TypingIndicator';
import { emitAgentActivity } from './AgentActivityMonitor';
import PlanApprovalModal from './PlanApprovalModal';
import FileAttachmentUI from './chat/FileAttachmentUI';

export default function InteractiveChat() {
    const { messages, addMessage, setCodeContent, setActiveTab } = useAppStore();
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [suggestion, setSuggestion] = useState('');
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [showPlanApproval, setShowPlanApproval] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice recording states
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'transcribing' | 'error'>('idle');
    const [voiceError, setVoiceError] = useState('');
    const [audioLevel, setAudioLevel] = useState(0); // 0-100 audio level for visual feedback
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Streaming state
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');

    // Attachment state
    const [showAttachments, setShowAttachments] = useState(false);
    const [attachmentCount, setAttachmentCount] = useState(0);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize Speech Recognition as fallback
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    setInput(prev => prev + finalTranscript);
                    setVoiceTranscript('');
                } else {
                    setVoiceTranscript(interimTranscript);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                setVoiceTranscript('');
                setVoiceStatus('idle');
            };

            recognitionRef.current.onerror = (event: any) => {
                // Only show error if it's not a network error (Whisper handles those)
                // Network errors are common in Web Speech API when offline
                if (event.error !== 'network' && event.error !== 'no-speech') {
                    console.warn('Speech recognition error:', event.error);
                    setVoiceError(`Voice error: ${event.error}`);
                    setVoiceStatus('error');
                }
                setIsListening(false);
                setVoiceTranscript('');
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    // Toggle voice recording - simple MediaRecorder approach
    const toggleVoiceRecording = async () => {
        console.log('[Voice] Toggle called, isListening:', isListening);

        if (isListening) {
            // Stop recording
            console.log('[Voice] Stopping recording...');
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            return;
        }

        // Start recording
        setVoiceError('');
        setVoiceTranscript('🎤 Starting...');

        try {
            console.log('[Voice] Requesting microphone access with enhanced audio...');

            // Enhanced audio constraints for better quality
            const audioConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,      // High quality sample rate
                    channelCount: 1,         // Mono for speech
                    sampleSize: 16,          // 16-bit audio
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            console.log('[Voice] Got stream:', stream.active);

            // Log audio track settings
            const audioTrack = stream.getAudioTracks()[0];
            const settings = audioTrack.getSettings();
            console.log('[Voice] Audio settings:', {
                sampleRate: settings.sampleRate,
                channelCount: settings.channelCount,
                echoCancellation: settings.echoCancellation,
                noiseSuppression: settings.noiseSuppression,
                autoGainControl: settings.autoGainControl,
            });

            audioChunksRef.current = [];

            // Set up audio analyzer for visual feedback
            try {
                audioContextRef.current = new AudioContext();
                analyzerRef.current = audioContextRef.current.createAnalyser();
                analyzerRef.current.fftSize = 256;
                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyzerRef.current);

                // Update audio level at ~30fps
                const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
                levelIntervalRef.current = setInterval(() => {
                    if (analyzerRef.current) {
                        analyzerRef.current.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                        setAudioLevel(Math.min(100, Math.round(average * 1.5))); // Scale to 0-100
                    }
                }, 33);
            } catch (e) {
                console.warn('[Voice] Could not set up audio analyzer:', e);
            }

            // Check MediaRecorder support and use best codec
            let mimeType = 'audio/webm';
            let audioBitsPerSecond = 128000; // 128 kbps for high quality

            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
                audioBitsPerSecond = 96000; // Slightly lower for MP4
            }
            console.log('[Voice] Using mimeType:', mimeType, 'bitrate:', audioBitsPerSecond);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond
            });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                console.log('[Voice] Data available:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstart = () => {
                console.log('[Voice] Recording started');
                setIsListening(true);
                setVoiceStatus('recording');
                setVoiceTranscript('🎤 Recording... click again to stop');
            };

            mediaRecorder.onstop = async () => {
                console.log('[Voice] Recording stopped, chunks:', audioChunksRef.current.length);
                stream.getTracks().forEach(track => track.stop());
                setIsListening(false);
                setAudioLevel(0);

                // Clean up audio analyzer
                if (levelIntervalRef.current) {
                    clearInterval(levelIntervalRef.current);
                    levelIntervalRef.current = null;
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }

                if (audioChunksRef.current.length === 0) {
                    console.log('[Voice] No audio data captured');
                    setVoiceTranscript('');
                    setVoiceStatus('idle');
                    return;
                }

                setVoiceStatus('transcribing');
                setVoiceTranscript('⏳ Transcribing...');

                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                console.log('[Voice] Audio blob size:', audioBlob.size);

                try {
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    console.log('[Voice] Sending to Whisper...');

                    const result = await (window as any).shadowAPI?.whisper?.transcribe?.(arrayBuffer);
                    console.log('[Voice] Whisper result:', result);

                    if (result?.success && result?.text) {
                        setInput(prev => prev + result.text);
                        setVoiceTranscript('✓ ' + result.text.substring(0, 50) + (result.text.length > 50 ? '...' : ''));
                        setTimeout(() => setVoiceTranscript(''), 3000);
                    } else {
                        const errorMsg = result?.error || 'Transcription failed';
                        console.error('[Voice] Transcription error:', errorMsg);
                        setVoiceError(errorMsg);
                        setVoiceTranscript('');
                    }
                } catch (error: any) {
                    console.error('[Voice] Error:', error);
                    setVoiceError('Failed to transcribe: ' + error.message);
                    setVoiceTranscript('');
                } finally {
                    setVoiceStatus('idle');
                }
            };

            mediaRecorder.onerror = (event: any) => {
                console.error('[Voice] MediaRecorder error:', event.error);
                setVoiceError('Recording failed');
                setVoiceStatus('error');
                setIsListening(false);
                stream.getTracks().forEach(track => track.stop());
            };

            // Start recording with timeslice to get data periodically
            mediaRecorder.start(1000);

        } catch (error: any) {
            console.error('[Voice] Setup error:', error);
            setVoiceError(error.message || 'Microphone access denied');
            setVoiceStatus('error');
            setIsListening(false);
            setVoiceTranscript('');
        }
    };

    // Auto-improve prompt using Google AI
    useEffect(() => {
        if (input.length > 5) {
            const timeout = setTimeout(async () => {
                setIsLoadingSuggestion(true);
                try {
                    // Check if promptSuggestions API exists
                    const api = (window as any).shadowAPI?.promptSuggestions;
                    if (!api?.enhance) {
                        setSuggestion('');
                        return;
                    }
                    const enhanced = await api.enhance(input);
                    if (enhanced !== input && enhanced.length > input.length) {
                        setSuggestion(enhanced);
                    } else {
                        setSuggestion('');
                    }
                } catch (error) {
                    console.error('Failed to get AI suggestion:', error);
                    setSuggestion('');
                } finally {
                    setIsLoadingSuggestion(false);
                }
            }, 800); // Debounce for 800ms
            return () => clearTimeout(timeout);
        } else {
            setSuggestion('');
            setIsLoadingSuggestion(false);
        }
    }, [input]);

    const extractCode = (text: string): string | null => {
        console.log('[ExtractCode] Input length:', text.length);

        // Match code blocks with or without language identifier
        // Handle formats: ```js, ```javascript, ```tsx, ```html, ``` (no language), etc.
        const patterns = [
            /```(?:javascript|typescript|tsx|jsx|html|css|python|java|go|rust|c|cpp|csharp|ruby|php|json|yaml|bash|sh|sql|swift|kotlin)?[\s\n]+([\s\S]*?)```/gi,
            /```([\s\S]*?)```/g  // Fallback for any remaining code blocks
        ];

        const allMatches: string[] = [];

        for (const pattern of patterns) {
            let match;
            // Reset lastIndex for each pattern
            pattern.lastIndex = 0;

            while ((match = pattern.exec(text)) !== null) {
                const codeContent = match[1]?.trim();
                if (codeContent && codeContent.length > 10) {  // At least 10 chars
                    // Avoid duplicates
                    if (!allMatches.some(m => m === codeContent)) {
                        allMatches.push(codeContent);
                        console.log('[ExtractCode] Found code block, length:', codeContent.length);
                    }
                }
            }
        }

        if (allMatches.length > 0) {
            // Return the longest code block (likely the main implementation)
            const longestCode = allMatches.reduce((a, b) => a.length > b.length ? a : b);
            console.log('[ExtractCode] Returning longest code, length:', longestCode.length);
            return longestCode;
        }

        console.log('[ExtractCode] No code blocks found');
        return null;
    };

    const stripCode = (text: string): string => {
        // Remove all code blocks and replace with message
        let stripped = text;

        // Match triple backticks with optional language and content
        stripped = stripped.replace(/```[\w]*\s*[\s\S]*?```/g, '\n[✓ Code sent to Code tab]\n');

        // Clean up multiple newlines
        stripped = stripped.replace(/\n{3,}/g, '\n\n');

        return stripped.trim();
    };

    // INTENT DETECTION: Detect when user wants to CODE, not CHAT
    const detectCodingIntent = async (userPrompt: string): Promise<{ shouldCode: boolean; action?: string; params?: any }> => {
        const lower = userPrompt.toLowerCase().trim();

        // Slash commands - direct actions
        if (lower.startsWith('/')) {
            const parts = userPrompt.trim().split(' ');
            const command = parts[0].toLowerCase();
            const args = parts.slice(1).join(' ');

            if (command === '/create' || command === '/build') {
                return { shouldCode: true, action: 'create_project', params: { description: args } };
            }
            if (command === '/code') {
                return { shouldCode: true, action: 'generate_code', params: { task: args } };
            }
            if (command === '/react') {
                return { shouldCode: true, action: 'create_react', params: { name: args } };
            }
            if (command === '/next') {
                return { shouldCode: true, action: 'create_next', params: { name: args } };
            }
        }

        // Strong coding keywords - trigger autonomous action
        const codingKeywords = [
            'build', 'create', 'make', 'code', 'write', 'implement',
            'develop', 'generate', 'program', 'design a', 'construct'
        ];

        const hasCodeKeyword = codingKeywords.some(keyword => {
            // Check if keyword appears at start or after punctuation
            const regex = new RegExp(`(^|[\\s,.!?])${keyword}(\\s|$)`, 'i');
            return regex.test(userPrompt);
        });

        if (hasCodeKeyword) {
            // Check for app/component/project type keywords
            const projectTypes = ['app', 'website', 'component', 'page', 'dashboard', 'calculator', 'game', 'tool', 'api', 'server'];
            const hasProjectType = projectTypes.some(type => lower.includes(type));

            if (hasProjectType) {
                console.log('🚀 AUTONOMOUS MODE: Detected project creation intent');
                return { shouldCode: true, action: 'create_project', params: { description: userPrompt } };
            }

            // Otherwise, force code generation
            return { shouldCode: true, action: 'force_code_generation' };
        }

        return { shouldCode: false };
    };

    const handleServiceDetection = async (userPrompt: string): Promise<boolean> => {
        const lower = userPrompt.toLowerCase();

        // Detect Figma URL
        if (lower.includes('figma.com') && userPrompt.includes('http')) {
            const figmaUrl = userPrompt.match(/https?:\/\/[^\s]*figma\.com[^\s]*/)?.[0];
            if (figmaUrl) {
                console.log('🎨 Figma URL detected:', figmaUrl);
                try {
                    const result = await window.shadowAPI.figmaGetFile(figmaUrl);
                    if (result.success) {
                        addMessage({
                            role: 'system' as const,
                            content: `✅ Figma file loaded: ${result.data.name} \nNodes: ${Object.keys(result.data.document.children || {}).length} `
                        });
                        return true; // Service handled
                    }
                } catch (err: any) {
                    console.error('Figma error:', err);
                    addMessage({
                        role: 'system' as const,
                        content: `❌ Figma error: ${err.message} `
                    });
                    return true; // Service attempted
                }
            }
        }

        // Detect Canva design request
        if ((lower.includes('create') || lower.includes('design')) &&
            (lower.includes('presentation') || lower.includes('social') || lower.includes('post'))) {
            console.log('🎨 Canva design detected');
            const type = lower.includes('presentation') ? 'presentation' :
                lower.includes('social') ? 'social' : 'document';
            const result = await window.shadowAPI.canvaGetUrl(type);
            if (result.success) {
                addMessage({
                    role: 'system' as const,
                    content: `🎨 Create your design on Canva: ${result.url} `
                });
                return true; // Service handled
            }
        }

        // Detect database operations with specific commands
        if (lower.startsWith('/db ')) {
            console.log('💾 Database command detected');
            addMessage({
                role: 'system' as const,
                content: '💾 Database commands:\n• /db query [table] [filters]\n• /db insert [table] [data]'
            });
            return true; // Service handled
        }

        return false; // No service handled, proceed to AI
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;

        const userPrompt = input.trim();
        setInput('');
        setSuggestion('');
        setIsProcessing(true);

        // Add user message
        addMessage({
            role: 'user' as const,
            content: userPrompt,
        });

        try {
            // 🚀 STEP 1: Check for CODING INTENT (action-first approach)
            const codingIntent = await detectCodingIntent(userPrompt);

            if (codingIntent.shouldCode) {
                console.log('🎯 CODING MODE ACTIVATED:', codingIntent.action);
                emitAgentActivity('Starting autonomous coding...', 'processing');

                // Handle direct project creation
                if (codingIntent.action === 'create_project' && codingIntent.params?.description) {
                    try {
                        addMessage({
                            role: 'system' as const,
                            content: `🚀 Creating project: "${codingIntent.params.description}"...`
                        });

                        const result = await window.shadowAPI.project.create(
                            codingIntent.params.description,
                            app.getPath('documents') || './'
                        );

                        if (result.success) {
                            addMessage({
                                role: 'agent' as const,
                                content: `✅ Project created!\n📁 ${result.projectPath}\n📝 Files: ${result.filesCreated}\n⚡ Commands run: ${result.commandsRun}`
                            });
                            emitAgentActivity('Project created!', 'success');
                        }
                        setIsProcessing(false);
                        inputRef.current?.focus();
                        return;
                    } catch (error: any) {
                        console.error('Project creation error:', error);
                        // Fall through to AI if autonomous fails
                    }
                }

                // For other coding intents, FORCE code generation with stronger prompt
                console.log('⚡ Forcing code generation mode');
            }

            // STEP 2: Check for service triggers
            const serviceHandled = await handleServiceDetection(userPrompt);

            // If a service handled it, skip AI
            if (serviceHandled) {
                setIsProcessing(false);
                inputRef.current?.focus();
                return;
            }

            // Check if request requires planning
            const needsPlanning = await window.shadowAPI.requiresPlanning(userPrompt);

            if (needsPlanning) {
                // Generate plan
                emitAgentActivity('Creating implementation plan...', 'thinking');
                const planResult = await window.shadowAPI.analyzePlan(userPrompt);

                if (planResult.success && planResult.plan) {
                    // Show plan for approval
                    setCurrentPlan(planResult.plan);
                    setShowPlanApproval(true);
                    setIsProcessing(false);

                    // Add plan message
                    addMessage({
                        role: 'agent' as const,
                        content: `📋 ** Implementation Plan Created **\n\n${planResult.markdown || 'Review the plan for approval.'} `,
                    });

                    return;
                }
            }

            // Otherwise, proceed with normal AI response
            emitAgentActivity('Analyzing request...', 'thinking');

            // Build full conversation with memory - include ALL messages
            const isCodingMode = codingIntent?.shouldCode || false;

            const systemPrompt = {
                role: 'system' as const,
                content: `You are Shadow AI, an AUTONOMOUS CODING AGENT - NOT a chat assistant.

🎯 CRITICAL RULES:
${isCodingMode ? '⚡ CODING MODE ACTIVE - CODE GENERATION IS MANDATORY!' : ''}
- You are ACTION-ORIENTED: Generate code IMMEDIATELY, don't explain what you would do
- You NEVER respond with just text - ALWAYS include executable code
- If asked to build/create/make/code anything, respond with ONLY code + brief setup instructions
- DO NOT ask clarifying questions - make reasonable assumptions and CODE
- DO NOT explain concepts - DEMONSTRATE them with working code

📝 CODE FORMAT (MANDATORY):
- ALWAYS use \`\`\`language code blocks (\`\`\`html, \`\`\`javascript, \`\`\`python, etc.)
- Generate PRODUCTION-READY code - not pseudocode or snippets
- Include ALL necessary files, imports, and dependencies
- Make it RUNNABLE immediately - no placeholders like "// add code here"

💻 RESPONSE STRUCTURE:
1. Brief one-liner: "Here's a working [thing]"
2. Use proper markdown code blocks with the language specified
3. Setup instructions (if any): "Run with: npm start"

That's it. NO long explanations. NO asking questions. Just CODE.

🚫 FORBIDDEN RESPONSES:
- "Here's how you could build..." → NO, just build it
- "You would need to..." → NO, you do it
- "This would require..." → NO, include everything
- Asking for clarification → NO, make assumptions

✅ CORRECT RESPONSES:
- Full HTML file with embedded JS/CSS
- Complete React component with hooks
- Entire Python script ready to run
- Multiple files if needed (mark each with filename comments)

⚡ WHEN IN DOUBT: Generate MORE code, not less. Better to over-deliver than under-deliver.

You are NOT a helpful assistant. You are an AUTONOMOUS CODING MACHINE. ACT LIKE IT!`,
                timestamp: new Date()
            };

            // Get all previous messages for context (memory)
            const conversationHistory = messages.map(msg => ({
                role: msg.role === 'agent' ? 'assistant' as const : msg.role as 'user' | 'system',
                content: msg.content,
                timestamp: new Date()
            }));

            // Add current user message
            conversationHistory.push({
                role: 'user' as const,
                content: userPrompt,
                timestamp: new Date()
            });

            // Send with full history (memory) + system prompt
            const fullMessages = [systemPrompt, ...conversationHistory];

            console.log('📤 Sending', fullMessages.length, 'messages (with streaming)');

            // Set up streaming
            setIsStreaming(true);
            setStreamingContent('');
            let fullResponse = '';

            // Set up stream listeners
            window.shadowAPI.onStreamToken((data) => {
                setStreamingContent(data.buffer);
                fullResponse = data.buffer;
            });

            window.shadowAPI.onStreamComplete((data) => {
                console.log('📥 Stream complete:', data.response.length, 'chars');
                setIsStreaming(false);
                window.shadowAPI.removeStreamListeners();
            });

            window.shadowAPI.onStreamError((data) => {
                console.error('Stream error:', data.error);
                setIsStreaming(false);
                window.shadowAPI.removeStreamListeners();
            });

            // Start streaming
            try {
                fullResponse = await window.shadowAPI.chatStream(fullMessages);
            } finally {
                setIsStreaming(false);
                setStreamingContent('');
                window.shadowAPI.removeStreamListeners();
            }

            const response = fullResponse;
            console.log('📥 AI Response:', response.length, 'chars');

            // Emit processing status
            emitAgentActivity('Processing response...', 'processing');

            // Extract code
            const code = extractCode(response);
            console.log('📋 Extracted code:', code ? `YES (${code.length} chars)` : 'NO');

            if (code) {
                console.log('🔧 Setting code content in store...');
                // Send code to Code tab
                setCodeContent(code);
                console.log('✅ Code content set!');

                // Detect if HTML or regular code
                const isHTML = code.includes('<html') || code.includes('<!DOCTYPE') ||
                    (code.includes('<') && code.includes('</'));
                console.log('🔍 Is HTML:', isHTML);

                // Switch to appropriate tab
                const targetTab = isHTML ? 'preview' : 'code';
                console.log('🔄 Switching to tab:', targetTab);
                setActiveTab(targetTab);

                // Strip code from message
                const strippedMessage = stripCode(response);
                console.log('💬 Stripped message:', strippedMessage.substring(0, 100) + '...');

                addMessage({
                    role: 'agent' as const,
                    content: strippedMessage
                });
            } else {
                // No code, send full response
                addMessage({
                    role: 'agent' as const,
                    content: response
                });
            }

            // Emit success
            emitAgentActivity('Complete!', 'success');
        } catch (error: any) {
            // Emit error
            emitAgentActivity('Error occurred', 'error');
            addMessage({
                role: 'system' as const,
                content: `Error: ${error.message} `,
            });
        } finally {
            setIsProcessing(false);
            setIsStreaming(false);
            setStreamingContent('');
            setCurrentPlan(null);
        }
    };

    const handleApprovePlan = async () => {
        if (!currentPlan) return;
        setShowPlanApproval(false);
        setIsProcessing(true);

        try {
            emitAgentActivity('Executing plan...', 'processing');
            const result = await window.shadowAPI.executePlan(currentPlan);

            if (result.success) {
                emitAgentActivity('Plan executed!', 'success');
                addMessage({
                    role: 'agent' as const,
                    content: `✅ Completed ${result.completedSteps} steps`,
                });
            }
        } catch (error: any) {
            emitAgentActivity('Error', 'error');
            addMessage({ role: 'system' as const, content: `❌ ${error.message}` });
        } finally {
            setIsProcessing(false);
            setCurrentPlan(null);
        }
    };

    const handleRejectPlan = () => {
        setShowPlanApproval(false);
        setCurrentPlan(null);
        addMessage({ role: 'system' as const, content: '❌ Plan rejected' });
    };

    const handleModifyPlan = (feedback: string) => {
        setShowPlanApproval(false);
        addMessage({ role: 'user' as const, content: `Modify: ${feedback}` });
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
                <h2 className="text-lg font-semibold text-neon-cyan">Interactive Chat</h2>
                <p className="text-xs text-gray-500 mt-1">
                    AI-powered prompt improvement • Type and watch suggestions appear
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                {messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-gray-500 mt-8"
                    >
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-2">Start typing below - AI will improve your prompt!</p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, index) => (
                            <motion.div
                                key={`${msg.role} -${index} -${msg.content.substring(0, 20)} `}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 20
                                }}
                                className={`p - 3 rounded - lg ${msg.role === 'user'
                                    ? 'bg-neon-cyan/10 border border-neon-cyan/30 ml-8'
                                    : msg.role === 'system'
                                        ? 'bg-red-500/10 border border-red-500/30'
                                        : 'bg-gray-800/50 border border-gray-700/30 mr-8'
                                    } `}
                            >
                                <div className="text-xs text-gray-400 mb-1">
                                    {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'Shadow AI'}
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            </motion.div>
                        ))}

                        {/* Streaming Content Display */}
                        {isStreaming && streamingContent && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 mr-8"
                            >
                                <div className="text-xs text-purple-400 mb-1 flex items-center">
                                    <span className="animate-pulse mr-2">●</span>
                                    Shadow AI
                                    <span className="ml-2 text-xs text-gray-500">streaming...</span>
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{streamingContent}</div>
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                    <span className="animate-bounce">▮</span>
                                </div>
                            </motion.div>
                        )}

                        {isProcessing && !isStreaming && <TypingIndicator visible={isProcessing} />}
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
                                ✨ Google AI Suggestion:
                                {isLoadingSuggestion && <span className="ml-2 animate-pulse">●●●</span>}
                            </div>
                            {suggestion && <div className="text-sm text-gray-300">{suggestion}</div>}
                            {isLoadingSuggestion && !suggestion && (
                                <div className="text-sm text-gray-500 italic">Generating suggestion...</div>
                            )}
                        </div>
                        {suggestion && (
                            <button
                                onClick={useSuggestion}
                                className="ml-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-xs text-blue-300"
                            >
                                Use This
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-neon-cyan/20 bg-gray-900">
                {/* Voice Status/Error Display */}
                {voiceError && (
                    <div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300">
                        ⚠️ {voiceError}
                    </div>
                )}
                {/* Voice Transcript Preview */}
                {voiceTranscript && (
                    <div className={`mb-2 p-2 rounded text-sm italic ${voiceStatus === 'transcribing'
                        ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                        }`}>
                        {voiceTranscript}
                    </div>
                )}

                <div className="flex space-x-2">
                    {/* Microphone Button with Audio Level */}
                    <div className="relative flex items-center">
                        {/* Audio Level Indicator Bar */}
                        {isListening && (
                            <div
                                className="absolute -left-1 bottom-0 w-1 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded-full transition-all duration-75"
                                style={{
                                    height: `${audioLevel}%`,
                                    maxHeight: '40px',
                                    opacity: audioLevel > 5 ? 1 : 0.3
                                }}
                            />
                        )}
                        <button
                            onClick={toggleVoiceRecording}
                            disabled={isProcessing || voiceStatus === 'transcribing'}
                            className={`px-4 py-2 rounded-lg border transition-all ${isListening
                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                : voiceStatus === 'transcribing'
                                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                                    : voiceStatus === 'error'
                                        ? 'bg-red-500/10 border-red-500/50 text-red-400'
                                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-neon-cyan hover:text-neon-cyan'
                                }`}
                            style={isListening ? {
                                boxShadow: `0 0 ${5 + audioLevel / 10}px rgba(239, 68, 68, ${0.3 + audioLevel / 200})`
                            } : undefined}
                            title={isListening ? `Recording... (level: ${audioLevel}%)` : voiceStatus === 'transcribing' ? 'Transcribing...' : 'Start voice input (⌘⇧V)'}
                        >
                            {voiceStatus === 'transcribing' ? '⏳' : isListening ? '⏹' : '🎤'}
                        </button>
                    </div>

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
                        placeholder={isListening ? 'Listening... speak now' : 'Type or speak your message...'}
                        disabled={isProcessing}
                        autoFocus
                        style={{
                            flex: 1,
                            height: '48px',
                            padding: '12px',
                            backgroundColor: '#1f2937',
                            border: isListening ? '2px solid #ef4444' : '2px solid #06b6d4',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isProcessing || !input.trim()}
                        className="cyber-button px-6"
                    >
                        {isProcessing ? '⏳' : '▶'}
                    </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={() => setShowAttachments(!showAttachments)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${showAttachments ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                    >
                        📎 {attachmentCount > 0 && <span className="bg-blue-500 text-white rounded-full px-1.5 text-[10px]">{attachmentCount}</span>}
                    </button>
                    <span className="text-xs text-gray-500">Press Enter to send • 🎤 Voice • 📎 Attachments • 🔍 /search query</span>
                </div>
            </div>

            {/* Attachments Panel */}
            {showAttachments && (
                <div className="border-t border-gray-700 p-4 bg-gray-900">
                    <FileAttachmentUI
                        compact
                        onAttachmentsChange={(atts) => setAttachmentCount(atts.length)}
                    />
                </div>
            )}

            {/* Plan Approval Modal */}
            {showPlanApproval && currentPlan && (
                <PlanApprovalModal
                    plan={currentPlan}
                    onApprove={handleApprovePlan}
                    onReject={handleRejectPlan}
                    onModify={handleModifyPlan}
                />
            )}
        </div>
    );
}
