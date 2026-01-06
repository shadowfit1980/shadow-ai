/**
 * Tone Adapter
 * Adjust voice-to-text tone based on active application
 */

import { EventEmitter } from 'events';

export interface ToneProfile {
    name: string;
    apps: string[];
    settings: ToneSettings;
}

export interface ToneSettings {
    formality: 'casual' | 'neutral' | 'professional' | 'formal';
    punctuation: 'minimal' | 'standard' | 'full';
    capitalization: 'lower' | 'sentence' | 'title';
    contractions: boolean;
    emojis: boolean;
    fillerRemoval: 'none' | 'some' | 'aggressive';
}

/**
 * ToneAdapter
 * Automatically adjust tone based on app context
 */
export class ToneAdapter extends EventEmitter {
    private static instance: ToneAdapter;
    private profiles: Map<string, ToneProfile> = new Map();
    private activeApp: string = '';
    private defaultSettings: ToneSettings = {
        formality: 'neutral',
        punctuation: 'standard',
        capitalization: 'sentence',
        contractions: true,
        emojis: false,
        fillerRemoval: 'some',
    };

    private constructor() {
        super();
        this.initDefaultProfiles();
    }

    static getInstance(): ToneAdapter {
        if (!ToneAdapter.instance) {
            ToneAdapter.instance = new ToneAdapter();
        }
        return ToneAdapter.instance;
    }

    /**
     * Initialize default profiles
     */
    private initDefaultProfiles(): void {
        // Slack/Discord - Casual
        this.profiles.set('messaging', {
            name: 'Messaging',
            apps: ['slack', 'discord', 'telegram', 'whatsapp', 'messages', 'imessage'],
            settings: {
                formality: 'casual',
                punctuation: 'minimal',
                capitalization: 'lower',
                contractions: true,
                emojis: true,
                fillerRemoval: 'some',
            },
        });

        // Email - Professional
        this.profiles.set('email', {
            name: 'Email',
            apps: ['mail', 'outlook', 'gmail', 'thunderbird', 'spark'],
            settings: {
                formality: 'professional',
                punctuation: 'full',
                capitalization: 'sentence',
                contractions: false,
                emojis: false,
                fillerRemoval: 'aggressive',
            },
        });

        // Code - Technical
        this.profiles.set('coding', {
            name: 'Coding',
            apps: ['vscode', 'cursor', 'webstorm', 'intellij', 'xcode', 'vim', 'neovim'],
            settings: {
                formality: 'neutral',
                punctuation: 'minimal',
                capitalization: 'lower',
                contractions: true,
                emojis: false,
                fillerRemoval: 'aggressive',
            },
        });

        // Documents - Formal
        this.profiles.set('documents', {
            name: 'Documents',
            apps: ['word', 'docs', 'pages', 'notion', 'obsidian', 'bear'],
            settings: {
                formality: 'formal',
                punctuation: 'full',
                capitalization: 'sentence',
                contractions: false,
                emojis: false,
                fillerRemoval: 'aggressive',
            },
        });

        // Social - Very Casual
        this.profiles.set('social', {
            name: 'Social Media',
            apps: ['twitter', 'x', 'facebook', 'instagram', 'tiktok', 'linkedin'],
            settings: {
                formality: 'casual',
                punctuation: 'minimal',
                capitalization: 'sentence',
                contractions: true,
                emojis: true,
                fillerRemoval: 'some',
            },
        });

        // Terminal - Minimal
        this.profiles.set('terminal', {
            name: 'Terminal',
            apps: ['terminal', 'iterm', 'warp', 'hyper', 'alacritty'],
            settings: {
                formality: 'neutral',
                punctuation: 'minimal',
                capitalization: 'lower',
                contractions: true,
                emojis: false,
                fillerRemoval: 'aggressive',
            },
        });
    }

    /**
     * Set active application
     */
    setActiveApp(appName: string): ToneSettings {
        this.activeApp = appName.toLowerCase();
        const settings = this.getSettingsForApp(this.activeApp);
        this.emit('appChanged', { app: appName, settings });
        return settings;
    }

    /**
     * Get settings for app
     */
    getSettingsForApp(appName: string): ToneSettings {
        const lower = appName.toLowerCase();

        for (const profile of this.profiles.values()) {
            if (profile.apps.some(app => lower.includes(app))) {
                return profile.settings;
            }
        }

        return this.defaultSettings;
    }

    /**
     * Get current settings
     */
    getCurrentSettings(): ToneSettings {
        return this.getSettingsForApp(this.activeApp);
    }

