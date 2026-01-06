/**
 * Enterprise Advanced IPC Handlers
 * IPC bridge for Knowledge Base, Personas, and Call Tracing
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let knowledgeBase: any = null;
let personaManager: any = null;
let callTracer: any = null;

async function getKnowledgeBase() {
    if (!knowledgeBase) {
        try {
            const { getKnowledgeBase: getKB } = await import('../knowledge/KnowledgeBase');
            knowledgeBase = getKB();
        } catch (error) {
            console.warn('⚠️ KnowledgeBase not available:', (error as Error).message);
            return null;
        }
    }
    return knowledgeBase;
}

async function getPersonaManager() {
    if (!personaManager) {
        try {
            const { getPersonaManager: getPM } = await import('../personas/PersonaManager');
            personaManager = getPM();
        } catch (error) {
            console.warn('⚠️ PersonaManager not available:', (error as Error).message);
            return null;
        }
    }
    return personaManager;
}

async function getCallTracer() {
    if (!callTracer) {
        try {
            const { getCallTracer: getCT } = await import('../debugging/CallTracer');
            callTracer = getCT();
        } catch (error) {
            console.warn('⚠️ CallTracer not available:', (error as Error).message);
            return null;
        }
    }
    return callTracer;
}

/**
 * Setup enterprise advanced IPC handlers
 */
export function setupEnterpriseHandlers(): void {
    // === KNOWLEDGE BASE HANDLERS ===

    ipcMain.handle('knowledge:addDocument', async (_, options: any) => {
        try {
            const kb = await getKnowledgeBase();
            if (!kb) return { success: false, error: 'Knowledge base not available' };

            const document = await kb.addDocument(options);
            return { success: true, document };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('knowledge:search', async (_, { query, options }: any) => {
        try {
            const kb = await getKnowledgeBase();
            if (!kb) return { success: false, error: 'Knowledge base not available' };

            const results = await kb.search(query, options);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('knowledge:getAnswer', async (_, { question }: { question: string }) => {
        try {
            const kb = await getKnowledgeBase();
            if (!kb) return { success: false, error: 'Knowledge base not available' };

            const result = await kb.getAnswer(question);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('knowledge:getAll', async () => {
        try {
            const kb = await getKnowledgeBase();
            if (!kb) return { success: false, error: 'Knowledge base not available' };

            const documents = kb.getAllDocuments();
            return { success: true, documents };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('knowledge:stats', async () => {
        try {
            const kb = await getKnowledgeBase();
            if (!kb) return { success: false, error: 'Knowledge base not available' };

            const stats = kb.getStats();
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === PERSONA HANDLERS ===

    ipcMain.handle('persona:create', async (_, options: any) => {
        try {
            const pm = await getPersonaManager();
            if (!pm) return { success: false, error: 'Persona manager not available' };

            const persona = await pm.createPersona(options);
            return { success: true, persona };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('persona:getActive', async () => {
        try {
            const pm = await getPersonaManager();
            if (!pm) return { success: false, error: 'Persona manager not available' };

            const persona = pm.getActivePersona();
            return { success: true, persona };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('persona:setActive', async (_, { id }: { id: string }) => {
        try {
            const pm = await getPersonaManager();
            if (!pm) return { success: false, error: 'Persona manager not available' };

            const persona = await pm.setActivePersona(id);
            return { success: true, persona };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('persona:getAll', async () => {
        try {
            const pm = await getPersonaManager();
            if (!pm) return { success: false, error: 'Persona manager not available' };

            const personas = pm.getAllPersonas();
            return { success: true, personas };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CALL TRACER HANDLERS ===

    ipcMain.handle('trace:start', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const ct = await getCallTracer();
            if (!ct) return { success: false, error: 'Call tracer not available' };

            const trace = ct.startTrace(sessionId);
            return { success: true, trace };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('trace:end', async (_, { traceId, status }: any) => {
        try {
            const ct = await getCallTracer();
            if (!ct) return { success: false, error: 'Call tracer not available' };

            const trace = ct.endTrace(traceId, status);
            return { success: true, trace };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('trace:get', async (_, { traceId }: { traceId: string }) => {
        try {
            const ct = await getCallTracer();
            if (!ct) return { success: false, error: 'Call tracer not available' };

            const trace = ct.getTrace(traceId);
            return { success: true, trace };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('trace:visualize', async (_, { traceId }: { traceId: string }) => {
        try {
            const ct = await getCallTracer();
            if (!ct) return { success: false, error: 'Call tracer not available' };

            const visualization = ct.visualizeTrace(traceId);
            return { success: true, visualization };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('trace:getAll', async (_, { limit }: { limit?: number } = {}) => {
        try {
            const ct = await getCallTracer();
            if (!ct) return { success: false, error: 'Call tracer not available' };

            const traces = ct.getAllTraces(limit);
            return { success: true, traces };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Enterprise advanced IPC handlers registered');
}
