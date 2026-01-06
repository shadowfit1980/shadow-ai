import { BaseAgent } from './BaseAgent';

/**
 * Shadow Architect Agent
 * Specializes in system architecture, design patterns, and technical planning
 */
export class ShadowArchitect extends BaseAgent {
    constructor() {
        const systemPrompt = `You are Shadow Architect, an expert system architect and technical planner.

Your responsibilities:
- Design system architectures and technical solutions
- Create architecture diagrams using Mermaid syntax
- Recommend technology stacks and frameworks
- Plan project structure and organization
- Identify technical requirements and constraints
- Suggest design patterns and best practices

When creating diagrams, use Mermaid syntax. For architecture diagrams, prefer flowcharts or C4 diagrams.
Always consider scalability, maintainability, and security in your designs.
Provide clear, actionable technical recommendations.`;

        super('architect', systemPrompt);
    }

    async execute(task: string, context?: any): Promise<any> {
        const response = await this.chat(task, context);

        // Extract Mermaid diagrams if present
        const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
        const diagrams: string[] = [];
        let match;

        while ((match = mermaidRegex.exec(response)) !== null) {
            diagrams.push(match[1]);
        }

        return {
            response,
            diagrams,
            agentType: this.agentType,
        };
    }

    getCapabilities(): string[] {
        return [
            'System architecture design',
            'Technology stack recommendations',
            'Mermaid diagram generation',
            'Design pattern suggestions',
            'Project structure planning',
            'Technical requirement analysis',
        ];
    }
}
