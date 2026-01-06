/**
 * Multi-Repo Indexer
 * Cross-repository code indexing and dependency mapping
 * Similar to ZenCoder's Multi-Repo Intelligence
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface RepoIndex {
    repoPath: string;
    name: string;
    lastIndexed: number;
    files: FileEntry[];
    symbols: SymbolEntry[];
    dependencies: DependencyEntry[];
    exports: ExportEntry[];
    stats: IndexStats;
}

export interface FileEntry {
    path: string;
    relativePath: string;
    language: string;
    size: number;
    lastModified: number;
    hash?: string;
}

export interface SymbolEntry {
    name: string;
    type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum';
    file: string;
    line: number;
    exported: boolean;
    signature?: string;
}

export interface DependencyEntry {
    source: string; // File that imports
    target: string; // Module being imported
    symbols: string[]; // Imported symbols
    isExternal: boolean;
}

export interface ExportEntry {
    file: string;
    symbol: string;
    type: string;
    isDefault: boolean;
}

export interface IndexStats {
    totalFiles: number;
    totalSymbols: number;
    totalDependencies: number;
    indexTime: number;
    languages: Record<string, number>;
}

export interface CrossRepoReference {
    symbol: string;
    definedIn: { repo: string; file: string; line: number };
    usedIn: Array<{ repo: string; file: string; line: number }>;
}

/**
 * RepoIndexer
 * Indexes multiple repositories for cross-repo intelligence
 */
export class RepoIndexer extends EventEmitter {
    private static instance: RepoIndexer;
    private indices: Map<string, RepoIndex> = new Map();
    private watchedPaths: Set<string> = new Set();

    private constructor() {
        super();
    }

    static getInstance(): RepoIndexer {
        if (!RepoIndexer.instance) {
            RepoIndexer.instance = new RepoIndexer();
        }
        return RepoIndexer.instance;
    }

    /**
     * Index a repository
     */
    async indexRepository(repoPath: string, options?: {
        include?: string[];
        exclude?: string[];
        maxFiles?: number;
    }): Promise<RepoIndex> {
        const startTime = Date.now();
        this.emit('indexing', { repoPath });

        const name = path.basename(repoPath);
        const files: FileEntry[] = [];
        const symbols: SymbolEntry[] = [];
        const dependencies: DependencyEntry[] = [];
        const exports: ExportEntry[] = [];
        const languages: Record<string, number> = {};

        // Scan files
        await this.scanDirectory(repoPath, repoPath, files, options);

        // Process each file
        for (const file of files) {
            // Track language
            languages[file.language] = (languages[file.language] || 0) + 1;

            try {
                const content = await fs.readFile(file.path, 'utf-8');

                // Extract symbols
                const fileSymbols = this.extractSymbols(content, file);
                symbols.push(...fileSymbols);

                // Extract dependencies
                const fileDeps = this.extractDependencies(content, file);
                dependencies.push(...fileDeps);

                // Extract exports
                const fileExports = this.extractExports(content, file);
                exports.push(...fileExports);
            } catch (error) {
                // Skip files that can't be read
            }
        }

        const index: RepoIndex = {
            repoPath,
            name,
            lastIndexed: Date.now(),
            files,
            symbols,
            dependencies,
            exports,
            stats: {
                totalFiles: files.length,
                totalSymbols: symbols.length,
                totalDependencies: dependencies.length,
                indexTime: Date.now() - startTime,
                languages,
            },
        };

        this.indices.set(repoPath, index);
        this.emit('indexed', index);
        return index;
    }

    /**
     * Get index for repository
     */
    getIndex(repoPath: string): RepoIndex | null {
        return this.indices.get(repoPath) || null;
    }

    /**
     * Get all indexed repositories
     */
    getAllIndices(): RepoIndex[] {
        return Array.from(this.indices.values());
    }

    /**
     * Find symbol across all repos
     */
    findSymbol(name: string, options?: {
        type?: SymbolEntry['type'];
        exported?: boolean;
    }): SymbolEntry[] {
        const results: SymbolEntry[] = [];

        for (const index of this.indices.values()) {
            const matches = index.symbols.filter(s => {
                if (!s.name.toLowerCase().includes(name.toLowerCase())) return false;
                if (options?.type && s.type !== options.type) return false;
                if (options?.exported !== undefined && s.exported !== options.exported) return false;
                return true;
            });
            results.push(...matches);
        }

        return results;
    }

