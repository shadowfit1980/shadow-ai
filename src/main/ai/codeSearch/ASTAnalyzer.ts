/**
 * AST Analyzer
 * Parses and analyzes code structure using Abstract Syntax Trees
 * Supports TypeScript/JavaScript using TypeScript compiler API
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CodeSymbol {
    name: string;
    kind: ts.SyntaxKind;
    kindName: string;
    startLine: number;
    endLine: number;
    filePath: string;
    scope?: string; // parent class/namespace
    type?: string;
    documentation?: string;
    modifiers?: string[];
    references?: SymbolReference[];
}

export interface SymbolReference {
    filePath: string;
    line: number;
    column: number;
    isDefinition: boolean;
}

export interface ImportInfo {
    moduleName: string;
    importedNames: string[];
    isDefault: boolean;
    isNamespace: boolean;
    alias?: string;
    filePath: string;
    line: number;
}

export interface ExportInfo {
    name: string;
    isDefault: boolean;
    filePath: string;
    line: number;
}

export interface ASTAnalysis {
    filePath: string;
    symbols: CodeSymbol[];
    imports: ImportInfo[];
    exports: ExportInfo[];
    dependencies: string[]; // list of file paths this file depends on
    language: 'typescript' | 'javascript' | 'tsx' | 'jsx';
    lastAnalyzed: Date;
}

export class ASTAnalyzer {
    private fileCache = new Map<string, ASTAnalysis>();
    private readonly CACHE_DURATION_MS = 60000; // 1 minute

    /**
     * Analyze a TypeScript/JavaScript file and extract symbols, imports, exports
     */
    async analyzeFile(filePath: string): Promise<ASTAnalysis> {
        // Check cache first
        const cached = this.fileCache.get(filePath);
        if (cached && Date.now() - cached.lastAnalyzed.getTime() < this.CACHE_DURATION_MS) {
            return cached;
        }

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const analysis = this.analyzeContent(content, filePath);
            this.fileCache.set(filePath, analysis);
            return analysis;
        } catch (error) {
            console.error(`Failed to analyze file ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Analyze content directly (useful for unsaved editor content)
     */
    analyzeContent(content: string, filePath: string): ASTAnalysis {
        const language = this.detectLanguage(filePath);
        const sourceFile = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true,
            this.getScriptKind(language)
        );

        const symbols: CodeSymbol[] = [];
        const imports: ImportInfo[] = [];
        const exports: ExportInfo[] = [];
        const dependencies = new Set<string>();

        // Visit all nodes in the AST
        const visit = (node: ts.Node, scope?: string) => {
            // Extract symbols
            if (this.isSymbolNode(node)) {
                const symbol = this.extractSymbol(node, sourceFile, filePath, scope);
                if (symbol) {
                    symbols.push(symbol);
                }
            }

            // Extract imports
            if (ts.isImportDeclaration(node)) {
                const importInfo = this.extractImport(node, sourceFile, filePath);
                if (importInfo) {
                    imports.push(importInfo);
                    dependencies.add(importInfo.moduleName);
                }
            }

            // Extract exports
            if (this.isExportNode(node)) {
                const exportInfo = this.extractExport(node, sourceFile, filePath);
                if (exportInfo) {
                    exports.push(exportInfo);
                }
            }

            // Recurse with updated scope
            const newScope = this.getNodeScope(node, scope);
            ts.forEachChild(node, (child) => visit(child, newScope));
        };

        visit(sourceFile);

        return {
            filePath,
            symbols,
            imports,
            exports,
            dependencies: Array.from(dependencies),
            language,
            lastAnalyzed: new Date(),
        };
    }

    /**
     * Find symbol at a specific position
     */
    findSymbolAtPosition(filePath: string, line: number, column: number): CodeSymbol | undefined {
        const analysis = this.fileCache.get(filePath);
        if (!analysis) return undefined;

        return analysis.symbols.find(
            (symbol) => symbol.startLine <= line && symbol.endLine >= line
        );
    }

    /**
     * Get all symbols in a file matching a pattern
     */
    searchSymbols(filePath: string, pattern: string): CodeSymbol[] {
        const analysis = this.fileCache.get(filePath);
        if (!analysis) return [];

        const regex = new RegExp(pattern, 'i');
        return analysis.symbols.filter((symbol) => regex.test(symbol.name));
    }

    /**
     * Clear cache for a specific file (call when file is modified)
     */
    invalidateCache(filePath: string): void {
        this.fileCache.delete(filePath);
    }

    /**
     * Clear entire cache
     */
    clearCache(): void {
        this.fileCache.clear();
    }

    // ============ Private Helper Methods ============

    private detectLanguage(filePath: string): 'typescript' | 'javascript' | 'tsx' | 'jsx' {
        const ext = path.extname(filePath);
        switch (ext) {
            case '.ts':
                return 'typescript';
            case '.tsx':
                return 'tsx';
            case '.jsx':
                return 'jsx';
            case '.js':
            case '.mjs':
            default:
                return 'javascript';
        }
    }

    private getScriptKind(language: string): ts.ScriptKind {
        switch (language) {
            case 'typescript':
                return ts.ScriptKind.TS;
            case 'tsx':
                return ts.ScriptKind.TSX;
            case 'jsx':
                return ts.ScriptKind.JSX;
            case 'javascript':
            default:
                return ts.ScriptKind.JS;
        }
    }

    private isSymbolNode(node: ts.Node): boolean {
        return (
            ts.isFunctionDeclaration(node) ||
            ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isVariableDeclaration(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isPropertyDeclaration(node)
        );
    }

    private extractSymbol(
        node: ts.Node,
        sourceFile: ts.SourceFile,
        filePath: string,
        scope?: string
    ): CodeSymbol | null {
        const name = this.getNodeName(node);
        if (!name) return null;

        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

        return {
            name,
            kind: node.kind,
            kindName: ts.SyntaxKind[node.kind],
            startLine: startLine + 1,
            endLine: endLine + 1,
            filePath,
            scope,
            type: this.getNodeType(node),
            documentation: this.getDocumentation(node),
            modifiers: this.getModifiers(node),
        };
    }

    private getNodeName(node: ts.Node): string | null {
        if ('name' in node && node.name) {
            const name = node.name as ts.Node;
            if (ts.isIdentifier(name)) {
                return name.text;
            }
        }
        return null;
    }

    private getNodeType(node: ts.Node): string | undefined {
        if (ts.isVariableDeclaration(node) && node.type) {
            return node.type.getText();
        }
        if (ts.isFunctionDeclaration(node) && node.type) {
            return node.type.getText();
        }
        return undefined;
    }

    private getDocumentation(node: ts.Node): string | undefined {
        const jsDoc = (node as any).jsDoc;
        if (jsDoc && jsDoc.length > 0) {
            return jsDoc[0].comment;
        }
        return undefined;
    }

    private getModifiers(node: ts.Node): string[] | undefined {
        if ('modifiers' in node && node.modifiers) {
            return (node.modifiers as ts.NodeArray<ts.Modifier>).map((mod) =>
                ts.SyntaxKind[mod.kind].toLowerCase()
            );
        }
        return undefined;
    }

    private getNodeScope(node: ts.Node, currentScope?: string): string | undefined {
        const name = this.getNodeName(node);
        if (!name) return currentScope;

        if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
            return currentScope ? `${currentScope}.${name}` : name;
        }

        return currentScope;
    }

    private extractImport(
        node: ts.ImportDeclaration,
        sourceFile: ts.SourceFile,
        filePath: string
    ): ImportInfo | null {
        const moduleSpecifier = node.moduleSpecifier;
        if (!ts.isStringLiteral(moduleSpecifier)) return null;

        const moduleName = moduleSpecifier.text;
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        const importClause = node.importClause;
        if (!importClause) {
            // Side-effect import: import './file'
            return {
                moduleName,
                importedNames: [],
                isDefault: false,
                isNamespace: false,
                filePath,
                line: line + 1,
            };
        }

        const importedNames: string[] = [];
        let isDefault = false;
        let isNamespace = false;
        let alias: string | undefined;

        // Default import: import Foo from './foo'
        if (importClause.name) {
            isDefault = true;
            importedNames.push(importClause.name.text);
        }

        // Named imports: import { A, B } from './foo'
        if (importClause.namedBindings) {
            if (ts.isNamespaceImport(importClause.namedBindings)) {
                // Namespace import: import * as Foo from './foo'
                isNamespace = true;
                alias = importClause.namedBindings.name.text;
            } else if (ts.isNamedImports(importClause.namedBindings)) {
                importClause.namedBindings.elements.forEach((element) => {
                    importedNames.push(element.name.text);
                });
            }
        }

        return {
            moduleName,
            importedNames,
            isDefault,
            isNamespace,
            alias,
            filePath,
            line: line + 1,
        };
    }

    private isExportNode(node: ts.Node): boolean {
        return (
            ts.isExportDeclaration(node) ||
            ts.isExportAssignment(node) ||
            ((ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)) ?? false)
        );
    }

    private extractExport(
        node: ts.Node,
        sourceFile: ts.SourceFile,
        filePath: string
    ): ExportInfo | null {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

        // Export default
        if (ts.isExportAssignment(node)) {
            return {
                name: 'default',
                isDefault: true,
                filePath,
                line: line + 1,
            };
        }

        // Named export
        const name = this.getNodeName(node);
        if (name) {
            return {
                name,
                isDefault: false,
                filePath,
                line: line + 1,
            };
        }

        return null;
    }
}

// Singleton instance
let instance: ASTAnalyzer | null = null;

export function getASTAnalyzer(): ASTAnalyzer {
    if (!instance) {
        instance = new ASTAnalyzer();
    }
    return instance;
}
