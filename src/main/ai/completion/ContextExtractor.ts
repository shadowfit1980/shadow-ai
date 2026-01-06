import * as fs from 'fs/promises';
import * as path from 'path';
import { EditorContext, FileContext, Position, Symbol as FileSymbol } from './types';
import { getASTAnalyzer } from '../codeSearch/ASTAnalyzer';
import { getSemanticCodeSearch } from '../codeSearch/SemanticCodeSearch';

/**
 * Context Extractor
 * Extracts relevant context for code completions
 */
export class ContextExtractor {
    private fileContextCache: Map<string, { context: FileContext; timestamp: number }> = new Map();
    private cacheTTL = 60000; // 1 minute
    private astAnalyzer = getASTAnalyzer();
    private semanticSearch = getSemanticCodeSearch();

    /**
     * Extract context from editor state with enhanced semantic understanding
     */
    async extractContext(editorContext: EditorContext): Promise<{
        currentFile: FileContext;
        relatedFiles: FileContext[];
        cursorContext: string;
        relevantSymbols: FileSymbol[];
        semanticallyRelatedFiles?: FileContext[];
        typeInformation?: any;
    }> {
        const { filePath, content, cursorPosition } = editorContext;

        // Use AST analysis for superior context extraction
        const astAnalysis = await this.astAnalyzer.analyzeContent(content, filePath);

        // Convert AST analysis to FileContext format (backward compatibility)
        const currentFile: FileContext = {
            imports: astAnalysis.imports.map(imp => imp.moduleName),
            exports: astAnalysis.exports.map(exp => exp.name),
            functions: astAnalysis.symbols.filter(s => s.kindName.includes('Function')).map(s => s.name),
            classes: astAnalysis.symbols.filter(s => s.kindName.includes('Class')).map(s => s.name),
            variables: astAnalysis.symbols.filter(s => s.kindName === 'VariableDeclaration').map(s => s.name),
            types: astAnalysis.symbols.filter(s =>
                s.kindName.includes('Interface') || s.kindName.includes('TypeAlias')
            ).map(s => s.name),
        };

        // Get cursor context (lines around cursor)
        const cursorContext = this.getCursorContext(content, cursorPosition, 10);

        // Get symbol at cursor position for type inference
        const symbolAtCursor = this.astAnalyzer.findSymbolAtPosition(
            filePath,
            cursorPosition.line,
            cursorPosition.character
        );

        // Get related files using semantic search (imports + semantically similar)
        const relatedFiles: FileContext[] = [];
        const semanticallyRelatedFiles: FileContext[] = [];

        try {
            // Get files based on imports (traditional approach)
            const importBasedFiles = await this.getRelatedFiles(filePath, currentFile.imports);
            relatedFiles.push(...importBasedFiles);

            // Get semantically related files using our new semantic search
            const searchResults = await this.semanticSearch.findRelatedFiles(filePath, 5);
            for (const result of searchResults) {
                const fileContext = await this.analyzeFile(result.filePath);
                semanticallyRelatedFiles.push(fileContext);
            }
        } catch (error) {
            console.warn('Semantic search not available (codebase not indexed):', error);
        }

        // Find relevant symbols using AST analysis
        const relevantSymbols = this.findRelevantSymbolsEnhanced(cursorContext, astAnalysis.symbols);

        return {
            currentFile,
            relatedFiles,
            cursorContext,
            relevantSymbols,
            semanticallyRelatedFiles,
            typeInformation: symbolAtCursor,
        };
    }

    /**
     * Analyze a file to extract symbols and structure
     */
    private async analyzeFile(filePath: string, content?: string): Promise<FileContext> {
        // Check cache first
        const cached = this.fileContextCache.get(filePath);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.context;
        }

        // Read file if content not provided
        if (!content) {
            try {
                content = await fs.readFile(filePath, 'utf-8');
            } catch (error) {
                console.error(`Failed to read file: ${filePath}`, error);
                return this.emptyContext();
            }
        }

