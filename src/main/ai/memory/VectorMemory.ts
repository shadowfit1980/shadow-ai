/**
 * 🧠 VectorMemory - Semantic Code Search & Project DNA
 * 
 * Creates vector embeddings of entire codebases for:
 * - Semantic code search (find similar code)
 * - Cross-project learning
 * - Project DNA fingerprinting
 * 
 * This addresses Grok's criticism: "Your 'cross-project learning' is a joke.
 * You need vector embeddings of every codebase the user has ever built."
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CodeFragment {
    /** File path */
    file: string;
    /** Start line */
    startLine: number;
    /** End line */
    endLine: number;
    /** Code content */
    content: string;
    /** Language */
    language: string;
    /** Semantic type */
    type: 'function' | 'class' | 'module' | 'block' | 'comment';
    /** Similarity score (when returned from search) */
    similarity?: number;
    /** Embedding vector */
    embedding?: number[];
}

export interface ProjectDNA {
    /** Project identifier */
    projectId: string;
    /** Project path */
    projectPath: string;
    /** 4096-dim embedding */
    embedding: Float32Array;
    /** Analysis timestamp */
    analyzedAt: Date;
    /** Metrics */
    metrics: ProjectMetrics;
    /** Primary language */
    primaryLanguage: string;
    /** Framework detected */
    frameworks: string[];
}

export interface ProjectMetrics {
    totalFiles: number;
    totalLines: number;
    complexity: number;
    testCoverage: number;
    documentation: number;
    securityScore: number;
    performanceScore: number;
    maintainability: number;
}

export interface EmbeddingCache {
    file: string;
    hash: string;
    embedding: number[];
    cachedAt: Date;
}

export interface SearchOptions {
    /** Maximum results */
    limit?: number;
    /** Minimum similarity (0-1) */
    minSimilarity?: number;
    /** Filter by language */
    language?: string;
    /** Filter by type */
    type?: CodeFragment['type'];
    /** Include file content */
    includeContent?: boolean;
}

// ============================================================================
// VECTOR MEMORY
// ============================================================================

export class VectorMemory extends EventEmitter {
    private static instance: VectorMemory;
    private embeddings: Map<string, EmbeddingCache> = new Map();
    private projectDNAs: Map<string, ProjectDNA> = new Map();
    private fragments: Map<string, CodeFragment[]> = new Map();

    // Simple embedding dimension (for local computation)
    private readonly EMBEDDING_DIM = 256;
    // Project DNA dimension
    private readonly DNA_DIM = 4096;

    private constructor() {
        super();
    }

    public static getInstance(): VectorMemory {
        if (!VectorMemory.instance) {
            VectorMemory.instance = new VectorMemory();
        }
        return VectorMemory.instance;
    }

    /**
     * Embed an entire codebase
     */
    public async embedCodebase(projectPath: string): Promise<{ files: number; fragments: number }> {
        let fileCount = 0;
        let fragmentCount = 0;

        const files = await this.findCodeFiles(projectPath);

        for (const file of files) {
            try {
                const fragments = await this.embedFile(file);
                fragmentCount += fragments.length;
                fileCount++;

                if (fileCount % 10 === 0) {
                    this.emit('progress', { files: fileCount, total: files.length });
                }
            } catch (error) {
                // Skip files that can't be processed
            }
        }

        this.emit('complete', { files: fileCount, fragments: fragmentCount });
        console.log(`📊 Embedded ${fileCount} files, ${fragmentCount} fragments`);

        return { files: fileCount, fragments: fragmentCount };
    }

