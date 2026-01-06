/**
 * Code Quality Scanner
 * 
 * Comprehensive code analysis tool for:
 * - Security vulnerabilities
 * - Performance issues
 * - Best practices
 * - Accessibility
 */

export interface SecurityIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    line?: number;
    suggestion: string;
}

export interface PerformanceIssue {
    id: string;
    impact: 'high' | 'medium' | 'low';
    type: string;
    description: string;
    line?: number;
    suggestion: string;
}

export interface QualityScanResult {
    security: SecurityIssue[];
    performance: PerformanceIssue[];
    accessibility: any[];
    bestPractices: any[];
    score: number; // 0-100
    summary: string;
}

class CodeQualityScanner {

    /**
     * Scan code for security vulnerabilities
     */
    scanSecurity(code: string, language: string): SecurityIssue[] {
        const issues: SecurityIssue[] = [];
        const lines = code.split('\n');

        // Check for common security issues
        const patterns = [
            {
                pattern: /eval\s*\(/gi,
                type: 'code-injection',
                severity: 'critical' as const,
                description: 'Use of eval() can lead to code injection',
                suggestion: 'Replace eval() with JSON.parse() or safer alternatives'
            },
            {
                pattern: /innerHTML\s*=/gi,
                type: 'xss',
                severity: 'high' as const,
                description: 'Using innerHTML can lead to XSS vulnerabilities',
                suggestion: 'Use textContent or a sanitization library'
            },
            {
                pattern: /SELECT\s+\*\s+FROM.*WHERE.*\+/gi,
                type: 'sql-injection',
                severity: 'critical' as const,
                description: 'Potential SQL injection vulnerability',
                suggestion: 'Use parameterized queries or prepared statements'
            },
            {
                pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi,
                type: 'hardcoded-secrets',
                severity: 'critical' as const,
                description: 'Hardcoded password detected',
                suggestion: 'Use environment variables for secrets'
            },
            {
                pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
                type: 'hardcoded-secrets',
                severity: 'critical' as const,
                description: 'Hardcoded API key detected',
                suggestion: 'Use environment variables for API keys'
            },
            {
                pattern: /console\.(log|debug|info)\(/gi,
                type: 'debug-code',
                severity: 'low' as const,
                description: 'Console logging in production code',
                suggestion: 'Remove console statements or use a logging library'
            },
            {
                pattern: /http:\/\//gi,
                type: 'insecure-protocol',
                severity: 'medium' as const,
                description: 'Using insecure HTTP protocol',
                suggestion: 'Use HTTPS for secure communication'
            },
            {
                pattern: /dangerouslySetInnerHTML/gi,
                type: 'xss',
                severity: 'high' as const,
                description: 'React dangerouslySetInnerHTML can lead to XSS',
                suggestion: 'Sanitize HTML content before rendering'
            },
        ];

        lines.forEach((line, index) => {
            patterns.forEach(({ pattern, type, severity, description, suggestion }) => {
                if (pattern.test(line)) {
                    issues.push({
                        id: `sec_${Date.now()}_${index}`,
                        severity,
                        type,
                        description,
                        line: index + 1,
                        suggestion
                    });
                }
            });
        });

        return issues;
    }

    /**
     * Scan for performance issues
     */
    scanPerformance(code: string, language: string): PerformanceIssue[] {
        const issues: PerformanceIssue[] = [];
        const lines = code.split('\n');

        const patterns = [
            {
                pattern: /for\s*\([^)]*\.length/gi,
                type: 'loop-optimization',
                impact: 'medium' as const,
                description: 'Accessing .length in loop condition',
                suggestion: 'Cache array length before loop'
            },
            {
                pattern: /\.forEach\s*\([^)]*await/gi,
                type: 'async-iteration',
                impact: 'high' as const,
                description: 'Async operation in forEach',
                suggestion: 'Use for...of loop for async iteration'
            },
            {
                pattern: /new RegExp\(/gi,
                type: 'regex-compilation',
                impact: 'medium' as const,
                description: 'Creating RegExp in a loop or hot path',
                suggestion: 'Cache regular expressions outside loops'
            },
            {
                pattern: /JSON\.parse\(JSON\.stringify/gi,
                type: 'deep-clone',
                impact: 'medium' as const,
                description: 'Using JSON methods for deep cloning',
                suggestion: 'Use structuredClone() or a proper deep clone library'
            },
            {
                pattern: /document\.getElementById\(/gi,
                type: 'dom-query',
                impact: 'low' as const,
                description: 'Consider caching DOM queries',
                suggestion: 'Cache DOM element references if used repeatedly'
            },
            {
                pattern: /\.\*\s+FROM\s+\w+\s+(?!WHERE)/gi,
                type: 'select-star',
                impact: 'medium' as const,
                description: 'SELECT * without conditions',
                suggestion: 'Select only needed columns and add WHERE clause'
            },
        ];

        lines.forEach((line, index) => {
            patterns.forEach(({ pattern, type, impact, description, suggestion }) => {
                if (pattern.test(line)) {
                    issues.push({
                        id: `perf_${Date.now()}_${index}`,
                        impact,
                        type,
                        description,
                        line: index + 1,
                        suggestion
                    });
                }
            });
        });

        return issues;
    }

    /**
     * Full quality scan
     */
    async fullScan(code: string, language: string): Promise<QualityScanResult> {
        const security = this.scanSecurity(code, language);
        const performance = this.scanPerformance(code, language);

        // Calculate score
        const securityPenalty = security.reduce((sum, issue) => {
            switch (issue.severity) {
                case 'critical': return sum + 25;
                case 'high': return sum + 15;
                case 'medium': return sum + 10;
                case 'low': return sum + 5;
                default: return sum;
            }
        }, 0);

        const performancePenalty = performance.reduce((sum, issue) => {
            switch (issue.impact) {
                case 'high': return sum + 10;
                case 'medium': return sum + 5;
                case 'low': return sum + 2;
                default: return sum;
            }
        }, 0);

        const score = Math.max(0, 100 - securityPenalty - performancePenalty);

        const summary = this.generateSummary(security, performance, score);

        return {
            security,
            performance,
            accessibility: [],
            bestPractices: [],
            score,
            summary
        };
    }

    private generateSummary(
        security: SecurityIssue[],
        performance: PerformanceIssue[],
        score: number
    ): string {
        const criticalCount = security.filter(i => i.severity === 'critical').length;
        const highCount = security.filter(i => i.severity === 'high').length;

        let summary = `Code Quality Score: ${score}/100\n\n`;

        if (criticalCount > 0) {
            summary += `⛔ ${criticalCount} CRITICAL security issue(s) found!\n`;
        }
        if (highCount > 0) {
            summary += `⚠️ ${highCount} high severity security issue(s) found\n`;
        }
        if (performance.length > 0) {
            summary += `⚡ ${performance.length} performance improvement(s) suggested\n`;
        }
        if (score >= 90) {
            summary += '\n✅ Excellent code quality!';
        } else if (score >= 70) {
            summary += '\n👍 Good code quality with room for improvement';
        } else if (score >= 50) {
            summary += '\n⚠️ Code quality needs attention';
        } else {
            summary += '\n❌ Critical issues require immediate attention';
        }

        return summary;
    }
}

export const codeQualityScanner = new CodeQualityScanner();
