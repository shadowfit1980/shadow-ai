
import { ipcMain } from 'electron';
import { teamInvitationService, TeamRole } from '../collaboration/TeamInvitationService';

// Mock collaboration service for now, focusing on IPC structure
class CollaborationService {
    private members = [
        { id: '1', name: 'Claude', status: 'online', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Claude' },
        { id: '2', name: 'GPT-4', status: 'busy', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GPT4' },
        { id: '3', name: 'User', status: 'online' }
    ];

    private activities = [
        { id: '1', type: 'edit', userName: 'Claude', description: 'Modified src/main/index.ts', timestamp: new Date() },
        { id: '2', type: 'chat', userName: 'GPT-4', description: 'Suggested refactoring', timestamp: new Date(Date.now() - 5000) }
    ];

    async connect(url: string) {
        console.log(`Connecting to collaboration server: ${url}`);
        return true;
    }

    async getMembers() {
        return this.members;
    }

    async getActivities() {
        return this.activities;
    }

    async sendMessage(message: string) {
        console.log(`Sending message: ${message}`);
        this.activities.unshift({
            id: Date.now().toString(),
            type: 'chat',
            userName: 'User',
            description: `Sent message: ${message}`,
            timestamp: new Date()
        });
        return true;
    }
}

const service = new CollaborationService();

export function setupCollaborationHandlers() {
    // Existing handlers
    ipcMain.handle('collaboration:connect', async (_, url: string) => {
        return service.connect(url);
    });

    ipcMain.handle('collaboration:getMembers', async () => {
        return service.getMembers();
    });

    ipcMain.handle('collaboration:getActivities', async () => {
        return service.getActivities();
    });

    ipcMain.handle('collaboration:sendMessage', async (_, message: string) => {
        return service.sendMessage(message);
    });

    // Team Invitation handlers
    ipcMain.handle('collaboration:sendInvitation', async (_, email: string, projectId?: string, role?: TeamRole) => {
        return teamInvitationService.sendInvitation(email, projectId, role);
    });

    ipcMain.handle('collaboration:getInvitations', async (_, projectId?: string) => {
        return teamInvitationService.getInvitations(projectId);
    });

    ipcMain.handle('collaboration:getPendingInvitations', async (_, projectId?: string) => {
        return teamInvitationService.getPendingInvitations(projectId);
    });

    ipcMain.handle('collaboration:acceptInvitation', async (_, token: string, userId: string, userName: string, userEmail: string) => {
        return teamInvitationService.acceptInvitation(token, userId, userName, userEmail);
    });

    ipcMain.handle('collaboration:declineInvitation', async (_, token: string) => {
        return teamInvitationService.declineInvitation(token);
    });

    ipcMain.handle('collaboration:revokeInvitation', async (_, invitationId: string, projectId?: string) => {
        return teamInvitationService.revokeInvitation(invitationId, projectId);
    });

    ipcMain.handle('collaboration:getTeamMembers', async (_, projectId?: string) => {
        return teamInvitationService.getTeamMembers(projectId);
    });

    ipcMain.handle('collaboration:updateMemberRole', async (_, memberId: string, newRole: TeamRole, projectId?: string) => {
        return teamInvitationService.updateMemberRole(memberId, newRole, projectId);
    });

    ipcMain.handle('collaboration:removeMember', async (_, memberId: string, projectId?: string) => {
        return teamInvitationService.removeMember(memberId, projectId);
    });

    ipcMain.handle('collaboration:hasAccess', async (_, userId: string, projectId?: string) => {
        return teamInvitationService.hasAccess(userId, projectId);
    });
}
