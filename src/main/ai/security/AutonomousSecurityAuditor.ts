/**
 * Autonomous Security Auditor
 * 
 * Performs comprehensive security audits on code, detecting vulnerabilities,
 * secrets, and compliance issues with automated remediation suggestions.
 */

import { EventEmitter } from 'events';

export interface SecurityAudit {
    id: string;
    target: string;
    type: AuditType;
    findings: SecurityFinding[];
    score: SecurityScore;
    compliance: ComplianceCheck[];
    remediation: RemediationPlan;
    timestamp: Date;
}

export type AuditType = 'code' | 'dependency' | 'infrastructure' | 'full';

export interface SecurityFinding {
    id: string;
    type: VulnerabilityType;
    severity: Severity;
    title: string;
    description: string;
    location: FindingLocation;
    evidence: string;
    cwe?: string;
    cvss?: number;
    remediation: string;
}

export type VulnerabilityType =
    | 'injection'
    | 'xss'
    | 'csrf'
    | 'auth-bypass'
    | 'sensitive-data'
    | 'hardcoded-secret'
    | 'insecure-dependency'
    | 'misconfig'
    | 'weak-crypto'
    | 'path-traversal'
    | 'race-condition'
    | 'dos';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface FindingLocation {
    file: string;
    line?: number;
    column?: number;
    snippet?: string;
}

export interface SecurityScore {
    overall: number;
    byCategory: Record<string, number>;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    trend: 'improving' | 'stable' | 'declining';
}

export interface ComplianceCheck {
    standard: string;
    requirement: string;
    status: 'pass' | 'fail' | 'partial';
    details: string;
}

export interface RemediationPlan {
    priority: SecurityFinding[];
    automated: AutoFix[];
    manual: ManualStep[];
    estimatedEffort: string;
}

export interface AutoFix {
    findingId: string;
    type: 'replace' | 'add' | 'remove';
    location: FindingLocation;
    original: string;
    fixed: string;
    confidence: number;
}

export interface ManualStep {
    findingId: string;
    instruction: string;
    resources: string[];
}

export class AutonomousSecurityAuditor extends EventEmitter {
    private static instance: AutonomousSecurityAuditor;
    private audits: Map<string, SecurityAudit> = new Map();
    private patterns: Map<VulnerabilityType, RegExp[]> = new Map();

    private constructor() {
        super();
        this.initializePatterns();
    }

    static getInstance(): AutonomousSecurityAuditor {
        if (!AutonomousSecurityAuditor.instance) {
            AutonomousSecurityAuditor.instance = new AutonomousSecurityAuditor();
        }
        return AutonomousSecurityAuditor.instance;
    }

