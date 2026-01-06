/**
 * 🛡️ Advanced IPC Handlers
 * 
 * Exposes advanced agent capabilities to the renderer process:
 * - Agent Swarm operations (task auctions, debates)
 * - Diff-based editing
 * - Sandboxed execution
 * - Runtime introspection
 * - Vector memory search
 */

import { ipcMain, BrowserWindow } from 'electron';
import { agentSwarmOS } from '../core/AgentSwarmOS';
import { diffEditEngine, DiffEdit } from '../ai/editing/DiffEditEngine';
import { sandboxExecutor, SandboxOptions } from '../ai/sandbox/SandboxExecutor';
import { runtimeInspector } from '../ai/introspection/RuntimeInspector';
import { vectorMemory, SearchOptions } from '../ai/memory/VectorMemory';

export function registerAdvancedHandlers(): void {
    console.log('🚀 Registering advanced agent handlers...');

    // ========================================================================
    // AGENT SWARM HANDLERS
    // ========================================================================

    /**
     * Get all available agents in the swarm
     */
    ipcMain.handle('swarm:getAgents', async () => {
        try {
            const agents = agentSwarmOS.getAgents();
            return { success: true, agents };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Create a task auction - agents bid on tasks
     */
    ipcMain.handle('swarm:createAuction', async (_event, task: {
        title: string;
        description: string;
        requirements?: string[];
        priority?: 'low' | 'medium' | 'high' | 'critical';
    }) => {
        try {
            const auction = await agentSwarmOS.createAuction({
                title: task.title,
                description: task.description,
                requirements: task.requirements || [],
                constraints: [],
                priority: task.priority || 'medium'
            });
            return { success: true, auction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Select winner of an auction
     */
    ipcMain.handle('swarm:selectWinner', async (_event, auctionId: string, criteria?: string) => {
        try {
            const winner = agentSwarmOS.selectWinner(
                auctionId,
                (criteria as any) || 'balanced'
            );
            return { success: true, winner };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Start a debate between agents
     */
    ipcMain.handle('swarm:startDebate', async (_event, topic: string, participantIds?: string[]) => {
        try {
            const agents = agentSwarmOS.getAgents();
            const participants = participantIds || agents.slice(0, 3).map(a => a.id);
            const debate = await agentSwarmOS.startDebate(topic, participants);
            return { success: true, debate };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get active auctions
     */
    ipcMain.handle('swarm:getAuctions', async () => {
        try {
            const auctions = agentSwarmOS.getActiveAuctions();
            return { success: true, auctions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get active debates
     */
    ipcMain.handle('swarm:getDebates', async () => {
        try {
            const debates = agentSwarmOS.getActiveDebates();
            return { success: true, debates };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Assign task directly to an agent
     */
    ipcMain.handle('swarm:assignTask', async (_event, agentId: string, task: any) => {
        try {
            const result = await agentSwarmOS.assignTask(agentId, task);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ========================================================================
    // DIFF EDITING HANDLERS
    // ========================================================================

    /**
     * Apply a diff edit to a file
     */
    ipcMain.handle('diff:apply', async (_event, edit: DiffEdit) => {
        try {
            const result = await diffEditEngine.applyDiff(edit);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message, editId: edit.id, linesChanged: 0 };
        }
    });

    /**
     * Validate a diff before applying
     */
    ipcMain.handle('diff:validate', async (_event, edit: DiffEdit) => {
        try {
            const result = await diffEditEngine.validateDiff(edit);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Rollback an edit
     */
    ipcMain.handle('diff:rollback', async (_event, editId: string) => {
        try {
            const success = await diffEditEngine.rollbackEdit(editId);
            return { success };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get edit history
     */
    ipcMain.handle('diff:history', async () => {
        try {
            const history = diffEditEngine.getHistory();
            return { success: true, history };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Parse diff from AI response
     */
    ipcMain.handle('diff:parse', async (_event, response: string, targetFile: string) => {
        try {
            const edit = diffEditEngine.parseDiffFromAI(response, targetFile);
            return { success: !!edit, edit };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ========================================================================
    // SANDBOX EXECUTION HANDLERS
    // ========================================================================

    /**
     * Execute command in sandbox
     */
    ipcMain.handle('sandbox:execute', async (_event, command: string, options?: SandboxOptions) => {
        try {
            const result = await sandboxExecutor.execute(command, options);
            return result;
        } catch (error: any) {
            return {
                success: false,
                exitCode: -1,
                stdout: '',
                stderr: error.message,
                duration: 0,
                killed: false,
                command,
                sandboxed: true
            };
        }
    });

    /**
     * Validate if a command is safe
     */
    ipcMain.handle('sandbox:validate', async (_event, command: string) => {
        try {
            const result = sandboxExecutor.validateCommand(command);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, allowed: false, reason: error.message };
        }
    });

    /**
     * Get security violations
     */
    ipcMain.handle('sandbox:violations', async () => {
        try {
            const violations = sandboxExecutor.getViolations();
            return { success: true, violations };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Kill all sandboxed processes
     */
    ipcMain.handle('sandbox:killAll', async () => {
        try {
            sandboxExecutor.killAll();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ========================================================================
    // RUNTIME INSPECTOR HANDLERS
    // ========================================================================

    /**
     * Find debuggable processes
     */
    ipcMain.handle('inspector:findProcesses', async () => {
        try {
            const processes = await runtimeInspector.findDebuggableProcesses();
            return { success: true, processes };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Attach to a process
     */
    ipcMain.handle('inspector:attach', async (_event, pid: number, debugUrl?: string) => {
        try {
            const session = await runtimeInspector.attachToProcess(pid, debugUrl);
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Disconnect from a session
     */
    ipcMain.handle('inspector:disconnect', async (_event, sessionId: string) => {
        try {
            runtimeInspector.disconnect(sessionId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Evaluate expression in runtime
     */
    ipcMain.handle('inspector:evaluate', async (_event, sessionId: string, expression: string) => {
        try {
            const result = await runtimeInspector.evaluate(sessionId, expression);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get recent logs
     */
    ipcMain.handle('inspector:logs', async (_event, sessionId: string, limit?: number) => {
        try {
            const logs = runtimeInspector.getRecentLogs(sessionId, limit);
            return { success: true, logs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get all active sessions
     */
    ipcMain.handle('inspector:sessions', async () => {
        try {
            const sessions = runtimeInspector.getSessions();
            return { success: true, sessions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ========================================================================
    // VECTOR MEMORY HANDLERS
    // ========================================================================

    /**
     * Embed a codebase
     */
    ipcMain.handle('memory:embedCodebase', async (_event, projectPath: string) => {
        try {
            const result = await vectorMemory.embedCodebase(projectPath);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Semantic code search
     */
    ipcMain.handle('memory:search', async (_event, query: string, options?: SearchOptions) => {
        try {
            const results = vectorMemory.search(query, options);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Learn from a project
     */
    ipcMain.handle('memory:learn', async (_event, projectPath: string) => {
        try {
            await vectorMemory.learnFromProject(projectPath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Generate project DNA
     */
    ipcMain.handle('memory:projectDNA', async (_event, projectPath: string) => {
        try {
            const dna = await vectorMemory.generateProjectDNA(projectPath);
            return { success: true, dna };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Find similar projects
     */
    ipcMain.handle('memory:similarProjects', async (_event, projectPath: string, limit?: number) => {
        try {
            const similar = vectorMemory.findSimilarProjects(projectPath, limit);
            return { success: true, projects: similar };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get all fragments
     */
    ipcMain.handle('memory:fragments', async (_event, projectPath?: string) => {
        try {
            const fragments = vectorMemory.getAllFragments(projectPath);
            return { success: true, fragments };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ========================================================================
    // EVENT FORWARDING TO RENDERER
    // ========================================================================

    // Forward swarm events
    agentSwarmOS.on('auction:bid', (data) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('swarm:event', { type: 'auction:bid', data });
        });
    });

    agentSwarmOS.on('debate:message', (data) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('swarm:event', { type: 'debate:message', data });
        });
    });

    // Forward sandbox events
    sandboxExecutor.on('violation', (data) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('sandbox:violation', data);
        });
    });

    sandboxExecutor.on('confirmation:required', (data) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('sandbox:confirmation', data);
        });
    });

    // Forward inspector events
    runtimeInspector.on('log', (data) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('inspector:log', data);
        });
    });

    runtimeInspector.on('breakpoint:hit', (data) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('inspector:breakpoint', data);
        });
    });

    // Forward vector memory events
    vectorMemory.on('progress', (data) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('memory:progress', data);
        });
    });

    // ========================================================================
    // PHASE 2: VISUAL REGRESSION TESTING HANDLERS
    // ========================================================================

    try {
        const { visualRegressionEngine } = require('../ai/testing/VisualRegressionEngine');

        ipcMain.handle('visual:initialize', async () => {
            try {
                await visualRegressionEngine.initialize();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('visual:capture', async (_event, url: string, options?: any) => {
            try {
                const screenshot = await visualRegressionEngine.captureScreenshot(url, options);
                return { success: true, screenshot: { ...screenshot, buffer: undefined } };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('visual:createTest', async (_event, name: string, url: string, options?: any) => {
            try {
                const testCase = visualRegressionEngine.createTestCase(name, url, options);
                return { success: true, testCase };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('visual:runTest', async (_event, testId: string) => {
            try {
                const result = await visualRegressionEngine.runTest(testId);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('visual:runAll', async () => {
            try {
                const results = await visualRegressionEngine.runAllTests();
                return { success: true, results };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('visual:updateBaseline', async (_event, testId: string) => {
            try {
                await visualRegressionEngine.updateBaseline(testId);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('visual:generateReport', async (_event, results: any[]) => {
            try {
                const report = await visualRegressionEngine.generateReport(results);
                return { success: true, report };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('visual:getTests', async () => {
            try {
                const tests = visualRegressionEngine.getTestCases();
                return { success: true, tests };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Visual regression handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Visual regression handlers not loaded:', error.message);
    }

    // ========================================================================
    // PHASE 2: CODEBASE HEALER HANDLERS
    // ========================================================================

    try {
        const { codebaseHealer } = require('../ai/healing/CodebaseHealer');

        ipcMain.handle('healer:analyze', async (_event, projectPath: string) => {
            try {
                const report = await codebaseHealer.analyzeHealth(projectPath);
                return { success: true, report };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('healer:autoFix', async (_event, projectPath: string, strategy?: string) => {
            try {
                const results = await codebaseHealer.autoFix(projectPath, strategy as any);
                return { success: true, results };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('healer:updateDeps', async (_event, projectPath: string, strategy?: string) => {
            try {
                const result = await codebaseHealer.updateDependencies(projectPath, strategy as any);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('healer:patchVulns', async (_event, projectPath: string) => {
            try {
                const result = await codebaseHealer.patchVulnerabilities(projectPath);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('healer:removeUnused', async (_event, projectPath: string) => {
            try {
                const result = await codebaseHealer.removeUnusedDependencies(projectPath);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('healer:detectBitrot', async (_event, projectPath: string) => {
            try {
                const issues = await codebaseHealer.detectBitrot(projectPath);
                return { success: true, issues };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Codebase healer handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Codebase healer handlers not loaded:', error.message);
    }

    // ========================================================================
    // PHASE 2: DEVICE FARM HANDLERS
    // ========================================================================

    try {
        const { deviceFarm } = require('../ai/testing/DeviceFarm');

        ipcMain.handle('devicefarm:configure', async (_event, config: any) => {
            try {
                deviceFarm.configure(config);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('devicefarm:getDevices', async () => {
            try {
                const devices = await deviceFarm.getAvailableDevices();
                return { success: true, devices };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('devicefarm:uploadApp', async (_event, appPath: string) => {
            try {
                const result = await deviceFarm.uploadApp(appPath);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('devicefarm:runTest', async (_event, device: any, appPath: string) => {
            try {
                const run = await deviceFarm.runOnDevice(device, appPath);
                return { success: true, run };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('devicefarm:runParallel', async (_event, devices: any[], appPath: string) => {
            try {
                const runs = await deviceFarm.runParallel(devices, appPath);
                return { success: true, runs };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('devicefarm:createSuite', async (_event, name: string, appPath: string, devices: any[]) => {
            try {
                const suite = deviceFarm.createTestSuite(name, appPath, devices);
                return { success: true, suite };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('devicefarm:runSuite', async (_event, suiteId: string) => {
            try {
                const suite = await deviceFarm.runTestSuite(suiteId);
                return { success: true, suite };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('devicefarm:getMatrix', async (_event, options?: any) => {
            try {
                const matrix = deviceFarm.generateDeviceMatrix(options);
                return { success: true, matrix };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Device farm handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Device farm handlers not loaded:', error.message);
    }

    // ========================================================================
    // PHASE 3: TIME TRAVEL DEBUGGER HANDLERS
    // ========================================================================

    try {
        const { timeTravelDebugger } = require('../ai/debugging/TimeTravelDebugger');

        ipcMain.handle('timetravel:initialize', async () => {
            try {
                await timeTravelDebugger.initialize();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('timetravel:startRecording', async (_event, name: string, projectPath: string, entryPoint: string) => {
            try {
                const session = timeTravelDebugger.startRecording(name, projectPath, entryPoint);
                return { success: true, session };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('timetravel:stopRecording', async () => {
            try {
                const session = timeTravelDebugger.stopRecording();
                return { success: true, session };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('timetravel:jumpToTick', async (_event, sessionId: string, tick: number) => {
            try {
                const snapshot = timeTravelDebugger.jumpToTick(sessionId, tick);
                return { success: true, snapshot };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('timetravel:replay', async (_event, sessionId: string, options?: any) => {
            try {
                await timeTravelDebugger.replay(sessionId, options);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('timetravel:getSessions', async () => {
            try {
                const sessions = timeTravelDebugger.getSessions();
                return { success: true, sessions };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('timetravel:compareExecutions', async (_event, sessionId1: string, sessionId2: string) => {
            try {
                const diffs = timeTravelDebugger.compareExecutions(sessionId1, sessionId2);
                return { success: true, diffs };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Time travel debugger handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Time travel handlers not loaded:', error.message);
    }

    // ========================================================================
    // PHASE 3: BOUNTY HUNTER HANDLERS
    // ========================================================================

    try {
        const { bountyHunter } = require('../ai/autonomous/BountyHunter');

        ipcMain.handle('bounty:configure', async (_event, config: any, githubToken: string) => {
            try {
                bountyHunter.configure(config, githubToken);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('bounty:startHunting', async () => {
            try {
                bountyHunter.startHunting();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('bounty:stopHunting', async () => {
            try {
                bountyHunter.stopHunting();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('bounty:findIssues', async (_event, repo: string) => {
            try {
                const issues = await bountyHunter.findSolvableIssues(repo);
                return { success: true, issues };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('bounty:analyzeIssue', async (_event, issue: any) => {
            try {
                const analysis = await bountyHunter.analyzeIssue(issue);
                return { success: true, analysis };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('bounty:huntIssue', async (_event, issue: any) => {
            try {
                const hunt = await bountyHunter.huntIssue(issue);
                return { success: true, hunt };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('bounty:getStats', async () => {
            try {
                const stats = bountyHunter.getStats();
                return { success: true, stats };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('bounty:getHunts', async () => {
            try {
                const hunts = bountyHunter.getHunts();
                return { success: true, hunts };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Bounty hunter handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Bounty hunter handlers not loaded:', error.message);
    }

    // ========================================================================
    // PHASE 3: LOCAL MLX INFERENCE HANDLERS
    // ========================================================================

    try {
        const { localMLXInference } = require('../ai/inference/LocalMLXInference');

        ipcMain.handle('localai:initialize', async () => {
            try {
                await localMLXInference.initialize();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('localai:getHardware', async () => {
            try {
                const hardware = await localMLXInference.getHardwareInfo();
                return { success: true, hardware };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('localai:getModels', async () => {
            try {
                const models = localMLXInference.getModels();
                return { success: true, models };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('localai:downloadModel', async (_event, presetName: string) => {
            try {
                const download = await localMLXInference.downloadModel(presetName);
                return { success: true, download };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('localai:loadModel', async (_event, modelId: string) => {
            try {
                await localMLXInference.loadModel(modelId);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('localai:generate', async (_event, request: any) => {
            try {
                const result = await localMLXInference.generate(request);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('localai:unloadModel', async () => {
            try {
                await localMLXInference.unloadModel();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Local MLX inference handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Local MLX handlers not loaded:', error.message);
    }

    // ========================================================================
    // PHASE 3: HARDWARE SYNTHESIZER HANDLERS
    // ========================================================================

    try {
        const { hardwareSynthesizer } = require('../ai/synthesis/HardwareSynthesizer');

        ipcMain.handle('hardware:initialize', async () => {
            try {
                await hardwareSynthesizer.initialize();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('hardware:synthesize', async (_event, description: string, language?: string) => {
            try {
                const result = await hardwareSynthesizer.synthesizeFromDescription(description, language);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('hardware:useTemplate', async (_event, templateName: string, parameters?: any) => {
            try {
                const result = await hardwareSynthesizer.useTemplate(templateName, parameters);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('hardware:generateFSM', async (_event, name: string, states: any[], inputs: any[], outputs: any[]) => {
            try {
                const code = hardwareSynthesizer.generateFSM(name, states, inputs, outputs);
                return { success: true, code };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('hardware:getDesigns', async () => {
            try {
                const designs = hardwareSynthesizer.getDesigns();
                return { success: true, designs };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('hardware:exportFPGA', async (_event, designId: string, target: any) => {
            try {
                const exportPath = await hardwareSynthesizer.exportForFPGA(designId, target);
                return { success: true, path: exportPath };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Hardware synthesizer handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Hardware synthesizer handlers not loaded:', error.message);
    }

    // ========================================================================
    // PHASE 3: CODEBASE DNA VISUALIZER HANDLERS
    // ========================================================================

    try {
        const { codebaseDNAVisualizer } = require('../ai/visualization/CodebaseDNAVisualizer');

        ipcMain.handle('dna:initialize', async () => {
            try {
                await codebaseDNAVisualizer.initialize();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('dna:generateProfile', async (_event, projectPath: string) => {
            try {
                const profile = await codebaseDNAVisualizer.generateProfile(projectPath);
                return { success: true, profile };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('dna:visualize3D', async (_event, profileId: string) => {
            try {
                const visualization = await codebaseDNAVisualizer.visualize3D(profileId);
                return { success: true, visualization };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('dna:visualizeForceGraph', async (_event, profileId: string) => {
            try {
                const visualization = await codebaseDNAVisualizer.visualizeForceGraph(profileId);
                return { success: true, visualization };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('dna:compare', async (_event, profileId1: string, profileId2: string) => {
            try {
                const result = codebaseDNAVisualizer.compareDNA(profileId1, profileId2);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('dna:findSimilar', async (_event, profileId: string, limit?: number) => {
            try {
                const results = codebaseDNAVisualizer.findSimilar(profileId, limit);
                return { success: true, results };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('dna:getProfiles', async () => {
            try {
                const profiles = codebaseDNAVisualizer.getProfiles();
                return { success: true, profiles };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Codebase DNA visualizer handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ DNA visualizer handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: CONVERSATIONAL ARCHITECT
    // ========================================================================
    try {
        const { conversationalArchitect } = require('../ai/architect/ConversationalArchitect');

        ipcMain.handle('architect:analyze', async (_event, request: any) => {
            try {
                const proposal = await conversationalArchitect.analyzeRequest(request);
                return { success: true, proposal };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('architect:refine', async (_event, proposalId: string, answers: any) => {
            try {
                const proposal = await conversationalArchitect.refineProposal(proposalId, answers);
                return { success: true, proposal };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('architect:scaffold', async (_event, proposalId: string, outputPath: string) => {
            try {
                const scaffold = await conversationalArchitect.generateScaffold(proposalId, outputPath);
                return { success: true, scaffold };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('architect:getProposals', async () => {
            try {
                const proposals = conversationalArchitect.getProposals();
                return { success: true, proposals };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Conversational Architect handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Architect handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: GAME ENGINE INTEGRATION
    // ========================================================================
    try {
        const { gameEngineIntegration } = require('../ai/game/GameEngineIntegration');

        ipcMain.handle('game:initialize', async () => {
            try {
                const engines = await gameEngineIntegration.initialize();
                return { success: true, engines };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('game:createProject', async (_event, name: string, engine: string, outputPath: string) => {
            try {
                const project = await gameEngineIntegration.createProject(name, engine as any, outputPath);
                return { success: true, project };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('game:generateShader', async (_event, request: any) => {
            try {
                const shader = await gameEngineIntegration.generateShader(request);
                return { success: true, shader };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('game:generateScript', async (_event, engine: string, className: string, template: string) => {
            try {
                let script: string;
                if (engine === 'unity') {
                    script = gameEngineIntegration.generateUnityScript(className, template as any);
                } else {
                    script = gameEngineIntegration.generateGodotScript(className, template as any);
                }
                return { success: true, script };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('game:getProjects', async () => {
            try {
                const projects = gameEngineIntegration.getProjects();
                return { success: true, projects };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Game Engine Integration handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Game handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: AI PERSONALITY ENGINE
    // ========================================================================
    try {
        const { aiPersonalityEngine } = require('../ai/personality/AIPersonalityEngine');

        ipcMain.handle('personality:getAll', async () => {
            try {
                const personalities = aiPersonalityEngine.getPersonalities();
                return { success: true, personalities };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('personality:getCurrent', async () => {
            try {
                const personality = aiPersonalityEngine.getCurrentPersonality();
                return { success: true, personality };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('personality:set', async (_event, personalityId: string) => {
            try {
                const personality = aiPersonalityEngine.setPersonality(personalityId);
                return { success: true, personality };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('personality:recordMetrics', async (_event, metrics: any) => {
            try {
                aiPersonalityEngine.recordTypingMetrics(metrics);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('personality:detectStress', async () => {
            try {
                const stress = aiPersonalityEngine.detectStress();
                return { success: true, stress };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('personality:getSystemPrompt', async () => {
            try {
                const prompt = aiPersonalityEngine.getSystemPrompt();
                return { success: true, prompt };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ AI Personality Engine handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Personality handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: TEST SUITE GENERATOR
    // ========================================================================
    try {
        const { testSuiteGenerator } = require('../ai/testing/TestSuiteGenerator');

        ipcMain.handle('testsuite:generate', async (_event, request: any) => {
            try {
                const suite = await testSuiteGenerator.generateTests(request);
                return { success: true, suite };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('testsuite:generateChaos', async (_event, projectPath: string) => {
            try {
                const tests = await testSuiteGenerator.generateChaosTests(projectPath);
                return { success: true, tests };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('testsuite:runChaos', async (_event, tests: any[]) => {
            try {
                const report = await testSuiteGenerator.runChaosTests(tests);
                return { success: true, report };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('testsuite:checkDeploy', async (_event, projectPath: string, coverage: number) => {
            try {
                const check = await testSuiteGenerator.checkDeployability(projectPath, coverage);
                return { success: true, check };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('testsuite:fuzz', async (_event, type: string) => {
            try {
                const inputs = testSuiteGenerator.generateFuzzInputs(type as any);
                return { success: true, inputs };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Test Suite Generator handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Test suite handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: DEPLOYMENT ORCHESTRATOR
    // ========================================================================
    try {
        const { deploymentOrchestrator } = require('../ai/deployment/DeploymentOrchestrator');

        ipcMain.handle('deploy:getTargets', async () => {
            try {
                const targets = deploymentOrchestrator.getTargets();
                return { success: true, targets };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('deploy:getTargetsByCategory', async (_event, category: string) => {
            try {
                const targets = deploymentOrchestrator.getTargetsByCategory(category);
                return { success: true, targets };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('deploy:deploy', async (_event, config: any) => {
            try {
                const result = await deploymentOrchestrator.deploy(config);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('deploy:checkCompliance', async (_event, targetId: string, projectPath: string) => {
            try {
                const target = deploymentOrchestrator.getTargets().find((t: any) => t.id === targetId);
                const report = await deploymentOrchestrator.runComplianceChecks(target, projectPath);
                return { success: true, report };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('deploy:getHistory', async () => {
            try {
                const history = deploymentOrchestrator.getDeploymentHistory();
                return { success: true, history };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Deployment Orchestrator handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Deployment handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: WHAT-IF SIMULATOR
    // ========================================================================
    try {
        const { whatIfSimulator } = require('../ai/simulation/WhatIfSimulator');

        ipcMain.handle('whatif:analyze', async (_event, question: string, projectPath?: string) => {
            try {
                const scenario = await whatIfSimulator.analyze(question, projectPath);
                return { success: true, scenario };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('whatif:generateScripts', async (_event, scenarioId: string) => {
            try {
                const scripts = await whatIfSimulator.generateMigrationScripts(scenarioId);
                return { success: true, scripts };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('whatif:simulate', async (_event, scenarioId: string, projectPath: string) => {
            try {
                const result = await whatIfSimulator.simulate(scenarioId, projectPath);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('whatif:compare', async (_event, approach1: string, approach2: string) => {
            try {
                const result = whatIfSimulator.compare(approach1, approach2);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('whatif:getScenarios', async () => {
            try {
                const scenarios = whatIfSimulator.getScenarios();
                return { success: true, scenarios };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ What-If Simulator handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ What-If handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: COLLABORATION ENGINE
    // ========================================================================
    try {
        const { collaborationEngine } = require('../ai/collaboration/CollaborationEngine');

        ipcMain.handle('collab:createSession', async (_event, name: string, projectPath: string, creatorName: string) => {
            try {
                const session = collaborationEngine.createSession(name, projectPath, creatorName);
                return { success: true, session };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('collab:joinSession', async (_event, sessionId: string, participantName: string) => {
            try {
                const participant = collaborationEngine.joinSession(sessionId, participantName);
                return { success: true, participant };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('collab:leaveSession', async (_event, sessionId: string, participantId: string) => {
            try {
                collaborationEngine.leaveSession(sessionId, participantId);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('collab:applyOperation', async (_event, sessionId: string, operation: any) => {
            try {
                const result = collaborationEngine.applyOperation(sessionId, operation);
                return { success: true, operation: result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('collab:getConflicts', async (_event, sessionId: string) => {
            try {
                const conflicts = collaborationEngine.getConflicts(sessionId);
                return { success: true, conflicts };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('collab:resolveConflict', async (_event, sessionId: string, conflictId: string) => {
            try {
                const resolution = await collaborationEngine.resolveConflictWithAI(sessionId, conflictId);
                return { success: true, resolution };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('collab:getSessions', async () => {
            try {
                const sessions = collaborationEngine.getActiveSessions();
                return { success: true, sessions };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Collaboration Engine handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Collaboration handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: PROJECT HEALTH DASHBOARD
    // ========================================================================
    try {
        const { projectHealthDashboard } = require('../ai/health/ProjectHealthDashboard');

        ipcMain.handle('health:analyze', async (_event, projectPath: string) => {
            try {
                const health = await projectHealthDashboard.analyze(projectPath);
                return { success: true, health };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('health:get', async (_event, projectPath: string) => {
            try {
                const health = await projectHealthDashboard.getHealth(projectPath);
                return { success: true, health };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('health:autoFix', async (_event, projectPath: string, categories?: string[]) => {
            try {
                const result = await projectHealthDashboard.autoFix(projectPath, categories);
                return { success: true, result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('health:getHistory', async (_event, projectPath: string) => {
            try {
                const history = projectHealthDashboard.getHistory(projectPath);
                return { success: true, history };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('health:generateReport', async (_event, projectPath: string) => {
            try {
                const health = await projectHealthDashboard.getHealth(projectPath);
                const report = projectHealthDashboard.generateReport(health);
                return { success: true, report };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Project Health Dashboard handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Health handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: MULTI-MODAL INPUT
    // ========================================================================
    try {
        const { multiModalInput } = require('../ai/multimodal/MultiModalInput');

        ipcMain.handle('multimodal:analyzeSketch', async (_event, input: any) => {
            try {
                const analysis = await multiModalInput.analyzeSketch(input);
                return { success: true, analysis };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('multimodal:generateFromSketch', async (_event, sketchId: string, analysis: any, framework: string) => {
            try {
                const code = await multiModalInput.generateFromSketch(sketchId, analysis, framework);
                return { success: true, code };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('multimodal:importFigma', async (_event, figmaUrl: string) => {
            try {
                const analysis = await multiModalInput.importFromFigma(figmaUrl);
                return { success: true, analysis };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('multimodal:startVoice', async () => {
            try {
                const session = multiModalInput.startVoiceSession();
                return { success: true, session };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('multimodal:processVoice', async (_event, sessionId: string, transcript: string) => {
            try {
                const command = await multiModalInput.processVoiceCommand(sessionId, transcript);
                return { success: true, command };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('multimodal:endVoice', async (_event, sessionId: string) => {
            try {
                const session = multiModalInput.endVoiceSession(sessionId);
                return { success: true, session };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('multimodal:screenshotToComponent', async (_event, imagePath: string, framework: string) => {
            try {
                const code = await multiModalInput.screenshotToComponent(imagePath, framework);
                return { success: true, code };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Multi-Modal Input handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Multi-Modal handlers not loaded:', error.message);
    }

    // ========================================================================
    // QUEEN 3 MAX: PLUGIN ECOSYSTEM
    // ========================================================================
    try {
        const { pluginEcosystem } = require('../ai/plugins/PluginEcosystem');

        ipcMain.handle('plugins:initialize', async () => {
            try {
                await pluginEcosystem.initialize();
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:search', async (_event, query: string, options: any) => {
            try {
                const result = await pluginEcosystem.searchPlugins(query, options);
                return { success: true, plugins: result.plugins, total: result.total };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:get', async (_event, pluginId: string) => {
            try {
                const plugin = pluginEcosystem.getPlugin(pluginId);
                return { success: true, plugin };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:install', async (_event, pluginId: string) => {
            try {
                const plugin = await pluginEcosystem.installPlugin(pluginId);
                return { success: true, plugin };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:uninstall', async (_event, pluginId: string) => {
            try {
                await pluginEcosystem.uninstallPlugin(pluginId);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:setEnabled', async (_event, pluginId: string, enabled: boolean) => {
            try {
                await pluginEcosystem.setPluginEnabled(pluginId, enabled);
                return { success: true };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:getInstalled', async () => {
            try {
                const plugins = pluginEcosystem.getInstalledPlugins();
                return { success: true, plugins };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:getCategories', async () => {
            try {
                const categories = pluginEcosystem.getCategories();
                return { success: true, categories };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('plugins:createTemplate', async (_event, name: string, outputPath: string, options: any) => {
            try {
                const pluginPath = await pluginEcosystem.createPluginTemplate(name, outputPath, options);
                return { success: true, pluginPath };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        });

        console.log('  ✅ Plugin Ecosystem handlers registered');
    } catch (error: any) {
        console.warn('  ⚠️ Plugin handlers not loaded:', error.message);
    }

    console.log('✅ All advanced agent handlers registered (Phase 1-3 + Queen 3 Max + Extended)');
}

