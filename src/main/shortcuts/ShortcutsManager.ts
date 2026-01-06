/**
 * Shortcuts Manager - Quick actions
 */
import { EventEmitter } from 'events';

export interface Shortcut { id: string; name: string; keys: string; action: string; group: string; }

export class ShortcutsManager extends EventEmitter {
    private static instance: ShortcutsManager;
    private shortcuts: Map<string, Shortcut> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ShortcutsManager { if (!ShortcutsManager.instance) ShortcutsManager.instance = new ShortcutsManager(); return ShortcutsManager.instance; }
    private initDefaults(): void { this.register({ id: 'save', name: 'Save', keys: 'Ctrl+S', action: 'file.save', group: 'File' }); this.register({ id: 'open', name: 'Open', keys: 'Ctrl+O', action: 'file.open', group: 'File' }); this.register({ id: 'find', name: 'Find', keys: 'Ctrl+F', action: 'edit.find', group: 'Edit' }); }
    register(shortcut: Shortcut): void { this.shortcuts.set(shortcut.id, shortcut); }
    getByGroup(group: string): Shortcut[] { return Array.from(this.shortcuts.values()).filter(s => s.group === group); }
    getAll(): Shortcut[] { return Array.from(this.shortcuts.values()); }
}
export function getShortcutsManager(): ShortcutsManager { return ShortcutsManager.getInstance(); }
