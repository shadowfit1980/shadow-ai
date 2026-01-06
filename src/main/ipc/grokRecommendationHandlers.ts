/**
 * Enhanced IPC Handlers for Grok Recommendations
 * Exposes all new features to the renderer process
 */
import { ipcMain } from 'electron';
import { autoModelSwitcher } from '../ai/routing/AutoModelSwitcher';
import { gitRollbackManager } from '../ai/git/GitRollbackManager';
import { voiceWebsiteBuilder } from '../ai/voice/VoiceWebsiteBuilder';
import { noCodeUIBuilder } from '../ai/builder/NoCodeUIBuilder';
import { quantizationSuite } from '../ai/optimization/QuantizationSuite';
import { hiveMindOrchestrator } from '../ai/swarm/HiveMindOrchestrator';
import { codeEvolutionSimulator } from '../ai/evolution/CodeEvolutionSimulator';
import { healthMonitor } from '../ai/health/HealthMonitor';
import { neuralInterfaceBridge } from '../ai/neural/NeuralInterfaceBridge';
import { arvrCodeImmersion } from '../ai/visualization/ARVRCodeImmersion';
import { singularityMode } from '../ai/singularity/SingularityMode';
import { multiverseSimulator } from '../ai/multiverse/MultiverseSimulator';
import { dreamToAppGenerator } from '../ai/creativity/DreamToAppGenerator';
import { ambientCodingAssistant } from '../ai/ambient/AmbientCodingAssistant';

