/**
 * Team Invitation Service
 * Manages team invitations, members, and project access
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type TeamRole = 'owner' | 'editor' | 'viewer';

export interface TeamInvitation {
    id: string;
    email: string;
    projectId: string;
    role: TeamRole;
    status: InvitationStatus;
    token: string;
    invitedBy: string;
    invitedAt: number;
    expiresAt: number;
}

export interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: TeamRole;
    avatar?: string;
    status: 'online' | 'offline' | 'busy';
    joinedAt: number;
}

export interface ProjectTeam {
    projectId: string;
    members: TeamMember[];
    invitations: TeamInvitation[];
}

export class TeamInvitationService extends EventEmitter {
    private static instance: TeamInvitationService;
    private teams: Map<string, ProjectTeam> = new Map();
    private currentUserId: string = 'current-user';
    private currentUserEmail: string = 'you@example.com';
    private currentUserName: string = 'You';

    static getInstance(): TeamInvitationService {
        if (!TeamInvitationService.instance) {
            TeamInvitationService.instance = new TeamInvitationService();
        }
        return TeamInvitationService.instance;
    }

    constructor() {
        super();
        // Initialize with a default project team
        this.initializeDefaultTeam();
    }

    private initializeDefaultTeam(): void {
        const defaultProjectId = 'current-project';
        this.teams.set(defaultProjectId, {
            projectId: defaultProjectId,
            members: [
                {
                    id: this.currentUserId,
                    email: this.currentUserEmail,
                    name: this.currentUserName,
                    role: 'owner',
                    status: 'online',
                    joinedAt: Date.now()
                }
            ],
            invitations: []
        });
    }

    /**
     * Generate a unique invitation token
     */
    private generateToken(): string {
        // In production, use a secure token generator
        return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Get or create team for a project
     */
    private getOrCreateTeam(projectId: string): ProjectTeam {
        if (!this.teams.has(projectId)) {
            this.teams.set(projectId, {
                projectId,
                members: [],
                invitations: []
            });
        }
        return this.teams.get(projectId)!;
    }

    /**
     * Send an invitation to a team member
     */
    async sendInvitation(
        email: string,
        projectId: string = 'current-project',
        role: TeamRole = 'editor'
    ): Promise<{ success: boolean; invitation?: TeamInvitation; error?: string }> {
        if (!email || !email.includes('@')) {
            return { success: false, error: 'Invalid email address' };
        }

        const team = this.getOrCreateTeam(projectId);

        // Check if already a member
        const existingMember = team.members.find(m => m.email.toLowerCase() === email.toLowerCase());
        if (existingMember) {
            return { success: false, error: 'User is already a team member' };
        }

        // Check if already invited
        const existingInvitation = team.invitations.find(
            i => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending'
        );
        if (existingInvitation) {
            return { success: false, error: 'Invitation already sent to this email' };
        }

        const invitation: TeamInvitation = {
            id: uuidv4 ? uuidv4() : `invite_${Date.now()}`,
            email: email.toLowerCase(),
            projectId,
            role,
            status: 'pending',
            token: this.generateToken(),
            invitedBy: this.currentUserId,
            invitedAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        team.invitations.push(invitation);
        this.emit('invitation-sent', invitation);

        // In production, send actual email via SMTP or email service
        console.log(`📧 Invitation sent to ${email} for project ${projectId}`);
        console.log(`   Invitation link: shadow-ai://invite/${invitation.token}`);

        return { success: true, invitation };
    }

    /**
     * Get all invitations for a project
     */
    async getInvitations(projectId: string = 'current-project'): Promise<TeamInvitation[]> {
        const team = this.getOrCreateTeam(projectId);
        return team.invitations;
    }

    /**
     * Get pending invitations for a project
     */
    async getPendingInvitations(projectId: string = 'current-project'): Promise<TeamInvitation[]> {
        const team = this.getOrCreateTeam(projectId);
        return team.invitations.filter(i => i.status === 'pending' && i.expiresAt > Date.now());
    }

    /**
     * Accept an invitation using the token
     */
    async acceptInvitation(
        token: string,
        userId: string,
        userName: string,
        userEmail: string
    ): Promise<{ success: boolean; member?: TeamMember; error?: string }> {
        // Find invitation by token across all projects
        for (const team of this.teams.values()) {
            const invitation = team.invitations.find(i => i.token === token);

            if (invitation) {
                if (invitation.status !== 'pending') {
                    return { success: false, error: 'Invitation is no longer valid' };
                }

                if (invitation.expiresAt < Date.now()) {
                    invitation.status = 'expired';
                    return { success: false, error: 'Invitation has expired' };
                }

                // Accept the invitation
                invitation.status = 'accepted';

                // Add as team member
                const newMember: TeamMember = {
                    id: userId,
                    email: userEmail.toLowerCase(),
                    name: userName,
                    role: invitation.role,
                    status: 'online',
                    joinedAt: Date.now()
                };

                team.members.push(newMember);
                this.emit('member-joined', { projectId: team.projectId, member: newMember });

                console.log(`✅ ${userName} joined the team as ${invitation.role}`);

                return { success: true, member: newMember };
            }
        }

        return { success: false, error: 'Invalid invitation token' };
    }

    /**
     * Decline an invitation
     */
    async declineInvitation(token: string): Promise<{ success: boolean }> {
        for (const team of this.teams.values()) {
            const invitation = team.invitations.find(i => i.token === token);
            if (invitation && invitation.status === 'pending') {
                invitation.status = 'declined';
                this.emit('invitation-declined', invitation);
                return { success: true };
            }
        }
        return { success: false };
    }

    /**
     * Revoke/cancel an invitation
     */
    async revokeInvitation(invitationId: string, projectId: string = 'current-project'): Promise<{ success: boolean }> {
        const team = this.getOrCreateTeam(projectId);
        const index = team.invitations.findIndex(i => i.id === invitationId);

        if (index !== -1) {
            const [removed] = team.invitations.splice(index, 1);
            this.emit('invitation-revoked', removed);
            return { success: true };
        }

        return { success: false };
    }

    /**
     * Get team members for a project
     */
    async getTeamMembers(projectId: string = 'current-project'): Promise<TeamMember[]> {
        const team = this.getOrCreateTeam(projectId);
        return team.members;
    }

    /**
     * Update member role
     */
    async updateMemberRole(
        memberId: string,
        newRole: TeamRole,
        projectId: string = 'current-project'
    ): Promise<{ success: boolean }> {
        const team = this.getOrCreateTeam(projectId);
        const member = team.members.find(m => m.id === memberId);

        if (member) {
            member.role = newRole;
            this.emit('member-role-updated', { projectId, member });
            return { success: true };
        }

        return { success: false };
    }

    /**
     * Remove a team member
     */
    async removeMember(memberId: string, projectId: string = 'current-project'): Promise<{ success: boolean }> {
        const team = this.getOrCreateTeam(projectId);
        const index = team.members.findIndex(m => m.id === memberId);

        if (index !== -1 && team.members[index].role !== 'owner') {
            const [removed] = team.members.splice(index, 1);
            this.emit('member-removed', { projectId, member: removed });
            return { success: true };
        }

        return { success: false };
    }

    /**
     * Check if a user has access to a project
     */
    async hasAccess(userId: string, projectId: string = 'current-project'): Promise<boolean> {
        const team = this.getOrCreateTeam(projectId);
        return team.members.some(m => m.id === userId);
    }

    /**
     * Get user's role in a project
     */
    async getUserRole(userId: string, projectId: string = 'current-project'): Promise<TeamRole | null> {
        const team = this.getOrCreateTeam(projectId);
        const member = team.members.find(m => m.id === userId);
        return member?.role || null;
    }
}

export const teamInvitationService = TeamInvitationService.getInstance();
