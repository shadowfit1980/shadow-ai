/**
 * Theme Generator
 * 
 * Generate themes and dark/light mode switching.
 */

import { EventEmitter } from 'events';

interface ThemeColors {
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

export class ThemeGenerator extends EventEmitter {
    private static instance: ThemeGenerator;

    private constructor() { super(); }

    static getInstance(): ThemeGenerator {
        if (!ThemeGenerator.instance) {
            ThemeGenerator.instance = new ThemeGenerator();
        }
        return ThemeGenerator.instance;
    }

    generateCSSVariables(name: string, colors: ThemeColors): string {
        return `[data-theme="${name}"] {
${Object.entries(colors).map(([k, v]) => `  --color-${this.kebab(k)}: ${v};`).join('\n')}
}`;
    }

    generateDarkLightTheme(): { light: ThemeColors; dark: ThemeColors; css: string } {
        const light: ThemeColors = {
            primary: '#3b82f6', secondary: '#8b5cf6', background: '#ffffff',
            surface: '#f9fafb', text: '#111827', textSecondary: '#6b7280',
            border: '#e5e7eb', error: '#ef4444', success: '#10b981', warning: '#f59e0b'
        };
        const dark: ThemeColors = {
            primary: '#60a5fa', secondary: '#a78bfa', background: '#0f172a',
            surface: '#1e293b', text: '#f1f5f9', textSecondary: '#94a3b8',
            border: '#334155', error: '#f87171', success: '#34d399', warning: '#fbbf24'
        };
        const css = `${this.generateCSSVariables('light', light)}\n\n${this.generateCSSVariables('dark', dark)}\n\n:root { ${Object.keys(light).map(k => `--color-${this.kebab(k)}: var(--color-${this.kebab(k)});`).join(' ')} }`;
        return { light, dark, css };
    }

    generateReactThemeProvider(): string {
        return `import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
`;
    }

    generateTailwindConfig(): string {
        return `module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      textColor: {
        primary: 'var(--color-text)',
        secondary: 'var(--color-text-secondary)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
      },
    },
  },
};
`;
    }

    private kebab(str: string): string {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
}

export const themeGenerator = ThemeGenerator.getInstance();
