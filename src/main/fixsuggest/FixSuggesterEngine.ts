/**
 * Fix Suggester - Automated remediation
 */
import { EventEmitter } from 'events';

export interface FixSuggestion { id: string; vulnId: string; type: 'upgrade' | 'patch' | 'config' | 'workaround'; description: string; diff?: string; effort: 'low' | 'medium' | 'high'; breakingChange: boolean; autoFixable: boolean; }

export class FixSuggesterEngine extends EventEmitter {
    private static instance: FixSuggesterEngine;
    private suggestions: Map<string, FixSuggestion[]> = new Map();
    private constructor() { super(); }
    static getInstance(): FixSuggesterEngine { if (!FixSuggesterEngine.instance) FixSuggesterEngine.instance = new FixSuggesterEngine(); return FixSuggesterEngine.instance; }

    async suggest(vulnId: string, packageName: string, currentVersion: string): Promise<FixSuggestion[]> {
        const fixes: FixSuggestion[] = [
            { id: `fix_${Date.now()}`, vulnId, type: 'upgrade', description: `Upgrade ${packageName} from ${currentVersion} to latest`, effort: 'low', breakingChange: false, autoFixable: true },
            { id: `fix_${Date.now() + 1}`, vulnId, type: 'patch', description: `Apply security patch for ${vulnId}`, effort: 'medium', breakingChange: false, autoFixable: false }
        ];
        this.suggestions.set(vulnId, fixes); this.emit('suggested', { vulnId, fixes }); return fixes;
    }

    async applyFix(fixId: string): Promise<boolean> { this.emit('applied', fixId); return true; }
    getForVuln(vulnId: string): FixSuggestion[] { return this.suggestions.get(vulnId) || []; }
    getAutoFixable(): FixSuggestion[] { return Array.from(this.suggestions.values()).flat().filter(f => f.autoFixable); }
}
export function getFixSuggesterEngine(): FixSuggesterEngine { return FixSuggesterEngine.getInstance(); }
