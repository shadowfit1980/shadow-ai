/**
 * Security Scanner
 * 
 * Scans code for security vulnerabilities and best practices.
 */

import { EventEmitter } from 'events';

interface SecurityIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    file: string;
    line: number;
    fix?: string;
}

interface SecurityReport {
    file: string;
    issues: SecurityIssue[];
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export class SecurityScanner extends EventEmitter {
    private static instance: SecurityScanner;

    private constructor() { super(); }

    static getInstance(): SecurityScanner {
        if (!SecurityScanner.instance) {
            SecurityScanner.instance = new SecurityScanner();
        }
        return SecurityScanner.instance;
    }

    scan(file: string, code: string): SecurityReport {
        const issues: SecurityIssue[] = [];
        const lines = code.split('\n');

        lines.forEach((line, i) => {
            // Hardcoded secrets
            if (/password\s*=\s*['"][^'"]+['"]|api[_-]?key\s*=\s*['"][^'"]+['"]|secret\s*=\s*['"][^'"]+['"]/i.test(line)) {
                issues.push({ id: `sec-${i}-1`, severity: 'critical', type: 'hardcoded-secret', description: 'Hardcoded secret detected', file, line: i + 1, fix: 'Use environment variables' });
            }
            // SQL injection
            if (/query\s*\(.*\$\{|execute\s*\(.*\+/.test(line)) {
                issues.push({ id: `sec-${i}-2`, severity: 'critical', type: 'sql-injection', description: 'Potential SQL injection', file, line: i + 1, fix: 'Use parameterized queries' });
            }
            // eval usage
            if (/\beval\s*\(/.test(line)) {
                issues.push({ id: `sec-${i}-3`, severity: 'high', type: 'eval', description: 'eval() is dangerous', file, line: i + 1, fix: 'Use safer alternatives' });
            }
            // innerHTML
            if (/\.innerHTML\s*=/.test(line)) {
                issues.push({ id: `sec-${i}-4`, severity: 'high', type: 'xss', description: 'Potential XSS via innerHTML', file, line: i + 1, fix: 'Use textContent or sanitize' });
            }
            // Insecure HTTP
            if (/http:\/\/(?!localhost|127\.0\.0\.1)/.test(line)) {
                issues.push({ id: `sec-${i}-5`, severity: 'medium', type: 'insecure-http', description: 'Insecure HTTP connection', file, line: i + 1, fix: 'Use HTTPS' });
            }
            // Debug/console
            if (/console\.(log|debug)\s*\(/.test(line) && /credential|password|secret|token/i.test(line)) {
                issues.push({ id: `sec-${i}-6`, severity: 'high', type: 'sensitive-log', description: 'Logging sensitive data', file, line: i + 1, fix: 'Remove sensitive logging' });
            }
        });

        const score = Math.max(0, 100 - issues.filter(i => i.severity === 'critical').length * 25
            - issues.filter(i => i.severity === 'high').length * 15
            - issues.filter(i => i.severity === 'medium').length * 5);
        const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

        this.emit('scan:complete', { file, issues: issues.length, score });
        return { file, issues, score, grade };
    }

    getSecuritySummary(reports: SecurityReport[]): { avgScore: number; totalIssues: number; critical: number } {
        const avgScore = reports.reduce((s, r) => s + r.score, 0) / (reports.length || 1);
        const totalIssues = reports.reduce((s, r) => s + r.issues.length, 0);
        const critical = reports.reduce((s, r) => s + r.issues.filter(i => i.severity === 'critical').length, 0);
        return { avgScore, totalIssues, critical };
    }
}

export const securityScanner = SecurityScanner.getInstance();
