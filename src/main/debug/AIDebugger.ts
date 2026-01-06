/**
 * AI Debugging Assistant
 * Intelligent bug detection and fix suggestions
 */

import { EventEmitter } from 'events';

export interface DebugContext {
    code: string;
    file: string;
    language: string;
    error?: string;
    stackTrace?: string;
    logs?: string[];
}

export interface DebugResult {
    id: string;
    issues: DebugIssue[];
    suggestions: DebugSuggestion[];
    explanation: string;
    timestamp: number;
}

export interface DebugIssue {
    type: 'error' | 'warning' | 'performance' | 'logic' | 'security';
    line: number;
    column?: number;
    message: string;
    code: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DebugSuggestion {
    issueId?: string;
    title: string;
    description: string;
    oldCode: string;
    newCode: string;
    confidence: number;
}

/**
 * AIDebugger
 * AI-powered debugging and issue detection
 */
export class AIDebugger extends EventEmitter {
    private static instance: AIDebugger;
    private debugHistory: DebugResult[] = [];

    private constructor() {
        super();
    }

    static getInstance(): AIDebugger {
        if (!AIDebugger.instance) {
            AIDebugger.instance = new AIDebugger();
        }
        return AIDebugger.instance;
    }

    /**
     * Analyze code for issues
     */
    async analyzeCode(context: DebugContext): Promise<DebugResult> {
        const id = `debug_${Date.now()}`;
        this.emit('analyzing', { id, file: context.file });

        const issues = this.detectIssues(context);
        const suggestions = this.generateSuggestions(context, issues);
        const explanation = this.generateExplanation(context, issues);

        const result: DebugResult = {
            id,
            issues,
            suggestions,
            explanation,
            timestamp: Date.now(),
        };

        this.debugHistory.push(result);
        this.emit('analyzed', result);

        return result;
    }

