/**
 * Diagram Generation Engine
 * 
 * Converts code into visual diagrams (Mermaid, PlantUML)
 * Generates architecture, sequence, class, and dependency diagrams
 */

import { ModelManager } from '../ModelManager';

export interface DiagramConfig {
    type: 'architecture' | 'sequence' | 'class' | 'erd' | 'flowchart' | 'dependency';
    format: 'mermaid' | 'plantuml' | 'graphviz';
    theme?: 'default' | 'dark' | 'forest' | 'neutral';
    includeDetails?: boolean;
}

export interface DiagramResult {
    diagram: string; // Mermaid/PlantUML code
    format: string;
    description: string;
    components: string[];
}

export class DiagramGenerator {
    private static instance: DiagramGenerator;
    private modelManager: ModelManager;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): DiagramGenerator {
        if (!DiagramGenerator.instance) {
            DiagramGenerator.instance = new DiagramGenerator();
        }
        return DiagramGenerator.instance;
    }

    /**
     * Generate architecture diagram from codebase
     */
    async generateArchitectureDiagram(
        codebase: { files: Array<{ path: string; content: string }> }
    ): Promise<DiagramResult> {
        console.log('🏗️  Generating architecture diagram...');

        const prompt = `Analyze this codebase and create a Mermaid architecture diagram:

## Files
${codebase.files.slice(0, 10).map(f => `- ${f.path}`).join('\n')}

Create a C4 or component diagram showing:
1. Major components/modules
2. Data flow between components
3. External dependencies
4. Layer separation

Response in JSON:
\`\`\`json
{
  "diagram": "graph TD\\n  A[Frontend] --> B[API]\\n  B --> C[Database]",
  "format": "mermaid",
  "description": "System architecture overview",
  "components": ["Frontend", "API", "Database"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseDiagramResponse(response);

        console.log(`✅ Generated diagram with ${(parsed.components || []).length} components`);
        return parsed;
    }

    /**
     * Generate class diagram from code
     */
    async generateClassDiagram(code: string, language: string = 'typescript'): Promise<DiagramResult> {
        console.log('📦 Generating class diagram...');

        const prompt = `Create a Mermaid class diagram from this ${language} code:

\`\`\`${language}
${code.substring(0, 2000)}
\`\`\`

Show:
1. All classes and interfaces
2. Properties and methods
3. Inheritance and implementations
4. Relationships (composition, aggregation)

Response in JSON:
\`\`\`json
{
  "diagram": "classDiagram\\n  class User {\\n    +name: string\\n    +email: string\\n  }",
  "format": "mermaid",
  "description": "Class structure",
  "components": ["User", "Profile"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseDiagramResponse(response);

        return parsed;
    }

    /**
     * Generate sequence diagram from function execution flow
     */
    async generateSequenceDiagram(
        functionName: string,
        code: string
    ): Promise<DiagramResult> {
        console.log('🔄 Generating sequence diagram...');

        const prompt = `Create a Mermaid sequence diagram for function "${functionName}":

\`\`\`
${code.substring(0, 1500)}
\`\`\`

Show:
1. Function call flow
2. Object interactions
3. Return values
4. Async operations

Response in JSON:
\`\`\`json
{
  "diagram": "sequenceDiagram\\n  Client->>API: request()\\n  API->>DB: query()\\n  DB-->>API: data\\n  API-->>Client: response",
  "format": "mermaid",
  "description": "Execution flow for ${functionName}",
  "components": ["Client", "API", "DB"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseDiagramResponse(response);

        return parsed;
    }

    /**
     * Generate ERD (Entity Relationship Diagram)
     */
    async generateERD(schema: string): Promise<DiagramResult> {
        console.log('🗄️  Generating ERD...');

        const prompt = `Create a Mermaid ERD from this database schema:

\`\`\`
${schema}
\`\`\`

Show:
1. All entities/tables
2. Attributes
3. Relationships (one-to-many, many-to-many)
4. Primary and foreign keys

Response in JSON:
\`\`\`json
{
  "diagram": "erDiagram\\n  USER ||--o{ POST : creates\\n  USER {\\n    int id PK\\n    string name\\n  }",
  "format": "mermaid",
  "description": "Database entity relationships",
  "components": ["USER", "POST"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseDiagramResponse(response);

        return parsed;
    }

    /**
     * Generate dependency graph
     */
    async generateDependencyGraph(
        codebase: { files: Array<{ path: string; imports: string[] }> }
    ): Promise<DiagramResult> {
        console.log('📊 Generating dependency graph...');

        // Build dependency map
        const deps: string[] = [];
        codebase.files.forEach(file => {
            file.imports.forEach(imp => {
                deps.push(`  ${this.getModuleName(file.path)} --> ${this.getModuleName(imp)}`);
            });
        });

        const diagram = `graph LR\n${deps.join('\n')}`;

        return {
            diagram,
            format: 'mermaid',
            description: 'Module dependency graph',
            components: codebase.files.map(f => this.getModuleName(f.path))
        };
    }

    /**
     * Generate flowchart from code logic
     */
    async generateFlowchart(code: string): Promise<DiagramResult> {
        console.log('📈 Generating flowchart...');

        const prompt = `Create a Mermaid flowchart from this code logic:

\`\`\`
${code.substring(0, 1000)}
\`\`\`

Show:
1. Start/End points
2. Decision points (if/else)
3. Loops
4. Function calls
5. Return statements

Response in JSON:
\`\`\`json
{
  "diagram": "flowchart TD\\n  Start --> Decision{x > 0?}\\n  Decision -->|Yes| A[Process]\\n  Decision -->|No| B[Skip]",
  "format": "mermaid",
  "description": "Code execution flow",
  "components": ["Start", "Decision", "Process"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseDiagramResponse(response);

        return parsed;
    }

    /**
     * Auto-detect best diagram type for code
     */
    async autoDiagram(code: string, context?: string): Promise<DiagramResult> {
        console.log('🤖 Auto-detecting diagram type...');

        // Simple heuristics
        if (code.includes('class ') && code.includes('extends')) {
            return await this.generateClassDiagram(code);
        } else if (code.includes('CREATE TABLE') || code.includes('interface')) {
            return await this.generateERD(code);
        } else if (code.includes('if (') || code.includes('while (')) {
            return await this.generateFlowchart(code);
        } else {
            // Default to flowchart
            return await this.generateFlowchart(code);
        }
    }

    // Private methods

    private getModuleName(filepath: string): string {
        const parts = filepath.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\.(ts|js|tsx|jsx)$/, '');
    }

    private parseDiagramResponse(response: string): DiagramResult {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            const parsed = JSON.parse(jsonStr);

            return {
                diagram: parsed.diagram || '',
                format: parsed.format || 'mermaid',
                description: parsed.description || 'Generated diagram',
                components: parsed.components || []
            };
        } catch (error) {
            return {
                diagram: 'graph TD\n  A[Error generating diagram]',
                format: 'mermaid',
                description: 'Error occurred',
                components: []
            };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at creating clear, informative diagrams from code.',
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
export const diagramGenerator = DiagramGenerator.getInstance();
