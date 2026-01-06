/**
 * Domain Agent IPC Handlers
 * 
 * IPC handlers for MobileAgent, GameAgent, and DesktopAgent
 */

import { ipcMain } from 'electron';
import { MobileAgent } from '../ai/agents/specialist/MobileAgent';
import { GameAgent } from '../ai/agents/specialist/GameAgent';
import { DesktopAgent } from '../ai/agents/specialist/DesktopAgent';
import { TemporalContextEngine, temporalContextEngine } from '../ai/context/TemporalContextEngine';
import { HiveMindService, hiveMindService } from '../services/HiveMindService';
import { RealitySimulatorService, realitySimulator } from '../services/RealitySimulatorService';
import { DomainToolsRegistry, domainTools } from '../ai/tools/DomainTools';

// Instantiate agents
const mobileAgent = new MobileAgent();
const gameAgent = new GameAgent();
const desktopAgent = new DesktopAgent();

export function registerDomainAgentHandlers(): void {
    // =========================================================================
    // MOBILE AGENT HANDLERS
    // =========================================================================

    ipcMain.handle('mobile:execute', async (_event, task) => {
        try {
            return await mobileAgent.execute(task);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('mobile:detectPlatform', async (_event, task) => {
        try {
            return await mobileAgent.detectPlatform(task);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('mobile:generateMetadata', async (_event, description, platform) => {
        try {
            return await mobileAgent.generateAppStoreMetadata(description, platform);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('mobile:getCapabilities', async () => {
        return mobileAgent.capabilities;
    });

    // =========================================================================
    // GAME AGENT HANDLERS
    // =========================================================================

    ipcMain.handle('game:execute', async (_event, task) => {
        try {
            return await gameAgent.execute(task);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('game:detectEngine', async (_event, task) => {
        try {
            return await gameAgent.detectGameProject(task);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('game:generateProcedural', async (_event, asset, project) => {
        try {
            return await gameAgent.generateProcedural(asset, project);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('game:designMultiplayer', async (_event, task, project) => {
        try {
            return await gameAgent.designMultiplayer(task, project);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('game:getCapabilities', async () => {
        return gameAgent.capabilities;
    });

    // =========================================================================
    // DESKTOP AGENT HANDLERS
    // =========================================================================

    ipcMain.handle('desktop:execute', async (_event, task) => {
        try {
            return await desktopAgent.execute(task);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('desktop:detectFramework', async (_event, task) => {
        try {
            return await desktopAgent.detectDesktopProject(task);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('desktop:generateInstaller', async (_event, config, project) => {
        try {
            return await desktopAgent.generateInstallerConfig(config, project);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('desktop:getCapabilities', async () => {
        return desktopAgent.capabilities;
    });

    // =========================================================================
    // TEMPORAL CONTEXT ENGINE HANDLERS
    // =========================================================================

    ipcMain.handle('temporal:analyzeArchaeology', async (_event, filePath) => {
        try {
            return await temporalContextEngine.analyzeCodeArchaeology(filePath);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('temporal:loadHistory', async (_event, commits) => {
        try {
            await temporalContextEngine.loadGitHistory(commits);
            return { success: true };
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('temporal:learnPatterns', async (_event, developerId) => {
        try {
            return await temporalContextEngine.learnDeveloperPatterns(developerId);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('temporal:predictNext', async (_event, developerId, currentFile, recentActions) => {
        try {
            return await temporalContextEngine.predictNextAction(developerId, currentFile, recentActions);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('temporal:getStats', async () => {
        return temporalContextEngine.getStats();
    });

    // =========================================================================
    // HIVEMIND SERVICE HANDLERS
    // =========================================================================

    ipcMain.handle('hivemind:learnPattern', async (_event, problem, solution, category, metadata) => {
        try {
            return await hiveMindService.learnPattern(problem, solution, category, metadata);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('hivemind:query', async (_event, query) => {
        try {
            return await hiveMindService.queryPatterns(query);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('hivemind:getBestSolution', async (_event, problem, context) => {
        try {
            return await hiveMindService.getBestSolution(problem, context);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('hivemind:contribute', async () => {
        try {
            return await hiveMindService.contributePatterns();
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('hivemind:getStats', async () => {
        return hiveMindService.getStats();
    });

    ipcMain.handle('hivemind:getConfig', async () => {
        return hiveMindService.getConfig();
    });

    ipcMain.handle('hivemind:setConfig', async (_event, config) => {
        hiveMindService.setConfig(config);
        return { success: true };
    });

    // =========================================================================
    // REALITY SIMULATOR HANDLERS
    // =========================================================================

    ipcMain.handle('simulator:createShadow', async (_event, config) => {
        try {
            return await realitySimulator.createShadowDeployment(config);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('simulator:simulateUsers', async (_event, options) => {
        try {
            return await realitySimulator.simulateUsers(options);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('simulator:runChaos', async (_event, experiment) => {
        try {
            return await realitySimulator.runChaosExperiment(experiment);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('simulator:runLoadTest', async (_event, options) => {
        try {
            return await realitySimulator.runLoadTest(options);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('simulator:testResilience', async (_event, components) => {
        try {
            return await realitySimulator.testResilience(components);
        } catch (error) {
            return { error: (error as Error).message };
        }
    });

    ipcMain.handle('simulator:getStats', async () => {
        return realitySimulator.getStats();
    });

    // =========================================================================
    // DOMAIN TOOLS HANDLERS
    // =========================================================================

    ipcMain.handle('domainTools:list', async () => {
        return domainTools.list();
    });

    ipcMain.handle('domainTools:listByCategory', async (_event, category) => {
        return domainTools.getByCategory(category).map(t => ({
            name: t.name,
            description: t.description,
            category: t.category
        }));
    });

    ipcMain.handle('domainTools:execute', async (_event, name, params) => {
        try {
            return await domainTools.execute(name, params);
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    console.log('✅ Domain agent handlers registered');
}
