/**
 * Security IPC Handlers
 * 
 * Exposes RBAC to renderer
 */

import { ipcMain } from 'electron';
import { RBAC } from '../ai/security';

export function setupSecurityHandlers(): void {
    console.log('🔧 Setting up Security IPC handlers...');

    const rbac = RBAC.getInstance();

    // Get all roles
    ipcMain.handle('rbac:getAllRoles', async () => {
        return rbac.getAllRoles();
    });

    // Get role by ID
    ipcMain.handle('rbac:getRole', async (_, roleId: string) => {
        return rbac.getRole(roleId);
    });

    // Add user
    ipcMain.handle('rbac:addUser', async (_, user: any) => {
        rbac.addUser(user);
        return { success: true };
    });

    // Get user
    ipcMain.handle('rbac:getUser', async (_, userId: string) => {
        return rbac.getUser(userId);
    });

    // Set current user
    ipcMain.handle('rbac:setCurrentUser', async (_, userId: string) => {
        return rbac.setCurrentUser(userId);
    });

    // Get current user
    ipcMain.handle('rbac:getCurrentUser', async () => {
        return rbac.getCurrentUser();
    });

    // Check access
    ipcMain.handle('rbac:checkAccess', async (_, params: any) => {
        return rbac.checkAccess(params);
    });

    // Assign role
    ipcMain.handle('rbac:assignRole', async (_, userId: string, roleId: string) => {
        return rbac.assignRole(userId, roleId);
    });

    // Remove role
    ipcMain.handle('rbac:removeRole', async (_, userId: string, roleId: string) => {
        return rbac.removeRole(userId, roleId);
    });

    // Create API key
    ipcMain.handle('rbac:createApiKey', async (_, userId: string, params: any) => {
        const result = rbac.createApiKey(userId, params);
        if (result) {
            return { success: true, key: result.key, apiKey: { ...result.apiKey, keyHash: '***' } };
        }
        return { success: false };
    });

    // Validate API key
    ipcMain.handle('rbac:validateApiKey', async (_, key: string) => {
        const result = rbac.validateApiKey(key);
        return { valid: result.valid, userId: result.user?.id };
    });

    // Revoke API key
    ipcMain.handle('rbac:revokeApiKey', async (_, userId: string, keyId: string) => {
        return rbac.revokeApiKey(userId, keyId);
    });

    console.log('✅ Security IPC handlers registered');
}
