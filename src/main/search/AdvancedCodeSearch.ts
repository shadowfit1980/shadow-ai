/**
 * Advanced Code Search Engine
 * Semantic and structural code search capabilities
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface SearchResult {
    file: string;
    line: number;
    column: number;
    content: string;
    context: string[];
    score: number;
    type: 'exact' | 'fuzzy' | 'semantic' | 'regex';
}

export interface SearchOptions {
    query: string;
    type?: 'exact' | 'fuzzy' | 'semantic' | 'regex';
    caseSensitive?: boolean;
    wholeWord?: boolean;
    includePatterns?: string[];
    excludePatterns?: string[];
    maxResults?: number;
}

export interface SymbolInfo {
    name: string;
    kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'method' | 'property';
    file: string;
    line: number;
    signature?: string;
}

/**
 * AdvancedCodeSearch
 * Multi-mode code search with semantic understanding
 */
export class AdvancedCodeSearch extends EventEmitter {
    private static instance: AdvancedCodeSearch;
    private indexedFiles: Map<string, string[]> = new Map();
    private symbolIndex: Map<string, SymbolInfo[]> = new Map();
    private searchHistory: SearchOptions[] = [];

    private constructor() {
        super();
    }

    static getInstance(): AdvancedCodeSearch {
        if (!AdvancedCodeSearch.instance) {
            AdvancedCodeSearch.instance = new AdvancedCodeSearch();
        }
        return AdvancedCodeSearch.instance;
    }

