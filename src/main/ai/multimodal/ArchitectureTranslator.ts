/**
 * Architecture Translator
 * 
 * Converts natural language descriptions into system architecture
 * Generates component structure, interfaces, and deployment designs
 */

import { ModelManager } from '../ModelManager';

export interface SystemArchitecture {
    overview: string;
    components: Array<{
        name: string;
        type: 'frontend' | 'backend' | 'database' | 'service' | 'api' | 'cache' | 'queue';
        responsibilities: string[];
        technologies: string[];
        interfaces: Array<{
            name: string;
            type: 'REST' | 'GraphQL' | 'WebSocket' | 'gRPC' | 'MessageQueue';
            endpoints?: string[];
        }>;
    }>;
    dataFlow: Array<{
        from: string;
        to: string;
        type: 'sync' | 'async' | 'event';
        description: string;
    }>;
    deployment: {
        infrastructure: 'serverless' | 'containers' | 'kubernetes' | 'vms' | 'hybrid';
        scaling: 'horizontal' | 'vertical' | 'auto';
        regions: string[];
    };
    security: {
        authentication: string;
        authorization: string;
        encryption: string[];
        compliance?: string[];
    };
}

export interface TechnologyStack {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
    tools: string[];
    justification: Record<string, string>;
}

export class ArchitectureTranslator {
    private static instance: ArchitectureTranslator;
    private modelManager: ModelManager;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): ArchitectureTranslator {
        if (!ArchitectureTranslator.instance) {
            ArchitectureTranslator.instance = new ArchitectureTranslator();
        }
        return ArchitectureTranslator.instance;
    }

    /**
     * Convert natural language to system architecture
     */
    async translateToArchitecture(description: string, requirements?: {
        scale?: 'small' | 'medium' | 'large' | 'massive';
        latency?: 'low' | 'medium' | 'high';
        budget?: 'low' | 'medium' | 'high';
    }): Promise<SystemArchitecture> {
        console.log('🏗️  Translating to system architecture...');

        const prompt = `Design a system architecture from this description:

## Description
${description}

## Requirements
- Scale: ${requirements?.scale || 'medium'}
- Latency: ${requirements?.latency || 'medium'}
- Budget: ${requirements?.budget || 'medium'}

Create a comprehensive architecture with:
1. All necessary components
2. Data flow between components
3. Deployment strategy
4. Security considerations

Response in JSON:
\`\`\`json
{
  "overview": "High-level architecture description",
  "components": [
    {
      "name": "API Gateway",
      "type": "api",
      "responsibilities": ["Route requests", "Authentication"],
      "technologies": ["Node.js", "Express"],
      "interfaces": [
        {
          "name": "REST API",
          "type": "REST",
          "endpoints": ["/api/users", "/api/posts"]
        }
      ]
    }
  ],
  "dataFlow": [
    {
      "from": "Frontend",
      "to": "API Gateway",
      "type": "sync",
      "description": "User requests"
    }
  ],
  "deployment": {
    "infrastructure": "containers",
    "scaling": "auto",
    "regions": ["us-east-1", "eu-west-1"]
  },
  "security": {
    "authentication": "JWT + OAuth2",
    "authorization": "RBAC",
    "encryption": ["TLS 1.3", "AES-256"]
  }
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseArchitectureResponse(response);

        console.log(`✅ Generated architecture with ${(parsed.components || []).length} components`);
        return parsed;
    }

    /**
     * Recommend technology stack
     */
    async recommendTechStack(requirements: {
        projectType: string;
        scale: 'small' | 'medium' | 'large';
        team: 'solo' | 'small' | 'large';
        constraints?: string[];
    }): Promise<TechnologyStack> {
        console.log('💡 Recommending technology stack...');

        const prompt = `Recommend a technology stack:

## Project
${requirements.projectType}

## Scale
${requirements.scale}

## Team Size
${requirements.team}

${requirements.constraints ? `## Constraints\n${requirements.constraints.join('\n')}` : ''}

Recommend:
1. Frontend technologies
2. Backend technologies
3. Database solutions
4. Infrastructure tools
5. Development tools

Justify each choice.

Response in JSON:
\`\`\`json
{
  "frontend": ["React", "TypeScript", "Tailwind CSS"],
  "backend": ["Node.js", "Express", "PostgreSQL"],
  "database": ["PostgreSQL", "Redis"],
  "infrastructure": ["Docker", "AWS", "GitHub Actions"],
  "tools": ["ESLint", "Jest", "Prettier"],
  "justification": {
    "React": "Component-based, large ecosystem, good for scaling",
    "PostgreSQL": "ACID compliance, complex queries, scalability"
  }
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseTechStackResponse(response);

        return {
            frontend: parsed.frontend || [],
            backend: parsed.backend || [],
            database: parsed.database || [],
            infrastructure: parsed.infrastructure || [],
            tools: parsed.tools || [],
            justification: parsed.justification || {}
        };
    }

    /**
     * Generate component specifications
     */
    async generateComponentSpecs(componentName: string, architecture: SystemArchitecture): Promise<{
        name: string;
        purpose: string;
        apis: Array<{
            method: string;
            endpoint: string;
            description: string;
            parameters: any[];
            response: any;
        }>;
        dataModels: Record<string, any>;
        dependencies: string[];
        scalability: string;
    }> {
        console.log(`📝 Generating specs for ${componentName}...`);

        const component = architecture.components.find(c => c.name === componentName);
        if (!component) {
            throw new Error(`Component ${componentName} not found`);
        }

        const prompt = `Generate detailed specifications for this component:

## Component
**Name**: ${component.name}
**Type**: ${component.type}
**Responsibilities**: ${component.responsibilities.join(', ')}
**Technologies**: ${component.technologies.join(', ')}

Generate:
1. API contracts
2. Data models
3. Dependencies
4. Scalability considerations

Response in JSON:
\`\`\`json
{
  "name": "${componentName}",
  "purpose": "Detailed purpose description",
  "apis": [
    {
      "method": "POST",
      "endpoint": "/api/users",
      "description": "Create new user",
      "parameters": [{"name": "email", "type": "string"}],
      "response": {"userId": "string"}
    }
  ],
  "dataModels": {
    "User": {
      "id": "string",
      "email": "string",
      "createdAt": "Date"
    }
  },
  "dependencies": ["Database", "Cache"],
  "scalability": "Horizontal scaling with load balancer"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseComponentSpecsResponse(response);

        return parsed;
    }

    /**
     * Design microservices architecture
     */
    async designMicroservices(description: string): Promise<{
        services: Array<{
            name: string;
            domain: string;
            responsibilities: string[];
            dataOwnership: string[];
            apis: string[];
        }>;
        communication: Array<{
            from: string;
            to: string;
            pattern: 'sync' | 'async' | 'event-driven';
        }>;
        sharedInfrastructure: string[];
    }> {
        console.log('🔷 Designing microservices...');

        const prompt = `Design a microservices architecture:

${description}

Decompose into services following:
1. Domain-driven design
2. Single responsibility
3. Loose coupling
4. High cohesion

Response in JSON:
\`\`\`json
{
  "services": [
    {
      "name": "UserService",
      "domain": "Identity & Access",
      "responsibilities": ["User management", "Authentication"],
      "dataOwnership": ["users", "sessions"],
      "apis": ["/users", "/auth"]
    }
  ],
  "communication": [
    {
      "from": "OrderService",
      "to": "UserService",
      "pattern": "sync"
    }
  ],
  "sharedInfrastructure": ["API Gateway", "Message Bus", "Service Mesh"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseMicroservicesResponse(response);

        return {
            services: parsed.services || [],
            communication: parsed.communication || [],
            sharedInfrastructure: parsed.sharedInfrastructure || []
        };
    }

    // Private methods

    private parseArchitectureResponse(response: string): SystemArchitecture {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                overview: 'Error generating architecture',
                components: [],
                dataFlow: [],
                deployment: {
                    infrastructure: 'containers',
                    scaling: 'auto',
                    regions: []
                },
                security: {
                    authentication: 'JWT',
                    authorization: 'RBAC',
                    encryption: []
                }
            };
        }
    }

    private parseTechStackResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseComponentSpecsResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                name: '',
                purpose: '',
                apis: [],
                dataModels: {},
                dependencies: [],
                scalability: ''
            };
        }
    }

    private parseMicroservicesResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {
                services: [],
                communication: [],
                sharedInfrastructure: []
            };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are a senior software architect expert at designing scalable, maintainable systems.',
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
export const architectureTranslator = ArchitectureTranslator.getInstance();
