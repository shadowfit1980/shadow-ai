/**
 * Cognigy Feature IPC Handlers
 * IPC bridge for Analytics, PII Guardrails, and Contact Profiles
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let analyticsCollector: any = null;
let piiGuardrails: any = null;
let contactProfiles: any = null;

async function getAnalyticsCollector() {
    if (!analyticsCollector) {
        try {
            const { getAnalyticsCollector: getCollector } = await import('../analytics/AnalyticsCollector');
            analyticsCollector = getCollector();
        } catch (error) {
            console.warn('⚠️ AnalyticsCollector not available:', (error as Error).message);
            return null;
        }
    }
    return analyticsCollector;
}

async function getPIIGuardrails() {
    if (!piiGuardrails) {
        try {
            const { getPIIGuardrails: getGuardrails } = await import('../security/PIIGuardrails');
            piiGuardrails = getGuardrails();
        } catch (error) {
            console.warn('⚠️ PIIGuardrails not available:', (error as Error).message);
            return null;
        }
    }
    return piiGuardrails;
}

async function getContactProfiles() {
    if (!contactProfiles) {
        try {
            const { getContactProfileManager } = await import('../database/ContactProfiles');
            contactProfiles = getContactProfileManager();
        } catch (error) {
            console.warn('⚠️ ContactProfiles not available:', (error as Error).message);
            return null;
        }
    }
    return contactProfiles;
}

/**
 * Setup Cognigy feature IPC handlers
 */
export function setupCognigyHandlers(): void {
    // === ANALYTICS HANDLERS ===

    ipcMain.handle('analytics:startConversation', async (_, { conversationId }: any = {}) => {
        try {
            const collector = await getAnalyticsCollector();
            if (!collector) return { success: false, error: 'Analytics not available' };

            const id = collector.startConversation(conversationId);
            return { success: true, conversationId: id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('analytics:endConversation', async (_, { conversationId, resolved }: any) => {
        try {
            const collector = await getAnalyticsCollector();
            if (!collector) return { success: false, error: 'Analytics not available' };

            const metrics = collector.endConversation(conversationId, resolved);
            return { success: true, metrics };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('analytics:trackToolCall', async (_, { conversationId, toolName, success, latency }: any) => {
        try {
            const collector = await getAnalyticsCollector();
            if (!collector) return { success: false, error: 'Analytics not available' };

            collector.trackToolCall(conversationId, toolName, success, latency);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('analytics:getPerformance', async (_, { period }: any = {}) => {
        try {
            const collector = await getAnalyticsCollector();
            if (!collector) return { success: false, error: 'Analytics not available' };

            const performance = collector.getPerformance(period);
            return { success: true, performance };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('analytics:getDashboard', async () => {
        try {
            const collector = await getAnalyticsCollector();
            if (!collector) return { success: false, error: 'Analytics not available' };

            const dashboard = collector.getDashboardSummary();
            return { success: true, dashboard };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('analytics:export', async () => {
        try {
            const collector = await getAnalyticsCollector();
            if (!collector) return { success: false, error: 'Analytics not available' };

            const data = collector.exportMetrics();
            return { success: true, data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === PII GUARDRAILS HANDLERS ===

    ipcMain.handle('pii:mask', async (_, { text }: { text: string }) => {
        try {
            const guardrails = await getPIIGuardrails();
            if (!guardrails) return { success: false, error: 'PII guardrails not available' };

            const result = guardrails.mask(text);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pii:detect', async (_, { text }: { text: string }) => {
        try {
            const guardrails = await getPIIGuardrails();
            if (!guardrails) return { success: false, error: 'PII guardrails not available' };

            const entities = guardrails.detect(text);
            return { success: true, entities };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pii:validateSafe', async (_, { text }: { text: string }) => {
        try {
            const guardrails = await getPIIGuardrails();
            if (!guardrails) return { success: false, error: 'PII guardrails not available' };

            const result = guardrails.validateSafe(text);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pii:detectJailbreak', async (_, { prompt }: { prompt: string }) => {
        try {
            const guardrails = await getPIIGuardrails();
            if (!guardrails) return { success: false, error: 'PII guardrails not available' };

            const result = guardrails.detectJailbreak(prompt);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('pii:configure', async (_, config: any) => {
        try {
            const guardrails = await getPIIGuardrails();
            if (!guardrails) return { success: false, error: 'PII guardrails not available' };

            guardrails.configure(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CONTACT PROFILES HANDLERS ===

    ipcMain.handle('contacts:create', async (_, data: any) => {
        try {
            const manager = await getContactProfiles();
            if (!manager) return { success: false, error: 'Contact profiles not available' };

            const profile = await manager.createProfile(data);
            return { success: true, profile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('contacts:get', async (_, { id }: { id: string }) => {
        try {
            const manager = await getContactProfiles();
            if (!manager) return { success: false, error: 'Contact profiles not available' };

            const profile = manager.getProfile(id);
            return { success: true, profile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('contacts:getOrCreate', async (_, { identifier, defaults }: any) => {
        try {
            const manager = await getContactProfiles();
            if (!manager) return { success: false, error: 'Contact profiles not available' };

            const profile = await manager.getOrCreate(identifier, defaults);
            return { success: true, profile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('contacts:update', async (_, { id, updates }: any) => {
        try {
            const manager = await getContactProfiles();
            if (!manager) return { success: false, error: 'Contact profiles not available' };

            const profile = await manager.updateProfile(id, updates);
            return { success: true, profile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('contacts:search', async (_, options: any = {}) => {
        try {
            const manager = await getContactProfiles();
            if (!manager) return { success: false, error: 'Contact profiles not available' };

            const profiles = manager.search(options);
            return { success: true, profiles };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('contacts:delete', async (_, { id }: { id: string }) => {
        try {
            const manager = await getContactProfiles();
            if (!manager) return { success: false, error: 'Contact profiles not available' };

            const deleted = await manager.deleteProfile(id);
            return { success: true, deleted };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('contacts:addConversation', async (_, { id, summary }: any) => {
        try {
            const manager = await getContactProfiles();
            if (!manager) return { success: false, error: 'Contact profiles not available' };

            const added = await manager.addConversation(id, summary);
            return { success: true, added };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Cognigy IPC handlers registered');
}
