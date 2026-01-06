/**
 * Predictive Analyzer
 * 
 * Predicts potential issues before they occur using static analysis,
 * pattern recognition, and machine learning
 */

import { getMemoryEngine } from '../memory';
import { ModelManager } from '../ModelManager';
import * as path from 'path';

export interface PredictedIssue {
    id: string;
    type: 'bug' | 'performance' | 'security' | 'dependency' | 'technical-debt';
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // 0-1
    description: string;
    location?: {
        file: string;
        line?: number;
        function?: string;
    };
    impact: string;
    preventionSteps: string[];
    estimatedTimeToFix: number; // minutes
    likelihood: number; // 0-1, probability of occurring
    detectedBy: string[]; // Analysis methods that detected this
}

export interface BugPrediction {
    bugType: string;
    description: string;
    confidence: number;
    codePattern: string;
    suggestedFix: string;
}

export interface PerformanceIssue {
    issueType: string;
    description: string;
    confidence: number;
    expectedImpact: string;
    optimization: string;
}

export interface DependencyConflict {
    package1: string;
    package2: string;
    conflictType: string;
    resolution: string;
}

export interface TechnicalDebtForecast {
    area: string;
    currentDebt: number; // 0-100
    projectedDebt: number; // 0-100 in 6 months
    trend: 'improving' | 'stable' | 'worsening';
    recommendations: string[];
}

export class PredictiveAnalyzer {
    private static instance: PredictiveAnalyzer;
    private memory = getMemoryEngine();
    private modelManager: ModelManager;

