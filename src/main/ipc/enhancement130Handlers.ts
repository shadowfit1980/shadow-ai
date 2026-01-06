/**
 * Enhancement 130+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupEnhancement130Handlers(): void {
    // KEYBINDINGS
    ipcMain.handle('keybindings:register', async (_, { keys, command }: any) => {
        try { const { getKeybindingsManager } = await import('../keybindings/KeybindingsManager'); return { success: true, binding: getKeybindingsManager().register(keys, command) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('keybindings:getAll', async () => {
        try { const { getKeybindingsManager } = await import('../keybindings/KeybindingsManager'); return { success: true, bindings: getKeybindingsManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COMMANDS
    ipcMain.handle('commands2:execute', async (_, { id }: any) => {
        try { const { getCommandRegistry } = await import('../commands2/CommandRegistry'); return { success: await getCommandRegistry().execute(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('commands2:search', async (_, { query }: any) => {
        try { const { getCommandRegistry } = await import('../commands2/CommandRegistry'); return { success: true, commands: getCommandRegistry().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TELEMETRY
    ipcMain.handle('telemetry:track', async (_, { name, properties }: any) => {
        try { const { getTelemetryService } = await import('../telemetry/TelemetryService'); getTelemetryService().track(name, properties); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('telemetry:toggle', async (_, { enabled }: any) => {
        try { const { getTelemetryService } = await import('../telemetry/TelemetryService'); enabled ? getTelemetryService().enable() : getTelemetryService().disable(); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DIAGNOSTICS
    ipcMain.handle('diagnostics:generateReport', async () => {
        try { const { getDiagnosticsManager } = await import('../diagnostics/DiagnosticsManager'); return { success: true, report: getDiagnosticsManager().generateReport() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('diagnostics:hasIssues', async () => {
        try { const { getDiagnosticsManager } = await import('../diagnostics/DiagnosticsManager'); return { success: true, hasIssues: getDiagnosticsManager().hasIssues() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // RECOVERY
    ipcMain.handle('recovery:createPoint', async (_, { name, data }: any) => {
        try { const { getRecoveryManager } = await import('../recovery/RecoveryManager'); return { success: true, point: getRecoveryManager().createPoint(name, data) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('recovery:getLatest', async () => {
        try { const { getRecoveryManager } = await import('../recovery/RecoveryManager'); return { success: true, point: getRecoveryManager().getLatest() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 130+ IPC handlers registered (10 handlers)');
}
