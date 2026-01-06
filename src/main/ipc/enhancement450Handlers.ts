/**
 * Enhancement 450+ IPC Handlers - Bun runtime features
 */

import { ipcMain } from 'electron';

export function setupEnhancement450Handlers(): void {
    // FAST BUNDLER
    ipcMain.handle('bundle:build', async (_, { config }: any) => {
        try { const { getFastBundlerEngine } = await import('../fastbundler/FastBundlerEngine'); return { success: true, result: await getFastBundlerEngine().bundle(config) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // HOT RELOADER
    ipcMain.handle('hotreload:start', async (_, { patterns }: any) => {
        try { const { getHotReloaderEngine } = await import('../hotreload/HotReloaderEngine'); getHotReloaderEngine().start(patterns); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEST RUNNER
    ipcMain.handle('test:run', async (_, { patterns }: any) => {
        try { const { getTestRunnerEngine } = await import('../testrunner/TestRunnerEngine'); return { success: true, results: await getTestRunnerEngine().run(patterns) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PACKAGE INSTALLER
    ipcMain.handle('pkg:install', async (_, { packages }: any) => {
        try { const { getPackageInstallerEngine } = await import('../pkginstall/PackageInstallerEngine'); return { success: true, result: await getPackageInstallerEngine().install(packages) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SCRIPT RUNNER
    ipcMain.handle('script:run', async (_, { name, args }: any) => {
        try { const { getScriptRunnerEngine } = await import('../scriptrunner/ScriptRunnerEngine'); return { success: true, result: await getScriptRunnerEngine().run(name, args) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODULE RESOLVER
    ipcMain.handle('resolve:module', async (_, { specifier, importer }: any) => {
        try { const { getModuleResolverEngine } = await import('../moduleresolver/ModuleResolverEngine'); return { success: true, result: await getModuleResolverEngine().resolve(specifier, importer) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TRANSPILER
    ipcMain.handle('transpile:code', async (_, { code, filename }: any) => {
        try { const { getTranspilerEngine } = await import('../transpiler/TranspilerEngine'); return { success: true, result: await getTranspilerEngine().transpile(code, filename) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MACRO PROCESSOR
    ipcMain.handle('macro:process', async (_, { code }: any) => {
        try { const { getMacroProcessorEngine } = await import('../macroprocessor/MacroProcessorEngine'); return { success: true, result: await getMacroProcessorEngine().process(code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FFI BRIDGE
    ipcMain.handle('ffi:load', async (_, { path, symbols }: any) => {
        try { const { getFFIBridgeEngine } = await import('../ffibridge/FFIBridgeEngine'); return { success: true, library: await getFFIBridgeEngine().loadLibrary(path, symbols) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SQLITE DRIVER
    ipcMain.handle('sqlite:query', async (_, { dbId, sql, params }: any) => {
        try { const { getSQLiteDriverEngine } = await import('../sqlitedriver/SQLiteDriverEngine'); return { success: true, result: await getSQLiteDriverEngine().query(dbId, sql, params) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 450+ IPC handlers registered (10 handlers)');
}
