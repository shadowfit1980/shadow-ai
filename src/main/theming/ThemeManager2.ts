/**
 * Theme Manager 2 - Advanced theming
 */
import { EventEmitter } from 'events';

export interface Theme { id: string; name: string; colors: Record<string, string>; fonts: Record<string, string>; }

export class ThemeManager2 extends EventEmitter {
    private static instance: ThemeManager2;
    private themes: Map<string, Theme> = new Map();
    private current = 'dark';
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ThemeManager2 { if (!ThemeManager2.instance) ThemeManager2.instance = new ThemeManager2(); return ThemeManager2.instance; }
    private initDefaults(): void { this.themes.set('dark', { id: 'dark', name: 'Dark', colors: { bg: '#1a1a1a', text: '#fff' }, fonts: { main: 'Inter' } }); this.themes.set('light', { id: 'light', name: 'Light', colors: { bg: '#fff', text: '#000' }, fonts: { main: 'Inter' } }); }
    setTheme(id: string): boolean { if (!this.themes.has(id)) return false; this.current = id; this.emit('changed', this.themes.get(id)); return true; }
    getTheme(): Theme | null { return this.themes.get(this.current) || null; }
    getAll(): Theme[] { return Array.from(this.themes.values()); }
    register(theme: Theme): void { this.themes.set(theme.id, theme); }
}
export function getThemeManager2(): ThemeManager2 { return ThemeManager2.getInstance(); }
