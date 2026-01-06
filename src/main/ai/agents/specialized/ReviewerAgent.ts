/**
 * ReviewerAgent - Code Quality & Security Specialist
 * 
 * Responsible for reviewing code quality, security, and best practices
 */

import { BaseAgent } from '../BaseAgent';
import {
    AgentMetadata,
    ExecutionStep,
    AgentContext,
    ProjectContext,
    ReviewOutput,
    SecurityFinding
} from '../types';

export class ReviewerAgent extends BaseAgent {
    get metadata(): AgentMetadata {
        return {
            type: 'reviewer',
            name: 'Shadow Reviewer',
            specialty: 'Code Review & Quality Assurance',
            capabilities: [
                {
                    name: 'Code Quality Review',
                    description: 'Assess code quality and maintainability',
                    confidence: 0.93
                },
                {
                    name: 'Security Analysis',
                    description: 'Identify security vulnerabilities',
                    confidence: 0.90
                },
                {
                    name: 'Performance Review',
                    description: 'Find performance bottlenecks',
                    confidence: 0.87
                },
                {
                    name: 'Best Practices',
                    description: 'Ensure adherence to best practices',
                    confidence: 0.92
                },
                {
                    name: 'Code Standards',
                    description: 'Enforce coding standards',
                    confidence: 0.94
                }
            ],
            preferredModel: 'claude-opus',
            fallbackModel: 'gpt-4'
        };
    }

    protected async buildPrompt(
        step: ExecutionStep,
        context: AgentContext,
        memory: ProjectContext
    ): Promise<string> {
        const codeToReview = context.previousResults.find(r => r.agentType === 'coder')?.output;
        const styleGuide = memory.styles[0]?.metadata.patterns;
        const previousDecisions = memory.decisions.slice(0, 5);

        return `You are ${this.metadata.name}, an expert code reviewer with deep knowledge of software quality and security.

## Task
${step.description}

## Code to Review
${codeToReview ? JSON.stringify(codeToReview, null, 2) : 'No code provided for review'}

## Project Coding Standards
${styleGuide ? JSON.stringify(styleGuide, null, 2) : 'Standard best practices'}

## Previous Architectural Decisions
${previousDecisions.map(d => `- ${d.content}`).join('\n')}

## Your Mission
Conduct a thorough code review covering:

### 1. Code Quality
- Readability and maintainability
- Code organization and structure
- DRY principle adherence
- Proper abstraction levels
- Clear naming conventions

### 2. Security
- Input validation
- Authentication/authorization
- SQL injection vulnerabilities
- XSS vulnerabilities
- Sensitive data handling
- Dependency vulnerabilities

### 3. Performance
- Algorithmic efficiency
- Database query optimization
- Memory leaks
- Unnecessary computations
- Caching opportunities

### 4. Best Practices
- Error handling
- Logging and monitoring
- Testing coverage
- Documentation quality
- Type safety

### 5. Standards Compliance
- Coding style consistency
- Architecture alignment
- Pattern usage
- Framework conventions

## Output Format
Return your review as a JSON object with this EXACT structure:

\`\`\`json
{
  "approved": true|false,
  "issues": [
    {
      "severity": "critical|major|minor",
      "description": "Description of the issue",
      "location": "File and line number",
      "suggestedFix": "How to fix it"
    }
  ],
  "improvements": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "securityFindings": [
    {
      "severity": "critical|high|medium|low",
      "type": "SQL Injection|XSS|etc",
      "description": "Details of security issue",
      "location": "Where it was found",
      "recommendation": "How to fix it"
    }
  ],
  "performanceNotes": [
    "Performance observation 1",
    "Performance observation 2"
  ],
  "overallScore": 0.85
}
\`\`\`

Be thorough, constructive, and specific. Your review will determine if the code proceeds to deployment.`;
    }

    protected async parseResponse(response: string, step: ExecutionStep): Promise<ReviewOutput> {
        const codeBlocks = this.extractCodeBlocks(response);

        let reviewJSON: any = null;

        for (const block of codeBlocks) {
            if (block.language === 'json' || block.language === 'javascript') {
                try {
                    reviewJSON = JSON.parse(block.code);
                    break;
                } catch {
                    continue;
                }
            }
        }

        if (!reviewJSON) {
            reviewJSON = this.extractJSON(response);
        }

        if (!reviewJSON) {
            console.warn('⚠️  Could not parse JSON review output, using fallback');
            return this.fallbackParse(response);
        }

        return {
            approved: reviewJSON.approved !== false,
            issues: (reviewJSON.issues || []).map((i: any) => ({
                severity: i.severity || 'minor',
                description: i.description || 'No description',
                location: i.location,
                suggestedFix: i.suggestedFix
            })),
            improvements: Array.isArray(reviewJSON.improvements) ? reviewJSON.improvements : [],
            securityFindings: this.parseSecurityFindings(reviewJSON.securityFindings || []),
            performanceNotes: Array.isArray(reviewJSON.performanceNotes) ? reviewJSON.performanceNotes : [],
            overallScore: typeof reviewJSON.overallScore === 'number' ? reviewJSON.overallScore : 0.5
        };
    }

    private parseSecurityFindings(findingsData: any[]): SecurityFinding[] {
        return findingsData.map(finding => ({
            severity: finding.severity || 'low',
            type: finding.type || 'Unknown',
            description: finding.description || 'No description',
            location: finding.location || 'Unknown location',
            recommendation: finding.recommendation || 'No recommendation'
        }));
    }

    private fallbackParse(response: string): ReviewOutput {
        const hasIssues = response.toLowerCase().includes('issue') ||
            response.toLowerCase().includes('problem') ||
            response.toLowerCase().includes('fix');

        return {
            approved: !hasIssues,
            issues: [],
            improvements: ['Review could not be fully parsed - manual review recommended'],
            securityFindings: [],
            performanceNotes: [],
            overallScore: 0.5
        };
    }

    protected async validateOutput(output: ReviewOutput, step: ExecutionStep) {
        const issues: any[] = [];
        const warnings: any[] = [];

        const criticalIssues = output.issues.filter(i => i.severity === 'critical');
        const criticalSecurity = output.securityFindings.filter(f => f.severity === 'critical');

        if (criticalIssues.length > 0 && output.approved) {
            warnings.push({
                severity: 'major',
                description: `Code approved despite ${criticalIssues.length} critical issues`
            });
        }

        if (criticalSecurity.length > 0 && output.approved) {
            issues.push({
                severity: 'critical',
                description: `Code approved with ${criticalSecurity.length} critical security issues`
            });
        }

        if (output.overallScore < 0 || output.overallScore > 1) {
            warnings.push({
                severity: 'minor',
                description: 'Overall score outside valid range [0-1]'
            });
            output.overallScore = Math.max(0, Math.min(1, output.overallScore));
        }

        return {
            valid: issues.length === 0,
            critical: issues.some(i => i.severity === 'critical'),
            issues,
            warnings
        };
    }

    protected calculateConfidence(output: ReviewOutput): number {
        let score = 0.5;

        if (output.issues.length > 0) score += 0.1;
        if (output.securityFindings.length > 0) score += 0.1;
        if (output.improvements.length > 0) score += 0.1;
        if (output.performanceNotes.length > 0) score += 0.1;
        if (typeof output.overallScore === 'number') score += 0.1;

        return Math.min(score, 1.0);
    }
}
