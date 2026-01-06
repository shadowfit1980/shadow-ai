/**
 * Enhancement 430+ IPC Handlers - Kimi Code AI coding features
 */

import { ipcMain } from 'electron';

export function setupEnhancement430Handlers(): void {
    // CODE EXPLAINER
    ipcMain.handle('explain:code', async (_, { code, language, level, format }: any) => {
        try { const { getCodeExplainerEngine } = await import('../codeexplain/CodeExplainerEngine'); return { success: true, result: await getCodeExplainerEngine().explain(code, language, level, format) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BUG FIXER
    ipcMain.handle('bugfix:analyze', async (_, { code, language }: any) => {
        try { const { getBugFixerEngine } = await import('../bugfixer/BugFixerEngine'); return { success: true, result: await getBugFixerEngine().analyze(code, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE OPTIMIZER
    ipcMain.handle('optimize:code', async (_, { code, language, focus }: any) => {
        try { const { getCodeOptimizerEngine } = await import('../codeoptimize/CodeOptimizerEngine'); return { success: true, result: await getCodeOptimizerEngine().optimize(code, language, focus) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEST GENERATOR
    ipcMain.handle('testgen:generate', async (_, { sourceCode, language, framework }: any) => {
        try { const { getTestGeneratorEngine } = await import('../testgen/TestGeneratorEngine'); return { success: true, result: await getTestGeneratorEngine().generate(sourceCode, language, framework) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DOC GENERATOR
    ipcMain.handle('docgen:generate', async (_, { code, language, format }: any) => {
        try { const { getDocGeneratorEngine } = await import('../docgen/DocGeneratorEngine'); return { success: true, result: await getDocGeneratorEngine().generate(code, language, format) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE TRANSLATOR
    ipcMain.handle('translate:code', async (_, { sourceCode, sourceLang, targetLang }: any) => {
        try { const { getCodeTranslatorEngine } = await import('../codetranslate/CodeTranslatorEngine'); return { success: true, result: await getCodeTranslatorEngine().translate(sourceCode, sourceLang, targetLang) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // REFACTOR ENGINE
    ipcMain.handle('refactor:analyze', async (_, { code, language }: any) => {
        try { const { getRefactorEngineCore } = await import('../refactoreng/RefactorEngineCore'); return { success: true, result: await getRefactorEngineCore().analyze(code, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // API GENERATOR
    ipcMain.handle('apigen:generate', async (_, { spec, framework }: any) => {
        try { const { getAPIGeneratorEngine } = await import('../apigen/APIGeneratorEngine'); return { success: true, result: await getAPIGeneratorEngine().generate(spec, framework) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DEBUG ASSISTANT
    ipcMain.handle('debug:analyze', async (_, { error, stackTrace, code, language }: any) => {
        try { const { getDebugAssistantEngine } = await import('../debugassist/DebugAssistantEngine'); return { success: true, result: await getDebugAssistantEngine().analyze(error, stackTrace, code, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE REVIEWER
    ipcMain.handle('review:code', async (_, { code, language }: any) => {
        try { const { getCodeReviewerEngine } = await import('../codereviewer/CodeReviewerEngine'); return { success: true, result: await getCodeReviewerEngine().review(code, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 430+ IPC handlers registered (10 handlers)');
}
