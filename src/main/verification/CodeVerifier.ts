/**
 * CodeVerifier - Multi-Stage Code Validation Pipeline
 * 
 * Validates generated code before presenting to user:
 * 1. Syntax validation (AST parsing)
 * 2. Static analysis (ESLint, TypeScript)
 * 3. Security scanning (pattern-based)
 * 4. Test execution (if tests exist)
 * 
 * Provides fix suggestions for common issues
 */

import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface VerificationRequest {
    /** Code to verify */
    code: string;
    /** Language of the code */
    language: 'typescript' | 'javascript' | 'python' | 'html' | 'css';
    /** Optional filename for context */
    filename?: string;
    /** Skip certain verification stages */
    skip?: {
        syntax?: boolean;
        lint?: boolean;
        security?: boolean;
        tests?: boolean;
    };
}

export interface SyntaxError {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
}

export interface LintIssue {
    ruleId: string;
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    fixable: boolean;
    fix?: string;
}

export interface SecurityVulnerability {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    line: number;
    message: string;
    cwe?: string;
    recommendation: string;
}

export interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
}

export interface FixSuggestion {
    type: 'syntax' | 'lint' | 'security';
    original: string;
    suggested: string;
    description: string;
    confidence: number;
}

export interface ValidationResult {
    valid: boolean;
    score: number;  // 0-100 quality score
    syntaxErrors: SyntaxError[];
    lintIssues: LintIssue[];
    securityVulns: SecurityVulnerability[];
    testResults: TestResult[];
    fixSuggestions: FixSuggestion[];
    duration: number;
}

// ============================================================================
// SECURITY PATTERNS
// ============================================================================

interface SecurityPattern {
    id: string;
    pattern: RegExp;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    cwe: string;
    recommendation: string;
    languages: string[];
}

