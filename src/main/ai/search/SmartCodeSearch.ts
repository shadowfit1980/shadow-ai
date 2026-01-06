/**
 * Smart Code Search Engine
 * 
 * Semantic search across codebase with natural language queries,
 * code similarity matching, and intelligent ranking.
 */

import { EventEmitter } from 'events';

export interface SearchResult {
    id: string;
    type: ResultType;
    title: string;
    file: string;
    line?: number;
    content: string;
    preview: string;
    score: number;
    matches: SearchMatch[];
}

export type ResultType =
    | 'function'
    | 'class'
    | 'variable'
    | 'import'
    | 'comment'
    | 'string'
    | 'type'
    | 'interface';

export interface SearchMatch {
    text: string;
    start: number;
    end: number;
    line?: number;
}

export interface SearchOptions {
    types?: ResultType[];
    files?: string[];
    excludeFiles?: string[];
    caseSensitive?: boolean;
    wholeWord?: boolean;
    limit?: number;
    minScore?: number;
}

export interface IndexedFile {
    path: string;
    content: string;
    symbols: IndexedSymbol[];
    lastIndexed: Date;
}

export interface IndexedSymbol {
    name: string;
    type: ResultType;
    line: number;
    endLine: number;
    signature?: string;
    docstring?: string;
}

export interface SearchHistory {
    query: string;
    timestamp: Date;
    resultCount: number;
}

export class SmartCodeSearch extends EventEmitter {
    private static instance: SmartCodeSearch;
    private index: Map<string, IndexedFile> = new Map();
    private searchHistory: SearchHistory[] = [];
    private symbolIndex: Map<string, { file: string; symbol: IndexedSymbol }[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): SmartCodeSearch {
        if (!SmartCodeSearch.instance) {
            SmartCodeSearch.instance = new SmartCodeSearch();
        }
        return SmartCodeSearch.instance;
    }

    // ========================================================================
    // INDEXING
    // ========================================================================

    indexFile(path: string, content: string): IndexedFile {
        const symbols = this.extractSymbols(content);

        const indexed: IndexedFile = {
            path,
            content,
            symbols,
            lastIndexed: new Date(),
        };

        this.index.set(path, indexed);

        // Update symbol index
        for (const symbol of symbols) {
            const key = symbol.name.toLowerCase();
            if (!this.symbolIndex.has(key)) {
                this.symbolIndex.set(key, []);
            }
            this.symbolIndex.get(key)!.push({ file: path, symbol });
        }

        this.emit('file:indexed', { path, symbolCount: symbols.length });
        return indexed;
    }

    private extractSymbols(content: string): IndexedSymbol[] {
        const symbols: IndexedSymbol[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Functions
            const funcMatch = line.match(/(?:function|const|let|var)\s+(\w+)\s*(?:=\s*(?:async\s*)?\(|(\([^)]*\)))/);
            if (funcMatch) {
                symbols.push({
                    name: funcMatch[1],
                    type: 'function',
                    line: i + 1,
                    endLine: this.findEndLine(lines, i),
                    signature: line.trim(),
                });
            }

            // Classes
            const classMatch = line.match(/class\s+(\w+)/);
            if (classMatch) {
                symbols.push({
                    name: classMatch[1],
                    type: 'class',
                    line: i + 1,
                    endLine: this.findEndLine(lines, i),
                });
            }

            // Interfaces
            const interfaceMatch = line.match(/interface\s+(\w+)/);
            if (interfaceMatch) {
                symbols.push({
                    name: interfaceMatch[1],
                    type: 'interface',
                    line: i + 1,
                    endLine: this.findEndLine(lines, i),
                });
            }

            // Types
            const typeMatch = line.match(/type\s+(\w+)\s*=/);
            if (typeMatch) {
                symbols.push({
                    name: typeMatch[1],
                    type: 'type',
                    line: i + 1,
                    endLine: i + 1,
                });
            }

            // Exports
            const exportMatch = line.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/);
            if (exportMatch && !symbols.some(s => s.name === exportMatch[1])) {
                symbols.push({
                    name: exportMatch[1],
                    type: 'variable',
                    line: i + 1,
                    endLine: i + 1,
                });
            }
        }

