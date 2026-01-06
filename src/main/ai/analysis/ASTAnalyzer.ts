/**
 * AST Analyzer
 * 
 * Deep code understanding through AST analysis,
 * semantic code manipulation, and cross-file refactoring.
 */

import { EventEmitter } from 'events';
import * as ts from 'typescript';
import { readFile, writeFile } from 'fs/promises';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export interface CodeSymbol {
    name: string;
    kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'enum' | 'import' | 'export';
    startLine: number;
    endLine: number;
    signature?: string;
    documentation?: string;
    modifiers?: string[];
    children?: CodeSymbol[];
}

export interface CodeDependency {
    source: string;
    target: string;
    type: 'import' | 'extends' | 'implements' | 'uses' | 'calls';
    line: number;
}

export interface RefactoringSuggestion {
    type: 'rename' | 'extract' | 'inline' | 'move' | 'simplify';
    description: string;
    location: { file: string; line: number };
    impact: 'low' | 'medium' | 'high';
    automatic: boolean;
}

export interface CodeAnalysisResult {
    file: string;
    language: string;
    symbols: CodeSymbol[];
    dependencies: CodeDependency[];
    complexity: number;
    issues: string[];
    suggestions: RefactoringSuggestion[];
}

// ============================================================================
// AST ANALYZER
// ============================================================================

