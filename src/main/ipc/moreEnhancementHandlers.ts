/**
 * More Enhancement IPC Handlers
 * IPC bridge for TestRunner, Dependencies, Formatter, Refactoring
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let testRunner: any = null;
let dependencyAnalyzer: any = null;
let codeFormatter: any = null;
let refactoringEngine: any = null;

async function getTestRunnerEngine() {
    if (!testRunner) {
        try {
            const { getTestRunnerEngine: getTRE } = await import('../testing/TestRunnerEngine');
            testRunner = getTRE();
        } catch (error) {
            console.warn('⚠️ TestRunnerEngine not available:', (error as Error).message);
            return null;
        }
    }
    return testRunner;
}

async function getDependencyAnalyzer() {
    if (!dependencyAnalyzer) {
        try {
            const { getDependencyAnalyzer: getDA } = await import('../dependencies/DependencyAnalyzer');
            dependencyAnalyzer = getDA();
        } catch (error) {
            console.warn('⚠️ DependencyAnalyzer not available:', (error as Error).message);
            return null;
        }
    }
    return dependencyAnalyzer;
}

async function getCodeFormatter() {
    if (!codeFormatter) {
        try {
            const { getCodeFormatter: getCF } = await import('../formatting/CodeFormatter');
            codeFormatter = getCF();
        } catch (error) {
            console.warn('⚠️ CodeFormatter not available:', (error as Error).message);
            return null;
        }
    }
    return codeFormatter;
}

async function getRefactoringEngine() {
    if (!refactoringEngine) {
        try {
            const { getRefactoringEngine: getRE } = await import('../refactoring/RefactoringEngine');
            refactoringEngine = getRE();
        } catch (error) {
            console.warn('⚠️ RefactoringEngine not available:', (error as Error).message);
            return null;
        }
    }
    return refactoringEngine;
}

/**
 * Setup more enhancement handlers
 */
export function setupMoreEnhancementHandlers(): void {
    // === TEST RUNNER ===

    ipcMain.handle('test:run', async (_, options: any) => {
        try {
            const tr = await getTestRunnerEngine();
            if (!tr) return { success: false, error: 'Test runner not available' };

            const result = await tr.runTests(options);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('test:stop', async () => {
        try {
            const tr = await getTestRunnerEngine();
            if (!tr) return { success: false, error: 'Test runner not available' };

            const stopped = tr.stopTests();
            return { success: stopped };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('test:getRuns', async () => {
        try {
            const tr = await getTestRunnerEngine();
            if (!tr) return { success: false, error: 'Test runner not available' };

            const runs = tr.getAllRuns();
            return { success: true, runs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('test:report', async (_, { runId }: { runId: string }) => {
        try {
            const tr = await getTestRunnerEngine();
            if (!tr) return { success: false, error: 'Test runner not available' };

            const run = tr.getRun(runId);
            if (!run) return { success: false, error: 'Run not found' };

            const report = tr.generateReport(run);
            return { success: true, report };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === DEPENDENCY ANALYZER ===

    ipcMain.handle('deps:analyze', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const da = await getDependencyAnalyzer();
            if (!da) return { success: false, error: 'Dependency analyzer not available' };

            const analysis = await da.analyze(projectPath);
            return { success: true, analysis };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('deps:outdated', async (_, { analysisId }: { analysisId: string }) => {
        try {
            const da = await getDependencyAnalyzer();
            if (!da) return { success: false, error: 'Dependency analyzer not available' };

            const outdated = da.getOutdated(analysisId);
            return { success: true, outdated };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('deps:vulnerable', async (_, { analysisId }: { analysisId: string }) => {
        try {
            const da = await getDependencyAnalyzer();
            if (!da) return { success: false, error: 'Dependency analyzer not available' };

            const vulnerable = da.getVulnerable(analysisId);
            return { success: true, vulnerable };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('deps:securityReport', async (_, { analysisId }: { analysisId: string }) => {
        try {
            const da = await getDependencyAnalyzer();
            if (!da) return { success: false, error: 'Dependency analyzer not available' };

            const analysis = da.getAnalysis(analysisId);
            if (!analysis) return { success: false, error: 'Analysis not found' };

            const report = da.generateSecurityReport(analysis);
            return { success: true, report };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CODE FORMATTER ===

    ipcMain.handle('format:file', async (_, { filePath, options }: any) => {
        try {
            const cf = await getCodeFormatter();
            if (!cf) return { success: false, error: 'Code formatter not available' };

            const result = await cf.formatFile(filePath, options);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('format:code', async (_, { code, language, options }: any) => {
        try {
            const cf = await getCodeFormatter();
            if (!cf) return { success: false, error: 'Code formatter not available' };

            const formatted = await cf.formatCode(code, language, options);
            return { success: true, formatted };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('format:write', async (_, { filePath, options }: any) => {
        try {
            const cf = await getCodeFormatter();
            if (!cf) return { success: false, error: 'Code formatter not available' };

            const result = await cf.formatAndWrite(filePath, options);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === REFACTORING ENGINE ===

    ipcMain.handle('refactor:rename', async (_, { code, oldName, newName }: any) => {
        try {
            const re = await getRefactoringEngine();
            if (!re) return { success: false, error: 'Refactoring engine not available' };

            const result = re.rename(code, oldName, newName);
            return { success: result.success, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('refactor:extractFunction', async (_, { code, startLine, endLine, functionName }: any) => {
        try {
            const re = await getRefactoringEngine();
            if (!re) return { success: false, error: 'Refactoring engine not available' };

            const result = re.extractFunction(code, startLine, endLine, functionName);
            return { success: result.success, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('refactor:convertArrow', async (_, { code, functionName }: any) => {
        try {
            const re = await getRefactoringEngine();
            if (!re) return { success: false, error: 'Refactoring engine not available' };

            const result = re.convertToArrow(code, functionName);
            return { success: result.success, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('refactor:simplify', async (_, { code }: { code: string }) => {
        try {
            const re = await getRefactoringEngine();
            if (!re) return { success: false, error: 'Refactoring engine not available' };

            const result = re.simplify(code);
            return { success: result.success, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('refactor:history', async () => {
        try {
            const re = await getRefactoringEngine();
            if (!re) return { success: false, error: 'Refactoring engine not available' };

            const history = re.getHistory();
            return { success: true, history };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ More enhancement IPC handlers registered');
}
