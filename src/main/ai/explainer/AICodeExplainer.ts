/**
 * AI Code Explainer
 * 
 * Generates human-readable explanations of code at various
 * complexity levels with visual diagrams and examples.
 */

import { EventEmitter } from 'events';

export interface CodeExplanation {
    id: string;
    code: string;
    language: string;
    level: ExplanationLevel;
    sections: ExplanationSection[];
    summary: string;
    concepts: ConceptExplanation[];
    diagrams: Diagram[];
    examples: ExampleCode[];
    timestamp: Date;
}

export type ExplanationLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ExplanationSection {
    title: string;
    content: string;
    codeRange?: { start: number; end: number };
    highlights?: string[];
}

export interface ConceptExplanation {
    name: string;
    description: string;
    relatedConcepts: string[];
    learnMore?: string;
}

export interface Diagram {
    type: 'flow' | 'class' | 'sequence' | 'state';
    title: string;
    mermaid: string;
}

export interface ExampleCode {
    title: string;
    description: string;
    code: string;
    language: string;
}

export interface ExplanationRequest {
    code: string;
    language: string;
    level?: ExplanationLevel;
    focusAreas?: string[];
    includeExamples?: boolean;
    includeDiagrams?: boolean;
}

export class AICodeExplainer extends EventEmitter {
    private static instance: AICodeExplainer;
    private explanations: Map<string, CodeExplanation> = new Map();
    private conceptCache: Map<string, ConceptExplanation> = new Map();

    private constructor() {
        super();
        this.initializeConceptCache();
    }

    static getInstance(): AICodeExplainer {
        if (!AICodeExplainer.instance) {
            AICodeExplainer.instance = new AICodeExplainer();
        }
        return AICodeExplainer.instance;
    }

    private initializeConceptCache(): void {
        const concepts: ConceptExplanation[] = [
            {
                name: 'async/await',
                description: 'Modern syntax for handling asynchronous operations, making async code look synchronous.',
                relatedConcepts: ['Promise', 'callback', 'event loop'],
            },
            {
                name: 'closure',
                description: 'A function that has access to variables from its outer scope, even after the outer function has returned.',
                relatedConcepts: ['scope', 'lexical environment', 'higher-order function'],
            },
            {
                name: 'generics',
                description: 'Type parameters that allow creating reusable components that work with multiple types.',
                relatedConcepts: ['type parameter', 'type inference', 'constraints'],
            },
            {
                name: 'interface',
                description: 'A contract that defines the structure an object must follow.',
                relatedConcepts: ['type', 'abstract class', 'duck typing'],
            },
            {
                name: 'Promise',
                description: 'An object representing the eventual completion or failure of an async operation.',
                relatedConcepts: ['async/await', 'callback', 'then/catch'],
            },
            {
                name: 'decorator',
                description: 'A design pattern that adds behavior to objects or methods without modifying their code.',
                relatedConcepts: ['annotation', 'higher-order function', 'metadata'],
            },
            {
                name: 'singleton',
                description: 'A design pattern that ensures only one instance of a class exists.',
                relatedConcepts: ['design pattern', 'static', 'global state'],
            },
            {
                name: 'higher-order function',
                description: 'A function that takes functions as arguments or returns a function.',
                relatedConcepts: ['callback', 'closure', 'functional programming'],
            },
        ];

        for (const concept of concepts) {
            this.conceptCache.set(concept.name.toLowerCase(), concept);
        }
    }

    // ========================================================================
    // EXPLANATION GENERATION
    // ========================================================================

    async explain(request: ExplanationRequest): Promise<CodeExplanation> {
        const level = request.level || 'intermediate';
        const sections = this.analyzeSections(request.code, request.language, level);
        const concepts = this.extractConcepts(request.code, request.language);
        const diagrams = request.includeDiagrams !== false ? this.generateDiagrams(request.code, request.language) : [];
        const examples = request.includeExamples !== false ? this.generateExamples(request.code, request.language) : [];
        const summary = this.generateSummary(request.code, level);

        const explanation: CodeExplanation = {
            id: `exp_${Date.now()}`,
            code: request.code,
            language: request.language,
            level,
            sections,
            summary,
            concepts,
            diagrams,
            examples,
            timestamp: new Date(),
        };

        this.explanations.set(explanation.id, explanation);
        this.emit('explanation:generated', explanation);
        return explanation;
    }

