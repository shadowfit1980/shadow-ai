import { BaseAgent } from './BaseAgent';

/**
 * Shadow Debugger Agent
 * Specializes in bug detection, code analysis, and automated fixing
 */
export class ShadowDebugger extends BaseAgent {
    constructor() {
        const systemPrompt = `You are Shadow Debugger, an expert at finding and fixing bugs.

Your responsibilities:
- Analyze code for bugs and errors
- Identify performance issues
- Suggest fixes and improvements
- Detect security vulnerabilities
- Review code quality
- Generate test cases

Always provide:
1. Clear explanation of the issue
2. Root cause analysis
3. Specific fix recommendations
4. Prevention strategies

Be thorough but concise. Focus on actionable solutions.`;

        super('debugger', systemPrompt);
    }

    async execute(task: string, context?: any): Promise<any> {
        const response = await this.chat(task, context);

        // Parse response for structured bug reports
        const issues = this.parseIssues(response);

        return {
            response,
            issues,
            agentType: this.agentType,
        };
    }

    /**
     * Parse issues from response
     */
    private parseIssues(response: string): Array<{
        type: string;
        severity: string;
        description: string;
        fix?: string;
    }> {
        // Simple parsing - could be enhanced with more sophisticated NLP
        const issues: Array<any> = [];
        const lines = response.split('\n');

        let currentIssue: any = null;

        for (const line of lines) {
            if (line.match(/^(Error|Bug|Issue|Warning):/i)) {
                if (currentIssue) {
                    issues.push(currentIssue);
                }
                currentIssue = {
                    type: 'bug',
                    severity: line.toLowerCase().includes('warning') ? 'warning' : 'error',
                    description: line,
                };
            } else if (currentIssue && line.match(/^Fix:/i)) {
                currentIssue.fix = line.replace(/^Fix:\s*/i, '');
            }
        }

        if (currentIssue) {
            issues.push(currentIssue);
        }

        return issues;
    }

    getCapabilities(): string[] {
        return [
            'Bug detection and analysis',
            'Performance optimization',
            'Security vulnerability scanning',
            'Code quality review',
            'Test case generation',
            'Automated fixing suggestions',
        ];
    }
}
