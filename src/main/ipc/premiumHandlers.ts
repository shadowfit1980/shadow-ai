/**
 * Premium Feature IPC Handlers
 * IPC bridge for CodeReviewAI and NotificationCenter
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let codeReviewAI: any = null;
let notificationCenter: any = null;

async function getCodeReviewAI() {
    if (!codeReviewAI) {
        try {
            const { getCodeReviewAI: getCR } = await import('../review/CodeReviewAI');
            codeReviewAI = getCR();
        } catch (error) {
            console.warn('⚠️ CodeReviewAI not available:', (error as Error).message);
            return null;
        }
    }
    return codeReviewAI;
}

async function getNotificationCenter() {
    if (!notificationCenter) {
        try {
            const { getNotificationCenter: getNC } = await import('../notifications/NotificationCenter');
            notificationCenter = getNC();
        } catch (error) {
            console.warn('⚠️ NotificationCenter not available:', (error as Error).message);
            return null;
        }
    }
    return notificationCenter;
}

/**
 * Setup premium feature handlers
 */
export function setupPremiumHandlers(): void {
    // === CODE REVIEW AI ===

    ipcMain.handle('review:file', async (_, { filePath }: { filePath: string }) => {
        try {
            const cr = await getCodeReviewAI();
            if (!cr) return { success: false, error: 'Code review not available' };

            const result = await cr.reviewFile(filePath);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('review:files', async (_, { filePaths }: { filePaths: string[] }) => {
        try {
            const cr = await getCodeReviewAI();
            if (!cr) return { success: false, error: 'Code review not available' };

            const results = await cr.reviewFiles(filePaths);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('review:getAll', async () => {
        try {
            const cr = await getCodeReviewAI();
            if (!cr) return { success: false, error: 'Code review not available' };

            const reviews = cr.getAllReviews();
            return { success: true, reviews };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('review:applyFixes', async (_, { reviewId }: { reviewId: string }) => {
        try {
            const cr = await getCodeReviewAI();
            if (!cr) return { success: false, error: 'Code review not available' };

            const fixCount = await cr.applyFixes(reviewId);
            return { success: true, fixCount };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === NOTIFICATION CENTER ===

    ipcMain.handle('notify:show', async (_, options: any) => {
        try {
            const nc = await getNotificationCenter();
            if (!nc) return { success: false, error: 'Notification center not available' };

            const notification = nc.notify(options);
            return { success: true, notification };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notify:success', async (_, { title, message }: any) => {
        try {
            const nc = await getNotificationCenter();
            if (!nc) return { success: false, error: 'Notification center not available' };

            const notification = nc.success(title, message);
            return { success: true, notification };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notify:error', async (_, { title, message }: any) => {
        try {
            const nc = await getNotificationCenter();
            if (!nc) return { success: false, error: 'Notification center not available' };

            const notification = nc.error(title, message);
            return { success: true, notification };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notify:getAll', async () => {
        try {
            const nc = await getNotificationCenter();
            if (!nc) return { success: false, error: 'Notification center not available' };

            const notifications = nc.getAll();
            const unreadCount = nc.getUnreadCount();
            return { success: true, notifications, unreadCount };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notify:markAsRead', async (_, { id }: { id: string }) => {
        try {
            const nc = await getNotificationCenter();
            if (!nc) return { success: false, error: 'Notification center not available' };

            nc.markAsRead(id);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notify:dismiss', async (_, { id }: { id: string }) => {
        try {
            const nc = await getNotificationCenter();
            if (!nc) return { success: false, error: 'Notification center not available' };

            nc.dismiss(id);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notify:preferences', async (_, prefs?: any) => {
        try {
            const nc = await getNotificationCenter();
            if (!nc) return { success: false, error: 'Notification center not available' };

            if (prefs) {
                nc.setPreferences(prefs);
            }

            return { success: true, preferences: nc.getPreferences() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Premium feature IPC handlers registered');
}
