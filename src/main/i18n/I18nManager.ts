/**
 * I18n Manager - Internationalization
 */
import { EventEmitter } from 'events';

export interface Translation { locale: string; messages: Record<string, string>; }

export class I18nManager extends EventEmitter {
    private static instance: I18nManager;
    private translations: Map<string, Record<string, string>> = new Map();
    private currentLocale = 'en';
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): I18nManager { if (!I18nManager.instance) I18nManager.instance = new I18nManager(); return I18nManager.instance; }

    private initDefaults(): void {
        this.translations.set('en', { welcome: 'Welcome', error: 'Error', success: 'Success', cancel: 'Cancel', save: 'Save', delete: 'Delete' });
        this.translations.set('es', { welcome: 'Bienvenido', error: 'Error', success: 'Éxito', cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar' });
        this.translations.set('fr', { welcome: 'Bienvenue', error: 'Erreur', success: 'Succès', cancel: 'Annuler', save: 'Sauvegarder', delete: 'Supprimer' });
    }

    setLocale(locale: string): void { this.currentLocale = locale; this.emit('localeChanged', locale); }
    getLocale(): string { return this.currentLocale; }
    t(key: string, fallback?: string): string { return this.translations.get(this.currentLocale)?.[key] || fallback || key; }
    addTranslation(locale: string, messages: Record<string, string>): void { this.translations.set(locale, { ...this.translations.get(locale), ...messages }); }
    getLocales(): string[] { return Array.from(this.translations.keys()); }
}

export function getI18nManager(): I18nManager { return I18nManager.getInstance(); }