    private initializePatterns(): void {
        this.patterns.set('hardcoded-secret', [
            /(?:password|secret|api[_-]?key|token|auth)\s*[:=]\s*['"]\w{8,}['"]/gi,
            /(?:AWS|AZURE|GCP)[_A-Z]*\s*[:=]\s*['"]\w+['"]/gi,
            /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g,
        ]);

        this.patterns.set('injection', [
            /\$\{.*\}.*(?:exec|eval|query)/gi,
            /(?:query|execute)\s*\(\s*[`'"].*\+.*\)/gi,
            /new RegExp\([^,)]+\)/g,
        ]);

        this.patterns.set('xss', [
            /innerHTML\s*=\s*(?!['"])/g,
            /document\.write\s*\(/g,
            /\$\(.*\)\.html\s*\(/g,
            /dangerouslySetInnerHTML/g,
        ]);

        this.patterns.set('weak-crypto', [
            /\bmd5\b|\bsha1\b/gi,
            /crypto\.createHash\s*\(\s*['"]md5['"]\s*\)/gi,
            /\bDES\b|\b3DES\b/g,
        ]);

        this.patterns.set('path-traversal', [
            /(?:readFile|writeFile|open)\s*\([^)]*\+[^)]*\)/g,
            /path\.join\s*\([^)]*req\./g,
        ]);

        this.patterns.set('sensitive-data', [
            /console\.log\s*\([^)]*(?:password|token|secret|key)/gi,
            /localStorage\.setItem\s*\([^)]*(?:password|token)/gi,
        ]);
    }

    // ========================================================================
    // SECURITY AUDIT
    // ========================================================================

    async auditCode(code: string, filename: string): Promise<SecurityAudit> {
        const findings = this.scanForVulnerabilities(code, filename);
        const compliance = this.checkCompliance(code, findings);
        const score = this.calculateScore(findings);
        const remediation = this.generateRemediationPlan(findings, code);

        const audit: SecurityAudit = {
            id: `audit_${Date.now()}`,
            target: filename,
            type: 'code',
            findings,
            score,
            compliance,
            remediation,
            timestamp: new Date(),
        };

        this.audits.set(audit.id, audit);
        this.emit('audit:completed', audit);
        return audit;
    }

    private scanForVulnerabilities(code: string, filename: string): SecurityFinding[] {
        const findings: SecurityFinding[] = [];
        const lines = code.split('\n');

        for (const [type, patterns] of this.patterns) {
            for (const pattern of patterns) {
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (pattern.test(line)) {
                        findings.push(this.createFinding(type, line, i + 1, filename));
                    }
                    pattern.lastIndex = 0; // Reset regex
                }
            }
        }

        // Additional checks
        findings.push(...this.checkDependencies(code, filename));
        findings.push(...this.checkAuthPatterns(code, filename));

        return findings;
    }

    private createFinding(type: VulnerabilityType, line: string, lineNum: number, file: string): SecurityFinding {
        const severityMap: Record<VulnerabilityType, Severity> = {
            'injection': 'critical',
            'hardcoded-secret': 'critical',
            'auth-bypass': 'critical',
            'xss': 'high',
            'csrf': 'high',
            'path-traversal': 'high',
            'weak-crypto': 'high',
            'sensitive-data': 'medium',
            'insecure-dependency': 'medium',
            'misconfig': 'medium',
            'race-condition': 'medium',
            'dos': 'low',
        };

        const cweMap: Record<VulnerabilityType, string> = {
            'injection': 'CWE-89',
            'xss': 'CWE-79',
            'csrf': 'CWE-352',
            'hardcoded-secret': 'CWE-798',
            'auth-bypass': 'CWE-287',
            'sensitive-data': 'CWE-200',
            'weak-crypto': 'CWE-327',
            'path-traversal': 'CWE-22',
            'insecure-dependency': 'CWE-1104',
            'misconfig': 'CWE-16',
            'race-condition': 'CWE-362',
            'dos': 'CWE-400',
        };

        return {
            id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            severity: severityMap[type],
            title: this.getTitleForType(type),
            description: this.getDescriptionForType(type),
            location: {
                file,
                line: lineNum,
                snippet: line.trim().slice(0, 100),
            },
            evidence: line.trim(),
            cwe: cweMap[type],
            cvss: this.calculateCVSS(type),
            remediation: this.getRemediationForType(type),
        };
    }

    private getTitleForType(type: VulnerabilityType): string {
        const titles: Record<VulnerabilityType, string> = {
            'injection': 'SQL/Command Injection Risk',
            'xss': 'Cross-Site Scripting (XSS) Vulnerability',
            'csrf': 'Cross-Site Request Forgery Risk',
            'hardcoded-secret': 'Hardcoded Secret Detected',
            'auth-bypass': 'Authentication Bypass Risk',
            'sensitive-data': 'Sensitive Data Exposure',
            'weak-crypto': 'Weak Cryptography Usage',
            'path-traversal': 'Path Traversal Vulnerability',
            'insecure-dependency': 'Insecure Dependency',
            'misconfig': 'Security Misconfiguration',
            'race-condition': 'Race Condition Risk',
            'dos': 'Denial of Service Risk',
        };
        return titles[type];
    }

    private getDescriptionForType(type: VulnerabilityType): string {
        const descriptions: Record<VulnerabilityType, string> = {
            'injection': 'User input is used in a query without proper sanitization, allowing attackers to inject malicious commands.',
            'xss': 'User-controlled data is rendered without escaping, allowing script injection attacks.',
            'csrf': 'Requests lack anti-CSRF tokens, enabling forged requests from malicious sites.',
            'hardcoded-secret': 'Sensitive credentials are embedded in source code, risking exposure in version control.',
            'auth-bypass': 'Authentication logic may be bypassed under certain conditions.',
            'sensitive-data': 'Sensitive information may be logged or stored insecurely.',
            'weak-crypto': 'Deprecated or weak cryptographic algorithms are in use.',
            'path-traversal': 'File paths constructed with user input may allow directory traversal.',
            'insecure-dependency': 'A dependency has known security vulnerabilities.',
            'misconfig': 'Security settings are not properly configured.',
            'race-condition': 'Concurrent access may lead to unexpected behavior.',
            'dos': 'Resource handling may allow denial of service attacks.',
        };
        return descriptions[type];
    }

    private getRemediationForType(type: VulnerabilityType): string {
        const remediations: Record<VulnerabilityType, string> = {
            'injection': 'Use parameterized queries or prepared statements. Never concatenate user input into queries.',
            'xss': 'Escape all user output, use textContent instead of innerHTML, enable CSP headers.',
            'csrf': 'Implement CSRF tokens and validate the Origin/Referer headers.',
            'hardcoded-secret': 'Move secrets to environment variables or a secrets manager.',
            'auth-bypass': 'Review and strengthen authentication logic, add multi-factor authentication.',
            'sensitive-data': 'Remove sensitive data from logs, encrypt data at rest and in transit.',
            'weak-crypto': 'Upgrade to modern algorithms like SHA-256, AES-256, or Argon2.',
            'path-traversal': 'Validate and sanitize file paths, use allowlists for permitted files.',
            'insecure-dependency': 'Update the dependency to a patched version.',
            'misconfig': 'Review and correct security configurations following best practices.',
            'race-condition': 'Use proper locking mechanisms or atomic operations.',
            'dos': 'Implement rate limiting and input validation.',
        };
        return remediations[type];
    }

    private calculateCVSS(type: VulnerabilityType): number {
        const scores: Record<VulnerabilityType, number> = {
            'injection': 9.8,
            'hardcoded-secret': 9.1,
            'auth-bypass': 9.0,
            'xss': 7.5,
            'csrf': 7.0,
            'path-traversal': 7.5,
            'weak-crypto': 6.5,
            'sensitive-data': 5.3,
            'insecure-dependency': 5.0,
            'misconfig': 4.5,
            'race-condition': 4.0,
            'dos': 3.5,
        };
        return scores[type] || 5.0;
    }

    private checkDependencies(code: string, filename: string): SecurityFinding[] {
        const findings: SecurityFinding[] = [];

        // Check for known vulnerable packages (simplified)
        const vulnerablePackages = ['lodash@<4.17.21', 'axios@<0.21.1', 'express@<4.17.3'];

        for (const pkg of vulnerablePackages) {
            if (code.includes(pkg.split('@')[0])) {
                findings.push({
                    id: `dep_${Date.now()}`,
                    type: 'insecure-dependency',
                    severity: 'medium',
                    title: `Potentially vulnerable: ${pkg.split('@')[0]}`,
                    description: 'This package may have known vulnerabilities. Check the version.',
                    location: { file: filename },
                    evidence: pkg,
                    remediation: 'Update to the latest patched version',
                });
            }
        }

        return findings;
    }

    private checkAuthPatterns(code: string, filename: string): SecurityFinding[] {
        const findings: SecurityFinding[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for JWT without verification
            if (line.includes('jwt.decode') && !code.includes('jwt.verify')) {
                findings.push({
                    id: `auth_${Date.now()}`,
                    type: 'auth-bypass',
                    severity: 'critical',
                    title: 'JWT Decoded Without Verification',
                    description: 'JWT is decoded without signature verification, allowing token forgery.',
                    location: { file: filename, line: i + 1, snippet: line.trim() },
                    evidence: line.trim(),
                    remediation: 'Use jwt.verify() instead of jwt.decode()',
                });
            }
        }

        return findings;
    }

    private checkCompliance(code: string, findings: SecurityFinding[]): ComplianceCheck[] {
        const checks: ComplianceCheck[] = [];

        // OWASP Top 10
        const owaspCategories = ['injection', 'auth-bypass', 'sensitive-data', 'xss', 'misconfig'];
        for (const cat of owaspCategories) {
            const relatedFindings = findings.filter(f => f.type === cat);
            checks.push({
                standard: 'OWASP Top 10',
                requirement: `A${owaspCategories.indexOf(cat) + 1}: ${cat}`,
                status: relatedFindings.length === 0 ? 'pass' : 'fail',
                details: relatedFindings.length > 0 ? `${relatedFindings.length} issue(s) found` : 'No issues',
            });
        }

        // Secret Management
        checks.push({
            standard: 'Secret Management',
            requirement: 'No hardcoded secrets',
            status: findings.some(f => f.type === 'hardcoded-secret') ? 'fail' : 'pass',
            details: 'Secrets should be in environment variables',
        });

        return checks;
    }

    private calculateScore(findings: SecurityFinding[]): SecurityScore {
        const weights: Record<Severity, number> = { critical: 40, high: 20, medium: 10, low: 5, info: 1 };
        const deductions = findings.reduce((sum, f) => sum + weights[f.severity], 0);
        const overall = Math.max(0, 100 - deductions);

        let grade: SecurityScore['grade'];
        if (overall >= 90) grade = 'A';
        else if (overall >= 80) grade = 'B';
        else if (overall >= 70) grade = 'C';
        else if (overall >= 60) grade = 'D';
        else grade = 'F';

        const byCategory: Record<string, number> = {};
        for (const f of findings) {
            byCategory[f.type] = (byCategory[f.type] || 0) + 1;
        }

        return { overall, byCategory: byCategory as any, grade, trend: 'stable' };
    }

    private generateRemediationPlan(findings: SecurityFinding[], code: string): RemediationPlan {
        const priority = [...findings].sort((a, b) => {
            const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });

        const automated: AutoFix[] = [];
        const manual: ManualStep[] = [];

        for (const finding of findings) {
            if (finding.type === 'hardcoded-secret') {
                automated.push({
                    findingId: finding.id,
                    type: 'replace',
                    location: finding.location,
                    original: finding.evidence,
                    fixed: finding.evidence.replace(/['"][\w-]+['"]/, 'process.env.SECRET'),
                    confidence: 0.8,
                });
            } else {
                manual.push({
                    findingId: finding.id,
                    instruction: finding.remediation,
                    resources: ['https://owasp.org/www-project-cheat-sheets/'],
                });
            }
        }

        return {
            priority,
            automated,
            manual,
            estimatedEffort: `${findings.length * 15} minutes`,
        };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAudit(id: string): SecurityAudit | undefined {
        return this.audits.get(id);
    }

    getAllAudits(): SecurityAudit[] {
        return Array.from(this.audits.values());
    }

    getStats(): {
        totalAudits: number;
        totalFindings: number;
        avgScore: number;
        bySeverity: Record<Severity, number>;
    } {
        const audits = Array.from(this.audits.values());
        const allFindings = audits.flatMap(a => a.findings);

        const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        for (const f of allFindings) {
            bySeverity[f.severity]++;
        }

        return {
            totalAudits: audits.length,
            totalFindings: allFindings.length,
            avgScore: audits.length > 0 ? audits.reduce((s, a) => s + a.score.overall, 0) / audits.length : 100,
            bySeverity: bySeverity as Record<Severity, number>,
        };
    }
}

export const autonomousSecurityAuditor = AutonomousSecurityAuditor.getInstance();
