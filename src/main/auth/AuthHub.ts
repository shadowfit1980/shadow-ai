/**
 * Auth Hub (JetBrains Hub equivalent)
 * SSO, team management, and license control
 */

import { EventEmitter } from 'events';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'developer' | 'viewer';
    teams: string[];
    createdAt: number;
    lastLogin?: number;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    members: string[];
    admins: string[];
    createdAt: number;
}

export interface License {
    id: string;
    product: string;
    type: 'individual' | 'team' | 'enterprise';
    seats: number;
    usedSeats: number;
    validFrom: number;
    validUntil: number;
    active: boolean;
}

export interface SSOProvider {
    id: string;
    name: string;
    type: 'oauth' | 'saml' | 'oidc';
    clientId: string;
    issuer?: string;
    enabled: boolean;
}

/**
 * AuthHub
 * Central authentication and team management
 */
export class AuthHub extends EventEmitter {
    private static instance: AuthHub;
    private users: Map<string, User> = new Map();
    private teams: Map<string, Team> = new Map();
    private licenses: Map<string, License> = new Map();
    private ssoProviders: Map<string, SSOProvider> = new Map();
    private currentUser: User | null = null;
    private sessions: Map<string, { userId: string; expires: number }> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): AuthHub {
        if (!AuthHub.instance) {
            AuthHub.instance = new AuthHub();
        }
        return AuthHub.instance;
    }

    // === USER MANAGEMENT ===

    /**
     * Create a new user
     */
    createUser(email: string, name: string, role: User['role'] = 'developer'): User {
        const id = `user_${Date.now()}`;

        const user: User = {
            id,
            email,
            name,
            role,
            teams: [],
            createdAt: Date.now(),
        };

        this.users.set(id, user);
        this.emit('userCreated', user);
        return user;
    }

    /**
     * Get user by ID
     */
    getUser(userId: string): User | null {
        return this.users.get(userId) || null;
    }

    /**
     * Get user by email
     */
    getUserByEmail(email: string): User | null {
        for (const user of this.users.values()) {
            if (user.email === email) return user;
        }
        return null;
    }

    /**
     * Update user
     */
    updateUser(userId: string, updates: Partial<User>): User | null {
        const user = this.users.get(userId);
        if (!user) return null;

        Object.assign(user, updates);
        this.emit('userUpdated', user);
        return user;
    }

    /**
     * Delete user
     */
    deleteUser(userId: string): boolean {
        const deleted = this.users.delete(userId);
        if (deleted) {
            this.emit('userDeleted', { userId });
        }
        return deleted;
    }

    /**
     * Get all users
     */
    getAllUsers(): User[] {
        return Array.from(this.users.values());
    }

    // === TEAM MANAGEMENT ===

    /**
     * Create a team
     */
    createTeam(name: string, adminId: string): Team {
        const id = `team_${Date.now()}`;

        const team: Team = {
            id,
            name,
            members: [adminId],
            admins: [adminId],
            createdAt: Date.now(),
        };

        this.teams.set(id, team);

        // Add team to user
        const user = this.users.get(adminId);
        if (user) {
            user.teams.push(id);
        }

        this.emit('teamCreated', team);
        return team;
    }

    /**
     * Get team by ID
     */
    getTeam(teamId: string): Team | null {
        return this.teams.get(teamId) || null;
    }

    /**
     * Add member to team
     */
    addTeamMember(teamId: string, userId: string): boolean {
        const team = this.teams.get(teamId);
        const user = this.users.get(userId);

        if (!team || !user) return false;

        if (!team.members.includes(userId)) {
            team.members.push(userId);
            user.teams.push(teamId);
            this.emit('memberAdded', { teamId, userId });
        }

        return true;
    }

    /**
     * Remove member from team
     */
    removeTeamMember(teamId: string, userId: string): boolean {
        const team = this.teams.get(teamId);
        const user = this.users.get(userId);

        if (!team || !user) return false;

        team.members = team.members.filter(m => m !== userId);
        team.admins = team.admins.filter(a => a !== userId);
        user.teams = user.teams.filter(t => t !== teamId);

        this.emit('memberRemoved', { teamId, userId });
        return true;
    }

    /**
     * Get all teams
     */
    getAllTeams(): Team[] {
        return Array.from(this.teams.values());
    }

    // === LICENSE MANAGEMENT ===

    /**
     * Add license
     */
    addLicense(license: Omit<License, 'id'>): License {
        const id = `license_${Date.now()}`;
        const fullLicense: License = { ...license, id };

        this.licenses.set(id, fullLicense);
        this.emit('licenseAdded', fullLicense);
        return fullLicense;
    }

    /**
     * Get license
     */
    getLicense(licenseId: string): License | null {
        return this.licenses.get(licenseId) || null;
    }

    /**
     * Check license validity
     */
    isLicenseValid(licenseId: string): boolean {
        const license = this.licenses.get(licenseId);
        if (!license) return false;

        const now = Date.now();
        return license.active &&
            now >= license.validFrom &&
            now <= license.validUntil &&
            license.usedSeats < license.seats;
    }

    /**
     * Get all licenses
     */
    getAllLicenses(): License[] {
        return Array.from(this.licenses.values());
    }

    // === SSO MANAGEMENT ===

    /**
     * Configure SSO provider
     */
    configureSSOProvider(provider: Omit<SSOProvider, 'id'>): SSOProvider {
        const id = `sso_${Date.now()}`;
        const fullProvider: SSOProvider = { ...provider, id };

        this.ssoProviders.set(id, fullProvider);
        this.emit('ssoConfigured', fullProvider);
        return fullProvider;
    }

    /**
     * Get SSO providers
     */
    getSSOProviders(): SSOProvider[] {
        return Array.from(this.ssoProviders.values());
    }

    /**
     * Initiate SSO login
     */
    initiateSSOLogin(providerId: string): string {
        const provider = this.ssoProviders.get(providerId);
        if (!provider || !provider.enabled) {
            throw new Error('SSO provider not available');
        }

        // Generate auth URL (simulated)
        const state = Math.random().toString(36).substring(7);
        const authUrl = `https://auth.example.com/authorize?client_id=${provider.clientId}&state=${state}`;

        return authUrl;
    }

    // === SESSION MANAGEMENT ===

    /**
     * Create session
     */
    createSession(userId: string, ttlMs = 86400000): string {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        this.sessions.set(sessionId, {
            userId,
            expires: Date.now() + ttlMs,
        });

        const user = this.users.get(userId);
        if (user) {
            user.lastLogin = Date.now();
            this.currentUser = user;
        }

        this.emit('sessionCreated', { sessionId, userId });
        return sessionId;
    }

    /**
     * Validate session
     */
    validateSession(sessionId: string): User | null {
        const session = this.sessions.get(sessionId);
        if (!session || session.expires < Date.now()) {
            this.sessions.delete(sessionId);
            return null;
        }

        return this.users.get(session.userId) || null;
    }

    /**
     * End session
     */
    endSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        this.currentUser = null;
        this.emit('sessionEnded', { sessionId });
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Check permission
     */
    hasPermission(userId: string, permission: string): boolean {
        const user = this.users.get(userId);
        if (!user) return false;

        // Admin has all permissions
        if (user.role === 'admin') return true;

        // Role-based permissions
        const rolePermissions: Record<string, string[]> = {
            developer: ['read', 'write', 'execute'],
            viewer: ['read'],
        };

        return rolePermissions[user.role]?.includes(permission) ?? false;
    }
}

// Singleton getter
export function getAuthHub(): AuthHub {
    return AuthHub.getInstance();
}
