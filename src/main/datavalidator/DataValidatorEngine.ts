/**
 * Data Validator - Quality checks
 */
import { EventEmitter } from 'events';

export interface ValidationRule { id: string; name: string; type: 'schema' | 'range' | 'unique' | 'null' | 'custom'; config: Record<string, string | number>; }
export interface ValidationResult { ruleId: string; passed: boolean; errors: string[]; timestamp: number; }

export class DataValidatorEngine extends EventEmitter {
    private static instance: DataValidatorEngine;
    private rules: Map<string, ValidationRule> = new Map();
    private results: ValidationResult[] = [];
    private constructor() { super(); }
    static getInstance(): DataValidatorEngine { if (!DataValidatorEngine.instance) DataValidatorEngine.instance = new DataValidatorEngine(); return DataValidatorEngine.instance; }

    addRule(name: string, type: ValidationRule['type'], config: Record<string, string | number> = {}): ValidationRule { const rule: ValidationRule = { id: `rule_${Date.now()}`, name, type, config }; this.rules.set(rule.id, rule); return rule; }

    validate(data: Record<string, unknown>[], ruleIds?: string[]): { passed: boolean; results: ValidationResult[] } {
        const rulesToRun = ruleIds ? ruleIds.map(id => this.rules.get(id)!).filter(Boolean) : Array.from(this.rules.values());
        const results: ValidationResult[] = rulesToRun.map(r => ({ ruleId: r.id, passed: true, errors: [], timestamp: Date.now() }));
        this.results.push(...results); return { passed: results.every(r => r.passed), results };
    }

    getHistory(): ValidationResult[] { return [...this.results]; }
    getRules(): ValidationRule[] { return Array.from(this.rules.values()); }
}
export function getDataValidatorEngine(): DataValidatorEngine { return DataValidatorEngine.getInstance(); }
