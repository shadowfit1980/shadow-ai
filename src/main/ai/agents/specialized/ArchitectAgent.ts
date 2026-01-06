/**
 * ArchitectAgent - System Architecture & Design Specialist
 * 
 * Responsible for designing system architecture, data models, and technical specifications
 */

import { BaseAgent } from '../BaseAgent';
import {
    AgentMetadata,
    ExecutionStep,
    AgentContext,
    ProjectContext,
    ArchitectureOutput,
    Component,
    DataModel,
    APIEndpoint,
    TechStack
} from '../types';

export class ArchitectAgent extends BaseAgent {
    get metadata(): AgentMetadata {
        return {
            type: 'architect',
            name: 'Shadow Architect',
            specialty: 'System Architecture & Design',
            capabilities: [
                {
                    name: 'System Design',
                    description: 'Design scalable, maintainable system architectures',
                    confidence: 0.95
                },
                {
                    name: 'Data Modeling',
                    description: 'Create efficient, normalized data models',
                    confidence: 0.92
                },
                {
                    name: 'API Design',
                    description: 'Design RESTful and GraphQL APIs',
                    confidence: 0.90
                },
                {
                    name: 'Tech Stack Selection',
                    description: 'Choose appropriate technologies for project needs',
                    confidence: 0.88
                },
                {
                    name: 'Scalability Planning',
                    description: 'Plan for horizontal and vertical scaling',
                    confidence: 0.85
                }
            ],
            preferredModel: 'gemini-1.5-pro',
            fallbackModel: 'gpt-4'
        };
    }

    protected async buildPrompt(
        step: ExecutionStep,
        context: AgentContext,
        memory: ProjectContext
    ): Promise<string> {
        // Extract relevant information
        const previousArchitecture = memory.architecture.slice(0, 3);
        const recentDecisions = memory.decisions.slice(0, 5);
        const styleInfo = memory.styles[0]?.metadata.patterns;

        return `You are ${this.metadata.name}, an expert software architect.

## Task
${step.description}

## Requirements
${step.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Previous Architecture Decisions
${recentDecisions.length > 0
                ? recentDecisions.map(d => `- ${d.content}`).join('\n')
                : 'No previous decisions found'}

## Existing Architecture Components
${previousArchitecture.length > 0
                ? previousArchitecture.map(a => `- ${a.content}`).join('\n')
                : 'Starting fresh'}

## Project Coding Style
${styleInfo ? JSON.stringify(styleInfo, null, 2) : 'Not yet established'}

## Your Mission
Design a comprehensive, professional architecture that:
1. Follows software architecture best practices
2. Is scalable and maintainable
3. Considers security from the ground up
4. Integrates well with existing components
5. Uses modern, proven technologies
6. Includes proper data modeling
7. Defines clear API contracts

## Output Format
Return your architecture design as a JSON object with this EXACT structure:

\`\`\`json
{
  "components": [
    {
      "name": "ComponentName",
      "type": "service|library|utility|component",
      "responsibilities": ["responsibility1", "responsibility2"],
      "dependencies": ["dependency1", "dependency2"]
    }
  ],
  "dataModels": [
    {
      "name": "ModelName",
      "fields": [
        {
          "name": "fieldName",
          "type": "string|number|boolean|date|etc",
          "required": true|false,
          "validation": "validation rules"
        }
      ],
      "relationships": [
        {
          "type": "one-to-one|one-to-many|many-to-many",
          "target": "RelatedModel",
          "foreignKey": "fieldName"
        }
      ],
      "indexes": ["field1", "field2"]
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET|POST|PUT|DELETE|PATCH",
      "path": "/api/path",
      "description": "What this endpoint does",
      "authentication": true|false,
      "requestBody": {"field": "type"},
      "responseBody": {"field": "type"}
    }
  ],
  "techStack": {
    "frontend": ["React", "TypeScript", "etc"],
    "backend": ["Node.js", "Express", "etc"],
    "database": ["PostgreSQL", "Redis", "etc"],
    "infrastructure": ["Docker", "AWS", "etc"],
    "testing": ["Jest", "Cypress", "etc"]
  },
  "rationale": "Detailed explanation of architectural decisions, trade-offs, and why this design is optimal for the requirements"
}
\`\`\`

Be thorough, professional, and consider edge cases. Your architecture will be used by other agents to implement the system.`;
    }