export class ASTAnalyzer extends EventEmitter {
    private static instance: ASTAnalyzer;
    private modelManager: ModelManager;
    private analysisCache: Map<string, CodeAnalysisResult> = new Map();

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): ASTAnalyzer {
        if (!ASTAnalyzer.instance) {
            ASTAnalyzer.instance = new ASTAnalyzer();
        }
        return ASTAnalyzer.instance;
    }

    // ========================================================================
    // CODE ANALYSIS
    // ========================================================================

    /**
     * Analyze a TypeScript/JavaScript file
     */
    async analyzeFile(filePath: string): Promise<CodeAnalysisResult> {
        // Check cache
        const cached = this.analysisCache.get(filePath);
        if (cached) return cached;

        console.log(`🔬 Analyzing: ${filePath}`);
        this.emit('analysis:started', { file: filePath });

        const content = await readFile(filePath, 'utf-8');
        const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

        const result = this.analyzeTypeScript(filePath, content, isTypeScript);

        // Add AI-powered suggestions
        result.suggestions = await this.generateSuggestions(result);

        this.analysisCache.set(filePath, result);
        this.emit('analysis:completed', result);

        return result;
    }

    /**
     * Analyze TypeScript/JavaScript code
     */
    private analyzeTypeScript(filePath: string, content: string, isTS: boolean): CodeAnalysisResult {
        const sourceFile = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true,
            isTS ? ts.ScriptKind.TS : ts.ScriptKind.JS
        );

        const symbols: CodeSymbol[] = [];
        const dependencies: CodeDependency[] = [];
        let complexity = 0;
        const issues: string[] = [];

        const visit = (node: ts.Node) => {
            // Track symbols
            if (ts.isFunctionDeclaration(node) && node.name) {
                symbols.push(this.extractFunctionSymbol(node, sourceFile));
                complexity += this.calculateFunctionComplexity(node);
            }
            else if (ts.isClassDeclaration(node) && node.name) {
                symbols.push(this.extractClassSymbol(node, sourceFile));
                complexity += 2;
            }
            else if (ts.isVariableStatement(node)) {
                symbols.push(...this.extractVariableSymbols(node, sourceFile));
            }
            else if (ts.isInterfaceDeclaration(node)) {
                symbols.push(this.extractInterfaceSymbol(node, sourceFile));
            }
            else if (ts.isTypeAliasDeclaration(node)) {
                symbols.push({
                    name: node.name.text,
                    kind: 'type',
                    startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                    endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1
                });
            }

            // Track imports
            if (ts.isImportDeclaration(node)) {
                const moduleSpecifier = node.moduleSpecifier;
                if (ts.isStringLiteral(moduleSpecifier)) {
                    dependencies.push({
                        source: filePath,
                        target: moduleSpecifier.text,
                        type: 'import',
                        line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1
                    });
                }
            }

            // Detect issues
            if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
                const funcComplexity = this.calculateFunctionComplexity(node);
                if (funcComplexity > 10) {
                    const name = node.name ? (node.name as ts.Identifier).text : 'anonymous';
                    issues.push(`High complexity (${funcComplexity}) in function "${name}"`);
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);

        return {
            file: filePath,
            language: isTS ? 'typescript' : 'javascript',
            symbols,
            dependencies,
            complexity,
            issues,
            suggestions: []
        };
    }

    private extractFunctionSymbol(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): CodeSymbol {
        const name = node.name?.text || 'anonymous';
        const params = node.parameters.map(p => {
            const paramName = (p.name as ts.Identifier).text;
            const paramType = p.type ? p.type.getText(sourceFile) : 'any';
            return `${paramName}: ${paramType}`;
        }).join(', ');

        const returnType = node.type ? node.type.getText(sourceFile) : 'void';

        return {
            name,
            kind: 'function',
            startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
            signature: `function ${name}(${params}): ${returnType}`,
            modifiers: node.modifiers?.map(m => ts.SyntaxKind[m.kind]) || []
        };
    }

    private extractClassSymbol(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): CodeSymbol {
        const name = node.name?.text || 'anonymous';
        const children: CodeSymbol[] = [];

        node.members.forEach(member => {
            if (ts.isMethodDeclaration(member) && member.name) {
                children.push({
                    name: (member.name as ts.Identifier).text,
                    kind: 'function',
                    startLine: sourceFile.getLineAndCharacterOfPosition(member.getStart()).line + 1,
                    endLine: sourceFile.getLineAndCharacterOfPosition(member.getEnd()).line + 1,
                    modifiers: member.modifiers?.map(m => ts.SyntaxKind[m.kind]) || []
                });
            }
        });

        return {
            name,
            kind: 'class',
            startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
            children,
            modifiers: node.modifiers?.map(m => ts.SyntaxKind[m.kind]) || []
        };
    }

    private extractVariableSymbols(node: ts.VariableStatement, sourceFile: ts.SourceFile): CodeSymbol[] {
        return node.declarationList.declarations.map(decl => ({
            name: (decl.name as ts.Identifier).text,
            kind: 'variable' as const,
            startLine: sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line + 1,
            endLine: sourceFile.getLineAndCharacterOfPosition(decl.getEnd()).line + 1,
            modifiers: node.modifiers?.map(m => ts.SyntaxKind[m.kind]) || []
        }));
    }

    private extractInterfaceSymbol(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): CodeSymbol {
        return {
            name: node.name.text,
            kind: 'interface',
            startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1
        };
    }

    private calculateFunctionComplexity(node: ts.Node): number {
        let complexity = 1;

        const visit = (n: ts.Node) => {
            switch (n.kind) {
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.ConditionalExpression:
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.CatchClause:
                    complexity++;
                    break;
                case ts.SyntaxKind.BinaryExpression:
                    const binary = n as ts.BinaryExpression;
                    if (binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
                        binary.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
                        complexity++;
                    }
                    break;
            }
            ts.forEachChild(n, visit);
        };

        ts.forEachChild(node, visit);
        return complexity;
    }

    // ========================================================================
    // REFACTORING
    // ========================================================================

    /**
     * Generate AI-powered refactoring suggestions
     */
    private async generateSuggestions(analysis: CodeAnalysisResult): Promise<RefactoringSuggestion[]> {
        if (analysis.symbols.length === 0) return [];

        const prompt = `Analyze this code structure and suggest refactorings.

File: ${analysis.file}
Complexity: ${analysis.complexity}
Issues: ${analysis.issues.join(', ') || 'None'}

Symbols:
${analysis.symbols.slice(0, 20).map(s =>
            `- ${s.kind}: ${s.name} (lines ${s.startLine}-${s.endLine})`
        ).join('\n')}

Suggest 1-3 specific refactorings. Respond in JSON:
\`\`\`json
{
    "suggestions": [
        {
            "type": "rename|extract|inline|move|simplify",
            "description": "what to do",
            "targetSymbol": "symbol name",
            "impact": "low|medium|high"
        }
    ]
}
\`\`\``;

        try {
            const response = await this.callModel(prompt);
            const parsed = this.parseJSON(response);

            return (parsed.suggestions || []).map((s: any) => ({
                type: s.type || 'simplify',
                description: s.description,
                location: { file: analysis.file, line: 1 },
                impact: s.impact || 'low',
                automatic: s.type === 'rename' || s.type === 'simplify'
            }));
        } catch {
            return [];
        }
    }

    /**
     * Rename a symbol across files
     */
    async renameSymbol(
        filePath: string,
        oldName: string,
        newName: string,
        affectedFiles?: string[]
    ): Promise<{ file: string; changes: number }[]> {
        console.log(`✏️ Renaming "${oldName}" to "${newName}"...`);

        const results: { file: string; changes: number }[] = [];
        const files = affectedFiles || [filePath];

        for (const file of files) {
            const content = await readFile(file, 'utf-8');

            // Simple regex-based rename (would use proper AST-based in production)
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            const matches = content.match(regex);

            if (matches && matches.length > 0) {
                const newContent = content.replace(regex, newName);
                await writeFile(file, newContent);
                results.push({ file, changes: matches.length });
            }
        }

        this.emit('refactoring:completed', { type: 'rename', oldName, newName, results });
        return results;
    }

    /**
     * Extract code to a new function
     */
    async extractFunction(
        filePath: string,
        startLine: number,
        endLine: number,
        functionName: string
    ): Promise<string> {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        const extractedLines = lines.slice(startLine - 1, endLine);
        const extractedCode = extractedLines.join('\n');

        // Use AI to generate proper extraction
        const prompt = `Extract this code into a function named "${functionName}".

Code to extract:
\`\`\`
${extractedCode}
\`\`\`

Generate:
1. The new function definition
2. The function call to replace the original code

Respond in JSON:
\`\`\`json
{
    "functionDefinition": "the new function code",
    "functionCall": "the replacement call"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        if (parsed.functionDefinition && parsed.functionCall) {
            // Replace extracted code with function call
            lines.splice(startLine - 1, endLine - startLine + 1, parsed.functionCall);

            // Add function definition at the end
            lines.push('', parsed.functionDefinition);

            const newContent = lines.join('\n');
            await writeFile(filePath, newContent);

            this.emit('refactoring:completed', { type: 'extract', functionName, filePath });
        }

        return parsed.functionDefinition || '';
    }

    // ========================================================================
    // CROSS-FILE ANALYSIS
    // ========================================================================

    /**
     * Find all usages of a symbol across files
     */
    async findUsages(
        symbolName: string,
        searchPaths: string[]
    ): Promise<{ file: string; line: number; context: string }[]> {
        const usages: { file: string; line: number; context: string }[] = [];

        for (const filePath of searchPaths) {
            try {
                const content = await readFile(filePath, 'utf-8');
                const lines = content.split('\n');

                lines.forEach((line, index) => {
                    if (line.includes(symbolName)) {
                        usages.push({
                            file: filePath,
                            line: index + 1,
                            context: line.trim()
                        });
                    }
                });
            } catch {
                // Skip unreadable files
            }
        }

        return usages;
    }

    /**
     * Build dependency graph for files
     */
    async buildDependencyGraph(
        entryFile: string,
        visited: Set<string> = new Set()
    ): Promise<Map<string, string[]>> {
        const graph = new Map<string, string[]>();

        if (visited.has(entryFile)) return graph;
        visited.add(entryFile);

        const analysis = await this.analyzeFile(entryFile);
        const dependencies = analysis.dependencies
            .filter(d => d.type === 'import')
            .map(d => d.target);

        graph.set(entryFile, dependencies);

        // Note: Would resolve relative imports in production

        return graph;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async callModel(prompt: string): Promise<string> {
        try {
            return await this.modelManager.chat([
                {
                    role: 'system' as const,
                    content: 'You are a code analysis expert. Provide precise, actionable suggestions.',
                    timestamp: new Date()
                },
                {
                    role: 'user' as const,
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
        } catch {
            return '{}';
        }
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }

    clearCache(): void {
        this.analysisCache.clear();
    }

    getCachedAnalysis(filePath: string): CodeAnalysisResult | undefined {
        return this.analysisCache.get(filePath);
    }
}

// Export singleton
export const astAnalyzer = ASTAnalyzer.getInstance();
