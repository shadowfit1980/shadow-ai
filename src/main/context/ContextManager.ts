/**
 * Context Manager - Project context
 */
import { EventEmitter } from 'events';

export interface Context { id: string; name: string; files: string[]; description: string; active: boolean; }

export class ContextManager extends EventEmitter {
    private static instance: ContextManager;
    private contexts: Map<string, Context> = new Map();
    private activeId?: string;
    private constructor() { super(); }
    static getInstance(): ContextManager { if (!ContextManager.instance) ContextManager.instance = new ContextManager(); return ContextManager.instance; }

    create(name: string, files: string[], description = ''): Context {
        const ctx: Context = { id: `ctx_${Date.now()}`, name, files, description, active: false };
        this.contexts.set(ctx.id, ctx);
        return ctx;
    }

    activate(id: string): boolean { const ctx = this.contexts.get(id); if (!ctx) return false; this.contexts.forEach(c => c.active = false); ctx.active = true; this.activeId = id; this.emit('activated', ctx); return true; }
    getActive(): Context | null { return this.activeId ? this.contexts.get(this.activeId) || null : null; }
    addFile(id: string, file: string): boolean { const ctx = this.contexts.get(id); if (!ctx) return false; ctx.files.push(file); return true; }
    getAll(): Context[] { return Array.from(this.contexts.values()); }
}
export function getContextManager(): ContextManager { return ContextManager.getInstance(); }
