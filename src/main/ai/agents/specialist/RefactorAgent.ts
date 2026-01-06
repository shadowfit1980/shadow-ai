/**
 * RefactorAgent - Code Quality & Technical Debt Specialist
 * 
 * Detects code smells, suggests refactorings, and safely transforms code
 * Works in conjunction with TechnicalDebtResolver for comprehensive improvements
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export class RefactorAgent extends SpecialistAgent {
    readonly agentType = 'RefactorAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'code_smell_detection',
            description: 'Identify code smells and anti-patterns',
            confidenceLevel: 0.9
        },
        {
            name: 'safe_refactoring',
            description: 'Perform behavior-preserving transformations',
            confidenceLevel: 0.88
        },
        {
            name: 'architecture_improvement',
            description: 'Suggest architectural improvements',
            confidenceLevel: 0.82
        },
        {
            name: 'performance_optimization',
            description: 'Optimize code performance',
            confidenceLevel: 0.85
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`♻️  RefactorAgent executing: ${task.task}`);

        const validation = await this.validateTask(task);
        if (!validation.valid) {
            return {
                success: false,
                summary: 'Validation failed',
                confidence: 0,
                explanation: validation.errors.join(', ')
            };
        }

        try {
            const analysis = await this.analyzeCode(task);
            const refactorings = await this.suggestRefactorings(task, analysis);

            const result: AgentResult = {
                success: true,
                summary: `Identified ${refactorings.length} refactoring opportunities`,
                artifacts: [{ analysis, refactorings }],
                confidence: 0.87,
                explanation: `Found ${analysis.codeSmells.length} code smells, proposed ${refactorings.length} improvements`,
                alternatives: refactorings.slice(1, 4).map(r => ({
                    description: r.description,
                    confidence: r.confidence
                })),
                estimatedEffort: refactorings.reduce((sum, r) => sum + r.effortHours, 0)
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Refactoring analysis failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    private async analyzeCode(task: AgentTask) {
        const prompt = `Analyze code for refactoring opportunities:

Code: ${task.spec}

Detect:
1. Code smells (duplication, long methods, god classes, etc.)
2. Performance issues
3. Maintainability concerns
4. Architecture violations

JSON response:
\`\`\`json
{
  "codeSmells": [
    {
      "type": "long_method",
      "location": "line 42",
      "severity": "medium",
      "description": "Method has 80 lines, should be extracted"
    }
  ],
  "performanceIssues": [],
  "maintainabilityScore": 6.5
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are an expert at code quality and refactoring, specializing in clean code principles.'
        );

        return this.parseJSON(response);
    }

    private async suggestRefactorings(task: AgentTask, analysis: any) {
        const codeSmells = analysis.codeSmells || [];

        const refactorings = [];
        for (const smell of codeSmells) {
            const refactoring = await this.createRefactoringPlan(smell);
            refactorings.push(refactoring);
        }

        return refactorings.sort((a, b) => b.impact - a.impact);
    }

    private async createRefactoringPlan(codeSmell: any) {
        const impactMap: Record<string, number> = {
            critical: 10,
            high: 7,
            medium: 5,
            low: 3
        };

        return {
            type: codeSmell.type,
            description: `Refactor ${codeSmell.type}: ${codeSmell.description}`,
            location: codeSmell.location,
            impact: impactMap[codeSmell.severity] || 5,
            effortHours: 2, // Simplified
            confidence: 0.85,
            safetyChecks: ['Run all tests', 'Verify behavior unchanged']
        };
    }

    async applyRefactoring(code: string, refactoring: any): Promise<{
        refactoredCode: string;
        explanation: string;
    }> {
        const prompt = `Apply this refactoring safely:

Original Code:
\`\`\`
${code}
\`\`\`

Refactoring: ${refactoring.description}

Provide refactored code that preserves behavior.`;

        const response = await this.callModel(prompt);

        return {
            refactoredCode: response,
            explanation: `Applied ${refactoring.type} refactoring`
        };
    }
}