    private issuePatterns: Map<string, {
        pattern: RegExp;
        severity: string;
        description: string;
    }> = new Map();

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.initializePatterns();
    }

    static getInstance(): PredictiveAnalyzer {
        if (!PredictiveAnalyzer.instance) {
            PredictiveAnalyzer.instance = new PredictiveAnalyzer();
        }
        return PredictiveAnalyzer.instance;
    }

    /**
     * Predict issues in code before execution
     */
    async predictIssues(code: string, context?: {
        language?: string;
        file?: string;
        dependencies?: string[];
    }): Promise<PredictedIssue[]> {
        console.log('🔮 Predicting potential issues...');

        const issues: PredictedIssue[] = [];

        // Run multiple prediction methods in parallel
        const [bugPredictions, perfIssues, securityIssues, debtIssues] = await Promise.all([
            this.predictBugs(code, context),
            this.predictPerformanceIssues(code, context),
            this.predictSecurityIssues(code, context),
            this.predictTechnicalDebt(code, context)
        ]);

        issues.push(...bugPredictions);
        issues.push(...perfIssues);
        issues.push(...securityIssues);
        issues.push(...debtIssues);

        console.log(`✅ Predicted ${issues.length} potential issues`);

        return issues.sort((a, b) => {
            // Sort by severity and confidence
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aSeverity = severityOrder[a.severity];
            const bSeverity = severityOrder[b.severity];

            if (aSeverity !== bSeverity) return bSeverity - aSeverity;
            return b.confidence - a.confidence;
        });
    }

    /**
     * Predict bugs using pattern matching and ML
     */
    private async predictBugs(code: string, context?: any): Promise<PredictedIssue[]> {
        const issues: PredictedIssue[] = [];

        // Pattern-based detection
        const patternIssues = this.detectPatternBasedBugs(code);
        issues.push(...patternIssues);

        // ML-based prediction
        const mlIssues = await this.mlBasedBugPrediction(code, context);
        issues.push(...mlIssues);

        return issues;
    }

    /**
     * Detect bugs using known patterns
     */
    private detectPatternBasedBugs(code: string): PredictedIssue[] {
        const issues: PredictedIssue[] = [];

        this.issuePatterns.forEach((pattern, id) => {
            if (pattern.pattern.test(code)) {
                issues.push({
                    id: `pattern-${id}`,
                    type: 'bug',
                    severity: pattern.severity as any,
                    confidence: 0.85,
                    description: pattern.description,
                    impact: 'May cause runtime errors or unexpected behavior',
                    preventionSteps: ['Review and fix the identified pattern'],
                    estimatedTimeToFix: 15,
                    likelihood: 0.7,
                    detectedBy: ['pattern-matching']
                });
            }
        });

        return issues;
    }

    /**
     * ML-based bug prediction
     */
    private async mlBasedBugPrediction(code: string, context?: any): Promise<PredictedIssue[]> {
        const prompt = `Analyze this code for potential bugs:

\`\`\`${context?.language || 'typescript'}
${code}
\`\`\`

Identify potential bugs that might occur at runtime. For each bug, provide:
1. Type of bug (null pointer, race condition, logic error, etc.)
2. Description of the issue
3. Confidence (0-1)
4. Suggested fix

Response format:
\`\`\`json
{
  "bugs": [
    {
      "type": "null-pointer",
      "description": "Variable 'x' may be null when accessed",
      "confidence": 0.85,
      "line": 42,
      "fix": "Add null check before accessing"
    }
  ]
}
\`\`\``;

        try {
            const response = await this.modelManager.chat([
                { role: 'system', content: 'You are an expert code analyzer specializing in bug detection.', timestamp: new Date() },
                { role: 'user', content: prompt, timestamp: new Date() }
            ]);

            const parsed = this.parseMLResponse(response);

            return (parsed.bugs || []).map((bug: any, index: number) => ({
                id: `ml-bug-${index}`,
                type: 'bug' as const,
                severity: this.determineSeverity(bug.type),
                confidence: bug.confidence || 0.7,
                description: bug.description,
                location: context?.file ? {
                    file: context.file,
                    line: bug.line
                } : undefined,
                impact: `Potential ${bug.type} that could cause runtime failure`,
                preventionSteps: [bug.fix || 'Fix suggested issue'],
                estimatedTimeToFix: 20,
                likelihood: bug.confidence || 0.7,
                detectedBy: ['ml-analysis']
            }));
        } catch (error) {
            console.error('ML bug prediction error:', error);
            return [];
        }
    }

    /**
     * Predict performance issues
     */
    private async predictPerformanceIssues(code: string, context?: any): Promise<PredictedIssue[]> {
        const issues: PredictedIssue[] = [];

        // Detect algorithmic complexity issues
        const complexityIssues = this.detectComplexityIssues(code);
        issues.push(...complexityIssues);

        // Detect common performance anti-patterns
        const antiPatterns = this.detectPerformanceAntiPatterns(code);
        issues.push(...antiPatterns);

        return issues;
    }

    /**
     * Detect algorithmic complexity issues
     */
    private detectComplexityIssues(code: string): PredictedIssue[] {
        const issues: PredictedIssue[] = [];

        // Nested loops
        const nestedLoopMatches = code.match(/for.*\{[^}]*for.*\{/g);
        if (nestedLoopMatches && nestedLoopMatches.length > 0) {
            issues.push({
                id: 'perf-nested-loops',
                type: 'performance',
                severity: 'medium',
                confidence: 0.8,
                description: 'Nested loops detected - O(n²) or higher complexity',
                impact: 'Performance degrades quadratically with input size',
                preventionSteps: [
                    'Consider using hash maps to reduce lookups',
                    'Evaluate if algorithm can be optimized',
                    'Profile with realistic data sizes'
                ],
                estimatedTimeToFix: 30,
                likelihood: 0.9,
                detectedBy: ['static-analysis']
            });
        }

        // Large array operations
        if (code.includes('.map(') && code.includes('.filter(')) {
            issues.push({
                id: 'perf-chained-operations',
                type: 'performance',
                severity: 'low',
                confidence: 0.7,
                description: 'Chained array operations - multiple iterations',
                impact: 'Could be optimized to single pass',
                preventionSteps: [
                    'Combine map and filter into single operation',
                    'Consider using reduce for complex transformations'
                ],
                estimatedTimeToFix: 10,
                likelihood: 0.6,
                detectedBy: ['static-analysis']
            });
        }

        return issues;
    }

    /**
     * Detect performance anti-patterns
     */
    private detectPerformanceAntiPatterns(code: string): PredictedIssue[] {
        const issues: PredictedIssue[] = [];

        // Synchronous file I/O
        if (code.includes('readFileSync') || code.includes('writeFileSync')) {
            issues.push({
                id: 'perf-sync-io',
                type: 'performance',
                severity: 'high',
                confidence: 0.95,
                description: 'Synchronous file I/O blocks event loop',
                impact: 'Can cause significant performance degradation in async environments',
                preventionSteps: [
                    'Replace with async versions (readFile, writeFile)',
                    'Use promises or async/await'
                ],
                estimatedTimeToFix: 5,
                likelihood: 1.0,
                detectedBy: ['static-analysis']
            });
        }

        return issues;
    }

    /**
     * Predict security issues
     */
    private async predictSecurityIssues(code: string, context?: any): Promise<PredictedIssue[]> {
        const issues: PredictedIssue[] = [];

        // SQL injection
        if (code.match(/SELECT.*\+.*FROM/i) || code.match(/query\(['"`].*\$\{/)) {
            issues.push({
                id: 'sec-sql-injection',
                type: 'security',
                severity: 'critical',
                confidence: 0.9,
                description: 'Potential SQL injection vulnerability',
                impact: 'Database could be compromised',
                preventionSteps: [
                    'Use parameterized queries',
                    'Never concatenate user input into SQL',
                    'Use an ORM with built-in protection'
                ],
                estimatedTimeToFix: 20,
                likelihood: 0.8,
                detectedBy: ['static-analysis']
            });
        }

        // XSS
        if (code.includes('innerHTML') || code.includes('dangerouslySetInnerHTML')) {
            issues.push({
                id: 'sec-xss',
                type: 'security',
                severity: 'high',
                confidence: 0.85,
                description: 'Potential XSS vulnerability via innerHTML',
                impact: 'Malicious scripts could be executed',
                preventionSteps: [
                    'Sanitize user input',
                    'Use textContent instead of innerHTML',
                    'Use a sanitization library like DOMPurify'
                ],
                estimatedTimeToFix: 15,
                likelihood: 0.7,
                detectedBy: ['static-analysis']
            });
        }

        // Hardcoded secrets
        const secretPatterns = [
            /password\s*=\s*['"][^'"]+['"]/i,
            /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
            /secret\s*=\s*['"][^'"]+['"]/i
        ];

        secretPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                issues.push({
                    id: 'sec-hardcoded-secret',
                    type: 'security',
                    severity: 'critical',
                    confidence: 0.95,
                    description: 'Hardcoded secrets detected',
                    impact: 'Credentials could be exposed in version control',
                    preventionSteps: [
                        'Move secrets to environment variables',
                        'Use a secrets manager',
                        'Remove from version control history'
                    ],
                    estimatedTimeToFix: 10,
                    likelihood: 1.0,
                    detectedBy: ['static-analysis']
                });
            }
        });

        return issues;
    }

    /**
     * Predict technical debt accumulation
     */
    private async predictTechnicalDebt(code: string, context?: any): Promise<PredictedIssue[]> {
        const issues: PredictedIssue[] = [];

        // Code duplication
        const duplicateBlocks = this.detectDuplication(code);
        if (duplicateBlocks > 2) {
            issues.push({
                id: 'debt-duplication',
                type: 'technical-debt',
                severity: 'medium',
                confidence: 0.8,
                description: `${duplicateBlocks} blocks of duplicate code detected`,
                impact: 'Maintenance burden increases, bugs multiply',
                preventionSteps: [
                    'Extract common logic into functions',
                    'Use DRY principle',
                    'Refactor duplicated code'
                ],
                estimatedTimeToFix: 30,
                likelihood: 1.0,
                detectedBy: ['static-analysis']
            });
        }

        // Long functions
        const longFunctions = this.detectLongFunctions(code);
        if (longFunctions > 0) {
            issues.push({
                id: 'debt-long-functions',
                type: 'technical-debt',
                severity: 'low',
                confidence: 0.7,
                description: `${longFunctions} functions exceed recommended length`,
                impact: 'Harder to test and maintain',
                preventionSteps: [
                    'Break down into smaller functions',
                    'Apply Single Responsibility Principle',
                    'Improve code organization'
                ],
                estimatedTimeToFix: 45,
                likelihood: 0.9,
                detectedBy: ['static-analysis']
            });
        }

        return issues;
    }

    /**
     * Predict dependency conflicts
     */
    async predictDependencyConflicts(dependencies: string[]): Promise<DependencyConflict[]> {
        // Simplified - in production, would check actual package.json and lock files
        const conflicts: DependencyConflict[] = [];

        // Common conflict patterns
        const knownConflicts = [
            { pkg1: 'react', pkg2: 'preact', type: 'mutual-exclusive' },
            { pkg1: 'webpack', pkg2: 'vite', type: 'build-tool-conflict' }
        ];

        dependencies.forEach(dep1 => {
            dependencies.forEach(dep2 => {
                const conflict = knownConflicts.find(c =>
                    (dep1.includes(c.pkg1) && dep2.includes(c.pkg2)) ||
                    (dep1.includes(c.pkg2) && dep2.includes(c.pkg1))
                );

                if (conflict) {
                    conflicts.push({
                        package1: dep1,
                        package2: dep2,
                        conflictType: conflict.type,
                        resolution: `Choose one: ${conflict.pkg1} or ${conflict.pkg2}`
                    });
                }
            });
        });

        return conflicts;
    }

    /**
     * Forecast technical debt trends
     */
    async forecastTechnicalDebt(projectPath: string): Promise<TechnicalDebtForecast[]> {
        // Placeholder for comprehensive debt analysis
        return [
            {
                area: 'Code Quality',
                currentDebt: 35,
                projectedDebt: 45,
                trend: 'worsening',
                recommendations: [
                    'Add linting rules',
                    'Increase test coverage',
                    'Schedule refactoring sprints'
                ]
            }
        ];
    }

    // Private helper methods

    private initializePatterns(): void {
        // Common bug patterns
        this.issuePatterns.set('undefined-access', {
            pattern: /\w+\.\w+\s*&&\s*\w+\.\w+\.\w+/,
            severity: 'medium',
            description: 'Potential undefined access - missing null checks'
        });

        this.issuePatterns.set('floating-promise', {
            pattern: /^\s*\w+\(.*\)\s*;.*async/m,
            severity: 'medium',
            description: 'Floating promise - async function called without await'
        });

        this.issuePatterns.set('console-log', {
            pattern: /console\.log/,
            severity: 'low',
            description: 'Console.log detected - remove before production'
        });
    }

    private detectDuplication(code: string): number {
        // Simplified duplication detection
        const lines = code.split('\n').filter(l => l.trim().length > 10);
        const uniqueLines = new Set(lines);
        return lines.length - uniqueLines.size;
    }

    private detectLongFunctions(code: string): number {
        const functionRegex = /function\s+\w+\s*\([^)]*\)\s*\{([^}]*)\}/g;
        let count = 0;
        let match;

        while ((match = functionRegex.exec(code)) !== null) {
            const functionBody = match[1];
            const lines = functionBody.split('\n').length;
            if (lines > 50) count++;
        }

        return count;
    }

    private determineSeverity(bugType: string): 'low' | 'medium' | 'high' | 'critical' {
        const criticalTypes = ['null-pointer', 'memory-leak', 'race-condition'];
        const highTypes = ['logic-error', 'type-error'];
        const mediumTypes = ['edge-case', 'validation'];

        if (criticalTypes.some(t => bugType.includes(t))) return 'critical';
        if (highTypes.some(t => bugType.includes(t))) return 'high';
        if (mediumTypes.some(t => bugType.includes(t))) return 'medium';
        return 'low';
    }

    private parseMLResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { bugs: [] };
        }
    }
}

// Export singleton
export const predictiveAnalyzer = PredictiveAnalyzer.getInstance();
