/**
 * Technical Debt Auto-Resolution System
 * 
 * Automatically detects and resolves technical debt
 * Performs safe refactorings to improve code quality
 */

import { ModelManager } from '../ModelManager';
import { getMemoryEngine } from '../memory';

export interface DebtItem {
    id: string;
    type: 'code-smell' | 'architecture-violation' | 'security' | 'performance' | 'duplication' | 'complexity';
    severity: 'critical' | 'high' | 'medium' | 'low';
    location: {
        file: string;
        startLine: number;
        endLine: number;
    };
    description: string;
    impact: string;
    effort: 'quick' | 'moderate' | 'significant';
    autoFixable: boolean;
}

export interface RefactoringPlan {
    debtItemId: string;
    strategy: string;
    steps: Array<{
        action: string;
        description: string;
        risk: 'low' | 'medium' | 'high';
    }>;
    expectedImpact: {
        codeQuality: number; // +/- points
        maintainability: number;
        performance: number;
    };
    safetyChecks: string[];
}

export interface DebtAnalysis {
    totalItems: number;
    breakdown: Record<string, number>;
    highPriority: DebtItem[];
    quickWins: DebtItem[]; // Easy fixes with high impact
    estimatedEffort: number; // hours to resolve all
    trend: 'improving' | 'stable' | 'worsening';
}

export class TechnicalDebtResolver {
    private static instance: TechnicalDebtResolver;
    private modelManager: ModelManager;
    private memory = getMemoryEngine();

    // Track debt over time
    private debtHistory: Array<{
        timestamp: Date;
        totalDebt: number;
        itemCount: number;
    }> = [];

