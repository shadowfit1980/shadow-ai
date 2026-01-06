/**
 * Enhancement 260+ IPC Handlers - Cursor-inspired AI editor features
 */

import { ipcMain } from 'electron';

export function setupEnhancement260Handlers(): void {
    // CURSOR RULES
    ipcMain.handle('cursorrules:add', async (_, { name, content, scope }: any) => {
        try { const { getCursorRulesManager } = await import('../cursorrules/CursorRulesManager'); return { success: true, rule: getCursorRulesManager().add(name, content, scope) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COMPOSER
    ipcMain.handle('composer:start', async (_, { prompt }: any) => {
        try { const { getComposerEngine } = await import('../composer/ComposerEngine'); return { success: true, session: getComposerEngine().start(prompt) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AGENT MODE
    ipcMain.handle('agentmode:create', async (_, { goal }: any) => {
        try { const { getAgentModeEngine } = await import('../agentmode/AgentModeEngine'); return { success: true, task: getAgentModeEngine().create(goal) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CHAT WITH CODE
    ipcMain.handle('chatwithcode:start', async (_, { file, start, end }: any) => {
        try { const { getChatWithCodeEngine } = await import('../chatwithcode/ChatWithCodeEngine'); return { success: true, chat: getChatWithCodeEngine().start(file, start, end) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MULTI-FILE EDIT
    ipcMain.handle('multifileedit:create', async (_, { description }: any) => {
        try { const { getMultiFileEditEngine } = await import('../multifileedit/MultiFileEditEngine'); return { success: true, edit: getMultiFileEditEngine().create(description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('multifileedit:acceptAll', async (_, { editId }: any) => {
        try { const { getMultiFileEditEngine } = await import('../multifileedit/MultiFileEditEngine'); return { success: getMultiFileEditEngine().acceptAll(editId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SYMBOL SEARCH
    ipcMain.handle('symbolsearch:search', async (_, { query }: any) => {
        try { const { getSymbolSearchEngine } = await import('../symbolsearch/SymbolSearchEngine'); return { success: true, symbols: getSymbolSearchEngine().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // IMPORT RESOLVER
    ipcMain.handle('import:resolve', async (_, { symbol }: any) => {
        try { const { getImportResolver } = await import('../importresolver/ImportResolver'); return { success: true, suggestion: getImportResolver().resolve(symbol) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODEBASE CHAT
    ipcMain.handle('codebasechat:query', async (_, { question }: any) => {
        try { const { getCodebaseChatEngine } = await import('../codebasechat/CodebaseChatEngine'); return { success: true, result: await getCodebaseChatEngine().query(question) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SUGGESTIONS
    ipcMain.handle('suggestions:generate', async (_, { code, line, column }: any) => {
        try { const { getSuggestionsEngine } = await import('../suggestionseng/SuggestionsEngine'); return { success: true, suggestions: getSuggestionsEngine().generate(code, line, column) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // NOTEPADS
    ipcMain.handle('notepads:create', async (_, { name, content }: any) => {
        try { const { getNotepadsManager } = await import('../notepads/NotepadsManager'); return { success: true, notepad: getNotepadsManager().create(name, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('notepads:getAll', async () => {
        try { const { getNotepadsManager } = await import('../notepads/NotepadsManager'); return { success: true, notepads: getNotepadsManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 260+ IPC handlers registered (12 handlers)');
}
