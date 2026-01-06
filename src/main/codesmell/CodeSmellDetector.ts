/**
 * Code Smell Detector - Detect code smells
 */
import { EventEmitter } from 'events';

export interface CodeSmell { id: string; file: string; line: number; type: 'long-method' | 'long-class' | 'god-class' | 'feature-envy' | 'dead-code' | 'duplicated-code'; severity: 'minor' | 'major' | 'critical'; message: string; effort: string; }

export class CodeSmellDetector extends EventEmitter {
    private static instance: CodeSmellDetector;
    private smells: Map<string, CodeSmell[]> = new Map();
    private constructor() { super(); }
    static getInstance(): CodeSmellDetector { if (!CodeSmellDetector.instance) CodeSmellDetector.instance = new CodeSmellDetector(); return CodeSmellDetector.instance; }

    detect(file: string, code: string): CodeSmell[] {
        const results: CodeSmell[] = [];
        const lines = code.split('\n');
        if (lines.length > 300) results.push({ id: `smell_${Date.now()}`, file, line: 1, type: 'long-class', severity: 'major', message: 'Class too long (>300 lines)', effort: '2h' });
        const methods = code.match(/function\s+\w+[\s\S]*?\{[\s\S]*?\}/g) || [];
        methods.forEach(m => { if (m.split('\n').length > 50) results.push({ id: `smell_${Date.now()}_${results.length}`, file, line: 1, type: 'long-method', severity: 'major', message: 'Method too long (>50 lines)', effort: '1h' }); });
        if (code.includes('// TODO') || code.includes('// FIXME')) results.push({ id: `smell_${Date.now()}_${results.length}`, file, line: 1, type: 'dead-code', severity: 'minor', message: 'Contains unaddressed TODO/FIXME', effort: '30m' });
        this.smells.set(file, results); this.emit('detected', { file, count: results.length }); return results;
    }

    getByFile(file: string): CodeSmell[] { return this.smells.get(file) || []; }
    getByType(type: CodeSmell['type']): CodeSmell[] { return Array.from(this.smells.values()).flat().filter(s => s.type === type); }
    getAll(): CodeSmell[] { return Array.from(this.smells.values()).flat(); }
}
export function getCodeSmellDetector(): CodeSmellDetector { return CodeSmellDetector.getInstance(); }
