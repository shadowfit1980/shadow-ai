/**
 * Theme Provider
 * 
 * Dark/Light theme toggle with system preference support
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'dark' | 'light';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    defaultTheme = 'dark'
}) => {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        // Load saved theme
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved) {
            setThemeState(saved);
        }
    }, []);

    useEffect(() => {
        // Resolve system theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateResolvedTheme = () => {
            if (theme === 'system') {
                setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();
        mediaQuery.addEventListener('change', updateResolvedTheme);

        return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }, [theme]);

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', resolvedTheme);
        document.body.className = resolvedTheme === 'dark' ? 'theme-dark' : 'theme-light';
    }, [resolvedTheme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const toggleTheme = () => {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Theme toggle button component
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
    const { resolvedTheme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={className}
            style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '8px',
                borderRadius: '6px',
                transition: 'background-color 0.2s',
            }}
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {resolvedTheme === 'dark' ? '🌙' : '☀️'}
        </button>
    );
};

// CSS variables for themes
export const themeStyles = `
    :root, [data-theme="dark"] {
        --bg-primary: #0d1117;
        --bg-secondary: #161b22;
        --bg-tertiary: #21262d;
        --text-primary: #e6edf3;
        --text-secondary: #8b949e;
        --text-muted: #6e7681;
        --border-color: #30363d;
        --accent-primary: #1f6feb;
        --accent-success: #3fb950;
        --accent-warning: #d29922;
        --accent-error: #f85149;
        --neon-cyan: #00d9ff;
    }

    [data-theme="light"] {
        --bg-primary: #ffffff;
        --bg-secondary: #f6f8fa;
        --bg-tertiary: #eaeef2;
        --text-primary: #1f2328;
        --text-secondary: #656d76;
        --text-muted: #8c959f;
        --border-color: #d0d7de;
        --accent-primary: #0969da;
        --accent-success: #1a7f37;
        --accent-warning: #9a6700;
        --accent-error: #cf222e;
        --neon-cyan: #0969da;
    }

    body.theme-dark {
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }

    body.theme-light {
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }
`;

export default ThemeProvider;
