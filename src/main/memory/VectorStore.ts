/**
 * VectorStore - SQLite-based Persistent Embeddings
 * 
 * Provides semantic search capabilities:
 * - SQLite storage for embeddings (Float32Array as BLOB)
 * - OpenAI ada-002 embedding generation
 * - Cosine similarity search
 * - Incremental indexing
 * - Cross-session persistence
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

// Dynamic import for better-sqlite3 (optional dependency)
let Database: any;
try {
    Database = require('better-sqlite3');
} catch {
    Database = null;
}

// ============================================================================
// TYPES
// ============================================================================

export interface VectorDocument {
    /** Unique document ID */
    id: string;
    /** Source file path */
    filePath: string;
    /** Chunk index within file */
    chunkIndex: number;
    /** Text content */
    content: string;
    /** Embedding vector (1536 dimensions for ada-002) */
    embedding: Float32Array;
    /** Additional metadata */
    metadata: Record<string, any>;
    /** Last update timestamp */
    updatedAt: Date;
}

export interface SearchResult {
    document: VectorDocument;
    similarity: number;
}

export interface IndexingProgress {
    totalFiles: number;
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    errors: string[];
}

export interface VectorStoreConfig {
    /** Database file path */
    dbPath: string;
    /** Embedding dimensions */
    dimensions: number;
    /** OpenAI API key for embeddings */
    openaiApiKey?: string;
    /** Chunk size in characters */
    chunkSize: number;
    /** Chunk overlap in characters */
    chunkOverlap: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: VectorStoreConfig = {
    dbPath: path.join(os.homedir(), '.shadow-ai', 'vectors.db'),
    dimensions: 1536,  // OpenAI ada-002
    chunkSize: 1000,
    chunkOverlap: 200
};

// ============================================================================
// VECTOR STORE CLASS
// ============================================================================

export class VectorStore {
    private db: any = null;
    private config: VectorStoreConfig;
    private initialized: boolean = false;
    private embeddingCache: Map<string, Float32Array> = new Map();

    constructor(config: Partial<VectorStoreConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize database and create tables
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Ensure directory exists
        const dbDir = path.dirname(this.config.dbPath);
        await fs.mkdir(dbDir, { recursive: true });

        // Open database
        this.db = new Database(this.config.dbPath);

        // Enable WAL mode for better performance
        this.db.pragma('journal_mode = WAL');

        // Create tables
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                file_path TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                content TEXT NOT NULL,
                embedding BLOB NOT NULL,
                metadata TEXT,
                updated_at INTEGER NOT NULL,
                UNIQUE(file_path, chunk_index)
            );

            CREATE INDEX IF NOT EXISTS idx_file_path ON documents(file_path);
            CREATE INDEX IF NOT EXISTS idx_updated_at ON documents(updated_at);

            CREATE TABLE IF NOT EXISTS file_checksums (
                file_path TEXT PRIMARY KEY,
                checksum TEXT NOT NULL,
                indexed_at INTEGER NOT NULL
            );
        `);

        // Prepare statements
        this.prepareStatements();
        this.initialized = true;
        console.log(`[VectorStore] Initialized at ${this.config.dbPath}`);
    }

    private insertStmt: any;
    private searchStmt: any;
    private deleteByPathStmt: any;
    private getByPathStmt: any;

    /**
     * Prepare SQL statements for performance
     */
    private prepareStatements(): void {
        if (!this.db) return;

        this.insertStmt = this.db.prepare(`
            INSERT OR REPLACE INTO documents 
            (id, file_path, chunk_index, content, embedding, metadata, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        this.deleteByPathStmt = this.db.prepare(`
            DELETE FROM documents WHERE file_path = ?
        `);

        this.getByPathStmt = this.db.prepare(`
            SELECT * FROM documents WHERE file_path = ?
        `);
    }

    /**
     * Store a document with its embedding
     */
    async store(document: Omit<VectorDocument, 'embedding'>, embedding?: Float32Array): Promise<void> {
        await this.initialize();

        // Generate embedding if not provided
        const vector = embedding || await this.generateEmbedding(document.content);

        // Serialize embedding to Buffer
        const embeddingBuffer = Buffer.from(vector.buffer);

        this.insertStmt.run(
            document.id,
            document.filePath,
            document.chunkIndex,
            document.content,
            embeddingBuffer,
            JSON.stringify(document.metadata),
            Date.now()
        );
    }

