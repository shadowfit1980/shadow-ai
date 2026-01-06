/**
 * Rule Engine - Custom analysis rules
 */
import { EventEmitter } from 'events';

export interface Rule { id: string; name: string; language: string; type: 'bug' | 'vulnerability' | 'code_smell'; severity: 'blocker' | 'critical' | 'major' | 'minor' | 'info'; pattern: string; message: string; enabled: boolean; }

export class RuleEngine extends EventEmitter {
    private static instance: RuleEngine;
    private rules: Map<string, Rule> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): RuleEngine { if (!RuleEngine.instance) RuleEngine.instance = new RuleEngine(); return RuleEngine.instance; }

    private initDefaults(): void {
        const defaults: Rule[] = [
            { id: 'S1068', name: 'Unused private fields', language: 'typescript', type: 'code_smell', severity: 'minor', pattern: 'private\\s+\\w+\\s*:', message: 'Remove unused private field', enabled: true },
            { id: 'S3776', name: 'Cognitive complexity', language: 'typescript', type: 'code_smell', severity: 'major', pattern: '', message: 'Reduce cognitive complexity', enabled: true }
        ];
        defaults.forEach(r => this.rules.set(r.id, r));
    }

    create(name: string, language: string, type: Rule['type'], severity: Rule['severity'], pattern: string, message: string): Rule { const rule: Rule = { id: `rule_${Date.now()}`, name, language, type, severity, pattern, message, enabled: true }; this.rules.set(rule.id, rule); return rule; }
    enable(id: string, enabled: boolean): boolean { const r = this.rules.get(id); if (!r) return false; r.enabled = enabled; return true; }
    getByLanguage(language: string): Rule[] { return Array.from(this.rules.values()).filter(r => r.language === language); }
    getEnabled(): Rule[] { return Array.from(this.rules.values()).filter(r => r.enabled); }
    getAll(): Rule[] { return Array.from(this.rules.values()); }
}
export function getRuleEngine(): RuleEngine { return RuleEngine.getInstance(); }
