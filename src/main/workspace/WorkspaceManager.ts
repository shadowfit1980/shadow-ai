/**
 * Workspace Manager - Multi-workspace support
 */
import { EventEmitter } from 'events';

export interface Workspace { id: string; name: string; paths: string[]; settings: Record<string, any>; createdAt: number; }

export class WorkspaceManager extends EventEmitter {
    private static instance: WorkspaceManager;
    private workspaces: Map<string, Workspace> = new Map();
    private current?: string;
    private constructor() { super(); }
    static getInstance(): WorkspaceManager { if (!WorkspaceManager.instance) WorkspaceManager.instance = new WorkspaceManager(); return WorkspaceManager.instance; }

    create(name: string, paths: string[]): Workspace {
        const ws: Workspace = { id: `ws_${Date.now()}`, name, paths, settings: {}, createdAt: Date.now() };
        this.workspaces.set(ws.id, ws);
        this.emit('created', ws);
        return ws;
    }

    open(id: string): boolean { if (!this.workspaces.has(id)) return false; this.current = id; this.emit('opened', this.workspaces.get(id)); return true; }
    close(): void { this.current = undefined; this.emit('closed'); }
    getCurrent(): Workspace | null { return this.current ? this.workspaces.get(this.current) || null : null; }
    addPath(id: string, path: string): boolean { const ws = this.workspaces.get(id); if (!ws) return false; ws.paths.push(path); return true; }
    getAll(): Workspace[] { return Array.from(this.workspaces.values()); }
    delete(id: string): boolean { return this.workspaces.delete(id); }
}

export function getWorkspaceManager(): WorkspaceManager { return WorkspaceManager.getInstance(); }
