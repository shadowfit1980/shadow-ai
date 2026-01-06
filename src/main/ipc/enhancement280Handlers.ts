/**
 * Enhancement 280+ IPC Handlers - Google Opal-inspired enterprise AI features
 */

import { ipcMain } from 'electron';

export function setupEnhancement280Handlers(): void {
    // CONTEXT ENGINE
    ipcMain.handle('context:create', async (_, { maxTokens, strategy }: any) => {
        try { const { getContextEngine } = await import('../contextengine/ContextEngine'); return { success: true, window: getContextEngine().create(maxTokens, strategy) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INTENT DETECTOR
    ipcMain.handle('intent:detect', async (_, { input }: any) => {
        try { const { getIntentDetector } = await import('../intentdetector/IntentDetector'); return { success: true, intents: getIntentDetector().detect(input) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ENTITY EXTRACTOR
    ipcMain.handle('entity:extract', async (_, { text }: any) => {
        try { const { getEntityExtractor } = await import('../entityextractor/EntityExtractor'); return { success: true, entities: getEntityExtractor().extract(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // KNOWLEDGE GRAPH
    ipcMain.handle('graph:addNode', async (_, { type, label, properties }: any) => {
        try { const { getKnowledgeGraph } = await import('../knowledgegraph/KnowledgeGraph'); return { success: true, node: getKnowledgeGraph().addNode(type, label, properties) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONVERSATION MANAGER
    ipcMain.handle('conversation:create', async (_, { title }: any) => {
        try { const { getConversationManager } = await import('../convmgr/ConversationManager'); return { success: true, conversation: getConversationManager().create(title) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MULTIMODAL
    ipcMain.handle('multimodal:process', async (_, { input }: any) => {
        try { const { getMultimodalEngine } = await import('../multimodal/MultimodalEngine'); return { success: true, output: await getMultimodalEngine().process(input) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // GROUNDING
    ipcMain.handle('grounding:verify', async (_, { claim }: any) => {
        try { const { getGroundingService } = await import('../grounding/GroundingService'); return { success: true, result: await getGroundingService().verify(claim) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SAFETY GUARD
    ipcMain.handle('safety:check', async (_, { input }: any) => {
        try { const { getSafetyGuard } = await import('../safetyguard/SafetyGuard'); return { success: true, result: getSafetyGuard().check(input) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FEEDBACK LOOP
    ipcMain.handle('feedback:submit', async (_, { responseId, type, rating, comment }: any) => {
        try { const { getFeedbackLoop } = await import('../feedbackloop/FeedbackLoop'); return { success: true, feedback: getFeedbackLoop().submit(responseId, type, rating, comment) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL ORCHESTRATOR
    ipcMain.handle('orchestrator:selectBest', async (_, { capability, preference }: any) => {
        try { const { getModelOrchestrator } = await import('../modelorch/ModelOrchestrator'); return { success: true, model: getModelOrchestrator().selectBest(capability, preference) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 280+ IPC handlers registered (10 handlers)');
}