    /**
     * Apply tone to text
     */
    applyTone(text: string, settings?: ToneSettings): string {
        const tone = settings || this.getCurrentSettings();
        let result = text;

        // Apply filler removal
        if (tone.fillerRemoval !== 'none') {
            const fillers = tone.fillerRemoval === 'aggressive'
                ? ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well', 'I mean']
                : ['um', 'uh', 'like'];

            for (const filler of fillers) {
                const regex = new RegExp(`\\b${filler}\\b,?\\s*`, 'gi');
                result = result.replace(regex, '');
            }
        }

        // Apply contractions
        if (!tone.contractions) {
            result = this.expandContractions(result);
        } else if (tone.formality === 'casual') {
            result = this.contractText(result);
        }

        // Apply capitalization
        switch (tone.capitalization) {
            case 'lower':
                result = result.toLowerCase();
                break;
            case 'title':
                result = this.toTitleCase(result);
                break;
            case 'sentence':
                result = this.toSentenceCase(result);
                break;
        }

        // Apply punctuation
        if (tone.punctuation === 'minimal') {
            result = result.replace(/[,;:]/g, '');
        } else if (tone.punctuation === 'full' && !result.match(/[.!?]$/)) {
            result = result.trim() + '.';
        }

        // Clean up multiple spaces
        result = result.replace(/\s+/g, ' ').trim();

        return result;
    }

    /**
     * Add custom profile
     */
    addProfile(id: string, profile: ToneProfile): void {
        this.profiles.set(id, profile);
        this.emit('profileAdded', { id, profile });
    }

    /**
     * Remove profile
     */
    removeProfile(id: string): boolean {
        const deleted = this.profiles.delete(id);
        if (deleted) {
            this.emit('profileRemoved', { id });
        }
        return deleted;
    }

    /**
     * Get all profiles
     */
    getAllProfiles(): ToneProfile[] {
        return Array.from(this.profiles.values());
    }

    /**
     * Get profile by ID
     */
    getProfile(id: string): ToneProfile | null {
        return this.profiles.get(id) || null;
    }

    /**
     * Update profile
     */
    updateProfile(id: string, settings: Partial<ToneSettings>): boolean {
        const profile = this.profiles.get(id);
        if (!profile) return false;

        profile.settings = { ...profile.settings, ...settings };
        this.emit('profileUpdated', { id, profile });
        return true;
    }

    /**
     * Set default settings
     */
    setDefaultSettings(settings: Partial<ToneSettings>): void {
        this.defaultSettings = { ...this.defaultSettings, ...settings };
        this.emit('defaultsUpdated', this.defaultSettings);
    }

    /**
     * Get default settings
     */
    getDefaultSettings(): ToneSettings {
        return { ...this.defaultSettings };
    }

    // Helper methods

    private expandContractions(text: string): string {
        const contractions: Record<string, string> = {
            "don't": "do not",
            "doesn't": "does not",
            "didn't": "did not",
            "won't": "will not",
            "wouldn't": "would not",
            "can't": "cannot",
            "couldn't": "could not",
            "shouldn't": "should not",
            "I'm": "I am",
            "you're": "you are",
            "we're": "we are",
            "they're": "they are",
            "it's": "it is",
            "that's": "that is",
            "there's": "there is",
            "I've": "I have",
            "you've": "you have",
            "we've": "we have",
            "they've": "they have",
            "I'll": "I will",
            "you'll": "you will",
            "we'll": "we will",
            "they'll": "they will",
        };

        let result = text;
        for (const [contraction, expanded] of Object.entries(contractions)) {
            result = result.replace(new RegExp(contraction, 'gi'), expanded);
        }
        return result;
    }

    private contractText(text: string): string {
        const expansions: Record<string, string> = {
            "do not": "don't",
            "does not": "doesn't",
            "did not": "didn't",
            "will not": "won't",
            "would not": "wouldn't",
            "cannot": "can't",
            "can not": "can't",
            "I am": "I'm",
            "you are": "you're",
            "we are": "we're",
            "they are": "they're",
            "it is": "it's",
        };

        let result = text;
        for (const [expanded, contraction] of Object.entries(expansions)) {
            result = result.replace(new RegExp(expanded, 'gi'), contraction);
        }
        return result;
    }

    private toTitleCase(text: string): string {
        return text.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
    }

    private toSentenceCase(text: string): string {
        return text.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
    }
}

// Singleton getter
export function getToneAdapter(): ToneAdapter {
    return ToneAdapter.getInstance();
}
