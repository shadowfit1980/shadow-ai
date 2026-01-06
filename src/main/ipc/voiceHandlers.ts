/**
 * Voice Control IPC Handlers
 * 
 * IPC handlers for voice control service
 */

import { ipcMain } from 'electron';
import { VoiceControlService } from '../services/VoiceControlService';

export function registerVoiceHandlers() {
    const voice = VoiceControlService.getInstance();

    ipcMain.handle('voice:startListening', async () => {
        return voice.startListening();
    });

    ipcMain.handle('voice:stopListening', async () => {
        voice.stopListening();
        return true;
    });

    ipcMain.handle('voice:toggleListening', async () => {
        return voice.toggleListening();
    });

    ipcMain.handle('voice:processTranscript', async (_, result) => {
        return voice.processTranscript(result);
    });

    ipcMain.handle('voice:registerCommand', async (_, command) => {
        voice.registerCommand(command);
        return true;
    });

    ipcMain.handle('voice:unregisterCommand', async (_, id) => {
        return voice.unregisterCommand(id);
    });

    ipcMain.handle('voice:getCommands', async () => {
        return voice.getCommands();
    });

    ipcMain.handle('voice:updateSettings', async (_, updates) => {
        return voice.updateSettings(updates);
    });

    ipcMain.handle('voice:getSettings', async () => {
        return voice.getSettings();
    });

    ipcMain.handle('voice:isListening', async () => {
        return voice.getIsListening();
    });

    ipcMain.handle('voice:getHistory', async (_, limit) => {
        return voice.getTranscriptHistory(limit);
    });

    ipcMain.handle('voice:clearHistory', async () => {
        voice.clearHistory();
        return true;
    });

    ipcMain.handle('voice:speak', async (_, text, options) => {
        voice.speak(text, options);
        return true;
    });
}
