/**
 * IPC Handlers for Code Completion
 * Exposes completion functionality to renderer process
 */

import { ipcMain } from 'electron';

// Lazy-loaded completion engine to avoid startup errors
let completionEngine: any = null;
let realtimeTrigger: any = null;

async function getEngine() {
    if (!completionEngine) {
        try {
            const { getCompletionEngine } = await import('../ai/completion/CompletionEngine');
            completionEngine = getCompletionEngine();
        } catch (error) {
            console.warn('⚠️ CompletionEngine not available:', (error as Error).message);
            return null;
        }
    }
    return completionEngine;
}

async function getRealtimeTrigger() {
    if (!realtimeTrigger) {
        try {
            const { getRealtimeCompletionTrigger } = await import('../ai/completion/RealtimeCompletionTrigger');
            realtimeTrigger = getRealtimeCompletionTrigger();
        } catch (error) {
            console.warn('⚠️ RealtimeCompletionTrigger not available:', (error as Error).message);
            return null;
        }
    }
    return realtimeTrigger;
}

export function setupCompletionIPCHandlers() {

    // Real-time keystroke handling (Cursor-like Tab autocomplete)
    ipcMain.handle('completion:keystroke', async (event, keystroke: any) => {
        try {
            const trigger = await getRealtimeTrigger();
            if (!trigger) return { success: false, error: 'Realtime trigger not available' };

            trigger.onKeystroke(keystroke);

            // Set up one-time listener for completion result
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ success: true, completion: null });
                }, 2000); // 2 second timeout

                trigger.once('completion', (completion: any) => {
                    clearTimeout(timeout);
                    resolve({ success: true, completion });
                });

                trigger.once('error', (error: Error) => {
                    clearTimeout(timeout);
                    resolve({ success: false, error: error.message });
                });
            });
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Accept real-time completion (Tab key)
    ipcMain.handle('completion:realtime:accept', async () => {
        try {
            const trigger = await getRealtimeTrigger();
            if (!trigger) return { success: false, error: 'Realtime trigger not available' };
            const completion = trigger.acceptCompletion();
            return { success: true, completion };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Reject real-time completion (Escape or type-through)
    ipcMain.handle('completion:realtime:reject', async () => {
        try {
            const trigger = await getRealtimeTrigger();
            if (!trigger) return { success: false, error: 'Realtime trigger not available' };
            trigger.rejectCompletion();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Configure real-time trigger
    ipcMain.handle('completion:realtime:config', async (_, config: any) => {
        try {
            const trigger = await getRealtimeTrigger();
            if (!trigger) return { success: false, error: 'Realtime trigger not available' };
            trigger.setConfig(config);
            return { success: true, config: trigger.getConfig() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get real-time trigger metrics
    ipcMain.handle('completion:realtime:metrics', async () => {
        try {
            const trigger = await getRealtimeTrigger();
            if (!trigger) return { success: false, error: 'Realtime trigger not available' };
            return { success: true, metrics: trigger.getMetrics() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Navigate to next predicted edit location
    ipcMain.handle('completion:navigate-next', async () => {
        try {
            const trigger = await getRealtimeTrigger();
            if (!trigger) return { success: false, error: 'Realtime trigger not available' };
            const position = await trigger.navigateToNextPrediction();
            return { success: true, position };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get inline completion (ghost text)
    ipcMain.handle('completion:getInline', async (_, editorContext: any) => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        try {
            const result = await provider.requestInlineCompletion(editorContext);
            return { success: true, completion: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get multiple completion suggestions
    ipcMain.handle('completion:getSuggestions', async (_, editorContext: any) => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        try {
            const result = await provider.requestCompletions(editorContext);
            return { success: true, completions: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // NEW: Get completion using new CompletionEngine
    ipcMain.handle('completion:get', async (_, request: any) => {
        try {
            const engine = await getEngine();
            if (!engine) return { success: false, error: 'Completion engine not available' };
            const completion = await engine.getCompletion(request);
            return { success: true, completion };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // NEW: Get streaming completion
    ipcMain.handle('completion:stream', async (event, request: any) => {
        try {
            const engine = await getEngine();
            if (!engine) return { success: false, error: 'Completion engine not available' };
            await engine.getStreamingCompletion(request, {
                onToken: (token: string) => {
                    event.sender.send('completion:stream:token', { token });
                },
                onComplete: (fullText: string) => {
                    event.sender.send('completion:stream:complete', { text: fullText });
                },
                onError: (error: Error) => {
                    event.sender.send('completion:stream:error', { error: error.message });
                },
            });
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // NEW: Get multi-line completion
    ipcMain.handle('completion:multiline', async (_, request: any) => {
        try {
            const engine = await getEngine();
            if (!engine) return { success: false, error: 'Completion engine not available' };
            const completion = await engine.getMultiLineCompletion(request);
            return { success: true, completion };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // NEW: Get diff-based completion (refactor selection)
    ipcMain.handle('completion:diff', async (_, filePath: string, content: string, selection: any, instruction: string) => {
        try {
            const engine = await getEngine();
            if (!engine) return { success: false, error: 'Completion engine not available' };
            const completion = await engine.getDiffCompletion(filePath, content, selection, instruction);
            return { success: true, completion };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // NEW: Invalidate file cache
    ipcMain.handle('completion:invalidate', async (_, filePath: string) => {
        try {
            const engine = await getEngine();
            if (!engine) return { success: false, error: 'Completion engine not available' };
            engine.invalidateFileCache(filePath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // NEW: Get completion statistics
    ipcMain.handle('completion:stats', async () => {
        try {
            const engine = await getEngine();
            if (!engine) return { success: false, error: 'Completion engine not available' };
            const stats = engine.getStats();
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Accept completion suggestion
    ipcMain.handle('completion:accept', async (_, completion: any, partial: boolean = false) => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        provider.acceptSuggestion(completion, partial);
        return { success: true };
    });

    // Reject completion suggestion
    ipcMain.handle('completion:reject', async () => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        provider.rejectSuggestion();
        return { success: true };
    });

    // Cancel pending completions
    ipcMain.handle('completion:cancel', async (_, requestKey?: string) => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        if (requestKey) {
            provider.cancelRequest(requestKey);
        } else {
            provider.cancelAllRequests();
        }

        return { success: true };
    });

    // Get completion metrics
    ipcMain.handle('completion:getMetrics', async () => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        return provider.getMetrics();
    });

    // Update completion configuration
    ipcMain.handle('completion:updateConfig', async (_, config: any) => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        provider.updateConfig(config);
        return { success: true };
    });

    // Get completion configuration
    ipcMain.handle('completion:getConfig', async () => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        return provider.getConfig();
    });

    // Clear completion cache
    ipcMain.handle('completion:clearCache', async () => {
        const { getCompletionProvider } = await import('../ai/completion');
        const provider = getCompletionProvider();

        provider.clearCache();
        return { success: true };
    });

    console.log('✅ Completion IPC handlers registered');
}
