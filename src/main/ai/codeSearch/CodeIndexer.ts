import * as fs from 'fs';
import * as path from 'path';

export interface CodeFile {
    path: string;
    content: string;
    language: string;
    size: number;
}

export interface CodeChunk {
    id: string;
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
    type: 'function' | 'class' | 'import' | 'comment' | 'other';
}

export interface SearchResult {
    chunk: CodeChunk;
    score: number;
    context: string;
}

export class CodeIndexer {
    private files: Map<string, CodeFile> = new Map();
    private chunks: Map<string, CodeChunk> = new Map();

    /**
     * Index a directory of code files
     */
    async indexDirectory(dirPath: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): Promise<void> {
        console.log(`📂 Indexing directory: ${dirPath}`);

        const files = this.findCodeFiles(dirPath, extensions);

        for (const filePath of files) {
            await this.indexFile(filePath);
        }

        console.log(`✅ Indexed ${this.files.size} files, ${this.chunks.size} chunks`);
    }

    /**
     * Index a single file
     */
    async indexFile(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const language = this.detectLanguage(filePath);

            const file: CodeFile = {
                path: filePath,
                content,
                language,
                size: content.length
            };

            this.files.set(filePath, file);

            // Create chunks
            const chunks = this.chunkFile(file);
            chunks.forEach(chunk => this.chunks.set(chunk.id, chunk));

        } catch (error) {
            console.error(`Failed to index ${filePath}:`, error);
        }
    }

    /**
     * Search code semantically
     */
    search(query: string, limit: number = 10): SearchResult[] {
        const results: SearchResult[] = [];
        const queryLower = query.toLowerCase();

        this.chunks.forEach(chunk => {
            const score = this.calculateScore(queryLower, chunk);

            if (score > 0) {
                results.push({
                    chunk,
                    score,
                    context: this.getContext(chunk)
                });
            }
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Find code files recursively
     */
    private findCodeFiles(dirPath: string, extensions: string[]): string[] {
        const files: string[] = [];

        const traverse = (currentPath: string) => {
            if (!fs.existsSync(currentPath)) return;

            const entries = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);

                // Skip node_modules, .git, etc.
                if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                    continue;
                }

                if (entry.isDirectory()) {
                    traverse(fullPath);
                } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        };

        traverse(dirPath);
        return files;
    }

    /**
     * Chunk file into searchable pieces
     */
    private chunkFile(file: CodeFile): CodeChunk[] {
        const chunks: CodeChunk[] = [];
        const lines = file.content.split('\n');

        let currentChunk: string[] = [];
        let startLine = 0;

        lines.forEach((line, index) => {
            currentChunk.push(line);

            // Create chunk every 20 lines or at function/class boundaries
            if (currentChunk.length >= 20 || this.isChunkBoundary(line)) {
                if (currentChunk.length > 0) {
                    chunks.push({
                        id: `${file.path}_${startLine}`,
                        filePath: file.path,
                        content: currentChunk.join('\n'),
                        startLine,
                        endLine: index,
                        type: this.detectChunkType(currentChunk.join('\n'))
                    });

                    currentChunk = [];
                    startLine = index + 1;
                }
            }
        });

        // Add remaining
        if (currentChunk.length > 0) {
            chunks.push({
                id: `${file.path}_${startLine}`,
                filePath: file.path,
                content: currentChunk.join('\n'),
                startLine,
                endLine: lines.length - 1,
                type: this.detectChunkType(currentChunk.join('\n'))
            });
        }

        return chunks;
    }

    /**
     * Calculate relevance score
     */
    private calculateScore(query: string, chunk: CodeChunk): number {
        const content = chunk.content.toLowerCase();
        let score = 0;

        // Exact match
        if (content.includes(query)) {
            score += 10;
        }

        // Word matches
        const queryWords = query.split(/\s+/);
        queryWords.forEach(word => {
            if (content.includes(word)) {
                score += 2;
            }
        });

        // Type bonus
        if (chunk.type === 'function' || chunk.type === 'class') {
            score += 1;
        }

        return score;
    }

    private isChunkBoundary(line: string): boolean {
        return /^(export\s+)?(function|class|interface|type)\s/.test(line.trim());
    }

    private detectChunkType(content: string): CodeChunk['type'] {
        if (/^(export\s+)?function/.test(content)) return 'function';
        if (/^(export\s+)?class/.test(content)) return 'class';
        if (/^import/.test(content)) return 'import';
        if (/^\/\*\*/.test(content)) return 'comment';
        return 'other';
    }

    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath);
        const langMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript-react',
            '.js': 'javascript',
            '.jsx': 'javascript-react'
        };
        return langMap[ext] || 'unknown';
    }

    private getContext(chunk: CodeChunk): string {
        return `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`;
    }

    getStats() {
        return {
            totalFiles: this.files.size,
            totalChunks: this.chunks.size,
            languages: Array.from(new Set(Array.from(this.files.values()).map(f => f.language)))
        };
    }
}

// Singleton
let indexer: CodeIndexer | null = null;

export function getCodeIndexer(): CodeIndexer {
    if (!indexer) {
        indexer = new CodeIndexer();
    }
    return indexer;
}
