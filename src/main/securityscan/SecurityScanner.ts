/**
 * Security Scanner - Code security analysis
 */
import { EventEmitter } from 'events';

export interface SecurityIssue { id: string; file: string; line: number; severity: 'low' | 'medium' | 'high' | 'critical'; type: string; message: string; fix?: string; }

export class SecurityScanner extends EventEmitter {
    private static instance: SecurityScanner;
    private issues: SecurityIssue[] = [];
    private constructor() { super(); }
    static getInstance(): SecurityScanner { if (!SecurityScanner.instance) SecurityScanner.instance = new SecurityScanner(); return SecurityScanner.instance; }

    async scan(file: string, code: string): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        if (code.includes('eval(')) issues.push({ id: `sec_${Date.now()}`, file, line: 1, severity: 'critical', type: 'code-injection', message: 'Avoid eval() - potential code injection', fix: 'Use JSON.parse() or safer alternatives' });
        if (code.includes('innerHTML')) issues.push({ id: `sec_${Date.now() + 1}`, file, line: 1, severity: 'high', type: 'xss', message: 'innerHTML may cause XSS vulnerabilities', fix: 'Use textContent or sanitize input' });
        if (code.includes('password') && code.includes('console.log')) issues.push({ id: `sec_${Date.now() + 2}`, file, line: 1, severity: 'high', type: 'sensitive-data', message: 'Sensitive data in logs', fix: 'Remove password logging' });
        this.issues.push(...issues);
        this.emit('scanned', issues);
        return issues;
    }

    async scanProject(files: string[]): Promise<SecurityIssue[]> { return this.issues; }
    getCritical(): SecurityIssue[] { return this.issues.filter(i => i.severity === 'critical'); }
    getAll(): SecurityIssue[] { return [...this.issues]; }
    clear(): void { this.issues = []; }
}
export function getSecurityScanner(): SecurityScanner { return SecurityScanner.getInstance(); }
