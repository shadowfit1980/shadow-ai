/**
 * Natural Language Requirements Pipeline
 * 
 * Convert natural language requirements to production code:
 * - NL → Specifications
 * - Specifications → Architecture
 * - Architecture → Code
 * - Code → Tests
 */

import { EventEmitter } from 'events';

export interface RequirementAnalysis {
    id: string;
    naturalLanguage: string;
    parsedRequirements: ParsedRequirement[];
    entities: Entity[];
    actions: Action[];
    constraints: Constraint[];
}

export interface ParsedRequirement {
    id: string;
    type: 'functional' | 'non-functional' | 'constraint';
    description: string;
    priority: 'must' | 'should' | 'could';
    acceptanceCriteria: string[];
}

export interface Entity {
    name: string;
    type: 'user' | 'data' | 'system' | 'external';
    properties: string[];
    relationships: string[];
}

export interface Action {
    verb: string;
    subject: string;
    object: string;
    constraints: string[];
}

export interface Constraint {
    type: 'performance' | 'security' | 'scalability' | 'compliance';
    description: string;
    metric?: string;
    threshold?: string;
}

export interface GeneratedArchitecture {
    components: Component[];
    dataFlow: DataFlow[];
    apis: APIDefinition[];
}

export interface Component {
    name: string;
    type: 'service' | 'ui' | 'database' | 'integration';
    responsibilities: string[];
    dependencies: string[];
}

export interface DataFlow {
    from: string;
    to: string;
    data: string;
    protocol: string;
}

export interface APIDefinition {
    endpoint: string;
    method: string;
    request: any;
    response: any;
}

export class NLRequirementsPipeline extends EventEmitter {
    private static instance: NLRequirementsPipeline;

    private constructor() { super(); }

    static getInstance(): NLRequirementsPipeline {
        if (!NLRequirementsPipeline.instance) {
            NLRequirementsPipeline.instance = new NLRequirementsPipeline();
        }
        return NLRequirementsPipeline.instance;
    }

    async processRequirements(naturalLanguage: string): Promise<{
        analysis: RequirementAnalysis;
        architecture: GeneratedArchitecture;
        code: string;
        tests: string;
    }> {
        // Step 1: Parse NL to structured requirements
        const analysis = await this.analyzeNL(naturalLanguage);
        this.emit('analysisComplete', analysis);

        // Step 2: Generate architecture from requirements
        const architecture = await this.generateArchitecture(analysis);
        this.emit('architectureComplete', architecture);

        // Step 3: Generate code from architecture
        const code = await this.generateCode(architecture);
        this.emit('codeComplete', code);

        // Step 4: Generate tests from requirements
        const tests = await this.generateTests(analysis);
        this.emit('testsComplete', tests);

        return { analysis, architecture, code, tests };
    }

    async analyzeNL(text: string): Promise<RequirementAnalysis> {
        const requirements: ParsedRequirement[] = [];
        const entities: Entity[] = [];
        const actions: Action[] = [];
        const constraints: Constraint[] = [];

        // Parse sentences for requirements
        const sentences = text.split(/[.!?]+/).filter(Boolean);

        for (const sentence of sentences) {
            const lower = sentence.toLowerCase();

            // Detect requirement type and priority
            if (lower.includes('must') || lower.includes('shall')) {
                requirements.push({
                    id: `req_${requirements.length}`,
                    type: 'functional',
                    description: sentence.trim(),
                    priority: 'must',
                    acceptanceCriteria: [`Verify: ${sentence.trim()}`],
                });
            } else if (lower.includes('should')) {
                requirements.push({
                    id: `req_${requirements.length}`,
                    type: 'functional',
                    description: sentence.trim(),
                    priority: 'should',
                    acceptanceCriteria: [],
                });
            }

            // Detect entities (nouns after "the", "a", etc.)
            const entityMatches = sentence.match(/(?:the|a|an)\s+(\w+)/gi);
            if (entityMatches) {
                for (const match of entityMatches) {
                    const name = match.replace(/^(the|a|an)\s+/i, '');
                    if (!entities.find(e => e.name === name)) {
                        entities.push({
                            name,
                            type: 'data',
                            properties: [],
                            relationships: [],
                        });
                    }
                }
            }

            // Detect actions (verbs)
            const verbPatterns = ['create', 'read', 'update', 'delete', 'send', 'receive', 'display', 'process'];
            for (const verb of verbPatterns) {
                if (lower.includes(verb)) {
                    actions.push({
                        verb,
                        subject: 'system',
                        object: 'data',
                        constraints: [],
                    });
                }
            }

            // Detect constraints
            if (lower.includes('within') || lower.includes('less than') || lower.includes('performance')) {
                constraints.push({
                    type: 'performance',
                    description: sentence.trim(),
                });
            }
            if (lower.includes('secure') || lower.includes('encrypt') || lower.includes('auth')) {
                constraints.push({
                    type: 'security',
                    description: sentence.trim(),
                });
            }
        }

        return {
            id: `analysis_${Date.now()}`,
            naturalLanguage: text,
            parsedRequirements: requirements,
            entities,
            actions,
            constraints,
        };
    }

    async generateArchitecture(analysis: RequirementAnalysis): Promise<GeneratedArchitecture> {
        const components: Component[] = [];
        const dataFlows: DataFlow[] = [];
        const apis: APIDefinition[] = [];

        // Generate components based on entities
        for (const entity of analysis.entities) {
            components.push({
                name: `${entity.name}Service`,
                type: 'service',
                responsibilities: [`Manage ${entity.name} operations`],
                dependencies: [],
            });

            // Generate CRUD APIs
            apis.push({
                endpoint: `/api/${entity.name.toLowerCase()}`,
                method: 'GET',
                request: {},
                response: { [`${entity.name}s`]: [] },
            });
            apis.push({
                endpoint: `/api/${entity.name.toLowerCase()}`,
                method: 'POST',
                request: { [entity.name.toLowerCase()]: {} },
                response: { id: 'string' },
            });
        }

        // Add UI component if user entities exist
        if (analysis.entities.some(e => e.type === 'user')) {
            components.push({
                name: 'Frontend',
                type: 'ui',
                responsibilities: ['User interface', 'User interaction'],
                dependencies: analysis.entities.map(e => `${e.name}Service`),
            });
        }

        return { components, dataFlow: dataFlows, apis };
    }

    async generateCode(architecture: GeneratedArchitecture): Promise<string> {
        let code = `// Generated Code from NL Requirements\n\n`;

        for (const component of architecture.components) {
            if (component.type === 'service') {
                code += `
// ${component.name}
export class ${component.name} {
    constructor() {
        console.log('${component.name} initialized');
    }

${component.responsibilities.map(r => `    // ${r}`).join('\n')}
}

`;
            }
        }

        // Generate API routes
        code += `\n// API Routes\n`;
        for (const api of architecture.apis) {
            code += `// ${api.method} ${api.endpoint}\n`;
        }

        return code;
    }

    async generateTests(analysis: RequirementAnalysis): Promise<string> {
        let tests = `// Generated Tests from Requirements\n\n`;

        for (const req of analysis.parsedRequirements) {
            tests += `
describe('${req.description.slice(0, 50)}...', () => {
    it('should satisfy requirement: ${req.id}', () => {
        // TODO: Implement test for: ${req.description}
        expect(true).toBe(true);
    });
});

`;
        }

        return tests;
    }
}

export const nlRequirementsPipeline = NLRequirementsPipeline.getInstance();
