/**
 * Maximum Feature IPC Handlers
 * IPC bridge for all new modules
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let commandPalette: any = null;
let fileWatcher: any = null;
let cacheManager: any = null;
let searchEngine: any = null;
let clipboardManager: any = null;
let metricsCollector: any = null;
let taskScheduler: any = null;
let stateManager: any = null;

async function getService(name: string, path: string, getter: string) {
    try {
        const module = await import(path);
        return module[getter]();
    } catch (error) {
        console.warn(`⚠️ ${name} not available:`, (error as Error).message);
        return null;
    }
}

/**
 * Setup maximum feature handlers
 */
export function setupMaxHandlers(): void {
    // === COMMAND PALETTE ===
    ipcMain.handle('cmd:search', async (_, { query }: any) => {
        try {
            const cp = commandPalette || (commandPalette = (await import('../commands/CommandPalette')).getCommandPalette());
            return { success: true, commands: cp.search(query) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cmd:execute', async (_, { id }: any) => {
        try {
            const cp = commandPalette || (commandPalette = (await import('../commands/CommandPalette')).getCommandPalette());
            const result = await cp.execute(id);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cmd:getAll', async () => {
        try {
            const cp = commandPalette || (commandPalette = (await import('../commands/CommandPalette')).getCommandPalette());
            return { success: true, commands: cp.getAll() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === FILE WATCHER ===
    ipcMain.handle('watch:add', async (_, { path }: any) => {
        try {
            const fw = fileWatcher || (fileWatcher = (await import('../watcher/FileWatcher')).getFileWatcher());
            return { success: fw.watch(path) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('watch:remove', async (_, { path }: any) => {
        try {
            const fw = fileWatcher || (fileWatcher = (await import('../watcher/FileWatcher')).getFileWatcher());
            return { success: fw.unwatch(path) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('watch:getAll', async () => {
        try {
            const fw = fileWatcher || (fileWatcher = (await import('../watcher/FileWatcher')).getFileWatcher());
            return { success: true, watched: fw.getWatched() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CACHE MANAGER ===
    ipcMain.handle('cache:set', async (_, { key, value, ttl }: any) => {
        try {
            const cm = cacheManager || (cacheManager = (await import('../cache/CacheManager')).getCacheManager());
            cm.set(key, value, ttl);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cache:get', async (_, { key }: any) => {
        try {
            const cm = cacheManager || (cacheManager = (await import('../cache/CacheManager')).getCacheManager());
            return { success: true, value: cm.get(key) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cache:clear', async () => {
        try {
            const cm = cacheManager || (cacheManager = (await import('../cache/CacheManager')).getCacheManager());
            cm.clear();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === SEARCH ENGINE ===
    ipcMain.handle('search:index', async (_, doc: any) => {
        try {
            const se = searchEngine || (searchEngine = (await import('../search/SearchEngine')).getSearchEngine());
            se.index(doc);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('search:query', async (_, { query, limit }: any) => {
        try {
            const se = searchEngine || (searchEngine = (await import('../search/SearchEngine')).getSearchEngine());
            return { success: true, results: se.search(query, limit) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CLIPBOARD ===
    ipcMain.handle('clipboard:copy', async (_, { content }: any) => {
        try {
            const cb = clipboardManager || (clipboardManager = (await import('../clipboard/ClipboardManager')).getClipboardManager());
            cb.copy(content);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clipboard:paste', async () => {
        try {
            const cb = clipboardManager || (clipboardManager = (await import('../clipboard/ClipboardManager')).getClipboardManager());
            return { success: true, content: cb.paste() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('clipboard:history', async () => {
        try {
            const cb = clipboardManager || (clipboardManager = (await import('../clipboard/ClipboardManager')).getClipboardManager());
            return { success: true, history: cb.getHistory() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === METRICS ===
    ipcMain.handle('metrics:record', async (_, { name, value, tags }: any) => {
        try {
            const mc = metricsCollector || (metricsCollector = (await import('../metrics/MetricsCollector')).getMetricsCollector());
            mc.record(name, value, tags);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('metrics:increment', async (_, { name, by }: any) => {
        try {
            const mc = metricsCollector || (metricsCollector = (await import('../metrics/MetricsCollector')).getMetricsCollector());
            return { success: true, value: mc.increment(name, by) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('metrics:getAll', async () => {
        try {
            const mc = metricsCollector || (metricsCollector = (await import('../metrics/MetricsCollector')).getMetricsCollector());
            return { success: true, counters: mc.getAllCounters(), metrics: mc.getMetrics() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === SCHEDULER ===
    ipcMain.handle('scheduler:getAll', async () => {
        try {
            const ts = taskScheduler || (taskScheduler = (await import('../scheduler/TaskScheduler')).getTaskScheduler());
            return { success: true, tasks: ts.getAll().map((t: any) => ({ id: t.id, name: t.name, running: t.running, lastRun: t.lastRun })) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('scheduler:cancel', async (_, { id }: any) => {
        try {
            const ts = taskScheduler || (taskScheduler = (await import('../scheduler/TaskScheduler')).getTaskScheduler());
            return { success: ts.cancel(id) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === STATE MANAGER ===
    ipcMain.handle('state:get', async (_, { key }: any) => {
        try {
            const sm = stateManager || (stateManager = (await import('../state/StateManager')).getStateManager());
            return { success: true, value: sm.get(key) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('state:set', async (_, { key, value }: any) => {
        try {
            const sm = stateManager || (stateManager = (await import('../state/StateManager')).getStateManager());
            sm.set(key, value);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('state:getAll', async () => {
        try {
            const sm = stateManager || (stateManager = (await import('../state/StateManager')).getStateManager());
            return { success: true, state: sm.getState() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('state:undo', async () => {
        try {
            const sm = stateManager || (stateManager = (await import('../state/StateManager')).getStateManager());
            return { success: sm.undo() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Maximum feature IPC handlers registered (24 handlers)');
}
