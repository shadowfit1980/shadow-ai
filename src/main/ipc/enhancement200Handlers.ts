/**
 * Enhancement 200+ IPC Handlers - Qodo-inspired quality-first AI
 */

import { ipcMain } from 'electron';

export function setupEnhancement200Handlers(): void {
    // CODE COMPLETE
    ipcMain.handle('codecomplete:complete', async (_, { prefix, context, language }: any) => {
        try { const { getCodeCompleteEngine } = await import('../codecomplete/CodeCompleteEngine'); return { success: true, completions: await getCodeCompleteEngine().complete(prefix, context, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PR REVIEWER
    ipcMain.handle('prreviewer:review', async (_, { prNumber, files }: any) => {
        try { const { getPRReviewerEngine } = await import('../prreviewer/PRReviewerEngine'); return { success: true, review: await getPRReviewerEngine().review(prNumber, files) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MUTATION TEST
    ipcMain.handle('mutation:generate', async (_, { file, code }: any) => {
        try { const { getMutationTestEngine } = await import('../mutationtest/MutationTestEngine'); return { success: true, mutants: await getMutationTestEngine().generateMutants(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('mutation:run', async (_, { mutantIds }: any) => {
        try { const { getMutationTestEngine } = await import('../mutationtest/MutationTestEngine'); return { success: true, result: await getMutationTestEngine().runMutationTests(mutantIds) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // EDGE CASE
    ipcMain.handle('edgecase:find', async (_, { fnName, fnCode }: any) => {
        try { const { getEdgeCaseFinder } = await import('../edgecase/EdgeCaseFinder'); return { success: true, cases: await getEdgeCaseFinder().findEdgeCases(fnName, fnCode) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // QUALITY GATE
    ipcMain.handle('qualitygate:evaluate', async (_, { metrics }: any) => {
        try { const { getCodeQualityGate } = await import('../qualitygate/CodeQualityGate'); return { success: true, report: await getCodeQualityGate().evaluate(metrics) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEST IMPACT
    ipcMain.handle('testimpact:analyze', async (_, { changedFiles }: any) => {
        try { const { getTestImpactAnalyzer } = await import('../testimpact/TestImpactAnalyzer'); return { success: true, impact: await getTestImpactAnalyzer().analyze(changedFiles) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DIFF ANALYZER
    ipcMain.handle('diff:analyze', async (_, { diffText }: any) => {
        try { const { getDiffAnalyzer } = await import('../diffanalyzer/DiffAnalyzer'); return { success: true, analysis: await getDiffAnalyzer().analyze(diffText) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SMART MERGE
    ipcMain.handle('merge:detect', async (_, { file, content }: any) => {
        try { const { getSmartMergeEngine } = await import('../smartmerge/SmartMergeEngine'); return { success: true, conflicts: getSmartMergeEngine().detectConflicts(file, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('merge:autoResolve', async (_, { file }: any) => {
        try { const { getSmartMergeEngine } = await import('../smartmerge/SmartMergeEngine'); return { success: true, result: await getSmartMergeEngine().autoResolve(file) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE CONTEXT
    ipcMain.handle('codecontext:analyze', async (_, { file, code, language }: any) => {
        try { const { getCodeContextManager } = await import('../codecontext/CodeContextManager'); return { success: true, context: await getCodeContextManager().analyze(file, code, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AI ASSISTANT
    ipcMain.handle('aiassistant:chat', async (_, { message, agentId }: any) => {
        try { const { getAIAssistantManager } = await import('../aiassistant/AIAssistantManager'); return { success: true, response: await getAIAssistantManager().chat(message, agentId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('aiassistant:getAgents', async () => {
        try { const { getAIAssistantManager } = await import('../aiassistant/AIAssistantManager'); return { success: true, agents: getAIAssistantManager().getAgents() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 200+ IPC handlers registered (13 handlers)');
}
