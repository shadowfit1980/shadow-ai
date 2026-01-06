/**
 * Keyboard Shortcuts Manager
 * 
 * Global keyboard shortcuts for power users
 */

import { EventEmitter } from 'events';

export interface Shortcut {
    id: string;
    keys: string[];          // e.g., ['cmd', 'k'] or ['ctrl', 'shift', 'p']
    description: string;
    category: 'navigation' | 'editing' | 'ai' | 'general' | 'custom';
    action: () => void;
    enabled: boolean;
}

export interface ShortcutGroup {
    category: string;
    shortcuts: Shortcut[];
}

/**
 * KeyboardShortcuts - Global shortcut manager
 */
export class KeyboardShortcuts extends EventEmitter {
    private static instance: KeyboardShortcuts;
    private shortcuts: Map<string, Shortcut> = new Map();
    private isEnabled: boolean = true;
    private pressedKeys: Set<string> = new Set();

    private constructor() {
        super();
        this.setupListeners();
        this.registerDefaultShortcuts();
    }

    static getInstance(): KeyboardShortcuts {
        if (!KeyboardShortcuts.instance) {
            KeyboardShortcuts.instance = new KeyboardShortcuts();
        }
        return KeyboardShortcuts.instance;
    }

    /**
     * Setup keyboard event listeners
     */
    private setupListeners(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;

            // Track pressed keys
            const key = this.normalizeKey(e);
            this.pressedKeys.add(key);

            // Check for matching shortcuts
            this.checkShortcut(e);
        });

        window.addEventListener('keyup', (e) => {
            const key = this.normalizeKey(e);
            this.pressedKeys.delete(key);
        });

        // Clear on blur
        window.addEventListener('blur', () => {
            this.pressedKeys.clear();
        });
    }

    /**
     * Normalize key name
     */
    private normalizeKey(e: KeyboardEvent): string {
        if (e.key === 'Meta' || e.key === 'Command') return 'cmd';
        if (e.key === 'Control') return 'ctrl';
        if (e.key === 'Alt') return 'alt';
        if (e.key === 'Shift') return 'shift';
        return e.key.toLowerCase();
    }

    /**
     * Check if a shortcut matches
     */
    private checkShortcut(e: KeyboardEvent): void {
        const currentKey = this.normalizeKey(e);

        for (const shortcut of this.shortcuts.values()) {
            if (!shortcut.enabled) continue;

            const matches = shortcut.keys.every(key => {
                if (key === 'cmd') return e.metaKey;
                if (key === 'ctrl') return e.ctrlKey;
                if (key === 'alt') return e.altKey;
                if (key === 'shift') return e.shiftKey;
                return key === currentKey;
            });

            // Ensure we don't have extra modifier keys pressed
            const expectedModifiers = shortcut.keys.filter(k =>
                ['cmd', 'ctrl', 'alt', 'shift'].includes(k)
            );
            const actualModifiers = [
                e.metaKey && 'cmd',
                e.ctrlKey && 'ctrl',
                e.altKey && 'alt',
                e.shiftKey && 'shift',
            ].filter(Boolean);

            if (matches && expectedModifiers.length === actualModifiers.length) {
                e.preventDefault();
                shortcut.action();
                this.emit('shortcut:triggered', shortcut.id);
                break;
            }
        }
    }

    /**
     * Register default shortcuts
     */
    private registerDefaultShortcuts(): void {
        // Navigation
        this.register({
            id: 'goto-code',
            keys: ['cmd', '1'],
            description: 'Go to Code tab',
            category: 'navigation',
            action: () => this.emit('navigate', 'code'),
            enabled: true,
        });

        this.register({
            id: 'goto-chat',
            keys: ['cmd', '2'],
            description: 'Go to Chat tab',
            category: 'navigation',
            action: () => this.emit('navigate', 'flowchart'),
            enabled: true,
        });

        this.register({
            id: 'goto-preview',
            keys: ['cmd', '3'],
            description: 'Go to Preview tab',
            category: 'navigation',
            action: () => this.emit('navigate', 'preview'),
            enabled: true,
        });

        this.register({
            id: 'goto-workflow',
            keys: ['cmd', '4'],
            description: 'Go to Workflow tab',
            category: 'navigation',
            action: () => this.emit('navigate', 'workflow'),
            enabled: true,
        });

        this.register({
            id: 'goto-analytics',
            keys: ['cmd', '5'],
            description: 'Go to Analytics tab',
            category: 'navigation',
            action: () => this.emit('navigate', 'analytics'),
            enabled: true,
        });

        // General
        this.register({
            id: 'command-palette',
            keys: ['cmd', 'k'],
            description: 'Open command palette',
            category: 'general',
            action: () => this.emit('command-palette'),
            enabled: true,
        });

        this.register({
            id: 'quick-search',
            keys: ['cmd', 'p'],
            description: 'Quick file search',
            category: 'general',
            action: () => this.emit('quick-search'),
            enabled: true,
        });

        this.register({
            id: 'settings',
            keys: ['cmd', ','],
            description: 'Open settings',
            category: 'general',
            action: () => this.emit('settings'),
            enabled: true,
        });

        this.register({
            id: 'toggle-sidebar',
            keys: ['cmd', 'b'],
            description: 'Toggle sidebar',
            category: 'general',
            action: () => this.emit('toggle-sidebar'),
            enabled: true,
        });

        // AI
        this.register({
            id: 'new-chat',
            keys: ['cmd', 'n'],
            description: 'New AI chat',
            category: 'ai',
            action: () => this.emit('new-chat'),
            enabled: true,
        });

        this.register({
            id: 'explain-code',
            keys: ['cmd', 'shift', 'e'],
            description: 'Explain selected code',
            category: 'ai',
            action: () => this.emit('explain-code'),
            enabled: true,
        });

        this.register({
            id: 'refactor-code',
            keys: ['cmd', 'shift', 'r'],
            description: 'Refactor selected code',
            category: 'ai',
            action: () => this.emit('refactor-code'),
            enabled: true,
        });

        this.register({
            id: 'generate-tests',
            keys: ['cmd', 'shift', 't'],
            description: 'Generate tests',
            category: 'ai',
            action: () => this.emit('generate-tests'),
            enabled: true,
        });

        // Editing
        this.register({
            id: 'save-file',
            keys: ['cmd', 's'],
            description: 'Save current file',
            category: 'editing',
            action: () => this.emit('save-file'),
            enabled: true,
        });

        this.register({
            id: 'format-code',
            keys: ['cmd', 'shift', 'f'],
            description: 'Format code',
            category: 'editing',
            action: () => this.emit('format-code'),
            enabled: true,
        });

        this.register({
            id: 'undo',
            keys: ['cmd', 'z'],
            description: 'Undo',
            category: 'editing',
            action: () => this.emit('undo'),
            enabled: true,
        });

        this.register({
            id: 'redo',
            keys: ['cmd', 'shift', 'z'],
            description: 'Redo',
            category: 'editing',
            action: () => this.emit('redo'),
            enabled: true,
        });

        console.log(`⌨️ [Shortcuts] Registered ${this.shortcuts.size} keyboard shortcuts`);
    }

    /**
     * Register a shortcut
     */
    register(shortcut: Shortcut): void {
        this.shortcuts.set(shortcut.id, shortcut);
        this.emit('shortcut:registered', shortcut);
    }

    /**
     * Unregister a shortcut
     */
    unregister(id: string): boolean {
        return this.shortcuts.delete(id);
    }

    /**
     * Update a shortcut's keys
     */
    updateKeys(id: string, keys: string[]): boolean {
        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            shortcut.keys = keys;
            return true;
        }
        return false;
    }

    /**
     * Enable/disable a shortcut
     */
    setEnabled(id: string, enabled: boolean): boolean {
        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            shortcut.enabled = enabled;
            return true;
        }
        return false;
    }

    /**
     * Get all shortcuts
     */
    getAll(): Shortcut[] {
        return Array.from(this.shortcuts.values());
    }

    /**
     * Get shortcuts by category
     */
    getByCategory(category: Shortcut['category']): Shortcut[] {
        return this.getAll().filter(s => s.category === category);
    }

    /**
     * Get grouped shortcuts
     */
    getGrouped(): ShortcutGroup[] {
        const categories: Shortcut['category'][] = ['navigation', 'editing', 'ai', 'general', 'custom'];

        return categories.map(category => ({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            shortcuts: this.getByCategory(category),
        })).filter(g => g.shortcuts.length > 0);
    }

    /**
     * Format keys for display
     */
    formatKeys(keys: string[]): string {
        const symbols: Record<string, string> = {
            cmd: '⌘',
            ctrl: '⌃',
            alt: '⌥',
            shift: '⇧',
        };

        return keys.map(k => symbols[k] || k.toUpperCase()).join(' + ');
    }

    /**
     * Enable/disable all shortcuts
     */
    setGlobalEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Check if shortcuts are enabled
     */
    isGlobalEnabled(): boolean {
        return this.isEnabled;
    }
}

export default KeyboardShortcuts;
