/**
 * Keybindings Manager - Keyboard shortcuts
 */
import { EventEmitter } from 'events';

export interface Keybinding { id: string; keys: string; command: string; when?: string; }

export class KeybindingsManager extends EventEmitter {
    private static instance: KeybindingsManager;
    private bindings: Map<string, Keybinding> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): KeybindingsManager { if (!KeybindingsManager.instance) KeybindingsManager.instance = new KeybindingsManager(); return KeybindingsManager.instance; }

    private initDefaults(): void {
        this.register('Ctrl+S', 'file.save');
        this.register('Ctrl+Shift+P', 'command.palette');
        this.register('Ctrl+P', 'file.quickOpen');
        this.register('Ctrl+B', 'view.sidebar.toggle');
        this.register('Ctrl+`', 'terminal.toggle');
        this.register('Ctrl+/', 'editor.comment.toggle');
    }

    register(keys: string, command: string, when?: string): Keybinding {
        const binding: Keybinding = { id: `kb_${Date.now()}`, keys, command, when };
        this.bindings.set(keys, binding);
        return binding;
    }

    getByKeys(keys: string): Keybinding | null { return this.bindings.get(keys) || null; }
    getByCommand(cmd: string): Keybinding[] { return Array.from(this.bindings.values()).filter(b => b.command === cmd); }
    unregister(keys: string): boolean { return this.bindings.delete(keys); }
    getAll(): Keybinding[] { return Array.from(this.bindings.values()); }
}

export function getKeybindingsManager(): KeybindingsManager { return KeybindingsManager.getInstance(); }
