import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Web Speech API types
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: (event: any) => void;
    onerror: (event: any) => void;
    onend: () => void;
}

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface Command {
    phrase: string;
    action: () => void;
    description: string;
}

export default function VoiceControlPanel() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [lastCommand, setLastCommand] = useState<string | null>(null);
    const [confidence, setConfidence] = useState(0);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const commands: Command[] = [
        {
            phrase: 'create component',
            action: () => speak('Opening component creator'),
            description: 'Opens the component creation wizard'
        },
        {
            phrase: 'run tests',
            action: () => speak('Running all tests'),
            description: 'Executes the full test suite'
        },
        {
            phrase: 'deploy application',
            action: () => speak('Starting deployment process'),
            description: 'Deploys the current project'
        },
        {
            phrase: 'analyze code',
            action: () => speak('Starting code analysis'),
            description: 'Runs security and complexity analysis'
        },
        {
            phrase: 'search plugins',
            action: () => speak('Opening plugin marketplace'),
            description: 'Navigates to the plugin store'
        }
    ];

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            if (recognitionRef.current) {
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;

                recognitionRef.current.onresult = (event: any) => {
                    const current = event.resultIndex;
                    const result = event.results[current];
                    const text = result[0].transcript.toLowerCase().trim();
                    const conf = result[0].confidence;

                    setTranscript(text);
                    setConfidence(conf);

                    if (result.isFinal) {
                        processCommand(text);
                    }
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognitionRef.current.onend = () => {
                    // Auto-restart if it just stopped but we want it listening
                    if (isListening) {
                        recognitionRef.current?.start();
                    }
                };
            }
        }
    }, [isListening]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const processCommand = (text: string) => {
        const found = commands.find(c => text.includes(c.phrase));
        if (found) {
            setLastCommand(found.phrase);
            found.action();
        } else {
            setLastCommand(null);
            // Optionally speak "I didn't understand"
        }
    };

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="cyber-panel h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neon-cyan/5 pointer-events-none" />

            {/* Visualizer Circle */}
            <div className="relative mb-12">
                <motion.div
                    animate={{
                        scale: isListening ? [1, 1.2, 1] : 1,
                        opacity: isListening ? [0.5, 0.8, 0.5] : 0.3
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-neon-cyan/30 rounded-full blur-2xl"
                />
                <button
                    onClick={toggleListening}
                    className={`relative w-32 h-32 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isListening
                        ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                        }`}
                >
                    <span className={`text-4xl ${isListening ? 'text-neon-cyan' : 'text-gray-500'}`}>
                        {isListening ? '🎙️' : '🔇'}
                    </span>
                </button>
            </div>

            {/* Status and Transcript */}
            <div className="text-center space-y-4 max-w-md w-full z-10">
                <h2 className="text-2xl font-bold text-white">
                    {isListening ? 'Listening...' : 'Tap to speak'}
                </h2>

                <div className="h-24 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {transcript ? (
                            <motion.p
                                key="transcript"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-lg text-neon-cyan/80 font-medium"
                            >
                                "{transcript}"
                            </motion.p>
                        ) : (
                            <motion.p
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-gray-500 text-sm"
                            >
                                Try saying "Create component" or "Deploy application"
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {lastCommand && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 inline-block"
                    >
                        <p className="text-green-400 text-sm">
                            ✓ Executing: <span className="font-bold">{lastCommand}</span>
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Command List */}
            <div className="mt-12 w-full max-w-2xl">
                <h3 className="text-sm font-medium text-gray-500 mb-4 text-center">Available Commands</h3>
                <div className="grid grid-cols-2 gap-3">
                    {commands.map((cmd, i) => (
                        <div key={i} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 flex items-center justify-between">
                            <span className="text-gray-300 text-sm">"{cmd.phrase}"</span>
                            <span className="text-gray-500 text-xs">{cmd.description}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
