/**
 * OAuth Manager - OAuth authentication
 */
import { EventEmitter } from 'events';

export interface OAuthProvider { id: string; name: string; clientId: string; authUrl: string; tokenUrl: string; scopes: string[]; }
export interface OAuthToken { accessToken: string; refreshToken?: string; expiresAt: number; provider: string; }

export class OAuthManager extends EventEmitter {
    private static instance: OAuthManager;
    private providers: Map<string, OAuthProvider> = new Map();
    private tokens: Map<string, OAuthToken> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): OAuthManager { if (!OAuthManager.instance) OAuthManager.instance = new OAuthManager(); return OAuthManager.instance; }

    private initDefaults(): void {
        this.registerProvider({ id: 'github', name: 'GitHub', clientId: '', authUrl: 'https://github.com/login/oauth/authorize', tokenUrl: 'https://github.com/login/oauth/access_token', scopes: ['repo', 'user'] });
        this.registerProvider({ id: 'google', name: 'Google', clientId: '', authUrl: 'https://accounts.google.com/o/oauth2/v2/auth', tokenUrl: 'https://oauth2.googleapis.com/token', scopes: ['email', 'profile'] });
    }

    registerProvider(provider: OAuthProvider): void { this.providers.set(provider.id, provider); }
    getProvider(id: string): OAuthProvider | null { return this.providers.get(id) || null; }
    getProviders(): OAuthProvider[] { return Array.from(this.providers.values()); }

    getAuthUrl(providerId: string, redirectUri: string): string | null {
        const p = this.providers.get(providerId);
        if (!p) return null;
        return `${p.authUrl}?client_id=${p.clientId}&redirect_uri=${redirectUri}&scope=${p.scopes.join(' ')}&response_type=code`;
    }

    setToken(providerId: string, token: OAuthToken): void { this.tokens.set(providerId, token); this.emit('tokenSet', providerId); }
    getToken(providerId: string): OAuthToken | null { return this.tokens.get(providerId) || null; }
    isAuthenticated(providerId: string): boolean { const t = this.tokens.get(providerId); return !!t && t.expiresAt > Date.now(); }
}

export function getOAuthManager(): OAuthManager { return OAuthManager.getInstance(); }