        const context: FileContext = {
            imports: [],
            exports: [],
            functions: [],
            classes: [],
            variables: [],
            types: [],
        };

        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            // Imports
            const importMatch = trimmed.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                context.imports.push(importMatch[1]);
            }

            // Functions
            const funcMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
            if (funcMatch) {
                context.functions.push(funcMatch[1]);
            }

            // Arrow functions
            const arrowMatch = trimmed.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/);
            if (arrowMatch) {
                context.functions.push(arrowMatch[1]);
            }

            // Classes
            const classMatch = trimmed.match(/(?:export\s+)?class\s+(\w+)/);
            if (classMatch) {
                context.classes.push(classMatch[1]);
            }

            // Interfaces  
            const interfaceMatch = trimmed.match(/(?:export\s+)?interface\s+(\w+)/);
            if (interfaceMatch) {
                context.types.push(interfaceMatch[1]);
            }

            // Types
            const typeMatch = trimmed.match(/(?:export\s+)?type\s+(\w+)/);
            if (typeMatch) {
                context.types.push(typeMatch[1]);
            }

            // Variables
            const varMatch = trimmed.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)/);
            if (varMatch && !arrowMatch) {
                context.variables.push(varMatch[1]);
            }

            // Exports
            if (trimmed.startsWith('export')) {
                const exportMatch = trimmed.match(/export\s+(?:\{([^}]+)\}|(\w+))/);
                if (exportMatch) {
                    if (exportMatch[1]) {
                        const names = exportMatch[1].split(',').map(n => n.trim());
                        context.exports.push(...names);
                    } else if (exportMatch[2]) {
                        context.exports.push(exportMatch[2]);
                    }
                }
            }
        }

        // Cache the result
        this.fileContextCache.set(filePath, {
            context,
            timestamp: Date.now(),
        });

        return context;
    }

    /**
     * Get lines around cursor position
     */
    private getCursorContext(content: string, position: Position, linesBefore: number = 10): string {
        const lines = content.split('\n');
        const startLine = Math.max(0, position.line - linesBefore);
        const endLine = Math.min(lines.length, position.line + 3);

        return lines.slice(startLine, endLine).join('\n');
    }

    /**
     * Get related files based on imports
     */
    private async getRelatedFiles(currentFile: string, imports: string[]): Promise<FileContext[]> {
        const relatedFiles: FileContext[] = [];
        const currentDir = path.dirname(currentFile);

        for (const importPath of imports) {
            // Only process relative imports
            if (importPath.startsWith('.')) {
                const resolvedPath = path.resolve(currentDir, importPath);
                const possiblePaths = [
                    resolvedPath,
                    `${resolvedPath}.ts`,
                    `${resolvedPath}.tsx`,
                    `${resolvedPath}.js`,
                    `${resolvedPath}.jsx`,
                    path.join(resolvedPath, 'index.ts'),
                    path.join(resolvedPath, 'index.tsx'),
                ];

                for (const filePath of possiblePaths) {
                    try {
                        const stats = await fs.stat(filePath);
                        if (stats.isFile()) {
                            const context = await this.analyzeFile(filePath);
                            relatedFiles.push(context);
                            break;
                        }
                    } catch {
                        // File doesn't exist, continue
                    }
                }
            }
        }

        return relatedFiles;
    }

    /**
     * Find symbols relevant to cursor context (legacy method for backward compatibility)
     */
    private findRelevantSymbols(cursorContext: string, fileContext: FileContext): FileSymbol[] {
        const symbols: FileSymbol[] = [];
        const words = cursorContext.match(/\w+/g) || [];
        const uniqueWords = new Set(words);

        // Add functions that are referenced
        fileContext.functions.forEach(func => {
            if (uniqueWords.has(func)) {
                symbols.push({
                    name: func,
                    kind: 'function',
                    location: {
                        file: 'current',
                        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                    },
                });
            }
        });

        // Add classes
        fileContext.classes.forEach(cls => {
            if (uniqueWords.has(cls)) {
                symbols.push({
                    name: cls,
                    kind: 'class',
                    location: {
                        file: 'current',
                        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                    },
                });
            }
        });

        return symbols;
    }

    /**
     * Enhanced symbol finding using AST analysis
     */
    private findRelevantSymbolsEnhanced(cursorContext: string, astSymbols: any[]): FileSymbol[] {
        const symbols: FileSymbol[] = [];
        const words = cursorContext.match(/\w+/g) || [];
        const uniqueWords = new Set(words);

        for (const astSymbol of astSymbols) {
            if (uniqueWords.has(astSymbol.name)) {
                symbols.push({
                    name: astSymbol.name,
                    kind: this.mapASTKindToSymbolKind(astSymbol.kindName),
                    location: {
                        file: astSymbol.filePath,
                        range: {
                            start: { line: astSymbol.startLine, character: 0 },
                            end: { line: astSymbol.endLine, character: 0 },
                        },
                    },
                });
            }
        }

        return symbols;
    }

    /**
     * Map AST SyntaxKind to symbol kind string
     */
    private mapASTKindToSymbolKind(kindName: string): string {
        if (kindName.includes('Function') || kindName.includes('Method')) return 'function';
        if (kindName.includes('Class')) return 'class';
        if (kindName.includes('Interface')) return 'interface';
        if (kindName.includes('Type')) return 'type';
        if (kindName.includes('Variable')) return 'variable';
        if (kindName.includes('Property')) return 'property';
        return 'unknown';
    }

    /**
     * Get text before cursor on current line
     */
    getLinePrefix(content: string, position: Position): string {
        const lines = content.split('\n');
        if (position.line >= lines.length) return '';

        const line = lines[position.line];
        return line.substring(0, position.character);
    }

    /**
     * Check if cursor is in a specific context (string, comment, etc.)
     */
    getCursorLanguageContext(content: string, position: Position): {
        inString: boolean;
        inComment: boolean;
        inJSDoc: boolean;
        language: string;
    } {
        const textBefore = content.substring(0, this.positionToOffset(content, position));

        // Simple heuristics (can be improved with proper AST parsing)
        const inString = (textBefore.match(/"/g) || []).length % 2 === 1 ||
            (textBefore.match(/'/g) || []).length % 2 === 1;
        const inComment = textBefore.lastIndexOf('/*') > textBefore.lastIndexOf('*/') ||
            textBefore.split('\n').pop()?.trim().startsWith('//') || false;
        const inJSDoc = textBefore.lastIndexOf('/**') > textBefore.lastIndexOf('*/');

        return {
            inString,
            inComment,
            inJSDoc,
            language: this.detectLanguageContext(textBefore),
        };
    }

    /**
     * Convert position to character offset
     */
    private positionToOffset(content: string, position: Position): number {
        const lines = content.split('\n');
        let offset = 0;

        for (let i = 0; i < position.line && i < lines.length; i++) {
            offset += lines[i].length + 1; // +1 for newline
        }

        return offset + position.character;
    }

    /**
     * Detect language context (JSX, TypeScript, etc.)
     */
    private detectLanguageContext(text: string): string {
        if (text.includes('<') && text.includes('/>')) return 'jsx';
        if (text.includes('interface') || text.includes(': ')) return 'typescript';
        return 'javascript';
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.fileContextCache.clear();
    }

    /**
     * Empty context for error cases
     */
    private emptyContext(): FileContext {
        return {
            imports: [],
            exports: [],
            functions: [],
            classes: [],
            variables: [],
            types: [],
        };
    }
}
