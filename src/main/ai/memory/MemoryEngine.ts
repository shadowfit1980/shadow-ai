/**
 * Shadow Memory Engine - Core
 * 
 * The heart of Shadow AI's long-term memory system
 * Provides persistent, intelligent memory across sessions
 */

import { VectorStore } from './VectorStore';
import { EmbeddingService } from './EmbeddingService';
import { MemoryRetriever } from './MemoryRetriever';
import {
    Memory,
    MemoryType,
    ProjectContext,
    CodeMatch,
    CodingStyle,
    ArchitectureDecision,
    SearchOptions,
    MemoryEngineConfig,
    IndexingProgress
} from './types';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as glob from 'glob';
import { promisify } from 'util';

const globAsync = promisify(glob.glob);

export class ShadowMemoryEngine {
    private static instance: ShadowMemoryEngine;
    private vectorStore: VectorStore;
    private embedder: EmbeddingService;
    private retriever: MemoryRetriever;
    private initialized = false;
    private config: MemoryEngineConfig;

    private constructor(config: MemoryEngineConfig = {}) {
        this.config = config;
        this.vectorStore = new VectorStore();
        this.embedder = new EmbeddingService();
        this.retriever = new MemoryRetriever(this.vectorStore, this.embedder);
    }

    /**
     * Get singleton instance
     */
    static getInstance(config?: MemoryEngineConfig): ShadowMemoryEngine {
        if (!ShadowMemoryEngine.instance) {
            ShadowMemoryEngine.instance = new ShadowMemoryEngine(config);
        }
        return ShadowMemoryEngine.instance;
    }

    /**
     * Initialize the memory engine
     */
    async initialize(dbPath?: string): Promise<void> {
        if (this.initialized) {
            console.log('⚡ Memory engine already initialized');
            return;
        }

        const defaultPath = path.join(process.cwd(), '.shadow', 'memory');
        const finalPath = dbPath || this.config.dbPath || defaultPath;

        console.log('');
        console.log('🧠 ========================================');
        console.log('🧠 Shadow Memory Engine Initialization');
        console.log('🧠 ========================================');
        console.log('');

        // Initialize components
        await this.vectorStore.initialize(finalPath);
        await this.embedder.initialize();

        this.initialized = true;

        const stats = await this.vectorStore.getStats();
        console.log('');
        console.log('✅ Memory Engine Ready');
        console.log(`📊 Total Memories: ${stats.totalMemories}`);
        console.log(`📁 Database: ${stats.dbPath}`);
        console.log('');
    }

