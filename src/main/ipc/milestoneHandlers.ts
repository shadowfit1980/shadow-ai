/**
 * Milestone 100+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupMilestoneHandlers(): void {
    // ANALYTICS
    ipcMain.handle('analytics:track', async (_, { name, properties }: any) => {
        try { const { getAnalyticsManager } = await import('../analytics/AnalyticsManager'); getAnalyticsManager().track(name, properties); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('analytics:getMetrics', async () => {
        try { const { getAnalyticsManager } = await import('../analytics/AnalyticsManager'); return { success: true, metrics: getAnalyticsManager().getMetrics() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // OAUTH
    ipcMain.handle('oauth:getProviders', async () => {
        try { const { getOAuthManager } = await import('../oauth/OAuthManager'); return { success: true, providers: getOAuthManager().getProviders() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('oauth:getAuthUrl', async (_, { providerId, redirectUri }: any) => {
        try { const { getOAuthManager } = await import('../oauth/OAuthManager'); return { success: true, url: getOAuthManager().getAuthUrl(providerId, redirectUri) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('oauth:isAuthenticated', async (_, { providerId }: any) => {
        try { const { getOAuthManager } = await import('../oauth/OAuthManager'); return { success: true, authenticated: getOAuthManager().isAuthenticated(providerId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // WEBHOOKS
    ipcMain.handle('webhooks:create', async (_, { name, url, events }: any) => {
        try { const { getWebhooksManager } = await import('../webhooks/WebhooksManager'); return { success: true, webhook: getWebhooksManager().create(name, url, events) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('webhooks:getAll', async () => {
        try { const { getWebhooksManager } = await import('../webhooks/WebhooksManager'); return { success: true, webhooks: getWebhooksManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COMMENTS
    ipcMain.handle('comments:add', async (_, { file, line, text, author }: any) => {
        try { const { getCommentsManager } = await import('../comments/CommentsManager'); return { success: true, comment: getCommentsManager().add(file, line, text, author) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('comments:getByFile', async (_, { file }: any) => {
        try { const { getCommentsManager } = await import('../comments/CommentsManager'); return { success: true, comments: getCommentsManager().getByFile(file) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('comments:resolve', async (_, { id }: any) => {
        try { const { getCommentsManager } = await import('../comments/CommentsManager'); return { success: getCommentsManager().resolve(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LABELS
    ipcMain.handle('labels:create', async (_, { name, color, description }: any) => {
        try { const { getLabelsManager } = await import('../labels/LabelsManager'); return { success: true, label: getLabelsManager().create(name, color, description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('labels:getAll', async () => {
        try { const { getLabelsManager } = await import('../labels/LabelsManager'); return { success: true, labels: getLabelsManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('labels:assign', async (_, { itemId, labelId }: any) => {
        try { const { getLabelsManager } = await import('../labels/LabelsManager'); getLabelsManager().assign(itemId, labelId); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Milestone 100+ IPC handlers registered (13 handlers)');
}
