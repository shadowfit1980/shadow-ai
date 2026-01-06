/**
 * Semantic Code Search
 * 
 * Find code by meaning, not just text.
 * Uses embeddings and semantic similarity for intelligent search.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface CodeChunk {
    id: string;
    file: string;
    content: string;
    type: 'function' | 'class' | 'interface' | 'variable' | 'import' | 'block';
    name: string;
    startLine: number;
    endLine: number;
    embedding?: number[];
}

interface SearchResult {
    chunk: CodeChunk;
    score: number;
    matchReason: string;
}

interface IndexedProject {
    path: string;
    chunks: CodeChunk[];
    lastIndexed: number;
}

// ============================================================================
// SEMANTIC CODE SEARCH
// ============================================================================

export class SemanticCodeSearch extends EventEmitter {
    private static instance: SemanticCodeSearch;
    private indices: Map<string, IndexedProject> = new Map();
    private synonyms: Map<string, string[]> = new Map();

    private constructor() {
        super();
        this.initializeSynonyms();
    }

    static getInstance(): SemanticCodeSearch {
        if (!SemanticCodeSearch.instance) {
            SemanticCodeSearch.instance = new SemanticCodeSearch();
        }
        return SemanticCodeSearch.instance;
    }

    private initializeSynonyms(): void {
        // Programming concept synonyms
        this.synonyms.set('get', ['fetch', 'retrieve', 'load', 'read', 'obtain', 'find']);
        this.synonyms.set('set', ['update', 'modify', 'change', 'assign', 'put', 'write']);
        this.synonyms.set('create', ['make', 'generate', 'build', 'construct', 'initialize', 'new']);
        this.synonyms.set('delete', ['remove', 'destroy', 'clear', 'dispose', 'drop']);
        this.synonyms.set('send', ['emit', 'dispatch', 'transmit', 'post', 'publish']);
        this.synonyms.set('receive', ['handle', 'process', 'accept', 'subscribe', 'listen']);
        this.synonyms.set('validate', ['check', 'verify', 'ensure', 'test', 'assert']);
        this.synonyms.set('convert', ['transform', 'parse', 'serialize', 'format', 'map']);
        this.synonyms.set('auth', ['authenticate', 'authorize', 'login', 'verify', 'session']);
        this.synonyms.set('error', ['exception', 'fail', 'catch', 'handle', 'throw']);
        this.synonyms.set('list', ['array', 'collection', 'items', 'data']);
        this.synonyms.set('user', ['account', 'profile', 'member', 'person']);
    }

    // ========================================================================
    // INDEXING
    // ========================================================================

    async indexProject(projectPath: string): Promise<number> {
        const chunks: CodeChunk[] = [];
        const files = this.getSourceFiles(projectPath);

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const fileChunks = this.extractChunks(file, content);
                chunks.push(...fileChunks);
            } catch (error) {
                // Skip unreadable files
            }
        }

        this.indices.set(projectPath, {
            path: projectPath,
            chunks,
            lastIndexed: Date.now(),
        });

        this.emit('index:complete', { path: projectPath, chunks: chunks.length });
        return chunks.length;
    }

    private getSourceFiles(dir: string): string[] {
        const files: string[] = [];
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs'];

        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
                    files.push(...this.getSourceFiles(fullPath));
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        } catch (e) {
            // Handle permission errors
        }

        return files;
    }

    private extractChunks(file: string, content: string): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const lines = content.split('\n');

        // Extract functions
        const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
        let match;
        while ((match = funcRegex.exec(content)) !== null) {
            const name = match[1] || match[2];
            const startLine = content.slice(0, match.index).split('\n').length;
            const block = this.extractBlock(content, match.index);

            chunks.push({
                id: `${file}:${name}:${startLine}`,
                file,
                content: block,
                type: 'function',
                name,
                startLine,
                endLine: startLine + block.split('\n').length - 1,
            });
        }

        // Extract classes
        const classRegex = /(?:export\s+)?class\s+(\w+)/g;
        while ((match = classRegex.exec(content)) !== null) {
            const name = match[1];
            const startLine = content.slice(0, match.index).split('\n').length;
            const block = this.extractBlock(content, match.index);

            chunks.push({
                id: `${file}:${name}:${startLine}`,
                file,
                content: block,
                type: 'class',
                name,
                startLine,
                endLine: startLine + block.split('\n').length - 1,
            });
        }

        // Extract interfaces
        const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
        while ((match = interfaceRegex.exec(content)) !== null) {
            const name = match[1];
            const startLine = content.slice(0, match.index).split('\n').length;
            const block = this.extractBlock(content, match.index);

            chunks.push({
                id: `${file}:${name}:${startLine}`,
                file,
                content: block,
                type: 'interface',
                name,
                startLine,
                endLine: startLine + block.split('\n').length - 1,
            });
        }

        return chunks;
    }

    private extractBlock(content: string, startIndex: number): string {
        let braceCount = 0;
        let inBlock = false;
        let blockStart = startIndex;

        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') {
                if (!inBlock) blockStart = startIndex;
                inBlock = true;
                braceCount++;
            } else if (content[i] === '}') {
                braceCount--;
                if (braceCount === 0 && inBlock) {
                    return content.slice(blockStart, i + 1);
                }
            }
        }

        // Return until end of line if no block found
        const endOfLine = content.indexOf('\n', startIndex);
        return content.slice(startIndex, endOfLine > 0 ? endOfLine : undefined);
    }

    // ========================================================================
    // SEARCH
    // ========================================================================

    async search(query: string, projectPath: string, options: { limit?: number; types?: CodeChunk['type'][] } = {}): Promise<SearchResult[]> {
        const index = this.indices.get(projectPath);
        if (!index) {
            await this.indexProject(projectPath);
            return this.search(query, projectPath, options);
        }

        const results: SearchResult[] = [];
        const queryTerms = this.tokenize(query);
        const expandedTerms = this.expandTerms(queryTerms);

        for (const chunk of index.chunks) {
            if (options.types && !options.types.includes(chunk.type)) continue;

            const score = this.calculateSimilarity(expandedTerms, chunk);
            if (score > 0.1) {
                results.push({
                    chunk,
                    score,
                    matchReason: this.getMatchReason(expandedTerms, chunk),
                });
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, options.limit || 20);
    }

    private tokenize(text: string): string[] {
        return text.toLowerCase()
            .replace(/([A-Z])/g, ' $1') // Split camelCase
            .split(/[\s_\-]+/)
            .filter(t => t.length > 1);
    }

    private expandTerms(terms: string[]): string[] {
        const expanded = [...terms];

        for (const term of terms) {
            const synonyms = this.synonyms.get(term) || [];
            expanded.push(...synonyms);
        }

        return [...new Set(expanded)];
    }

    private calculateSimilarity(queryTerms: string[], chunk: CodeChunk): number {
        const chunkTerms = this.tokenize(chunk.name + ' ' + chunk.content);

        let matches = 0;
        let totalWeight = 0;

        for (const term of queryTerms) {
            // Exact name match - highest weight
            if (chunk.name.toLowerCase().includes(term)) {
                matches += 3;
            }
            // Content match
            if (chunkTerms.includes(term)) {
                matches += 1;
            }
            // Partial match
            if (chunkTerms.some(t => t.includes(term) || term.includes(t))) {
                matches += 0.5;
            }
            totalWeight += 1;
        }

        return totalWeight > 0 ? matches / (totalWeight * 3) : 0;
    }

    private getMatchReason(queryTerms: string[], chunk: CodeChunk): string {
        const reasons: string[] = [];

        for (const term of queryTerms) {
            if (chunk.name.toLowerCase().includes(term)) {
                reasons.push(`Name contains "${term}"`);
            }
        }

        if (reasons.length === 0) {
            reasons.push('Content similarity');
        }

        return reasons.join(', ');
    }

    // ========================================================================
    // NATURAL LANGUAGE QUERIES
    // ========================================================================

    async naturalLanguageSearch(query: string, projectPath: string): Promise<SearchResult[]> {
        // Parse natural language query
        const parsedQuery = this.parseNaturalQuery(query);
        return this.search(parsedQuery.terms.join(' '), projectPath, { types: parsedQuery.types });
    }

    private parseNaturalQuery(query: string): { terms: string[]; types?: CodeChunk['type'][] } {
        const lowerQuery = query.toLowerCase();
        const types: CodeChunk['type'][] = [];
        let terms = this.tokenize(query);

        // Detect type filters
        if (lowerQuery.includes('function') || lowerQuery.includes('method')) {
            types.push('function');
        }
        if (lowerQuery.includes('class')) {
            types.push('class');
        }
        if (lowerQuery.includes('interface') || lowerQuery.includes('type')) {
            types.push('interface');
        }

        // Parse common patterns
        if (lowerQuery.includes('how to')) {
            terms = terms.filter(t => !['how', 'to'].includes(t));
        }
        if (lowerQuery.includes('where is')) {
            terms = terms.filter(t => !['where', 'is'].includes(t));
        }
        if (lowerQuery.includes('find')) {
            terms = terms.filter(t => t !== 'find');
        }

        return { terms, types: types.length > 0 ? types : undefined };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    getIndexStats(projectPath: string): { chunks: number; lastIndexed: number } | null {
        const index = this.indices.get(projectPath);
        if (!index) return null;
        return { chunks: index.chunks.length, lastIndexed: index.lastIndexed };
    }

    clearIndex(projectPath: string): void {
        this.indices.delete(projectPath);
        this.emit('index:cleared', { path: projectPath });
    }
}

export const semanticCodeSearch = SemanticCodeSearch.getInstance();
