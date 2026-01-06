/**
 * Notebook IPC Handlers
 * IPC bridge for executable notebooks
 */

import { ipcMain } from 'electron';

// Lazy-loaded notebook engine
let notebookEngine: any = null;

async function getNotebookEngine() {
    if (!notebookEngine) {
        try {
            const { getNotebookEngine: getEngine } = await import('../notebooks/NotebookEngine');
            notebookEngine = getEngine();
        } catch (error) {
            console.warn('⚠️ NotebookEngine not available:', (error as Error).message);
            return null;
        }
    }
    return notebookEngine;
}

/**
 * Setup notebook IPC handlers
 */
export function setupNotebookHandlers(): void {
    // List all notebooks
    ipcMain.handle('notebook:list', async () => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const notebooks = engine.getAllNotebooks();
            return { success: true, notebooks };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get notebook by ID
    ipcMain.handle('notebook:get', async (_, { id }: { id: string }) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const notebook = engine.getNotebook(id);
            return { success: true, notebook };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Create notebook
    ipcMain.handle('notebook:create', async (_, options: any) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const notebook = engine.createNotebook(options);
            return { success: true, notebook };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Delete notebook
    ipcMain.handle('notebook:delete', async (_, { id }: { id: string }) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            engine.deleteNotebook(id);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Add cell
    ipcMain.handle('notebook:addCell', async (_, { notebookId, type, content, afterCellId }: any) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const cell = engine.addCell(notebookId, type, content, afterCellId);
            return { success: true, cell };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Update cell
    ipcMain.handle('notebook:updateCell', async (_, { notebookId, cellId, content }: any) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const cell = engine.updateCell(notebookId, cellId, content);
            return { success: true, cell };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Delete cell
    ipcMain.handle('notebook:deleteCell', async (_, { notebookId, cellId }: any) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            engine.deleteCell(notebookId, cellId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Move cell
    ipcMain.handle('notebook:moveCell', async (_, { notebookId, cellId, direction }: any) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const moved = engine.moveCell(notebookId, cellId, direction);
            return { success: true, moved };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Execute cell
    ipcMain.handle('notebook:executeCell', async (_, { notebookId, cellId }: any) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const output = await engine.executeCell(notebookId, cellId);
            return { success: true, output };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Execute all cells
    ipcMain.handle('notebook:executeAll', async (_, { notebookId }: { notebookId: string }) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const outputs = await engine.executeNotebook(notebookId);
            return { success: true, outputs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Clear outputs
    ipcMain.handle('notebook:clearOutputs', async (_, { notebookId }: { notebookId: string }) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            engine.clearOutputs(notebookId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Load from file
    ipcMain.handle('notebook:loadFile', async (_, { filePath }: { filePath: string }) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            const notebook = await engine.loadFromFile(filePath);
            return { success: true, notebook };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Save to file
    ipcMain.handle('notebook:saveFile', async (_, { notebookId, filePath }: any) => {
        try {
            const engine = await getNotebookEngine();
            if (!engine) return { success: false, error: 'Notebook engine not available' };

            await engine.saveToFile(notebookId, filePath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Notebook IPC handlers registered');
}
