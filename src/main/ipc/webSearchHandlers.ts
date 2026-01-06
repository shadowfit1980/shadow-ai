/**
 * Web Search IPC Handlers
 * 
 * Exposes WebSearchAgent to the renderer process
 */

import { ipcMain } from 'electron';
import { webSearchAgent } from '../ai/agents/WebSearchAgent';

export function registerWebSearchHandlers(): void {
    // Web search
    ipcMain.handle('search:web', async (_, query: string, options?: any) => {
        try {
            return await webSearchAgent.search(query, options);
        } catch (error: any) {
            console.error('[IPC] Web search error:', error);
            return { error: error.message, results: [] };
        }
    });

    // News search
    ipcMain.handle('search:news', async (_, query: string, options?: any) => {
        try {
            return await webSearchAgent.searchNews(query, options);
        } catch (error: any) {
            console.error('[IPC] News search error:', error);
            return { error: error.message, results: [] };
        }
    });

    // Image search
    ipcMain.handle('search:images', async (_, query: string, options?: any) => {
        try {
            return await webSearchAgent.searchImages(query, options);
        } catch (error: any) {
            console.error('[IPC] Image search error:', error);
            return { error: error.message, results: [] };
        }
    });

    // Clear cache
    ipcMain.handle('search:clearCache', async () => {
        webSearchAgent.clearCache();
        return { success: true };
    });

    // Get stats
    ipcMain.handle('search:stats', async () => {
        return webSearchAgent.getStats();
    });

    console.log('[IPC] Registered web search handlers (5 handlers)');
}
