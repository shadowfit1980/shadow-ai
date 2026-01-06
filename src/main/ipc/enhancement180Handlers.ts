/**
 * Enhancement 180+ IPC Handlers - CodiumAI-inspired test intelligence
 */

import { ipcMain } from 'electron';

export function setupEnhancement180Handlers(): void {
    // TEST SUITE
    ipcMain.handle('testsuite:create', async (_, { name }: any) => {
        try { const { getTestSuiteManager } = await import('../testsuite/TestSuiteManager'); return { success: true, suite: getTestSuiteManager().create(name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('testsuite:run', async (_, { suiteId }: any) => {
        try { const { getTestSuiteManager } = await import('../testsuite/TestSuiteManager'); return { success: true, suite: await getTestSuiteManager().run(suiteId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BEHAVIOR SPEC
    ipcMain.handle('behaviorspec:generate', async (_, { fnName, fnCode }: any) => {
        try { const { getBehaviorSpecGenerator } = await import('../behaviorspec/BehaviorSpecGenerator'); return { success: true, spec: await getBehaviorSpecGenerator().generate(fnName, fnCode) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COVERAGE
    ipcMain.handle('coverage:track', async (_, { file, lines, coveredLines }: any) => {
        try { const { getCoverageTracker } = await import('../coveragetracker/CoverageTracker'); return { success: true, report: getCoverageTracker().track(file, lines, coveredLines) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('coverage:getProject', async () => {
        try { const { getCoverageTracker } = await import('../coveragetracker/CoverageTracker'); return { success: true, coverage: getCoverageTracker().getProjectCoverage() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MOCK GENERATOR
    ipcMain.handle('mock:generate', async (_, { fnName, fnSignature, returnType }: any) => {
        try { const { getMockGenerator } = await import('../mockgen/MockGenerator'); return { success: true, mock: await getMockGenerator().generate(fnName, fnSignature, returnType) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INTEGRATION TEST
    ipcMain.handle('integrationtest:create', async (_, { name, steps, expectedResult }: any) => {
        try { const { getIntegrationTestManager } = await import('../integrationtest/IntegrationTestManager'); return { success: true, test: getIntegrationTestManager().create(name, steps, expectedResult) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PERFORMANCE TEST
    ipcMain.handle('performancetest:run', async (_, { name, iterations }: any) => {
        try { const { getPerformanceTestManager } = await import('../performancetest/PerformanceTestManager'); return { success: true, result: await getPerformanceTestManager().runLoadTest(name, async () => { }, iterations) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // REGRESSION DETECTOR
    ipcMain.handle('regression:record', async (_, { testId, testName, status, commit }: any) => {
        try { const { getRegressionDetector } = await import('../regressiondetector/RegressionDetector'); return { success: true, regression: getRegressionDetector().recordResult(testId, testName, status, commit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FLAKEY TEST
    ipcMain.handle('flakey:record', async (_, { testId, testName, passed }: any) => {
        try { const { getFlakeyTestFixer } = await import('../flakeytest/FlakeyTestFixer'); return { success: true, flakey: getFlakeyTestFixer().recordRun(testId, testName, passed) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEST INTELLIGENCE
    ipcMain.handle('testintel:analyze', async (_, { files, testFiles }: any) => {
        try { const { getTestIntelligence } = await import('../testintelligence/TestIntelligence'); return { success: true, insights: await getTestIntelligence().analyze(files, testFiles) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('testintel:suggest', async (_, { file, code }: any) => {
        try { const { getTestIntelligence } = await import('../testintelligence/TestIntelligence'); return { success: true, suggestions: getTestIntelligence().suggestTests(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 180+ IPC handlers registered (13 handlers)');
}
