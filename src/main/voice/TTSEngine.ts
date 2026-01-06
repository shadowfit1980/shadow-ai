/**
 * TTS Engine
 * Text-to-Speech synthesis with multiple provider support
 * Supports ElevenLabs, Azure, Google, and browser Web Speech API
 */

import { EventEmitter } from 'events';

export interface TTSConfig {
    provider: 'elevenlabs' | 'azure' | 'google' | 'browser' | 'openai';
    apiKey?: string;
    region?: string; // For Azure
    defaultVoice?: string;
    defaultSpeed?: number;
}

export interface TTSVoice {
    id: string;
    name: string;
    language: string;
    gender?: 'male' | 'female' | 'neutral';
    provider: string;
}

export interface TTSRequest {
    text: string;
    voice?: string;
    speed?: number;
    pitch?: number;
    language?: string;
    format?: 'mp3' | 'wav' | 'ogg';
}

export interface TTSResult {
    audio: Buffer | ArrayBuffer;
    format: string;
    duration?: number;
    sampleRate?: number;
}

/**
 * TTSEngine
 * Multi-provider text-to-speech synthesis
 */
export class TTSEngine extends EventEmitter {
    private static instance: TTSEngine;
    private config: TTSConfig | null = null;
    private voiceCache: Map<string, TTSVoice[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): TTSEngine {
        if (!TTSEngine.instance) {
            TTSEngine.instance = new TTSEngine();
        }
        return TTSEngine.instance;
    }

    /**
     * Initialize TTS engine
     */
    async initialize(config: TTSConfig): Promise<void> {
        this.config = config;

        // Load voices for provider
        await this.loadVoices();

        console.log(`✅ TTSEngine initialized with ${config.provider}`);
        this.emit('initialized', { provider: config.provider });
    }

    /**
     * Synthesize text to speech
     */
    async synthesize(request: TTSRequest): Promise<TTSResult> {
        if (!this.config) {
            throw new Error('TTSEngine not initialized');
        }

        this.emit('synthesizing', request);

        let result: TTSResult;

        switch (this.config.provider) {
            case 'elevenlabs':
                result = await this.synthesizeElevenLabs(request);
                break;
            case 'azure':
                result = await this.synthesizeAzure(request);
                break;
            case 'google':
                result = await this.synthesizeGoogle(request);
                break;
            case 'openai':
                result = await this.synthesizeOpenAI(request);
                break;
            case 'browser':
            default:
                result = await this.synthesizeBrowser(request);
        }

        this.emit('synthesized', { request, result });
        return result;
    }

    /**
     * Get available voices
     */
    async getVoices(): Promise<TTSVoice[]> {
        if (!this.config) return [];

        const cached = this.voiceCache.get(this.config.provider);
        if (cached) return cached;

        await this.loadVoices();
        return this.voiceCache.get(this.config.provider) || [];
    }

    /**
     * Stream TTS for real-time playback
     */
    async *synthesizeStream(request: TTSRequest): AsyncGenerator<Buffer> {
        if (!this.config) {
            throw new Error('TTSEngine not initialized');
        }

        // For providers that support streaming
        if (this.config.provider === 'elevenlabs') {
            yield* this.streamElevenLabs(request);
        } else {
            // Fallback to full synthesis
            const result = await this.synthesize(request);
            yield Buffer.from(result.audio as ArrayBuffer);
        }
    }

    // Provider implementations

    private async synthesizeElevenLabs(request: TTSRequest): Promise<TTSResult> {
        const voice = request.voice || this.config?.defaultVoice || 'Rachel';
        const apiKey = this.config?.apiKey;

        if (!apiKey) {
            throw new Error('ElevenLabs API key required');
        }

        // ElevenLabs API call
        // In production: POST to https://api.elevenlabs.io/v1/text-to-speech/{voice_id}

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text: request.text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audio = await response.arrayBuffer();

        return {
            audio: Buffer.from(audio),
            format: 'mp3',
        };
    }

