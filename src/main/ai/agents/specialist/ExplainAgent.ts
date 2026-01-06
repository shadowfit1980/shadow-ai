/**
 * ExplainAgent - Technical Communication & Documentation Specialist
 * 
 * Converts complex technical decisions into clear, stakeholder-appropriate narratives
 * Generates documentation, change logs, and audit-ready explanations
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export type AudienceLevel = 'executive' | 'manager' | 'technical' | 'developer' | 'enduser';

export interface Explanation {
    audience: AudienceLevel;
    summary: string;
    details: string;
    keyPoints: string[];
    recommendations?: string[];
    visualAids?: Array<{
        type: 'diagram' | 'chart' | 'table';
        content: string;
    }>;
}

export interface ChangeLog {
    version: string;
    date: string;
    changes: Array<{
        type: 'feature' | 'bugfix' | 'breaking' | 'improvement' | 'security';
        description: string;
        impact: 'low' | 'medium' | 'high';
    }>;
    migration?: string;
}

export class ExplainAgent extends SpecialistAgent {
    readonly agentType = 'ExplainAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'technical_translation',
            description: 'Translate technical concepts for different audiences',
            confidenceLevel: 0.93
        },
        {
            name: 'documentation_generation',
            description: 'Generate comprehensive documentation',
            confidenceLevel: 0.90
        },
        {
            name: 'audit_narrative',
            description: 'Create audit-ready decision narratives',
            confidenceLevel: 0.91
        },
        {
            name: 'change_communication',
            description: 'Explain changes and their impacts clearly',
            confidenceLevel: 0.89
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`📝 ExplainAgent executing: ${task.task}`);

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
            // Generate explanations for different audiences
            const explanations = await this.generateMultiLevelExplanations(task);
            const documentation = await this.generateDocumentation(task);

            const result: AgentResult = {
                success: true,
                summary: `Generated explanations for ${explanations.length} audience levels`,
                artifacts: [{ explanations, documentation }],
                confidence: 0.91,
                explanation: 'Created multi-level explanations and documentation',
                estimatedEffort: 1 // 1 hour for documentation
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Explanation generation failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    private async generateMultiLevelExplanations(task: AgentTask): Promise<Explanation[]> {
        const audiences: AudienceLevel[] = ['executive', 'manager', 'technical', 'developer'];
        const explanations: Explanation[] = [];

        for (const audience of audiences) {
            const explanation = await this.explainForAudience(task, audience);
            explanations.push(explanation);
        }

        return explanations;
    }

    async explainForAudience(task: AgentTask, audience: AudienceLevel): Promise<Explanation> {
        console.log(`📊 Generating ${audience}-level explanation...`);

        const audienceGuidelines = this.getAudienceGuidelines(audience);

        const prompt = `Explain this technical concept for ${audience} audience:

Technical Details: ${task.spec}
Context: ${JSON.stringify(task.context || {})}

Guidelines:
${audienceGuidelines}

Provide:
1. Summary (2-3 sentences)
2. Detailed explanation
3. Key points (3-5 bullets)
4. Recommendations if applicable

JSON response:
\`\`\`json
{
  "summary": "Brief overview appropriate for ${audience}",
  "details": "Detailed explanation with appropriate technical depth",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "recommendations": ["Recommendation 1"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            `You are an expert technical communicator who can explain complex concepts clearly to ${audience} audiences.`
        );

        const parsed = this.parseJSON(response);

        return {
            audience,
            summary: parsed.summary || '',
            details: parsed.details || '',
            keyPoints: parsed.keyPoints || [],
            recommendations: parsed.recommendations
        };
    }

    async generateAuditNarrative(
        decision: string,
        reasoning: string,
        alternatives: any[],
        outcome: any
    ): Promise<string> {
        console.log('📋 Generating audit-ready narrative...');

        const prompt = `Create audit-ready narrative:

Decision: ${decision}
Reasoning: ${reasoning}
Alternatives Considered: ${JSON.stringify(alternatives)}
Outcome: ${JSON.stringify(outcome)}

Generate comprehensive narrative that:
1. States the decision clearly
2. Explains the reasoning process
3. Documents alternatives considered
4. Justifies why this approach was chosen
5. Describes the outcome
6. Is suitable for regulatory audit

Write in formal, professional tone.`;

        const response = await this.callModel(prompt);

        return response;
    }

    async generateChangeLog(changes: any[]): Promise<ChangeLog> {
        console.log('📝 Generating change log...');

        const prompt = `Generate change log from these changes:

Changes: ${JSON.stringify(changes, null, 2)}

Create structured changelog with:
1. Version number (semantic versioning)
2. Date
3. Categorized changes (feature, bugfix, breaking, etc.)
4. Impact assessment
5. Migration notes if breaking changes

JSON response.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return {
            version: parsed.version || '1.0.0',
            date: parsed.date || new Date().toISOString().split('T')[0],
            changes: parsed.changes || [],
            migration: parsed.migration
        };
    }

    async generateDocumentation(task: AgentTask): Promise<{
        readme: string;
        apiDocs: string;
        architecture: string;
    }> {
        console.log('📚 Generating comprehensive documentation...');

        const prompt = `Generate documentation for:

Project: ${task.spec}
Context: ${JSON.stringify(task.context || {})}

Create:
1. README.md - Project overview, setup, usage
2. API documentation - Endpoints, parameters, examples
3. Architecture overview - System design, components

Markdown format.`;

        const response = await this.callModel(prompt);

        // Simplified - would parse and structure properly
        return {
            readme: '# Project Documentation\n\nOverview...',
            apiDocs: '# API Documentation\n\nEndpoints...',
            architecture: '# Architecture\n\nSystem design...'
        };
    }

    async explainCode(code: string, audience: AudienceLevel): Promise<string> {
        const prompt = `Explain this code for ${audience} audience:

\`\`\`
${code}
\`\`\`

${this.getAudienceGuidelines(audience)}

Provide clear, concise explanation.`;

        const response = await this.callModel(prompt);
        return response;
    }

    async generateOnboarding(project: string): Promise<{
        quickStart: string;
        detailedGuide: string;
        commonIssues: string;
    }> {
        console.log('🎓 Generating onboarding documentation...');

        return {
            quickStart: '# Quick Start\n\n1. Clone repo\n2. Install deps\n3. Run dev server',
            detailedGuide: '# Detailed Guide\n\nComprehensive setup...',
            commonIssues: '# Common Issues\n\nTroubleshooting...'
        };
    }

    async createExecutiveSummary(technicalDetails: any): Promise<string> {
        const prompt = `Create executive summary from technical details:

${JSON.stringify(technicalDetails, null, 2)}

Focus on:
- Business impact
- ROI and benefits
- Risks and mitigation
- Timeline and resources
- Key decisions and rationale

Keep under 500 words, avoid technical jargon.`;

        const response = await this.callModel(prompt);
        return response;
    }

    private getAudienceGuidelines(audience: AudienceLevel): string {
        const guidelines: Record<AudienceLevel, string> = {
            'executive': `
- Focus on business impact and ROI
- Avoid technical jargon
- Use analogies and simple language
- Emphasize risks, benefits, timeline
- Keep very high-level`,

            'manager': `
- Balance technical and business context
- Explain implications for team/project
- Include resource and timeline considerations
- Some technical detail acceptable
- Focus on actionable insights`,

            'technical': `
- Technical depth appropriate
- Architecture and design patterns
- Performance and scalability considerations
- Security and compliance aspects
- Implementation details`,

            'developer': `
- Full technical detail
- Code examples
- API references
- Implementation specifics
- Best practices and patterns`,

            'enduser': `
- Focus on what they can do
- Avoid any technical jargon
- Use simple, friendly language
- Step-by-step instructions
- Visual aids helpful`
        };

        return guidelines[audience];
    }

    private generateExplanationReport(explanations: Explanation[]): string {
        let report = `Generated explanations for ${explanations.length} audiences:\n\n`;

        explanations.forEach(exp => {
            report += `${exp.audience.toUpperCase()}:\n`;
            report += `  ${exp.summary}\n`;
            report += `  Key points: ${exp.keyPoints.length}\n\n`;
        });

        return report;
    }
}
