/**
 * RedTeamAgent - Adversarial Testing
 * 
 * Implements ChatGPT's suggestion for:
 * - Built-in adversarial agents that try to break suggestions
 * - Security vulnerability injection testing
 * - Edge case discovery
 * - Robustness validation
 */

import { EventEmitter } from 'events';

export interface RedTeamResult {
    passed: boolean;
    vulnerabilities: Vulnerability[];
    edgeCases: EdgeCase[];
    robustnessScore: number;
    recommendations: string[];
}

export interface Vulnerability {
    id: string;
    type: 'injection' | 'xss' | 'auth' | 'data_leak' | 'dos' | 'logic' | 'race_condition';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location?: string;
    proof?: string;
    remediation: string;
}

export interface EdgeCase {
    id: string;
    category: 'input' | 'state' | 'concurrency' | 'boundary' | 'error';
    description: string;
    input: any;
    expectedBehavior: string;
    actualBehavior?: string;
    status: 'pass' | 'fail' | 'undefined';
}

export interface AttackVector {
    name: string;
    category: string;
    payload: any;
    description: string;
}

/**
 * RedTeamAgent performs adversarial testing on code and suggestions
 */
export class RedTeamAgent extends EventEmitter {
    private static instance: RedTeamAgent;
    private attackVectors: AttackVector[] = [];

    private constructor() {
        super();
        this.initializeAttackVectors();
    }

    static getInstance(): RedTeamAgent {
        if (!RedTeamAgent.instance) {
            RedTeamAgent.instance = new RedTeamAgent();
        }
        return RedTeamAgent.instance;
    }

    /**
     * Initialize common attack vectors
     */
    private initializeAttackVectors(): void {
        this.attackVectors = [
            // SQL Injection
            { name: 'SQL Injection - Basic', category: 'injection', payload: "'; DROP TABLE users; --", description: 'Basic SQL injection' },
            { name: 'SQL Injection - Union', category: 'injection', payload: "' UNION SELECT * FROM users --", description: 'Union-based SQL injection' },

            // XSS
            { name: 'XSS - Script', category: 'xss', payload: '<script>alert("XSS")</script>', description: 'Basic XSS script injection' },
            { name: 'XSS - Event', category: 'xss', payload: '<img onerror="alert(1)" src=x>', description: 'Event handler XSS' },
            { name: 'XSS - SVG', category: 'xss', payload: '<svg onload="alert(1)">', description: 'SVG-based XSS' },

            // Command Injection
            { name: 'Command Injection', category: 'injection', payload: '; cat /etc/passwd', description: 'OS command injection' },
            { name: 'Path Traversal', category: 'injection', payload: '../../../etc/passwd', description: 'Path traversal attack' },

            // Auth Bypass
            { name: 'Auth Bypass - Admin', category: 'auth', payload: { role: 'admin', isAdmin: true }, description: 'Role elevation attempt' },
            { name: 'Auth Bypass - JWT', category: 'auth', payload: 'eyJhbGciOiJub25lIn0...', description: 'JWT none algorithm' },

            // DoS
            { name: 'ReDoS', category: 'dos', payload: 'a'.repeat(10000) + 'b', description: 'Regular expression DoS' },
            { name: 'Large Payload', category: 'dos', payload: 'x'.repeat(1000000), description: 'Large input payload' },

            // Logic Flaws
            { name: 'Negative Value', category: 'logic', payload: -1, description: 'Negative number in positive-only field' },
            { name: 'Zero Division', category: 'logic', payload: 0, description: 'Division by zero' },
            { name: 'Max Int', category: 'logic', payload: Number.MAX_SAFE_INTEGER + 1, description: 'Integer overflow' },
        ];

        console.log(`🔴 [RedTeamAgent] Initialized with ${this.attackVectors.length} attack vectors`);
    }

    /**
     * Test code for vulnerabilities
     */
    async testCode(params: {
        code: string;
        language: string;
        context?: Record<string, any>;
    }): Promise<RedTeamResult> {
        console.log(`🔴 [RedTeamAgent] Testing code for vulnerabilities...`);
        this.emit('testStart', params);

        const vulnerabilities: Vulnerability[] = [];
        const edgeCases: EdgeCase[] = [];

        // Check for common vulnerability patterns
        vulnerabilities.push(...this.checkInjectionVulnerabilities(params.code, params.language));
        vulnerabilities.push(...this.checkAuthVulnerabilities(params.code, params.language));
        vulnerabilities.push(...this.checkDataLeakVulnerabilities(params.code, params.language));
        vulnerabilities.push(...this.checkLogicVulnerabilities(params.code, params.language));

        // Generate edge cases
        edgeCases.push(...this.generateEdgeCases(params.code, params.language));

        // Calculate robustness score
        const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
        const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
        const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;

        const robustnessScore = Math.max(0, 1 - (criticalCount * 0.3 + highCount * 0.15 + mediumCount * 0.05));

        // Generate recommendations
        const recommendations = this.generateRecommendations(vulnerabilities);

        const result: RedTeamResult = {
            passed: vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
            vulnerabilities,
            edgeCases,
            robustnessScore,
            recommendations,
        };

        this.emit('testComplete', result);
        console.log(`🔴 [RedTeamAgent] Found ${vulnerabilities.length} vulnerabilities, robustness: ${(robustnessScore * 100).toFixed(1)}%`);

        return result;
    }

