/**
 * Cloud IDE Manager - Cloud-based development environment
 */
import { EventEmitter } from 'events';

export interface CloudWorkspace { id: string; name: string; language: string; template: string; url?: string; status: 'creating' | 'running' | 'stopped'; createdAt: number; }

export class CloudIDEManager extends EventEmitter {
    private static instance: CloudIDEManager;
    private workspaces: Map<string, CloudWorkspace> = new Map();
    private constructor() { super(); }
    static getInstance(): CloudIDEManager { if (!CloudIDEManager.instance) CloudIDEManager.instance = new CloudIDEManager(); return CloudIDEManager.instance; }

    create(name: string, language: string, template = 'blank'): CloudWorkspace {
        const ws: CloudWorkspace = { id: `ws_${Date.now()}`, name, language, template, status: 'creating', createdAt: Date.now() };
        this.workspaces.set(ws.id, ws);
        setTimeout(() => { ws.status = 'running'; ws.url = `https://cloud.ide/${ws.id}`; this.emit('ready', ws); }, 500);
        return ws;
    }

    start(id: string): boolean { const ws = this.workspaces.get(id); if (!ws) return false; ws.status = 'running'; this.emit('started', ws); return true; }
    stop(id: string): boolean { const ws = this.workspaces.get(id); if (!ws) return false; ws.status = 'stopped'; this.emit('stopped', ws); return true; }
    fork(id: string, newName: string): CloudWorkspace | null { const ws = this.workspaces.get(id); if (!ws) return null; return this.create(newName, ws.language, ws.template); }
    getRunning(): CloudWorkspace[] { return Array.from(this.workspaces.values()).filter(ws => ws.status === 'running'); }
    getAll(): CloudWorkspace[] { return Array.from(this.workspaces.values()); }
}
export function getCloudIDEManager(): CloudIDEManager { return CloudIDEManager.getInstance(); }
