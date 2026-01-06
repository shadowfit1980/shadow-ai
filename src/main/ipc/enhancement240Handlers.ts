/**
 * Enhancement 240+ IPC Handlers - JetBrains-inspired IDE features
 */

import { ipcMain } from 'electron';

export function setupEnhancement240Handlers(): void {
    // INSPECTION
    ipcMain.handle('inspection:inspect', async (_, { file, code }: any) => {
        try { const { getInspectionEngine } = await import('../inspection/InspectionEngine'); return { success: true, inspections: getInspectionEngine().inspect(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // REFACTOR
    ipcMain.handle('refactor:rename', async (_, { file, oldName, newName, code }: any) => {
        try { const { getRefactorEngine } = await import('../refactoreng/RefactorEngine'); return { success: true, result: getRefactorEngine().rename(file, oldName, newName, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE STYLER
    ipcMain.handle('codestyle:format', async (_, { code }: any) => {
        try { const { getCodeStyler } = await import('../codestyler/CodeStyler'); return { success: true, formatted: getCodeStyler().format(code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LOCAL HISTORY
    ipcMain.handle('localhistory:save', async (_, { file, content, label }: any) => {
        try { const { getLocalHistory } = await import('../localhistory/LocalHistory'); return { success: true, entry: getLocalHistory().save(file, content, label) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('localhistory:get', async (_, { file }: any) => {
        try { const { getLocalHistory } = await import('../localhistory/LocalHistory'); return { success: true, history: getLocalHistory().getHistory(file) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // STRUCTURE VIEW
    ipcMain.handle('structure:analyze', async (_, { file, code }: any) => {
        try { const { getStructureView } = await import('../structview/StructureView'); return { success: true, structure: getStructureView().analyze(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TODO TRACKER
    ipcMain.handle('todo:scan', async (_, { file, code }: any) => {
        try { const { getTodoTracker } = await import('../todotracker/TodoTracker'); return { success: true, todos: getTodoTracker().scan(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DATABASE TOOLS
    ipcMain.handle('dbtools:connect', async (_, { id }: any) => {
        try { const { getDatabaseTools } = await import('../dbtools/DatabaseTools'); return { success: await getDatabaseTools().connect(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // HTTP CLIENT
    ipcMain.handle('http:execute', async (_, { id }: any) => {
        try { const { getHttpClient } = await import('../httpclient/HttpClient'); return { success: true, response: await getHttpClient().execute(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // RUN CONFIG
    ipcMain.handle('runconfig:run', async (_, { id }: any) => {
        try { const { getRunConfigManager } = await import('../runconfig/RunConfigManager'); return { success: true, result: await getRunConfigManager().run(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BUILD TOOLS
    ipcMain.handle('build:build', async (_, { id }: any) => {
        try { const { getBuildTools } = await import('../buildtools/BuildTools'); return { success: true, result: await getBuildTools().build(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 240+ IPC handlers registered (11 handlers)');
}
