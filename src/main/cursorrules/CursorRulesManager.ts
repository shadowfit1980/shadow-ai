/**
 * Cursor Rules - .cursorrules support
 */
import { EventEmitter } from 'events';

export interface CursorRule { name: string; content: string; scope: 'project' | 'global'; enabled: boolean; }

export class CursorRulesManager extends EventEmitter {
    private static instance: CursorRulesManager;
    private rules: Map<string, CursorRule> = new Map();
    private constructor() { super(); }
    static getInstance(): CursorRulesManager { if (!CursorRulesManager.instance) CursorRulesManager.instance = new CursorRulesManager(); return CursorRulesManager.instance; }

    add(name: string, content: string, scope: CursorRule['scope'] = 'project'): CursorRule {
        const rule: CursorRule = { name, content, scope, enabled: true };
        this.rules.set(name, rule); this.emit('added', rule); return rule;
    }

    getForContext(): string { return Array.from(this.rules.values()).filter(r => r.enabled).map(r => r.content).join('\n\n'); }
    toggle(name: string, enabled: boolean): boolean { const r = this.rules.get(name); if (!r) return false; r.enabled = enabled; return true; }
    remove(name: string): boolean { return this.rules.delete(name); }
    getAll(): CursorRule[] { return Array.from(this.rules.values()); }
}
export function getCursorRulesManager(): CursorRulesManager { return CursorRulesManager.getInstance(); }
