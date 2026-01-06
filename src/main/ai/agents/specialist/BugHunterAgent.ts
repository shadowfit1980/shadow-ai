/**
 * BugHunterAgent - Advanced Bug Detection & Debugging Specialist
 * 
 * Combines static analysis, dynamic analysis, and predictive bug detection
 * Uses pattern matching and AI to find bugs before they happen
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export interface BugReport {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    location: string;
    description: string;
    recommendation: string;
    confidence: number;
}

export class BugHunterAgent extends SpecialistAgent {
    readonly agentType = 'BugHunterAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'static_analysis',
            description: 'Analyze code without execution to find bugs',
            confidenceLevel: 0.88
        },
        {
            name: 'predictive_bug_detection',
            description: 'Predict bugs using patterns and AI',
            confidenceLevel: 0.82
        },
        {
            name: 'root_cause_analysis',
            description: 'Trace bugs to root causes',
            confidenceLevel: 0.85
        },
        {
            name: 'fix_suggestion',
            description: 'Suggest fixes for detected bugs',
            confidenceLevel: 0.8
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`🐛 BugHunterAgent executing: ${task.task}`);

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
            const bugs = await this.findBugs(task);
            const criticalBugs = bugs.filter(b => b.severity === 'critical' || b.severity === 'high');

            const result: AgentResult = {
                success: true,
                summary: `Found ${bugs.length} potential bugs (${criticalBugs.length} critical/high)`,
                artifacts: bugs,
                confidence: 0.86,
                explanation: this.generateBugReport(bugs),
                estimatedEffort: criticalBugs.length * 2 // 2 hours per critical bug
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Bug detection failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    private async findBugs(task: AgentTask): Promise<BugReport[]> {
        const prompt = `Analyze this code for bugs and potential issues:

Code: ${task.spec}

Detect:
1. Null pointer/undefined errors
2. Off-by-one errors
3. Race conditions
4. Memory leaks
5. Logic errors
6. Type mismatches
7. Edge case handling issues
8. Infinite loops

For each bug provide:
- Severity (critical/high/medium/low)
- Type
- Location
- Description
- Fix recommendation

JSON response:
\`\`\`json
{
  "bugs": [
    {
      "id": "bug-1",
      "severity": "high",
      "type": "null_pointer",
      "location": "line 42",
      "description": "Variable 'user' may be undefined",
      "recommendation": "Add null check before accessing user.name",
      "confidence": 0.9
    }
  ]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are an expert bug hunter with years of experience finding subtle bugs and security vulnerabilities.'
        );

        const parsed = this.parseJSON(response);
        return (parsed.bugs || []).map((b: any, i: number) => ({
            id: b.id || `bug-${i + 1}`,
            severity: b.severity || 'medium',
            type: b.type || 'unknown',
            location: b.location || 'unknown',
            description: b.description || '',
            recommendation: b.recommendation || '',
            confidence: b.confidence || 0.7
        }));
    }

    async predictBugs(codeChange: string, existingCode: string): Promise<BugReport[]> {
        console.log('🔮 Predicting potential bugs from code change...');

        const prompt = `Predict bugs that might occur from this code change:

Existing Code:
\`\`\`
${existingCode}
\`\`\`

Proposed Change:
\`\`\`
${codeChange}
\`\`\`

Predict:
1. What bugs might this introduce?
2. What edge cases might break?
3. What side effects could occur?

JSON response with predicted bugs.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);
        return parsed.bugs || [];
    }

    async rootCauseAnalysis(bugDescription: string, stackTrace?: string): Promise<{
        rootCause: string;
        affectedComponents: string[];
        fixStrategy: string;
        preventionStrategy: string;
    }> {
        console.log('🔍 Performing root cause analysis...');

        const prompt = `Perform root cause analysis:

Bug Description: ${bugDescription}
${stackTrace ? `Stack Trace:\n${stackTrace}` : ''}

Determine:
1. Root cause (not just symptom)
2. Affected components
3. Fix strategy
4. Prevention strategy for future

JSON response:
\`\`\`json
{
  "rootCause": "Race condition in async handler",
  "affectedComponents": ["UserService", "DatabaseConnection"],
  "fixStrategy": "Add mutex lock around critical section",
  "preventionStrategy": "Use atomic operations, add thread-safety tests"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            rootCause: parsed.rootCause || 'Unknown',
            affectedComponents: parsed.affectedComponents || [],
            fixStrategy: parsed.fixStrategy || 'Further investigation needed',
            preventionStrategy: parsed.preventionStrategy || 'Add tests'
        };
    }

    async generateFix(bug: BugReport, code: string): Promise<{
        fixedCode: string;
        explanation: string;
        testCases: string[];
    }> {
        console.log(`🔧 Generating fix for ${bug.type}...`);

        const prompt = `Generate fix for this bug:

Bug: ${bug.description}
Location: ${bug.location}
Recommendation: ${bug.recommendation}

Original Code:
\`\`\`
${code}
\`\`\`

Provide:
1. Fixed code
2. Explanation of fix
3. Test cases to prevent regression

JSON response.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            fixedCode: parsed.fixedCode || code,
            explanation: parsed.explanation || 'Fix applied',
            testCases: parsed.testCases || []
        };
    }

    private generateBugReport(bugs: BugReport[]): string {
        if (bugs.length === 0) {
            return 'No bugs detected. Code looks clean!';
        }

        const critical = bugs.filter(b => b.severity === 'critical').length;
        const high = bugs.filter(b => b.severity === 'high').length;
        const medium = bugs.filter(b => b.severity === 'medium').length;
        const low = bugs.filter(b => b.severity === 'low').length;

        let report = `Found ${bugs.length} potential bug(s):\n`;
        report += `- Critical: ${critical}\n`;
        report += `- High: ${high}\n`;
        report += `- Medium: ${medium}\n`;
        report += `- Low: ${low}\n\n`;

        // Add top 3 bugs
        const topBugs = bugs.slice(0, 3);
        topBugs.forEach((bug, i) => {
            report += `${i + 1}. [${bug.severity.toUpperCase()}] ${bug.type} at ${bug.location}\n`;
            report += `   ${bug.description}\n`;
            report += `   Fix: ${bug.recommendation}\n\n`;
        });

        return report;
    }
}
