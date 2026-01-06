/**
 * Problem Panel - Errors/warnings panel
 */
import { EventEmitter } from 'events';

export interface Problem { id: string; file: string; line: number; column: number; severity: 'error' | 'warning' | 'info' | 'hint'; message: string; source: string; code?: string; }

export class ProblemPanelManager extends EventEmitter {
    private static instance: ProblemPanelManager;
    private problems: Map<string, Problem> = new Map();
    private constructor() { super(); }
    static getInstance(): ProblemPanelManager { if (!ProblemPanelManager.instance) ProblemPanelManager.instance = new ProblemPanelManager(); return ProblemPanelManager.instance; }

    add(file: string, line: number, column: number, severity: Problem['severity'], message: string, source: string, code?: string): Problem {
        const problem: Problem = { id: `prob_${Date.now()}_${Math.random().toString(36).slice(2)}`, file, line, column, severity, message, source, code };
        this.problems.set(problem.id, problem);
        this.emit('added', problem);
        return problem;
    }

    remove(id: string): boolean { const result = this.problems.delete(id); this.emit('removed', id); return result; }
    clearFile(file: string): void { Array.from(this.problems.entries()).filter(([, p]) => p.file === file).forEach(([id]) => this.problems.delete(id)); this.emit('cleared', file); }
    getByFile(file: string): Problem[] { return Array.from(this.problems.values()).filter(p => p.file === file); }
    getBySeverity(severity: Problem['severity']): Problem[] { return Array.from(this.problems.values()).filter(p => p.severity === severity); }
    getStats(): { errors: number; warnings: number; infos: number } { const all = Array.from(this.problems.values()); return { errors: all.filter(p => p.severity === 'error').length, warnings: all.filter(p => p.severity === 'warning').length, infos: all.filter(p => p.severity === 'info').length }; }
    getAll(): Problem[] { return Array.from(this.problems.values()); }
}
export function getProblemPanelManager(): ProblemPanelManager { return ProblemPanelManager.getInstance(); }
