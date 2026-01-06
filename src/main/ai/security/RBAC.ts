/**
 * Role-Based Access Control (RBAC)
 * 
 * Implements ChatGPT's suggestion for:
 * - Fine-grained permissions for actions (read, propose, execute, deploy)
 * - Role hierarchy (admin, developer, viewer)
 * - Time-limited API keys
 * - Permission inheritance
 */

import { EventEmitter } from 'events';

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    inheritsFrom?: string;
    createdAt: Date;
}

export interface Permission {
    resource: string;
    actions: ('read' | 'write' | 'execute' | 'deploy' | 'admin' | 'approve')[];
    conditions?: PermissionCondition[];
}

export interface PermissionCondition {
    type: 'time' | 'ip' | 'environment' | 'project';
    operator: 'equals' | 'in' | 'not_in' | 'between';
    value: any;
}

export interface User {
    id: string;
    name: string;
    email?: string;
    roles: string[];
    apiKeys: ApiKey[];
    createdAt: Date;
    lastActiveAt?: Date;
}

export interface ApiKey {
    id: string;
    name: string;
    keyHash: string; // Never store plain key
    permissions: Permission[];
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt?: Date;
    revoked: boolean;
}

export interface AccessCheck {
    allowed: boolean;
    reason?: string;
    matchedPermission?: Permission;
    deniedBy?: string;
}

/**
 * RBAC provides role-based access control for agent actions
 */
export class RBAC extends EventEmitter {
    private static instance: RBAC;
    private roles: Map<string, Role> = new Map();
    private users: Map<string, User> = new Map();
    private currentUser: User | null = null;

    private constructor() {
        super();
        this.initializeDefaultRoles();
    }

    static getInstance(): RBAC {
        if (!RBAC.instance) {
            RBAC.instance = new RBAC();
        }
        return RBAC.instance;
    }

    /**
     * Initialize default roles
     */
    private initializeDefaultRoles(): void {
        // Admin role - full access
        this.addRole({
            id: 'admin',
            name: 'Administrator',
            description: 'Full system access',
            permissions: [
                { resource: '*', actions: ['read', 'write', 'execute', 'deploy', 'admin', 'approve'] },
            ],
            createdAt: new Date(),
        });

        // Developer role
        this.addRole({
            id: 'developer',
            name: 'Developer',
            description: 'Development access, no production deploy',
            permissions: [
                { resource: 'code', actions: ['read', 'write', 'execute'] },
                { resource: 'tests', actions: ['read', 'write', 'execute'] },
                { resource: 'agents', actions: ['read', 'execute'] },
                { resource: 'sandbox', actions: ['read', 'write', 'execute'] },
                {
                    resource: 'deploy',
                    actions: ['execute'],
                    conditions: [{ type: 'environment', operator: 'in', value: ['development', 'staging'] }]
                },
            ],
            createdAt: new Date(),
        });

        // Viewer role
        this.addRole({
            id: 'viewer',
            name: 'Viewer',
            description: 'Read-only access',
            permissions: [
                { resource: '*', actions: ['read'] },
            ],
            createdAt: new Date(),
        });

        // Agent role - for autonomous agents
        this.addRole({
            id: 'agent',
            name: 'Agent',
            description: 'Autonomous agent role with limited scope',
            permissions: [
                { resource: 'code', actions: ['read', 'write'] },
                { resource: 'tests', actions: ['read', 'write', 'execute'] },
                { resource: 'sandbox', actions: ['read', 'write', 'execute'] },
                { resource: 'agents', actions: ['read', 'execute'] },
            ],
            inheritsFrom: 'viewer',
            createdAt: new Date(),
        });

        console.log(`🔐 [RBAC] Initialized with ${this.roles.size} default roles`);
    }

    /**
     * Add a new role
     */
    addRole(role: Role): void {
        this.roles.set(role.id, role);
        this.emit('roleAdded', role);
    }

    /**
     * Get a role by ID
     */
    getRole(roleId: string): Role | undefined {
        return this.roles.get(roleId);
    }

    /**
     * Get all roles
     */
    getAllRoles(): Role[] {
        return [...this.roles.values()];
    }

    /**
     * Add a user
     */
    addUser(user: User): void {
        this.users.set(user.id, user);
        this.emit('userAdded', user);
    }

    /**
     * Get a user by ID
     */
    getUser(userId: string): User | undefined {
        return this.users.get(userId);
    }

    /**
     * Set current user context
     */
    setCurrentUser(userId: string): boolean {
        const user = this.users.get(userId);
        if (user) {
            this.currentUser = user;
            user.lastActiveAt = new Date();
            this.emit('userChanged', user);
            return true;
        }
        return false;
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUser;
    }