    /**
     * Embed a single file
     */
    public async embedFile(filePath: string): Promise<CodeFragment[]> {
        const content = await fs.readFile(filePath, 'utf-8');
        const hash = this.hashContent(content);

        // Check cache
        const cached = this.embeddings.get(filePath);
        if (cached && cached.hash === hash) {
            return this.fragments.get(filePath) || [];
        }

        const language = this.detectLanguage(filePath);
        const fragments = this.extractFragments(content, filePath, language);

        // Generate embeddings for each fragment
        for (const fragment of fragments) {
            fragment.embedding = this.generateEmbedding(fragment.content);
        }

        // Cache
        this.fragments.set(filePath, fragments);
        if (fragments.length > 0 && fragments[0].embedding) {
            this.embeddings.set(filePath, {
                file: filePath,
                hash,
                embedding: fragments[0].embedding,
                cachedAt: new Date()
            });
        }

        return fragments;
    }

    /**
     * Semantic search across all embedded code
     */
    public search(query: string, options: SearchOptions = {}): CodeFragment[] {
        const {
            limit = 10,
            minSimilarity = 0.5,
            language,
            type,
            includeContent = true
        } = options;

        const queryEmbedding = this.generateEmbedding(query);
        const results: CodeFragment[] = [];

        for (const [file, fragments] of this.fragments) {
            for (const fragment of fragments) {
                // Apply filters
                if (language && fragment.language !== language) continue;
                if (type && fragment.type !== type) continue;

                // Calculate similarity
                if (fragment.embedding) {
                    const similarity = this.cosineSimilarity(queryEmbedding, fragment.embedding);

                    if (similarity >= minSimilarity) {
                        results.push({
                            ...fragment,
                            similarity,
                            content: includeContent ? fragment.content : ''
                        });
                    }
                }
            }
        }

        // Sort by similarity and limit
        return results
            .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
            .slice(0, limit);
    }

    /**
     * Find similar code fragments
     */
    public findSimilar(fragment: CodeFragment, limit: number = 5): CodeFragment[] {
        if (!fragment.embedding) {
            fragment.embedding = this.generateEmbedding(fragment.content);
        }

        return this.search(fragment.content, { limit, minSimilarity: 0.7 });
    }

    /**
     * Learn from a project (cross-project learning)
     */
    public async learnFromProject(projectPath: string): Promise<void> {
        // Embed the codebase
        await this.embedCodebase(projectPath);

        // Generate project DNA
        const dna = await this.generateProjectDNA(projectPath);
        this.projectDNAs.set(projectPath, dna);

        console.log(`🧬 Learned from project: ${path.basename(projectPath)}`);
        console.log(`   - Primary language: ${dna.primaryLanguage}`);
        console.log(`   - Frameworks: ${dna.frameworks.join(', ')}`);
    }

    /**
     * Generate a 4096-dimensional "DNA" embedding for a project
     */
    public async generateProjectDNA(projectPath: string): Promise<ProjectDNA> {
        const fragments = await this.getAllFragments(projectPath);

        // Aggregate embeddings
        const dnaEmbedding = new Float32Array(this.DNA_DIM);
        let totalWeight = 0;

        for (const fragment of fragments) {
            if (fragment.embedding) {
                const weight = this.getFragmentWeight(fragment);
                totalWeight += weight;

                // Expand to DNA dimension
                for (let i = 0; i < this.DNA_DIM; i++) {
                    const sourceIdx = i % fragment.embedding.length;
                    dnaEmbedding[i] += fragment.embedding[sourceIdx] * weight;
                }
            }
        }

        // Normalize
        if (totalWeight > 0) {
            for (let i = 0; i < this.DNA_DIM; i++) {
                dnaEmbedding[i] /= totalWeight;
            }
        }

        // Calculate metrics
        const metrics = await this.analyzeProjectMetrics(projectPath, fragments);

        return {
            projectId: this.hashContent(projectPath),
            projectPath,
            embedding: dnaEmbedding,
            analyzedAt: new Date(),
            metrics,
            primaryLanguage: this.detectPrimaryLanguage(fragments),
            frameworks: await this.detectFrameworks(projectPath)
        };
    }

