import * as fs from 'fs/promises';
import * as path from 'path';
import {
    SecurityIssue,
    VulnerabilityType,
    VulnerabilityReport,
} from '../testing/types';

/**
 * Security Scanner
 * Detects security vulnerabilities in code
 */
export class SecurityScanner {
    private static instance: SecurityScanner;

    // Patterns for vulnerability detection
    private patterns = {
        [VulnerabilityType.SQL_INJECTION]: [
            /query\s*\([^)]*\+[^)]*\)/gi,
            /execute\s*\([^)]*\+[^)]*\)/gi,
            /\$\{[^}]*\}.*SELECT/gi,
        ],
        [VulnerabilityType.XSS]: [
            /innerHTML\s*=/gi,
            /dangerouslySetInnerHTML/gi,
            /document\.write\s*\(/gi,
        ],
        [VulnerabilityType.HARDCODED_SECRET]: [
            /(api[_-]?key|apikey)\s*=\s*['"][^'"]+['"]/gi,
            /(password|passwd|pwd)\s*=\s*['"][^'"]+['"]/gi,
            /(secret|token)\s*=\s*['"][a-zA-Z0-9]{20,}['"]/gi,
        ],
        [VulnerabilityType.WEAK_CRYPTO]: [
            /md5\s*\(/gi,
            /sha1\s*\(/gi,
            /Math\.random\s*\(/gi, // for crypto purposes
        ],
        [VulnerabilityType.PATH_TRAVERSAL]: [
            /\.\.[\/\\]/gi,
            /fs\.readFile\s*\([^)]*\+[^)]*\)/gi,
        ],
        [VulnerabilityType.COMMAND_INJECTION]: [
            /exec\s*\([^)]*\+[^)]*\)/gi,
            /spawn\s*\([^)]*\+[^)]*\)/gi,
            /eval\s*\(/gi,
        ],
    };

    private constructor() { }

    static getInstance(): SecurityScanner {
        if (!SecurityScanner.instance) {
            SecurityScanner.instance = new SecurityScanner();
        }
        return SecurityScanner.instance;
    }

    /**
     * Scan a file for security vulnerabilities
     */
    async scanFile(filePath: string): Promise<SecurityIssue[]> {
        const content = await fs.readFile(filePath, 'utf-8');
        const issues: SecurityIssue[] = [];
        const lines = content.split('\n');

        // Check each vulnerability type
        for (const [type, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                lines.forEach((line, lineIndex) => {
                    const matches = line.matchAll(pattern);
                    for (const match of matches) {
                        const issue = this.createIssue(
                            type as VulnerabilityType,
                            filePath,
                            lineIndex + 1,
                            match.index || 0,
                            line.trim()
                        );
                        issues.push(issue);
                    }
                });
            }
        }

        return issues;
    }

    /**
     * Scan a directory recursively
     */
    async scanDirectory(dirPath: string): Promise<VulnerabilityReport> {
        const startTime = Date.now();
        const allIssues: SecurityIssue[] = [];
        let fileCount = 0;

        const scanRecursive = async (currentPath: string) => {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);

                if (entry.isDirectory()) {
                    // Skip node_modules, .git, etc.
                    if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                        continue;
                    }
                    await scanRecursive(fullPath);
                } else if (entry.isFile()) {
                    // Only scan code files
                    const ext = path.extname(entry.name);
                    if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'].includes(ext)) {
                        fileCount++;
                        const issues = await this.scanFile(fullPath);
                        allIssues.push(...issues);
                    }
                }
            }
        };

        await scanRecursive(dirPath);

        // Count by severity
        const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
        const highCount = allIssues.filter(i => i.severity === 'high').length;
        const mediumCount = allIssues.filter(i => i.severity === 'medium').length;
        const lowCount = allIssues.filter(i => i.severity === 'low').length;

        return {
            scannedFiles: fileCount,
            totalIssues: allIssues.length,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            issues: allIssues,
            summary: this.generateSummary(allIssues),
            scanDuration: Date.now() - startTime,
        };
    }

    /**
     * Create security issue
     */
    private createIssue(
        type: VulnerabilityType,
        file: string,
        line: number,
        column: number,
        code: string
    ): SecurityIssue {
        const metadata = this.getVulnerabilityMetadata(type);

        return {
            id: `${type}_${file}_${line}`,
            type,
            severity: metadata.severity,
            file,
            line,
            column,
            code,
            description: metadata.description,
            recommendation: metadata.recommendation,
            cwe: metadata.cwe,
            owasp: metadata.owasp,
        };
    }

    /**
     * Get vulnerability metadata
     */
    private getVulnerabilityMetadata(type: VulnerabilityType) {
        const metadata: Record<VulnerabilityType, any> = {
            [VulnerabilityType.SQL_INJECTION]: {
                severity: 'critical' as const,
                description: 'Potential SQL injection vulnerability detected',
                recommendation: 'Use parameterized queries or prepared statements',
                cwe: 'CWE-89',
                owasp: 'A03:2021 – Injection',
            },
            [VulnerabilityType.XSS]: {
                severity: 'high' as const,
                description: 'Potential Cross-Site Scripting (XSS) vulnerability',
                recommendation: 'Sanitize user input and use safe DOM manipulation',
                cwe: 'CWE-79',
                owasp: 'A03:2021 – Injection',
            },
            [VulnerabilityType.HARDCODED_SECRET]: {
                severity: 'critical' as const,
                description: 'Hardcoded secret or credential detected',
                recommendation: 'Use environment variables or secure secret management',
                cwe: 'CWE-798',
                owasp: 'A07:2021 – Identification and Authentication Failures',
            },
            [VulnerabilityType.WEAK_CRYPTO]: {
                severity: 'high' as const,
                description: 'Weak cryptographic algorithm detected',
                recommendation: 'Use strong algorithms like SHA-256, bcrypt, or crypto.randomBytes',
                cwe: 'CWE-327',
                owasp: 'A02:2021 – Cryptographic Failures',
            },
            [VulnerabilityType.PATH_TRAVERSAL]: {
                severity: 'high' as const,
                description: 'Potential path traversal vulnerability',
                recommendation: 'Validate and sanitize file paths',
                cwe: 'CWE-22',
                owasp: 'A01:2021 – Broken Access Control',
            },
            [VulnerabilityType.COMMAND_INJECTION]: {
                severity: 'critical' as const,
                description: 'Potential command injection vulnerability',
                recommendation: 'Avoid dynamic command construction, use allowlists',
                cwe: 'CWE-78',
                owasp: 'A03:2021 – Injection',
            },
            [VulnerabilityType.UNSAFE_DESERIALIZATION]: {
                severity: 'critical' as const,
                description: 'Unsafe deserialization detected',
                recommendation: 'Validate and sanitize serialized data',
                cwe: 'CWE-502',
                owasp: 'A08:2021 – Software and Data Integrity Failures',
            },
            [VulnerabilityType.BROKEN_AUTH]: {
                severity: 'critical' as const,
                description: 'Broken authentication pattern detected',
                recommendation: 'Implement proper authentication mechanisms',
                cwe: 'CWE-287',
                owasp: 'A07:2021 – Identification and Authentication Failures',
            },
            [VulnerabilityType.SENSITIVE_DATA_EXPOSURE]: {
                severity: 'high' as const,
                description: 'Potential sensitive data exposure',
                recommendation: 'Encrypt sensitive data and use HTTPS',
                cwe: 'CWE-311',
                owasp: 'A02:2021 – Cryptographic Failures',
            },
            [VulnerabilityType.INSECURE_DEPENDENCY]: {
                severity: 'high' as const,
                description: 'Insecure or vulnerable dependency detected',
                recommendation: 'Update dependencies to secure versions',
                cwe: 'CWE-1035',
                owasp: 'A06:2021 – Vulnerable and Outdated Components',
            },
        };

        return metadata[type] || {
            severity: 'medium',
            description: 'Security issue detected',
            recommendation: 'Review and fix the vulnerability',
        };
    }

    /**
     * Generate summary
     */
    private generateSummary(issues: SecurityIssue[]): string {
        if (issues.length === 0) {
            return 'No security vulnerabilities detected. ✅';
        }

        const critical = issues.filter(i => i.severity === 'critical').length;
        const high = issues.filter(i => i.severity === 'high').length;

        let summary = `Found ${issues.length} security issue(s): `;
        if (critical > 0) summary += `${critical} critical, `;
        if (high > 0) summary += `${high} high`;

        return summary;
    }

    /**
     * Get security recommendations
     */
    getRecommendations(issues: SecurityIssue[]): string[] {
        const recommendations = new Set<string>();

        issues.forEach(issue => {
            recommendations.add(issue.recommendation);
        });

        return Array.from(recommendations);
    }
}

// Export singleton getter
export function getSecurityScanner(): SecurityScanner {
    return SecurityScanner.getInstance();
}