    /**
     * Check if action is allowed
     */
    checkAccess(params: {
        userId?: string;
        resource: string;
        action: 'read' | 'write' | 'execute' | 'deploy' | 'admin' | 'approve';
        context?: Record<string, any>;
    }): AccessCheck {
        const user = params.userId
            ? this.users.get(params.userId)
            : this.currentUser;

        if (!user) {
            return { allowed: false, reason: 'No user context' };
        }

        // Get all permissions from user's roles
        const allPermissions = this.getEffectivePermissions(user);

        // Check each permission
        for (const perm of allPermissions) {
            // Resource match (wildcard or exact)
            if (perm.resource === '*' || perm.resource === params.resource) {
                // Action match
                if (perm.actions.includes(params.action) || perm.actions.includes('admin')) {
                    // Check conditions
                    if (this.checkConditions(perm.conditions, params.context)) {
                        return {
                            allowed: true,
                            matchedPermission: perm
                        };
                    }
                }
            }
        }

        return {
            allowed: false,
            reason: `No permission for ${params.action} on ${params.resource}`,
            deniedBy: 'policy'
        };
    }

    /**
     * Get effective permissions for a user (including inherited)
     */
    private getEffectivePermissions(user: User): Permission[] {
        const permissions: Permission[] = [];
        const visitedRoles = new Set<string>();

        const collectPermissions = (roleId: string) => {
            if (visitedRoles.has(roleId)) return;
            visitedRoles.add(roleId);

            const role = this.roles.get(roleId);
            if (!role) return;

            permissions.push(...role.permissions);

            // Follow inheritance chain
            if (role.inheritsFrom) {
                collectPermissions(role.inheritsFrom);
            }
        };

        for (const roleId of user.roles) {
            collectPermissions(roleId);
        }

        return permissions;
    }

    /**
     * Check permission conditions
     */
    private checkConditions(
        conditions: PermissionCondition[] | undefined,
        context: Record<string, any> | undefined
    ): boolean {
        if (!conditions || conditions.length === 0) return true;
        if (!context) return false;

        return conditions.every(condition => {
            const value = context[condition.type];

            switch (condition.operator) {
                case 'equals':
                    return value === condition.value;
                case 'in':
                    return Array.isArray(condition.value) && condition.value.includes(value);
                case 'not_in':
                    return Array.isArray(condition.value) && !condition.value.includes(value);
                default:
                    return false;
            }
        });
    }

    /**
     * Create an API key for a user
     */
    createApiKey(userId: string, params: {
        name: string;
        permissions: Permission[];
        expiresInDays?: number;
    }): { key: string; apiKey: ApiKey } | null {
        const user = this.users.get(userId);
        if (!user) return null;

        const rawKey = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const keyHash = this.hashKey(rawKey);

        const apiKey: ApiKey = {
            id: `key-${Date.now()}`,
            name: params.name,
            keyHash,
            permissions: params.permissions,
            expiresAt: new Date(Date.now() + (params.expiresInDays || 30) * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            revoked: false,
        };

        user.apiKeys.push(apiKey);
        this.emit('apiKeyCreated', { userId, apiKey: { ...apiKey, keyHash: '***' } });

        return { key: rawKey, apiKey };
    }

    /**
     * Validate an API key
     */
    validateApiKey(key: string): { valid: boolean; user?: User; permissions?: Permission[] } {
        const keyHash = this.hashKey(key);

        for (const user of this.users.values()) {
            for (const apiKey of user.apiKeys) {
                if (apiKey.keyHash === keyHash) {
                    if (apiKey.revoked) {
                        return { valid: false };
                    }
                    if (new Date() > apiKey.expiresAt) {
                        return { valid: false };
                    }
                    apiKey.lastUsedAt = new Date();
                    return { valid: true, user, permissions: apiKey.permissions };
                }
            }
        }

        return { valid: false };
    }

    /**
     * Revoke an API key
     */
    revokeApiKey(userId: string, keyId: string): boolean {
        const user = this.users.get(userId);
        if (!user) return false;

        const apiKey = user.apiKeys.find(k => k.id === keyId);
        if (apiKey) {
            apiKey.revoked = true;
            this.emit('apiKeyRevoked', { userId, keyId });
            return true;
        }

        return false;
    }

    /**
     * Hash an API key
     */
    private hashKey(key: string): string {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    /**
     * Assign role to user
     */
    assignRole(userId: string, roleId: string): boolean {
        const user = this.users.get(userId);
        const role = this.roles.get(roleId);

        if (!user || !role) return false;

        if (!user.roles.includes(roleId)) {
            user.roles.push(roleId);
            this.emit('roleAssigned', { userId, roleId });
        }

        return true;
    }

    /**
     * Remove role from user
     */
    removeRole(userId: string, roleId: string): boolean {
        const user = this.users.get(userId);
        if (!user) return false;

        const index = user.roles.indexOf(roleId);
        if (index > -1) {
            user.roles.splice(index, 1);
            this.emit('roleRemoved', { userId, roleId });
            return true;
        }

        return false;
    }
}

export default RBAC;
