/**
 * Semantic Code Search
 * Advanced semantic search that understands code relationships across the codebase
 * Uses AST analysis and embeddings for intelligent code discovery
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import { getASTAnalyzer, ASTAnalysis, CodeSymbol } from './ASTAnalyzer';
import { getMemoryEngine } from '../memory';

export interface SearchResult {
    filePath: string;
    symbols: CodeSymbol[];
    score: number; // relevance score 0-1
    snippet?: string;
    reason?: string; // why this result is relevant
}

export interface DependencyGraph {
    filePath: string;
    imports: string[]; // files this file imports from
    importedBy: string[]; // files that import this file
    symbols: string[]; // symbol names defined in this file
}

export interface CodebaseIndex {
    files: Map<string, ASTAnalysis>;
    dependencyGraph: Map<string, DependencyGraph>;
    symbolIndex: Map<string, CodeSymbol[]>; // symbol name -> locations
    lastIndexed: Date;
    totalFiles: number;
}

export class SemanticCodeSearch {
    private index: CodebaseIndex | null = null;
    private astAnalyzer = getASTAnalyzer();
    private memoryEngine = getMemoryEngine();
    private indexing = false;

    /**
     * Index a codebase directory
     */
    async indexCodebase(rootPath: string, options?: {
        excludePatterns?: string[];
        maxFiles?: number;
        onProgress?: (current: number, total: number) => void;
    }): Promise<void> {
        if (this.indexing) {
            throw new Error('Indexing already in progress');
        }

        this.indexing = true;
        console.log('🔍 Starting codebase indexing...');

        try {
            // Find all TypeScript/JavaScript files
            const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
            const excludePatterns = options?.excludePatterns || [
                '**/node_modules/**',
                '**/dist/**',
                '**/build/**',
                '**/.next/**',
                '**/coverage/**',
            ];

            const files: string[] = [];
            for (const pattern of patterns) {
                const found = await glob(pattern, {
                    cwd: rootPath,
                    ignore: excludePatterns,
                    absolute: true,
                });
                files.push(...found);
            }

            const maxFiles = options?.maxFiles || 10000;
            const filesToIndex = files.slice(0, maxFiles);

            console.log(`📁 Found ${filesToIndex.length} files to index`);

            // Index each file
            const filesMap = new Map<string, ASTAnalysis>();
            const symbolIndex = new Map<string, CodeSymbol[]>();

            for (let i = 0; i < filesToIndex.length; i++) {
                const filePath = filesToIndex[i];

                try {
                    const analysis = await this.astAnalyzer.analyzeFile(filePath);
                    filesMap.set(filePath, analysis);

                    // Index symbols
                    for (const symbol of analysis.symbols) {
                        const existing = symbolIndex.get(symbol.name) || [];
                        existing.push(symbol);
                        symbolIndex.set(symbol.name, existing);
                    }

                    // Store embeddings for semantic search
                    const content = await fs.readFile(filePath, 'utf-8');
                    await this.memoryEngine.remember({
                        type: 'code',
                        content: `File: ${filePath}\n\nSymbols: ${analysis.symbols.map(s => s.name).join(', ')}\n\n${content.slice(0, 1000)}`,
                        metadata: {
                            type: 'code_file',
                            filePath,
                            symbols: analysis.symbols.map(s => s.name),
                        },
                    });

                    if (options?.onProgress) {
                        options.onProgress(i + 1, filesToIndex.length);
                    }
                } catch (error) {
                    console.error(`Failed to index ${filePath}:`, error);
                }
            }

            // Build dependency graph
            const dependencyGraph = this.buildDependencyGraph(filesMap, rootPath);

            this.index = {
                files: filesMap,
                dependencyGraph,
                symbolIndex,
                lastIndexed: new Date(),
                totalFiles: filesToIndex.length,
            };

            console.log(`✅ Indexed ${filesToIndex.length} files with ${symbolIndex.size} unique symbols`);
        } finally {
            this.indexing = false;
        }
    }

    /**
     * Search for code semantically across the codebase
     */
    async search(query: string, options?: {
        maxResults?: number;
        currentFile?: string;
        symbolsOnly?: boolean;
    }): Promise<SearchResult[]> {
        if (!this.index) {
            throw new Error('Codebase not indexed. Call indexCodebase() first.');
        }

        const maxResults = options?.maxResults || 10;
        const results: SearchResult[] = [];

        // 1. Exact symbol match (highest priority)
        const exactSymbolMatches = this.findExactSymbolMatches(query);
        results.push(...exactSymbolMatches);

        // 2. Fuzzy symbol match
        const fuzzySymbolMatches = this.findFuzzySymbolMatches(query);
        results.push(...fuzzySymbolMatches);

        // 3. Semantic search using embeddings
        if (!options?.symbolsOnly) {
            const semanticMatches = await this.findSemanticMatches(query);
            results.push(...semanticMatches);
        }

        // 4. Context-based ranking (prioritize files related to current file)
        if (options?.currentFile) {
            this.rankByContext(results, options.currentFile);
        }

        // Remove duplicates and sort by score
        const uniqueResults = this.deduplicateResults(results);
        uniqueResults.sort((a, b) => b.score - a.score);

        return uniqueResults.slice(0, maxResults);
    }

    /**
     * Find files related to a given file (imports, importers, similar files)
     */
    async findRelatedFiles(filePath: string, maxResults = 10): Promise<SearchResult[]> {
        if (!this.index) {
            throw new Error('Codebase not indexed');
        }

        const results: SearchResult[] = [];
        const depGraph = this.index.dependencyGraph.get(filePath);

        if (!depGraph) {
            return results;
        }

        // Add direct imports (high relevance)
        for (const importPath of depGraph.imports) {
            const analysis = this.index.files.get(importPath);
            if (analysis) {
                results.push({
                    filePath: importPath,
                    symbols: analysis.symbols,
                    score: 0.9,
                    reason: 'Imported by current file',
                });
            }
        }

        // Add files that import this file (medium relevance)
        for (const importerPath of depGraph.importedBy) {
            const analysis = this.index.files.get(importerPath);
            if (analysis) {
                results.push({
                    filePath: importerPath,
                    symbols: analysis.symbols,
                    score: 0.7,
                    reason: 'Imports current file',
                });
            }
        }

        // Find files with similar symbols (lower relevance)
        const currentAnalysis = this.index.files.get(filePath);
        if (currentAnalysis) {
            const similarFiles = this.findFilesWithSimilarSymbols(currentAnalysis.symbols);
            results.push(...similarFiles.slice(0, 5));
        }

        return results.slice(0, maxResults);
    }

    /**
     * Get dependency graph for a file
     */
    getDependencyGraph(filePath: string): DependencyGraph | undefined {
        return this.index?.dependencyGraph.get(filePath);
    }

    /**
     * Find all references to a symbol
     */
    findSymbolReferences(symbolName: string): CodeSymbol[] {
        if (!this.index) return [];
        return this.index.symbolIndex.get(symbolName) || [];
    }

    /**
     * Update index for a single file (call when file changes)
     */
    async updateFile(filePath: string): Promise<void> {
        if (!this.index) return;

        try {
            const analysis = await this.astAnalyzer.analyzeFile(filePath);
            this.index.files.set(filePath, analysis);

            // Update symbol index
            // Remove old symbols
            this.index.symbolIndex.forEach((symbols, name) => {
                this.index!.symbolIndex.set(
                    name,
                    symbols.filter(s => s.filePath !== filePath)
                );
            });

            // Add new symbols
            for (const symbol of analysis.symbols) {
                const existing = this.index.symbolIndex.get(symbol.name) || [];
                existing.push(symbol);
                this.index.symbolIndex.set(symbol.name, existing);
            }

            // Rebuild dependency graph (only affected files)
            await this.updateDependencyGraph(filePath);
        } catch (error) {
            console.error(`Failed to update file ${filePath}:`, error);
        }
    }

    /**
     * Get index statistics
     */
    getStats() {
        if (!this.index) {
            return { indexed: false, totalFiles: 0, totalSymbols: 0 };
        }

        return {
            indexed: true,
            totalFiles: this.index.totalFiles,
            totalSymbols: this.index.symbolIndex.size,
            lastIndexed: this.index.lastIndexed,
        };
    }

    // ============ Private Helper Methods ============

    private buildDependencyGraph(
        filesMap: Map<string, ASTAnalysis>,
        rootPath: string
    ): Map<string, DependencyGraph> {
        const graph = new Map<string, DependencyGraph>();

        for (const [filePath, analysis] of filesMap.entries()) {
            const node: DependencyGraph = {
                filePath,
                imports: [],
                importedBy: [],
                symbols: analysis.symbols.map(s => s.name),
            };

            // Resolve import paths
            for (const imp of analysis.imports) {
                const resolvedPath = this.resolveImportPath(imp.moduleName, filePath, rootPath);
                if (resolvedPath && filesMap.has(resolvedPath)) {
                    node.imports.push(resolvedPath);
                }
            }

            graph.set(filePath, node);
        }

        // Build reverse dependencies (importedBy)
        for (const [filePath, node] of graph.entries()) {
            for (const importPath of node.imports) {
                const importedNode = graph.get(importPath);
                if (importedNode) {
                    importedNode.importedBy.push(filePath);
                }
            }
        }

        return graph;
    }

    private resolveImportPath(moduleName: string, fromFile: string, rootPath: string): string | null {
        // Only resolve relative imports
        if (!moduleName.startsWith('.')) {
            return null;
        }

        const dir = path.dirname(fromFile);
        let resolved = path.resolve(dir, moduleName);

        // Try different extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
        for (const ext of extensions) {
            const withExt = resolved + ext;
            if (this.index?.files.has(withExt)) {
                return withExt;
            }
        }

        return null;
    }

    private findExactSymbolMatches(query: string): SearchResult[] {
        if (!this.index) return [];

        const symbols = this.index.symbolIndex.get(query);
        if (!symbols) return [];

        const results: SearchResult[] = [];
        const fileGroups = new Map<string, CodeSymbol[]>();

        // Group symbols by file
        for (const symbol of symbols) {
            const existing = fileGroups.get(symbol.filePath) || [];
            existing.push(symbol);
            fileGroups.set(symbol.filePath, existing);
        }

        // Create results
        for (const [filePath, fileSymbols] of fileGroups.entries()) {
            results.push({
                filePath,
                symbols: fileSymbols,
                score: 1.0,
                reason: 'Exact symbol match',
            });
        }

        return results;
    }

    private findFuzzySymbolMatches(query: string): SearchResult[] {
        if (!this.index) return [];

        const results: SearchResult[] = [];
        const lowerQuery = query.toLowerCase();

        for (const [symbolName, symbols] of this.index.symbolIndex.entries()) {
            const lowerSymbol = symbolName.toLowerCase();

            // Calculate fuzzy match score
            let score = 0;
            if (lowerSymbol.includes(lowerQuery)) {
                score = 0.6 + (0.3 * (lowerQuery.length / lowerSymbol.length));
            } else if (this.levenshteinDistance(lowerQuery, lowerSymbol) <= 2) {
                score = 0.5;
            }

            if (score > 0) {
                const fileGroups = new Map<string, CodeSymbol[]>();
                for (const symbol of symbols) {
                    const existing = fileGroups.get(symbol.filePath) || [];
                    existing.push(symbol);
                    fileGroups.set(symbol.filePath, existing);
                }

                for (const [filePath, fileSymbols] of fileGroups.entries()) {
                    results.push({
                        filePath,
                        symbols: fileSymbols,
                        score,
                        reason: 'Fuzzy symbol match',
                    });
                }
            }
        }

        return results;
    }

    private async findSemanticMatches(query: string): Promise<SearchResult[]> {
        // Use memory engine for semantic search
        const memories = await this.memoryEngine.recall(query, 5);

        const results: SearchResult[] = [];
        for (const memory of memories) {
            if (memory.metadata?.type === 'code_file' && memory.metadata.filePath) {
                const analysis = this.index?.files.get(memory.metadata.filePath);
                if (analysis) {
                    results.push({
                        filePath: memory.metadata.filePath,
                        symbols: analysis.symbols,
                        score: 0.4,
                        reason: 'Semantic relevance',
                        snippet: memory.content.slice(0, 200),
                    });
                }
            }
        }

        return results;
    }

    private findFilesWithSimilarSymbols(symbols: CodeSymbol[]): SearchResult[] {
        if (!this.index) return [];

        const results: SearchResult[] = [];
        const symbolNames = new Set(symbols.map(s => s.name));

        for (const [filePath, analysis] of this.index.files.entries()) {
            const commonSymbols = analysis.symbols.filter(s => symbolNames.has(s.name));
            if (commonSymbols.length > 0) {
                const score = 0.3 * (commonSymbols.length / symbols.length);
                results.push({
                    filePath,
                    symbols: commonSymbols,
                    score,
                    reason: `${commonSymbols.length} matching symbols`,
                });
            }
        }

        return results;
    }

    private rankByContext(results: SearchResult[], currentFile: string): void {
        const depGraph = this.index?.dependencyGraph.get(currentFile);
        if (!depGraph) return;

        const relatedFiles = new Set([
            ...depGraph.imports,
            ...depGraph.importedBy,
        ]);

        for (const result of results) {
            if (relatedFiles.has(result.filePath)) {
                result.score *= 1.5; // Boost score for related files
            }
        }
    }

    private deduplicateResults(results: SearchResult[]): SearchResult[] {
        const seen = new Set<string>();
        const unique: SearchResult[] = [];

        for (const result of results) {
            if (!seen.has(result.filePath)) {
                seen.add(result.filePath);
                unique.push(result);
            }
        }

        return unique;
    }

    private levenshteinDistance(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    private async updateDependencyGraph(filePath: string): Promise<void> {
        // Simplified version - full rebuild would be more complex
        // In production, would only update affected nodes
        if (!this.index) return;

        const analysis = this.index.files.get(filePath);
        if (!analysis) return;

        const node = this.index.dependencyGraph.get(filePath);
        if (node) {
            // Update imports
            node.imports = [];
            for (const imp of analysis.imports) {
                const rootPath = path.dirname(filePath);
                const resolvedPath = this.resolveImportPath(imp.moduleName, filePath, rootPath);
                if (resolvedPath && this.index.files.has(resolvedPath)) {
                    node.imports.push(resolvedPath);
                }
            }
        }
    }
}

// Singleton instance
let instance: SemanticCodeSearch | null = null;

export function getSemanticCodeSearch(): SemanticCodeSearch {
    if (!instance) {
        instance = new SemanticCodeSearch();
    }
    return instance;
}
