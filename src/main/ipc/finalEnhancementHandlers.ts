/**
 * Final Enhancement IPC Handlers
 * IPC bridge for Snippets and Translator
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let snippetLibrary: any = null;
let aiTranslator: any = null;

async function getSnippetLibrary() {
    if (!snippetLibrary) {
        try {
            const { getSnippetLibrary: getSL } = await import('../snippets/SnippetLibrary');
            snippetLibrary = getSL();
            await snippetLibrary.load();
        } catch (error) {
            console.warn('⚠️ SnippetLibrary not available:', (error as Error).message);
            return null;
        }
    }
    return snippetLibrary;
}

async function getAITranslator() {
    if (!aiTranslator) {
        try {
            const { getAITranslator: getAT } = await import('../translation/AITranslator');
            aiTranslator = getAT();
        } catch (error) {
            console.warn('⚠️ AITranslator not available:', (error as Error).message);
            return null;
        }
    }
    return aiTranslator;
}

/**
 * Setup final enhancement handlers
 */
export function setupFinalEnhancementHandlers(): void {
    // === SNIPPET LIBRARY ===

    ipcMain.handle('snippets:create', async (_, data: any) => {
        try {
            const sl = await getSnippetLibrary();
            if (!sl) return { success: false, error: 'Snippet library not available' };

            const snippet = sl.create(data);
            await sl.save();
            return { success: true, snippet };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('snippets:getAll', async () => {
        try {
            const sl = await getSnippetLibrary();
            if (!sl) return { success: false, error: 'Snippet library not available' };

            const snippets = sl.getAll();
            return { success: true, snippets };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('snippets:expand', async (_, { snippetId, variables }: any) => {
        try {
            const sl = await getSnippetLibrary();
            if (!sl) return { success: false, error: 'Snippet library not available' };

            const content = sl.expand(snippetId, variables);
            return { success: true, content };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('snippets:expandTrigger', async (_, { text, variables }: any) => {
        try {
            const sl = await getSnippetLibrary();
            if (!sl) return { success: false, error: 'Snippet library not available' };

            const expanded = sl.expandTrigger(text, variables);
            return { success: true, text: expanded };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('snippets:search', async (_, { query }: { query: string }) => {
        try {
            const sl = await getSnippetLibrary();
            if (!sl) return { success: false, error: 'Snippet library not available' };

            const results = sl.search(query);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('snippets:getByCategory', async (_, { category }: { category: string }) => {
        try {
            const sl = await getSnippetLibrary();
            if (!sl) return { success: false, error: 'Snippet library not available' };

            const snippets = sl.getByCategory(category);
            return { success: true, snippets };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('snippets:delete', async (_, { id }: { id: string }) => {
        try {
            const sl = await getSnippetLibrary();
            if (!sl) return { success: false, error: 'Snippet library not available' };

            const deleted = sl.delete(id);
            await sl.save();
            return { success: deleted };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === AI TRANSLATOR ===

    ipcMain.handle('translate:text', async (_, { text, targetLang, sourceLang }: any) => {
        try {
            const at = await getAITranslator();
            if (!at) return { success: false, error: 'Translator not available' };

            const result = await at.translate(text, targetLang, sourceLang);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('translate:batch', async (_, { texts, targetLang }: any) => {
        try {
            const at = await getAITranslator();
            if (!at) return { success: false, error: 'Translator not available' };

            const results = await at.translateBatch(texts, targetLang);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('translate:detect', async (_, { text }: { text: string }) => {
        try {
            const at = await getAITranslator();
            if (!at) return { success: false, error: 'Translator not available' };

            const language = at.detectLanguage(text);
            const info = at.getLanguage(language);
            return { success: true, language, info };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('translate:languages', async () => {
        try {
            const at = await getAITranslator();
            if (!at) return { success: false, error: 'Translator not available' };

            const languages = at.getSupportedLanguages();
            return { success: true, languages };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Final enhancement IPC handlers registered');
}
