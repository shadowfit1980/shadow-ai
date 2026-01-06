/**
 * Enhancement 120+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupEnhancement120Handlers(): void {
    // DEBUGGER
    ipcMain.handle('debugger:createSession', async (_, { name }: any) => {
        try { const { getDebuggerManager } = await import('../debugger/DebuggerManager'); return { success: true, session: getDebuggerManager().createSession(name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('debugger:start', async (_, { id }: any) => {
        try { const { getDebuggerManager } = await import('../debugger/DebuggerManager'); return { success: getDebuggerManager().start(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('debugger:addBreakpoint', async (_, { sessionId, file, line, condition }: any) => {
        try { const { getDebuggerManager } = await import('../debugger/DebuggerManager'); return { success: true, breakpoint: getDebuggerManager().addBreakpoint(sessionId, file, line, condition) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROFILER
    ipcMain.handle('profiler2:start', async (_, { name }: any) => {
        try { const { getCodeProfiler } = await import('../profiler2/CodeProfiler'); return { success: true, session: getCodeProfiler().start(name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('profiler2:stop', async () => {
        try { const { getCodeProfiler } = await import('../profiler2/CodeProfiler'); return { success: true, session: getCodeProfiler().stop() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('profiler2:getHotspots', async (_, { sessionId, limit }: any) => {
        try { const { getCodeProfiler } = await import('../profiler2/CodeProfiler'); return { success: true, hotspots: getCodeProfiler().getHotspots(sessionId, limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SANDBOX
    ipcMain.handle('sandbox:execute', async (_, { code, context }: any) => {
        try { const { getSandboxManager } = await import('../sandbox/SandboxManager'); return await getSandboxManager().execute(code, context); }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('sandbox:configure', async (_, config: any) => {
        try { const { getSandboxManager } = await import('../sandbox/SandboxManager'); getSandboxManager().configure(config); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTAINER
    ipcMain.handle('container:run', async (_, { name, image, ports }: any) => {
        try { const { getContainerManager } = await import('../container/ContainerManager'); return { success: true, container: await getContainerManager().run(name, image, ports) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('container:stop', async (_, { id }: any) => {
        try { const { getContainerManager } = await import('../container/ContainerManager'); return { success: await getContainerManager().stop(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('container:getAll', async () => {
        try { const { getContainerManager } = await import('../container/ContainerManager'); return { success: true, containers: getContainerManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 120+ IPC handlers registered (11 handlers)');
}
