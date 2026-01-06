import { useState, useEffect, useRef } from 'react';

interface VoiceControlProps {
    onCommand: (text: string) => void;
    enabled?: boolean;
}

export default function VoiceControl({ onCommand, enabled = true }: VoiceControlProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();

            // Simplified settings - works better
            recognitionRef.current.continuous = false; // Changed to false for better reliability
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onstart = () => {
                console.log('🎤 Speech recognition started');
                setError(null);
            };

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    const text = finalTranscript.trim();
                    setTranscript(text);
                    console.log('✅ Final transcript:', text);
                    onCommand(text);
                    // Auto-restart for continuous listening
                    if (isListening) {
                        setTimeout(() => {
                            if (recognitionRef.current && isListening) {
                                recognitionRef.current.start();
                            }
                        }, 100);
                    }
                } else {
                    setTranscript(interimTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                let errorMessage = `Speech recognition error: ${event.error}`;

                if (event.error === 'network') {
                    errorMessage = '⚠️ Network required: Please ensure internet connection is active.';
                    console.error('Network error - check internet connection');
                } else if (event.error === 'not-allowed') {
                    errorMessage = '⚠️ Microphone blocked: Please allow microphone in browser settings.';
                    console.error('Microphone permission denied');
                } else if (event.error === 'no-speech') {
                    // Don't show error for no-speech, just restart
                    if (isListening) {
                        setTimeout(() => {
                            if (recognitionRef.current) {
                                recognitionRef.current.start();
                            }
                        }, 100);
                    }
                    return;
                }

                setError(errorMessage);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                console.log('🎤 Speech recognition ended');
                // Will auto-restart if needed by onresult
            };
        } else {
            setError('Speech recognition not supported in this browser');
        }

        // Initialize Speech Synthesis
        if ('speechSynthesis' in window) {
            synthesisRef.current = window.speechSynthesis;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthesisRef.current) {
                synthesisRef.current.cancel();
            }
        };
    }, [onCommand, isListening]);

    const startListening = async () => {
        if (recognitionRef.current && !isListening) {
            try {
                // Request microphone permission explicitly
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Stop the stream, we just needed permission

                setError(null);
                setTranscript('');
                recognitionRef.current.start();
                setIsListening(true);
                console.log('🎤 Started listening...');
            } catch (err: any) {
                setError(`❌ Microphone access error: ${err.message}`);
                console.error('Microphone error:', err);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const speak = (text: string) => {
        if (!synthesisRef.current) {
            setError('❌ Text-to-Speech not available in this browser');
            return;
        }

        // Check if voices are available
        const voices = synthesisRef.current.getVoices();
        console.log('Available voices:', voices.length);

        if (voices.length === 0) {
            setError('⚠️ No TTS voices available. Voices may still be loading...');
            // Try again after short delay
            setTimeout(() => {
                const voicesRetry = synthesisRef.current?.getVoices();
                if (voicesRetry && voicesRetry.length > 0) {
                    setError(null);
                    speakWithVoice(text, voicesRetry[0]);
                }
            }, 100);
            return;
        }

        speakWithVoice(text, voices[0]);
    };

    const speakWithVoice = (text: string, voice: SpeechSynthesisVoice) => {
        if (!synthesisRef.current) return;

        synthesisRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            setIsSpeaking(true);
            console.log('✅ Speaking:', text);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            console.log('✅ Speech ended');
        };
        utterance.onerror = (e) => {
            setIsSpeaking(false);
            setError(`TTS error: ${e.error}`);
            console.error('❌ TTS error:', e);
        };

        synthesisRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // Keyboard shortcut: Cmd/Ctrl + Shift + V to toggle listening
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'v') {
                e.preventDefault();
                if (isListening) {
                    stopListening();
                } else {
                    startListening();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isListening]);

    if (!enabled) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="cyber-panel p-4 min-w-[300px]">
                {/* Voice Control Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">🎤</span>
                        <span className="text-sm font-semibold text-neon-cyan">Voice Control</span>
                    </div>
                    <div className="text-xs text-gray-500">⌘⇧V</div>
                </div>

                {/* Status */}
                <div className="mb-3">
                    {isListening && (
                        <div className="flex items-center space-x-2 text-green-400 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>Listening...</span>
                        </div>
                    )}
                    {isSpeaking && (
                        <div className="flex items-center space-x-2 text-blue-400 text-sm">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span>Speaking...</span>
                        </div>
                    )}
                    {!isListening && !isSpeaking && (
                        <div className="text-gray-500 text-sm">Ready</div>
                    )}
                </div>

                {/* Transcript */}
                {transcript && (
                    <div className="mb-3 p-2 bg-gray-900/50 rounded text-xs text-gray-300">
                        {transcript}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                        {error}
                    </div>
                )}

                {/* Controls */}
                <div className="flex space-x-2">
                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`cyber-button flex-1 text-sm ${isListening ? 'bg-red-500/20 border-red-500/50' : ''
                            }`}
                        disabled={!!error}
                    >
                        {isListening ? '⏹ Stop' : '🎤 Listen'}
                    </button>

                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            className="cyber-button text-sm bg-blue-500/20 border-blue-500/50"
                        >
                            🔇 Mute
                        </button>
                    )}
                </div>

                {/* Test TTS */}
                <div className="space-y-2 mt-2">
                    <button
                        onClick={() => {
                            const voices = window.speechSynthesis.getVoices();
                            console.log('🔍 Available voices:', voices);
                            alert(`Found ${voices.length} voices:\n${voices.slice(0, 5).map(v => v.name).join('\n')}`);
                        }}
                        className="cyber-button w-full text-xs bg-yellow-500/20 border-yellow-500/50"
                    >
                        🔍 Check Available Voices
                    </button>

                    <button
                        onClick={() => speak('Shadow AI voice control is ready')}
                        className="cyber-button w-full text-xs"
                        disabled={isSpeaking}
                    >
                        Test Voice Output
                    </button>
                </div>
            </div>
        </div>
    );
}

// Export speak function for use in other components
export const useSpeech = () => {
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    return { speak };
};