    protected async parseResponse(response: string, step: ExecutionStep): Promise<ArchitectureOutput> {
        // Try to extract JSON from the response
        const codeBlocks = this.extractCodeBlocks(response);

        let architectureJSON: any = null;

        // First try to find JSON in code blocks
        for (const block of codeBlocks) {
            if (block.language === 'json' || block.language === 'javascript') {
                try {
                    architectureJSON = JSON.parse(block.code);
                    break;
                } catch {
                    continue;
                }
            }
        }

        // If no JSON in code blocks, try to extract from full response
        if (!architectureJSON) {
            architectureJSON = this.extractJSON(response);
        }

        // If still no JSON, use fallback parsing
        if (!architectureJSON) {
            console.warn('⚠️  Could not parse JSON architecture, using fallback');
            return this.fallbackParse(response, step);
        }

        // Validate and structure the output
        return {
            components: this.parseComponents(architectureJSON.components || []),
            dataModels: this.parseDataModels(architectureJSON.dataModels || []),
            apiEndpoints: this.parseAPIEndpoints(architectureJSON.apiEndpoints || []),
            techStack: this.parseTechStack(architectureJSON.techStack || {}),
            rationale: architectureJSON.rationale || 'No rationale provided',
            diagrams: architectureJSON.diagrams || []
        };
    }

    private parseComponents(componentsData: any[]): Component[] {
        return componentsData.map(comp => ({
            name: comp.name || 'UnnamedComponent',
            type: comp.type || 'component',
            responsibilities: Array.isArray(comp.responsibilities) ? comp.responsibilities : [],
            dependencies: Array.isArray(comp.dependencies) ? comp.dependencies : []
        }));
    }

    private parseDataModels(modelsData: any[]): DataModel[] {
        return modelsData.map(model => ({
            name: model.name || 'UnnamedModel',
            fields: Array.isArray(model.fields) ? model.fields.map(f => ({
                name: f.name || 'field',
                type: f.type || 'string',
                required: f.required !== false,
                validation: f.validation
            })) : [],
            relationships: Array.isArray(model.relationships) ? model.relationships.map(r => ({
                type: r.type || 'one-to-many',
                target: r.target,
                foreignKey: r.foreignKey
            })) : [],
            indexes: model.indexes || []
        }));
    }

    private parseAPIEndpoints(endpointsData: any[]): APIEndpoint[] {
        return endpointsData.map(endpoint => ({
            method: endpoint.method || 'GET',
            path: endpoint.path || '/api/endpoint',
            description: endpoint.description || 'No description',
            authentication: endpoint.authentication !== false,
            requestBody: endpoint.requestBody,
            responseBody: endpoint.responseBody
        }));
    }

    private parseTechStack(stackData: any): TechStack {
        return {
            frontend: Array.isArray(stackData.frontend) ? stackData.frontend : [],
            backend: Array.isArray(stackData.backend) ? stackData.backend : [],
            database: Array.isArray(stackData.database) ? stackData.database : [],
            infrastructure: Array.isArray(stackData.infrastructure) ? stackData.infrastructure : [],
            testing: Array.isArray(stackData.testing) ? stackData.testing : []
        };
    }

    private fallbackParse(response: string, step: ExecutionStep): ArchitectureOutput {
        // Create a basic architecture from the text response
        return {
            components: [{
                name: 'MainComponent',
                type: 'service',
                responsibilities: [step.description],
                dependencies: []
            }],
            dataModels: [],
            apiEndpoints: [],
            techStack: {
                frontend: ['React', 'TypeScript'],
                backend: ['Node.js'],
                database: ['PostgreSQL'],
                infrastructure: [],
                testing: ['Jest']
            },
            rationale: response.substring(0, 500),
            diagrams: []
        };
    }

    protected async validateOutput(output: ArchitectureOutput, step: ExecutionStep) {
        const issues: any[] = [];
        const warnings: any[] = [];

        // Validate components
        if (!output.components || output.components.length === 0) {
            issues.push({
                severity: 'major',
                description: 'No components defined in architecture'
            });
        }

        // Validate tech stack
        if (!output.techStack.backend || output.techStack.backend.length === 0) {
            warnings.push({
                severity: 'minor',
                description: 'No backend technologies specified'
            });
        }

        // Validate rationale
        if (!output.rationale || output.rationale.length < 50) {
            warnings.push({
                severity: 'minor',
                description: 'Architecture rationale is too brief'
            });
        }

        return {
            valid: issues.length === 0,
            critical: issues.some(i => i.severity === 'critical'),
            issues,
            warnings
        };
    }

    protected calculateConfidence(output: ArchitectureOutput): number {
        let score = 0.5;

        if (output.components.length > 0) score += 0.1;
        if (output.dataModels.length > 0) score += 0.1;
        if (output.apiEndpoints.length > 0) score += 0.1;
        if (output.techStack.backend && output.techStack.backend.length > 0) score += 0.1;
        if (output.rationale.length > 100) score += 0.1;

        return Math.min(score, 1.0);
    }
}
