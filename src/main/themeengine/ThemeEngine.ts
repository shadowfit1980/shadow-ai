/**
 * Theme Engine - Advanced theming
 */
import { EventEmitter } from 'events';

export interface Theme { id: string; name: string; type: 'dark' | 'light' | 'high-contrast'; colors: Record<string, string>; tokenColors: { scope: string; settings: Record<string, string> }[]; }

export class ThemeEngine extends EventEmitter {
    private static instance: ThemeEngine;
    private themes: Map<string, Theme> = new Map();
    private activeThemeId = 'dark-default';
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ThemeEngine { if (!ThemeEngine.instance) ThemeEngine.instance = new ThemeEngine(); return ThemeEngine.instance; }

    private initDefaults(): void {
        const defaults: Theme[] = [
            { id: 'dark-default', name: 'Dark+', type: 'dark', colors: { 'editor.background': '#1e1e1e', 'editor.foreground': '#d4d4d4' }, tokenColors: [{ scope: 'comment', settings: { foreground: '#6A9955' } }] },
            { id: 'light-default', name: 'Light+', type: 'light', colors: { 'editor.background': '#ffffff', 'editor.foreground': '#000000' }, tokenColors: [{ scope: 'comment', settings: { foreground: '#008000' } }] },
            { id: 'monokai', name: 'Monokai', type: 'dark', colors: { 'editor.background': '#272822', 'editor.foreground': '#f8f8f2' }, tokenColors: [{ scope: 'comment', settings: { foreground: '#75715e' } }] }
        ];
        defaults.forEach(t => this.themes.set(t.id, t));
    }

    setActive(themeId: string): boolean { if (!this.themes.has(themeId)) return false; this.activeThemeId = themeId; this.emit('changed', this.themes.get(themeId)); return true; }
    getActive(): Theme | null { return this.themes.get(this.activeThemeId) || null; }
    register(theme: Theme): void { this.themes.set(theme.id, theme); this.emit('registered', theme); }
    getByType(type: Theme['type']): Theme[] { return Array.from(this.themes.values()).filter(t => t.type === type); }
    getAll(): Theme[] { return Array.from(this.themes.values()); }
}
export function getThemeEngine(): ThemeEngine { return ThemeEngine.getInstance(); }
