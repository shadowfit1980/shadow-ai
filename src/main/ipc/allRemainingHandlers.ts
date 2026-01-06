/**
 * Comprehensive IPC Handlers - Extended Features
 * Exposes collaboration, code review, and all remaining features
 */
import { ipcMain } from 'electron';
import { realTimeCollaborationHub } from '../ai/collaboration/RealTimeCollaborationHub';
import { aiCodeReviewer } from '../ai/review/AICodeReviewer';

export function registerAllRemainingHandlers(): void {
    // ============ Real-Time Collaboration Hub ============
    ipcMain.handle('collab:create-session', async (_, config: unknown) => {
        return realTimeCollaborationHub.createSession(config as Parameters<typeof realTimeCollaborationHub.createSession>[0]);
    });

    ipcMain.handle('collab:join-session', async (_, sessionId: string, userId: string, userName: string, asViewer?: boolean) => {
        return realTimeCollaborationHub.joinSession(sessionId, userId, userName, asViewer);
    });

    ipcMain.handle('collab:leave-session', async (_, sessionId: string, userId: string) => {
        return realTimeCollaborationHub.leaveSession(sessionId, userId);
    });

    ipcMain.handle('collab:apply-operation', async (_, sessionId: string, userId: string, operation: unknown) => {
        return realTimeCollaborationHub.applyOperation(sessionId, userId, operation as Parameters<typeof realTimeCollaborationHub.applyOperation>[2]);
    });

    ipcMain.handle('collab:update-cursor', async (_, sessionId: string, userId: string, cursor: unknown) => {
        realTimeCollaborationHub.updateCursor(sessionId, userId, cursor as Parameters<typeof realTimeCollaborationHub.updateCursor>[2]);
        return { success: true };
    });

    ipcMain.handle('collab:send-chat', async (_, sessionId: string, userId: string, userName: string, content: string, type?: string) => {
        return realTimeCollaborationHub.sendChat(sessionId, userId, userName, content, type as Parameters<typeof realTimeCollaborationHub.sendChat>[4]);
    });

    ipcMain.handle('collab:add-reaction', async (_, sessionId: string, messageId: string, userId: string, emoji: string) => {
        return realTimeCollaborationHub.addReaction(sessionId, messageId, userId, emoji);
    });

    ipcMain.handle('collab:create-checkpoint', async (_, sessionId: string, userId: string, description?: string) => {
        return realTimeCollaborationHub.createCheckpoint(sessionId, userId, description);
    });

    ipcMain.handle('collab:restore-checkpoint', async (_, sessionId: string, checkpointId: string) => {
        return realTimeCollaborationHub.restoreCheckpoint(sessionId, checkpointId);
    });

    ipcMain.handle('collab:set-status', async (_, sessionId: string, userId: string, status: string) => {
        return realTimeCollaborationHub.setParticipantStatus(sessionId, userId, status as Parameters<typeof realTimeCollaborationHub.setParticipantStatus>[2]);
    });

    ipcMain.handle('collab:change-role', async (_, sessionId: string, hostId: string, targetUserId: string, role: string) => {
        return realTimeCollaborationHub.changeRole(sessionId, hostId, targetUserId, role as Parameters<typeof realTimeCollaborationHub.changeRole>[3]);
    });

    ipcMain.handle('collab:end-session', async (_, sessionId: string) => {
        return realTimeCollaborationHub.endSession(sessionId);
    });

    ipcMain.handle('collab:get-session', async (_, id: string) => {
        const session = realTimeCollaborationHub.getSession(id);
        if (!session) return null;
        return {
            ...session,
            cursors: Object.fromEntries(session.cursors)
        };
    });

    ipcMain.handle('collab:get-active-sessions', async () => {
        return realTimeCollaborationHub.getActiveSessions().map(s => ({
            ...s,
            cursors: Object.fromEntries(s.cursors)
        }));
    });

    ipcMain.handle('collab:get-user-session', async (_, userId: string) => {
        const session = realTimeCollaborationHub.getUserSession(userId);
        if (!session) return null;
        return {
            ...session,
            cursors: Object.fromEntries(session.cursors)
        };
    });

    ipcMain.handle('collab:get-document', async (_, sessionId: string) => {
        return realTimeCollaborationHub.getDocumentContent(sessionId);
    });

    ipcMain.handle('collab:get-chat', async (_, sessionId: string, limit?: number) => {
        return realTimeCollaborationHub.getChatHistory(sessionId, limit);
    });

    // ============ AI Code Reviewer ============
    ipcMain.handle('review:analyze', async (_, code: string, filePath: string, language?: string) => {
        return aiCodeReviewer.reviewCode(code, filePath, language);
    });

    ipcMain.handle('review:get', async (_, id: string) => {
        return aiCodeReviewer.getReview(id);
    });

    ipcMain.handle('review:get-all', async () => {
        return aiCodeReviewer.getReviews();
    });

    ipcMain.handle('review:set-rules', async (_, rules: unknown) => {
        aiCodeReviewer.setRules(rules as Parameters<typeof aiCodeReviewer.setRules>[0]);
        return { success: true };
    });

    ipcMain.handle('review:get-rules', async () => {
        return aiCodeReviewer.getRules();
    });

    ipcMain.handle('review:clear', async () => {
        aiCodeReviewer.clearReviews();
        return { success: true };
    });
}