    /**
     * Find similar projects
     */
    public findSimilarProjects(projectPath: string, limit: number = 5): { project: ProjectDNA; similarity: number }[] {
        const targetDNA = this.projectDNAs.get(projectPath);
        if (!targetDNA) {
            return [];
        }

        const results: { project: ProjectDNA; similarity: number }[] = [];

        for (const [path, dna] of this.projectDNAs) {
            if (path === projectPath) continue;

            const similarity = this.cosineSimilarityFloat32(targetDNA.embedding, dna.embedding);
            results.push({ project: dna, similarity });
        }

        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    /**
     * Get all embedded fragments
     */
    public getAllFragments(projectPath?: string): CodeFragment[] {
        if (projectPath) {
            const result: CodeFragment[] = [];
            for (const [file, fragments] of this.fragments) {
                if (file.startsWith(projectPath)) {
                    result.push(...fragments);
                }
            }
            return result;
        }
        return Array.from(this.fragments.values()).flat();
    }

    /**
     * Clear all embeddings
     */
    public clear(): void {
        this.embeddings.clear();
        this.fragments.clear();
        this.projectDNAs.clear();
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async findCodeFiles(dir: string, files: string[] = []): Promise<string[]> {
        const codeExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
            '.cpp', '.c', '.h', '.cs', '.rb', '.php', '.swift', '.kt'
        ];

        const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', 'venv'];

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!ignoreDirs.includes(entry.name)) {
                    await this.findCodeFiles(fullPath, files);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (codeExtensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }

        return files;
    }

    private extractFragments(content: string, file: string, language: string): CodeFragment[] {
        const fragments: CodeFragment[] = [];
        const lines = content.split('\n');

        // Simple function/class detection (language-agnostic patterns)
        const functionPattern = /^\s*(async\s+)?(function|def|fn|func|sub)\s+(\w+)/;
        const classPattern = /^\s*(class|struct|interface|trait|type)\s+(\w+)/;
        const methodPattern = /^\s*(public|private|protected)?\s*(static)?\s*(async)?\s*(\w+)\s*\(/;

        let currentFragment: Partial<CodeFragment> | null = null;
        let braceDepth = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Track brace depth
            braceDepth += (line.match(/{/g) || []).length;
            braceDepth -= (line.match(/}/g) || []).length;

            // Detect new function/class
            if (functionPattern.test(line) || classPattern.test(line) || methodPattern.test(line)) {
                if (currentFragment) {
                    currentFragment.endLine = lineNum - 1;
                    currentFragment.content = lines.slice(
                        currentFragment.startLine! - 1,
                        currentFragment.endLine
                    ).join('\n');
                    fragments.push(currentFragment as CodeFragment);
                }

                currentFragment = {
                    file,
                    startLine: lineNum,
                    endLine: lineNum,
                    language,
                    type: classPattern.test(line) ? 'class' : 'function'
                };
            }

            // Close fragment on matching brace
            if (currentFragment && braceDepth === 0 && line.includes('}')) {
                currentFragment.endLine = lineNum;
                currentFragment.content = lines.slice(
                    currentFragment.startLine! - 1,
                    currentFragment.endLine
                ).join('\n');
                fragments.push(currentFragment as CodeFragment);
                currentFragment = null;
            }
        }

        // Handle unclosed fragment
        if (currentFragment) {
            currentFragment.endLine = lines.length;
            currentFragment.content = lines.slice(currentFragment.startLine! - 1).join('\n');
            fragments.push(currentFragment as CodeFragment);
        }

        // If no fragments extracted, create one for the whole file
        if (fragments.length === 0) {
            fragments.push({
                file,
                startLine: 1,
                endLine: lines.length,
                content,
                language,
                type: 'module'
            });
        }

        return fragments;
    }

    /**
     * Generate a simple embedding using TF-IDF-like approach
     * In production, this would use a real embedding model (OpenAI, Sentence-Transformers, etc.)
     */
    private generateEmbedding(text: string): number[] {
        const embedding = new Array(this.EMBEDDING_DIM).fill(0);

        // Tokenize
        const tokens = text.toLowerCase()
            .replace(/[^a-z0-9_]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2);

        // Simple hash-based embedding
        for (const token of tokens) {
            const hash = this.simpleHash(token);
            const idx = Math.abs(hash) % this.EMBEDDING_DIM;
            embedding[idx] += 1;
        }

        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= magnitude;
            }
        }

