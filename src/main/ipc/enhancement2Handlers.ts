/**
 * Enhancement Feature IPC Handlers 2
 */

import { ipcMain } from 'electron';

export function setupEnhancement2Handlers(): void {
    // SNIPPET
    ipcMain.handle('snippet:add', async (_, { name, language, code, tags }: any) => {
        try { const { getSnippetManager } = await import('../snippet/SnippetManager'); return { success: true, snippet: getSnippetManager().add(name, language, code, tags) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('snippet:getAll', async () => {
        try { const { getSnippetManager } = await import('../snippet/SnippetManager'); return { success: true, snippets: getSnippetManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('snippet:search', async (_, { query }: any) => {
        try { const { getSnippetManager } = await import('../snippet/SnippetManager'); return { success: true, snippets: getSnippetManager().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEMPLATE
    ipcMain.handle('template:getAll', async () => {
        try { const { getTemplateEngine } = await import('../template/TemplateEngine'); return { success: true, templates: getTemplateEngine().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('template:render', async (_, { id, variables }: any) => {
        try { const { getTemplateEngine } = await import('../template/TemplateEngine'); return { success: true, files: getTemplateEngine().render(id, variables) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LICENSE
    ipcMain.handle('license:generate', async (_, { type, author, year }: any) => {
        try { const { getLicenseGenerator } = await import('../license/LicenseGenerator'); return { success: true, license: getLicenseGenerator().generate(type, author, year) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('license:getAvailable', async () => {
        try { const { getLicenseGenerator } = await import('../license/LicenseGenerator'); return { success: true, licenses: getLicenseGenerator().getAvailable() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // README
    ipcMain.handle('readme:generate', async (_, config: any) => {
        try { const { getReadmeGenerator } = await import('../readme/ReadmeGenerator'); return { success: true, readme: getReadmeGenerator().generate(config) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CHANGELOG
    ipcMain.handle('changelog:addEntry', async (_, entry: any) => {
        try { const { getChangelogGenerator } = await import('../changelog/ChangelogGenerator'); getChangelogGenerator().addEntry(entry); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('changelog:generate', async () => {
        try { const { getChangelogGenerator } = await import('../changelog/ChangelogGenerator'); return { success: true, changelog: getChangelogGenerator().generate() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MIGRATION
    ipcMain.handle('migration:register', async (_, { name, up, down }: any) => {
        try { const { getMigrationManager } = await import('../migration/MigrationManager'); return { success: true, migration: getMigrationManager().register(name, up, down) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('migration:getPending', async () => {
        try { const { getMigrationManager } = await import('../migration/MigrationManager'); return { success: true, migrations: getMigrationManager().getPending() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BENCHMARK
    ipcMain.handle('benchmark:getResults', async () => {
        try { const { getBenchmarkRunner } = await import('../benchmark/BenchmarkRunner'); return { success: true, results: getBenchmarkRunner().getResults() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement2 feature IPC handlers registered (13 handlers)');
}
