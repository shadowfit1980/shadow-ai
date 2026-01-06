/**
 * Text-to-Speech Service
 * 
 * Standalone TTS service supporting multiple providers
 * for natural voice synthesis.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export type TTSProvider = 'elevenlabs' | 'openai' | 'google' | 'azure';
export type VoiceStyle = 'neutral' | 'cheerful' | 'serious' | 'friendly' | 'professional';

export interface TTSVoice {
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female' | 'neutral';
    provider: TTSProvider;
    preview_url?: string;
}

export interface TTSRequest {
    text: string;
    voiceId?: string;
    provider?: TTSProvider;
    speed?: number;  // 0.5 - 2.0
    pitch?: number;  // 0.5 - 2.0
    style?: VoiceStyle;
    format?: 'mp3' | 'wav' | 'ogg';
}

export interface TTSResult {
    id: string;
    audioUrl: string;
    duration: number;
    format: string;
    text: string;
    voiceId: string;
    createdAt: number;
}

interface ProviderConfig {
    name: string;
    endpoint: string;
    apiKey?: string;
    voices: TTSVoice[];
}

export class TextToSpeechService extends EventEmitter {
    private static instance: TextToSpeechService;
    private providers: Map<TTSProvider, ProviderConfig> = new Map();
    private activeProvider: TTSProvider = 'elevenlabs';
    private outputDir: string;

    static getInstance(): TextToSpeechService {
        if (!TextToSpeechService.instance) {
            TextToSpeechService.instance = new TextToSpeechService();
        }
        return TextToSpeechService.instance;
    }

    constructor() {
        super();
        this.outputDir = path.join(process.cwd(), 'generated', 'audio');
        this.initializeProviders();
    }

    private initializeProviders(): void {
        this.providers.set('elevenlabs', {
            name: 'ElevenLabs',
            endpoint: 'https://api.elevenlabs.io/v1',
            voices: [
                { id: 'rachel', name: 'Rachel', language: 'en-US', gender: 'female', provider: 'elevenlabs' },
                { id: 'adam', name: 'Adam', language: 'en-US', gender: 'male', provider: 'elevenlabs' },
                { id: 'jessica', name: 'Jessica', language: 'en-US', gender: 'female', provider: 'elevenlabs' },
            ]
        });

        this.providers.set('openai', {
            name: 'OpenAI TTS',
            endpoint: 'https://api.openai.com/v1/audio/speech',
            voices: [
                { id: 'alloy', name: 'Alloy', language: 'en-US', gender: 'neutral', provider: 'openai' },
                { id: 'echo', name: 'Echo', language: 'en-US', gender: 'male', provider: 'openai' },
                { id: 'fable', name: 'Fable', language: 'en-US', gender: 'neutral', provider: 'openai' },
                { id: 'onyx', name: 'Onyx', language: 'en-US', gender: 'male', provider: 'openai' },
                { id: 'nova', name: 'Nova', language: 'en-US', gender: 'female', provider: 'openai' },
                { id: 'shimmer', name: 'Shimmer', language: 'en-US', gender: 'female', provider: 'openai' },
            ]
        });

        this.providers.set('google', {
            name: 'Google Cloud TTS',
            endpoint: 'https://texttospeech.googleapis.com/v1',
            voices: [
                { id: 'en-US-Standard-A', name: 'Standard A', language: 'en-US', gender: 'male', provider: 'google' },
                { id: 'en-US-Standard-B', name: 'Standard B', language: 'en-US', gender: 'male', provider: 'google' },
                { id: 'en-US-Standard-C', name: 'Standard C', language: 'en-US', gender: 'female', provider: 'google' },
                { id: 'en-US-Wavenet-A', name: 'Wavenet A', language: 'en-US', gender: 'male', provider: 'google' },
                { id: 'en-US-Wavenet-F', name: 'Wavenet F', language: 'en-US', gender: 'female', provider: 'google' },
            ]
        });
    }

    /**
     * Configure provider API key
     */
    setProviderKey(provider: TTSProvider, apiKey: string): void {
        const config = this.providers.get(provider);
        if (config) {
            config.apiKey = apiKey;
            console.log(`🔊 TTS provider ${provider} configured`);
        }
    }

    /**
     * Set active provider
     */
    setActiveProvider(provider: TTSProvider): void {
        if (this.providers.has(provider)) {
            this.activeProvider = provider;
        }
    }

    /**
     * Get available voices
     */
    getVoices(provider?: TTSProvider): TTSVoice[] {
        if (provider) {
            return this.providers.get(provider)?.voices || [];
        }
        return Array.from(this.providers.values()).flatMap(p => p.voices);
    }

    /**
     * Convert text to speech
     */
    async speak(request: TTSRequest): Promise<TTSResult> {
        const provider = request.provider || this.activeProvider;
        const config = this.providers.get(provider);

        if (!config) {
            throw new Error(`Unknown TTS provider: ${provider}`);
        }

        const voiceId = request.voiceId || config.voices[0]?.id;
        const format = request.format || 'mp3';

        const resultId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const outputPath = path.join(this.outputDir, `${resultId}.${format}`);

        try {
            if (config.apiKey) {
                await this.callProviderAPI(config, request, voiceId, outputPath);
            } else {
                // Demo mode - log what would happen
                console.log(`🔊 [DEMO] TTS: "${request.text.substring(0, 50)}..."`);
                console.log(`   Voice: ${voiceId}, Provider: ${provider}`);
                // Create placeholder file info
            }

            const result: TTSResult = {
                id: resultId,
                audioUrl: outputPath,
                duration: this.estimateDuration(request.text),
                format,
                text: request.text,
                voiceId,
                createdAt: Date.now()
            };

            this.emit('speech-generated', result);
            return result;

        } catch (error) {
            this.emit('speech-failed', { error, request });
            throw error;
        }
    }

    /**
     * Call provider API
     */
    private async callProviderAPI(
        config: ProviderConfig,
        request: TTSRequest,
        voiceId: string,
        outputPath: string
    ): Promise<void> {
        // OpenAI TTS example
        if (this.activeProvider === 'openai') {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: request.text,
                    voice: voiceId,
                    speed: request.speed || 1.0
                })
            });

            if (!response.ok) {
                throw new Error(`TTS API error: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            fs.writeFileSync(outputPath, Buffer.from(buffer));
        }
        // Add other provider implementations...
    }

    /**
     * Estimate audio duration from text length
     */
    private estimateDuration(text: string): number {
        const wordsPerMinute = 150;
        const words = text.split(/\s+/).length;
        return (words / wordsPerMinute) * 60;
    }

    /**
     * Get supported providers
     */
    getProviders(): { id: TTSProvider; name: string; configured: boolean }[] {
        return Array.from(this.providers.entries()).map(([id, config]) => ({
            id,
            name: config.name,
            configured: !!config.apiKey
        }));
    }
}

export const textToSpeechService = TextToSpeechService.getInstance();
