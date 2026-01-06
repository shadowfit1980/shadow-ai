/**
 * Evolution v6.0 IPC Handlers
 * 
 * Exposes all v6.0 systems to the renderer process:
 * - ExecutionSandbox
 * - RetryEngine
 * - CodeVerifier
 * - VectorStore
 * - ActiveLearningEngine
 * - HTNPlanner
 * - MessageBus
 * - AgentProcess
 */

import { ipcMain } from 'electron';
import { executionSandbox } from '../execution/ExecutionSandbox';
import { retryEngine } from '../execution/RetryEngine';
import { codeVerifier } from '../verification/CodeVerifier';
import { getVectorStore } from '../memory/VectorStore';
import { activeLearningEngine } from '../learning/ActiveLearningEngine';
import { htnPlanner } from '../planning/HTNPlanner';
import { messageBus } from '../agents/MessageBus';
import { agentProcessManager } from '../agents/AgentProcess';

// ============================================================================
// EXECUTION SANDBOX HANDLERS
// ============================================================================

export function registerSandboxHandlers(): void {
    ipcMain.handle('sandbox:initialize', async () => {
        return executionSandbox.initialize();
    });

    ipcMain.handle('sandbox:execute', async (_, request) => {
        return executionSandbox.execute(request);
    });

    ipcMain.handle('sandbox:validate', async (_, request) => {
        return executionSandbox.validateRequest(request);
    });

    ipcMain.handle('sandbox:status', async () => {
        return executionSandbox.getStatus();
    });

    ipcMain.handle('sandbox:cleanup', async () => {
        return executionSandbox.cleanupAll();
    });

    console.log('[IPC] Registered sandbox handlers');
}

// ============================================================================
// RETRY ENGINE HANDLERS
// ============================================================================

export function registerRetryHandlers(): void {
    ipcMain.handle('retry:stats', async (_, endpointId) => {
        if (endpointId) {
            return retryEngine.getStats(endpointId);
        }
        return retryEngine.getAllStats();
    });

    ipcMain.handle('retry:reset', async (_, endpointId) => {
        if (endpointId) {
            retryEngine.resetCircuit(endpointId);
        } else {
            retryEngine.resetAll();
        }
        return { success: true };
    });

    ipcMain.handle('retry:health', async () => {
        return retryEngine.getHealthSummary();
    });

    console.log('[IPC] Registered retry handlers');
}

// ============================================================================
// CODE VERIFIER HANDLERS
// ============================================================================

export function registerVerifierHandlers(): void {
    ipcMain.handle('verify:code', async (_, request) => {
        return codeVerifier.verify(request);
    });

    ipcMain.handle('verify:quick', async (_, code, language) => {
        return codeVerifier.quickValidate(code, language);
    });

    console.log('[IPC] Registered verifier handlers');
}

// ============================================================================
// VECTOR STORE HANDLERS
// ============================================================================

export function registerVectorStoreHandlers(): void {
    const store = getVectorStore();

    ipcMain.handle('vectors:initialize', async () => {
        await store.initialize();
        return { success: true };
    });

    ipcMain.handle('vectors:search', async (_, query, options) => {
        return store.search(query, options);
    });

    ipcMain.handle('vectors:indexFile', async (_, filePath, content) => {
        return store.indexFile(filePath, content);
    });

    ipcMain.handle('vectors:indexDirectory', async (_, dirPath, options) => {
        return store.indexDirectory(dirPath, options);
    });

    ipcMain.handle('vectors:deleteFile', async (_, filePath) => {
        await store.deleteFile(filePath);
        return { success: true };
    });

    ipcMain.handle('vectors:stats', async () => {
        return store.getStats();
    });

    console.log('[IPC] Registered vector store handlers');
}

// ============================================================================
// ACTIVE LEARNING ENGINE HANDLERS
// ============================================================================

export function registerLearningHandlers(): void {
    ipcMain.handle('learning:initialize', async () => {
        await activeLearningEngine.initialize();
        return { success: true };
    });

    ipcMain.handle('learning:trackOutcome', async (_, outcome) => {
        await activeLearningEngine.trackOutcome(outcome);
        return { success: true };
    });

    ipcMain.handle('learning:registerVariant', async (_, basePromptId, variant, hypothesis) => {
        return activeLearningEngine.registerVariant(basePromptId, variant, hypothesis);
    });

    ipcMain.handle('learning:getBestPrompt', async (_, basePromptId) => {
        return activeLearningEngine.getBestPrompt(basePromptId);
    });

    ipcMain.handle('learning:getProfile', async (_, agentId) => {
        return activeLearningEngine.getAgentProfile(agentId);
    });

    ipcMain.handle('learning:suggestMutations', async (_, currentPrompt, recentOutcomes) => {
        return activeLearningEngine.suggestPromptMutations(currentPrompt, recentOutcomes);
    });

    ipcMain.handle('learning:stats', async () => {
        return activeLearningEngine.getStats();
    });

    ipcMain.handle('learning:export', async () => {
        return activeLearningEngine.export();
    });

    ipcMain.handle('learning:import', async (_, data) => {
        await activeLearningEngine.import(data);
        return { success: true };
    });

    console.log('[IPC] Registered learning handlers');
}

// ============================================================================
// HTN PLANNER HANDLERS
// ============================================================================

