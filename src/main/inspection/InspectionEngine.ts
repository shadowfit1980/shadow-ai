/**
 * Inspection Engine - Code inspections
 */
import { EventEmitter } from 'events';

export interface Inspection { id: string; file: string; line: number; severity: 'error' | 'warning' | 'info' | 'weak'; message: string; quickFix?: string; }

export class InspectionEngine extends EventEmitter {
    private static instance: InspectionEngine;
    private inspections: Map<string, Inspection[]> = new Map();
    private rules: { id: string; pattern: RegExp; message: string; severity: Inspection['severity']; fix?: string }[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): InspectionEngine { if (!InspectionEngine.instance) InspectionEngine.instance = new InspectionEngine(); return InspectionEngine.instance; }

    private initDefaults(): void {
        this.rules = [
            { id: 'unused-var', pattern: /const \w+ =.*?(?!used)/g, message: 'Unused variable', severity: 'warning' },
            { id: 'console-log', pattern: /console\.log/g, message: 'Remove console.log', severity: 'weak', fix: '// $&' },
            { id: 'any-type', pattern: /: any/g, message: 'Avoid any type', severity: 'info' }
        ];
    }

    inspect(file: string, code: string): Inspection[] {
        const results: Inspection[] = [];
        this.rules.forEach(rule => { let match; while ((match = rule.pattern.exec(code)) !== null) { results.push({ id: `insp_${Date.now()}_${results.length}`, file, line: code.slice(0, match.index).split('\n').length, severity: rule.severity, message: rule.message, quickFix: rule.fix }); } rule.pattern.lastIndex = 0; });
        this.inspections.set(file, results); this.emit('inspected', { file, count: results.length }); return results;
    }

    getByFile(file: string): Inspection[] { return this.inspections.get(file) || []; }
    getBySeverity(severity: Inspection['severity']): Inspection[] { return Array.from(this.inspections.values()).flat().filter(i => i.severity === severity); }
}
export function getInspectionEngine(): InspectionEngine { return InspectionEngine.getInstance(); }
