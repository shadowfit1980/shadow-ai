import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
}

interface ThemeTypography {
    fontFamily: string;
    headingFamily: string;
    baseFontSize: number;
    lineHeight: number;
}

interface Theme {
    name: string;
    colors: ThemeColors;
    typography: ThemeTypography;
    borderRadius: number;
}

const PRESET_THEMES: Theme[] = [
    {
        name: 'Neon Cyber',
        colors: {
            primary: '#00f5d4',
            secondary: '#7b2cbf',
            accent: '#f72585',
            background: '#0a0a0a',
            surface: '#1a1a2e',
            text: '#ffffff',
            muted: '#6b7280'
        },
        typography: { fontFamily: 'Inter', headingFamily: 'Space Grotesk', baseFontSize: 16, lineHeight: 1.6 },
        borderRadius: 12
    },
    {
        name: 'Ocean Breeze',
        colors: {
            primary: '#0077b6',
            secondary: '#00b4d8',
            accent: '#90e0ef',
            background: '#03045e',
            surface: '#023e8a',
            text: '#caf0f8',
            muted: '#90e0ef'
        },
        typography: { fontFamily: 'Poppins', headingFamily: 'Montserrat', baseFontSize: 16, lineHeight: 1.7 },
        borderRadius: 8
    },
    {
        name: 'Forest Dark',
        colors: {
            primary: '#52b788',
            secondary: '#40916c',
            accent: '#95d5b2',
            background: '#1b4332',
            surface: '#2d6a4f',
            text: '#d8f3dc',
            muted: '#74c69d'
        },
        typography: { fontFamily: 'DM Sans', headingFamily: 'Playfair Display', baseFontSize: 16, lineHeight: 1.65 },
        borderRadius: 6
    },
    {
        name: 'Sunset Warm',
        colors: {
            primary: '#f77f00',
            secondary: '#fcbf49',
            accent: '#eae2b7',
            background: '#003049',
            surface: '#023e7d',
            text: '#ffffff',
            muted: '#adb5bd'
        },
        typography: { fontFamily: 'Outfit', headingFamily: 'Sora', baseFontSize: 16, lineHeight: 1.6 },
        borderRadius: 16
    },
    {
        name: 'Minimal Light',
        colors: {
            primary: '#2563eb',
            secondary: '#3b82f6',
            accent: '#60a5fa',
            background: '#ffffff',
            surface: '#f8fafc',
            text: '#0f172a',
            muted: '#64748b'
        },
        typography: { fontFamily: 'Inter', headingFamily: 'Inter', baseFontSize: 16, lineHeight: 1.5 },
        borderRadius: 8
    }
];

const FONT_OPTIONS = [
    'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Montserrat',
    'DM Sans', 'Outfit', 'Sora', 'Space Grotesk', 'Playfair Display'
];