    /**
     * Find cross-repo references
     */
    findCrossRepoReferences(symbol: string): CrossRepoReference[] {
        const references: CrossRepoReference[] = [];
        const definedLocations: Array<{ repo: string; file: string; line: number }> = [];
        const usedLocations: Array<{ repo: string; file: string; line: number }> = [];

        for (const [repoPath, index] of this.indices) {
            // Find definitions
            for (const sym of index.symbols) {
                if (sym.name === symbol && sym.exported) {
                    definedLocations.push({
                        repo: index.name,
                        file: sym.file,
                        line: sym.line,
                    });
                }
            }

            // Find usages in imports
            for (const dep of index.dependencies) {
                if (dep.symbols.includes(symbol)) {
                    usedLocations.push({
                        repo: index.name,
                        file: dep.source,
                        line: 1, // Line number would need better tracking
                    });
                }
            }
        }

        for (const defined of definedLocations) {
            references.push({
                symbol,
                definedIn: defined,
                usedIn: usedLocations.filter(u =>
                    u.repo !== defined.repo || u.file !== defined.file
                ),
            });
        }

        return references;
    }

    /**
     * Find dependencies between repos
     */
    findRepoDependencies(): Array<{ from: string; to: string; count: number }> {
        const deps: Map<string, number> = new Map();

        for (const [repoPath, index] of this.indices) {
            for (const dep of index.dependencies) {
                if (dep.isExternal) continue;

                // Check if dependency is from another indexed repo
                for (const [otherPath, otherIndex] of this.indices) {
                    if (otherPath === repoPath) continue;

                    const hasExport = otherIndex.exports.some(e =>
                        dep.symbols.some(s => s === e.symbol)
                    );

                    if (hasExport) {
                        const key = `${index.name}:${otherIndex.name}`;
                        deps.set(key, (deps.get(key) || 0) + 1);
                    }
                }
            }
        }

        return Array.from(deps.entries()).map(([key, count]) => {
            const [from, to] = key.split(':');
            return { from, to, count };
        });
    }