    /**
     * Check for injection vulnerabilities
     */
    private checkInjectionVulnerabilities(code: string, language: string): Vulnerability[] {
        const vulns: Vulnerability[] = [];
        const codeLower = code.toLowerCase();

        // SQL Injection patterns
        const sqlPatterns = [
            { pattern: /query\s*\(\s*[`'"].*\$\{.*\}.*[`'"]/i, description: 'Template literal in SQL query' },
            { pattern: /query\s*\(\s*['"].*\+.*['"].*\)/i, description: 'String concatenation in SQL' },
            { pattern: /execute\s*\(.*\+.*\)/i, description: 'Dynamic SQL execution' },
        ];

        for (const { pattern, description } of sqlPatterns) {
            if (pattern.test(code)) {
                vulns.push({
                    id: `vuln-sql-${Date.now()}`,
                    type: 'injection',
                    severity: 'critical',
                    description: `SQL Injection: ${description}`,
                    remediation: 'Use parameterized queries or prepared statements',
                });
            }
        }

        // Command injection
        if (/exec\s*\(|system\s*\(|shell_exec|child_process\.exec/.test(code)) {
            if (/\+|`\$\{|req\.|params\.|query\./.test(code)) {
                vulns.push({
                    id: `vuln-cmd-${Date.now()}`,
                    type: 'injection',
                    severity: 'critical',
                    description: 'Command Injection: Dynamic shell command execution',
                    remediation: 'Use execFile with argument array, never interpolate user input into commands',
                });
            }
        }

        // XSS patterns
        if (language === 'javascript' || language === 'typescript') {
            if (/innerHTML\s*=|document\.write|dangerouslySetInnerHTML/.test(code)) {
                if (/\$\{|props\.|state\.|data\./.test(code)) {
                    vulns.push({
                        id: `vuln-xss-${Date.now()}`,
                        type: 'xss',
                        severity: 'high',
                        description: 'XSS: Unsafe HTML rendering with dynamic content',
                        remediation: 'Sanitize HTML or use safe rendering methods',
                    });
                }
            }
        }

        // Eval usage
        if (/eval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*['"]/i.test(code)) {
            vulns.push({
                id: `vuln-eval-${Date.now()}`,
                type: 'injection',
                severity: 'high',
                description: 'Code Injection: Use of eval or dynamic code execution',
                remediation: 'Avoid eval; use JSON.parse for data, proper parsers for expressions',
            });
        }

        return vulns;
    }

    /**
     * Check for authentication vulnerabilities
     */
    private checkAuthVulnerabilities(code: string, language: string): Vulnerability[] {
        const vulns: Vulnerability[] = [];

        // Hardcoded secrets
        if (/password\s*=\s*['"][^'"]+['"]|api[_-]?key\s*=\s*['"][^'"]+['"]/i.test(code)) {
            vulns.push({
                id: `vuln-secret-${Date.now()}`,
                type: 'data_leak',
                severity: 'critical',
                description: 'Hardcoded credentials or API keys',
                remediation: 'Use environment variables or secrets management',
            });
        }

        // Weak password validation
        if (/password\.length\s*[<>=]+\s*[0-5]|minLength:\s*[0-5]/.test(code)) {
            vulns.push({
                id: `vuln-weak-pass-${Date.now()}`,
                type: 'auth',
                severity: 'medium',
                description: 'Weak password policy (length < 6)',
                remediation: 'Require minimum 8 characters with complexity',
            });
        }

        // JWT without verification
        if (/jwt\.decode\s*\((?!.*verify)/i.test(code)) {
            vulns.push({
                id: `vuln-jwt-${Date.now()}`,
                type: 'auth',
                severity: 'high',
                description: 'JWT decoded without signature verification',
                remediation: 'Use jwt.verify with a proper secret key',
            });
        }

        return vulns;
    }

    /**
     * Check for data leak vulnerabilities
     */
    private checkDataLeakVulnerabilities(code: string, language: string): Vulnerability[] {
        const vulns: Vulnerability[] = [];

        // Logging sensitive data
        if (/console\.log.*(?:password|secret|token|apiKey|creditCard)/i.test(code)) {
            vulns.push({
                id: `vuln-log-${Date.now()}`,
                type: 'data_leak',
                severity: 'medium',
                description: 'Logging sensitive data',
                remediation: 'Remove sensitive data from logs or mask it',
            });
        }

        // Exposing full error details
        if (/res\.send\s*\(\s*err\s*\)|res\.json\s*\(\s*\{\s*error:\s*err\s*\}\s*\)/.test(code)) {
            vulns.push({
                id: `vuln-error-${Date.now()}`,
                type: 'data_leak',
                severity: 'medium',
                description: 'Exposing full error details to client',
                remediation: 'Return generic error messages, log details server-side',
            });
        }

        return vulns;
    }

    /**
     * Check for logic vulnerabilities
     */
    private checkLogicVulnerabilities(code: string, language: string): Vulnerability[] {
        const vulns: Vulnerability[] = [];

        // Race conditions
        if (/async.*await.*(?:update|insert|delete).*async.*await.*(?:update|insert|delete)/is.test(code)) {
            vulns.push({
                id: `vuln-race-${Date.now()}`,
                type: 'race_condition',
                severity: 'medium',
                description: 'Potential race condition in async operations',
                remediation: 'Use transactions or optimistic locking',
            });
        }

        // Missing input validation
        if (/req\.(?:body|params|query)\.\w+/.test(code) && !/validate|sanitize|joi|zod|yup/.test(code)) {
            vulns.push({
                id: `vuln-validation-${Date.now()}`,
                type: 'logic',
                severity: 'medium',
                description: 'Missing input validation',
                remediation: 'Validate and sanitize all user inputs',
            });
        }

        return vulns;
    }

    /**
     * Generate edge cases for testing
     */
    private generateEdgeCases(code: string, language: string): EdgeCase[] {
        const cases: EdgeCase[] = [];
        let caseId = 0;

        // Input edge cases
        cases.push(
            {
                id: `edge-${++caseId}`,
                category: 'input',
                description: 'Empty string input',
                input: '',
                expectedBehavior: 'Should handle gracefully',
                status: 'undefined',
            },
            {
                id: `edge-${++caseId}`,
                category: 'input',
                description: 'Null input',
                input: null,
                expectedBehavior: 'Should not crash',
                status: 'undefined',
            },
            {
                id: `edge-${++caseId}`,
                category: 'input',
                description: 'Very long string',
                input: 'x'.repeat(10000),
                expectedBehavior: 'Should handle or reject gracefully',
                status: 'undefined',
            },
            {
                id: `edge-${++caseId}`,
                category: 'boundary',
                description: 'Negative number',
                input: -1,
                expectedBehavior: 'Should validate for positive-only fields',
                status: 'undefined',
            },
            {
                id: `edge-${++caseId}`,
                category: 'boundary',
                description: 'Zero value',
                input: 0,
                expectedBehavior: 'Should handle division/modulo safely',
                status: 'undefined',
            },
            {
                id: `edge-${++caseId}`,
                category: 'input',
                description: 'Unicode/emoji input',
                input: '🔥💥🎉 Test 测试 テスト',
                expectedBehavior: 'Should handle UTF-8 properly',
                status: 'undefined',
            },
        );

        return cases;
    }

    /**
     * Generate recommendations based on vulnerabilities
     */
    private generateRecommendations(vulns: Vulnerability[]): string[] {
        const recommendations: string[] = [];
        const types = new Set(vulns.map(v => v.type));

        if (types.has('injection')) {
            recommendations.push('Implement input validation and use parameterized queries');
        }
        if (types.has('xss')) {
            recommendations.push('Sanitize all user-generated content before rendering');
        }
        if (types.has('auth')) {
            recommendations.push('Review authentication flow and strengthen password policies');
        }
        if (types.has('data_leak')) {
            recommendations.push('Audit logging and error handling for data exposure');
        }
        if (vulns.length === 0) {
            recommendations.push('Code passed basic security checks - consider fuzzing for deeper analysis');
        }

        return recommendations;
    }

    /**
     * Get all attack vectors
     */
    getAttackVectors(): AttackVector[] {
        return [...this.attackVectors];
    }

    /**
     * Add custom attack vector
     */
    addAttackVector(vector: AttackVector): void {
        this.attackVectors.push(vector);
    }
}

export default RedTeamAgent;