    /**
     * Index a project for searching
     */
    async indexProject(projectPath: string): Promise<number> {
        this.emit('indexingStarted', { projectPath });

        let fileCount = 0;
        const files = await this.walkDirectory(projectPath);

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const lines = content.split('\n');
                this.indexedFiles.set(file, lines);

                // Extract symbols
                const symbols = this.extractSymbols(file, content);
                if (symbols.length > 0) {
                    this.symbolIndex.set(file, symbols);
                }

                fileCount++;
            } catch {
                // Skip unreadable files
            }
        }

        this.emit('indexingCompleted', { projectPath, fileCount });
        return fileCount;
    }

    /**
     * Search indexed files
     */
    async search(options: SearchOptions): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const { query, type = 'fuzzy', caseSensitive = false, wholeWord = false, maxResults = 100 } = options;

        this.searchHistory.push(options);
        this.emit('searchStarted', options);

        const searchQuery = caseSensitive ? query : query.toLowerCase();

        for (const [file, lines] of this.indexedFiles) {
            // Check include/exclude patterns
            if (!this.matchesPatterns(file, options.includePatterns, options.excludePatterns)) {
                continue;
            }

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const searchLine = caseSensitive ? line : line.toLowerCase();

                let match = false;
                let column = -1;
                let score = 0;

                switch (type) {
                    case 'exact':
                        if (wholeWord) {
                            const regex = new RegExp(`\\b${this.escapeRegex(searchQuery)}\\b`, caseSensitive ? '' : 'i');
                            match = regex.test(line);
                        } else {
                            match = searchLine.includes(searchQuery);
                        }
                        column = searchLine.indexOf(searchQuery);
                        score = match ? 1 : 0;
                        break;

                    case 'fuzzy':
                        const fuzzyResult = this.fuzzyMatch(searchQuery, searchLine);
                        match = fuzzyResult.match;
                        score = fuzzyResult.score;
                        column = fuzzyResult.position;
                        break;

                    case 'regex':
                        try {
                            const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
                            const regexMatch = regex.exec(line);
                            match = regexMatch !== null;
                            column = regexMatch ? regexMatch.index : -1;
                            score = match ? 0.9 : 0;
                        } catch {
                            // Invalid regex
                        }
                        break;

                    case 'semantic':
                        const semanticResult = this.semanticMatch(query, line);
                        match = semanticResult.match;
                        score = semanticResult.score;
                        column = 0;
                        break;
                }

                if (match && score > 0.3) {
                    results.push({
                        file,
                        line: i + 1,
                        column: Math.max(0, column),
                        content: line,
                        context: this.getContext(lines, i, 2),
                        score,
                        type,
                    });

                    if (results.length >= maxResults) {
                        break;
                    }
                }
            }

            if (results.length >= maxResults) {
                break;
            }
        }

        // Sort by score
        results.sort((a, b) => b.score - a.score);

        this.emit('searchCompleted', { query, resultCount: results.length });
        return results;
    }

    /**
     * Search for symbols
     */
    searchSymbols(query: string, kind?: SymbolInfo['kind']): SymbolInfo[] {
        const results: SymbolInfo[] = [];
        const queryLower = query.toLowerCase();

        for (const symbols of this.symbolIndex.values()) {
            for (const symbol of symbols) {
                if (kind && symbol.kind !== kind) continue;

                if (symbol.name.toLowerCase().includes(queryLower)) {
                    results.push(symbol);
                }
            }
        }

        return results.sort((a, b) => {
            // Exact matches first
            if (a.name.toLowerCase() === queryLower) return -1;
            if (b.name.toLowerCase() === queryLower) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Find references to a symbol
     */
    async findReferences(symbolName: string): Promise<SearchResult[]> {
        return this.search({
            query: symbolName,
            type: 'exact',
            wholeWord: true,
        });
    }

    /**
     * Find definition of a symbol
     */
    findDefinition(symbolName: string): SymbolInfo | null {
        const symbols = this.searchSymbols(symbolName);
        return symbols.find(s =>
            s.kind === 'function' || s.kind === 'class' || s.kind === 'interface'
        ) || symbols[0] || null;
    }

    /**
     * Get search history
     */
    getSearchHistory(limit = 20): SearchOptions[] {
        return this.searchHistory.slice(-limit).reverse();
    }

    // Private methods

    private async walkDirectory(dir: string): Promise<string[]> {
        const files: string[] = [];
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.c', '.cpp', '.h'];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
                    continue;
                }

                if (entry.isDirectory()) {
                    files.push(...await this.walkDirectory(fullPath));
                } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        } catch {
            // Skip inaccessible directories
        }

        return files;
    }

    private extractSymbols(file: string, content: string): SymbolInfo[] {
        const symbols: SymbolInfo[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Functions
            const funcMatch = line.match(/(?:function|async function)\s+(\w+)\s*\(/);
            if (funcMatch) {
                symbols.push({ name: funcMatch[1], kind: 'function', file, line: i + 1, signature: line.trim() });
            }

            // Arrow functions assigned to const
            const arrowMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
            if (arrowMatch) {
                symbols.push({ name: arrowMatch[1], kind: 'function', file, line: i + 1, signature: line.trim() });
            }

            // Classes
            const classMatch = line.match(/class\s+(\w+)/);
            if (classMatch) {
                symbols.push({ name: classMatch[1], kind: 'class', file, line: i + 1 });
            }

            // Interfaces
            const interfaceMatch = line.match(/interface\s+(\w+)/);
            if (interfaceMatch) {
                symbols.push({ name: interfaceMatch[1], kind: 'interface', file, line: i + 1 });
            }

            // Types
            const typeMatch = line.match(/type\s+(\w+)\s*=/);
            if (typeMatch) {
                symbols.push({ name: typeMatch[1], kind: 'type', file, line: i + 1 });
            }
        }

        return symbols;
    }

    private fuzzyMatch(query: string, text: string): { match: boolean; score: number; position: number } {
        let queryIndex = 0;
        let position = -1;
        let score = 0;
        let consecutiveMatches = 0;

        for (let i = 0; i < text.length && queryIndex < query.length; i++) {
            if (text[i] === query[queryIndex]) {
                if (position === -1) position = i;
                queryIndex++;
                consecutiveMatches++;
                score += 1 + (consecutiveMatches * 0.5);
            } else {
                consecutiveMatches = 0;
            }
        }

        const match = queryIndex === query.length;
        const normalizedScore = match ? score / (query.length * 2) : 0;

        return { match, score: normalizedScore, position };
    }

    private semanticMatch(query: string, text: string): { match: boolean; score: number } {
        const queryWords = query.toLowerCase().split(/\s+/);
        const textWords = text.toLowerCase().split(/\W+/);

        let matchCount = 0;
        for (const qw of queryWords) {
            if (textWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
                matchCount++;
            }
        }

        const score = matchCount / queryWords.length;
        return { match: score > 0.5, score };
    }

    private matchesPatterns(file: string, include?: string[], exclude?: string[]): boolean {
        if (exclude) {
            for (const pattern of exclude) {
                if (file.includes(pattern) || this.globMatch(file, pattern)) {
                    return false;
                }
            }
        }

        if (include && include.length > 0) {
            for (const pattern of include) {
                if (file.includes(pattern) || this.globMatch(file, pattern)) {
                    return true;
                }
            }
            return false;
        }

        return true;
    }

    private globMatch(file: string, pattern: string): boolean {
        const regex = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp(regex).test(file);
    }

    private getContext(lines: string[], index: number, contextSize: number): string[] {
        const start = Math.max(0, index - contextSize);
        const end = Math.min(lines.length, index + contextSize + 1);
        return lines.slice(start, end);
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Clear index
     */
    clearIndex(): void {
        this.indexedFiles.clear();
        this.symbolIndex.clear();
    }
}

// Singleton getter
export function getAdvancedCodeSearch(): AdvancedCodeSearch {
    return AdvancedCodeSearch.getInstance();
}
