/**
 * TaskAnalyzer - Analyzes user requests to determine requirements
 * 
 * Uses AI to understand what the user wants and plan the approach
 */

import { ModelManager } from '../ModelManager';
import {
    ComplexTask,
    TaskAnalysis,
    TaskType,
    TaskComplexity,
    AgentType
} from './types';

export class TaskAnalyzer {
    private modelManager = ModelManager.getInstance();

    /**
     * Analyze a user request to determine task details
     */
    async analyze(task: ComplexTask): Promise<TaskAnalysis> {
        console.log('\n🔍 Analyzing task:', task.description);

        const prompt = this.buildAnalysisPrompt(task);

        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are a technical task analyzer. Analyze user requests and determine what agents are needed.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            const analysis = this.parseAnalysis(response);

            console.log(`✅ Analysis complete: ${analysis.type} task, ${analysis.complexity} complexity`);
            console.log(`   Required agents: ${analysis.requiredAgents.join(', ')}`);

            return analysis;

        } catch (error: any) {
            console.error('❌ Analysis failed:', error.message);
            return this.fallbackAnalysis(task);
        }
    }

    private buildAnalysisPrompt(task: ComplexTask): string {
        return `Analyze this development task and determine the approach:

## Task
${task.description}

${task.requirements ? `## Requirements
${task.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : ''}

${task.constraints ? `## Constraints
${task.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

## Your Job
Analyze this task and return a JSON object with:

1. **type**: One of:
   - "feature" - Building new functionality
   - "bug" - Fixing a bug
   - "refactor" - Improving existing code
   - "design" - UI/UX work
   - "deployment" - Infrastructure/DevOps
   - "optimization" - Performance improvements

2. **complexity**: One of:
   - "simple" - Straightforward, 1-2 agents, < 1 hour
   - "medium" - Moderate, 2-4 agents, 1-4 hours
   - "complex" - Challenging, 4-6 agents, > 4 hours

3. **requiredAgents**: Array of agents needed:
   - "architect" - For system design, architecture, data modeling
   - "coder" - For implementation, coding
   - "reviewer" - For code review, security, quality
   - "debugger" - For testing, debugging, bug fixing
   - "devops" - For deployment, infrastructure, CI/CD
   - "designer" - For UI/UX, design systems, components

4. **estimatedSteps**: Number (how many execution steps needed)

5. **risks**: Array of potential risks or challenges

6. **opportunities**: Array of opportunities for improvement

Return ONLY valid JSON in this format:

\`\`\`json
{
  "type": "feature",
  "complexity": "medium",
  "requiredAgents": ["architect", "coder", "reviewer"],
  "estimatedSteps": 5,
  "risks": ["Database migration needed", "API breaking changes"],
  "opportunities": ["Can improve performance", "Simplify codebase"]
}
\`\`\``;
    }

    private parseAnalysis(response: string): TaskAnalysis {
        // Try to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[0]);
                return {
                    type: this.validateTaskType(data.type),
                    complexity: this.validateComplexity(data.complexity),
                    requiredAgents: this.validateAgents(data.requiredAgents),
                    estimatedSteps: data.estimatedSteps || 3,
                    risks: Array.isArray(data.risks) ? data.risks : [],
                    opportunities: Array.isArray(data.opportunities) ? data.opportunities : []
                };
            } catch (error) {
                console.warn('⚠️  Failed to parse JSON analysis');
            }
        }

        // Fallback to text parsing
        return this.parseTextAnalysis(response);
    }

    private parseTextAnalysis(response: string): TaskAnalysis {
        const lowerResponse = response.toLowerCase();

        // Determine type
        let type: TaskType = 'feature';
        if (lowerResponse.includes('bug') || lowerResponse.includes('fix')) type = 'bug';
        else if (lowerResponse.includes('refactor')) type = 'refactor';
        else if (lowerResponse.includes('design') || lowerResponse.includes('ui')) type = 'design';
        else if (lowerResponse.includes('deploy') || lowerResponse.includes('infrastructure')) type = 'deployment';
        else if (lowerResponse.includes('optimi') || lowerResponse.includes('performance')) type = 'optimization';

        // Determine complexity
        let complexity: TaskComplexity = 'medium';
        if (lowerResponse.includes('simple') || lowerResponse.includes('easy') || lowerResponse.includes('quick')) {
            complexity = 'simple';
        } else if (lowerResponse.includes('complex') || lowerResponse.includes('difficult') || lowerResponse.includes('challenging')) {
            complexity = 'complex';
        }

        // Determine required agents
        const agents: AgentType[] = [];
        if (lowerResponse.includes('architect') || lowerResponse.includes('design') && !lowerResponse.includes('ui')) {
            agents.push('architect');
        }
        if (lowerResponse.includes('code') || lowerResponse.includes('implement')) {
            agents.push('coder');
        }
        if (lowerResponse.includes('review') || lowerResponse.includes('security')) {
            agents.push('reviewer');
        }
        if (lowerResponse.includes('test') || lowerResponse.includes('debug') || lowerResponse.includes('bug')) {
            agents.push('debugger');
        }
        if (lowerResponse.includes('deploy') || lowerResponse.includes('devops') || lowerResponse.includes('infrastructure')) {
            agents.push('devops');
        }
        if (lowerResponse.includes('ui') || lowerResponse.includes('design') && lowerResponse.includes('user')) {
            agents.push('designer');
        }

        // Default to coder if no agents detected
        if (agents.length === 0) {
            agents.push('coder');
        }

        return {
            type,
            complexity,
            requiredAgents: agents,
            estimatedSteps: agents.length + 1,
            risks: [],
            opportunities: []
        };
    }

    private fallbackAnalysis(task: ComplexTask): TaskAnalysis {
        return {
            type: 'feature',
            complexity: 'medium',
            requiredAgents: ['architect', 'coder', 'reviewer'],
            estimatedSteps: 4,
            risks: ['Analysis failed - proceeding with defaults'],
            opportunities: []
        };
    }

    private validateTaskType(type: any): TaskType {
        const validTypes: TaskType[] = ['feature', 'bug', 'refactor', 'design', 'deployment', 'optimization'];
        return validTypes.includes(type) ? type : 'feature';
    }

    private validateComplexity(complexity: any): TaskComplexity {
        const validComplexities: TaskComplexity[] = ['simple', 'medium', 'complex'];
        return validComplexities.includes(complexity) ? complexity : 'medium';
    }

    private validateAgents(agents: any): AgentType[] {
        if (!Array.isArray(agents)) return ['coder'];

        const validAgents: AgentType[] = ['architect', 'coder', 'debugger', 'reviewer', 'devops', 'designer'];
        const filtered = agents.filter(a => validAgents.includes(a));

        return filtered.length > 0 ? filtered : ['coder'];
    }
}