    /**
     * Search across all repos
     */
    search(query: string, options?: {
        repos?: string[];
        languages?: string[];
        types?: SymbolEntry['type'][];
        limit?: number;
    }): Array<{ repo: string; symbol: SymbolEntry; score: number }> {
        const results: Array<{ repo: string; symbol: SymbolEntry; score: number }> = [];
        const queryLower = query.toLowerCase();

        for (const [repoPath, index] of this.indices) {
            if (options?.repos && !options.repos.includes(index.name)) continue;

            for (const symbol of index.symbols) {
                // Language filter
                const file = index.files.find(f => f.path === symbol.file);
                if (options?.languages && file && !options.languages.includes(file.language)) continue;

                // Type filter
                if (options?.types && !options.types.includes(symbol.type)) continue;

                // Calculate score
                const nameLower = symbol.name.toLowerCase();
                let score = 0;

                if (nameLower === queryLower) score = 1.0;
                else if (nameLower.startsWith(queryLower)) score = 0.8;
                else if (nameLower.includes(queryLower)) score = 0.5;
                else continue;

                // Boost exported symbols
                if (symbol.exported) score += 0.1;

                results.push({ repo: index.name, symbol, score });
            }
        }

        // Sort by score and limit
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, options?.limit || 50);
    }

    /**
     * Get statistics across all repos
     */
    getGlobalStats(): {
        totalRepos: number;
        totalFiles: number;
        totalSymbols: number;
        languageBreakdown: Record<string, number>;
        crossRepoDeps: number;
    } {
        let totalFiles = 0;
        let totalSymbols = 0;
        const languageBreakdown: Record<string, number> = {};

        for (const index of this.indices.values()) {
            totalFiles += index.stats.totalFiles;
            totalSymbols += index.stats.totalSymbols;

            for (const [lang, count] of Object.entries(index.stats.languages)) {
                languageBreakdown[lang] = (languageBreakdown[lang] || 0) + count;
            }
        }

        return {
            totalRepos: this.indices.size,
            totalFiles,
            totalSymbols,
            languageBreakdown,
            crossRepoDeps: this.findRepoDependencies().length,
        };
    }

    /**
     * Remove index
     */
    removeIndex(repoPath: string): boolean {
        return this.indices.delete(repoPath);
    }

    // Private methods

    private async scanDirectory(
        basePath: string,
        currentPath: string,
        files: FileEntry[],
        options?: { include?: string[]; exclude?: string[]; maxFiles?: number }
    ): Promise<void> {
        if (options?.maxFiles && files.length >= options.maxFiles) return;

        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const relativePath = path.relative(basePath, fullPath);

                // Skip common non-code directories
                if (entry.isDirectory()) {
                    if (['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv'].includes(entry.name)) {
                        continue;
                    }
                    await this.scanDirectory(basePath, fullPath, files, options);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    const language = this.getLanguage(ext);

                    if (!language) continue;
                    if (options?.exclude?.some(p => relativePath.includes(p))) continue;

                    try {
                        const stats = await fs.stat(fullPath);
                        files.push({
                            path: fullPath,
                            relativePath,
                            language,
                            size: stats.size,
                            lastModified: stats.mtimeMs,
                        });
                    } catch (error) {
                        // Skip files we can't stat
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    private getLanguage(ext: string): string | null {
        const langMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.c': 'c',
            '.swift': 'swift',
            '.kt': 'kotlin',
        };
        return langMap[ext] || null;
    }

    private extractSymbols(content: string, file: FileEntry): SymbolEntry[] {
        const symbols: SymbolEntry[] = [];
        const lines = content.split('\n');

        // TypeScript/JavaScript patterns
        if (file.language === 'typescript' || file.language === 'javascript') {
            // Functions
            const funcPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
            let match;
            while ((match = funcPattern.exec(content)) !== null) {
                symbols.push({
                    name: match[1],
                    type: 'function',
                    file: file.path,
                    line: this.getLineNumber(content, match.index),
                    exported: match[0].includes('export'),
                });
            }

            // Classes
            const classPattern = /(?:export\s+)?class\s+(\w+)/g;
            while ((match = classPattern.exec(content)) !== null) {
                symbols.push({
                    name: match[1],
                    type: 'class',
                    file: file.path,
                    line: this.getLineNumber(content, match.index),
                    exported: match[0].includes('export'),
                });
            }

            // Interfaces
            const ifacePattern = /(?:export\s+)?interface\s+(\w+)/g;
            while ((match = ifacePattern.exec(content)) !== null) {
                symbols.push({
                    name: match[1],
                    type: 'interface',
                    file: file.path,
                    line: this.getLineNumber(content, match.index),
                    exported: match[0].includes('export'),
                });
            }

            // Constants
            const constPattern = /(?:export\s+)?const\s+(\w+)\s*=/g;
            while ((match = constPattern.exec(content)) !== null) {
                symbols.push({
                    name: match[1],
                    type: 'constant',
                    file: file.path,
                    line: this.getLineNumber(content, match.index),
                    exported: match[0].includes('export'),
                });
            }
        }

        return symbols;
    }

    private extractDependencies(content: string, file: FileEntry): DependencyEntry[] {
        const deps: DependencyEntry[] = [];

        // ES imports
        const importPattern = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importPattern.exec(content)) !== null) {
            const symbols = match[1]
                ? match[1].split(',').map(s => s.trim().split(' as ')[0].trim())
                : [match[2]];

            deps.push({
                source: file.path,
                target: match[3],
                symbols: symbols.filter(s => s),
                isExternal: !match[3].startsWith('.'),
            });
        }

        return deps;
    }

    private extractExports(content: string, file: FileEntry): ExportEntry[] {
        const exports: ExportEntry[] = [];

        // Named exports
        const exportPattern = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
        let match;

        while ((match = exportPattern.exec(content)) !== null) {
            exports.push({
                file: file.path,
                symbol: match[1],
                type: match[0].includes('class') ? 'class' :
                    match[0].includes('function') ? 'function' : 'other',
                isDefault: false,
            });
        }

        // Default export
        if (/export\s+default/.test(content)) {
            const defaultMatch = content.match(/export\s+default\s+(?:class\s+)?(\w+)/);
            if (defaultMatch) {
                exports.push({
                    file: file.path,
                    symbol: defaultMatch[1],
                    type: 'default',
                    isDefault: true,
                });
            }
        }

        return exports;
    }

    private getLineNumber(content: string, index: number): number {
        return content.substring(0, index).split('\n').length;
    }
}

// Singleton getter
export function getRepoIndexer(): RepoIndexer {
    return RepoIndexer.getInstance();
}
