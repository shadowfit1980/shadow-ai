/**
 * Privacy Mode IPC Handlers
 * IPC bridge for privacy settings and local mode management
 */

import { ipcMain } from 'electron';

// Lazy-loaded privacy manager
let privacyManager: any = null;

async function getPrivacyManager() {
    if (!privacyManager) {
        try {
            const { getPrivacyModeManager } = await import('../core/PrivacyModeManager');
            privacyManager = getPrivacyModeManager();
        } catch (error) {
            console.warn('⚠️ PrivacyModeManager not available:', (error as Error).message);
            return null;
        }
    }
    return privacyManager;
}

/**
 * Setup all privacy-related IPC handlers
 */
export function setupPrivacyHandlers(): void {
    // Get current settings
    ipcMain.handle('privacy:get', async () => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            return {
                success: true,
                settings: manager.getSettings(),
                modeInfo: manager.getModeInfo(),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Set privacy mode
    ipcMain.handle('privacy:setMode', async (_, { mode }: { mode: string }) => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            manager.setMode(mode);
            return { success: true, settings: manager.getSettings() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Update settings
    ipcMain.handle('privacy:set', async (_, settings: any) => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            manager.updateSettings(settings);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get current mode
    ipcMain.handle('privacy:getMode', async () => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            return {
                success: true,
                mode: manager.getMode(),
                modeInfo: manager.getModeInfo(),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Check if feature is enabled
    ipcMain.handle('privacy:isFeatureEnabled', async (_, { feature }: { feature: string }) => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            const availability = manager.getFeatureAvailability(feature);
            return { success: true, ...availability };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get all feature availability
    ipcMain.handle('privacy:features', async () => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            return {
                success: true,
                features: manager.getAllFeatureAvailability(),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Check local model availability
    ipcMain.handle('privacy:checkLocal', async () => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            const status = await manager.checkLocalModelAvailability();
            return { success: true, status };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Set local model endpoint
    ipcMain.handle('privacy:setLocalEndpoint', async (_, { endpoint }: { endpoint: string }) => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            manager.setLocalModelEndpoint(endpoint);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Can use cloud
    ipcMain.handle('privacy:canUseCloud', async () => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            return { success: true, canUseCloud: manager.canUseCloud() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Reset to defaults
    ipcMain.handle('privacy:reset', async () => {
        try {
            const manager = await getPrivacyManager();
            if (!manager) return { success: false, error: 'Privacy manager not available' };

            manager.resetToDefaults();
            return { success: true, settings: manager.getSettings() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Privacy IPC handlers registered');
}
