/**
 * Privacy Mode Manager
 * Controls privacy settings and data handling modes
 * Enables Cursor-like local-only processing option
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export enum PrivacyMode {
    CLOUD = 'cloud',        // Full cloud features enabled
    HYBRID = 'hybrid',      // Local first, cloud fallback
    LOCAL_ONLY = 'local',   // Local models only, no cloud
}

export interface PrivacySettings {
    mode: PrivacyMode;
    sendTelemetry: boolean;
    sendCrashReports: boolean;
    allowExternalConnections: boolean;
    localModelEndpoint: string;
    indexCodeLocally: boolean;
    storeChatsLocally: boolean;
    encryptLocalData: boolean;
}

export interface FeatureAvailability {
    feature: string;
    available: boolean;
    reason?: string;
}

// Features and their cloud requirements
const FEATURE_CLOUD_REQUIREMENTS: Record<string, boolean> = {
    'ai.chat': false,              // Can work locally with Ollama
    'ai.completion': false,        // Can work locally
    'ai.prediction': false,        // Works locally
    'ai.cloudModels': true,        // Requires cloud
    'sync.settings': true,         // Requires cloud
    'sync.history': true,          // Requires cloud
    'analytics.usage': true,       // Requires cloud
    'collaboration.realtime': true, // Requires cloud
    'updates.check': true,         // Requires cloud
    'telemetry.send': true,        // Requires cloud
    'search.web': true,            // Requires external
    'browser.automation': true,    // Requires external
};

/**
 * PrivacyModeManager
 * Manages privacy settings and controls feature availability
 */
export class PrivacyModeManager extends EventEmitter {
    private static instance: PrivacyModeManager;
    private store: Store;
    private settings: PrivacySettings;

    private defaultSettings: PrivacySettings = {
        mode: PrivacyMode.CLOUD,
        sendTelemetry: true,
        sendCrashReports: true,
        allowExternalConnections: true,
        localModelEndpoint: 'http://localhost:11434',
        indexCodeLocally: true,
        storeChatsLocally: true,
        encryptLocalData: true,
    };

    private constructor() {
        super();

        this.store = new Store({
            name: 'shadow-ai-privacy',
        });

        // Load settings from store
        this.settings = this.loadSettings();
    }

    static getInstance(): PrivacyModeManager {
        if (!PrivacyModeManager.instance) {
            PrivacyModeManager.instance = new PrivacyModeManager();
        }
        return PrivacyModeManager.instance;
    }

    /**
     * Set privacy mode
     */
    setMode(mode: PrivacyMode): void {
        const oldMode = this.settings.mode;
        this.settings.mode = mode;

        // Adjust related settings based on mode
        switch (mode) {
            case PrivacyMode.LOCAL_ONLY:
                this.settings.sendTelemetry = false;
                this.settings.allowExternalConnections = false;
                break;
            case PrivacyMode.HYBRID:
                // Keep user preferences for telemetry
                break;
            case PrivacyMode.CLOUD:
                this.settings.allowExternalConnections = true;
                break;
        }

        this.saveSettings();
        this.emit('modeChanged', { oldMode, newMode: mode });
    }

    /**
     * Get current privacy mode
     */
    getMode(): PrivacyMode {
        return this.settings.mode;
    }

    /**
     * Get all settings
     */
    getSettings(): PrivacySettings {
        return { ...this.settings };
    }

    /**
     * Update settings
     */
    updateSettings(updates: Partial<PrivacySettings>): void {
        this.settings = { ...this.settings, ...updates };
        this.saveSettings();
        this.emit('settingsChanged', this.settings);
    }

    /**
     * Check if a feature is enabled given current privacy settings
     */
    isFeatureEnabled(feature: string): boolean {
        const requiresCloud = FEATURE_CLOUD_REQUIREMENTS[feature];

        if (requiresCloud === undefined) {
            // Unknown feature - allow by default
            return true;
        }

        if (!requiresCloud) {
            // Feature works locally
            return true;
        }

        // Feature requires cloud
        switch (this.settings.mode) {
            case PrivacyMode.LOCAL_ONLY:
                return false;
            case PrivacyMode.HYBRID:
                return this.settings.allowExternalConnections;
            case PrivacyMode.CLOUD:
                return true;
            default:
                return true;
        }
    }