    /**
     * Ensure initialization
     */
    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('Memory engine not initialized. Call initialize() first.');
        }
    }

    // ==================== Core Memory Operations ====================

    /**
     * Store a memory
     */
    async remember(memory: Memory): Promise<string> {
        this.ensureInitialized();

        const id = memory.id || this.generateId(memory);
        const embedding = await this.embedder.embed(memory.content);

        await this.vectorStore.insert([{
            id,
            embedding,
            content: memory.content,
            type: memory.type,
            metadata: memory.metadata
        }]);

        console.log(`💾 Remembered: ${memory.type} (${id.substring(0, 8)}...)`);
        return id;
    }

    /**
     * Recall memories by query
     */
    async recall(query: string, k: number = 5, options?: SearchOptions): Promise<Memory[]> {
        this.ensureInitialized();
        return this.retriever.recall(query, k, options);
    }

    /**
     * Forget a memory
     */
    async forget(memoryId: string): Promise<void> {
        this.ensureInitialized();
        await this.vectorStore.delete([memoryId]);
        console.log(`🗑️  Forgot memory: ${memoryId.substring(0, 8)}...`);
    }

    /**
     * Clear all memories
     */
    async clearAll(): Promise<void> {
        this.ensureInitialized();
        await this.vectorStore.clear();
        console.log('🧹 All memories cleared');
    }

    // ==================== Project Intelligence ====================

    /**
     * Index an entire project
     */
    async indexProject(
        projectPath: string,
        onProgress?: (progress: IndexingProgress) => void
    ): Promise<void> {
        this.ensureInitialized();

        console.log('');
        console.log('📁 Indexing project:', projectPath);

        // Scan for files
        const files = await this.scanProjectFiles(projectPath);
        console.log(`📄 Found ${files.length} files to index`);

        let indexed = 0;

        for (const file of files) {
            try {
                await this.indexFile(file);
                indexed++;

                if (onProgress) {
                    onProgress({
                        total: files.length,
                        indexed,
                        current: file,
                        percentage: Math.round((indexed / files.length) * 100)
                    });
                }

                // Progress indicator
                if (indexed % 10 === 0) {
                    console.log(`📊 Progress: ${indexed}/${files.length} (${Math.round((indexed / files.length) * 100)}%)`);
                }
            } catch (error: any) {
                console.warn(`⚠️  Failed to index ${file}:`, error.message);
            }
        }

        console.log('');
        console.log(`✅ Project indexed: ${indexed}/${files.length} files`);
        console.log('');
    }

    /**
     * Index a single file
     */
    private async indexFile(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const ext = path.extname(filePath);

            // Skip if too large
            if (content.length > 50000) {
                return;
            }

            // Skip if empty
            if (content.trim().length === 0) {
                return;
            }

            const language = this.detectLanguage(ext);

            await this.remember({
                type: 'code',
                content,
                metadata: {
                    file: filePath,
                    language,
                    size: content.length,
                    lastModified: Date.now()
                }
            });
        } catch (error: any) {
            throw new Error(`Failed to index ${filePath}: ${error.message}`);
        }
    }

    // ==================== Learning ====================

    /**
     * Learn coding style from project files
     */
    async learnCodingStyle(projectPath: string): Promise<CodingStyle> {
        this.ensureInitialized();

        console.log('📚 Learning coding style...');

        const files = await this.scanProjectFiles(projectPath);
        const sampleFiles = files.slice(0, 50); // Sample first 50 files

        const patterns = {
            indentation: await this.detectIndentation(sampleFiles),
            quotes: await this.detectQuoteStyle(sampleFiles),
            semicolons: await this.detectSemicolonUsage(sampleFiles),
            naming: await this.detectNamingConventions(sampleFiles),
            imports: await this.detectImportStyle(sampleFiles)
        };

        // Store the learned style
        await this.remember({
            type: 'style',
            content: `Coding Style Analysis:\n${JSON.stringify(patterns, null, 2)}`,
            metadata: {
                files: sampleFiles.length,
                confidence: this.calculateConfidence(patterns),
                patterns
            }
        });

        console.log('✅ Coding style learned');
        return patterns;
    }

    /**
     * Remember an architecture decision
     */
    async rememberDecision(decision: ArchitectureDecision): Promise<void> {
        this.ensureInitialized();

        const content = `
Decision: ${decision.title}

Reasoning: ${decision.reasoning}

Alternatives Considered:
${decision.alternatives.map((alt, i) => `${i + 1}. ${alt}`).join('\n')}

Outcome: ${decision.outcome || 'Pending'}
    `.trim();

        await this.remember({
            type: 'decision',
            content,
            metadata: {
                title: decision.title,
                category: decision.category,
                impact: decision.impact,
                timestamp: Date.now()
            }
        });

        console.log(`💡 Decision recorded: ${decision.title}`);
    }

    // ==================== Context Retrieval ====================

    /**
     * Get relevant context for a task
     */
    async getRelevantContext(task: string, options?: SearchOptions): Promise<ProjectContext> {
        this.ensureInitialized();
        return this.retriever.getRelevantContext(task, options);
    }

    /**
     * Find similar code
     */
    async findSimilarCode(codeSnippet: string, limit?: number): Promise<CodeMatch[]> {
        this.ensureInitialized();
        return this.retriever.findSimilarCode(codeSnippet, limit);
    }

    /**
     * Search for decisions
     */
    async searchDecisions(topic: string, limit?: number): Promise<Memory[]> {
        this.ensureInitialized();
        return this.retriever.searchDecisions(topic, limit);
    }

    // ==================== Statistics ====================

    /**
     * Get memory statistics
     */
    async getStats(): Promise<{
        totalMemories: number;
        byType: Record<string, number>;
        dbPath: string;
    }> {
        this.ensureInitialized();

        const stats = await this.vectorStore.getStats();

        return {
            totalMemories: stats.totalMemories,
            byType: {}, // TODO: Implement type counting
            dbPath: stats.dbPath
        };
    }

    // ==================== Utilities ====================

    /**
     * Generate unique ID for memory
     */
    private generateId(memory: Memory): string {
        const hash = crypto.createHash('sha256');
        hash.update(memory.content + memory.type + Date.now());
        return hash.digest('hex').substring(0, 16);
    }

    /**
     * Scan project for files
     */
    private async scanProjectFiles(projectPath: string): Promise<string[]> {
        const patterns = [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.py',
            '**/*.java',
            '**/*.go',
            '**/*.rs',
            '**/*.cpp',
            '**/*.c',
            '**/*.h'
        ];

        const ignore = [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/coverage/**',
            '**/__pycache__/**'
        ];

        const allFiles: string[] = [];

        for (const pattern of patterns) {
            const files = await globAsync(pattern, {
                cwd: projectPath,
                ignore,
                absolute: true,
                nodir: true
            });

            // Ensure files is an array
            if (Array.isArray(files)) {
                allFiles.push(...files as string[]);
            }
        }

        // Remove duplicates
        return [...new Set(allFiles)];
    }

    /**
     * Detect programming language from extension
     */
    private detectLanguage(ext: string): string {
        const langMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript-react',
            '.js': 'javascript',
            '.jsx': 'javascript-react',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c-header'
        };

        return langMap[ext] || 'unknown';
    }

    /**
     * Detect indentation style
     */
    private async detectIndentation(files: string[]): Promise<any> {
        // Simple implementation - count spaces vs tabs
        let spacesCount = 0;
        let tabsCount = 0;

        for (const file of files.slice(0, 10)) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const lines = content.split('\n');

                for (const line of lines) {
                    if (line.startsWith('    ')) spacesCount++;
                    if (line.startsWith('\t')) tabsCount++;
                }
            } catch {
                // Skip files that can't be read
            }
        }

        return {
            type: spacesCount > tabsCount ? 'spaces' : 'tabs',
            size: spacesCount > tabsCount ? 4 : undefined,
            confidence: Math.abs(spacesCount - tabsCount) / (spacesCount + tabsCount)
        };
    }

    /**
     * Detect quote style
     */
    private async detectQuoteStyle(files: string[]): Promise<any> {
        let singleQuotes = 0;
        let doubleQuotes = 0;

        for (const file of files.slice(0, 10)) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                singleQuotes += (content.match(/'/g) || []).length;
                doubleQuotes += (content.match(/"/g) || []).length;
            } catch {
                // Skip
            }
        }

        return {
            type: singleQuotes > doubleQuotes ? 'single' : 'double',
            confidence: Math.abs(singleQuotes - doubleQuotes) / (singleQuotes + doubleQuotes)
        };
    }

    /**
     * Detect semicolon usage
     */
    private async detectSemicolonUsage(files: string[]): Promise<any> {
        let withSemicolons = 0;
        let withoutSemicolons = 0;

        for (const file of files.slice(0, 10)) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const lines = content.split('\n');

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.length > 0 && !trimmed.startsWith('//')) {
                        if (trimmed.endsWith(';')) withSemicolons++;
                        else withoutSemicolons++;
                    }
                }
            } catch {
                // Skip
            }
        }

        return {
            required: withSemicolons > withoutSemicolons,
            confidence: Math.abs(withSemicolons - withoutSemicolons) / (withSemicolons + withoutSemicolons)
        };
    }

    /**
     * Detect naming conventions
     */
    private async detectNamingConventions(files: string[]): Promise<any> {
        // Simplified - would need proper AST parsing for accuracy
        return {
            variables: 'camelCase',
            constants: 'UPPER_CASE',
            functions: 'camelCase',
            classes: 'PascalCase',
            confidence: 0.8
        };
    }

    /**
     * Detect import style
     */
    private async detectImportStyle(files: string[]): Promise<any> {
        let requireCount = 0;
        let importCount = 0;

        for (const file of files.slice(0, 10)) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                requireCount += (content.match(/require\(/g) || []).length;
                importCount += (content.match(/import /g) || []).length;
            } catch {
                // Skip
            }
        }

        return {
            style: importCount > requireCount ? 'import' : 'require',
            grouping: true,
            sorting: false,
            confidence: Math.abs(importCount - requireCount) / (importCount + requireCount || 1)
        };
    }

    /**
     * Calculate overall confidence
     */
    private calculateConfidence(patterns: any): number {
        const confidences = [
            patterns.indentation.confidence,
            patterns.quotes.confidence,
            patterns.semicolons.confidence,
            patterns.naming.confidence,
            patterns.imports.confidence
        ];

        return confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }
}

/**
 * Get singleton instance
 */
export function getMemoryEngine(config?: MemoryEngineConfig): ShadowMemoryEngine {
    return ShadowMemoryEngine.getInstance(config);
}
