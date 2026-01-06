/**
 * Voice Enhancement IPC Handlers
 * IPC bridge for VoiceDictionary and ToneAdapter
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let voiceDictionary: any = null;
let toneAdapter: any = null;

async function getVoiceDictionary() {
    if (!voiceDictionary) {
        try {
            const { getVoiceDictionary: getVD } = await import('../voice/VoiceDictionary');
            voiceDictionary = getVD();
            await voiceDictionary.load();
        } catch (error) {
            console.warn('⚠️ VoiceDictionary not available:', (error as Error).message);
            return null;
        }
    }
    return voiceDictionary;
}

async function getToneAdapter() {
    if (!toneAdapter) {
        try {
            const { getToneAdapter: getTA } = await import('../voice/ToneAdapter');
            toneAdapter = getTA();
        } catch (error) {
            console.warn('⚠️ ToneAdapter not available:', (error as Error).message);
            return null;
        }
    }
    return toneAdapter;
}

/**
 * Setup voice enhancement handlers
 */
export function setupVoiceEnhancementHandlers(): void {
    // === VOICE DICTIONARY ===

    ipcMain.handle('voiceDict:addWord', async (_, { word, options }: any) => {
        try {
            const vd = await getVoiceDictionary();
            if (!vd) return { success: false, error: 'Voice dictionary not available' };

            const entry = vd.addWord(word, options || {});
            await vd.save();
            return { success: true, entry };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('voiceDict:learnCorrection', async (_, { spoken, corrected }: any) => {
        try {
            const vd = await getVoiceDictionary();
            if (!vd) return { success: false, error: 'Voice dictionary not available' };

            const phrase = vd.learnCorrection(spoken, corrected);
            await vd.save();
            return { success: true, phrase };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('voiceDict:applyCorrections', async (_, { text }: { text: string }) => {
        try {
            const vd = await getVoiceDictionary();
            if (!vd) return { success: false, error: 'Voice dictionary not available' };

            const corrected = vd.applyCorrections(text);
            return { success: true, corrected };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('voiceDict:search', async (_, { query, limit }: any) => {
        try {
            const vd = await getVoiceDictionary();
            if (!vd) return { success: false, error: 'Voice dictionary not available' };

            const results = vd.search(query, limit);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('voiceDict:getTopWords', async (_, { limit }: any = {}) => {
        try {
            const vd = await getVoiceDictionary();
            if (!vd) return { success: false, error: 'Voice dictionary not available' };

            const words = vd.getTopWords(limit);
            return { success: true, words };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('voiceDict:import', async (_, { words, category }: any) => {
        try {
            const vd = await getVoiceDictionary();
            if (!vd) return { success: false, error: 'Voice dictionary not available' };

            const count = vd.importWords(words, category);
            await vd.save();
            return { success: true, imported: count };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('voiceDict:stats', async () => {
        try {
            const vd = await getVoiceDictionary();
            if (!vd) return { success: false, error: 'Voice dictionary not available' };

            const stats = vd.getStats();
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === TONE ADAPTER ===

    ipcMain.handle('tone:setApp', async (_, { appName }: { appName: string }) => {
        try {
            const ta = await getToneAdapter();
            if (!ta) return { success: false, error: 'Tone adapter not available' };

            const settings = ta.setActiveApp(appName);
            return { success: true, settings };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tone:applyTone', async (_, { text, settings }: any) => {
        try {
            const ta = await getToneAdapter();
            if (!ta) return { success: false, error: 'Tone adapter not available' };

            const result = ta.applyTone(text, settings);
            return { success: true, text: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tone:getProfiles', async () => {
        try {
            const ta = await getToneAdapter();
            if (!ta) return { success: false, error: 'Tone adapter not available' };

            const profiles = ta.getAllProfiles();
            return { success: true, profiles };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tone:addProfile', async (_, { id, profile }: any) => {
        try {
            const ta = await getToneAdapter();
            if (!ta) return { success: false, error: 'Tone adapter not available' };

            ta.addProfile(id, profile);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tone:updateProfile', async (_, { id, settings }: any) => {
        try {
            const ta = await getToneAdapter();
            if (!ta) return { success: false, error: 'Tone adapter not available' };

            const updated = ta.updateProfile(id, settings);
            return { success: updated };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tone:getCurrent', async () => {
        try {
            const ta = await getToneAdapter();
            if (!ta) return { success: false, error: 'Tone adapter not available' };

            const settings = ta.getCurrentSettings();
            return { success: true, settings };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Voice enhancement IPC handlers registered');
}
