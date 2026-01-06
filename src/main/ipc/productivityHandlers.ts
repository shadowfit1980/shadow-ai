/**
 * Productivity IPC Handlers
 * IPC bridge for VSCodeImporter and CustomCommands
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let vscodeImporter: any = null;
let customCommands: any = null;

async function getVSCodeImporter() {
    if (!vscodeImporter) {
        try {
            const { getVSCodeImporter: getVSC } = await import('../import/VSCodeImporter');
            vscodeImporter = getVSC();
        } catch (error) {
            console.warn('⚠️ VSCodeImporter not available:', (error as Error).message);
            return null;
        }
    }
    return vscodeImporter;
}

async function getCustomCommands() {
    if (!customCommands) {
        try {
            const { getCustomCommands: getCC } = await import('../commands/CustomCommands');
            customCommands = getCC();
        } catch (error) {
            console.warn('⚠️ CustomCommands not available:', (error as Error).message);
            return null;
        }
    }
    return customCommands;
}

/**
 * Setup productivity handlers
 */
export function setupProductivityHandlers(): void {
    // === VS CODE IMPORTER HANDLERS ===

    ipcMain.handle('vscode:isInstalled', async () => {
        try {
            const vsc = await getVSCodeImporter();
            if (!vsc) return { success: false, installed: false };

            const installed = await vsc.isVSCodeInstalled();
            return { success: true, installed };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:getExtensions', async () => {
        try {
            const vsc = await getVSCodeImporter();
            if (!vsc) return { success: false, error: 'VSCode importer not available' };

            const extensions = await vsc.getExtensions();
            return { success: true, extensions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:getSettings', async () => {
        try {
            const vsc = await getVSCodeImporter();
            if (!vsc) return { success: false, error: 'VSCode importer not available' };

            const settings = await vsc.getSettings();
            return { success: true, settings };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:getKeybindings', async () => {
        try {
            const vsc = await getVSCodeImporter();
            if (!vsc) return { success: false, error: 'VSCode importer not available' };

            const keybindings = await vsc.getKeybindings();
            return { success: true, keybindings };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:importAll', async () => {
        try {
            const vsc = await getVSCodeImporter();
            if (!vsc) return { success: false, error: 'VSCode importer not available' };

            const result = await vsc.importAll();
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:getPreferences', async () => {
        try {
            const vsc = await getVSCodeImporter();
            if (!vsc) return { success: false, error: 'VSCode importer not available' };

            const preferences = await vsc.getEditorPreferences();
            return { success: true, preferences };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CUSTOM COMMANDS HANDLERS ===

    ipcMain.handle('commands:list', async () => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const commands = cc.getAllCommands();
            return { success: true, commands };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:get', async (_, { id }: { id: string }) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const command = cc.getCommand(id);
            return { success: true, command };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:search', async (_, { query }: { query: string }) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const commands = cc.searchCommands(query);
            return { success: true, commands };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:execute', async (_, { commandId, context }: any) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const prompt = await cc.executeCommand(commandId, context);
            return { success: true, prompt };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:create', async (_, options: any) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const command = await cc.createCommand(options);
            return { success: true, command };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:update', async (_, { id, updates }: any) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const command = await cc.updateCommand(id, updates);
            return { success: true, command };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:delete', async (_, { id }: { id: string }) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const result = await cc.deleteCommand(id);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:categories', async () => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const categories = cc.getCategories();
            return { success: true, categories };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:history', async (_, { limit }: { limit?: number } = {}) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const history = cc.getHistory(limit);
            return { success: true, history };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:export', async () => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const json = cc.exportCommands();
            return { success: true, json };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('commands:import', async (_, { json }: { json: string }) => {
        try {
            const cc = await getCustomCommands();
            if (!cc) return { success: false, error: 'Custom commands not available' };

            const count = await cc.importCommands(json);
            return { success: true, imported: count };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Productivity IPC handlers registered');
}