export function registerGrokRecommendationHandlers(): void {
    // ============ Auto Model Switcher ============
    ipcMain.handle('auto-model:analyze-task', async (_, prompt: string, context?: string) => {
        return autoModelSwitcher.analyzeTask(prompt, context);
    });

    ipcMain.handle('auto-model:auto-switch', async (_, prompt: string, context?: string, preferLocal?: boolean) => {
        return autoModelSwitcher.autoSwitch(prompt, context, preferLocal);
    });

    ipcMain.handle('auto-model:get-models', async () => {
        return autoModelSwitcher.getAvailableModels();
    });

    // ============ Git Rollback Manager ============
    ipcMain.handle('git-rollback:create-snapshot', async (_, message?: string) => {
        return gitRollbackManager.createSnapshot(message);
    });

    ipcMain.handle('git-rollback:rollback', async (_, snapshotId: string) => {
        return gitRollbackManager.rollback(snapshotId);
    });

    ipcMain.handle('git-rollback:get-timeline', async (_, limit?: number) => {
        return gitRollbackManager.getTimeline(limit);
    });

    ipcMain.handle('git-rollback:simulate-merge', async (_, targetBranch: string) => {
        return gitRollbackManager.simulateBranchMerge(targetBranch);
    });

    ipcMain.handle('git-rollback:get-snapshots', async () => {
        return gitRollbackManager.getSnapshots();
    });

    // ============ Voice Website Builder ============
    ipcMain.handle('voice-website:process', async (_, voiceText: string) => {
        return voiceWebsiteBuilder.processVoice(voiceText);
    });

    ipcMain.handle('voice-website:generate-code', async (_, framework?: 'react' | 'html' | 'vue') => {
        return voiceWebsiteBuilder.generateCode(framework);
    });

    ipcMain.handle('voice-website:get-spec', async () => {
        return voiceWebsiteBuilder.getSpec();
    });

    ipcMain.handle('voice-website:reset', async () => {
        voiceWebsiteBuilder.resetSpec();
        return { success: true };
    });

    // ============ No-Code UI Builder ============
    ipcMain.handle('nocode:add-component', async (_, type: string, x: number, y: number, parentId?: string) => {
        return noCodeUIBuilder.addComponent(type, x, y, parentId);
    });

    ipcMain.handle('nocode:move-component', async (_, id: string, x: number, y: number) => {
        return noCodeUIBuilder.moveComponent(id, x, y);
    });

    ipcMain.handle('nocode:update-style', async (_, id: string, styles: Record<string, string>) => {
        return noCodeUIBuilder.updateStyle(id, styles);
    });

    ipcMain.handle('nocode:generate-code', async (_, options: { framework: string; cssFramework: string; typescript: boolean }) => {
        return noCodeUIBuilder.generateCode(options as { framework: 'react' | 'vue' | 'angular' | 'html' | 'svelte'; cssFramework: 'tailwind' | 'vanilla' | 'styled-components' | 'css-modules'; typescript: boolean; componentStyle: 'functional' | 'class' });
    });

    ipcMain.handle('nocode:get-templates', async () => {
        return noCodeUIBuilder.getTemplates();
    });

    ipcMain.handle('nocode:get-canvas', async () => {
        return noCodeUIBuilder.getCanvas();
    });

    ipcMain.handle('nocode:undo', async () => {
        return noCodeUIBuilder.undo();
    });

    ipcMain.handle('nocode:redo', async () => {
        return noCodeUIBuilder.redo();
    });

    // ============ Quantization Suite ============
    ipcMain.handle('quantization:get-hardware', async () => {
        return quantizationSuite.getHardwareProfile();
    });

    ipcMain.handle('quantization:recommend', async (_, modelSize: number) => {
        return quantizationSuite.recommendQuantization(modelSize);
    });

    ipcMain.handle('quantization:calculate-config', async (_, modelPath: string) => {
        return quantizationSuite.calculateOptimalConfig(modelPath);
    });

    ipcMain.handle('quantization:quantize', async (_, modelPath: string, config: unknown) => {
        return quantizationSuite.quantizeModel(modelPath, config as Parameters<typeof quantizationSuite.quantizeModel>[1]);
    });

    ipcMain.handle('quantization:get-methods', async () => {
        return quantizationSuite.getQuantizationMethods();
    });

    ipcMain.handle('quantization:get-bit-options', async () => {
        return quantizationSuite.getBitOptions();
    });

    // ============ Hive Mind Orchestrator ============
    ipcMain.handle('hivemind:register-agent', async (_, agentId: string, userId: string, teamId: string, capabilities?: string[]) => {
        return hiveMindOrchestrator.registerAgent(agentId, userId, teamId, capabilities);
    });

    ipcMain.handle('hivemind:share-knowledge', async (_, agentId: string, key: string, value: unknown, confidence?: number) => {
        return hiveMindOrchestrator.shareKnowledge(agentId, key, value, confidence);
    });

    ipcMain.handle('hivemind:query-knowledge', async (_, key: string) => {
        return hiveMindOrchestrator.queryKnowledge(key);
    });

    ipcMain.handle('hivemind:create-task', async (_, description: string, requiredCapabilities: string[], priority?: number) => {
        return hiveMindOrchestrator.createSwarmTask(description, requiredCapabilities, priority);
    });

    ipcMain.handle('hivemind:initiate-consensus', async (_, topic: string, options: string[]) => {
        return hiveMindOrchestrator.initiateConsensus(topic, options);
    });

    ipcMain.handle('hivemind:get-stats', async () => {
        return hiveMindOrchestrator.getStats();
    });

    // ============ Code Evolution Simulator ============
    ipcMain.handle('evolution:evolve', async (_, originalCode: string, config?: unknown) => {
        return codeEvolutionSimulator.evolve(originalCode, config as Parameters<typeof codeEvolutionSimulator.evolve>[1]);
    });

    ipcMain.handle('evolution:stop', async () => {
        codeEvolutionSimulator.stop();
        return { success: true };
    });

    ipcMain.handle('evolution:get-population', async () => {
        return codeEvolutionSimulator.getPopulation();
    });

    ipcMain.handle('evolution:get-history', async () => {
        return codeEvolutionSimulator.getHistory();
    });

    ipcMain.handle('evolution:get-operators', async () => {
        return codeEvolutionSimulator.getMutationOperators();
    });

    // ============ Health Monitor ============
    ipcMain.handle('health:start-session', async () => {
        return healthMonitor.startSession();
    });

    ipcMain.handle('health:end-session', async () => {
        return healthMonitor.endSession();
    });

    ipcMain.handle('health:take-break', async (_, type: 'micro' | 'short' | 'long' | 'eye' | 'stretch' | 'walk') => {
        healthMonitor.takeBreak(type);
        return { success: true };
    });

    ipcMain.handle('health:get-metrics', async () => {
        return healthMonitor.getMetrics();
    });

    ipcMain.handle('health:get-goals', async () => {
        return healthMonitor.getGoals();
    });

    ipcMain.handle('health:get-summary', async () => {
        return healthMonitor.getDailySummary();
    });

    ipcMain.handle('health:record-water', async () => {
        healthMonitor.recordWaterIntake();
        return { success: true };
    });

    ipcMain.handle('health:get-mini-games', async () => {
        return healthMonitor.getMiniGames();
    });

    // ============ Neural Interface Bridge ============
    ipcMain.handle('neural:connect', async (_, deviceType?: 'eeg' | 'fnirs' | 'emg' | 'hybrid' | 'simulated') => {
        return neuralInterfaceBridge.connectDevice(deviceType);
    });

    ipcMain.handle('neural:disconnect', async () => {
        return neuralInterfaceBridge.disconnectDevice();
    });

    ipcMain.handle('neural:calibrate', async (_, type: 'baseline' | 'focus' | 'relax') => {
        return neuralInterfaceBridge.calibrate(type);
    });

    ipcMain.handle('neural:get-state', async () => {
        return neuralInterfaceBridge.getBrainState();
    });

    ipcMain.handle('neural:get-device', async () => {
        return neuralInterfaceBridge.getDevice();
    });

    ipcMain.handle('neural:get-quality', async () => {
        return neuralInterfaceBridge.getSignalQuality();
    });

    ipcMain.handle('neural:get-supported-devices', async () => {
        return neuralInterfaceBridge.getSupportedDevices();
    });

    // ============ AR/VR Code Immersion ============
    ipcMain.handle('arvr:parse-codebase', async (_, files: { path: string; content: string; type: string }[]) => {
        return arvrCodeImmersion.parseCodebase(files);
    });

    ipcMain.handle('arvr:navigate', async (_, event: unknown) => {
        arvrCodeImmersion.navigate(event as Parameters<typeof arvrCodeImmersion.navigate>[0]);
        return { success: true };
    });

    ipcMain.handle('arvr:set-theme', async (_, themeName: string) => {
        return arvrCodeImmersion.setTheme(themeName);
    });

    ipcMain.handle('arvr:select-node', async (_, nodeId: string) => {
        return arvrCodeImmersion.selectNode(nodeId);
    });

    ipcMain.handle('arvr:search-nodes', async (_, query: string) => {
        return arvrCodeImmersion.searchNodes(query);
    });

    ipcMain.handle('arvr:get-space', async () => {
        return arvrCodeImmersion.getSpace();
    });

    ipcMain.handle('arvr:generate-threejs', async () => {
        return arvrCodeImmersion.generateThreeJSScene();
    });

    // ============ Singularity Mode ============
    ipcMain.handle('singularity:activate', async () => {
        return singularityMode.activate();
    });

    ipcMain.handle('singularity:deactivate', async () => {
        singularityMode.deactivate();
        return { success: true };
    });

    ipcMain.handle('singularity:get-status', async () => {
        return singularityMode.getStatus();
    });

    ipcMain.handle('singularity:get-capabilities', async () => {
        return singularityMode.getCapabilities();
    });

    ipcMain.handle('singularity:get-report', async () => {
        return singularityMode.getEvolutionReport();
    });

    ipcMain.handle('singularity:analyze', async () => {
        return singularityMode.performSelfAnalysis();
    });

    // ============ Multiverse Simulator ============
    ipcMain.handle('multiverse:branch', async (_, decision: unknown) => {
        return multiverseSimulator.branchUniverse(decision as Parameters<typeof multiverseSimulator.branchUniverse>[0]);
    });

    ipcMain.handle('multiverse:simulate', async (_, universeId: string, timeframe?: 'short' | 'medium' | 'long') => {
        return multiverseSimulator.simulateOutcome(universeId, timeframe);
    });

    ipcMain.handle('multiverse:compare', async (_, universeIds: string[]) => {
        return multiverseSimulator.compareUniverses(universeIds);
    });

    ipcMain.handle('multiverse:merge', async (_, sourceId: string, targetId?: string) => {
        return multiverseSimulator.mergeUniverse(sourceId, targetId);
    });

    ipcMain.handle('multiverse:switch', async (_, universeId: string) => {
        return multiverseSimulator.switchUniverse(universeId);
    });

    ipcMain.handle('multiverse:get-all', async () => {
        return multiverseSimulator.getAllUniverses();
    });

    ipcMain.handle('multiverse:what-if', async (_, question: string, scenarios: string[]) => {
        return multiverseSimulator.whatIf(question, scenarios);
    });

    // ============ Dream-to-App Generator ============
    ipcMain.handle('dream:dream', async (_, input: unknown, minutes?: number) => {
        return dreamToAppGenerator.dream(input as Parameters<typeof dreamToAppGenerator.dream>[0], minutes);
    });

    ipcMain.handle('dream:get-history', async () => {
        return dreamToAppGenerator.getDreamHistory();
    });

    ipcMain.handle('dream:get-patterns', async () => {
        return dreamToAppGenerator.getPatterns();
    });

    ipcMain.handle('dream:is-dreaming', async () => {
        return dreamToAppGenerator.isCurrentlyDreaming();
    });

    // ============ Ambient Coding Assistant ============
    ipcMain.handle('ambient:start', async () => {
        return ambientCodingAssistant.startAmbientMode();
    });

    ipcMain.handle('ambient:stop', async () => {
        ambientCodingAssistant.stopAmbientMode();
        return { success: true };
    });

    ipcMain.handle('ambient:process-voice', async (_, transcript: string) => {
        ambientCodingAssistant.processVoiceInput(transcript);
        return { success: true };
    });

    ipcMain.handle('ambient:get-settings', async () => {
        return ambientCodingAssistant.getSettings();
    });

    ipcMain.handle('ambient:update-settings', async (_, settings: unknown) => {
        ambientCodingAssistant.updateSettings(settings as Parameters<typeof ambientCodingAssistant.updateSettings>[0]);
        return { success: true };
    });

    ipcMain.handle('ambient:get-history', async () => {
        return ambientCodingAssistant.getHistory();
    });

    ipcMain.handle('ambient:get-current-task', async () => {
        return ambientCodingAssistant.getCurrentTask();
    });

    ipcMain.handle('ambient:is-active', async () => {
        return ambientCodingAssistant.isActive();
    });

    ipcMain.handle('ambient:get-calming-message', async () => {
        return ambientCodingAssistant.getCalmingMessage();
    });
}