    /**
     * Get feature availability with reasons
     */
    getFeatureAvailability(feature: string): FeatureAvailability {
        const enabled = this.isFeatureEnabled(feature);

        if (enabled) {
            return { feature, available: true };
        }

        const requiresCloud = FEATURE_CLOUD_REQUIREMENTS[feature];

        if (requiresCloud && this.settings.mode === PrivacyMode.LOCAL_ONLY) {
            return {
                feature,
                available: false,
                reason: 'This feature requires cloud connectivity. Enable Hybrid or Cloud mode to use it.',
            };
        }

        return {
            feature,
            available: false,
            reason: 'Feature is disabled by privacy settings.',
        };
    }

    /**
     * Get all features and their availability
     */
    getAllFeatureAvailability(): FeatureAvailability[] {
        return Object.keys(FEATURE_CLOUD_REQUIREMENTS).map(feature =>
            this.getFeatureAvailability(feature)
        );
    }

    /**
     * Check if cloud connections are allowed
     */
    canUseCloud(): boolean {
        return this.settings.mode !== PrivacyMode.LOCAL_ONLY;
    }

    /**
     * Check if external connections are allowed
     */
    canMakeExternalConnections(): boolean {
        if (this.settings.mode === PrivacyMode.LOCAL_ONLY) {
            return false;
        }
        return this.settings.allowExternalConnections;
    }

    /**
     * Check if telemetry is enabled
     */
    isTelemetryEnabled(): boolean {
        if (this.settings.mode === PrivacyMode.LOCAL_ONLY) {
            return false;
        }
        return this.settings.sendTelemetry;
    }

    /**
     * Get local model endpoint
     */
    getLocalModelEndpoint(): string {
        return this.settings.localModelEndpoint;
    }

    /**
     * Set local model endpoint
     */
    setLocalModelEndpoint(endpoint: string): void {
        this.settings.localModelEndpoint = endpoint;
        this.saveSettings();
        this.emit('localEndpointChanged', endpoint);
    }

    /**
     * Check if local models are available
     */
    async checkLocalModelAvailability(): Promise<{ available: boolean; models: string[] }> {
        try {
            const response = await fetch(`${this.settings.localModelEndpoint}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                return {
                    available: true,
                    models: data.models?.map((m: any) => m.name) || [],
                };
            }
            return { available: false, models: [] };
        } catch {
            return { available: false, models: [] };
        }
    }

    /**
     * Get privacy mode display info
     */
    getModeInfo(): { name: string; description: string; icon: string } {
        switch (this.settings.mode) {
            case PrivacyMode.LOCAL_ONLY:
                return {
                    name: 'Local Only',
                    description: 'All processing happens on your device. No data leaves your machine.',
                    icon: '🔒',
                };
            case PrivacyMode.HYBRID:
                return {
                    name: 'Hybrid',
                    description: 'Uses local models when available, cloud as fallback.',
                    icon: '🔄',
                };
            case PrivacyMode.CLOUD:
                return {
                    name: 'Cloud',
                    description: 'Full cloud features enabled for best performance.',
                    icon: '☁️',
                };
        }
    }

    /**
     * Reset to default settings
     */
    resetToDefaults(): void {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        this.emit('settingsReset');
    }

    // Private methods

    private loadSettings(): PrivacySettings {
        const stored = this.store.get('privacySettings') as Partial<PrivacySettings> | undefined;
        return { ...this.defaultSettings, ...stored };
    }

    private saveSettings(): void {
        this.store.set('privacySettings', this.settings);
    }
}

// Singleton getter
export function getPrivacyModeManager(): PrivacyModeManager {
    return PrivacyModeManager.getInstance();
}