export default function ThemeEditor() {
    const [theme, setTheme] = useState<Theme>(PRESET_THEMES[0]);
    const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing'>('colors');
    const [showExport, setShowExport] = useState(false);

    const updateColor = useCallback((key: keyof ThemeColors, value: string) => {
        setTheme(prev => ({
            ...prev,
            colors: { ...prev.colors, [key]: value }
        }));
    }, []);

    const updateTypography = useCallback((key: keyof ThemeTypography, value: any) => {
        setTheme(prev => ({
            ...prev,
            typography: { ...prev.typography, [key]: value }
        }));
    }, []);

    const exportCSS = useCallback(() => {
        return `:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text: ${theme.colors.text};
  --color-muted: ${theme.colors.muted};
  
  /* Typography */
  --font-family: '${theme.typography.fontFamily}', sans-serif;
  --font-heading: '${theme.typography.headingFamily}', sans-serif;
  --font-size-base: ${theme.typography.baseFontSize}px;
  --line-height: ${theme.typography.lineHeight};
  
  /* Spacing */
  --border-radius: ${theme.borderRadius}px;
}`;
    }, [theme]);

    const exportTailwind = useCallback(() => {
        return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${theme.colors.primary}',
        secondary: '${theme.colors.secondary}',
        accent: '${theme.colors.accent}',
        background: '${theme.colors.background}',
        surface: '${theme.colors.surface}',
      },
      fontFamily: {
        sans: ['${theme.typography.fontFamily}', 'sans-serif'],
        heading: ['${theme.typography.headingFamily}', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '${theme.borderRadius}px',
      }
    }
  }
}`;
    }, [theme]);

    return (
        <div className="h-full flex bg-gray-950 text-gray-100">
            {/* Sidebar */}
            <div className="w-80 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-lg font-bold text-neon-cyan">Theme Editor</h1>
                    <p className="text-xs text-gray-500">Customize your design system</p>
                </div>

                {/* Presets */}
                <div className="p-4 border-b border-gray-800">
                    <h3 className="text-xs text-gray-500 uppercase mb-2">Presets</h3>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_THEMES.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => setTheme(preset)}
                                className={`px-2 py-1 rounded text-xs ${theme.name === preset.name
                                        ? 'bg-neon-cyan/20 text-neon-cyan'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    {(['colors', 'typography', 'spacing'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-xs capitalize ${activeTab === tab
                                    ? 'text-neon-cyan border-b-2 border-neon-cyan'
                                    : 'text-gray-400'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTab === 'colors' && (
                        <>
                            {Object.entries(theme.colors).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <label className="text-sm text-gray-400 capitalize">{key}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={value}
                                            onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => updateColor(key as keyof ThemeColors, e.target.value)}
                                            className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300"
                                        />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'typography' && (
                        <>
                            <div>
                                <label className="text-xs text-gray-500">Body Font</label>
                                <select
                                    value={theme.typography.fontFamily}
                                    onChange={(e) => updateTypography('fontFamily', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300"
                                >
                                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Heading Font</label>
                                <select
                                    value={theme.typography.headingFamily}
                                    onChange={(e) => updateTypography('headingFamily', e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300"
                                >
                                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Base Font Size: {theme.typography.baseFontSize}px</label>
                                <input
                                    type="range"
                                    min="12"
                                    max="20"
                                    value={theme.typography.baseFontSize}
                                    onChange={(e) => updateTypography('baseFontSize', parseInt(e.target.value))}
                                    className="w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Line Height: {theme.typography.lineHeight}</label>
                                <input
                                    type="range"
                                    min="1.2"
                                    max="2"
                                    step="0.1"
                                    value={theme.typography.lineHeight}
                                    onChange={(e) => updateTypography('lineHeight', parseFloat(e.target.value))}
                                    className="w-full mt-1"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'spacing' && (
                        <div>
                            <label className="text-xs text-gray-500">Border Radius: {theme.borderRadius}px</label>
                            <input
                                type="range"
                                min="0"
                                max="24"
                                value={theme.borderRadius}
                                onChange={(e) => setTheme(prev => ({ ...prev, borderRadius: parseInt(e.target.value) }))}
                                className="w-full mt-1"
                            />
                            <div className="mt-4 flex gap-2">
                                {[0, 4, 8, 12, 16, 24].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setTheme(prev => ({ ...prev, borderRadius: r }))}
                                        className="w-8 h-8 bg-gray-800 text-xs text-gray-400 hover:text-white"
                                        style={{ borderRadius: r }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Export */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => setShowExport(!showExport)}
                        className="w-full py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30"
                    >
                        📥 Export Theme
                    </button>
                </div>
            </div>

            {/* Preview */}
            <div className="flex-1 p-6" style={{
                backgroundColor: theme.colors.background,
                fontFamily: theme.typography.fontFamily
            }}>
                <div className="max-w-2xl mx-auto space-y-6">
                    <h1 style={{
                        color: theme.colors.text,
                        fontFamily: theme.typography.headingFamily,
                        fontSize: theme.typography.baseFontSize * 2
                    }}>
                        Theme Preview
                    </h1>

                    <p style={{ color: theme.colors.muted, lineHeight: theme.typography.lineHeight }}>
                        This is how your typography and colors will look in your application.
                    </p>

                    <div className="flex gap-3">
                        <button style={{
                            backgroundColor: theme.colors.primary,
                            color: theme.colors.background,
                            padding: '8px 16px',
                            borderRadius: theme.borderRadius
                        }}>
                            Primary Button
                        </button>
                        <button style={{
                            backgroundColor: theme.colors.secondary,
                            color: theme.colors.text,
                            padding: '8px 16px',
                            borderRadius: theme.borderRadius
                        }}>
                            Secondary
                        </button>
                        <button style={{
                            backgroundColor: theme.colors.accent,
                            color: theme.colors.background,
                            padding: '8px 16px',
                            borderRadius: theme.borderRadius
                        }}>
                            Accent
                        </button>
                    </div>

                    <div style={{
                        backgroundColor: theme.colors.surface,
                        padding: 24,
                        borderRadius: theme.borderRadius
                    }}>
                        <h2 style={{
                            color: theme.colors.text,
                            fontFamily: theme.typography.headingFamily,
                            marginBottom: 8
                        }}>
                            Card Component
                        </h2>
                        <p style={{ color: theme.colors.muted }}>
                            This is a surface-level card with your theme colors applied.
                        </p>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExport && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-lg w-full m-4">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <h3 className="font-semibold text-white">Export Theme</h3>
                            <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="text-xs text-gray-500 mb-2">CSS Variables</h4>
                                <pre className="p-3 bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
                                    {exportCSS()}
                                </pre>
                            </div>
                            <div>
                                <h4 className="text-xs text-gray-500 mb-2">Tailwind Config</h4>
                                <pre className="p-3 bg-gray-800 rounded text-xs text-gray-300 overflow-x-auto">
                                    {exportTailwind()}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
