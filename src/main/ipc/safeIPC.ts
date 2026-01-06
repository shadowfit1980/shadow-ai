/**
 * Safe IPC Handler Registration
 * 
 * Prevents duplicate handler registration errors by checking 
 * if a handler is already registered before adding it.
 */

import { ipcMain } from 'electron';

const registeredHandlers = new Set<string>();

/**
 * Safely register an IPC handler, skipping if already registered
 */
export function safeHandle(
    channel: string,
    handler: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any
): boolean {
    if (registeredHandlers.has(channel)) {
        // Already registered, skip silently
        return false;
    }

    try {
        ipcMain.handle(channel, handler);
        registeredHandlers.add(channel);
        return true;
    } catch (error: any) {
        if (error.message?.includes('second handler')) {
            // Already registered by another module
            registeredHandlers.add(channel);
            return false;
        }
        throw error;
    }
}

/**
 * Check if a handler is registered
 */
export function isHandlerRegistered(channel: string): boolean {
    return registeredHandlers.has(channel);
}

/**
 * Get all registered handler channels
 */
export function getRegisteredHandlers(): string[] {
    return Array.from(registeredHandlers);
}

/**
 * Get count of registered handlers
 */
export function getHandlerCount(): number {
    return registeredHandlers.size;
}

/**
 * Remove a handler (for testing/cleanup)
 */
export function removeHandler(channel: string): boolean {
    if (registeredHandlers.has(channel)) {
        try {
            ipcMain.removeHandler(channel);
            registeredHandlers.delete(channel);
            return true;
        } catch {
            return false;
        }
    }
    return false;
}
