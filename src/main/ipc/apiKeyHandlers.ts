/**
 * API Key IPC Handlers
 * IPC bridge for BYOK (Bring Your Own Key) functionality
 */

import { ipcMain } from 'electron';

// Lazy-loaded API key manager
let apiKeyManager: any = null;

async function getAPIKeyManager() {
    if (!apiKeyManager) {
        try {
            const { getAPIKeyManager: getManager } = await import('../core/APIKeyManager');
            apiKeyManager = getManager();
        } catch (error) {
            console.warn('⚠️ APIKeyManager not available:', (error as Error).message);
            return null;
        }
    }
    return apiKeyManager;
}

/**
 * Setup all API key-related IPC handlers
 */
export function setupAPIKeyHandlers(): void {
    // List configured providers
    ipcMain.handle('apikeys:list', async () => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            return {
                success: true,
                providers: manager.listConfiguredProviders(),
                allProviders: manager.listProviders(),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Set API key for provider
    ipcMain.handle('apikeys:set', async (_, { provider, key }: { provider: string; key: string }) => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            await manager.setKey(provider, key);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get API key (for internal use only - not exposed directly)
    ipcMain.handle('apikeys:get', async (_, { provider }: { provider: string }) => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            const key = await manager.getKey(provider);
            return { success: true, key };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Delete API key
    ipcMain.handle('apikeys:delete', async (_, { provider }: { provider: string }) => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            await manager.deleteKey(provider);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Validate API key
    ipcMain.handle('apikeys:validate', async (_, { provider, key }: { provider: string; key: string }) => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            const result = await manager.validateKey(provider, key);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Check if provider has key
    ipcMain.handle('apikeys:hasKey', async (_, { provider }: { provider: string }) => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            const hasKey = manager.hasKey(provider);
            return { success: true, hasKey };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get key info (masked)
    ipcMain.handle('apikeys:info', async (_, { provider }: { provider: string }) => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            const info = manager.getKeyInfo(provider);
            return { success: true, info };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Export keys (encrypted backup)
    ipcMain.handle('apikeys:export', async () => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            const exportData = manager.exportKeys();
            return { success: true, data: exportData };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Import keys (from backup)
    ipcMain.handle('apikeys:import', async (_, { data }: { data: string }) => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            manager.importKeys(data);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Clear all keys
    ipcMain.handle('apikeys:clear', async () => {
        try {
            const manager = await getAPIKeyManager();
            if (!manager) return { success: false, error: 'API key manager not available' };

            await manager.clearAllKeys();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ API Key IPC handlers registered');
}