    private async synthesizeAzure(request: TTSRequest): Promise<TTSResult> {
        const apiKey = this.config?.apiKey;
        const region = this.config?.region || 'eastus';
        const voice = request.voice || 'en-US-JennyNeural';

        if (!apiKey) {
            throw new Error('Azure API key required');
        }

        // Azure Speech SDK
        // In production: use @azure/cognitiveservices-speech-sdk

        const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
          <prosody rate="${request.speed || 1.0}">
            ${request.text}
          </prosody>
        </voice>
      </speak>
    `;

        const response = await fetch(
            `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/ssml+xml',
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                },
                body: ssml,
            }
        );

        if (!response.ok) {
            throw new Error(`Azure API error: ${response.status}`);
        }

        const audio = await response.arrayBuffer();

        return {
            audio: Buffer.from(audio),
            format: 'mp3',
            sampleRate: 16000,
        };
    }

    private async synthesizeGoogle(request: TTSRequest): Promise<TTSResult> {
        const apiKey = this.config?.apiKey;
        const voice = request.voice || 'en-US-Neural2-F';

        if (!apiKey) {
            throw new Error('Google API key required');
        }

        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text: request.text },
                    voice: {
                        languageCode: request.language || 'en-US',
                        name: voice,
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: request.speed || 1.0,
                        pitch: request.pitch || 0,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Google API error: ${response.status}`);
        }

        const data = await response.json();
        const audio = Buffer.from(data.audioContent, 'base64');

        return {
            audio,
            format: 'mp3',
        };
    }

    private async synthesizeOpenAI(request: TTSRequest): Promise<TTSResult> {
        const apiKey = this.config?.apiKey;
        const voice = request.voice || 'alloy';

        if (!apiKey) {
            throw new Error('OpenAI API key required');
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'tts-1',
                voice,
                input: request.text,
                speed: request.speed || 1.0,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const audio = await response.arrayBuffer();

        return {
            audio: Buffer.from(audio),
            format: 'mp3',
        };
    }

    private async synthesizeBrowser(request: TTSRequest): Promise<TTSResult> {
        // Browser Web Speech API (for renderer process)
        // This is a placeholder - actual implementation in renderer

        return {
            audio: Buffer.alloc(0),
            format: 'pcm',
        };
    }

    private async *streamElevenLabs(request: TTSRequest): AsyncGenerator<Buffer> {
        const voice = request.voice || this.config?.defaultVoice || 'Rachel';
        const apiKey = this.config?.apiKey;

        if (!apiKey) {
            throw new Error('ElevenLabs API key required');
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text: request.text,
                    model_id: 'eleven_monolingual_v1',
                }),
            }
        );

        if (!response.ok || !response.body) {
            throw new Error(`ElevenLabs streaming error: ${response.status}`);
        }

        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            yield Buffer.from(value);
        }
    }

    private async loadVoices(): Promise<void> {
        if (!this.config) return;

        const voices: TTSVoice[] = [];

        switch (this.config.provider) {
            case 'elevenlabs':
                voices.push(
                    { id: 'Rachel', name: 'Rachel', language: 'en', gender: 'female', provider: 'elevenlabs' },
                    { id: 'Josh', name: 'Josh', language: 'en', gender: 'male', provider: 'elevenlabs' },
                    { id: 'Bella', name: 'Bella', language: 'en', gender: 'female', provider: 'elevenlabs' },
                );
                break;
            case 'openai':
                voices.push(
                    { id: 'alloy', name: 'Alloy', language: 'en', gender: 'neutral', provider: 'openai' },
                    { id: 'echo', name: 'Echo', language: 'en', gender: 'male', provider: 'openai' },
                    { id: 'fable', name: 'Fable', language: 'en', gender: 'female', provider: 'openai' },
                    { id: 'onyx', name: 'Onyx', language: 'en', gender: 'male', provider: 'openai' },
                    { id: 'nova', name: 'Nova', language: 'en', gender: 'female', provider: 'openai' },
                    { id: 'shimmer', name: 'Shimmer', language: 'en', gender: 'female', provider: 'openai' },
                );
                break;
        }

        this.voiceCache.set(this.config.provider, voices);
    }
}

// Singleton getter
export function getTTSEngine(): TTSEngine {
    return TTSEngine.getInstance();
}
