/**
 * Preferences Manager - User preferences
 */
import { EventEmitter } from 'events';

export interface Preference { key: string; value: any; type: 'string' | 'number' | 'boolean' | 'object'; default: any; }

export class PreferencesManager extends EventEmitter {
    private static instance: PreferencesManager;
    private preferences: Map<string, Preference> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): PreferencesManager { if (!PreferencesManager.instance) PreferencesManager.instance = new PreferencesManager(); return PreferencesManager.instance; }

    private initDefaults(): void {
        this.define('theme', 'dark', 'string');
        this.define('fontSize', 14, 'number');
        this.define('autoSave', true, 'boolean');
        this.define('language', 'en', 'string');
        this.define('tabSize', 4, 'number');
    }

    define(key: string, defaultValue: any, type: Preference['type']): void { this.preferences.set(key, { key, value: defaultValue, type, default: defaultValue }); }
    get<T>(key: string): T | null { const p = this.preferences.get(key); return p ? p.value : null; }
    set(key: string, value: any): boolean { const p = this.preferences.get(key); if (!p) return false; p.value = value; this.emit('changed', { key, value }); return true; }
    reset(key: string): boolean { const p = this.preferences.get(key); if (!p) return false; p.value = p.default; return true; }
    resetAll(): void { this.preferences.forEach(p => p.value = p.default); }
    getAll(): Record<string, any> { const obj: Record<string, any> = {}; this.preferences.forEach((v, k) => obj[k] = v.value); return obj; }
}

export function getPreferencesManager(): PreferencesManager { return PreferencesManager.getInstance(); }