        return symbols;
    }

    private findEndLine(lines: string[], startLine: number): number {
        let braceCount = 0;
        let started = false;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    started = true;
                } else if (char === '}') {
                    braceCount--;
                }
            }
            if (started && braceCount === 0) {
                return i + 1;
            }
        }

        return startLine + 1;
    }

    removeFile(path: string): boolean {
        const file = this.index.get(path);
        if (!file) return false;

        // Remove from symbol index
        for (const symbol of file.symbols) {
            const key = symbol.name.toLowerCase();
            const entries = this.symbolIndex.get(key);
            if (entries) {
                const filtered = entries.filter(e => e.file !== path);
                if (filtered.length === 0) {
                    this.symbolIndex.delete(key);
                } else {
                    this.symbolIndex.set(key, filtered);
                }
            }
        }

        this.index.delete(path);
        this.emit('file:removed', path);
        return true;
    }

    // ========================================================================
    // SEARCH
    // ========================================================================

    search(query: string, options: SearchOptions = {}): SearchResult[] {
        const results: SearchResult[] = [];
        const queryLower = options.caseSensitive ? query : query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

        // Search in symbol index first (fast path)
        for (const word of queryWords) {
            const symbolResults = this.symbolIndex.get(word) || [];
            for (const { file, symbol } of symbolResults) {
                if (options.types && !options.types.includes(symbol.type)) continue;
                if (options.files && !options.files.includes(file)) continue;
                if (options.excludeFiles && options.excludeFiles.includes(file)) continue;

                const indexed = this.index.get(file);
                if (!indexed) continue;

                const lines = indexed.content.split('\n');
                const content = lines.slice(symbol.line - 1, symbol.endLine).join('\n');
                const preview = lines[symbol.line - 1].trim().slice(0, 100);

                results.push({
                    id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    type: symbol.type,
                    title: symbol.name,
                    file,
                    line: symbol.line,
                    content,
                    preview,
                    score: this.calculateScore(query, symbol.name, content),
                    matches: this.findMatches(query, content, options.caseSensitive),
                });
            }
        }

        // Full-text search for remaining matches
        for (const [path, indexed] of this.index) {
            if (options.files && !options.files.includes(path)) continue;
            if (options.excludeFiles && options.excludeFiles.includes(path)) continue;

            const contentToSearch = options.caseSensitive ? indexed.content : indexed.content.toLowerCase();

            if (contentToSearch.includes(queryLower)) {
                const lines = indexed.content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const lineToSearch = options.caseSensitive ? lines[i] : lines[i].toLowerCase();
                    if (lineToSearch.includes(queryLower)) {
                        // Avoid duplicates with symbol results
                        if (results.some(r => r.file === path && r.line === i + 1)) continue;

                        results.push({
                            id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            type: 'string',
                            title: this.extractTitle(lines[i]),
                            file: path,
                            line: i + 1,
                            content: lines[i],
                            preview: lines[i].trim().slice(0, 100),
                            score: this.calculateScore(query, '', lines[i]),
                            matches: this.findMatches(query, lines[i], options.caseSensitive),
                        });
                    }
                }
            }
        }

        // Sort by score
        results.sort((a, b) => b.score - a.score);

        // Apply filters
        let filtered = results;
        if (options.minScore) {
            filtered = filtered.filter(r => r.score >= options.minScore!);
        }
        if (options.limit) {
            filtered = filtered.slice(0, options.limit);
        }

        // Track history
        this.searchHistory.push({
            query,
            timestamp: new Date(),
            resultCount: filtered.length,
        });

        this.emit('search:completed', { query, resultCount: filtered.length });
        return filtered;
    }

    private calculateScore(query: string, name: string, content: string): number {
        let score = 0;
        const queryLower = query.toLowerCase();
        const nameLower = name.toLowerCase();
        const contentLower = content.toLowerCase();

        // Exact name match
        if (nameLower === queryLower) score += 100;
        // Name starts with query
        else if (nameLower.startsWith(queryLower)) score += 80;
        // Name contains query
        else if (nameLower.includes(queryLower)) score += 60;

        // Content matches
        const occurrences = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
        score += occurrences * 10;

        // Length penalty (prefer shorter matches)
        score -= Math.min(20, content.length / 50);

        return Math.max(0, score);
    }

    private findMatches(query: string, content: string, caseSensitive?: boolean): SearchMatch[] {
        const matches: SearchMatch[] = [];
        const searchIn = caseSensitive ? content : content.toLowerCase();
        const searchFor = caseSensitive ? query : query.toLowerCase();

        let index = 0;
        while ((index = searchIn.indexOf(searchFor, index)) !== -1) {
            matches.push({
                text: content.slice(index, index + query.length),
                start: index,
                end: index + query.length,
            });
            index++;
        }

        return matches;
    }

    private extractTitle(line: string): string {
        // Try to extract meaningful title from line
        const match = line.match(/(?:function|class|const|let|var|interface|type)\s+(\w+)/);
        if (match) return match[1];
        return line.trim().slice(0, 40);
    }

    // ========================================================================
    // SEMANTIC SEARCH (Natural Language)
    // ========================================================================

    semanticSearch(naturalQuery: string, options: SearchOptions = {}): SearchResult[] {
        // Convert natural language to search terms
        const keywords = this.extractKeywords(naturalQuery);

        // Search for each keyword and combine results
        const resultMap = new Map<string, SearchResult & { hitCount: number }>();

        for (const keyword of keywords) {
            const results = this.search(keyword, { ...options, limit: 20 });
            for (const result of results) {
                const key = `${result.file}:${result.line}`;
                if (resultMap.has(key)) {
                    const existing = resultMap.get(key)!;
                    existing.hitCount++;
                    existing.score += result.score;
                } else {
                    resultMap.set(key, { ...result, hitCount: 1 });
                }
            }
        }

        // Sort by combined score
        const combined = Array.from(resultMap.values())
            .sort((a, b) => (b.score * b.hitCount) - (a.score * a.hitCount))
            .slice(0, options.limit || 20);

        return combined;
    }

    private extractKeywords(query: string): string[] {
        // Remove common words and extract meaningful terms
        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
            'find', 'show', 'me', 'where', 'how', 'to', 'in', 'on', 'at', 'for',
            'with', 'that', 'this', 'there', 'code', 'function', 'all',
        ]);

        return query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getIndexedFiles(): string[] {
        return Array.from(this.index.keys());
    }

    getSymbol(name: string): { file: string; symbol: IndexedSymbol }[] {
        return this.symbolIndex.get(name.toLowerCase()) || [];
    }

    getHistory(limit = 20): SearchHistory[] {
        return this.searchHistory.slice(-limit).reverse();
    }

    getStats(): {
        fileCount: number;
        symbolCount: number;
        searchCount: number;
    } {
        let symbolCount = 0;
        for (const file of this.index.values()) {
            symbolCount += file.symbols.length;
        }

        return {
            fileCount: this.index.size,
            symbolCount,
            searchCount: this.searchHistory.length,
        };
    }

    clearIndex(): void {
        this.index.clear();
        this.symbolIndex.clear();
        this.emit('index:cleared');
    }
}

export const smartCodeSearch = SmartCodeSearch.getInstance();
