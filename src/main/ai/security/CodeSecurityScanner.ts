/**
 * Code Security Scanner
 * 
 * Scans code for security vulnerabilities including injection attacks,
 * hardcoded secrets, and common security anti-patterns.
 */

import { EventEmitter } from 'events';

export interface SecurityScan {
    id: string;
    code: string;
    language: string;
    vulnerabilities: Vulnerability[];
    riskScore: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    scannedAt: Date;
}

export interface Vulnerability {
    id: string;
    type: VulnerabilityType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    location: { line: number; column: number };
    cweId?: string;
    owaspCategory?: string;
    fix: VulnerabilityFix;
}

export type VulnerabilityType =
    | 'sql_injection'
    | 'xss'
    | 'command_injection'
    | 'path_traversal'
    | 'hardcoded_secret'
    | 'insecure_random'
    | 'weak_crypto'
    | 'ssrf'
    | 'xxe'
    | 'insecure_deserialization'
    | 'open_redirect'
    | 'cors_misconfiguration';

export interface VulnerabilityFix {
    description: string;
    codeBefore: string;
    codeAfter: string;
    automated: boolean;
}

// Vulnerability patterns
const SECURITY_PATTERNS: {
    type: VulnerabilityType;
    pattern: RegExp;
    severity: Vulnerability['severity'];
    title: string;
    cweId: string;
    fix: (match: string) => VulnerabilityFix;
}[] = [
        {
            type: 'sql_injection',
            pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)/gi,
            severity: 'critical',
            title: 'SQL Injection Vulnerability',
            cweId: 'CWE-89',
            fix: (match) => ({
                description: 'Use parameterized queries instead of string interpolation',
                codeBefore: match,
                codeAfter: 'db.query("SELECT * FROM users WHERE id = ?", [userId])',
                automated: false,
            }),
        },
        {
            type: 'xss',
            pattern: /innerHTML\s*=|document\.write\(|\.html\(/gi,
            severity: 'high',
            title: 'Cross-Site Scripting (XSS) Risk',
            cweId: 'CWE-79',
            fix: (match) => ({
                description: 'Use textContent or sanitize HTML before insertion',
                codeBefore: match,
                codeAfter: 'element.textContent = sanitizedContent',
                automated: true,
            }),
        },
        {
            type: 'command_injection',
            pattern: /exec\(.*\$|spawn\(.*\$|child_process.*\$\{/gi,
            severity: 'critical',
            title: 'Command Injection Vulnerability',
            cweId: 'CWE-78',
            fix: (match) => ({
                description: 'Validate and sanitize all command arguments',
                codeBefore: match,
                codeAfter: 'execFile(command, validatedArgs)',
                automated: false,
            }),
        },
        {
            type: 'path_traversal',
            pattern: /path\.join\(.*req\.|fs\.(read|write).*\$\{/gi,
            severity: 'high',
            title: 'Path Traversal Vulnerability',
            cweId: 'CWE-22',
            fix: (match) => ({
                description: 'Validate paths and use path.normalize with a whitelist',
                codeBefore: match,
                codeAfter: 'const safePath = path.join(baseDir, path.basename(userInput))',
                automated: false,
            }),
        },
        {
            type: 'hardcoded_secret',
            pattern: /(password|secret|api[_-]?key|token|auth)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
            severity: 'high',
            title: 'Hardcoded Secret Detected',
            cweId: 'CWE-798',
            fix: (match) => ({
                description: 'Move secrets to environment variables',
                codeBefore: match,
                codeAfter: 'process.env.API_KEY',
                automated: true,
            }),
        },
        {
            type: 'insecure_random',
            pattern: /Math\.random\(\)/g,
            severity: 'medium',
            title: 'Insecure Random Number Generator',
            cweId: 'CWE-330',
            fix: (match) => ({
                description: 'Use crypto.randomBytes for security-sensitive operations',
                codeBefore: 'Math.random()',
                codeAfter: 'crypto.randomBytes(16).toString("hex")',
                automated: true,
            }),
        },
        {
            type: 'weak_crypto',
            pattern: /createHash\(['"]md5['"]\)|createHash\(['"]sha1['"]\)/gi,
            severity: 'medium',
            title: 'Weak Cryptographic Algorithm',
            cweId: 'CWE-328',
            fix: (match) => ({
                description: 'Use SHA-256 or stronger algorithms',
                codeBefore: match,
                codeAfter: 'crypto.createHash("sha256")',
                automated: true,
            }),
        },
        {
            type: 'ssrf',
            pattern: /fetch\(.*req\.|axios\(.*req\.|http\.get\(.*\$\{/gi,
            severity: 'high',
            title: 'Server-Side Request Forgery Risk',
            cweId: 'CWE-918',
            fix: (match) => ({
                description: 'Validate and whitelist allowed URLs',
                codeBefore: match,
                codeAfter: 'const url = validateUrl(userInput, allowedDomains)',
                automated: false,
            }),
        },
        {
            type: 'open_redirect',
            pattern: /res\.redirect\(.*req\.|window\.location\s*=.*\$/gi,
            severity: 'medium',
            title: 'Open Redirect Vulnerability',
            cweId: 'CWE-601',
            fix: (match) => ({
                description: 'Validate redirect URLs against a whitelist',
                codeBefore: match,
                codeAfter: 'res.redirect(validateRedirect(url, allowedHosts))',
                automated: false,
            }),
        },
        {
            type: 'cors_misconfiguration',
            pattern: /Access-Control-Allow-Origin.*\*/gi,
            severity: 'medium',
            title: 'CORS Misconfiguration',
            cweId: 'CWE-942',
            fix: (match) => ({
                description: 'Specify allowed origins instead of wildcard',
                codeBefore: match,
                codeAfter: 'Access-Control-Allow-Origin: https://trusted-domain.com',
                automated: true,
            }),
        },
    ];

export class CodeSecurityScanner extends EventEmitter {
    private static instance: CodeSecurityScanner;
    private scans: Map<string, SecurityScan> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): CodeSecurityScanner {
        if (!CodeSecurityScanner.instance) {
            CodeSecurityScanner.instance = new CodeSecurityScanner();
        }
        return CodeSecurityScanner.instance;
    }

    // ========================================================================
    // SCANNING
    // ========================================================================

    scan(code: string, language: string = 'javascript'): SecurityScan {
        const id = `scan_${Date.now()}`;
        const vulnerabilities: Vulnerability[] = [];
        const lines = code.split('\n');

        for (const { type, pattern, severity, title, cweId, fix } of SECURITY_PATTERNS) {
            let match;
            const regex = new RegExp(pattern);

            while ((match = regex.exec(code)) !== null) {
                // Find line number
                const beforeMatch = code.slice(0, match.index);
                const lineNumber = beforeMatch.split('\n').length;

                vulnerabilities.push({
                    id: `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type,
                    severity,
                    title,
                    description: this.getDescription(type),
                    location: { line: lineNumber, column: 0 },
                    cweId,
                    owaspCategory: this.getOwaspCategory(type),
                    fix: fix(match[0]),
                });
            }
        }

        const riskScore = this.calculateRiskScore(vulnerabilities);
        const grade = this.scoreToGrade(riskScore);

        const scan: SecurityScan = {
            id,
            code: code.slice(0, 500) + (code.length > 500 ? '...' : ''),
            language,
            vulnerabilities,
            riskScore,
            grade,
            scannedAt: new Date(),
        };

        this.scans.set(id, scan);
        this.emit('scan:complete', scan);
        return scan;
    }

    private getDescription(type: VulnerabilityType): string {
        const descriptions: Record<VulnerabilityType, string> = {
            sql_injection: 'User input is directly concatenated into SQL queries, allowing attackers to execute arbitrary SQL commands.',
            xss: 'Unsanitized content is rendered in the DOM, allowing attackers to inject malicious scripts.',
            command_injection: 'User input is passed to system commands, allowing attackers to execute arbitrary commands.',
            path_traversal: 'User input is used in file paths, allowing attackers to access files outside intended directories.',
            hardcoded_secret: 'Sensitive credentials are embedded in source code, risking exposure in version control.',
            insecure_random: 'Math.random() is cryptographically weak and should not be used for security purposes.',
            weak_crypto: 'Weak hash algorithms like MD5 or SHA1 are vulnerable to collision attacks.',
            ssrf: 'User-provided URLs are fetched without validation, allowing internal network access.',
            xxe: 'XML parsing without disabling external entities can lead to file disclosure.',
            insecure_deserialization: 'Deserializing untrusted data can lead to remote code execution.',
            open_redirect: 'Unvalidated redirects can be used for phishing attacks.',
            cors_misconfiguration: 'Overly permissive CORS allows any origin to access resources.',
        };
        return descriptions[type];
    }

    private getOwaspCategory(type: VulnerabilityType): string {
        const categories: Partial<Record<VulnerabilityType, string>> = {
            sql_injection: 'A03:2021 - Injection',
            xss: 'A03:2021 - Injection',
            command_injection: 'A03:2021 - Injection',
            hardcoded_secret: 'A07:2021 - Identification and Authentication Failures',
            weak_crypto: 'A02:2021 - Cryptographic Failures',
            ssrf: 'A10:2021 - Server-Side Request Forgery',
        };
        return categories[type] || 'A00:- Other';
    }

    private calculateRiskScore(vulnerabilities: Vulnerability[]): number {
        if (vulnerabilities.length === 0) return 0;

        const severityScores = { low: 10, medium: 25, high: 50, critical: 100 };
        const totalScore = vulnerabilities.reduce((sum, v) => sum + severityScores[v.severity], 0);

        return Math.min(100, totalScore);
    }

    private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
        if (score === 0) return 'A';
        if (score <= 20) return 'B';
        if (score <= 40) return 'C';
        if (score <= 60) return 'D';
        return 'F';
    }

    // ========================================================================
    // AUTO-FIX
    // ========================================================================

    applyFix(scanId: string, vulnId: string): { success: boolean; fixedCode?: string } {
        const scan = this.scans.get(scanId);
        if (!scan) return { success: false };

        const vuln = scan.vulnerabilities.find(v => v.id === vulnId);
        if (!vuln || !vuln.fix.automated) return { success: false };

        // In real implementation, would apply the fix to actual code
        return {
            success: true,
            fixedCode: vuln.fix.codeAfter,
        };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getScan(id: string): SecurityScan | undefined {
        return this.scans.get(id);
    }

    getAllScans(): SecurityScan[] {
        return Array.from(this.scans.values());
    }

    getVulnerabilityStats(): { type: VulnerabilityType; count: number }[] {
        const counts = new Map<VulnerabilityType, number>();

        for (const scan of this.scans.values()) {
            for (const vuln of scan.vulnerabilities) {
                counts.set(vuln.type, (counts.get(vuln.type) || 0) + 1);
            }
        }

        return Array.from(counts.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);
    }
}

export const codeSecurityScanner = CodeSecurityScanner.getInstance();
