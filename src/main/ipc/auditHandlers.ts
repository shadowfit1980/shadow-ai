/**
 * Audit Log IPC Handlers
 */

import { ipcMain } from 'electron';
import { AuditLog } from '../ai/audit/AuditLog';

export function setupAuditHandlers(): void {
    console.log('🔧 Setting up Audit IPC handlers...');

    const audit = AuditLog.getInstance();

    // Log action
    ipcMain.handle('audit:log', async (_, params: any) => {
        const entry = audit.log(params);
        return entry;
    });

    // Query entries
    ipcMain.handle('audit:query', async (_, filter?: any) => {
        return audit.query(filter);
    });

    // Get recent
    ipcMain.handle('audit:getRecent', async (_, limit?: number) => {
        return audit.getRecent(limit);
    });

    // Get stats
    ipcMain.handle('audit:getStats', async () => {
        return audit.getStats();
    });

    // Clear old entries
    ipcMain.handle('audit:clearOlderThan', async (_, dateString: string) => {
        const date = new Date(dateString);
        return audit.clearOlderThan(date);
    });

    // Export
    ipcMain.handle('audit:export', async (_, filter?: any) => {
        return audit.export(filter);
    });

    console.log('✅ Audit IPC handlers registered');
}
