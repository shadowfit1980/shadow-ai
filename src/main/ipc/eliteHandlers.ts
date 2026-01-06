/**
 * Elite Feature IPC Handlers
 * IPC bridge for EnvManager and APIClient
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let envManager: any = null;
let apiClient: any = null;

async function getEnvManager() {
    if (!envManager) {
        try {
            const { getEnvManager: getEM } = await import('../env/EnvManager');
            envManager = getEM();
        } catch (error) {
            console.warn('⚠️ EnvManager not available:', (error as Error).message);
            return null;
        }
    }
    return envManager;
}

async function getAPIClient() {
    if (!apiClient) {
        try {
            const { getAPIClient: getAC } = await import('../api/APIClient');
            apiClient = getAC();
        } catch (error) {
            console.warn('⚠️ APIClient not available:', (error as Error).message);
            return null;
        }
    }
    return apiClient;
}

/**
 * Setup elite feature handlers
 */
export function setupEliteHandlers(): void {
    // === ENV MANAGER ===

    ipcMain.handle('env:load', async (_, { filePath }: { filePath: string }) => {
        try {
            const em = await getEnvManager();
            if (!em) return { success: false, error: 'EnvManager not available' };

            const envFile = await em.load(filePath);
            return { success: true, envFile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('env:save', async (_, { filePath }: { filePath: string }) => {
        try {
            const em = await getEnvManager();
            if (!em) return { success: false, error: 'EnvManager not available' };

            await em.save(filePath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('env:set', async (_, { filePath, key, value }: any) => {
        try {
            const em = await getEnvManager();
            if (!em) return { success: false, error: 'EnvManager not available' };

            em.set(filePath, key, value);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('env:getAll', async () => {
        try {
            const em = await getEnvManager();
            if (!em) return { success: false, error: 'EnvManager not available' };

            const files = em.getAll();
            return { success: true, files };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === API CLIENT ===

    ipcMain.handle('api:request', async (_, req: any) => {
        try {
            const ac = await getAPIClient();
            if (!ac) return { success: false, error: 'APIClient not available' };

            const response = await ac.request(req);
            return { success: true, response };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('api:get', async (_, { url, headers }: any) => {
        try {
            const ac = await getAPIClient();
            if (!ac) return { success: false, error: 'APIClient not available' };

            const response = await ac.get(url, headers);
            return { success: true, response };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('api:post', async (_, { url, body, headers }: any) => {
        try {
            const ac = await getAPIClient();
            if (!ac) return { success: false, error: 'APIClient not available' };

            const response = await ac.post(url, body, headers);
            return { success: true, response };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('api:history', async () => {
        try {
            const ac = await getAPIClient();
            if (!ac) return { success: false, error: 'APIClient not available' };

            const history = ac.getHistory();
            return { success: true, history };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('api:saveEndpoint', async (_, { name, request }: any) => {
        try {
            const ac = await getAPIClient();
            if (!ac) return { success: false, error: 'APIClient not available' };

            const endpoint = ac.saveEndpoint(name, request);
            return { success: true, endpoint };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('api:getEndpoints', async () => {
        try {
            const ac = await getAPIClient();
            if (!ac) return { success: false, error: 'APIClient not available' };

            const endpoints = ac.getEndpoints();
            return { success: true, endpoints };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Elite feature IPC handlers registered');
}
