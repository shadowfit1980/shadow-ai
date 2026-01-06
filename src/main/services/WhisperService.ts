/**
 * WhisperService - Voice transcription using Groq Whisper API (FREE)
 * Groq provides free, fast Whisper transcription
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface TranscriptionResult {
    success: boolean;
    text?: string;
    error?: string;
    duration?: number;
}

interface WhisperOptions {
    language?: string;
    prompt?: string;
    temperature?: number;
}

export class WhisperService {
    private groqApiKey: string | null = null;
    private openaiApiKey: string | null = null;
    private tempDir: string;

    constructor() {
        this.tempDir = path.join(app.getPath('temp'), 'shadow-ai-audio');
        this.ensureTempDir();

        // Set Groq API key from environment (free tier available at console.groq.com)
        this.groqApiKey = process.env.GROQ_API_KEY || null;
    }

    private ensureTempDir(): void {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Set API keys
     */
    setApiKey(key: string): void {
        // Try to detect if it's a Groq key (starts with gsk_) or OpenAI key
        if (key.startsWith('gsk_')) {
            this.groqApiKey = key;
        } else {
            this.openaiApiKey = key;
        }
    }

    /**
     * Get Groq API key from environment
     */
    private getGroqApiKey(): string | null {
        return this.groqApiKey || process.env.GROQ_API_KEY || null;
    }

    /**
     * Get OpenAI API key from environment  
     */
    private getOpenAIApiKey(): string | null {
        return this.openaiApiKey || process.env.OPENAI_API_KEY || null;
    }

    /**
     * Transcribe audio buffer - tries Groq first, then falls back to OpenAI
     */
    async transcribe(
        audioData: Buffer | ArrayBuffer,
        options: WhisperOptions = {}
    ): Promise<TranscriptionResult> {
        // Convert to Buffer
        const buffer = Buffer.isBuffer(audioData)
            ? audioData
            : Buffer.from(audioData);

        console.log(`[Whisper] Transcribing ${buffer.length} bytes of audio...`);

        // Save to temp file
        const tempFile = path.join(this.tempDir, `audio_${Date.now()}.webm`);
        fs.writeFileSync(tempFile, buffer);

        try {
            // Try Groq first (FREE and fast!)
            const groqKey = this.getGroqApiKey();
            if (groqKey) {
                console.log('[Whisper] Using Groq API (free)...');
                const result = await this.callGroqAPI(tempFile, groqKey, options);
                if (result.success) {
                    return result;
                }
                console.log('[Whisper] Groq failed, trying OpenAI...');
            }

            // Fall back to OpenAI
            const openaiKey = this.getOpenAIApiKey();
            if (openaiKey) {
                console.log('[Whisper] Using OpenAI API...');
                return await this.callOpenAIAPI(tempFile, openaiKey, options);
            }

            return {
                success: false,
                error: 'No API key configured. Please add a Groq API key (free) or OpenAI API key in settings.'
            };
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
    }

    /**
     * Transcribe using Groq Whisper API (FREE!)
     */
    private async callGroqAPI(
        filePath: string,
        apiKey: string,
        options: WhisperOptions
    ): Promise<TranscriptionResult> {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);

            const blob = new Blob([fileBuffer], { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('model', 'whisper-large-v3');

            if (options.language) {
                formData.append('language', options.language);
            }
            if (options.prompt) {
                formData.append('prompt', options.prompt);
            }
            if (options.temperature !== undefined) {
                formData.append('temperature', options.temperature.toString());
            }
            formData.append('response_format', 'json');

            console.log('[Whisper] Sending to Groq...');

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                console.log('[Whisper] Groq transcription success:', data.text?.substring(0, 50));
                return {
                    success: true,
                    text: data.text,
                    duration: data.duration
                };
            } else {
                console.error('[Whisper] Groq error:', data.error?.message);
                return {
                    success: false,
                    error: data.error?.message || `Groq API error: ${response.status}`
                };
            }
        } catch (error: any) {
            console.error('[Whisper] Groq API call error:', error);
            return {
                success: false,
                error: `Groq request failed: ${error.message}`
            };
        }
    }

    /**
     * Transcribe using OpenAI Whisper API
     */
    private async callOpenAIAPI(
        filePath: string,
        apiKey: string,
        options: WhisperOptions
    ): Promise<TranscriptionResult> {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);

            const blob = new Blob([fileBuffer], { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('model', 'whisper-1');

            if (options.language) {
                formData.append('language', options.language);
            }
            if (options.prompt) {
                formData.append('prompt', options.prompt);
            }
            if (options.temperature !== undefined) {
                formData.append('temperature', options.temperature.toString());
            }
            formData.append('response_format', 'json');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    text: data.text,
                    duration: data.duration
                };
            } else {
                return {
                    success: false,
                    error: data.error?.message || `OpenAI API error: ${response.status}`
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: `OpenAI request failed: ${error.message}`
            };
        }
    }

    /**
     * Transcribe audio file
     */
    async transcribeFile(
        filePath: string,
        options: WhisperOptions = {}
    ): Promise<TranscriptionResult> {
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                error: `Audio file not found: ${filePath}`
            };
        }

        const buffer = fs.readFileSync(filePath);
        return this.transcribe(buffer, options);
    }

    /**
     * Check if Whisper service is available (has any API key)
     */
    isAvailable(): boolean {
        return !!(this.getGroqApiKey() || this.getOpenAIApiKey());
    }

    /**
     * Clean up old temp files
     */
    cleanup(): void {
        try {
            const files = fs.readdirSync(this.tempDir);
            const now = Date.now();
            const maxAge = 60 * 60 * 1000; // 1 hour

            for (const file of files) {
                const fp = path.join(this.tempDir, file);
                const stats = fs.statSync(fp);
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(fp);
                }
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

// Singleton instance
let whisperServiceInstance: WhisperService | null = null;

export function getWhisperService(): WhisperService {
    if (!whisperServiceInstance) {
        whisperServiceInstance = new WhisperService();
    }
    return whisperServiceInstance;
}

export default WhisperService;
