/**
 * Theme Generator - Dynamic theme creation
 */
import { EventEmitter } from 'events';

export interface Theme { id: string; name: string; colors: Record<string, string>; fonts: Record<string, string>; spacing: Record<string, string>; borderRadius: Record<string, string>; shadows: Record<string, string>; }

export class ThemeGeneratorEngine extends EventEmitter {
    private static instance: ThemeGeneratorEngine;
    private themes: Map<string, Theme> = new Map();
    private activeTheme: string | null = null;
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ThemeGeneratorEngine { if (!ThemeGeneratorEngine.instance) ThemeGeneratorEngine.instance = new ThemeGeneratorEngine(); return ThemeGeneratorEngine.instance; }

    private initDefaults(): void {
        const dark: Theme = { id: 'dark', name: 'Dark', colors: { primary: '#3b82f6', secondary: '#6366f1', background: '#0f172a', foreground: '#f8fafc', muted: '#64748b', accent: '#22d3ee' }, fonts: { sans: 'Inter, sans-serif', mono: 'JetBrains Mono, monospace' }, spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' }, borderRadius: { sm: '0.25rem', md: '0.5rem', lg: '1rem', full: '9999px' }, shadows: { sm: '0 1px 2px rgba(0,0,0,0.3)', md: '0 4px 6px rgba(0,0,0,0.3)', lg: '0 10px 15px rgba(0,0,0,0.3)' } };
        const light: Theme = { id: 'light', name: 'Light', colors: { primary: '#2563eb', secondary: '#4f46e5', background: '#ffffff', foreground: '#0f172a', muted: '#94a3b8', accent: '#06b6d4' }, fonts: dark.fonts, spacing: dark.spacing, borderRadius: dark.borderRadius, shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)' } };
        this.themes.set('dark', dark); this.themes.set('light', light); this.activeTheme = 'dark';
    }

    create(name: string, base: 'dark' | 'light', overrides: Partial<Theme>): Theme {
        const baseTheme = this.themes.get(base)!;
        const theme: Theme = { id: `theme_${Date.now()}`, name, colors: { ...baseTheme.colors, ...overrides.colors }, fonts: { ...baseTheme.fonts, ...overrides.fonts }, spacing: { ...baseTheme.spacing, ...overrides.spacing }, borderRadius: { ...baseTheme.borderRadius, ...overrides.borderRadius }, shadows: { ...baseTheme.shadows, ...overrides.shadows } };
        this.themes.set(theme.id, theme); this.emit('created', theme); return theme;
    }

    setActive(themeId: string): void { if (this.themes.has(themeId)) { this.activeTheme = themeId; this.emit('changed', this.themes.get(themeId)); } }
    getActive(): Theme | null { return this.activeTheme ? this.themes.get(this.activeTheme) || null : null; }
    toCSS(themeId: string): string { const t = this.themes.get(themeId); if (!t) return ''; return `:root { ${Object.entries(t.colors).map(([k, v]) => `--color-${k}: ${v}`).join('; ')}; }`; }
    getAll(): Theme[] { return Array.from(this.themes.values()); }
}
export function getThemeGeneratorEngine(): ThemeGeneratorEngine { return ThemeGeneratorEngine.getInstance(); }
