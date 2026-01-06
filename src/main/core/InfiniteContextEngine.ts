/**
 * 🔍 InfiniteContextEngine - 10M Token Repo Understanding
 * 
 * Claude's Recommendation: "Infinite Context" via Dynamic Retrieval
 * Needle-in-Haystack retrieval + HyDE + graph-based code map
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// Types
export interface CodeChunk {
    id: string;
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: ChunkType;
    embedding?: number[];
    metadata: ChunkMetadata;
}

export type ChunkType = 'function' | 'class' | 'module' | 'comment' | 'import' | 'export' | 'test' | 'config';

export interface ChunkMetadata {
    language: string;
    symbols: string[];
    dependencies: string[];
    complexity: number;
    lastModified: Date;
}

export interface CodeGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface GraphNode {
    id: string;
    type: 'file' | 'function' | 'class' | 'variable' | 'import';
    name: string;
    filePath: string;
    line: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    type: 'calls' | 'imports' | 'extends' | 'implements' | 'uses' | 'defines';
}

export interface RetrievalQuery {
    query: string;
    maxResults?: number;
    filters?: RetrievalFilters;
    includeContext?: boolean;
}

export interface RetrievalFilters {
    filePatterns?: string[];
    chunkTypes?: ChunkType[];
    languages?: string[];
    minRelevance?: number;
}

export interface RetrievalResult {
    chunks: ScoredChunk[];
    totalTokens: number;
    queryTime: number;
}

export interface ScoredChunk extends CodeChunk {
    score: number;
    relevanceExplanation: string;
}

export class InfiniteContextEngine extends EventEmitter {
    private static instance: InfiniteContextEngine;
    private chunks: Map<string, CodeChunk> = new Map();
    private graph: CodeGraph = { nodes: [], edges: [] };
    private indexedPaths: Set<string> = new Set();
    private embeddingCache: Map<string, number[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): InfiniteContextEngine {
        if (!InfiniteContextEngine.instance) {
            InfiniteContextEngine.instance = new InfiniteContextEngine();
        }
        return InfiniteContextEngine.instance;
    }

    /**
     * Index a codebase for retrieval
     */
    async indexCodebase(rootPath: string): Promise<void> {
        this.emit('indexing:start', { rootPath });

        const files = await this.walkDirectory(rootPath);
        let processed = 0;

        for (const file of files) {
            try {
                await this.indexFile(file);
                processed++;

                if (processed % 100 === 0) {
                    this.emit('indexing:progress', { processed, total: files.length });
                }
            } catch (error) {
                console.error(`Failed to index ${file}:`, error);
            }
        }

        // Build code graph
        await this.buildCodeGraph();

        this.emit('indexing:complete', {
            files: processed,
            chunks: this.chunks.size,
            nodes: this.graph.nodes.length,
            edges: this.graph.edges.length
        });
    }

    /**
     * Index a single file
     */
    async indexFile(filePath: string): Promise<void> {
        if (this.indexedPaths.has(filePath)) return;

        const content = await fs.readFile(filePath, 'utf-8');
        const language = this.detectLanguage(filePath);
        const chunks = this.parseIntoChunks(content, filePath, language);

        for (const chunk of chunks) {
            this.chunks.set(chunk.id, chunk);
        }

        this.indexedPaths.add(filePath);
    }

    /**
     * Retrieve relevant chunks for a query
     */
    async retrieve(query: RetrievalQuery): Promise<RetrievalResult> {
        const startTime = Date.now();

        // HyDE: Generate hypothetical document
        const hypotheticalDoc = await this.generateHypotheticalDoc(query.query);

        // Get query embedding
        const queryEmbedding = await this.getEmbedding(hypotheticalDoc);

        // Score all chunks
        const scored: ScoredChunk[] = [];

        for (const chunk of this.chunks.values()) {
            // Apply filters
            if (!this.matchesFilters(chunk, query.filters)) continue;

            // Calculate similarity
            const chunkEmbedding = await this.getEmbedding(chunk.content);
            const score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

            if (score >= (query.filters?.minRelevance ?? 0.3)) {
                scored.push({
                    ...chunk,
                    score,
                    relevanceExplanation: `Semantic similarity: ${(score * 100).toFixed(1)}%`
                });
            }
        }

        // Sort by score
        scored.sort((a, b) => b.score - a.score);

        // Limit results
        const maxResults = query.maxResults ?? 20;
        const topChunks = scored.slice(0, maxResults);

        // Add context if requested
        if (query.includeContext) {
            for (const chunk of topChunks) {
                await this.addSurroundingContext(chunk);
            }
        }

        // Calculate total tokens
        const totalTokens = topChunks.reduce((sum, c) => sum + this.estimateTokens(c.content), 0);

        return {
            chunks: topChunks,
            totalTokens,
            queryTime: Date.now() - startTime
        };
    }

    /**
     * Find related code using the code graph
     */
    findRelated(nodeId: string, depth = 2): GraphNode[] {
        const visited = new Set<string>();
        const related: GraphNode[] = [];

        const traverse = (currentId: string, currentDepth: number) => {
            if (currentDepth > depth || visited.has(currentId)) return;
            visited.add(currentId);

            // Find edges from this node
            const edges = this.graph.edges.filter(e =>
                e.source === currentId || e.target === currentId
            );

            for (const edge of edges) {
                const targetId = edge.source === currentId ? edge.target : edge.source;
                const targetNode = this.graph.nodes.find(n => n.id === targetId);

                if (targetNode && !visited.has(targetNode.id)) {
                    related.push(targetNode);
                    traverse(targetNode.id, currentDepth + 1);
                }
            }
        };

        traverse(nodeId, 0);
        return related;
    }

    /**
     * Get context window for a specific location
     */
    async getContextWindow(filePath: string, line: number, windowSize = 50): Promise<string> {
        const chunks = Array.from(this.chunks.values())
            .filter(c => c.filePath === filePath)
            .sort((a, b) => a.startLine - b.startLine);

        // Find chunks near the target line
        const relevantChunks = chunks.filter(c =>
            Math.abs((c.startLine + c.endLine) / 2 - line) <= windowSize
        );

        return relevantChunks.map(c => c.content).join('\n\n');
    }

    // Helper methods
    private async walkDirectory(dir: string): Promise<string[]> {
        const files: string[] = [];

        const walk = async (currentDir: string) => {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);

                // Skip common non-code directories
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                        await walk(fullPath);
                    }
                } else if (this.isCodeFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        };

        await walk(dir);
        return files;
    }

    private isCodeFile(filename: string): boolean {
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h'];
        return codeExtensions.some(ext => filename.endsWith(ext));
    }

    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath);
        const languageMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java'
        };
        return languageMap[ext] || 'unknown';
    }

    private parseIntoChunks(content: string, filePath: string, language: string): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const lines = content.split('\n');

        // Simple chunking by function/class patterns
        let currentChunk: string[] = [];
        let currentStartLine = 1;
        let currentType: ChunkType = 'module';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Detect chunk boundaries
            if (this.isChunkBoundary(line, language)) {
                // Save current chunk
                if (currentChunk.length > 0) {
                    chunks.push(this.createChunk(
                        currentChunk.join('\n'),
                        filePath,
                        currentStartLine,
                        lineNum - 1,
                        currentType,
                        language
                    ));
                }

                // Start new chunk
                currentChunk = [line];
                currentStartLine = lineNum;
                currentType = this.detectChunkType(line, language);
            } else {
                currentChunk.push(line);
            }
        }

        // Save final chunk
        if (currentChunk.length > 0) {
            chunks.push(this.createChunk(
                currentChunk.join('\n'),
                filePath,
                currentStartLine,
                lines.length,
                currentType,
                language
            ));
        }

        return chunks;
    }

    private isChunkBoundary(line: string, language: string): boolean {
        const patterns: Record<string, RegExp[]> = {
            typescript: [/^(export\s+)?(function|class|interface|type|const|let)\s+/],
            javascript: [/^(export\s+)?(function|class|const|let)\s+/],
            python: [/^(def|class|async def)\s+/],
            go: [/^func\s+/, /^type\s+/],
            rust: [/^(pub\s+)?(fn|struct|enum|impl)\s+/]
        };

        const langPatterns = patterns[language] || patterns.typescript;
        return langPatterns.some(p => p.test(line.trim()));
    }

    private detectChunkType(line: string, _language: string): ChunkType {
        if (/class\s+/.test(line)) return 'class';
        if (/function\s+|def\s+|fn\s+/.test(line)) return 'function';
        if (/import\s+/.test(line)) return 'import';
        if (/export\s+/.test(line)) return 'export';
        if (/test\(|describe\(|it\(/.test(line)) return 'test';
        return 'module';
    }

    private createChunk(
        content: string,
        filePath: string,
        startLine: number,
        endLine: number,
        type: ChunkType,
        language: string
    ): CodeChunk {
        return {
            id: crypto.createHash('md5').update(`${filePath}:${startLine}:${endLine}`).digest('hex'),
            filePath,
            content,
            startLine,
            endLine,
            type,
            metadata: {
                language,
                symbols: this.extractSymbols(content),
                dependencies: this.extractDependencies(content),
                complexity: this.calculateComplexity(content),
                lastModified: new Date()
            }
        };
    }

    private extractSymbols(content: string): string[] {
        const symbols: string[] = [];
        const patterns = [
            /(?:function|class|interface|type|const|let|var)\s+(\w+)/g,
            /def\s+(\w+)/g,
            /fn\s+(\w+)/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                symbols.push(match[1]);
            }
        }

        return symbols;
    }

    private extractDependencies(content: string): string[] {
        const deps: string[] = [];
        const patterns = [
            /import\s+.*from\s+['"]([^'"]+)['"]/g,
            /require\(['"]([^'"]+)['"]\)/g,
            /from\s+(\w+)\s+import/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                deps.push(match[1]);
            }
        }

        return deps;
    }

    private calculateComplexity(content: string): number {
        // Simple cyclomatic complexity approximation
        const controlFlow = (content.match(/if|else|for|while|switch|case|catch|&&|\|\||\?/g) || []).length;
        return Math.min(10, 1 + controlFlow);
    }

    private async buildCodeGraph(): Promise<void> {
        // Build nodes from chunks
        for (const chunk of this.chunks.values()) {
            for (const symbol of chunk.metadata.symbols) {
                this.graph.nodes.push({
                    id: `${chunk.id}:${symbol}`,
                    type: chunk.type === 'class' ? 'class' : chunk.type === 'function' ? 'function' : 'variable',
                    name: symbol,
                    filePath: chunk.filePath,
                    line: chunk.startLine
                });
            }
        }

        // Build edges from dependencies
        // (Simplified - real implementation would do proper AST analysis)
        for (const chunk of this.chunks.values()) {
            for (const dep of chunk.metadata.dependencies) {
                // Find target node
                const target = this.graph.nodes.find(n => n.name === dep);
                if (target) {
                    this.graph.edges.push({
                        source: chunk.id,
                        target: target.id,
                        type: 'imports'
                    });
                }
            }
        }
    }

    private async generateHypotheticalDoc(query: string): Promise<string> {
        // HyDE: Expand query into hypothetical document
        return `This code implements: ${query}. It handles the following functionality: ${query}`;
    }

    private async getEmbedding(text: string): Promise<number[]> {
        const cacheKey = crypto.createHash('md5').update(text.slice(0, 500)).digest('hex');

        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey)!;
        }

        // Simple TF-IDF-like embedding (placeholder for real embedding API)
        const words = text.toLowerCase().split(/\W+/);
        const vector = new Array(768).fill(0);

        for (let i = 0; i < words.length; i++) {
            const hash = this.hashString(words[i]);
            vector[hash % 768] += 1;
        }

        // Normalize
        const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        const normalized = vector.map(v => v / (magnitude || 1));

        this.embeddingCache.set(cacheKey, normalized);
        return normalized;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB) || 1);
    }

    private matchesFilters(chunk: CodeChunk, filters?: RetrievalFilters): boolean {
        if (!filters) return true;

        if (filters.chunkTypes && !filters.chunkTypes.includes(chunk.type)) {
            return false;
        }

        if (filters.languages && !filters.languages.includes(chunk.metadata.language)) {
            return false;
        }

        if (filters.filePatterns) {
            const matches = filters.filePatterns.some(p => chunk.filePath.includes(p));
            if (!matches) return false;
        }

        return true;
    }

    private async addSurroundingContext(chunk: ScoredChunk): Promise<void> {
        // Add related chunks based on graph
        const related = this.findRelated(chunk.id, 1);
        chunk.relevanceExplanation += ` (${related.length} related symbols found)`;
    }

    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Get statistics
     */
    getStats(): { chunks: number; nodes: number; edges: number; files: number } {
        return {
            chunks: this.chunks.size,
            nodes: this.graph.nodes.length,
            edges: this.graph.edges.length,
            files: this.indexedPaths.size
        };
    }
}

export const infiniteContextEngine = InfiniteContextEngine.getInstance();
