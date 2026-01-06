/**
 * Code Understanding Engine
 * 
 * Semantic code analysis, AST parsing, dependency mapping,
 * and intelligent code search.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface CodeEntity {
    type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'interface';
    name: string;
    location: { file: string; line: number; column: number };
    scope: string;
    references: string[];
    dependencies: string[];
}

interface CodeAnalysis {
    entities: CodeEntity[];
    imports: string[];
    exports: string[];
    complexity: number;
    issues: CodeIssue[];
}

interface CodeIssue {
    type: 'error' | 'warning' | 'info';
    message: string;
    location: { line: number; column: number };
    suggestion?: string;
}

interface DependencyGraph {
    nodes: Map<string, { file: string; dependencies: string[] }>;
    edges: Array<{ from: string; to: string }>;
}

// ============================================================================
// CODE UNDERSTANDING ENGINE
// ============================================================================

export class CodeUnderstandingEngine extends EventEmitter {
    private static instance: CodeUnderstandingEngine;
    private codeIndex: Map<string, CodeEntity[]> = new Map();
    private dependencyGraph: DependencyGraph = { nodes: new Map(), edges: [] };

    private constructor() {
        super();
    }

    static getInstance(): CodeUnderstandingEngine {
        if (!CodeUnderstandingEngine.instance) {
            CodeUnderstandingEngine.instance = new CodeUnderstandingEngine();
        }
        return CodeUnderstandingEngine.instance;
    }

    // ========================================================================
    // CODE ANALYSIS
    // ========================================================================

    async analyzeCode(code: string, filename: string): Promise<CodeAnalysis> {
        const entities: CodeEntity[] = [];
        const imports: string[] = [];
        const exports: string[] = [];
        const issues: CodeIssue[] = [];

        // Parse imports
        const importRegex = /import\s+(?:{\s*([^}]+)\s*}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            imports.push(match[3]);
            const names = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];
            names.forEach(name => {
                if (name) {
                    entities.push({
                        type: 'import',
                        name,
                        location: { file: filename, line: this.getLineNumber(code, match.index), column: 0 },
                        scope: 'module',
                        references: [],
                        dependencies: [match[3]],
                    });
                }
            });
        }

        // Parse functions
        const functionRegex = /(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>/g;
        while ((match = functionRegex.exec(code)) !== null) {
            const name = match[1] || match[2];
            if (name) {
                entities.push({
                    type: 'function',
                    name,
                    location: { file: filename, line: this.getLineNumber(code, match.index), column: 0 },
                    scope: 'module',
                    references: this.findReferences(code, name),
                    dependencies: [],
                });
            }
        }

        // Parse classes
        const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
        while ((match = classRegex.exec(code)) !== null) {
            entities.push({
                type: 'class',
                name: match[1],
                location: { file: filename, line: this.getLineNumber(code, match.index), column: 0 },
                scope: 'module',
                references: this.findReferences(code, match[1]),
                dependencies: match[2] ? [match[2]] : [],
            });
        }

        // Parse interfaces (TypeScript)
        const interfaceRegex = /interface\s+(\w+)/g;
        while ((match = interfaceRegex.exec(code)) !== null) {
            entities.push({
                type: 'interface',
                name: match[1],
                location: { file: filename, line: this.getLineNumber(code, match.index), column: 0 },
                scope: 'module',
                references: this.findReferences(code, match[1]),
                dependencies: [],
            });
        }

        // Parse exports
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface)\s+(\w+)/g;
        while ((match = exportRegex.exec(code)) !== null) {
            exports.push(match[1]);
        }

        // Calculate complexity
        const complexity = this.calculateComplexity(code);

        // Detect issues
        issues.push(...this.detectIssues(code));

        // Update index
        this.codeIndex.set(filename, entities);
        this.emit('code:analyzed', { filename, entities: entities.length });

        return { entities, imports, exports, complexity, issues };
    }

    private getLineNumber(code: string, index: number): number {
        return code.substring(0, index).split('\n').length;
    }

    private findReferences(code: string, name: string): string[] {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        const matches = code.match(regex) || [];
        return matches.slice(1).map((_, i) => `reference-${i}`);
    }

    private calculateComplexity(code: string): number {
        let complexity = 1;

        // Count decision points
        const patterns = [
            /\bif\b/g,
            /\belse\b/g,
            /\bfor\b/g,
            /\bwhile\b/g,
            /\bswitch\b/g,
            /\bcase\b/g,
            /\bcatch\b/g,
            /\?\?/g,
            /\?\./g,
            /&&/g,
            /\|\|/g,
        ];

        for (const pattern of patterns) {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }

        return complexity;
    }

    private detectIssues(code: string): CodeIssue[] {
        const issues: CodeIssue[] = [];

        // Console.log detection
        if (code.includes('console.log')) {
            issues.push({
                type: 'warning',
                message: 'console.log statements should be removed in production',
                location: { line: 1, column: 0 },
                suggestion: 'Use a proper logging library',
            });
        }

        // TODO comments
        const todoMatch = code.match(/\/\/\s*TODO/i);
        if (todoMatch) {
            issues.push({
                type: 'info',
                message: 'TODO comment found',
                location: { line: 1, column: 0 },
            });
        }

        // Magic numbers
        const magicNumber = code.match(/[^0-9.]\d{3,}[^0-9.]/);
        if (magicNumber) {
            issues.push({
                type: 'warning',
                message: 'Magic number detected',
                location: { line: 1, column: 0 },
                suggestion: 'Extract to a named constant',
            });
        }

        return issues;
    }

    // ========================================================================
    // SEMANTIC SEARCH
    // ========================================================================

    async semanticSearch(query: string): Promise<CodeEntity[]> {
        const results: CodeEntity[] = [];
        const queryTerms = query.toLowerCase().split(/\s+/);

        for (const entities of this.codeIndex.values()) {
            for (const entity of entities) {
                const score = this.calculateSearchScore(entity, queryTerms);
                if (score > 0.3) {
                    results.push(entity);
                }
            }
        }

        return results.sort((a, b) =>
            this.calculateSearchScore(b, queryTerms) - this.calculateSearchScore(a, queryTerms)
        );
    }

    private calculateSearchScore(entity: CodeEntity, queryTerms: string[]): number {
        let score = 0;
        const entityName = entity.name.toLowerCase();

        for (const term of queryTerms) {
            if (entityName.includes(term)) {
                score += 0.5;
            }
            if (entityName === term) {
                score += 0.5;
            }
        }

        return score / queryTerms.length;
    }

    // ========================================================================
    // DEPENDENCY ANALYSIS
    // ========================================================================

    buildDependencyGraph(files: Map<string, string>): DependencyGraph {
        this.dependencyGraph = { nodes: new Map(), edges: [] };

        for (const [filename, code] of files) {
            const imports = this.extractImports(code);

            this.dependencyGraph.nodes.set(filename, {
                file: filename,
                dependencies: imports,
            });

            for (const imp of imports) {
                this.dependencyGraph.edges.push({
                    from: filename,
                    to: imp,
                });
            }
        }

        this.emit('dependencies:built', {
            nodes: this.dependencyGraph.nodes.size,
            edges: this.dependencyGraph.edges.length,
        });

        return this.dependencyGraph;
    }

    private extractImports(code: string): string[] {
        const imports: string[] = [];
        const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;

        let match;
        while ((match = importRegex.exec(code)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }

    findCircularDependencies(): string[][] {
        const cycles: string[][] = [];
        const visited = new Set<string>();
        const stack = new Set<string>();

        const dfs = (node: string, path: string[]): void => {
            if (stack.has(node)) {
                const cycleStart = path.indexOf(node);
                cycles.push(path.slice(cycleStart));
                return;
            }

            if (visited.has(node)) return;

            visited.add(node);
            stack.add(node);
            path.push(node);

            const nodeData = this.dependencyGraph.nodes.get(node);
            if (nodeData) {
                for (const dep of nodeData.dependencies) {
                    dfs(dep, [...path]);
                }
            }

            stack.delete(node);
        };

        for (const node of this.dependencyGraph.nodes.keys()) {
            dfs(node, []);
        }

        return cycles;
    }

    // ========================================================================
    // CODE EXPLANATION
    // ========================================================================

    async explainCode(code: string): Promise<string> {
        const analysis = await this.analyzeCode(code, 'temp.ts');

        let explanation = '## Code Explanation\n\n';

        // Summarize structure
        const functions = analysis.entities.filter(e => e.type === 'function');
        const classes = analysis.entities.filter(e => e.type === 'class');
        const interfaces = analysis.entities.filter(e => e.type === 'interface');

        if (classes.length > 0) {
            explanation += `### Classes (${classes.length})\n`;
            explanation += classes.map(c => `- **${c.name}**`).join('\n') + '\n\n';
        }

        if (interfaces.length > 0) {
            explanation += `### Interfaces (${interfaces.length})\n`;
            explanation += interfaces.map(i => `- **${i.name}**`).join('\n') + '\n\n';
        }

        if (functions.length > 0) {
            explanation += `### Functions (${functions.length})\n`;
            explanation += functions.map(f => `- **${f.name}**`).join('\n') + '\n\n';
        }

        explanation += `### Complexity Score: ${analysis.complexity}\n\n`;

        if (analysis.issues.length > 0) {
            explanation += `### Issues Found (${analysis.issues.length})\n`;
            explanation += analysis.issues.map(i => `- ${i.type.toUpperCase()}: ${i.message}`).join('\n');
        }

        return explanation;
    }
}

export const codeUnderstandingEngine = CodeUnderstandingEngine.getInstance();
