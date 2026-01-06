/**
 * Component Library Generator
 * 
 * Generate component libraries with Storybook, design tokens,
 * and theming systems.
 */

import { EventEmitter } from 'events';

// ============================================================================
// COMPONENT LIBRARY GENERATOR
// ============================================================================

export class ComponentLibraryGenerator extends EventEmitter {
    private static instance: ComponentLibraryGenerator;

    private constructor() {
        super();
    }

    static getInstance(): ComponentLibraryGenerator {
        if (!ComponentLibraryGenerator.instance) {
            ComponentLibraryGenerator.instance = new ComponentLibraryGenerator();
        }
        return ComponentLibraryGenerator.instance;
    }

    // ========================================================================
    // DESIGN TOKENS
    // ========================================================================

    generateDesignTokens(): string {
        return `// ============================================================================
// DESIGN TOKENS
// ============================================================================

export const colors = {
    primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
};

export const spacing = {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
};

export const typography = {
    fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
    },
    fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
};

export const  borderRadius = {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
};

export const shadows = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

export const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};
`;
    }

    // ========================================================================
    // BUTTON COMPONENT
    // ========================================================================

    generateButtonComponent(): string {
        return `import { forwardRef } from 'react';
import { colors, borderRadius, spacing } from './tokens';

// ============================================================================
// TYPES
// ============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, className, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

        const variantStyles = {
            primary: \`bg-[\${colors.primary[600]}] text-white hover:bg-[\${colors.primary[700]}] focus:ring-[\${colors.primary[500]}]\`,
            secondary: \`bg-[\${colors.gray[200]}] text-[\${colors.gray[900]}] hover:bg-[\${colors.gray[300]}] focus:ring-[\${colors.gray[500]}]\`,
            outline: \`border-2 border-[\${colors.primary[600]}] text-[\${colors.primary[600]}] hover:bg-[\${colors.primary[50]}] focus:ring-[\${colors.primary[500]}]\`,
            ghost: \`text-[\${colors.primary[600]}] hover:bg-[\${colors.primary[50]}] focus:ring-[\${colors.primary[500]}]\`,
            danger: \`bg-[\${colors.error}] text-white hover:bg-red-700 focus:ring-red-500\`,
        };

        const sizeStyles = {
            sm: \`text-sm px-[\${spacing[3]}] py-[\${spacing[1]}] rounded-[\${borderRadius.base}]\`,
            md: \`text-base px-[\${spacing[4]}] py-[\${spacing[2]}] rounded-[\${borderRadius.md}]\`,
            lg: \`text-lg px-[\${spacing[6]}] py-[\${spacing[3]}] rounded-[\${borderRadius.lg}]\`,
        };

        return (
            <button
                ref={ref}
                className={\`\${baseStyles} \${variantStyles[variant]} \${sizeStyles[size]} \${className || ''}\`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <span className="mr-2 animate-spin">⏳</span>}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
`;
    }

    // ========================================================================
    // STORYBOOK CONFIGURATION
    // ========================================================================

    generateStorybookConfig(): string {
        return `import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-a11y',
        '@storybook/addon-themes',
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    docs: {
        autodocs: 'tag',
    },
};

export default config;

// ============================================================================
// BUTTON STORY
// ============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        isLoading: {
            control: 'boolean',
        },
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Button',
    },
};

export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Button',
    },
};

export const WithIcons: Story = {
    args: {
        children: 'Download',
        leftIcon: '📥',
        variant: 'primary',
    },
};

export const Loading: Story = {
    args: {
        children: 'Loading',
        isLoading: true,
        variant: 'primary',
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
        </div>
    ),
};
`;
    }

    // ========================================================================
    // THEMING SYSTEM
    // ========================================================================

    generateThemeSystem(): string {
        return `import { createContext, useContext, useEffect, useState } from 'react';

// ============================================================================
// THEME CONTEXT
// ============================================================================

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem('theme');
        return (stored as Theme) || 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

// ============================================================================
// THEME TOGGLE COMPONENT
// ============================================================================

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
}

// ============================================================================
// TAILWIND CONFIG
// ============================================================================

export const tailwindConfig = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#3b82f6',
                    dark: '#60a5fa',
                },
            },
        },
    },
};
`;
    }
}

export const componentLibraryGenerator = ComponentLibraryGenerator.getInstance();
