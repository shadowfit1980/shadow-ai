/**
 * Enhancement 310+ IPC Handlers - Wisprflow-inspired voice dictation features
 */

import { ipcMain } from 'electron';

export function setupEnhancement310Handlers(): void {
    // VOICE TO CODE
    ipcMain.handle('voicecode:start', async (_, { language }: any) => {
        try { const { getVoiceToCode } = await import('../voicetocode/VoiceToCode'); return { success: true, session: getVoiceToCode().start(language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SPEECH RECOGNITION
    ipcMain.handle('speech:recognize', async (_, { audioData }: any) => {
        try { const { getSpeechRecognitionEngine } = await import('../speechrec/SpeechRecognitionEngine'); return { success: true, result: await getSpeechRecognitionEngine().recognize(audioData) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VOICE COMMANDS
    ipcMain.handle('voicecmd:match', async (_, { transcript }: any) => {
        try { const { getVoiceCommandsManager } = await import('../voicecmds/VoiceCommandsManager'); return { success: true, command: getVoiceCommandsManager().match(transcript) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DICTATION
    ipcMain.handle('dictation:start', async () => {
        try { const { getDictationEngine } = await import('../dictation/DictationEngine'); return { success: true, session: getDictationEngine().start() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEXT EXPANSION
    ipcMain.handle('textexpand:expand', async (_, { text }: any) => {
        try { const { getTextExpansionEngine } = await import('../textexpand/TextExpansionEngine'); return { success: true, result: getTextExpansionEngine().expand(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AUDIO PROCESSOR
    ipcMain.handle('audio:process', async (_, { audioData }: any) => {
        try { const { getAudioProcessorEngine } = await import('../audioprocessor/AudioProcessorEngine'); return { success: true, chunk: getAudioProcessorEngine().process(audioData) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VOICE SHORTCUTS
    ipcMain.handle('voiceshortcut:match', async (_, { transcript }: any) => {
        try { const { getVoiceShortcutsManager } = await import('../voiceshortcuts/VoiceShortcutsManager'); return { success: true, shortcut: getVoiceShortcutsManager().match(transcript) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // WAKE WORD
    ipcMain.handle('wakeword:detect', async (_, { transcript }: any) => {
        try { const { getWakeWordDetector } = await import('../wakeword/WakeWordDetector'); return { success: true, event: getWakeWordDetector().detect(transcript) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VOICE FEEDBACK
    ipcMain.handle('voicefeedback:play', async (_, { soundId }: any) => {
        try { const { getVoiceFeedbackEngine } = await import('../voicefeedback/VoiceFeedbackEngine'); return { success: getVoiceFeedbackEngine().play(soundId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TRANSCRIPTION HISTORY
    ipcMain.handle('transcription:getRecent', async (_, { limit }: any) => {
        try { const { getTranscriptionHistoryManager } = await import('../transcripthist/TranscriptionHistoryManager'); return { success: true, entries: getTranscriptionHistoryManager().getRecent(limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 310+ IPC handlers registered (10 handlers)');
}