    /**
     * Detect issues in code
     */
    private detectIssues(context: DebugContext): DebugIssue[] {
        const issues: DebugIssue[] = [];
        const lines = context.code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Null pointer risks
            if (/\.\w+\s*\(/.test(line) && !/\?\.\w+/.test(line) && /\w+\s*=\s*null|\w+\s*=\s*undefined/.test(context.code)) {
                const match = line.match(/(\w+)\.\w+/);
                if (match) {
                    issues.push({
                        type: 'error',
                        line: lineNum,
                        message: `Potential null pointer: '${match[1]}' may be null/undefined`,
                        code: line.trim(),
                        severity: 'high',
                    });
                }
            }

            // Infinite loop risk
            if (/while\s*\(\s*true\s*\)/.test(line) || /for\s*\(\s*;\s*;\s*\)/.test(line)) {
                issues.push({
                    type: 'logic',
                    line: lineNum,
                    message: 'Potential infinite loop detected',
                    code: line.trim(),
                    severity: 'high',
                });
            }

            // Memory leak patterns
            if (/setInterval|setTimeout/.test(line) && !/clearInterval|clearTimeout/.test(context.code)) {
                issues.push({
                    type: 'performance',
                    line: lineNum,
                    message: 'Timer not cleared - potential memory leak',
                    code: line.trim(),
                    severity: 'medium',
                });
            }

            // Hardcoded credentials
            if (/password\s*=\s*['"][^'"]+['"]|api_?key\s*=\s*['"][^'"]+['"]|secret\s*=\s*['"][^'"]+['"]/i.test(line)) {
                issues.push({
                    type: 'security',
                    line: lineNum,
                    message: 'Hardcoded credential detected',
                    code: line.trim(),
                    severity: 'critical',
                });
            }

            // Async without await
            if (/async\s+function/.test(line) || /async\s*\(/.test(line)) {
                const funcEnd = this.findFunctionEnd(lines, i);
                const funcBody = lines.slice(i, funcEnd).join('\n');
                if (!/await\s+/.test(funcBody) && !/return\s+\w+\s*\(/.test(funcBody)) {
                    issues.push({
                        type: 'warning',
                        line: lineNum,
                        message: 'Async function without await',
                        code: line.trim(),
                        severity: 'low',
                    });
                }
            }

            // Type coercion issues
            if (/==\s*(?!null)(?!undefined)/.test(line) && !/===/.test(line)) {
                issues.push({
                    type: 'warning',
                    line: lineNum,
                    message: 'Loose equality check - use === instead',
                    code: line.trim(),
                    severity: 'low',
                });
            }

            // Variable shadowing
            const varMatch = line.match(/(?:let|const|var)\s+(\w+)/);
            if (varMatch) {
                const varName = varMatch[1];
                for (let j = 0; j < i; j++) {
                    if (new RegExp(`(?:let|const|var)\\s+${varName}\\b`).test(lines[j])) {
                        issues.push({
                            type: 'warning',
                            line: lineNum,
                            message: `Variable '${varName}' shadows earlier declaration`,
                            code: line.trim(),
                            severity: 'medium',
                        });
                        break;
                    }
                }
            }

            // Array mutation in loop
            if (/\.forEach\s*\(/.test(line) || /for\s*\(/.test(line)) {
                const loopEnd = this.findBlockEnd(lines, i);
                const loopBody = lines.slice(i, loopEnd).join('\n');
                if (/\.push\s*\(|\.pop\s*\(|\.splice\s*\(/.test(loopBody)) {
                    issues.push({
                        type: 'logic',
                        line: lineNum,
                        message: 'Array mutation inside loop may cause issues',
                        code: line.trim(),
                        severity: 'medium',
                    });
                }
            }
        }

        // Parse error from stacktrace
        if (context.error && context.stackTrace) {
            const lineMatch = context.stackTrace.match(/:(\d+):\d+/);
            const errorLine = lineMatch ? parseInt(lineMatch[1], 10) : 1;

            issues.unshift({
                type: 'error',
                line: errorLine,
                message: context.error,
                code: lines[errorLine - 1]?.trim() || '',
                severity: 'critical',
            });
        }

        return issues;
    }

    /**
     * Generate fix suggestions
     */
    private generateSuggestions(context: DebugContext, issues: DebugIssue[]): DebugSuggestion[] {
        const suggestions: DebugSuggestion[] = [];

        for (const issue of issues) {
            let suggestion: DebugSuggestion | null = null;

            switch (issue.type) {
                case 'security':
                    if (issue.message.includes('Hardcoded credential')) {
                        suggestion = {
                            title: 'Use environment variable',
                            description: 'Move sensitive values to environment variables',
                            oldCode: issue.code,
                            newCode: issue.code.replace(/(['"])[^'"]+\1/, 'process.env.SECRET_KEY'),
                            confidence: 0.9,
                        };
                    }
                    break;

                case 'warning':
                    if (issue.message.includes('===')) {
                        suggestion = {
                            title: 'Use strict equality',
                            description: 'Replace == with === for type-safe comparison',
                            oldCode: issue.code,
                            newCode: issue.code.replace(/==/g, '==='),
                            confidence: 0.95,
                        };
                    }
                    break;

                case 'performance':
                    if (issue.message.includes('Timer')) {
                        suggestion = {
                            title: 'Clear timer on cleanup',
                            description: 'Store timer ID and clear on cleanup',
                            oldCode: issue.code,
                            newCode: `const timerId = ${issue.code}\n// Don't forget: clearInterval(timerId) or clearTimeout(timerId)`,
                            confidence: 0.85,
                        };
                    }
                    break;
            }

            if (suggestion) {
                suggestions.push(suggestion);
            }
        }

        return suggestions;
    }

    /**
     * Generate explanation
     */
    private generateExplanation(context: DebugContext, issues: DebugIssue[]): string {
        if (issues.length === 0) {
            return 'No issues detected in the code.';
        }

        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const highCount = issues.filter(i => i.severity === 'high').length;

        let explanation = `Found ${issues.length} issue(s) in ${context.file}:\n`;

        if (criticalCount > 0) {
            explanation += `\n⚠️ ${criticalCount} CRITICAL issue(s) require immediate attention.`;
        }
        if (highCount > 0) {
            explanation += `\n🔴 ${highCount} HIGH severity issue(s) should be fixed.`;
        }

        explanation += '\n\nTop issues:';
        for (const issue of issues.slice(0, 3)) {
            explanation += `\n- Line ${issue.line}: ${issue.message}`;
        }

        return explanation;
    }

    /**
     * Find function end
     */
    private findFunctionEnd(lines: string[], start: number): number {
        let braceCount = 0;
        let started = false;

        for (let i = start; i < lines.length; i++) {
            for (const char of lines[i]) {
                if (char === '{') {
                    braceCount++;
                    started = true;
                } else if (char === '}') {
                    braceCount--;
                }
            }
            if (started && braceCount === 0) {
                return i + 1;
            }
        }
        return lines.length;
    }

    /**
     * Find block end
     */
    private findBlockEnd(lines: string[], start: number): number {
        return this.findFunctionEnd(lines, start);
    }

    /**
     * Analyze error from console
     */
    async analyzeError(error: string, code: string, file: string): Promise<DebugResult> {
        const stackMatch = error.match(/at\s+.*?\s+\(([^:]+):(\d+):(\d+)\)/);
        const stackTrace = stackMatch ? error : undefined;

        return this.analyzeCode({
            code,
            file,
            language: this.detectLanguage(file),
            error: error.split('\n')[0],
            stackTrace,
        });
    }

    /**
     * Detect language from file extension
     */
    private detectLanguage(file: string): string {
        const ext = file.split('.').pop()?.toLowerCase();
        const langMap: Record<string, string> = {
            ts: 'typescript',
            tsx: 'typescript',
            js: 'javascript',
            jsx: 'javascript',
            py: 'python',
            go: 'go',
            rs: 'rust',
            java: 'java',
        };
        return langMap[ext || ''] || 'unknown';
    }

    /**
     * Get debug history
     */
    getHistory(limit = 50): DebugResult[] {
        return this.debugHistory.slice(-limit).reverse();
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.debugHistory = [];
    }
}

// Singleton getter
export function getAIDebugger(): AIDebugger {
    return AIDebugger.getInstance();
}
