/**
 * Language Server Protocol Manager
 */
import { EventEmitter } from 'events';

export interface LanguageServer { id: string; language: string; name: string; status: 'stopped' | 'starting' | 'running'; capabilities: string[]; }

export class LanguageServerManager extends EventEmitter {
    private static instance: LanguageServerManager;
    private servers: Map<string, LanguageServer> = new Map();
    private constructor() { super(); }
    static getInstance(): LanguageServerManager { if (!LanguageServerManager.instance) LanguageServerManager.instance = new LanguageServerManager(); return LanguageServerManager.instance; }

    register(language: string, name: string, capabilities: string[]): LanguageServer {
        const server: LanguageServer = { id: `lsp_${language}`, language, name, status: 'stopped', capabilities };
        this.servers.set(server.id, server);
        return server;
    }

    async start(id: string): Promise<boolean> { const s = this.servers.get(id); if (!s) return false; s.status = 'starting'; setTimeout(() => { s.status = 'running'; this.emit('started', s); }, 100); return true; }
    stop(id: string): boolean { const s = this.servers.get(id); if (!s) return false; s.status = 'stopped'; this.emit('stopped', s); return true; }
    getByLanguage(language: string): LanguageServer | null { return Array.from(this.servers.values()).find(s => s.language === language) || null; }
    getRunning(): LanguageServer[] { return Array.from(this.servers.values()).filter(s => s.status === 'running'); }
    getAll(): LanguageServer[] { return Array.from(this.servers.values()); }
}
export function getLanguageServerManager(): LanguageServerManager { return LanguageServerManager.getInstance(); }
