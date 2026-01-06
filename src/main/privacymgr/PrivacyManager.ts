/**
 * Privacy Manager - Privacy controls
 */
import { EventEmitter } from 'events';

export interface PrivacySetting { name: string; category: string; enabled: boolean; description: string; }

export class PrivacyManager extends EventEmitter {
    private static instance: PrivacyManager;
    private settings: Map<string, PrivacySetting> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): PrivacyManager { if (!PrivacyManager.instance) PrivacyManager.instance = new PrivacyManager(); return PrivacyManager.instance; }

    private initDefaults(): void {
        const defaults: PrivacySetting[] = [
            { name: 'telemetry', category: 'data', enabled: false, description: 'Send usage data' },
            { name: 'crashReports', category: 'data', enabled: false, description: 'Send crash reports' },
            { name: 'extensionTelemetry', category: 'extensions', enabled: false, description: 'Extension telemetry' },
            { name: 'onlineSearch', category: 'search', enabled: true, description: 'Online documentation search' },
            { name: 'updateCheck', category: 'updates', enabled: true, description: 'Check for updates' }
        ];
        defaults.forEach(s => this.settings.set(s.name, s));
    }

    set(name: string, enabled: boolean): boolean { const s = this.settings.get(name); if (!s) return false; s.enabled = enabled; this.emit('changed', s); return true; }
    get(name: string): PrivacySetting | null { return this.settings.get(name) || null; }
    getByCategory(category: string): PrivacySetting[] { return Array.from(this.settings.values()).filter(s => s.category === category); }
    disableAll(): void { this.settings.forEach(s => { s.enabled = false; }); this.emit('allDisabled'); }
    getAll(): PrivacySetting[] { return Array.from(this.settings.values()); }
}
export function getPrivacyManager(): PrivacyManager { return PrivacyManager.getInstance(); }
