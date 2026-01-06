/**
 * 🎤 VoiceFirstInterface - Voice-Driven Coding Interface
 * 
 * Complete voice-first programming experience:
 * - Real-time speech recognition
 * - AI command interpretation
 * - Voice feedback system
 * - Hands-free code generation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceCommand {
    id: string;
    transcript: string;
    intent: {
        action: string;
        target?: string;
        parameters?: Record<string, any>;
    };
    status: 'processing' | 'executed' | 'error';
    result?: string;
    timestamp: Date;
}

interface VoiceSession {
    id: string;
    status: 'idle' | 'listening' | 'processing' | 'speaking';
    transcript: string;
    confidence: number;
}

export const VoiceFirstInterface: React.FC = () => {
    const [session, setSession] = useState<VoiceSession>({
        id: '',
        status: 'idle',
        transcript: '',
        confidence: 0
    });
    const [commands, setCommands] = useState<VoiceCommand[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [lastResult, setLastResult] = useState<string>('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);

    const exampleCommands = [
        'Create a function that sorts an array',
        'Add authentication to the user model',
        'Generate tests for the payment service',
        'Refactor this component to use hooks',
        'Deploy to staging environment',
        'Find all usages of the API key'
    ];

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Audio context for level visualization
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            // Start media recorder
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                await processAudio(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setSession(s => ({ ...s, status: 'listening', transcript: '' }));

            // Start visualization loop
            visualizeAudio();

            // Start voice session
            const result = await (window as any).shadowAPI?.multimodal?.startVoice?.();
            if (result?.success) {
                setSession(s => ({ ...s, id: result.session.id }));
            }
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setSession(s => ({ ...s, status: 'processing' }));
            cancelAnimationFrame(animationFrameRef.current);
        }
    }, [isRecording]);

    const visualizeAudio = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255);

        animationFrameRef.current = requestAnimationFrame(visualizeAudio);
    }, []);

    const processAudio = async (audioBlob: Blob) => {
        try {
            const arrayBuffer = await audioBlob.arrayBuffer();

            // Send to Whisper for transcription
            const transcription = await (window as any).shadowAPI?.whisper?.transcribe?.(arrayBuffer);

            if (transcription?.success) {
                const transcript = transcription.text;
                setSession(s => ({ ...s, transcript, confidence: transcription.confidence || 0.9 }));

                // Process as voice command
                const commandResult = await (window as any).shadowAPI?.multimodal?.processVoice?.(
                    session.id,
                    transcript
                );

                if (commandResult?.success) {
                    const newCommand: VoiceCommand = {
                        id: `cmd-${Date.now()}`,
                        transcript,
                        intent: commandResult.intent,
                        status: 'executed',
                        result: commandResult.result,
                        timestamp: new Date()
                    };
                    setCommands(prev => [newCommand, ...prev]);
                    setLastResult(commandResult.result || 'Command executed');
                }
            }
        } catch (err) {
            console.error('Failed to process audio:', err);
        } finally {
            setSession(s => ({ ...s, status: 'idle' }));
        }
    };

    const executeTextCommand = async (text: string) => {
        setSession(s => ({ ...s, status: 'processing', transcript: text }));

        try {
            const result = await (window as any).shadowAPI?.multimodal?.processVoice?.(
                session.id || 'text-session',
                text
            );

            if (result?.success) {
                const newCommand: VoiceCommand = {
                    id: `cmd-${Date.now()}`,
                    transcript: text,
                    intent: result.intent,
                    status: 'executed',
                    result: result.result,
                    timestamp: new Date()
                };
                setCommands(prev => [newCommand, ...prev]);
                setLastResult(result.result || 'Command executed');
            }
        } catch (err) {
            console.error('Command execution error:', err);
        } finally {
            setSession(s => ({ ...s, status: 'idle' }));
        }
    };

    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, []);

    const getActionIcon = (action: string) => {
        const icons: Record<string, string> = {
            'create': '✨',
            'generate': '🔨',
            'modify': '✏️',
            'delete': '🗑️',
            'find': '🔍',
            'deploy': '🚀',
            'test': '🧪',
            'refactor': '🔄'
        };
        return icons[action] || '💬';
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2>🎤 Voice-First Coding</h2>
                <div style={styles.sessionStatus}>
                    <span style={{
                        ...styles.statusDot,
                        backgroundColor: session.status === 'listening'
                            ? '#EF4444'
                            : session.status === 'processing'
                                ? '#F59E0B'
                                : '#6B7280'
                    }} />
                    {session.status}
                </div>
            </div>

            {/* Main Voice Control */}
            <div style={styles.voiceControl}>
                <button
                    style={{
                        ...styles.recordButton,
                        transform: isRecording ? `scale(${1 + audioLevel * 0.3})` : 'scale(1)',
                        backgroundColor: isRecording ? '#EF4444' : '#3B82F6'
                    }}
                    onClick={isRecording ? stopRecording : startRecording}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                >
                    <span style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</span>
                </button>
                <p style={styles.hint}>
                    {isRecording ? 'Release to send command...' : 'Hold to speak or click examples below'}
                </p>

                {/* Audio Level Visualization */}
                {isRecording && (
                    <div style={styles.audioVisualization}>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.audioBar,
                                    height: `${Math.min(100, audioLevel * 200 + Math.random() * 20)}%`,
                                    backgroundColor: `hsl(${200 + i * 10}, 70%, 50%)`
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Current Transcript */}
                {session.transcript && (
                    <div style={styles.transcript}>
                        <p>"{session.transcript}"</p>
                        {session.confidence > 0 && (
                            <span style={styles.confidence}>
                                {(session.confidence * 100).toFixed(0)}% confidence
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Example Commands */}
            <div style={styles.examples}>
                <h4>💡 Try saying:</h4>
                <div style={styles.exampleGrid}>
                    {exampleCommands.map((cmd, i) => (
                        <button
                            key={i}
                            style={styles.exampleButton}
                            onClick={() => executeTextCommand(cmd)}
                        >
                            {cmd}
                        </button>
                    ))}
                </div>
            </div>

            {/* Last Result */}
            {lastResult && (
                <div style={styles.result}>
                    <h4>📝 Last Result:</h4>
                    <pre style={styles.resultCode}>{lastResult}</pre>
                </div>
            )}

            {/* Command History */}
            <div style={styles.history}>
                <h4>📜 Command History</h4>
                <div style={styles.commandList}>
                    {commands.slice(0, 5).map(cmd => (
                        <div key={cmd.id} style={styles.commandItem}>
                            <div style={styles.commandHeader}>
                                <span style={styles.actionIcon}>
                                    {getActionIcon(cmd.intent.action)}
                                </span>
                                <span style={styles.commandAction}>{cmd.intent.action}</span>
                                <span style={styles.commandTime}>
                                    {cmd.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                            <p style={styles.commandTranscript}>"{cmd.transcript}"</p>
                            {cmd.intent.target && (
                                <span style={styles.commandTarget}>
                                    Target: {cmd.intent.target}
                                </span>
                            )}
                        </div>
                    ))}
                    {commands.length === 0 && (
                        <p style={styles.noCommands}>No commands yet. Try speaking!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111827',
        color: '#F9FAFB',
        borderRadius: '12px',
        overflow: 'auto',
        padding: '20px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    sessionStatus: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#9CA3AF',
        textTransform: 'capitalize'
    },
    statusDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%'
    },
    voiceControl: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px',
        backgroundColor: '#1F2937',
        borderRadius: '16px',
        marginBottom: '24px'
    },
    recordButton: {
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.1s, background-color 0.3s',
        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
    },
    micIcon: {
        fontSize: '48px'
    },
    hint: {
        marginTop: '16px',
        color: '#9CA3AF',
        fontSize: '14px'
    },
    audioVisualization: {
        display: 'flex',
        gap: '4px',
        height: '50px',
        alignItems: 'flex-end',
        marginTop: '20px'
    },
    audioBar: {
        width: '8px',
        borderRadius: '4px',
        transition: 'height 0.1s'
    },
    transcript: {
        marginTop: '20px',
        padding: '16px 24px',
        backgroundColor: '#374151',
        borderRadius: '12px',
        textAlign: 'center'
    },
    confidence: {
        display: 'block',
        marginTop: '8px',
        fontSize: '12px',
        color: '#10B981'
    },
    examples: {
        marginBottom: '24px'
    },
    exampleGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '12px'
    },
    exampleButton: {
        padding: '8px 16px',
        backgroundColor: '#374151',
        color: '#D1D5DB',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'background-color 0.2s'
    },
    result: {
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#1F2937',
        borderRadius: '12px'
    },
    resultCode: {
        backgroundColor: '#374151',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '13px',
        overflow: 'auto',
        maxHeight: '150px'
    },
    history: {},
    commandList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '12px'
    },
    commandItem: {
        padding: '12px 16px',
        backgroundColor: '#1F2937',
        borderRadius: '12px'
    },
    commandHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
    },
    actionIcon: {
        fontSize: '16px'
    },
    commandAction: {
        fontWeight: 600,
        textTransform: 'capitalize'
    },
    commandTime: {
        marginLeft: 'auto',
        fontSize: '12px',
        color: '#6B7280'
    },
    commandTranscript: {
        margin: 0,
        fontSize: '14px',
        color: '#D1D5DB'
    },
    commandTarget: {
        display: 'inline-block',
        marginTop: '8px',
        padding: '4px 8px',
        backgroundColor: '#374151',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#9CA3AF'
    },
    noCommands: {
        color: '#6B7280',
        textAlign: 'center',
        padding: '20px'
    }
};

export default VoiceFirstInterface;
