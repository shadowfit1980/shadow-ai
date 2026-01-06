/**
 * Permissions Manager - Role-based permissions
 */
import { EventEmitter } from 'events';

export interface Permission { id: string; name: string; description: string; }
export interface Role { id: string; name: string; permissions: string[]; }

export class PermissionsManager extends EventEmitter {
    private static instance: PermissionsManager;
    private permissions: Map<string, Permission> = new Map();
    private roles: Map<string, Role> = new Map();
    private userRoles: Map<string, string[]> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): PermissionsManager { if (!PermissionsManager.instance) PermissionsManager.instance = new PermissionsManager(); return PermissionsManager.instance; }

    private initDefaults(): void {
        this.addPermission('read', 'Read access');
        this.addPermission('write', 'Write access');
        this.addPermission('delete', 'Delete access');
        this.addPermission('admin', 'Admin access');
        this.addRole('viewer', ['read']);
        this.addRole('editor', ['read', 'write']);
        this.addRole('admin', ['read', 'write', 'delete', 'admin']);
    }

    addPermission(name: string, description = ''): Permission { const p: Permission = { id: `perm_${Date.now()}`, name, description }; this.permissions.set(name, p); return p; }
    addRole(name: string, permissions: string[]): Role { const r: Role = { id: `role_${Date.now()}`, name, permissions }; this.roles.set(name, r); return r; }
    assignRole(userId: string, roleName: string): void { const roles = this.userRoles.get(userId) || []; if (!roles.includes(roleName)) roles.push(roleName); this.userRoles.set(userId, roles); }

    hasPermission(userId: string, permission: string): boolean {
        const roles = this.userRoles.get(userId) || [];
        return roles.some(rn => { const r = this.roles.get(rn); return r && r.permissions.includes(permission); });
    }

    getRoles(): Role[] { return Array.from(this.roles.values()); }
    getPermissions(): Permission[] { return Array.from(this.permissions.values()); }
}

export function getPermissionsManager(): PermissionsManager { return PermissionsManager.getInstance(); }
