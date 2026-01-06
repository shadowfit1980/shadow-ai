/**
 * Settings Sync 2 - Cross-device sync
 */
import { EventEmitter } from 'events';

export interface SyncProfile { id: string; name: string; settings: Record<string, any>; extensions: string[]; keybindings: Record<string, string>; lastSync: number; }

export class SettingsSyncManager extends EventEmitter {
    private static instance: SettingsSyncManager;
    private profiles: Map<string, SyncProfile> = new Map();
    private activeProfileId?: string;
    private constructor() { super(); }
    static getInstance(): SettingsSyncManager { if (!SettingsSyncManager.instance) SettingsSyncManager.instance = new SettingsSyncManager(); return SettingsSyncManager.instance; }

    createProfile(name: string): SyncProfile {
        const profile: SyncProfile = { id: `profile_${Date.now()}`, name, settings: {}, extensions: [], keybindings: {}, lastSync: Date.now() };
        this.profiles.set(profile.id, profile);
        return profile;
    }

    async sync(profileId: string): Promise<boolean> { const p = this.profiles.get(profileId); if (!p) return false; p.lastSync = Date.now(); this.emit('synced', p); return true; }
    setActive(profileId: string): boolean { if (!this.profiles.has(profileId)) return false; this.activeProfileId = profileId; return true; }
    getActive(): SyncProfile | null { return this.activeProfileId ? this.profiles.get(this.activeProfileId) || null : null; }
    updateSettings(profileId: string, settings: Record<string, any>): boolean { const p = this.profiles.get(profileId); if (!p) return false; p.settings = { ...p.settings, ...settings }; return true; }
    getAll(): SyncProfile[] { return Array.from(this.profiles.values()); }
}
export function getSettingsSyncManager(): SettingsSyncManager { return SettingsSyncManager.getInstance(); }