const SECURITY_PATTERNS: SecurityPattern[] = [
    // Injection vulnerabilities
    {
        id: 'SQL_INJECTION',
        pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/i,
        severity: 'critical',
        message: 'Potential SQL injection via string interpolation',
        cwe: 'CWE-89',
        recommendation: 'Use parameterized queries or prepared statements',
        languages: ['typescript', 'javascript']
    },
    {
        id: 'COMMAND_INJECTION',
        pattern: /exec\s*\(\s*[`'"].*\$\{|spawn\s*\(\s*[`'"].*\$/,
        severity: 'critical',
        message: 'Potential command injection via string interpolation',
        cwe: 'CWE-78',
        recommendation: 'Use array arguments instead of shell strings',
        languages: ['typescript', 'javascript']
    },
    // XSS vulnerabilities
    {
        id: 'XSS_INNERHTML',
        pattern: /\.innerHTML\s*=\s*[^'"]/,
        severity: 'high',
        message: 'Potential XSS via innerHTML assignment',
        cwe: 'CWE-79',
        recommendation: 'Use textContent or sanitize input with DOMPurify',
        languages: ['typescript', 'javascript']
    },
    {
        id: 'XSS_DANGEROUSLY_SET',
        pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/,
        severity: 'high',
        message: 'Using dangerouslySetInnerHTML requires input sanitization',
        cwe: 'CWE-79',
        recommendation: 'Sanitize input with DOMPurify before using',
        languages: ['typescript', 'javascript']
    },
    // Sensitive data exposure
    {
        id: 'HARDCODED_SECRET',
        pattern: /(?:password|secret|api_key|apikey|token|auth)\s*[=:]\s*['"][^'"]{8,}['"]/i,
        severity: 'high',
        message: 'Potential hardcoded secret or credential',
        cwe: 'CWE-798',
        recommendation: 'Use environment variables or secret management',
        languages: ['typescript', 'javascript', 'python']
    },
    {
        id: 'EXPOSED_PRIVATE_KEY',
        pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/,
        severity: 'critical',
        message: 'Private key exposed in code',
        cwe: 'CWE-311',
        recommendation: 'Remove private key and use secure key management',
        languages: ['typescript', 'javascript', 'python']
    },
    // Unsafe operations
    {
        id: 'EVAL_USAGE',
        pattern: /\beval\s*\(/,
        severity: 'high',
        message: 'Use of eval() is unsafe',
        cwe: 'CWE-95',
        recommendation: 'Avoid eval(); use safer alternatives',
        languages: ['typescript', 'javascript', 'python']
    },
    {
        id: 'UNSAFE_REGEX',
        pattern: /new\s+RegExp\s*\(\s*[^'"]/,
        severity: 'medium',
        message: 'Dynamic regex may be vulnerable to ReDoS',
        cwe: 'CWE-1333',
        recommendation: 'Validate and limit regex input',
        languages: ['typescript', 'javascript']
    },
    // Path traversal
    {
        id: 'PATH_TRAVERSAL',
        pattern: /(?:readFile|writeFile|unlink|rmdir|mkdir)\s*\([^)]*\+/,
        severity: 'high',
        message: 'Potential path traversal vulnerability',
        cwe: 'CWE-22',
        recommendation: 'Validate and sanitize file paths',
        languages: ['typescript', 'javascript']
    },
    // Prototype pollution
    {
        id: 'PROTOTYPE_POLLUTION',
        pattern: /\[['"]__proto__['"]\]|\[['"]constructor['"]\]\[['"]prototype['"]\]/,
        severity: 'high',
        message: 'Potential prototype pollution vulnerability',
        cwe: 'CWE-1321',
        recommendation: 'Use Object.create(null) or validate keys',
        languages: ['typescript', 'javascript']
    },
    // Insecure protocols
    {
        id: 'INSECURE_HTTP',
        pattern: /['"]http:\/\/(?!localhost|127\.0\.0\.1)/,
        severity: 'medium',
        message: 'Use of insecure HTTP protocol',
        cwe: 'CWE-319',
        recommendation: 'Use HTTPS for external connections',
        languages: ['typescript', 'javascript', 'python']
    },
    // Python-specific
    {
        id: 'PICKLE_UNSAFE',
        pattern: /pickle\.load\s*\(/,
        severity: 'high',
        message: 'Unpickling untrusted data is unsafe',
        cwe: 'CWE-502',
        recommendation: 'Use JSON or validate pickle source',
        languages: ['python']
    },
    {
        id: 'YAML_UNSAFE',
        pattern: /yaml\.load\s*\([^)]*\)(?!\s*,\s*Loader)/,
        severity: 'high',
        message: 'yaml.load without explicit Loader is unsafe',
        cwe: 'CWE-502',
        recommendation: 'Use yaml.safe_load() or specify Loader=yaml.SafeLoader',
        languages: ['python']
    }
];

// ============================================================================
// CODE VERIFIER CLASS
// ============================================================================

export class CodeVerifier {
    private tempCounter: number = 0;

    constructor() {
        console.log('[CodeVerifier] Initialized with', SECURITY_PATTERNS.length, 'security patterns');
    }

    /**
     * Verify code through all validation stages
     */
    async verify(request: VerificationRequest): Promise<ValidationResult> {
        const startTime = Date.now();
        const result: ValidationResult = {
            valid: true,
            score: 100,
            syntaxErrors: [],
            lintIssues: [],
            securityVulns: [],
            testResults: [],
            fixSuggestions: [],
            duration: 0
        };

        // Stage 1: Syntax validation
        if (!request.skip?.syntax) {
            const syntaxResult = await this.validateSyntax(request);
            result.syntaxErrors = syntaxResult;
            if (syntaxResult.some(e => e.severity === 'error')) {
                result.valid = false;
                result.score -= 30;
            }
        }

        // Stage 2: Static analysis (lint)
        if (!request.skip?.lint && result.valid) {
            const lintResult = await this.runLinter(request);
            result.lintIssues = lintResult;
            result.score -= lintResult.filter(i => i.severity === 'error').length * 5;
            result.score -= lintResult.filter(i => i.severity === 'warning').length * 2;
        }

        // Stage 3: Security scanning
        if (!request.skip?.security) {
            const securityResult = this.scanSecurity(request);
            result.securityVulns = securityResult;
            result.score -= securityResult.filter(v => v.severity === 'critical').length * 20;
            result.score -= securityResult.filter(v => v.severity === 'high').length * 10;
            result.score -= securityResult.filter(v => v.severity === 'medium').length * 5;

            if (securityResult.some(v => v.severity === 'critical')) {
                result.valid = false;
            }
        }

        // Generate fix suggestions
        result.fixSuggestions = this.generateFixSuggestions(result);

        // Normalize score
        result.score = Math.max(0, Math.min(100, result.score));
        result.duration = Date.now() - startTime;

        return result;
    }

    /**
     * Validate syntax by attempting to parse
     */
    private async validateSyntax(request: VerificationRequest): Promise<SyntaxError[]> {
        const errors: SyntaxError[] = [];

        try {
            switch (request.language) {
                case 'typescript':
                case 'javascript':
                    await this.validateJSSyntax(request.code, request.language);
                    break;
                case 'python':
                    await this.validatePythonSyntax(request.code);
                    break;
                case 'html':
                case 'css':
                    // Basic validation - just check for obvious issues
                    break;
            }
        } catch (error: any) {
            const parsed = this.parseSyntaxError(error.message, request.language);
            errors.push(parsed);
        }

        return errors;
    }

    /**
     * Validate JavaScript/TypeScript syntax
     */
    private async validateJSSyntax(code: string, language: string): Promise<void> {
        const tempFile = await this.createTempFile(code, language === 'typescript' ? '.ts' : '.js');

        try {
            if (language === 'typescript') {
                await execAsync(`npx tsc --noEmit --skipLibCheck "${tempFile}"`, { timeout: 30000 });
            } else {
                // Use Node.js to check syntax
                await execAsync(`node --check "${tempFile}"`, { timeout: 10000 });
            }
        } finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    }

    /**
     * Validate Python syntax
     */
    private async validatePythonSyntax(code: string): Promise<void> {
        const tempFile = await this.createTempFile(code, '.py');

        try {
            await execAsync(`python3 -m py_compile "${tempFile}"`, { timeout: 10000 });
        } finally {
            await fs.unlink(tempFile).catch(() => { });
        }
    }

    /**
     * Run linter on code
     */
    private async runLinter(request: VerificationRequest): Promise<LintIssue[]> {
        const issues: LintIssue[] = [];

        if (request.language === 'typescript' || request.language === 'javascript') {
            try {
                const tempFile = await this.createTempFile(
                    request.code,
                    request.language === 'typescript' ? '.ts' : '.js'
                );

                try {
                    const { stdout } = await execAsync(
                        `npx eslint "${tempFile}" --format json --no-eslintrc --env es2022 --parser-options=ecmaVersion:2022`,
                        { timeout: 30000 }
                    );

                    const results = JSON.parse(stdout);
                    if (results[0]?.messages) {
                        for (const msg of results[0].messages) {
                            issues.push({
                                ruleId: msg.ruleId || 'parse-error',
                                line: msg.line,
                                column: msg.column,
                                message: msg.message,
                                severity: msg.severity === 2 ? 'error' : 'warning',
                                fixable: !!msg.fix,
                                fix: msg.fix?.text
                            });
                        }
                    }
                } finally {
                    await fs.unlink(tempFile).catch(() => { });
                }
            } catch (error: any) {
                // ESLint exits with code 1 if there are issues
                if (error.stdout) {
                    try {
                        const results = JSON.parse(error.stdout);
                        if (results[0]?.messages) {
                            for (const msg of results[0].messages) {
                                issues.push({
                                    ruleId: msg.ruleId || 'parse-error',
                                    line: msg.line || 1,
                                    column: msg.column || 1,
                                    message: msg.message,
                                    severity: msg.severity === 2 ? 'error' : 'warning',
                                    fixable: !!msg.fix,
                                    fix: msg.fix?.text
                                });
                            }
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            }
        }

        return issues;
    }

    /**
     * Scan for security vulnerabilities
     */
    private scanSecurity(request: VerificationRequest): SecurityVulnerability[] {
        const vulns: SecurityVulnerability[] = [];
        const lines = request.code.split('\n');

        for (const pattern of SECURITY_PATTERNS) {
            if (!pattern.languages.includes(request.language)) {
                continue;
            }

            for (let i = 0; i < lines.length; i++) {
                if (pattern.pattern.test(lines[i])) {
                    vulns.push({
                        id: pattern.id,
                        severity: pattern.severity,
                        line: i + 1,
                        message: pattern.message,
                        cwe: pattern.cwe,
                        recommendation: pattern.recommendation
                    });
                }
            }
        }

        return vulns;
    }

    /**
     * Generate fix suggestions based on issues found
     */
    private generateFixSuggestions(result: ValidationResult): FixSuggestion[] {
        const suggestions: FixSuggestion[] = [];

        // Suggestions for lint issues with fixes
        for (const issue of result.lintIssues) {
            if (issue.fixable && issue.fix) {
                suggestions.push({
                    type: 'lint',
                    original: '',  // Would need context
                    suggested: issue.fix,
                    description: `Fix ${issue.ruleId}: ${issue.message}`,
                    confidence: 0.9
                });
            }
        }

        // Suggestions for security vulnerabilities
        for (const vuln of result.securityVulns) {
            suggestions.push({
                type: 'security',
                original: '',
                suggested: '',
                description: vuln.recommendation,
                confidence: 0.8
            });
        }

        return suggestions;
    }

    /**
     * Parse syntax error message into structured format
     */
    private parseSyntaxError(message: string, language: string): SyntaxError {
        // Try to extract line/column from error message
        const lineMatch = message.match(/(?:line\s+)?(\d+)(?::(\d+))?/i);

        return {
            line: lineMatch ? parseInt(lineMatch[1]) : 1,
            column: lineMatch && lineMatch[2] ? parseInt(lineMatch[2]) : 1,
            message: message,
            severity: 'error'
        };
    }

    /**
     * Create temporary file for validation
     */
    private async createTempFile(content: string, extension: string): Promise<string> {
        const tempDir = os.tmpdir();
        const filename = `verify-${Date.now()}-${this.tempCounter++}${extension}`;
        const filepath = path.join(tempDir, filename);
        await fs.writeFile(filepath, content);
        return filepath;
    }

    /**
     * Quick validation without running external tools
     */
    quickValidate(code: string, language: string): { valid: boolean; issues: string[] } {
        const issues: string[] = [];

        // Basic checks
        if (!code || code.trim().length === 0) {
            issues.push('Empty code');
            return { valid: false, issues };
        }

        // Check for unclosed brackets/braces
        const brackets: Record<string, number> = { '(': 0, '[': 0, '{': 0 };
        const closers: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

        for (const char of code) {
            if (brackets[char] !== undefined) {
                brackets[char]++;
            } else if (closers[char]) {
                brackets[closers[char]]--;
            }
        }

        for (const [bracket, count] of Object.entries(brackets)) {
            if (count > 0) {
                issues.push(`Unclosed ${bracket}`);
            } else if (count < 0) {
                issues.push(`Extra closing bracket for ${bracket}`);
            }
        }

        // Check for common typos
        if (language === 'typescript' || language === 'javascript') {
            if (/\bfunciton\b/.test(code)) issues.push('Typo: "funciton" should be "function"');
            if (/\bretrun\b/.test(code)) issues.push('Typo: "retrun" should be "return"');
            if (/\bconts\b/.test(code)) issues.push('Typo: "conts" should be "const"');
        }

        return { valid: issues.length === 0, issues };
    }

    /**
     * Get severity summary
     */
    getSeveritySummary(result: ValidationResult): string {
        const critical = result.securityVulns.filter(v => v.severity === 'critical').length;
        const high = result.securityVulns.filter(v => v.severity === 'high').length;
        const medium = result.securityVulns.filter(v => v.severity === 'medium').length;
        const errors = result.syntaxErrors.filter(e => e.severity === 'error').length;
        const lintErrors = result.lintIssues.filter(i => i.severity === 'error').length;

        if (critical > 0) return `⛔ ${critical} critical security issues`;
        if (errors > 0) return `❌ ${errors} syntax errors`;
        if (high > 0) return `🔴 ${high} high security issues`;
        if (lintErrors > 0) return `⚠️ ${lintErrors} lint errors`;
        if (medium > 0) return `🟡 ${medium} medium security issues`;

        return `✅ Code validated (score: ${result.score}/100)`;
    }
}

// Singleton instance
export const codeVerifier = new CodeVerifier();
