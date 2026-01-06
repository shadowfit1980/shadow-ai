/**
 * Privacy Mode - Data isolation
 */
import { EventEmitter } from 'events';

export interface PrivacyConfig { enabled: boolean; noTelemetry: boolean; noCloudCalls: boolean; localModelsOnly: boolean; encryptHistory: boolean; autoDeleteHistory: number; }
export interface PrivacyAudit { id: string; timestamp: number; action: 'api_call' | 'model_download' | 'telemetry' | 'data_storage'; blocked: boolean; reason?: string; }

export class PrivacyModeEngine extends EventEmitter {
    private static instance: PrivacyModeEngine;
    private config: PrivacyConfig = { enabled: true, noTelemetry: true, noCloudCalls: false, localModelsOnly: false, encryptHistory: true, autoDeleteHistory: 30 };
    private audit: PrivacyAudit[] = [];
    private constructor() { super(); }
    static getInstance(): PrivacyModeEngine { if (!PrivacyModeEngine.instance) PrivacyModeEngine.instance = new PrivacyModeEngine(); return PrivacyModeEngine.instance; }

    setConfig(cfg: Partial<PrivacyConfig>): void { Object.assign(this.config, cfg); this.emit('configChanged', this.config); }
    getConfig(): PrivacyConfig { return { ...this.config }; }

    checkAction(action: PrivacyAudit['action']): { allowed: boolean; reason?: string } {
        if (!this.config.enabled) return { allowed: true };
        if (action === 'telemetry' && this.config.noTelemetry) { this.logAudit(action, true, 'Telemetry disabled'); return { allowed: false, reason: 'Telemetry disabled' }; }
        if (action === 'api_call' && this.config.noCloudCalls) { this.logAudit(action, true, 'Cloud calls disabled'); return { allowed: false, reason: 'Cloud calls disabled' }; }
        this.logAudit(action, false); return { allowed: true };
    }

    private logAudit(action: PrivacyAudit['action'], blocked: boolean, reason?: string): void { this.audit.push({ id: `aud_${Date.now()}`, timestamp: Date.now(), action, blocked, reason }); }
    getAudit(): PrivacyAudit[] { return [...this.audit]; }
    clearHistory(): void { this.emit('historyClear'); }
}
export function getPrivacyModeEngine(): PrivacyModeEngine { return PrivacyModeEngine.getInstance(); }