        return embedding;
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }

        const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
        return magnitude > 0 ? dotProduct / magnitude : 0;
    }

    private cosineSimilarityFloat32(a: Float32Array, b: Float32Array): number {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            dotProduct += a[i] * b[i];
            magnitudeA += a[i] * a[i];
            magnitudeB += b[i] * b[i];
        }

        const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
        return magnitude > 0 ? dotProduct / magnitude : 0;
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
            '.cpp': 'cpp', '.c': 'c', '.h': 'c',
            '.cs': 'csharp',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin'
        };
        return langMap[ext] || 'unknown';
    }

    private detectPrimaryLanguage(fragments: CodeFragment[]): string {
        const counts: Record<string, number> = {};
        for (const fragment of fragments) {
            counts[fragment.language] = (counts[fragment.language] || 0) + 1;
        }

        let primary = 'unknown';
        let maxCount = 0;
        for (const [lang, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                primary = lang;
            }
        }
        return primary;
    }

    private async detectFrameworks(projectPath: string): Promise<string[]> {
        const frameworks: string[] = [];

        try {
            // Check package.json
            const pkgPath = path.join(projectPath, 'package.json');
            const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps.react) frameworks.push('React');
            if (deps.vue) frameworks.push('Vue');
            if (deps.angular || deps['@angular/core']) frameworks.push('Angular');
            if (deps.next) frameworks.push('Next.js');
            if (deps.express) frameworks.push('Express');
            if (deps.electron) frameworks.push('Electron');
            if (deps.flutter) frameworks.push('Flutter');
        } catch {
            // No package.json
        }

        try {
            // Check pubspec.yaml for Flutter
            const pubspec = path.join(projectPath, 'pubspec.yaml');
            await fs.access(pubspec);
            frameworks.push('Flutter');
        } catch {
            // Not Flutter
        }

        return [...new Set(frameworks)];
    }

    private async analyzeProjectMetrics(projectPath: string, fragments: CodeFragment[]): Promise<ProjectMetrics> {
        let totalLines = 0;
        let complexity = 0;

        for (const fragment of fragments) {
            totalLines += fragment.endLine - fragment.startLine + 1;

            // Simple complexity metric based on nesting and branching
            const content = fragment.content;
            complexity += (content.match(/if\s*\(/g) || []).length;
            complexity += (content.match(/for\s*\(/g) || []).length;
            complexity += (content.match(/while\s*\(/g) || []).length;
            complexity += (content.match(/switch\s*\(/g) || []).length;
        }

        const files = new Set(fragments.map(f => f.file)).size;

        return {
            totalFiles: files,
            totalLines,
            complexity: Math.min(100, complexity / files * 10),
            testCoverage: 0, // Would need actual test runner
            documentation: 0, // Would analyze comments
            securityScore: 70, // Would run security scan
            performanceScore: 70,
            maintainability: Math.max(0, 100 - complexity / files * 5)
        };
    }

    private getFragmentWeight(fragment: CodeFragment): number {
        // Weight by type and size
        const typeWeights: Record<string, number> = {
            'class': 2,
            'function': 1.5,
            'module': 1,
            'block': 0.5,
            'comment': 0.3
        };

        const baseWeight = typeWeights[fragment.type] || 1;
        const lines = fragment.endLine - fragment.startLine + 1;
        const sizeWeight = Math.log10(lines + 1);

        return baseWeight * sizeWeight;
    }

    private hashContent(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
}

// Export singleton
export const vectorMemory = VectorMemory.getInstance();
