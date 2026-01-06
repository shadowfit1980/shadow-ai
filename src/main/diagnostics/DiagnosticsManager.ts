/**
 * Diagnostics Manager - System diagnostics
 */
import { EventEmitter } from 'events';
import * as os from 'os';

export interface DiagnosticReport { timestamp: number; system: { platform: string; arch: string; cpus: number; memory: { total: number; free: number } }; process: { uptime: number; memory: NodeJS.MemoryUsage }; issues: string[]; }

export class DiagnosticsManager extends EventEmitter {
    private static instance: DiagnosticsManager;
    private reports: DiagnosticReport[] = [];
    private constructor() { super(); }
    static getInstance(): DiagnosticsManager { if (!DiagnosticsManager.instance) DiagnosticsManager.instance = new DiagnosticsManager(); return DiagnosticsManager.instance; }

    generateReport(): DiagnosticReport {
        const issues: string[] = [];
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        if (freeMem / totalMem < 0.1) issues.push('Low memory warning');
        if (os.loadavg()[0] > os.cpus().length) issues.push('High CPU load');

        const report: DiagnosticReport = {
            timestamp: Date.now(),
            system: { platform: os.platform(), arch: os.arch(), cpus: os.cpus().length, memory: { total: totalMem, free: freeMem } },
            process: { uptime: process.uptime(), memory: process.memoryUsage() },
            issues
        };
        this.reports.push(report);
        this.emit('report', report);
        return report;
    }

    getLatest(): DiagnosticReport | null { return this.reports[this.reports.length - 1] || null; }
    getAll(): DiagnosticReport[] { return [...this.reports]; }
    hasIssues(): boolean { const r = this.getLatest(); return r ? r.issues.length > 0 : false; }
}

export function getDiagnosticsManager(): DiagnosticsManager { return DiagnosticsManager.getInstance(); }
