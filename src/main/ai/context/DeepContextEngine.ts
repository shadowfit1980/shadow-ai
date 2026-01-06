/**
 * Deep Context Engine
 * 
 * Enhanced context gathering with semantic code graph,
 * multi-repo support, and 1M+ token context windows.
 * Inspired by Sourcegraph Cody and Windsurf.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface CodeSymbol {
    name: string;
    type: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'import' | 'export';
    file: string;
    line: number;
    endLine: number;
    signature?: string;
    docstring?: string;
    references: string[];
    dependencies: string[];
}

export interface CodeFile {
    path: string;
    relativePath: string;
    language: string;
    size: number;
    lastModified: Date;
    symbols: CodeSymbol[];
    imports: string[];
    exports: string[];
    content?: string;
}

export interface RepoContext {
    root: string;
    name: string;
    files: Map<string, CodeFile>;
    symbols: Map<string, CodeSymbol>;
    dependencies: Map<string, Set<string>>;
    indexed: boolean;
    lastIndexed?: Date;
}

export interface ContextQuery {
    query: string;
    files?: string[];
    symbols?: string[];
    maxTokens?: number;
    includeImports?: boolean;
    includeDependencies?: boolean;
}

export interface ContextResult {
    relevantFiles: CodeFile[];
    relevantSymbols: CodeSymbol[];
    context: string;
    tokenCount: number;
    sources: string[];
}

// ============================================================================
// DEEP CONTEXT ENGINE
// ============================================================================

export class DeepContextEngine extends EventEmitter {
    private static instance: DeepContextEngine;
    private repos: Map<string, RepoContext> = new Map();
    private maxContextTokens = 1000000; // 1M token support
    private tokenEstimator = 4; // ~4 chars per token

    private constructor() {
        super();
    }

    static getInstance(): DeepContextEngine {
        if (!DeepContextEngine.instance) {
            DeepContextEngine.instance = new DeepContextEngine();
        }
        return DeepContextEngine.instance;
    }

    // ========================================================================
    // REPOSITORY INDEXING
    // ========================================================================

    /**
     * Index a repository for semantic understanding
     */
    async indexRepository(repoPath: string): Promise<RepoContext> {
        const repoName = path.basename(repoPath);
        this.emit('index:started', { repo: repoName, path: repoPath });

        const context: RepoContext = {
            root: repoPath,
            name: repoName,
            files: new Map(),
            symbols: new Map(),
            dependencies: new Map(),
            indexed: false,
        };

        try {
            // Scan all source files
            const files = await this.scanSourceFiles(repoPath);

            for (const filePath of files) {
                const file = await this.parseFile(filePath, repoPath);
                if (file) {
                    context.files.set(file.relativePath, file);

                    // Index symbols
                    for (const symbol of file.symbols) {
                        context.symbols.set(`${file.relativePath}:${symbol.name}`, symbol);
                    }

                    // Track dependencies
                    for (const imp of file.imports) {
                        if (!context.dependencies.has(file.relativePath)) {
                            context.dependencies.set(file.relativePath, new Set());
                        }
                        context.dependencies.get(file.relativePath)!.add(imp);
                    }
                }

                this.emit('index:progress', {
                    repo: repoName,
                    file: filePath,
                    total: files.length
                });
            }

            context.indexed = true;
            context.lastIndexed = new Date();
            this.repos.set(repoPath, context);

            this.emit('index:completed', {
                repo: repoName,
                files: context.files.size,
                symbols: context.symbols.size
            });

            return context;

        } catch (error: any) {
            this.emit('index:failed', { repo: repoName, error: error.message });
            throw error;
        }
    }

    /**
     * Scan for source files in a repository
     */
    private async scanSourceFiles(dir: string, files: string[] = []): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip common non-source directories
            if (entry.isDirectory()) {
                if (['node_modules', '.git', 'dist', 'build', '__pycache__', '.next'].includes(entry.name)) {
                    continue;
                }
                await this.scanSourceFiles(fullPath, files);
            } else if (this.isSourceFile(entry.name)) {
                files.push(fullPath);
            }
        }

        return files;
    }

    private isSourceFile(filename: string): boolean {
        const extensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go',
            '.rs', '.c', '.cpp', '.h', '.hpp', '.cs', '.rb',
            '.php', '.swift', '.kt', '.scala', '.vue', '.svelte'
        ];
        return extensions.some(ext => filename.endsWith(ext));
    }

    /**
     * Parse a source file and extract symbols
     */
    private async parseFile(filePath: string, repoRoot: string): Promise<CodeFile | null> {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            const relativePath = path.relative(repoRoot, filePath);
            const language = this.detectLanguage(filePath);

            const file: CodeFile = {
                path: filePath,
                relativePath,
                language,
                size: stats.size,
                lastModified: stats.mtime,
                symbols: this.extractSymbols(content, language, relativePath),
                imports: this.extractImports(content, language),
                exports: this.extractExports(content, language),
            };

            return file;

        } catch {
            return null;
        }
    }

    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath);
        const langMap: Record<string, string> = {
            '.ts': 'typescript', '.tsx': 'typescript',
            '.js': 'javascript', '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.c': 'c', '.cpp': 'cpp', '.h': 'c', '.hpp': 'cpp',
            '.cs': 'csharp',
            '.rb': 'ruby',
            '.php': 'php',
            '.vue': 'vue',
            '.svelte': 'svelte',
        };
        return langMap[ext] || 'unknown';
    }

    /**
     * Extract symbols from source code (simplified)
     */
    private extractSymbols(content: string, language: string, file: string): CodeSymbol[] {
        const symbols: CodeSymbol[] = [];
        const lines = content.split('\n');

        // TypeScript/JavaScript patterns
        if (['typescript', 'javascript'].includes(language)) {
            lines.forEach((line, idx) => {
                // Functions
                const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
                if (funcMatch) {
                    symbols.push({
                        name: funcMatch[1],
                        type: 'function',
                        file,
                        line: idx + 1,
                        endLine: idx + 1,
                        signature: line.trim(),
                        references: [],
                        dependencies: [],
                    });
                }

                // Classes
                const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
                if (classMatch) {
                    symbols.push({
                        name: classMatch[1],
                        type: 'class',
                        file,
                        line: idx + 1,
                        endLine: idx + 1,
                        signature: line.trim(),
                        references: [],
                        dependencies: [],
                    });
                }

                // Interfaces
                const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
                if (interfaceMatch) {
                    symbols.push({
                        name: interfaceMatch[1],
                        type: 'interface',
                        file,
                        line: idx + 1,
                        endLine: idx + 1,
                        signature: line.trim(),
                        references: [],
                        dependencies: [],
                    });
                }

                // Type aliases
                const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)/);
                if (typeMatch) {
                    symbols.push({
                        name: typeMatch[1],
                        type: 'type',
                        file,
                        line: idx + 1,
                        endLine: idx + 1,
                        signature: line.trim(),
                        references: [],
                        dependencies: [],
                    });
                }
            });
        }

        // Python patterns
        if (language === 'python') {
            lines.forEach((line, idx) => {
                // Functions
                const funcMatch = line.match(/^def\s+(\w+)/);
                if (funcMatch) {
                    symbols.push({
                        name: funcMatch[1],
                        type: 'function',
                        file,
                        line: idx + 1,
                        endLine: idx + 1,
                        signature: line.trim(),
                        references: [],
                        dependencies: [],
                    });
                }

                // Classes
                const classMatch = line.match(/^class\s+(\w+)/);
                if (classMatch) {
                    symbols.push({
                        name: classMatch[1],
                        type: 'class',
                        file,
                        line: idx + 1,
                        endLine: idx + 1,
                        signature: line.trim(),
                        references: [],
                        dependencies: [],
                    });
                }
            });
        }

        return symbols;
    }

    private extractImports(content: string, language: string): string[] {
        const imports: string[] = [];
        const lines = content.split('\n');

        if (['typescript', 'javascript'].includes(language)) {
            lines.forEach(line => {
                const match = line.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
                if (match) imports.push(match[1]);
            });
        }

        if (language === 'python') {
            lines.forEach(line => {
                const importMatch = line.match(/^import\s+(\w+)/);
                const fromMatch = line.match(/^from\s+(\S+)\s+import/);
                if (importMatch) imports.push(importMatch[1]);
                if (fromMatch) imports.push(fromMatch[1]);
            });
        }

        return imports;
    }

    private extractExports(content: string, language: string): string[] {
        const exports: string[] = [];
        const lines = content.split('\n');

        if (['typescript', 'javascript'].includes(language)) {
            lines.forEach(line => {
                if (line.startsWith('export ')) {
                    const match = line.match(/export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/);
                    if (match) exports.push(match[1]);
                }
            });
        }

        return exports;
    }

    // ========================================================================
    // CONTEXT RETRIEVAL
    // ========================================================================

    /**
     * Get relevant context for a query
     */
    async getContext(repoPath: string, query: ContextQuery): Promise<ContextResult> {
        const repo = this.repos.get(repoPath);
        if (!repo || !repo.indexed) {
            throw new Error('Repository not indexed. Call indexRepository first.');
        }

        const relevantFiles: CodeFile[] = [];
        const relevantSymbols: CodeSymbol[] = [];
        const sources: string[] = [];

        // Find relevant files based on query
        const queryTerms = query.query.toLowerCase().split(/\s+/);

        for (const [, file] of repo.files) {
            // Check if filename matches
            const fileScore = queryTerms.reduce((score, term) => {
                if (file.relativePath.toLowerCase().includes(term)) score += 2;
                return score;
            }, 0);

            // Check symbol matches
            for (const symbol of file.symbols) {
                const symbolScore = queryTerms.reduce((score, term) => {
                    if (symbol.name.toLowerCase().includes(term)) score += 3;
                    if (symbol.signature?.toLowerCase().includes(term)) score += 1;
                    return score;
                }, 0);

                if (symbolScore > 0) {
                    relevantSymbols.push(symbol);
                }
            }

            if (fileScore > 0 || file.symbols.some(s => relevantSymbols.includes(s))) {
                relevantFiles.push(file);
            }
        }

        // Build context string
        let context = '';
        let tokenCount = 0;
        const maxTokens = query.maxTokens || this.maxContextTokens;

        for (const file of relevantFiles.slice(0, 50)) {
            const content = await fs.readFile(file.path, 'utf-8');
            const fileTokens = content.length / this.tokenEstimator;

            if (tokenCount + fileTokens > maxTokens) break;

            context += `\n// File: ${file.relativePath}\n${content}\n`;
            tokenCount += fileTokens;
            sources.push(file.relativePath);
        }

        return {
            relevantFiles,
            relevantSymbols,
            context,
            tokenCount: Math.round(tokenCount),
            sources,
        };
    }

    /**
     * Get symbol definition with context
     */
    async getSymbolContext(repoPath: string, symbolName: string): Promise<{
        symbol: CodeSymbol | null;
        definition: string;
        usages: string[];
    }> {
        const repo = this.repos.get(repoPath);
        if (!repo) return { symbol: null, definition: '', usages: [] };

        // Find symbol
        let foundSymbol: CodeSymbol | null = null;
        for (const [, symbol] of repo.symbols) {
            if (symbol.name === symbolName) {
                foundSymbol = symbol;
                break;
            }
        }

        if (!foundSymbol) return { symbol: null, definition: '', usages: [] };

        // Get definition context
        const file = repo.files.get(foundSymbol.file);
        let definition = '';
        if (file) {
            const content = await fs.readFile(file.path, 'utf-8');
            const lines = content.split('\n');
            const start = Math.max(0, foundSymbol.line - 1);
            const end = Math.min(lines.length, foundSymbol.line + 20);
            definition = lines.slice(start, end).join('\n');
        }

        return { symbol: foundSymbol, definition, usages: [] };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Get indexed repositories
     */
    getIndexedRepos(): string[] {
        return Array.from(this.repos.keys());
    }

    /**
     * Get repository stats
     */
    getRepoStats(repoPath: string): {
        files: number;
        symbols: number;
        languages: string[];
    } | null {
        const repo = this.repos.get(repoPath);
        if (!repo) return null;

        const languages = new Set<string>();
        repo.files.forEach(f => languages.add(f.language));

        return {
            files: repo.files.size,
            symbols: repo.symbols.size,
            languages: Array.from(languages),
        };
    }

    /**
     * Clear repository index
     */
    clearIndex(repoPath?: string): void {
        if (repoPath) {
            this.repos.delete(repoPath);
        } else {
            this.repos.clear();
        }
    }
}

// Export singleton
export const deepContextEngine = DeepContextEngine.getInstance();