    private analyzeSections(code: string, language: string, level: ExplanationLevel): ExplanationSection[] {
        const sections: ExplanationSection[] = [];
        const lines = code.split('\n');

        // Analyze imports
        const imports = lines.filter(l => l.includes('import') || l.includes('require'));
        if (imports.length > 0) {
            sections.push({
                title: 'Dependencies',
                content: this.explainByLevel(
                    'These lines bring in external code that this file needs.',
                    level,
                    {
                        beginner: 'Think of imports like ingredients needed for a recipe.',
                        advanced: 'Module imports establish dependencies and enable tree-shaking.',
                    }
                ),
                highlights: imports,
            });
        }

        // Analyze functions
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/(?:function|const\s+\w+\s*=.*=>|async\s+function)/)) {
                const funcName = this.extractFunctionName(line);
                sections.push({
                    title: `Function: ${funcName}`,
                    content: this.explainByLevel(
                        `This defines a reusable piece of code called "${funcName}".`,
                        level,
                        {
                            beginner: 'A function is like a recipe - you can use it whenever you need.',
                            advanced: 'This function encapsulates logic for reuse and testability.',
                        }
                    ),
                    codeRange: { start: i, end: i },
                });
            }
        }

        // Analyze classes
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.match(/class\s+\w+/)) {
                const className = line.match(/class\s+(\w+)/)?.[1] || 'Unknown';
                sections.push({
                    title: `Class: ${className}`,
                    content: this.explainByLevel(
                        `This defines a blueprint called "${className}" for creating objects.`,
                        level,
                        {
                            beginner: 'A class is like a cookie cutter - it defines the shape of objects.',
                            advanced: 'This class encapsulates state and behavior following OOP principles.',
                        }
                    ),
                    codeRange: { start: i, end: i },
                });
            }
        }

        return sections;
    }

    private explainByLevel(
        base: string,
        level: ExplanationLevel,
        extras: Partial<Record<ExplanationLevel, string>>
    ): string {
        const extra = extras[level];
        return extra ? `${base} ${extra}` : base;
    }

    private extractFunctionName(line: string): string {
        const match = line.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=|async\s+function\s+(\w+))/);
        return match?.[1] || match?.[2] || match?.[3] || 'anonymous';
    }

    private extractConcepts(code: string, _language: string): ConceptExplanation[] {
        const concepts: ConceptExplanation[] = [];
        const lower = code.toLowerCase();

        // Check for common concepts in code
        if (lower.includes('async') || lower.includes('await')) {
            const concept = this.conceptCache.get('async/await');
            if (concept) concepts.push(concept);
        }

        if (lower.includes('promise')) {
            const concept = this.conceptCache.get('promise');
            if (concept) concepts.push(concept);
        }

        if (lower.includes('interface')) {
            const concept = this.conceptCache.get('interface');
            if (concept) concepts.push(concept);
        }

        if (code.includes('<T>') || code.includes('<T,')) {
            const concept = this.conceptCache.get('generics');
            if (concept) concepts.push(concept);
        }

        if (lower.includes('singleton') || lower.includes('getinstance')) {
            const concept = this.conceptCache.get('singleton');
            if (concept) concepts.push(concept);
        }

        if (lower.includes('@') && (lower.includes('decorator') || lower.includes('annotation'))) {
            const concept = this.conceptCache.get('decorator');
            if (concept) concepts.push(concept);
        }

        return concepts;
    }

    private generateDiagrams(code: string, _language: string): Diagram[] {
        const diagrams: Diagram[] = [];

        // Check for class hierarchies
        if (code.includes('extends') || code.includes('implements')) {
            const classes = (code.match(/class\s+(\w+)/g) || []).map(c => c.replace('class ', ''));
            if (classes.length > 0) {
                diagrams.push({
                    type: 'class',
                    title: 'Class Hierarchy',
                    mermaid: this.generateClassDiagram(classes),
                });
            }
        }

        // Check for async flow
        if (code.includes('async') || code.includes('then')) {
            diagrams.push({
                type: 'flow',
                title: 'Async Flow',
                mermaid: this.generateFlowDiagram(code),
            });
        }

        return diagrams;
    }

    private generateClassDiagram(classes: string[]): string {
        let diagram = 'classDiagram\n';
        for (const cls of classes) {
            diagram += `    class ${cls}\n`;
        }
        return diagram;
    }

    private generateFlowDiagram(_code: string): string {
        return `flowchart TD
    A[Start] --> B{Check Condition}
    B -->|Yes| C[Execute Async]
    C --> D[Wait for Result]
    D --> E[Process Result]
    B -->|No| F[Skip]
    E --> G[End]
    F --> G`;
    }

    private generateExamples(code: string, language: string): ExampleCode[] {
        const examples: ExampleCode[] = [];

        // If it's a function, show how to call it
        const funcMatch = code.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/);
        if (funcMatch) {
            const [, funcName, params] = funcMatch;
            const paramList = params.split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean);
            const args = paramList.map(p => `/* ${p} */`).join(', ');

            examples.push({
                title: 'Usage Example',
                description: `How to call the ${funcName} function`,
                code: `// Call the function\nconst result = ${funcMatch[0].includes('async') ? 'await ' : ''}${funcName}(${args});\nconsole.log(result);`,
                language,
            });
        }

        // If it's a class, show instantiation
        const classMatch = code.match(/class\s+(\w+)/);
        if (classMatch) {
            const [, className] = classMatch;
            examples.push({
                title: 'Instantiation Example',
                description: `How to create an instance of ${className}`,
                code: `// Create an instance\nconst instance = new ${className}();\n\n// Or get singleton if applicable\nconst singleton = ${className}.getInstance();`,
                language,
            });
        }

        return examples;
    }

    private generateSummary(code: string, level: ExplanationLevel): string {
        const lines = code.split('\n').length;
        const functions = (code.match(/function\s+\w+|=>\s*{/g) || []).length;
        const classes = (code.match(/class\s+\w+/g) || []).length;

        let summary: string;

        switch (level) {
            case 'beginner':
                summary = `This code has ${lines} lines. `;
                if (classes > 0) summary += `It defines ${classes} class${classes > 1 ? 'es' : ''} which are like blueprints for creating objects. `;
                if (functions > 0) summary += `It has ${functions} function${functions > 1 ? 's' : ''} which are reusable pieces of code.`;
                break;
            case 'intermediate':
                summary = `This ${lines}-line module contains ${functions} functions and ${classes} classes. `;
                summary += code.includes('async') ? 'It uses asynchronous operations. ' : '';
                summary += code.includes('export') ? 'Components are exported for use in other modules.' : '';
                break;
            case 'advanced':
            case 'expert':
                summary = `Module with ${lines} LOC, ${functions} functions, ${classes} classes. `;
                summary += code.includes('async') ? 'Async patterns present. ' : '';
                summary += code.includes('<T>') ? 'Uses generics. ' : '';
                summary += code.includes('extends') ? 'Inheritance hierarchy. ' : '';
                break;
        }

        return summary.trim();
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getExplanation(id: string): CodeExplanation | undefined {
        return this.explanations.get(id);
    }

    getAllExplanations(): CodeExplanation[] {
        return Array.from(this.explanations.values());
    }

    getConcept(name: string): ConceptExplanation | undefined {
        return this.conceptCache.get(name.toLowerCase());
    }

    getAllConcepts(): ConceptExplanation[] {
        return Array.from(this.conceptCache.values());
    }

    getStats(): {
        explanationCount: number;
        conceptCount: number;
        byLevel: Record<ExplanationLevel, number>;
    } {
        const explanations = Array.from(this.explanations.values());
        const byLevel: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };

        for (const exp of explanations) {
            byLevel[exp.level]++;
        }

        return {
            explanationCount: explanations.length,
            conceptCount: this.conceptCache.size,
            byLevel: byLevel as Record<ExplanationLevel, number>,
        };
    }
}

export const aiCodeExplainer = AICodeExplainer.getInstance();
