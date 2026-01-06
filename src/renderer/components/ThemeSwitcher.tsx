import { useState } from 'react';
import { motion } from 'framer-motion';

type Theme = 'cyber' | 'dark' | 'light' | 'pro';

interface ThemeSwitcherProps {
    currentTheme: Theme;
    onThemeChange: (theme: Theme) => void;
}

export default function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);

    const themes: { id: Theme; name: string; icon: string; preview: string }[] = [
        {
            id: 'cyber',
            name: 'Cyber',
            icon: '⚡',
            preview: 'bg-gradient-to-br from-cyan-500 to-purple-600',
        },
        {
            id: 'dark',
            name: 'Dark',
            icon: '🌙',
            preview: 'bg-gradient-to-br from-gray-800 to-gray-900',
        },
        {
            id: 'light',
            name: 'Light',
            icon: '☀️',
            preview: 'bg-gradient-to-br from-gray-100 to-white',
        },
        {
            id: 'pro',
            name: 'Pro',
            icon: '💼',
            preview: 'bg-gradient-to-br from-blue-900 to-indigo-900',
        },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="cyber-button text-sm flex items-center space-x-2"
            >
                <span>{themes.find(t => t.id === currentTheme)?.icon}</span>
                <span>Theme</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full right-0 mt-2 z-50 cyber-panel p-2 min-w-[200px]"
                    >
                        <div className="space-y-1">
                            {themes.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        onThemeChange(theme.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 p-2 rounded transition-all ${currentTheme === theme.id
                                            ? 'bg-neon-cyan/20 border border-neon-cyan/50'
                                            : 'hover:bg-gray-800'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded ${theme.preview}`} />
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-white">{theme.name}</div>
                                    </div>
                                    <span className="text-lg">{theme.icon}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}

// Keyboard shortcuts component
export function KeyboardShortcuts() {
    const [isOpen, setIsOpen] = useState(false);

    const shortcuts = [
        { keys: ['⌘', 'K'], description: 'Command Palette' },
        { keys: ['⌘', 'Shift', 'V'], description: 'Voice Control' },
        { keys: ['⌘', 'B'], description: 'Toggle Sidebar' },
        { keys: ['⌘', 'P'], description: 'Quick Open File' },
        { keys: ['⌘', 'Shift', 'P'], description: 'Run Command' },
        { keys: ['⌘', 'S'], description: 'Save' },
        { keys: ['⌘', 'Shift', 'S'], description: 'Save All' },
        { keys: ['⌘', '/'], description: 'Toggle Comment' },
        { keys: ['⌘', 'F'], description: 'Find' },
        { keys: ['⌘', 'Shift', 'F'], description: 'Find in Files' },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="cyber-button text-sm"
            >
                ⌨️ Shortcuts
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="cyber-panel p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-neon-cyan">Keyboard Shortcuts</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2">
                            {shortcuts.map((shortcut, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded hover:bg-gray-800/50"
                                >
                                    <span className="text-sm text-gray-300">{shortcut.description}</span>
                                    <div className="flex space-x-1">
                                        {shortcut.keys.map((key, i) => (
                                            <kbd
                                                key={i}
                                                className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded"
                                            >
                                                {key}
                                            </kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
