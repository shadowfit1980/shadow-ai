/**
 * Problem Detector - Error detection
 */
import { EventEmitter } from 'events';

export interface Problem { id: string; file: string; line: number; column: number; severity: 'error' | 'warning' | 'info' | 'hint'; message: string; source: string; autofix?: string; }

export class ProblemDetector extends EventEmitter {
    private static instance: ProblemDetector;
    private problems: Map<string, Problem[]> = new Map();
    private constructor() { super(); }
    static getInstance(): ProblemDetector { if (!ProblemDetector.instance) ProblemDetector.instance = new ProblemDetector(); return ProblemDetector.instance; }

    detect(file: string, content: string): Problem[] {
        const problems: Problem[] = [];
        const lines = content.split('\n');
        lines.forEach((line, i) => {
            if (line.includes('console.log')) problems.push({ id: `prob_${Date.now()}_${i}`, file, line: i + 1, column: line.indexOf('console'), severity: 'warning', message: 'Remove console.log', source: 'linter' });
            if (line.includes('any')) problems.push({ id: `prob_${Date.now()}_${i}_any`, file, line: i + 1, column: line.indexOf('any'), severity: 'warning', message: 'Avoid using any', source: 'typescript' });
        });
        this.problems.set(file, problems); this.emit('detected', { file, count: problems.length }); return problems;
    }

    getByFile(file: string): Problem[] { return this.problems.get(file) || []; }
    getBySeverity(severity: Problem['severity']): Problem[] { return Array.from(this.problems.values()).flat().filter(p => p.severity === severity); }
    getAll(): Problem[] { return Array.from(this.problems.values()).flat(); }
    clear(file: string): void { this.problems.delete(file); }
}
export function getProblemDetector(): ProblemDetector { return ProblemDetector.getInstance(); }
