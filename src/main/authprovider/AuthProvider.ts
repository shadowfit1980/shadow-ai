/**
 * Auth Provider - Authentication service
 */
import { EventEmitter } from 'events';

export interface AuthUser { id: string; email: string; provider: 'email' | 'github' | 'google'; roles: string[]; createdAt: number; }

export class AuthProvider extends EventEmitter {
    private static instance: AuthProvider;
    private users: Map<string, AuthUser> = new Map();
    private sessions: Map<string, string> = new Map();
    private constructor() { super(); }
    static getInstance(): AuthProvider { if (!AuthProvider.instance) AuthProvider.instance = new AuthProvider(); return AuthProvider.instance; }

    async register(email: string, provider: AuthUser['provider'] = 'email'): Promise<AuthUser> {
        const user: AuthUser = { id: `user_${Date.now()}`, email, provider, roles: ['user'], createdAt: Date.now() };
        this.users.set(user.id, user);
        this.emit('registered', user);
        return user;
    }

    async login(email: string): Promise<{ user: AuthUser; token: string } | null> {
        const user = Array.from(this.users.values()).find(u => u.email === email);
        if (!user) return null;
        const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        this.sessions.set(token, user.id);
        this.emit('login', user);
        return { user, token };
    }

    async validateToken(token: string): Promise<AuthUser | null> { const userId = this.sessions.get(token); return userId ? this.users.get(userId) || null : null; }
    logout(token: string): boolean { return this.sessions.delete(token); }
    getAll(): AuthUser[] { return Array.from(this.users.values()); }
}
export function getAuthProvider(): AuthProvider { return AuthProvider.getInstance(); }
