/**
 * Text-to-Speech IPC Handlers
 * 
 * Exposes TextToSpeechService to the renderer process.
 */

import { ipcMain } from 'electron';
import { textToSpeechService, TTSRequest, TTSProvider } from '../ai/voice/TextToSpeechService';

export function registerTTSHandlers(): void {
    // Speak text
    ipcMain.handle('tts:speak', async (_event, request: TTSRequest) => {
        try {
            const result = await textToSpeechService.speak(request);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    // Get available voices
    ipcMain.handle('tts:get-voices', async (_event, provider?: TTSProvider) => {
        return textToSpeechService.getVoices(provider);
    });

    // Get providers
    ipcMain.handle('tts:get-providers', async () => {
        return textToSpeechService.getProviders();
    });

    // Set provider API key
    ipcMain.handle('tts:set-provider-key', async (_event, provider: TTSProvider, apiKey: string) => {
        textToSpeechService.setProviderKey(provider, apiKey);
        return { success: true };
    });

    // Set active provider
    ipcMain.handle('tts:set-provider', async (_event, provider: TTSProvider) => {
        textToSpeechService.setActiveProvider(provider);
        return { success: true };
    });

    // Subscribe to events
    textToSpeechService.on('speech-generated', (result) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('tts:generated', result);
        });
    });

    console.log('🔊 TTS handlers registered');
}
