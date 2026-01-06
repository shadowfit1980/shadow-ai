/**
 * Localization Manager - Multi-language support
 */
import { EventEmitter } from 'events';

export class LocalizationManager extends EventEmitter {
    private static instance: LocalizationManager;
    private locale = 'en'; private strings: Map<string, Record<string, string>> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): LocalizationManager { if (!LocalizationManager.instance) LocalizationManager.instance = new LocalizationManager(); return LocalizationManager.instance; }
    private initDefaults(): void { this.strings.set('en', { hello: 'Hello', save: 'Save', cancel: 'Cancel' }); this.strings.set('es', { hello: 'Hola', save: 'Guardar', cancel: 'Cancelar' }); this.strings.set('fr', { hello: 'Bonjour', save: 'Sauvegarder', cancel: 'Annuler' }); }
    setLocale(l: string): void { this.locale = l; this.emit('changed', l); } getLocale(): string { return this.locale; }
    t(key: string): string { return this.strings.get(this.locale)?.[key] || key; }
    addStrings(locale: string, s: Record<string, string>): void { this.strings.set(locale, { ...this.strings.get(locale), ...s }); }
    getLocales(): string[] { return Array.from(this.strings.keys()); }
}
export function getLocalizationManager(): LocalizationManager { return LocalizationManager.getInstance(); }