    // Known code smell patterns
    private codeSmellPatterns = new Map<string, RegExp>();

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.initializePatterns();
    }

    static getInstance(): TechnicalDebtResolver {
        if (!TechnicalDebtResolver.instance) {
            TechnicalDebtResolver.instance = new TechnicalDebtResolver();
        }
        return TechnicalDebtResolver.instance;
    }

    /**
     * Analyze codebase for technical debt
     */
    async analyzeDebt(codebase: {
        files: Array<{ path: string; content: string }>;
    }): Promise<DebtAnalysis> {
        console.log('🔍 Analyzing technical debt...');

        const debtItems: DebtItem[] = [];

        // Analyze each file
        for (const file of codebase.files) {
            const fileDebt = await this.analyzeFile(file.path, file.content);
            debtItems.push(...fileDebt);
        }

        // Calculate metrics
        const breakdown: Record<string, number> = {};
        debtItems.forEach(item => {
            breakdown[item.type] = (breakdown[item.type] || 0) + 1;
        });

        const highPriority = debtItems
            .filter(item => item.severity === 'critical' || item.severity === 'high')
            .sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity));

        const quickWins = debtItems
            .filter(item => item.effort === 'quick' && item.autoFixable)
            .sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity))
            .slice(0, 10);

        const estimatedEffort = this.estimateTotalEffort(debtItems);

        // Track history
        this.debtHistory.push({
            timestamp: new Date(),
            totalDebt: debtItems.length,
            itemCount: debtItems.length
        });

        const trend = this.calculateTrend();

        const analysis: DebtAnalysis = {
            totalItems: debtItems.length,
            breakdown,
            highPriority,
            quickWins,
            estimatedEffort,
            trend
        };

        console.log(`✅ Found ${debtItems.length} debt items, ${quickWins.length} quick wins`);
        return analysis;
    }

    /**
     * Generate refactoring plan for debt item
     */
    async generateRefactoringPlan(debtItem: DebtItem, code: string): Promise<RefactoringPlan> {
        console.log(`📋 Generating refactoring plan for: ${debtItem.description}`);

        const prompt = `Generate a safe refactoring plan to resolve this technical debt:

## Debt Item
**Type**: ${debtItem.type}
**Severity**: ${debtItem.severity}
**Description**: ${debtItem.description}
**Impact**: ${debtItem.impact}

## Current Code
\`\`\`
${code.substring(0, 500)}...
\`\`\`

Generate a step-by-step refactoring plan that:
1. Safely resolves the issue
2. Preserves functionality
3. Includes safety checks
4. Estimates impact

Response in JSON:
\`\`\`json
{
  "strategy": "Extract Method refactoring",
  "steps": [
    {
      "action": "Extract duplicate code into helper function",
      "description": "Create extractUser() helper",
      "risk": "low"
    }
  ],
  "expectedImpact": {
    "codeQuality": 15,
    "maintainability": 20,
    "performance": 0
  },
  "safetyChecks": ["Run unit tests", "Verify function signatures", "Check for side effects"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parsePlanResponse(response);

        return {
            debtItemId: debtItem.id,
            strategy: parsed.strategy || 'Manual refactoring required',
            steps: parsed.steps || [],
            expectedImpact: parsed.expectedImpact || { codeQuality: 0, maintainability: 0, performance: 0 },
            safetyChecks: parsed.safetyChecks || []
        };
    }

    /**
     * Automatically fix simple technical debt
     */
    async autoFix(debtItem: DebtItem, code: string): Promise<{
        success: boolean;
        fixedCode?: string;
        explanation: string;
        testsRequired: string[];
    }> {
        console.log(`🔧 Auto-fixing: ${debtItem.description}`);

        if (!debtItem.autoFixable) {
            return {
                success: false,
                explanation: 'This debt item requires manual intervention',
                testsRequired: []
            };
        }

        const prompt = `Automatically fix this technical debt:

## Issue
**Type**: ${debtItem.type}
**Description**: ${debtItem.description}

## Current Code
\`\`\`
${code}
\`\`\`

Provide fixed code that resolves the issue while preserving functionality.

Response in JSON:
\`\`\`json
{
  "success": true,
  "fixedCode": "// Fixed code here",
  "explanation": "What was changed and why",
  "testsRequired": ["Test that X still works", "Verify Y behavior"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseFixResponse(response);

        return {
            success: parsed.success || false,
            fixedCode: parsed.fixedCode,
            explanation: parsed.explanation || 'Auto-fix failed',
            testsRequired: parsed.testsRequired || []
        };
    }

    /**
     * Detect code smells using pattern matching
     */
    detectCodeSmells(code: string, filepath: string): DebtItem[] {
        const items: DebtItem[] = [];
        const lines = code.split('\n');

        // Long method detection
        const functionPattern = /function\s+\w+|const\s+\w+\s*=\s*\(.*?\)\s*=>/g;
        let match;
        while ((match = functionPattern.exec(code)) !== null) {
            const startIndex = match.index;
            const functionCode = this.extractFunction(code, startIndex);
            const functionLines = functionCode.split('\n').length;

            if (functionLines > 50) {
                items.push({
                    id: `smell-${Date.now()}-${items.length}`,
                    type: 'code-smell',
                    severity: 'medium',
                    location: {
                        file: filepath,
                        startLine: this.getLineNumber(code, startIndex),
                        endLine: this.getLineNumber(code, startIndex) + functionLines
                    },
                    description: `Long method (${functionLines} lines)`,
                    impact: 'Reduces readability and maintainability',
                    effort: 'moderate',
                    autoFixable: true
                });
            }
        }

        // Magic numbers
        const magicNumberPattern = /(?<![a-zA-Z0-9_])[0-9]{2,}(?![a-zA-Z0-9_])/g;
        const magicNumbers = code.match(magicNumberPattern) || [];
        if (magicNumbers.length > 5) {
            items.push({
                id: `smell-${Date.now()}-${items.length}`,
                type: 'code-smell',
                severity: 'low',
                location: {
                    file: filepath,
                    startLine: 1,
                    endLine: lines.length
                },
                description: `Magic numbers found (${magicNumbers.length} occurrences)`,
                impact: 'Reduces code clarity',
                effort: 'quick',
                autoFixable: true
            });
        }

        // Deep nesting
        lines.forEach((line, index) => {
            const indentation = line.search(/\S/);
            if (indentation > 16) { // 4+ levels of nesting
                items.push({
                    id: `smell-${Date.now()}-${items.length}`,
                    type: 'complexity',
                    severity: 'medium',
                    location: {
                        file: filepath,
                        startLine: index + 1,
                        endLine: index + 1
                    },
                    description: 'Deep nesting detected',
                    impact: 'Reduces readability, increases cyclomatic complexity',
                    effort: 'moderate',
                    autoFixable: true
                });
            }
        });

        // Commented out code
        const commentedCodePattern = /\/\/\s*(const|let|var|function|class|if|for|while)/g;
        const commentedCode = code.match(commentedCodePattern) || [];
        if (commentedCode.length > 3) {
            items.push({
                id: `smell-${Date.now()}-${items.length}`,
                type: 'code-smell',
                severity: 'low',
                location: {
                    file: filepath,
                    startLine: 1,
                    endLine: lines.length
                },
                description: 'Commented out code found',
                impact: 'Clutters codebase, confuses developers',
                effort: 'quick',
                autoFixable: true
            });
        }

        return items;
    }

    /**
     * Calculate technical debt score
     */
    calculateDebtScore(items: DebtItem[]): {
        score: number; // 0-100, lower is better
        rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    } {
        const severityWeights = {
            critical: 10,
            high: 5,
            medium: 2,
            low: 1
        };

        const totalWeight = items.reduce((sum, item) => {
            return sum + severityWeights[item.severity];
        }, 0);

        // Normalize to 0-100 scale (assume 50+ weight is critical)
        const score = Math.min(100, (totalWeight / 50) * 100);

        let rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
        if (score < 20) rating = 'excellent';
        else if (score < 40) rating = 'good';
        else if (score < 60) rating = 'fair';
        else if (score < 80) rating = 'poor';
        else rating = 'critical';

        return { score, rating };
    }

    // Private methods

    private async analyzeFile(filepath: string, content: string): Promise<DebtItem[]> {
        const items: DebtItem[] = [];

        // Pattern-based detection
        items.push(...this.detectCodeSmells(content, filepath));

        // AI-powered detection for complex issues
        if (content.length > 100) {
            const aiDetected = await this.aiDetectDebt(filepath, content);
            items.push(...aiDetected);
        }

        return items;
    }

    private async aiDetectDebt(filepath: string, content: string): Promise<DebtItem[]> {
        // Only analyze first 1000 lines for performance
        const preview = content.split('\n').slice(0, 1000).join('\n');

        const prompt = `Analyze for technical debt:

\`\`\`
${preview}
\`\`\`

Identify issues: architecture violations, security risks, performance problems, bad patterns.

Response in JSON:
\`\`\`json
{
  "issues": [
    {
      "type": "security",
      "severity": "high",
      "description": "SQL injection vulnerability",
      "impact": "Security risk",
      "effort": "moderate",
      "autoFixable": true,
      "lineStart": 45,
      "lineEnd": 50
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseDebtResponse(response);

        return (parsed.issues || []).map((issue: any, i: number) => ({
            id: `ai-debt-${Date.now()}-${i}`,
            type: issue.type || 'code-smell',
            severity: issue.severity || 'medium',
            location: {
                file: filepath,
                startLine: issue.lineStart || 1,
                endLine: issue.lineEnd || 1
            },
            description: issue.description || 'Issue detected',
            impact: issue.impact || 'Unknown impact',
            effort: issue.effort || 'moderate',
            autoFixable: issue.autoFixable || false
        }));
    }

    private getSeverityScore(severity: string): number {
        const scores = { critical: 4, high: 3, medium: 2, low: 1 };
        return scores[severity as keyof typeof scores] || 0;
    }

    private estimateTotalEffort(items: DebtItem[]): number {
        const effortHours = { quick: 1, moderate: 4, significant: 16 };
        return items.reduce((sum, item) => {
            return sum + effortHours[item.effort];
        }, 0);
    }

    private calculateTrend(): 'improving' | 'stable' | 'worsening' {
        if (this.debtHistory.length < 2) return 'stable';

        const recent = this.debtHistory.slice(-3);
        const older = this.debtHistory.slice(-6, -3);

        if (older.length === 0) return 'stable';

        const recentAvg = recent.reduce((sum, h) => sum + h.totalDebt, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.totalDebt, 0) / older.length;

        if (recentAvg < olderAvg * 0.9) return 'improving';
        if (recentAvg > olderAvg * 1.1) return 'worsening';
        return 'stable';
    }

    private extractFunction(code: string, startIndex: number): string {
        let braceCount = 0;
        let inFunction = false;
        let result = '';

        for (let i = startIndex; i < code.length; i++) {
            const char = code[i];
            result += char;

            if (char === '{') {
                braceCount++;
                inFunction = true;
            } else if (char === '}') {
                braceCount--;
                if (inFunction && braceCount === 0) {
                    break;
                }
            }
        }

        return result;
    }

    private getLineNumber(code: string, index: number): number {
        return code.substring(0, index).split('\n').length;
    }

    private initializePatterns(): void {
        this.codeSmellPatterns.set('godClass', /class\s+\w+\s*{[\s\S]{5000,}}/);
        this.codeSmellPatterns.set('longParameter', /function\s+\w+\([^)]{100,}\)/);
    }

    // Response parsers

    private parsePlanResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseFixResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { success: false };
        }
    }

    private parseDebtResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { issues: [] };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at identifying and resolving technical debt.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
            return response;
        } catch (error) {
            console.error('Error calling model:', error);
            return '{}';
        }
    }
}

// Export singleton
export const technicalDebtResolver = TechnicalDebtResolver.getInstance();
