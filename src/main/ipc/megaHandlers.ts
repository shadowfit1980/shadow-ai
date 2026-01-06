/**
 * Mega Feature IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupMegaHandlers(): void {
    // LOGGER
    ipcMain.handle('logger:log', async (_, { level, message, context }: any) => {
        try {
            const { getLogger } = await import('../logger/Logger');
            getLogger()[level](message, context);
            return { success: true };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('logger:getEntries', async (_, { level, limit }: any = {}) => {
        try {
            const { getLogger } = await import('../logger/Logger');
            return { success: true, entries: getLogger().getEntries(level, limit) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // BACKUP
    ipcMain.handle('backup:create', async (_, { sourcePath, name }: any) => {
        try {
            const { getBackupManager } = await import('../backup/BackupManager');
            const backup = await getBackupManager().create(sourcePath, name);
            return { success: true, backup };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('backup:restore', async (_, { id }: any) => {
        try {
            const { getBackupManager } = await import('../backup/BackupManager');
            return { success: await getBackupManager().restore(id) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('backup:getAll', async () => {
        try {
            const { getBackupManager } = await import('../backup/BackupManager');
            return { success: true, backups: getBackupManager().getAll() };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // TOKENIZER
    ipcMain.handle('tokenizer:tokenize', async (_, { text }: any) => {
        try {
            const { getTokenizer } = await import('../tokenizer/Tokenizer');
            return { success: true, result: getTokenizer().tokenize(text) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('tokenizer:count', async (_, { text }: any) => {
        try {
            const { getTokenizer } = await import('../tokenizer/Tokenizer');
            return { success: true, count: getTokenizer().countTokens(text) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // REGEX
    ipcMain.handle('regex:test', async (_, { pattern, text, flags }: any) => {
        try {
            const { getRegexTester } = await import('../regex/RegexTester');
            return { success: true, result: getRegexTester().test(pattern, text, flags) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('regex:replace', async (_, { pattern, text, replacement, flags }: any) => {
        try {
            const { getRegexTester } = await import('../regex/RegexTester');
            return { success: true, result: getRegexTester().replace(pattern, text, replacement, flags) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // COLOR
    ipcMain.handle('color:parse', async (_, { color }: any) => {
        try {
            const { getColorPicker } = await import('../colorpicker/ColorPicker');
            return { success: true, info: getColorPicker().parseColor(color) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('color:getSaved', async () => {
        try {
            const { getColorPicker } = await import('../colorpicker/ColorPicker');
            return { success: true, colors: getColorPicker().getSaved() };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // BOOKMARK
    ipcMain.handle('bookmark:add', async (_, { title, path, type, tags }: any) => {
        try {
            const { getBookmarkManager } = await import('../bookmark/BookmarkManager');
            return { success: true, bookmark: getBookmarkManager().add(title, path, type, tags) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('bookmark:getAll', async () => {
        try {
            const { getBookmarkManager } = await import('../bookmark/BookmarkManager');
            return { success: true, bookmarks: getBookmarkManager().getAll() };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('bookmark:search', async (_, { query }: any) => {
        try {
            const { getBookmarkManager } = await import('../bookmark/BookmarkManager');
            return { success: true, bookmarks: getBookmarkManager().search(query) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // TIMER
    ipcMain.handle('timer:create', async (_, { name, duration }: any) => {
        try {
            const { getTimerManager } = await import('../timer/TimerManager');
            return { success: true, timer: getTimerManager().create(name, duration) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('timer:start', async (_, { id }: any) => {
        try {
            const { getTimerManager } = await import('../timer/TimerManager');
            return { success: getTimerManager().start(id) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('timer:getAll', async () => {
        try {
            const { getTimerManager } = await import('../timer/TimerManager');
            return { success: true, timers: getTimerManager().getAll() };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    // QUEUE
    ipcMain.handle('queue:add', async (_, { data, priority }: any) => {
        try {
            const { getQueueManager } = await import('../queue/QueueManager');
            return { success: true, job: getQueueManager().add(data, priority) };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('queue:getAll', async () => {
        try {
            const { getQueueManager } = await import('../queue/QueueManager');
            return { success: true, jobs: getQueueManager().getAll() };
        } catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Mega feature IPC handlers registered (20 handlers)');
}
