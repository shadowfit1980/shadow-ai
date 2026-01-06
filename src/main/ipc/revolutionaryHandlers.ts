/**
 * 🔌 Revolutionary Handlers
 * 
 * IPC handlers for all new autonomous agent systems:
 * - Project Knowledge Graph
 * - BDI Agent Orchestrator
 * - Security Fortress
 * - Intent Alignment Engine
 * - Temporal Replay Engine
 * - Business-Aware Architect
 * - Intelligent Model Router
 */

import { ipcMain } from 'electron';
import { projectKnowledgeGraph } from '../ai/knowledge/ProjectKnowledgeGraph';
import { bdiAgentOrchestrator } from '../ai/swarm/BDIAgentOrchestrator';
import { securityFortress } from '../ai/security/SecurityFortress';
import { intentAlignmentEngine } from '../ai/intent/IntentAlignmentEngine';
import { temporalReplayEngine } from '../ai/temporal/TemporalReplayEngine';
import { businessAwareArchitect } from '../ai/business/BusinessAwareArchitect';
import { intelligentModelRouter } from '../ai/router/IntelligentModelRouter';

export function registerRevolutionaryHandlers(): void {
    console.log('🚀 Registering revolutionary agent handlers...');

    // ==================== PROJECT KNOWLEDGE GRAPH ====================

    ipcMain.handle('knowledge:createProject', async (_, name: string, description: string) => {
        return projectKnowledgeGraph.createProject(name, description);
    });

    ipcMain.handle('knowledge:getProject', async (_, projectId: string) => {
        return projectKnowledgeGraph.getProject(projectId);
    });

    ipcMain.handle('knowledge:updateProject', async (_, projectId: string, updates: any) => {
        projectKnowledgeGraph.updateProjectContext(projectId, updates);
        return { success: true };
    });

    ipcMain.handle('knowledge:addDecision', async (_, projectId: string, question: string, answer: string, rationale: string, alternatives?: any[], constraints?: string[]) => {
        return projectKnowledgeGraph.addDesignDecision(projectId, question, answer, rationale, alternatives, constraints);
    });

    ipcMain.handle('knowledge:addRequirement', async (_, projectId: string, content: string, category: any, priority: any, kpis?: any[]) => {
        return projectKnowledgeGraph.addRequirement(projectId, content, category, priority, kpis);
    });

    ipcMain.handle('knowledge:query', async (_, projectId: string, question: string) => {
        return projectKnowledgeGraph.query(projectId, question);
    });

    ipcMain.handle('knowledge:getHistory', async (_, projectId: string) => {
        return projectKnowledgeGraph.getProjectHistory(projectId);
    });

    ipcMain.handle('knowledge:getDecisionHistory', async (_, projectId: string) => {
        return projectKnowledgeGraph.getDecisionHistory(projectId);
    });

    ipcMain.handle('knowledge:getStats', async (_, projectId: string) => {
        return projectKnowledgeGraph.getProjectStats(projectId);
    });

    ipcMain.handle('knowledge:recordMetric', async (_, projectId: string, name: string, value: number, unit: string, target?: number) => {
        return projectKnowledgeGraph.recordMetric(projectId, name, value, unit, target);
    });

    // ==================== BDI AGENT ORCHESTRATOR ====================

    ipcMain.handle('bdi:submitTask', async (_, description: string, projectId: string, priority?: string) => {
        return bdiAgentOrchestrator.submitTask(description, projectId, priority as any);
    });

    ipcMain.handle('bdi:getAgents', async () => {
        return bdiAgentOrchestrator.getAgents();
    });

    ipcMain.handle('bdi:getAgent', async (_, id: string) => {
        return bdiAgentOrchestrator.getAgent(id);
    });

    ipcMain.handle('bdi:getTasks', async () => {
        return bdiAgentOrchestrator.getTasks();
    });

    ipcMain.handle('bdi:getTask', async (_, id: string) => {
        return bdiAgentOrchestrator.getTask(id);
    });

    ipcMain.handle('bdi:getDebates', async () => {
        return bdiAgentOrchestrator.getDebates();
    });

    ipcMain.handle('bdi:initiateDebate', async (_, topic: string, taskId: string, participantRoles: string[]) => {
        return bdiAgentOrchestrator.initiateDebate(topic, taskId, participantRoles as any);
    });

    ipcMain.handle('bdi:getSwarmStatus', async () => {
        return bdiAgentOrchestrator.getSwarmStatus();
    });

    // ==================== SECURITY FORTRESS ====================

    ipcMain.handle('security:storeCredential', async (_, key: string, value: string, expiresIn?: number) => {
        await securityFortress.storeCredential(key, value, expiresIn);
        return { success: true };
    });

    ipcMain.handle('security:getCredential', async (_, key: string) => {
        return securityFortress.getCredential(key);
    });

    ipcMain.handle('security:deleteCredential', async (_, key: string) => {
        await securityFortress.deleteCredential(key);
        return { success: true };
    });

    ipcMain.handle('security:createContext', async (_, principal: string, permissions: string[], ttlMs?: number) => {
        return securityFortress.createContext(principal, permissions as any, ttlMs);
    });

    ipcMain.handle('security:checkPermission', async (_, contextId: string, permission: string, resource: string) => {
        return securityFortress.checkPermission(contextId, permission as any, resource);
    });

    ipcMain.handle('security:scanForThreats', async (_, code: string, filename?: string) => {
        return securityFortress.scanForThreats(code, filename);
    });

    ipcMain.handle('security:executeInSandbox', async (_, code: string, language: string, permissions: string[], timeout?: number) => {
        return securityFortress.executeInSandbox(code, language, permissions as any, timeout);
    });

    ipcMain.handle('security:getReport', async () => {
        return securityFortress.getSecurityReport();
    });

    // ==================== INTENT ALIGNMENT ENGINE ====================

    ipcMain.handle('intent:parse', async (_, input: string, projectId?: string) => {
        return intentAlignmentEngine.parseIntent(input, projectId);
    });

    ipcMain.handle('intent:align', async (_, intent: any) => {
        return intentAlignmentEngine.alignIntent(intent);
    });

    ipcMain.handle('intent:setProfile', async (_, profile: any) => {
        intentAlignmentEngine.setUserProfile(profile);
        return { success: true };
    });

    ipcMain.handle('intent:getProfile', async () => {
        return intentAlignmentEngine.getUserProfile();
    });

    ipcMain.handle('intent:getHistory', async () => {
        return intentAlignmentEngine.getIntentHistory();
    });

    // ==================== TEMPORAL REPLAY ENGINE ====================

    ipcMain.handle('temporal:logDecision', async (_, projectId: string, agent: string, action: string, inputs: any, decision: any, llmRequest?: any, llmResponse?: any) => {
        return temporalReplayEngine.logDecision(projectId, agent, action, inputs, decision, llmRequest, llmResponse);
    });

    ipcMain.handle('temporal:recordOutcome', async (_, decisionId: string, success: boolean, result?: any, error?: string, sideEffects?: string[]) => {
        temporalReplayEngine.recordOutcome(decisionId, success, result, error, sideEffects);
        return { success: true };
    });

    ipcMain.handle('temporal:takeSnapshot', async (_, projectId: string, description: string, trigger?: string) => {
        return temporalReplayEngine.takeSnapshot(projectId, description, trigger as any);
    });

    ipcMain.handle('temporal:createTimeline', async (_, projectId: string, name: string) => {
        return temporalReplayEngine.createTimeline(projectId, name);
    });

    ipcMain.handle('temporal:branchTimeline', async (_, decisionId: string, branchName: string) => {
        return temporalReplayEngine.branchTimeline(decisionId, branchName);
    });

    ipcMain.handle('temporal:startReplay', async (_, decisionId: string) => {
        return temporalReplayEngine.startReplay(decisionId);
    });

    ipcMain.handle('temporal:stepReplay', async (_, sessionId: string) => {
        return temporalReplayEngine.stepReplay(sessionId);
    });

    ipcMain.handle('temporal:modifyDecision', async (_, sessionId: string, decisionId: string, newChoice: string, newReasoning: string) => {
        return temporalReplayEngine.modifyDecision(sessionId, decisionId, newChoice, newReasoning);
    });

    ipcMain.handle('temporal:rollbackToSnapshot', async (_, snapshotId: string) => {
        return temporalReplayEngine.rollbackToSnapshot(snapshotId);
    });

    ipcMain.handle('temporal:rollbackToDecision', async (_, decisionId: string) => {
        return temporalReplayEngine.rollbackToDecision(decisionId);
    });

    ipcMain.handle('temporal:getDecisionHistory', async (_, projectId: string, limit?: number) => {
        return temporalReplayEngine.getDecisionHistory(projectId, limit);
    });

    ipcMain.handle('temporal:findDecisions', async (_, criteria: any) => {
        return temporalReplayEngine.findDecisions(criteria);
    });

    ipcMain.handle('temporal:analyzeFailure', async (_, decisionId: string) => {
        return temporalReplayEngine.analyzeFailure(decisionId);
    });

    ipcMain.handle('temporal:getVisualization', async (_, projectId: string) => {
        return temporalReplayEngine.getTimelineVisualization(projectId);
    });

    // ==================== BUSINESS-AWARE ARCHITECT ====================

    ipcMain.handle('business:generateBRD', async (_, intent: any, projectId: string) => {
        return businessAwareArchitect.generateBRD(intent, projectId);
    });

    ipcMain.handle('business:validateFeasibility', async (_, brd: any) => {
        return businessAwareArchitect.validateFeasibility(brd);
    });

    ipcMain.handle('business:getBRD', async (_, id: string) => {
        return businessAwareArchitect.getBRD(id);
    });

    ipcMain.handle('business:getAllBRDs', async (_, projectId: string) => {
        return businessAwareArchitect.getAllBRDs(projectId);
    });

    // ==================== INTELLIGENT MODEL ROUTER ====================

    ipcMain.handle('router:route', async (_, request: any) => {
        return intelligentModelRouter.route(request);
    });

    ipcMain.handle('router:getModels', async () => {
        return intelligentModelRouter.getModels();
    });

    ipcMain.handle('router:getModel', async (_, id: string) => {
        return intelligentModelRouter.getModel(id);
    });

    ipcMain.handle('router:getMetrics', async (_, modelId: string) => {
        return intelligentModelRouter.getMetrics(modelId);
    });

    ipcMain.handle('router:getAllMetrics', async () => {
        return intelligentModelRouter.getAllMetrics();
    });

    ipcMain.handle('router:recordRequest', async (_, modelId: string, success: boolean, latency: number, inputTokens: number, outputTokens: number, taskType: string) => {
        intelligentModelRouter.recordRequest(modelId, success, latency, inputTokens, outputTokens, taskType as any);
        return { success: true };
    });

    ipcMain.handle('router:recommend', async (_, taskType: string) => {
        return intelligentModelRouter.recommendForTask(taskType as any);
    });

    ipcMain.handle('router:getCostReport', async () => {
        return intelligentModelRouter.getCostOptimizationReport();
    });

    console.log('✅ Revolutionary handlers registered successfully!');
    console.log('   - knowledge:* (10 handlers)');
    console.log('   - bdi:* (8 handlers)');
    console.log('   - security:* (8 handlers)');
    console.log('   - intent:* (5 handlers)');
    console.log('   - temporal:* (14 handlers)');
    console.log('   - business:* (4 handlers)');
    console.log('   - router:* (9 handlers)');
    console.log('   Total: 58 new IPC handlers');
}
