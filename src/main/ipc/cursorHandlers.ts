/**
 * Cursor Feature IPC Handlers
 * IPC bridge for Rules, Bugbot, and Diff Editor
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let rulesEngine: any = null;
let bugbotReviewer: any = null;
let diffEditor: any = null;

async function getRulesEngine() {
    if (!rulesEngine) {
        try {
            const { getRulesEngine: getRE } = await import('../rules/RulesEngine');
            rulesEngine = getRE();
        } catch (error) {
            console.warn('⚠️ RulesEngine not available:', (error as Error).message);
            return null;
        }
    }
    return rulesEngine;
}

async function getBugbotReviewer() {
    if (!bugbotReviewer) {
        try {
            const { getBugbotReviewer: getBR } = await import('../github/BugbotReviewer');
            bugbotReviewer = getBR();
        } catch (error) {
            console.warn('⚠️ BugbotReviewer not available:', (error as Error).message);
            return null;
        }
    }
    return bugbotReviewer;
}

async function getDiffEditor() {
    if (!diffEditor) {
        try {
            const { getDiffEditor: getDE } = await import('../editor/DiffEditor');
            diffEditor = getDE();
        } catch (error) {
            console.warn('⚠️ DiffEditor not available:', (error as Error).message);
            return null;
        }
    }
    return diffEditor;
}

/**
 * Setup Cursor feature handlers
 */
export function setupCursorHandlers(): void {
    // === RULES ENGINE HANDLERS ===

    ipcMain.handle('rules:load', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const re = await getRulesEngine();
            if (!re) return { success: false, error: 'Rules engine not available' };

            const rules = await re.loadRulesFromProject(projectPath);
            return { success: true, rules };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rules:getForFile', async (_, { projectPath, filePath }: any) => {
        try {
            const re = await getRulesEngine();
            if (!re) return { success: false, error: 'Rules engine not available' };

            const rules = await re.getRulesForFile(projectPath, filePath);
            return { success: true, rules };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rules:apply', async (_, { projectPath, currentFile, basePrompt }: any) => {
        try {
            const re = await getRulesEngine();
            if (!re) return { success: false, error: 'Rules engine not available' };

            const enhancedPrompt = await re.applyRulesToContext(projectPath, currentFile, basePrompt);
            return { success: true, prompt: enhancedPrompt };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rules:create', async (_, { projectPath, name, options }: any) => {
        try {
            const re = await getRulesEngine();
            if (!re) return { success: false, error: 'Rules engine not available' };

            const filePath = await re.createRuleFile(projectPath, name, options);
            return { success: true, filePath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rules:memories:get', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const re = await getRulesEngine();
            if (!re) return { success: false, error: 'Rules engine not available' };

            const memories = await re.getMemories(projectPath);
            return { success: true, memories };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('rules:memories:add', async (_, { projectPath, memory }: any) => {
        try {
            const re = await getRulesEngine();
            if (!re) return { success: false, error: 'Rules engine not available' };

            await re.addMemory(projectPath, memory);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === BUGBOT HANDLERS ===

    ipcMain.handle('bugbot:configure', async (_, config: any) => {
        try {
            const br = await getBugbotReviewer();
            if (!br) return { success: false, error: 'Bugbot not available' };

            br.configure(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bugbot:review', async (_, { owner, repo, prNumber }: any) => {
        try {
            const br = await getBugbotReviewer();
            if (!br) return { success: false, error: 'Bugbot not available' };

            const result = await br.reviewPullRequest(owner, repo, prNumber);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bugbot:analyzeCode', async (_, { diff }: { diff: string }) => {
        try {
            const br = await getBugbotReviewer();
            if (!br) return { success: false, error: 'Bugbot not available' };

            const issues = await br.analyzeCode(diff);
            return { success: true, issues };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bugbot:postComment', async (_, { owner, repo, prNumber, body }: any) => {
        try {
            const br = await getBugbotReviewer();
            if (!br) return { success: false, error: 'Bugbot not available' };

            await br.postComment(owner, repo, prNumber, body);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === DIFF EDITOR HANDLERS ===

    ipcMain.handle('diff:create', async (_, { file, original, modified }: any) => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const diff = de.createDiff(file, original, modified);
            return { success: true, diff };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('diff:createFromFile', async (_, { filePath, newContent }: any) => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const diff = await de.createDiffFromFile(filePath, newContent);
            return { success: true, diff };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('diff:get', async (_, { diffId }: { diffId: string }) => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const diff = de.getDiff(diffId);
            return { success: true, diff };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('diff:getUnified', async (_, { diffId }: { diffId: string }) => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const diff = de.getDiff(diffId);
            if (!diff) return { success: false, error: 'Diff not found' };

            const unified = de.toUnifiedDiff(diff);
            return { success: true, unified };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('diff:getSideBySide', async (_, { diffId }: { diffId: string }) => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const diff = de.getDiff(diffId);
            if (!diff) return { success: false, error: 'Diff not found' };

            const sideBySide = de.toSideBySide(diff);
            return { success: true, sideBySide };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('diff:accept', async (_, { diffId }: { diffId: string }) => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const result = await de.acceptDiff(diffId);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('diff:reject', async (_, { diffId }: { diffId: string }) => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const result = de.rejectDiff(diffId);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('diff:pending', async () => {
        try {
            const de = await getDiffEditor();
            if (!de) return { success: false, error: 'Diff editor not available' };

            const diffs = de.getPendingDiffs();
            return { success: true, diffs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Cursor feature IPC handlers registered');
}