    /**
     * Store multiple documents in a transaction
     */
    async storeBatch(documents: Omit<VectorDocument, 'embedding'>[]): Promise<void> {
        await this.initialize();

        // Generate embeddings in batch
        const contents = documents.map(d => d.content);
        const embeddings = await this.generateEmbeddingsBatch(contents);

        // Use transaction for batch insert
        const transaction = this.db!.transaction((docs: typeof documents) => {
            for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                const embedding = embeddings[i];
                const embeddingBuffer = Buffer.from(embedding.buffer);

                this.insertStmt.run(
                    doc.id,
                    doc.filePath,
                    doc.chunkIndex,
                    doc.content,
                    embeddingBuffer,
                    JSON.stringify(doc.metadata),
                    Date.now()
                );
            }
        });

        transaction(documents);
    }

    /**
     * Search for similar documents
     */
    async search(query: string, options: {
        limit?: number;
        threshold?: number;
        filePaths?: string[];
    } = {}): Promise<SearchResult[]> {
        await this.initialize();

        const { limit = 10, threshold = 0.5, filePaths } = options;

        // Generate query embedding
        const queryEmbedding = await this.generateEmbedding(query);

        // Get all documents (or filtered by paths)
        let sql = 'SELECT * FROM documents';
        const params: any[] = [];

        if (filePaths && filePaths.length > 0) {
            const placeholders = filePaths.map(() => '?').join(',');
            sql += ` WHERE file_path IN (${placeholders})`;
            params.push(...filePaths);
        }

        const rows = this.db!.prepare(sql).all(...params);

        // Calculate similarities
        const results: SearchResult[] = [];

        for (const row of rows as any[]) {
            const embedding = new Float32Array(row.embedding.buffer.slice(
                row.embedding.byteOffset,
                row.embedding.byteOffset + row.embedding.byteLength
            ));

            const similarity = this.cosineSimilarity(queryEmbedding, embedding);

            if (similarity >= threshold) {
                results.push({
                    document: {
                        id: row.id,
                        filePath: row.file_path,
                        chunkIndex: row.chunk_index,
                        content: row.content,
                        embedding: embedding,
                        metadata: JSON.parse(row.metadata || '{}'),
                        updatedAt: new Date(row.updated_at)
                    },
                    similarity
                });
            }
        }

        // Sort by similarity and limit
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit);
    }

    /**
     * Index a file (chunk and store)
     */
    async indexFile(filePath: string, content?: string): Promise<number> {
        await this.initialize();

        // Read file if content not provided
        const fileContent = content || await fs.readFile(filePath, 'utf-8');

        // Delete existing chunks for this file
        this.deleteByPathStmt.run(filePath);

        // Chunk the content
        const chunks = this.chunkText(fileContent);

        // Store each chunk
        const documents = chunks.map((chunk, index) => ({
            id: `${filePath}:${index}`,
            filePath,
            chunkIndex: index,
            content: chunk,
            metadata: {
                language: this.detectLanguage(filePath),
                totalChunks: chunks.length
            },
            updatedAt: new Date()
        }));

        await this.storeBatch(documents);

        return chunks.length;
    }

    /**
     * Index a directory recursively
     */
    async indexDirectory(
        dirPath: string,
        options: {
            extensions?: string[];
            ignore?: string[];
            onProgress?: (progress: IndexingProgress) => void;
        } = {}
    ): Promise<IndexingProgress> {
        const {
            extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json'],
            ignore = ['node_modules', '.git', 'dist', 'build'],
            onProgress
        } = options;

        const progress: IndexingProgress = {
            totalFiles: 0,
            processedFiles: 0,
            totalChunks: 0,
            processedChunks: 0,
            errors: []
        };

        // Find all files
        const files = await this.findFiles(dirPath, extensions, ignore);
        progress.totalFiles = files.length;

        // Index each file
        for (const file of files) {
            try {
                const chunks = await this.indexFile(file);
                progress.processedFiles++;
                progress.totalChunks += chunks;
                progress.processedChunks += chunks;

                if (onProgress) {
                    onProgress({ ...progress });
                }
            } catch (error: any) {
                progress.errors.push(`${file}: ${error.message}`);
            }
        }

        return progress;
    }

    /**
     * Generate embedding using OpenAI
     */
    private async generateEmbedding(text: string): Promise<Float32Array> {
        // Check cache first
        const cacheKey = this.hashText(text);
        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey)!;
        }

        // Use OpenAI API
        if (this.config.openaiApiKey) {
            const embedding = await this.callOpenAIEmbedding(text);
            this.embeddingCache.set(cacheKey, embedding);
            return embedding;
        }

        // Fallback: simple hash-based embedding (not semantic, but deterministic)
        console.warn('[VectorStore] No OpenAI key, using fallback embeddings (limited quality)');
        return this.generateFallbackEmbedding(text);
    }

    /**
     * Generate embeddings in batch
     */
    private async generateEmbeddingsBatch(texts: string[]): Promise<Float32Array[]> {
        if (this.config.openaiApiKey) {
            return this.callOpenAIEmbeddingBatch(texts);
        }

        // Fallback for each
        return texts.map(t => this.generateFallbackEmbedding(t));
    }

    /**
     * Call OpenAI embeddings API
     */
    private async callOpenAIEmbedding(text: string): Promise<Float32Array> {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: text.substring(0, 8000)  // Limit to ~8K chars
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return new Float32Array(data.data[0].embedding);
    }

    /**
     * Call OpenAI embeddings API for batch
     */
    private async callOpenAIEmbeddingBatch(texts: string[]): Promise<Float32Array[]> {
        // OpenAI supports up to 2048 inputs per request
        const batchSize = 100;
        const results: Float32Array[] = [];

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize).map(t => t.substring(0, 8000));

            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'text-embedding-ada-002',
                    input: batch
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            for (const item of data.data) {
                results.push(new Float32Array(item.embedding));
            }
        }

        return results;
    }

    /**
     * Fallback embedding (deterministic hash-based, not semantic)
     */
    private generateFallbackEmbedding(text: string): Float32Array {
        const embedding = new Float32Array(this.config.dimensions);

        // Simple hash-based embedding
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i);
            hash |= 0;
        }

        // Generate pseudo-random values from hash
        const seed = Math.abs(hash);
        for (let i = 0; i < this.config.dimensions; i++) {
            const x = Math.sin(seed * (i + 1)) * 10000;
            embedding[i] = x - Math.floor(x);
        }

        // Normalize
        const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
        for (let i = 0; i < embedding.length; i++) {
            embedding[i] /= norm;
        }

        return embedding;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(a: Float32Array, b: Float32Array): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Chunk text into overlapping segments
     */
    private chunkText(text: string): string[] {
        const chunks: string[] = [];
        const { chunkSize, chunkOverlap } = this.config;

        // Split by lines first to avoid breaking mid-line
        const lines = text.split('\n');
        let currentChunk = '';

        for (const line of lines) {
            if (currentChunk.length + line.length > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                // Keep overlap
                const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
                currentChunk = currentChunk.substring(overlapStart) + '\n' + line;
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Find files recursively
     */
    private async findFiles(
        dir: string,
        extensions: string[],
        ignore: string[]
    ): Promise<string[]> {
        const files: string[] = [];

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip ignored directories
            if (ignore.some(i => entry.name.includes(i))) continue;

            if (entry.isDirectory()) {
                files.push(...await this.findFiles(fullPath, extensions, ignore));
            } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                files.push(fullPath);
            }
        }

        return files;
    }

    /**
     * Detect language from file extension
     */
    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const langMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.md': 'markdown',
            '.json': 'json',
            '.html': 'html',
            '.css': 'css'
        };
        return langMap[ext] || 'unknown';
    }

    /**
     * Simple text hash
     */
    private hashText(text: string): string {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Delete documents for a file
     */
    async deleteFile(filePath: string): Promise<void> {
        await this.initialize();
        this.deleteByPathStmt.run(filePath);
    }

    /**
     * Get statistics
     */
    getStats(): { totalDocuments: number; totalFiles: number; dbSizeBytes: number } {
        if (!this.db) {
            return { totalDocuments: 0, totalFiles: 0, dbSizeBytes: 0 };
        }

        const docCount = this.db.prepare('SELECT COUNT(*) as count FROM documents').get() as any;
        const fileCount = this.db.prepare('SELECT COUNT(DISTINCT file_path) as count FROM documents').get() as any;

        let dbSize = 0;
        try {
            const stats = require('fs').statSync(this.config.dbPath);
            dbSize = stats.size;
        } catch { }

        return {
            totalDocuments: docCount?.count || 0,
            totalFiles: fileCount?.count || 0,
            dbSizeBytes: dbSize
        };
    }

    /**
     * Close database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initialized = false;
        }
    }
}

// Create singleton with lazy initialization
let vectorStoreInstance: VectorStore | null = null;

export function getVectorStore(config?: Partial<VectorStoreConfig>): VectorStore {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new VectorStore(config);
    }
    return vectorStoreInstance;
}
