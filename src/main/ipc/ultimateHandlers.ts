/**
 * Ultimate Enhancement IPC Handlers
 * IPC bridge for ImageToCode, SmartImports, AIChat
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let imageToCode: any = null;
let smartImports: any = null;
let aiChat: any = null;

async function getImageToCode() {
    if (!imageToCode) {
        try {
            const { getImageToCode: getITC } = await import('../design/ImageToCode');
            imageToCode = getITC();
        } catch (error) {
            console.warn('⚠️ ImageToCode not available:', (error as Error).message);
            return null;
        }
    }
    return imageToCode;
}

async function getSmartImports() {
    if (!smartImports) {
        try {
            const { getSmartImports: getSI } = await import('../imports/SmartImports');
            smartImports = getSI();
        } catch (error) {
            console.warn('⚠️ SmartImports not available:', (error as Error).message);
            return null;
        }
    }
    return smartImports;
}

async function getAIChat() {
    if (!aiChat) {
        try {
            const { getAIChat: getAC } = await import('../chat/AIChat');
            aiChat = getAC();
        } catch (error) {
            console.warn('⚠️ AIChat not available:', (error as Error).message);
            return null;
        }
    }
    return aiChat;
}

/**
 * Setup ultimate enhancement handlers
 */
export function setupUltimateHandlers(): void {
    // === IMAGE TO CODE ===

    ipcMain.handle('imageToCode:analyze', async (_, { imagePath }: { imagePath: string }) => {
        try {
            const itc = await getImageToCode();
            if (!itc) return { success: false, error: 'ImageToCode not available' };

            const analysis = await itc.analyze(imagePath);
            return { success: true, analysis };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('imageToCode:generate', async (_, { analysisId, framework }: any) => {
        try {
            const itc = await getImageToCode();
            if (!itc) return { success: false, error: 'ImageToCode not available' };

            const code = await itc.generateCode(analysisId, framework);
            return { success: true, code };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('imageToCode:getAnalysis', async (_, { id }: { id: string }) => {
        try {
            const itc = await getImageToCode();
            if (!itc) return { success: false, error: 'ImageToCode not available' };

            const analysis = itc.getAnalysis(id);
            return { success: true, analysis };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === SMART IMPORTS ===

    ipcMain.handle('imports:parse', async (_, { code }: { code: string }) => {
        try {
            const si = await getSmartImports();
            if (!si) return { success: false, error: 'SmartImports not available' };

            const imports = si.parseImports(code);
            return { success: true, imports };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('imports:optimize', async (_, { code }: { code: string }) => {
        try {
            const si = await getSmartImports();
            if (!si) return { success: false, error: 'SmartImports not available' };

            const result = si.optimize(code);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('imports:findUnused', async (_, { code }: { code: string }) => {
        try {
            const si = await getSmartImports();
            if (!si) return { success: false, error: 'SmartImports not available' };

            const imports = si.parseImports(code);
            const unused = si.findUnused(code, imports);
            return { success: true, unused };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('imports:addImport', async (_, { code, symbol, source }: any) => {
        try {
            const si = await getSmartImports();
            if (!si) return { success: false, error: 'SmartImports not available' };

            const newCode = si.addImport(code, symbol, source);
            return { success: true, code: newCode };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === AI CHAT ===

    ipcMain.handle('chat:createSession', async (_, { title }: any = {}) => {
        try {
            const ac = await getAIChat();
            if (!ac) return { success: false, error: 'AIChat not available' };

            const session = ac.createSession(title);
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('chat:sendMessage', async (_, { content, sessionId }: any) => {
        try {
            const ac = await getAIChat();
            if (!ac) return { success: false, error: 'AIChat not available' };

            const message = await ac.sendMessage(content, sessionId);
            return { success: true, message };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('chat:getSessions', async () => {
        try {
            const ac = await getAIChat();
            if (!ac) return { success: false, error: 'AIChat not available' };

            const sessions = ac.getAllSessions();
            return { success: true, sessions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('chat:getSession', async (_, { id }: { id: string }) => {
        try {
            const ac = await getAIChat();
            if (!ac) return { success: false, error: 'AIChat not available' };

            const session = ac.getSession(id);
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('chat:deleteSession', async (_, { id }: { id: string }) => {
        try {
            const ac = await getAIChat();
            if (!ac) return { success: false, error: 'AIChat not available' };

            const deleted = ac.deleteSession(id);
            return { success: deleted };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('chat:setModel', async (_, { sessionId, model }: any) => {
        try {
            const ac = await getAIChat();
            if (!ac) return { success: false, error: 'AIChat not available' };

            const set = ac.setModel(sessionId, model);
            return { success: set };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Ultimate enhancement IPC handlers registered');
}
