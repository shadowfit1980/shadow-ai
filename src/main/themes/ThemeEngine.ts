/**
 * Theme Engine
 * Dynamic theme management
 */

import { EventEmitter } from 'events';

export interface Theme {
    id: string;
    name: string;
    colors: ThemeColors;
    fonts: ThemeFonts;
    custom?: Record<string, string>;
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
}

export interface ThemeFonts {
    primary: string;
    code: string;
    size: number;
}

/**
 * ThemeEngine
 * Manage app themes
 */
export class ThemeEngine extends EventEmitter {
    private static instance: ThemeEngine;
    private themes: Map<string, Theme> = new Map();
    private currentThemeId: string = 'dark';

    private constructor() {
        super();
        this.initDefaultThemes();
    }

    static getInstance(): ThemeEngine {
        if (!ThemeEngine.instance) {
            ThemeEngine.instance = new ThemeEngine();
        }
        return ThemeEngine.instance;
    }

    private initDefaultThemes(): void {
        this.themes.set('dark', {
            id: 'dark',
            name: 'Dark',
            colors: {
                primary: '#3B82F6',
                secondary: '#8B5CF6',
                background: '#0F172A',
                surface: '#1E293B',
                text: '#F8FAFC',
                textSecondary: '#94A3B8',
                border: '#334155',
                error: '#EF4444',
                success: '#10B981',
                warning: '#F59E0B',
            },
            fonts: { primary: 'Inter', code: 'JetBrains Mono', size: 14 },
        });

        this.themes.set('light', {
            id: 'light',
            name: 'Light',
            colors: {
                primary: '#2563EB',
                secondary: '#7C3AED',
                background: '#FFFFFF',
                surface: '#F1F5F9',
                text: '#0F172A',
                textSecondary: '#64748B',
                border: '#E2E8F0',
                error: '#DC2626',
                success: '#059669',
                warning: '#D97706',
            },
            fonts: { primary: 'Inter', code: 'JetBrains Mono', size: 14 },
        });

        this.themes.set('midnight', {
            id: 'midnight',
            name: 'Midnight',
            colors: {
                primary: '#06B6D4',
                secondary: '#EC4899',
                background: '#030712',
                surface: '#111827',
                text: '#F9FAFB',
                textSecondary: '#9CA3AF',
                border: '#1F2937',
                error: '#F87171',
                success: '#34D399',
                warning: '#FBBF24',
            },
            fonts: { primary: 'Inter', code: 'Fira Code', size: 14 },
        });
    }

    /**
     * Get current theme
     */
    getCurrent(): Theme {
        return this.themes.get(this.currentThemeId) || this.themes.get('dark')!;
    }

    /**
     * Set current theme
     */
    setTheme(id: string): boolean {
        if (!this.themes.has(id)) return false;
        this.currentThemeId = id;
        this.emit('themeChanged', this.getCurrent());
        return true;
    }

    /**
     * Add custom theme
     */
    addTheme(theme: Theme): void {
        this.themes.set(theme.id, theme);
        this.emit('themeAdded', theme);
    }

    /**
     * Get all themes
     */
    getAll(): Theme[] {
        return Array.from(this.themes.values());
    }

    /**
     * Get theme by ID
     */
    get(id: string): Theme | null {
        return this.themes.get(id) || null;
    }

    /**
     * Delete theme
     */
    delete(id: string): boolean {
        if (['dark', 'light'].includes(id)) return false;
        return this.themes.delete(id);
    }

    /**
     * Generate CSS variables
     */
    toCSSVariables(theme?: Theme): string {
        const t = theme || this.getCurrent();
        const vars: string[] = [];

        for (const [key, value] of Object.entries(t.colors)) {
            vars.push(`--color-${key}: ${value};`);
        }
        vars.push(`--font-primary: ${t.fonts.primary};`);
        vars.push(`--font-code: ${t.fonts.code};`);
        vars.push(`--font-size: ${t.fonts.size}px;`);

        return `:root {\n  ${vars.join('\n  ')}\n}`;
    }
}

// Singleton getter
export function getThemeEngine(): ThemeEngine {
    return ThemeEngine.getInstance();
}
