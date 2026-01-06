/**
 * Domain Agent Keyboard Shortcuts
 * 
 * Keyboard shortcuts for quick access to domain-specific agent actions.
 * Register these in the main application to enable keyboard navigation.
 */

export interface KeyboardShortcut {
    id: string;
    keys: string[];
    description: string;
    action: () => void;
    category: 'mobile' | 'game' | 'desktop' | 'general';
}

/**
 * Default keyboard shortcuts for domain agents
 */
export const domainShortcuts: Omit<KeyboardShortcut, 'action'>[] = [
    // General
    { id: 'toggle_quick_actions', keys: ['Cmd+Shift+Q', 'Ctrl+Shift+Q'], description: 'Toggle Quick Actions Panel', category: 'general' },
    { id: 'toggle_domain_dashboard', keys: ['Cmd+Shift+D', 'Ctrl+Shift+D'], description: 'Toggle Domain Dashboard', category: 'general' },

    // Mobile
    { id: 'mobile_detect', keys: ['Cmd+Shift+M', 'Ctrl+Shift+M'], description: 'Detect Mobile Platform', category: 'mobile' },
    { id: 'mobile_component', keys: ['Cmd+Alt+M', 'Ctrl+Alt+M'], description: 'Generate Mobile Component', category: 'mobile' },

    // Game
    { id: 'game_detect', keys: ['Cmd+Shift+G', 'Ctrl+Shift+G'], description: 'Detect Game Engine', category: 'game' },
    { id: 'game_procedural', keys: ['Cmd+Alt+G', 'Ctrl+Alt+G'], description: 'Procedural Generation', category: 'game' },

    // Desktop
    { id: 'desktop_detect', keys: ['Cmd+Shift+K', 'Ctrl+Shift+K'], description: 'Detect Desktop Framework', category: 'desktop' },
    { id: 'desktop_installer', keys: ['Cmd+Alt+K', 'Ctrl+Alt+K'], description: 'Create Installer', category: 'desktop' },
];

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: Record<string, () => void>): void {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

        if (!cmdOrCtrl) return;

        for (const shortcut of domainShortcuts) {
            const keyPattern = isMac ? shortcut.keys[0] : shortcut.keys[1];
            const parts = keyPattern.toLowerCase().split('+');

            const needsShift = parts.includes('shift');
            const needsAlt = parts.includes('alt');
            const key = parts[parts.length - 1];

            if (
                event.key.toLowerCase() === key &&
                event.shiftKey === needsShift &&
                event.altKey === needsAlt
            ) {
                event.preventDefault();
                handlers[shortcut.id]?.();
                return;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action'>): string {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const keyPattern = isMac ? shortcut.keys[0] : shortcut.keys[1];

    return keyPattern
        .replace('Cmd', '⌘')
        .replace('Ctrl', 'Ctrl')
        .replace('Shift', '⇧')
        .replace('Alt', '⌥')
        .replace(/\+/g, ' + ');
}
