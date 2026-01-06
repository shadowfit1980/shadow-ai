/**
 * Hotkey Manager
 * Global keyboard shortcuts
 */

import { EventEmitter } from 'events';
import { globalShortcut } from 'electron';

export interface Hotkey {
    id: string;
    keys: string;
    action: string;
    handler: () => void;
    enabled: boolean;
}

/**
 * HotkeyManager
 * Register and manage hotkeys
 */
export class HotkeyManager extends EventEmitter {
    private static instance: HotkeyManager;
    private hotkeys: Map<string, Hotkey> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): HotkeyManager {
        if (!HotkeyManager.instance) {
            HotkeyManager.instance = new HotkeyManager();
        }
        return HotkeyManager.instance;
    }

    register(keys: string, action: string, handler: () => void): Hotkey {
        const hotkey: Hotkey = {
            id: `hotkey_${Date.now()}`,
            keys,
            action,
            handler,
            enabled: true,
        };

        try {
            globalShortcut.register(keys, () => {
                if (hotkey.enabled) {
                    handler();
                    this.emit('triggered', hotkey);
                }
            });
            this.hotkeys.set(hotkey.id, hotkey);
            this.emit('registered', hotkey);
        } catch (error) {
            this.emit('registrationFailed', { hotkey, error });
        }

        return hotkey;
    }

    unregister(id: string): boolean {
        const hotkey = this.hotkeys.get(id);
        if (!hotkey) return false;

        globalShortcut.unregister(hotkey.keys);
        this.hotkeys.delete(id);
        this.emit('unregistered', hotkey);
        return true;
    }

    enable(id: string): boolean {
        const hotkey = this.hotkeys.get(id);
        if (!hotkey) return false;
        hotkey.enabled = true;
        return true;
    }

    disable(id: string): boolean {
        const hotkey = this.hotkeys.get(id);
        if (!hotkey) return false;
        hotkey.enabled = false;
        return true;
    }

    getAll(): Hotkey[] {
        return Array.from(this.hotkeys.values());
    }

    unregisterAll(): void {
        globalShortcut.unregisterAll();
        this.hotkeys.clear();
        this.emit('allUnregistered');
    }
}

export function getHotkeyManager(): HotkeyManager {
    return HotkeyManager.getInstance();
}
