/**
 * Security Scanner
 * Detect security vulnerabilities in code
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';

export interface SecurityVulnerability {
    id: string;
    type: VulnerabilityType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    file: string;
    line: number;
    code: string;
    description: string;
    recommendation: string;
    cwe?: string;
}

export type VulnerabilityType =
    | 'sql_injection'
    | 'xss'
    | 'command_injection'
    | 'path_traversal'
    | 'hardcoded_secret'
    | 'insecure_random'
    | 'weak_crypto'
    | 'open_redirect'
    | 'ssrf'
    | 'log_injection';

export interface ScanResult {
    id: string;
    file: string;
    scanTime: number;
    vulnerabilities: SecurityVulnerability[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}

/**
 * SecurityScanner
 * Scan code for security vulnerabilities
 */
export class SecurityScanner extends EventEmitter {
    private static instance: SecurityScanner;
    private scans: Map<string, ScanResult> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): SecurityScanner {
        if (!SecurityScanner.instance) {
            SecurityScanner.instance = new SecurityScanner();
        }
        return SecurityScanner.instance;
    }

    /**
     * Scan a file
     */
    async scanFile(filePath: string): Promise<ScanResult> {
        const id = `scan_${Date.now()}`;
        const startTime = Date.now();

        this.emit('scanStarted', { id, file: filePath });

        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const vulnerabilities = this.detectVulnerabilities(filePath, lines);

        const result: ScanResult = {
            id,
            file: filePath,
            scanTime: Date.now() - startTime,
            vulnerabilities,
            summary: {
                critical: vulnerabilities.filter(v => v.severity === 'critical').length,
                high: vulnerabilities.filter(v => v.severity === 'high').length,
                medium: vulnerabilities.filter(v => v.severity === 'medium').length,
                low: vulnerabilities.filter(v => v.severity === 'low').length,
            },
        };

        this.scans.set(id, result);
        this.emit('scanCompleted', result);

        return result;
    }

    /**
     * Detect vulnerabilities
     */
    private detectVulnerabilities(file: string, lines: string[]): SecurityVulnerability[] {
        const vulnerabilities: SecurityVulnerability[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // SQL Injection
            if (/`SELECT.*\$\{|"SELECT.*"\s*\+|'SELECT.*'\s*\+/.test(line) ||
                /query\(.*\+|query\(`.*\$\{/.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'sql_injection',
                    severity: 'critical',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Potential SQL injection - query built with string concatenation',
                    recommendation: 'Use parameterized queries or prepared statements',
                    cwe: 'CWE-89',
                });
            }

            // XSS
            if (/innerHTML\s*=|outerHTML\s*=|document\.write\(|\.html\(/.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'xss',
                    severity: 'high',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Potential XSS - direct HTML manipulation',
                    recommendation: 'Use textContent or sanitize HTML before insertion',
                    cwe: 'CWE-79',
                });
            }

            // Command Injection
            if (/exec\(|spawn\(|execSync\(|spawnSync\(/.test(line) &&
                /\$\{|\+\s*\w+|\+\s*['"]/.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'command_injection',
                    severity: 'critical',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Potential command injection - user input in shell command',
                    recommendation: 'Validate and sanitize input, avoid shell commands with user data',
                    cwe: 'CWE-78',
                });
            }

            // Path Traversal
            if (/readFile|writeFile|readdir|stat/.test(line) &&
                /\+\s*\w+|path\.join\([^)]*req\./.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'path_traversal',
                    severity: 'high',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Potential path traversal - user input in file path',
                    recommendation: 'Validate paths, use path.normalize and check for ../',
                    cwe: 'CWE-22',
                });
            }

            // Hardcoded Secrets
            if (/password\s*[:=]\s*['"][^'"]{4,}['"]|api[_-]?key\s*[:=]\s*['"][^'"]+['"]|secret\s*[:=]\s*['"][^'"]+['"]/i.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'hardcoded_secret',
                    severity: 'critical',
                    file,
                    line: lineNum,
                    code: line.trim().replace(/['"][^'"]{4,}['"]/g, '"***"'),
                    description: 'Hardcoded secret detected',
                    recommendation: 'Use environment variables or a secrets manager',
                    cwe: 'CWE-798',
                });
            }

            // Insecure Random
            if (/Math\.random\(\)/.test(line) && /token|password|secret|key|auth/i.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'insecure_random',
                    severity: 'medium',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Insecure randomness for security-sensitive operation',
                    recommendation: 'Use crypto.randomBytes() or crypto.randomUUID()',
                    cwe: 'CWE-330',
                });
            }

            // Weak Crypto
            if (/createHash\(['"]md5['"]|createHash\(['"]sha1['"]/i.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'weak_crypto',
                    severity: 'medium',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Weak cryptographic hash algorithm (MD5 or SHA1)',
                    recommendation: 'Use SHA-256 or stronger',
                    cwe: 'CWE-327',
                });
            }

            // Open Redirect
            if (/res\.redirect\(.*req\.|location\s*=\s*.*req\./.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'open_redirect',
                    severity: 'medium',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Potential open redirect - user-controlled redirect URL',
                    recommendation: 'Validate redirect URLs against whitelist',
                    cwe: 'CWE-601',
                });
            }

            // SSRF
            if (/fetch\(|axios\.|http\.request|https\.request/.test(line) &&
                /req\.\w+|params\.\w+|body\.\w+/.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'ssrf',
                    severity: 'high',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Potential SSRF - user input in URL',
                    recommendation: 'Validate and whitelist allowed URLs',
                    cwe: 'CWE-918',
                });
            }

            // Log Injection
            if (/console\.log\(.*req\.|logger\.\w+\(.*req\./i.test(line)) {
                vulnerabilities.push({
                    id: `vuln_${vulnerabilities.length}`,
                    type: 'log_injection',
                    severity: 'low',
                    file,
                    line: lineNum,
                    code: line.trim(),
                    description: 'Potential log injection - user input logged directly',
                    recommendation: 'Sanitize user input before logging',
                    cwe: 'CWE-117',
                });
            }
        }

        return vulnerabilities;
    }

    /**
     * Get scan result
     */
    getScan(id: string): ScanResult | null {
        return this.scans.get(id) || null;
    }

    /**
     * Get all scans
     */
    getAllScans(): ScanResult[] {
        return Array.from(this.scans.values());
    }

    /**
     * Generate security report
     */
    generateReport(result: ScanResult): string {
        const lines = [
            `# Security Scan Report: ${result.file}`,
            '',
            '## Summary',
            `- Critical: ${result.summary.critical}`,
            `- High: ${result.summary.high}`,
            `- Medium: ${result.summary.medium}`,
            `- Low: ${result.summary.low}`,
            '',
            '## Vulnerabilities',
        ];

        const sorted = [...result.vulnerabilities].sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return order[a.severity] - order[b.severity];
        });

        for (const v of sorted) {
            lines.push('');
            lines.push(`### [${v.severity.toUpperCase()}] ${v.type} - Line ${v.line}`);
            lines.push(`**Description:** ${v.description}`);
            lines.push(`**Recommendation:** ${v.recommendation}`);
            if (v.cwe) lines.push(`**CWE:** ${v.cwe}`);
        }

        return lines.join('\n');
    }
}

// Singleton getter
export function getSecurityScanner(): SecurityScanner {
    return SecurityScanner.getInstance();
}
