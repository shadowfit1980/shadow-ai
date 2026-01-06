/**
 * Voice Control Service
 * 
 * Speech-to-text and voice command processing
 */

import { EventEmitter } from 'events';

export interface VoiceCommand {
    id: string;
    trigger: string[];  // Keywords/phrases to trigger
    action: string;     // Action identifier
    description: string;
    parameters?: string[];  // Optional parameter extraction patterns
}

export interface TranscriptResult {
    text: string;
    confidence: number;
    isFinal: boolean;
    timestamp: Date;
}

export interface VoiceSettings {
    language: string;
    continuous: boolean;
    interimResults: boolean;
    confidenceThreshold: number;
    wakeWord?: string;
}

const defaultCommands: VoiceCommand[] = [
    {
        id: 'new_chat',
        trigger: ['new chat', 'start new conversation', 'clear chat'],
        action: 'chat:new',
        description: 'Start a new chat conversation',
    },
    {
        id: 'switch_model',
        trigger: ['switch to', 'use model', 'change model to'],
        action: 'model:switch',
        description: 'Switch AI model',
        parameters: ['modelName'],
    },
    {
        id: 'send_message',
        trigger: ['send', 'ask', 'tell'],
        action: 'chat:send',
        description: 'Send a message to AI',
        parameters: ['message'],
    },
    {
        id: 'stop_generation',
        trigger: ['stop', 'cancel', 'abort'],
        action: 'chat:stop',
        description: 'Stop current AI generation',
    },
    {
        id: 'open_settings',
        trigger: ['open settings', 'show settings', 'go to settings'],
        action: 'nav:settings',
        description: 'Open settings panel',
    },
    {
        id: 'toggle_mode',
        trigger: ['dark mode', 'light mode', 'toggle theme'],
        action: 'theme:toggle',
        description: 'Toggle dark/light mode',
    },
    {
        id: 'run_code',
        trigger: ['run code', 'execute code', 'run script'],
        action: 'code:execute',
        description: 'Execute code in editor',
    },
    {
        id: 'create_file',
        trigger: ['create file', 'new file', 'make file'],
        action: 'file:create',
        description: 'Create a new file',
        parameters: ['filename'],
    },
    {
        id: 'search',
        trigger: ['search for', 'find', 'look for'],
        action: 'search:query',
        description: 'Search in project',
        parameters: ['query'],
    },
    {
        id: 'help',
        trigger: ['help', 'what can you do', 'show commands'],
        action: 'help:show',
        description: 'Show available commands',
    },
];

/**
 * VoiceControlService - Speech recognition and command processing
 */
export class VoiceControlService extends EventEmitter {
    private static instance: VoiceControlService;
    private commands: Map<string, VoiceCommand> = new Map();
    private settings: VoiceSettings = {
        language: 'en-US',
        continuous: true,
        interimResults: true,
        confidenceThreshold: 0.7,
        wakeWord: 'shadow',
    };
    private isListening: boolean = false;
    private transcriptHistory: TranscriptResult[] = [];

    private constructor() {
        super();
        // Initialize default commands
        defaultCommands.forEach(cmd => this.commands.set(cmd.id, cmd));
    }

    static getInstance(): VoiceControlService {
        if (!VoiceControlService.instance) {
            VoiceControlService.instance = new VoiceControlService();
        }
        return VoiceControlService.instance;
    }

    /**
     * Start listening for voice input
     */
    async startListening(): Promise<boolean> {
        if (this.isListening) return true;

        try {
            this.isListening = true;
            this.emit('listening:started');
            return true;
        } catch (error) {
            console.error('Failed to start listening:', error);
            return false;
        }
    }

    /**
     * Stop listening
     */
    stopListening(): void {
        if (!this.isListening) return;

        this.isListening = false;
        this.emit('listening:stopped');
    }

    /**
     * Toggle listening state
     */
    toggleListening(): boolean {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
        return this.isListening;
    }

    /**
     * Process transcript and detect commands
     */
    processTranscript(result: TranscriptResult): { command: VoiceCommand | null; params: Record<string, string> } | null {
        if (result.confidence < this.settings.confidenceThreshold) {
            return null;
        }

        this.transcriptHistory.push(result);

        const text = result.text.toLowerCase().trim();

        // Check for wake word if configured
        if (this.settings.wakeWord) {
            if (!text.includes(this.settings.wakeWord.toLowerCase())) {
                return null;
            }
        }

        // Find matching command
        for (const command of this.commands.values()) {
            for (const trigger of command.trigger) {
                if (text.includes(trigger.toLowerCase())) {
                    const params = this.extractParameters(text, trigger, command.parameters);
                    this.emit('command:detected', { command, params, transcript: result });
                    return { command, params };
                }
            }
        }

        return null;
    }

    /**
     * Extract parameters from transcript
     */
    private extractParameters(text: string, trigger: string, paramNames?: string[]): Record<string, string> {
        if (!paramNames || paramNames.length === 0) return {};

        const params: Record<string, string> = {};
        const afterTrigger = text.substring(text.indexOf(trigger.toLowerCase()) + trigger.length).trim();

        if (afterTrigger && paramNames.length === 1) {
            params[paramNames[0]] = afterTrigger;
        }

        return params;
    }

    /**
     * Register custom command
     */
    registerCommand(command: VoiceCommand): void {
        this.commands.set(command.id, command);
        this.emit('command:registered', command);
    }

    /**
     * Unregister command
     */
    unregisterCommand(id: string): boolean {
        const result = this.commands.delete(id);
        if (result) {
            this.emit('command:unregistered', id);
        }
        return result;
    }

    /**
     * Get all commands
     */
    getCommands(): VoiceCommand[] {
        return Array.from(this.commands.values());
    }

    /**
     * Update settings
     */
    updateSettings(updates: Partial<VoiceSettings>): VoiceSettings {
        this.settings = { ...this.settings, ...updates };
        this.emit('settings:updated', this.settings);
        return this.settings;
    }

    /**
     * Get current settings
     */
    getSettings(): VoiceSettings {
        return { ...this.settings };
    }

    /**
     * Check if listening
     */
    getIsListening(): boolean {
        return this.isListening;
    }

    /**
     * Get transcript history
     */
    getTranscriptHistory(limit: number = 50): TranscriptResult[] {
        return this.transcriptHistory.slice(-limit);
    }

    /**
     * Clear transcript history
     */
    clearHistory(): void {
        this.transcriptHistory = [];
    }

    /**
     * Speak text (text-to-speech)
     */
    async speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
        // This would use the Web Speech API's SpeechSynthesis in renderer
        this.emit('speak:request', { text, options });
    }
}

export default VoiceControlService;
