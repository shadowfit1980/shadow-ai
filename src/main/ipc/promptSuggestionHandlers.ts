/**
 * IPC Handlers for Prompt Suggestions
 * Exposes Google AI-powered prompt suggestion functionality to renderer process
 */

import { ipcMain } from 'electron';

// Google AI Studio API Key
const GOOGLE_API_KEY = 'AIzaSyDrspFjr7NcWX9mRP515ik8iaR20Gn3Tfo';

export function setupPromptSuggestionHandlers() {
    // Get multiple prompt improvement suggestions
    ipcMain.handle('prompt:getSuggestions', async (_, userPrompt: string) => {
        try {
            const { getPromptSuggestionService } = await import('../ai/prompts');
            const service = getPromptSuggestionService(GOOGLE_API_KEY);

            const suggestions = await service.suggestPromptImprovements(userPrompt);
            return { success: true, suggestions };
        } catch (error: any) {
            console.error('❌ Prompt suggestions error:', error.message);
            return { success: false, error: error.message, suggestions: [] };
        }
    });

    // Enhance a single prompt
    ipcMain.handle('prompt:enhance', async (_, userPrompt: string) => {
        try {
            const { getPromptSuggestionService } = await import('../ai/prompts');
            const service = getPromptSuggestionService(GOOGLE_API_KEY);

            const enhanced = await service.enhancePrompt(userPrompt);
            return { success: true, enhanced };
        } catch (error: any) {
            console.error('❌ Prompt enhancement error:', error.message);
            return { success: false, error: error.message, enhanced: userPrompt };
        }
    });

    // Clear suggestion cache
    ipcMain.handle('prompt:clearCache', async () => {
        try {
            const { getPromptSuggestionService } = await import('../ai/prompts');
            const service = getPromptSuggestionService(GOOGLE_API_KEY);

            service.clearCache();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get cache statistics
    ipcMain.handle('prompt:getCacheStats', async () => {
        try {
            const { getPromptSuggestionService } = await import('../ai/prompts');
            const service = getPromptSuggestionService(GOOGLE_API_KEY);

            const stats = service.getCacheStats();
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Prompt suggestion IPC handlers registered');
}
