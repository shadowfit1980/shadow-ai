/**
 * EmbeddingService - Local Embedding Generation
 * 
 * Uses Xenova Transformers for local, privacy-first embeddings
 */

import { pipeline, Pipeline } from '@xenova/transformers';

export class EmbeddingService {
    private embedder?: any; // Using any to avoid Pipeline type conflicts
    private readonly modelName = 'Xenova/all-MiniLM-L6-v2';
    private readonly embeddingDimension = 384;
    private isInitialized = false;

    /**
     * Initialize the embedding model
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('🤖 Loading embedding model:', this.modelName);
            console.log('📦 First-time model download may take a moment...');

            this.embedder = await pipeline('feature-extraction', this.modelName);

            this.isInitialized = true;
            console.log('✅ Embedding model ready');
        } catch (error: any) {
            console.error('❌ Failed to load embedding model:', error.message);
            throw new Error(`Embedding initialization failed: ${error.message}`);
        }
    }

    /**
     * Generate embedding for a single text
     */
    async embed(text: string): Promise<number[]> {
        if (!this.embedder) {
            throw new Error('Embedding service not initialized');
        }

        if (!text || text.trim().length === 0) {
            return new Array(this.embeddingDimension).fill(0);
        }

        try {
            // Truncate very long text to prevent memory issues
            const truncatedText = text.slice(0, 10000);

            const output = await this.embedder(truncatedText, {
                pooling: 'mean',
                normalize: true
            });

            // Convert tensor to array
            return Array.from(output.data as Float32Array);
        } catch (error: any) {
            console.error('❌ Embedding generation failed:', error.message);
            // Return zero vector as fallback
            return new Array(this.embeddingDimension).fill(0);
        }
    }

    /**
     * Generate embeddings for multiple texts
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        if (!this.embedder) {
            throw new Error('Embedding service not initialized');
        }

        const embeddings: number[][] = [];

        for (const text of texts) {
            const embedding = await this.embed(text);
            embeddings.push(embedding);
        }

        return embeddings;
    }

    /**
     * Generate embedding for code with context
     */
    async embedCode(code: string, context?: {
        filename?: string;
        language?: string;
        purpose?: string;
    }): Promise<number[]> {
        // Enrich code with context for better embeddings
        let enrichedText = code;

        if (context) {
            const contextParts: string[] = [];

            if (context.filename) {
                contextParts.push(`File: ${context.filename}`);
            }
            if (context.language) {
                contextParts.push(`Language: ${context.language}`);
            }
            if (context.purpose) {
                contextParts.push(`Purpose: ${context.purpose}`);
            }

            if (contextParts.length > 0) {
                enrichedText = `${contextParts.join('\n')}\n\n${code}`;
            }
        }

        return this.embed(enrichedText);
    }

    /**
     * Calculate similarity between two embeddings
     */
    cosineSimilarity(embedding1: number[], embedding2: number[]): number {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have same dimension');
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        if (norm1 === 0 || norm2 === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Get embedding dimension
     */
    getDimension(): number {
        return this.embeddingDimension;
    }

    /**
     * Check if service is ready
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}
