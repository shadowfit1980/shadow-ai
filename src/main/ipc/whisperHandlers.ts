/**
 * IPC handlers for Whisper voice transcription
 */

import { ipcMain } from 'electron';
import { getWhisperService } from '../services/WhisperService';

export function setupWhisperIPCHandlers(): void {
    const whisper = getWhisperService();

    // Transcribe audio buffer
    ipcMain.handle('whisper:transcribe', async (_event, audioData: ArrayBuffer | Buffer | any, options?: {
        language?: string;
        prompt?: string;
        temperature?: number;
    }) => {
        console.log('[Whisper IPC] Received transcribe request');
        console.log('[Whisper IPC] Audio data type:', typeof audioData, audioData?.constructor?.name);
        console.log('[Whisper IPC] Audio data length:', audioData?.byteLength || audioData?.length || 'unknown');

        try {
            // Handle different data types from IPC
            let buffer: Buffer;
            if (Buffer.isBuffer(audioData)) {
                buffer = audioData;
            } else if (audioData instanceof ArrayBuffer) {
                buffer = Buffer.from(audioData);
            } else if (audioData?.data) {
                // Electron may serialize ArrayBuffer as {type: 'Buffer', data: [...]}
                buffer = Buffer.from(audioData.data);
            } else if (Array.isArray(audioData)) {
                buffer = Buffer.from(audioData);
            } else {
                console.error('[Whisper IPC] Unknown audio data format:', audioData);
                return { success: false, error: 'Invalid audio data format' };
            }

            console.log('[Whisper IPC] Converted buffer size:', buffer.length);

            const result = await whisper.transcribe(buffer, options || {});
            console.log('[Whisper IPC] Transcription result:', result.success, result.error || result.text?.substring(0, 50));
            return result;
        } catch (error: any) {
            console.error('[Whisper IPC] Error:', error);
            return {
                success: false,
                error: error.message || 'Transcription failed'
            };
        }
    });

    // Transcribe audio file
    ipcMain.handle('whisper:transcribeFile', async (_event, filePath: string, options?: {
        language?: string;
        prompt?: string;
    }) => {
        try {
            const result = await whisper.transcribeFile(filePath, options || {});
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Transcription failed'
            };
        }
    });

    // Check if Whisper is available
    ipcMain.handle('whisper:isAvailable', async () => {
        return whisper.isAvailable();
    });

    // Set API key
    ipcMain.handle('whisper:setApiKey', async (_event, apiKey: string) => {
        whisper.setApiKey(apiKey);
        return { success: true };
    });

    console.log('Whisper IPC handlers registered');
}
