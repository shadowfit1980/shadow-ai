// Theme Generator - Dark mode, theme switching, CSS variables
import Anthropic from '@anthropic-ai/sdk';

class ThemeGenerator {
    private anthropic: Anthropic | null = null;

    generateThemeProvider(): string {
        return `import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: { children: ReactNode; defaultTheme?: Theme }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || defaultTheme;
        }
        return defaultTheme;
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = () => {
            const resolved = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
            setResolvedTheme(resolved);
            root.classList.remove('light', 'dark');
            root.classList.add(resolved);
            root.style.colorScheme = resolved;
        };

        updateTheme();
        mediaQuery.addEventListener('change', updateTheme);
        return () => mediaQuery.removeEventListener('change', updateTheme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function ThemeToggle() {
    const { resolvedTheme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme">
            {resolvedTheme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
}
`;
    }

    generateCSSVariables(): string {
        return `:root {
    /* Colors - Light theme */
    --color-background: #ffffff;
    --color-foreground: #111827;
    --color-muted: #6b7280;
    --color-muted-foreground: #9ca3af;
    --color-border: #e5e7eb;
    --color-input: #e5e7eb;
    --color-ring: #3b82f6;
    
    /* Primary */
    --color-primary: #3b82f6;
    --color-primary-foreground: #ffffff;
    --color-primary-hover: #2563eb;
    
    /* Secondary */
    --color-secondary: #f3f4f6;
    --color-secondary-foreground: #1f2937;
    
    /* Accent */
    --color-accent: #f3f4f6;
    --color-accent-foreground: #1f2937;
    
    /* Destructive */
    --color-destructive: #ef4444;
    --color-destructive-foreground: #ffffff;
    
    /* Success */
    --color-success: #22c55e;
    --color-success-foreground: #ffffff;
    
    /* Warning */
    --color-warning: #f59e0b;
    --color-warning-foreground: #000000;
    
    /* Card */
    --color-card: #ffffff;
    --color-card-foreground: #111827;
    
    /* Popover */
    --color-popover: #ffffff;
    --color-popover-foreground: #111827;
    
    /* Radius */
    --radius: 0.5rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.dark {
    --color-background: #0f172a;
    --color-foreground: #f8fafc;
    --color-muted: #64748b;
    --color-muted-foreground: #94a3b8;
    --color-border: #1e293b;
    --color-input: #1e293b;
    --color-ring: #60a5fa;
    
    --color-primary: #60a5fa;
    --color-primary-foreground: #0f172a;
    --color-primary-hover: #3b82f6;
    
    --color-secondary: #1e293b;
    --color-secondary-foreground: #f8fafc;
    
    --color-accent: #1e293b;
    --color-accent-foreground: #f8fafc;
    
    --color-card: #1e293b;
    --color-card-foreground: #f8fafc;
    
    --color-popover: #1e293b;
    --color-popover-foreground: #f8fafc;
}

/* Utility classes */
.bg-background { background-color: var(--color-background); }
.text-foreground { color: var(--color-foreground); }
.border-border { border-color: var(--color-border); }
.bg-primary { background-color: var(--color-primary); }
.text-primary { color: var(--color-primary); }
`;
    }

    generateTailwindTheme(): string {
        return `// tailwind.config.js theme extension

module.exports = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                foreground: 'var(--color-foreground)',
                muted: {
                    DEFAULT: 'var(--color-muted)',
                    foreground: 'var(--color-muted-foreground)',
                },
                border: 'var(--color-border)',
                input: 'var(--color-input)',
                ring: 'var(--color-ring)',
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    foreground: 'var(--color-primary-foreground)',
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                    foreground: 'var(--color-secondary-foreground)',
                },
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    foreground: 'var(--color-accent-foreground)',
                },
                destructive: {
                    DEFAULT: 'var(--color-destructive)',
                    foreground: 'var(--color-destructive-foreground)',
                },
                success: {
                    DEFAULT: 'var(--color-success)',
                    foreground: 'var(--color-success-foreground)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    foreground: 'var(--color-warning-foreground)',
                },
                card: {
                    DEFAULT: 'var(--color-card)',
                    foreground: 'var(--color-card-foreground)',
                },
                popover: {
                    DEFAULT: 'var(--color-popover)',
                    foreground: 'var(--color-popover-foreground)',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                DEFAULT: 'var(--shadow)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },
        },
    },
    plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
`;
    }

    generateThemeSwitcher(): string {
        return `import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

export function ThemeSwitcher() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const themes = [
        { value: 'light', icon: '☀️', label: 'Light' },
        { value: 'dark', icon: '🌙', label: 'Dark' },
        { value: 'system', icon: '💻', label: 'System' },
    ];

    return (
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg">
            {themes.map(t => (
                <button key={t.value} onClick={() => setTheme(t.value as any)}
                    className={\`relative px-3 py-2 rounded-md text-sm font-medium transition-colors \${
                        theme === t.value ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }\`}>
                    {theme === t.value && (
                        <motion.div layoutId="theme-indicator"
                            className="absolute inset-0 bg-primary rounded-md"
                            style={{ zIndex: -1 }} />
                    )}
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline ml-2">{t.label}</span>
                </button>
            ))}
        </div>
    );
}

// Animated theme toggle button
export function AnimatedThemeToggle() {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme}
            className="relative w-14 h-8 rounded-full bg-secondary p-1 transition-colors">
            <motion.div
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-sm"
                animate={{ x: resolvedTheme === 'dark' ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                {resolvedTheme === 'dark' ? '🌙' : '☀️'}
            </motion.div>
        </button>
    );
}
`;
    }
}

export const themeGenerator = new ThemeGenerator();
