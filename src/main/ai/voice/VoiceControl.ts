/**
 * Voice Control & Audio Interface
 * 
 * Voice commands for hands-free coding and text-to-speech
 * for code explanations and audio changelogs.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceCommand {
    phrase: string;
    action: string;
    params?: Record<string, any>;
    aliases?: string[];
}

export interface SpeechConfig {
    voice?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}

export interface AudioChangelog {
    id: string;
    changes: string[];
    audioPath: string;
    generatedAt: Date;
    duration?: number;
}

// ============================================================================
// VOICE CONTROL
// ============================================================================

export class VoiceControl extends EventEmitter {
    private static instance: VoiceControl;
    private commands: Map<string, VoiceCommand> = new Map();
    private isListening = false;
    private speechConfig: SpeechConfig = {
        voice: 'default',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
    };

    private constructor() {
        super();
        this.registerDefaultCommands();
    }

    static getInstance(): VoiceControl {
        if (!VoiceControl.instance) {
            VoiceControl.instance = new VoiceControl();
        }
        return VoiceControl.instance;
    }

    // ========================================================================
    // VOICE COMMANDS
    // ========================================================================

    /**
     * Register default voice commands
     */
    private registerDefaultCommands(): void {
        const defaults: VoiceCommand[] = [
            { phrase: 'run tests', action: 'terminal:run', params: { command: 'npm test' } },
            { phrase: 'build project', action: 'terminal:run', params: { command: 'npm run build' } },
            { phrase: 'start server', action: 'terminal:run', params: { command: 'npm run dev' } },
            { phrase: 'show files', action: 'explorer:show' },
            { phrase: 'open terminal', action: 'terminal:open' },
            { phrase: 'save file', action: 'file:save' },
            { phrase: 'undo', action: 'edit:undo' },
            { phrase: 'redo', action: 'edit:redo' },
            { phrase: 'new file', action: 'file:new' },
            { phrase: 'close file', action: 'file:close' },
            { phrase: 'format code', action: 'edit:format' },
            { phrase: 'go to definition', action: 'navigate:definition' },
            { phrase: 'find references', action: 'navigate:references' },
            { phrase: 'commit changes', action: 'git:commit' },
            { phrase: 'push code', action: 'git:push' },
            { phrase: 'pull changes', action: 'git:pull' },
            { phrase: 'explain this', action: 'ai:explain' },
            { phrase: 'fix this', action: 'ai:fix' },
            { phrase: 'generate tests', action: 'ai:test' },
        ];

        defaults.forEach(cmd => this.registerCommand(cmd));
    }

    /**
     * Register a voice command
     */
    registerCommand(command: VoiceCommand): void {
        this.commands.set(command.phrase.toLowerCase(), command);
        command.aliases?.forEach(alias => {
            this.commands.set(alias.toLowerCase(), command);
        });
    }

    /**
     * Process voice input
     */
    processVoiceInput(transcript: string): VoiceCommand | null {
        const normalized = transcript.toLowerCase().trim();

        // Exact match
        const exact = this.commands.get(normalized);
        if (exact) {
            this.emit('command:matched', exact);
            return exact;
        }

        // Fuzzy match
        for (const [phrase, cmd] of this.commands) {
            if (normalized.includes(phrase) || phrase.includes(normalized)) {
                this.emit('command:matched', cmd);
                return cmd;
            }
        }

        this.emit('command:unknown', { transcript });
        return null;
    }

    /**
     * Start listening for voice commands
     */
    startListening(): void {
        this.isListening = true;
        this.emit('listening:started');
    }

    /**
     * Stop listening
     */
    stopListening(): void {
        this.isListening = false;
        this.emit('listening:stopped');
    }

    /**
     * Get listening state
     */
    getIsListening(): boolean {
        return this.isListening;
    }

    // ========================================================================
    // TEXT-TO-SPEECH
    // ========================================================================

    /**
     * Speak text aloud (macOS)
     */
    async speak(text: string, config?: Partial<SpeechConfig>): Promise<void> {
        const cfg = { ...this.speechConfig, ...config };

        try {
            // macOS say command
            const escapedText = text.replace(/"/g, '\\"');
            await execAsync(`say -r ${Math.round(cfg.rate! * 175)} "${escapedText}"`);
            this.emit('speech:completed', { text });
        } catch (error: any) {
            this.emit('speech:error', { error: error.message });
        }
    }

    /**
     * Generate audio file from text
     */
    async generateAudio(text: string, outputPath: string): Promise<string> {
        try {
            const escapedText = text.replace(/"/g, '\\"');
            await execAsync(`say -o "${outputPath}" --data-format=LEF32@22050 "${escapedText}"`);
            this.emit('audio:generated', { path: outputPath });
            return outputPath;
        } catch (error: any) {
            throw new Error(`Failed to generate audio: ${error.message}`);
        }
    }

    /**
     * Set speech configuration
     */
    setSpeechConfig(config: Partial<SpeechConfig>): void {
        this.speechConfig = { ...this.speechConfig, ...config };
    }

    // ========================================================================
    // AUDIO CHANGELOGS
    // ========================================================================

    /**
     * Generate audio changelog
     */
    async generateChangelog(changes: string[]): Promise<AudioChangelog> {
        const id = `changelog_${Date.now()}`;
        const audioPath = `/tmp/${id}.aiff`;

        const script = `Here's what changed in this update. ${changes.map((c, i) =>
            `Change ${i + 1}: ${c}`
        ).join('. ')}`;

        await this.generateAudio(script, audioPath);

        const changelog: AudioChangelog = {
            id,
            changes,
            audioPath,
            generatedAt: new Date(),
        };

        this.emit('changelog:generated', changelog);
        return changelog;
    }

    /**
     * Explain code via audio
     */
    async explainCode(code: string, explanation: string): Promise<void> {
        await this.speak(explanation);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * List all commands
     */
    listCommands(): VoiceCommand[] {
        return Array.from(new Set(this.commands.values()));
    }

    /**
     * Check if speech synthesis is available
     */
    async isSpeechAvailable(): Promise<boolean> {
        try {
            await execAsync('which say');
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton
export const voiceControl = VoiceControl.getInstance();
