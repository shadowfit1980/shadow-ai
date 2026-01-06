/**
 * Agentic IPC Handlers
 * 
 * Exposes agentic loop, terminal, git, and project scaffolding to renderer
 */

import { ipcMain } from 'electron';
import { agenticLoop, goalTracker } from '../ai/agentic';
import { terminalAgent } from '../ai/terminal';
import { gitAgent } from '../ai/git';
import { projectCreator } from '../ai/scaffolding';
import { modelRouter } from '../ai/routing';
import { codeExecutor } from '../ai/execution/CodeExecutor';

// ============================================================================
// AGENTIC LOOP HANDLERS
// ============================================================================

export function registerAgenticHandlers(): void {
    // Execute a complex task with agentic loop
    ipcMain.handle('agentic:executeTask', async (_event, description: string, context?: any, criteria?: string[]) => {
        try {
            console.log('🔄 Starting agentic task execution...');
            const result = await agenticLoop.executeTask(description, context || {}, criteria);
            return { success: true, result };
        } catch (error) {
            console.error('Agentic task failed:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    // Get current task status
    ipcMain.handle('agentic:getCurrentTask', async () => {
        return agenticLoop.getCurrentTask();
    });

    // Get execution history
    ipcMain.handle('agentic:getHistory', async () => {
        return agenticLoop.getExecutionHistory();
    });

    // Configure agentic loop
    ipcMain.handle('agentic:configure', async (_event, config: any) => {
        agenticLoop.setConfig(config);
        return { success: true };
    });

    // Get stats
    ipcMain.handle('agentic:getStats', async () => {
        return agenticLoop.getStats();
    });

    // ========================================================================
    // GOAL TRACKER
    // ========================================================================

    ipcMain.handle('goals:create', async (_event, description: string, criteria: string[], priority?: string) => {
        return goalTracker.createGoal(description, criteria, priority as any);
    });

    ipcMain.handle('goals:update', async (_event, goalId: string, status: string) => {
        goalTracker.updateGoal(goalId, status as any);
        return { success: true };
    });

    ipcMain.handle('goals:getAll', async () => {
        return goalTracker.getAllGoals();
    });

    ipcMain.handle('goals:getActive', async () => {
        return goalTracker.getActiveGoals();
    });

    ipcMain.handle('goals:getStats', async () => {
        return goalTracker.getStats();
    });

    // ========================================================================
    // TERMINAL AGENT
    // ========================================================================

    ipcMain.handle('terminal:execute', async (_event, command: string, options?: any) => {
        try {
            const result = await terminalAgent.execute({ command, ...options });
            return result;
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('terminal:validate', async (_event, command: string) => {
        return terminalAgent.validateCommand(command);
    });

    ipcMain.handle('terminal:suggest', async (_event, intent: string, context?: string) => {
        return terminalAgent.suggestCommands(intent, context);
    });

    ipcMain.handle('terminal:parseOutput', async (_event, output: string, context?: string) => {
        return terminalAgent.parseOutput(output, context);
    });

    ipcMain.handle('terminal:getHistory', async () => {
        return terminalAgent.getHistory();
    });

    ipcMain.handle('terminal:getStats', async () => {
        return terminalAgent.getStats();
    });

    // ========================================================================
    // GIT AGENT
    // ========================================================================

    ipcMain.handle('git:status', async (_event, cwd?: string) => {
        if (cwd) gitAgent.setWorkingDir(cwd);
        try {
            const isRepo = await gitAgent.isRepository();
            if (!isRepo) return { success: false, error: 'Not a git repository' };
            const status = await gitAgent.getStatus();
            return { success: true, status };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:branch', async (_event, action: string, name?: string) => {
        try {
            switch (action) {
                case 'list':
                    return { success: true, branches: await gitAgent.getBranches() };
                case 'create':
                    if (name) await gitAgent.createBranch(name);
                    return { success: true };
                case 'checkout':
                    if (name) await gitAgent.checkout(name);
                    return { success: true };
                case 'delete':
                    if (name) await gitAgent.deleteBranch(name);
                    return { success: true };
                default:
                    return { success: false, error: 'Unknown action' };
            }
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:commit', async (_event, message?: string) => {
        try {
            if (!message) {
                message = await gitAgent.generateCommitMessage(true);
            }
            const hash = await gitAgent.commit(message);
            return { success: true, hash, message };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:generateCommitMessage', async () => {
        try {
            const message = await gitAgent.generateCommitMessage(true);
            return { success: true, message };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:push', async (_event, remote?: string, branch?: string) => {
        try {
            await gitAgent.push(remote, branch);
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:pull', async () => {
        try {
            await gitAgent.pull();
            return { success: true };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:merge', async (_event, branch: string) => {
        try {
            const result = await gitAgent.merge(branch);
            return result;
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:resolveConflicts', async () => {
        try {
            const conflicts = await gitAgent.getConflicts();
            const resolutions = await Promise.all(
                conflicts.map(c => gitAgent.resolveConflict(c))
            );
            return { success: true, resolutions };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('git:log', async (_event, limit?: number) => {
        try {
            const log = await gitAgent.getLog(limit);
            return { success: true, log };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // ========================================================================
    // PROJECT SCAFFOLDING
    // ========================================================================

    ipcMain.handle('project:create', async (_event, description: string, outputDir: string) => {
        try {
            const result = await projectCreator.createProject(description, outputDir);
            return result;
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('project:createReact', async (_event, name: string, outputDir: string) => {
        try {
            return await projectCreator.createReactProject(name, outputDir);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('project:createNext', async (_event, name: string, outputDir: string) => {
        try {
            return await projectCreator.createNextProject(name, outputDir);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('project:createExpress', async (_event, name: string, outputDir: string) => {
        try {
            return await projectCreator.createExpressProject(name, outputDir);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // ========================================================================
    // CODE EXECUTOR
    // ========================================================================

    ipcMain.handle('code:execute', async (_event, code: string, language: string, options?: any) => {
        try {
            const result = await codeExecutor.execute({
                code,
                language: language as any,
                ...options
            });
            return result;
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('code:executeJS', async (_event, code: string) => {
        return codeExecutor.executeJS(code);
    });

    ipcMain.handle('code:executePython', async (_event, code: string) => {
        return codeExecutor.executePython(code);
    });

    ipcMain.handle('code:executeShell', async (_event, script: string) => {
        return codeExecutor.executeShell(script);
    });

    ipcMain.handle('code:getRuntimes', async () => {
        return codeExecutor.getAvailableRuntimes();
    });

    // ========================================================================
    // MODEL ROUTER
    // ========================================================================

    ipcMain.handle('router:route', async (_event, task: string, requirements?: any) => {
        return modelRouter.routeTask(task as any, requirements);
    });

    ipcMain.handle('router:execute', async (_event, prompt: string, task: string, messages: any[]) => {
        try {
            const result = await modelRouter.executeWithRouting(prompt, task as any, messages);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('router:ensemble', async (_event, prompt: string, task: string, numModels?: number) => {
        try {
            const result = await modelRouter.executeEnsemble(prompt, task as any, numModels);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('router:setStrategy', async (_event, strategy: string) => {
        modelRouter.setStrategy(strategy as any);
        return { success: true };
    });

    ipcMain.handle('router:getProfiles', async () => {
        return modelRouter.getProfiles();
    });

    ipcMain.handle('router:getStats', async () => {
        return modelRouter.getStats();
    });

    // ========================================================================
    // SELF-EVOLUTION
    // ========================================================================

    const { selfEvolutionEngine } = require('../ai/evolution');

    ipcMain.handle('evolution:recordMetric', async (_event, metric: any) => {
        return selfEvolutionEngine.recordMetric(metric);
    });

    ipcMain.handle('evolution:recordFeedback', async (_event, metricId: string, feedback: string) => {
        selfEvolutionEngine.recordFeedback(metricId, feedback);
        return { success: true };
    });

    ipcMain.handle('evolution:analyzePatterns', async () => {
        return selfEvolutionEngine.analyzePatterns();
    });

    ipcMain.handle('evolution:getOptimizedStrategy', async (_event, taskType: string, context?: any) => {
        return selfEvolutionEngine.getOptimizedStrategy(taskType, context);
    });

    ipcMain.handle('evolution:generateImprovements', async () => {
        return selfEvolutionEngine.generateImprovements();
    });

    ipcMain.handle('evolution:learnCapability', async (_event, name: string, description: string, examples: any[]) => {
        return selfEvolutionEngine.learnCapability(name, description, examples);
    });

    ipcMain.handle('evolution:getStats', async () => {
        return selfEvolutionEngine.getStats();
    });

    ipcMain.handle('evolution:getPatterns', async () => {
        return selfEvolutionEngine.getPatterns();
    });

    ipcMain.handle('evolution:getRecentMetrics', async (_event, limit?: number) => {
        return selfEvolutionEngine.getRecentMetrics(limit);
    });

    // ========================================================================
    // AST ANALYZER
    // ========================================================================

    const { astAnalyzer } = require('../ai/analysis');

    ipcMain.handle('ast:analyzeFile', async (_event, filePath: string) => {
        try {
            return await astAnalyzer.analyzeFile(filePath);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('ast:renameSymbol', async (_event, filePath: string, oldName: string, newName: string, affectedFiles?: string[]) => {
        try {
            const results = await astAnalyzer.renameSymbol(filePath, oldName, newName, affectedFiles);
            return { success: true, results };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('ast:extractFunction', async (_event, filePath: string, startLine: number, endLine: number, functionName: string) => {
        try {
            const result = await astAnalyzer.extractFunction(filePath, startLine, endLine, functionName);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('ast:findUsages', async (_event, symbolName: string, searchPaths: string[]) => {
        return astAnalyzer.findUsages(symbolName, searchPaths);
    });

    ipcMain.handle('ast:buildDependencyGraph', async (_event, entryFile: string) => {
        const graph = await astAnalyzer.buildDependencyGraph(entryFile);
        return Object.fromEntries(graph);
    });

    console.log('✅ Agentic IPC handlers registered (including Evolution & AST)');
}