export function registerPlannerHandlers(): void {
    ipcMain.handle('planner:createPlan', async (_, goal, description) => {
        return htnPlanner.createPlan(goal, description);
    });

    ipcMain.handle('planner:executePlan', async (_, planId) => {
        return htnPlanner.executePlan(planId);
    });

    ipcMain.handle('planner:verifyPlan', async (_, planId) => {
        return htnPlanner.verifyPlan(planId);
    });

    ipcMain.handle('planner:rollbackPlan', async (_, planId, toSnapshot) => {
        return htnPlanner.rollbackPlan(planId, toSnapshot);
    });

    ipcMain.handle('planner:getPlan', async (_, planId) => {
        return htnPlanner.getPlan(planId);
    });

    ipcMain.handle('planner:getAllPlans', async () => {
        return htnPlanner.getAllPlans();
    });

    ipcMain.handle('planner:deletePlan', async (_, planId) => {
        return htnPlanner.deletePlan(planId);
    });

    ipcMain.handle('planner:stats', async () => {
        return htnPlanner.getStats();
    });

    console.log('[IPC] Registered planner handlers');
}

// ============================================================================
// MESSAGE BUS HANDLERS
// ============================================================================

export function registerMessageBusHandlers(): void {
    ipcMain.handle('bus:registerAgent', async (_, agentId) => {
        return messageBus.registerAgent(agentId);
    });

    ipcMain.handle('bus:unregisterAgent', async (_, agentId) => {
        messageBus.unregisterAgent(agentId);
        return { success: true };
    });

    ipcMain.handle('bus:subscribe', async (_, agentId, topic) => {
        // Handler will be set up through events
        return messageBus.subscribe(agentId, topic, (msg) => {
            // Send to renderer via webContents
        });
    });

    ipcMain.handle('bus:unsubscribe', async (_, subscriptionId) => {
        return messageBus.unsubscribe(subscriptionId);
    });

    ipcMain.handle('bus:broadcast', async (_, from, topic, payload, priority) => {
        return messageBus.broadcast(from, topic, payload, priority);
    });

    ipcMain.handle('bus:send', async (_, from, to, payload, priority) => {
        return messageBus.send(from, to, payload, priority);
    });

    ipcMain.handle('bus:request', async (_, from, to, payload, timeout) => {
        return messageBus.request(from, to, payload, timeout);
    });

    ipcMain.handle('bus:getAgents', async () => {
        return messageBus.getConnectedAgents();
    });

    ipcMain.handle('bus:getTopics', async () => {
        return messageBus.getTopics();
    });

    ipcMain.handle('bus:getHistory', async (_, agentId, limit) => {
        return messageBus.getHistory(agentId, limit);
    });

    ipcMain.handle('bus:stats', async () => {
        return messageBus.getStats();
    });

    console.log('[IPC] Registered message bus handlers');
}

// ============================================================================
// AGENT PROCESS HANDLERS
// ============================================================================

export function registerAgentProcessHandlers(): void {
    ipcMain.handle('agents:spawn', async (_, config) => {
        return agentProcessManager.spawn(config);
    });

    ipcMain.handle('agents:terminate', async (_, agentId) => {
        await agentProcessManager.terminate(agentId);
        return { success: true };
    });

    ipcMain.handle('agents:terminateAll', async () => {
        await agentProcessManager.terminateAll();
        return { success: true };
    });

    ipcMain.handle('agents:assignTask', async (_, agentId, task) => {
        return agentProcessManager.assignTask(agentId, task);
    });

    ipcMain.handle('agents:dispatch', async (_, capability, task) => {
        return agentProcessManager.dispatch(capability, task);
    });

    ipcMain.handle('agents:getAgent', async (_, agentId) => {
        const agent = agentProcessManager.getAgent(agentId);
        if (!agent) return null;
        // Return serializable version (no worker)
        return {
            config: agent.config,
            status: agent.status,
            currentTask: agent.currentTask,
            startedAt: agent.startedAt,
            tasksCompleted: agent.tasksCompleted,
            tasksFailed: agent.tasksFailed,
            lastHeartbeat: agent.lastHeartbeat
        };
    });

    ipcMain.handle('agents:getAllAgents', async () => {
        return agentProcessManager.getAllAgents().map(agent => ({
            config: agent.config,
            status: agent.status,
            currentTask: agent.currentTask,
            startedAt: agent.startedAt,
            tasksCompleted: agent.tasksCompleted,
            tasksFailed: agent.tasksFailed,
            lastHeartbeat: agent.lastHeartbeat
        }));
    });

    ipcMain.handle('agents:stats', async () => {
        return agentProcessManager.getStats();
    });

    console.log('[IPC] Registered agent process handlers');
}

// ============================================================================
// MASTER REGISTRATION
// ============================================================================

export function registerAllEvolutionHandlers(): void {
    console.log('[IPC] Registering v6.0 evolution handlers...');

    registerSandboxHandlers();
    registerRetryHandlers();
    registerVerifierHandlers();
    registerVectorStoreHandlers();
    registerLearningHandlers();
    registerPlannerHandlers();
    registerMessageBusHandlers();
    registerAgentProcessHandlers();

    console.log('[IPC] All v6.0 evolution handlers registered (52 handlers)');
}
