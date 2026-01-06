/**
 * Streaming Pipeline
 * 
 * Composable streaming pipeline with stages for token processing,
 * parsing, validation, and UI updates via SSE.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamChunk {
    id: string;
    content: string;
    type: 'token' | 'parsed' | 'validated' | 'final' | 'error';
    metadata?: Record<string, any>;
    timestamp: Date;
}

export interface TransformResult {
    chunks: StreamChunk[];
    shouldContinue: boolean;
    error?: Error;
}

/**
 * Interface for pipeline stage transformers
 */
export interface StreamTransformer {
    name: string;
    transform(chunk: StreamChunk): Promise<TransformResult>;
    flush?(): Promise<StreamChunk[]>;
}

export interface PipelineConfig {
    /** Buffer size before flushing */
    bufferSize: number;
    /** Timeout for each stage (ms) */
    stageTimeout: number;
    /** Enable parallel stage execution */
    parallel: boolean;
}

export interface PipelineStats {
    chunksProcessed: number;
    chunksEmitted: number;
    errors: number;
    avgLatency: number;
    stageStats: Record<string, { processed: number; avgTime: number }>;
}

// ============================================================================
// BUILT-IN TRANSFORMERS
// ============================================================================

/**
 * Tokenizer transformer - splits text into tokens
 */
export class TokenizerTransformer implements StreamTransformer {
    name = 'tokenizer';
    private buffer = '';

    async transform(chunk: StreamChunk): Promise<TransformResult> {
        this.buffer += chunk.content;
        const chunks: StreamChunk[] = [];

        // Split on whitespace but keep structure
        const tokens = this.buffer.split(/(\s+)/);

        // Keep last incomplete token in buffer
        this.buffer = tokens.pop() || '';

        for (const token of tokens) {
            if (token.trim()) {
                chunks.push({
                    id: `${chunk.id}_tok_${chunks.length}`,
                    content: token,
                    type: 'token',
                    metadata: { ...chunk.metadata, stage: 'tokenizer' },
                    timestamp: new Date(),
                });
            }
        }

        return { chunks, shouldContinue: true };
    }

    async flush(): Promise<StreamChunk[]> {
        if (this.buffer.trim()) {
            const chunk: StreamChunk = {
                id: `tok_final_${Date.now()}`,
                content: this.buffer,
                type: 'token',
                metadata: { stage: 'tokenizer', final: true },
                timestamp: new Date(),
            };
            this.buffer = '';
            return [chunk];
        }
        return [];
    }
}

/**
 * JSON Parser transformer - accumulates and parses JSON
 */
export class JSONParserTransformer implements StreamTransformer {
    name = 'json_parser';
    private buffer = '';
    private braceCount = 0;
    private inString = false;

    async transform(chunk: StreamChunk): Promise<TransformResult> {
        const chunks: StreamChunk[] = [];

        for (const char of chunk.content) {
            this.buffer += char;

            if (char === '"' && this.buffer[this.buffer.length - 2] !== '\\') {
                this.inString = !this.inString;
            }

            if (!this.inString) {
                if (char === '{') this.braceCount++;
                if (char === '}') this.braceCount--;

                // Complete JSON object found
                if (this.braceCount === 0 && this.buffer.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(this.buffer);
                        chunks.push({
                            id: `${chunk.id}_json_${Date.now()}`,
                            content: JSON.stringify(parsed),
                            type: 'parsed',
                            metadata: { ...chunk.metadata, parsed, stage: 'json_parser' },
                            timestamp: new Date(),
                        });
                        this.buffer = '';
                    } catch {
                        // Not valid JSON yet, continue accumulating
                    }
                }
            }
        }

        return { chunks, shouldContinue: true };
    }

    async flush(): Promise<StreamChunk[]> {
        if (this.buffer.trim()) {
            try {
                const parsed = JSON.parse(this.buffer);
                return [{
                    id: `json_final_${Date.now()}`,
                    content: JSON.stringify(parsed),
                    type: 'parsed',
                    metadata: { parsed, stage: 'json_parser', final: true },
                    timestamp: new Date(),
                }];
            } catch {
                // Return as raw content
                return [{
                    id: `json_raw_${Date.now()}`,
                    content: this.buffer,
                    type: 'token',
                    metadata: { stage: 'json_parser', parseError: true },
                    timestamp: new Date(),
                }];
            }
        }
        return [];
    }
}

/**
 * Validator transformer - validates chunks against schema
 */
export class ValidatorTransformer implements StreamTransformer {
    name = 'validator';
    private schema: Record<string, any>;

    constructor(schema: Record<string, any> = {}) {
        this.schema = schema;
    }

    async transform(chunk: StreamChunk): Promise<TransformResult> {
        const parsed = chunk.metadata?.parsed;

        if (parsed && this.schema) {
            const isValid = this.validate(parsed);
            return {
                chunks: [{
                    ...chunk,
                    id: `${chunk.id}_val`,
                    type: isValid ? 'validated' : 'error',
                    metadata: {
                        ...chunk.metadata,
                        validated: isValid,
                        stage: 'validator'
                    },
                }],
                shouldContinue: isValid,
                error: isValid ? undefined : new Error('Validation failed'),
            };
        }

        // Pass through non-parsed chunks
        return {
            chunks: [{ ...chunk, metadata: { ...chunk.metadata, stage: 'validator' } }],
            shouldContinue: true
        };
    }

    private validate(data: any): boolean {
        // Simple schema validation
        for (const [key, expectedType] of Object.entries(this.schema)) {
            if (!(key in data)) return false;
            if (typeof data[key] !== expectedType) return false;
        }
        return true;
    }
}

/**
 * Accumulator transformer - collects all chunks into final output
 */
export class AccumulatorTransformer implements StreamTransformer {
    name = 'accumulator';
    private accumulated: StreamChunk[] = [];

    async transform(chunk: StreamChunk): Promise<TransformResult> {
        this.accumulated.push(chunk);
        return { chunks: [], shouldContinue: true };
    }

    async flush(): Promise<StreamChunk[]> {
        const content = this.accumulated.map(c => c.content).join('');
        const chunk: StreamChunk = {
            id: `acc_final_${Date.now()}`,
            content,
            type: 'final',
            metadata: {
                stage: 'accumulator',
                chunkCount: this.accumulated.length,
            },
            timestamp: new Date(),
        };
        this.accumulated = [];
        return [chunk];
    }

    getAccumulated(): StreamChunk[] {
        return [...this.accumulated];
    }
}

// ============================================================================
// STREAMING PIPELINE
// ============================================================================

export class StreamingPipeline extends EventEmitter {
    private static instance: StreamingPipeline;
    private stages: StreamTransformer[] = [];
    private config: PipelineConfig = {
        bufferSize: 100,
        stageTimeout: 5000,
        parallel: false,
    };
    private stats: PipelineStats = {
        chunksProcessed: 0,
        chunksEmitted: 0,
        errors: 0,
        avgLatency: 0,
        stageStats: {},
    };
    private running = false;

    private constructor() {
        super();
    }

    static getInstance(): StreamingPipeline {
        if (!StreamingPipeline.instance) {
            StreamingPipeline.instance = new StreamingPipeline();
        }
        return StreamingPipeline.instance;
    }

    // -------------------------------------------------------------------------
    // Pipeline Building
    // -------------------------------------------------------------------------

    /**
     * Add a stage to the pipeline
     */
    addStage(transformer: StreamTransformer): StreamingPipeline {
        this.stages.push(transformer);
        this.stats.stageStats[transformer.name] = { processed: 0, avgTime: 0 };
        return this;
    }

    /**
     * Remove a stage by name
     */
    removeStage(name: string): boolean {
        const index = this.stages.findIndex(s => s.name === name);
        if (index >= 0) {
            this.stages.splice(index, 1);
            delete this.stats.stageStats[name];
            return true;
        }
        return false;
    }

    /**
     * Clear all stages
     */
    clearStages(): void {
        this.stages = [];
        this.stats.stageStats = {};
    }

    // -------------------------------------------------------------------------
    // Processing
    // -------------------------------------------------------------------------

    /**
     * Process a single chunk through the pipeline
     */
    async process(chunk: StreamChunk): Promise<StreamChunk[]> {
        const startTime = Date.now();
        let chunks: StreamChunk[] = [chunk];
        this.stats.chunksProcessed++;

        for (const stage of this.stages) {
            const stageStart = Date.now();
            const newChunks: StreamChunk[] = [];

            for (const c of chunks) {
                try {
                    const result = await this.runWithTimeout(
                        stage.transform(c),
                        this.config.stageTimeout
                    );

                    if (result.error) {
                        this.stats.errors++;
                        this.emit('error', { stage: stage.name, error: result.error, chunk: c });
                    }

                    newChunks.push(...result.chunks);

                    if (!result.shouldContinue) {
                        break;
                    }
                } catch (error) {
                    this.stats.errors++;
                    this.emit('error', { stage: stage.name, error, chunk: c });
                }
            }

            // Update stage stats
            const stageTime = Date.now() - stageStart;
            const stageStat = this.stats.stageStats[stage.name];
            stageStat.processed++;
            stageStat.avgTime = stageStat.avgTime + (stageTime - stageStat.avgTime) / stageStat.processed;

            chunks = newChunks;
        }

        // Update overall stats
        const latency = Date.now() - startTime;
        this.stats.avgLatency = this.stats.avgLatency + (latency - this.stats.avgLatency) / this.stats.chunksProcessed;
        this.stats.chunksEmitted += chunks.length;

        // Emit processed chunks
        for (const c of chunks) {
            this.emit('chunk', c);
        }

        return chunks;
    }

    /**
     * Process a stream of chunks
     */
    async processStream(
        inputStream: AsyncIterable<string>,
        onChunk?: (chunk: StreamChunk) => void
    ): Promise<StreamChunk[]> {
        this.running = true;
        const allChunks: StreamChunk[] = [];

        try {
            for await (const content of inputStream) {
                if (!this.running) break;

                const inputChunk: StreamChunk = {
                    id: `input_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    content,
                    type: 'token',
                    timestamp: new Date(),
                };

                const outputChunks = await this.process(inputChunk);
                allChunks.push(...outputChunks);

                if (onChunk) {
                    outputChunks.forEach(onChunk);
                }
            }

            // Flush all stages
            const flushed = await this.flush();
            allChunks.push(...flushed);

            if (onChunk) {
                flushed.forEach(onChunk);
            }

        } finally {
            this.running = false;
        }

        return allChunks;
    }

    /**
     * Flush all stages
     */
    async flush(): Promise<StreamChunk[]> {
        const allChunks: StreamChunk[] = [];

        for (const stage of this.stages) {
            if (stage.flush) {
                const chunks = await stage.flush();
                // Process flushed chunks through remaining stages
                for (const chunk of chunks) {
                    const processed = await this.processFromStage(chunk, stage);
                    allChunks.push(...processed);
                }
            }
        }

        return allChunks;
    }

    /**
     * Stop processing
     */
    stop(): void {
        this.running = false;
    }

    // -------------------------------------------------------------------------
    // SSE Support
    // -------------------------------------------------------------------------

    /**
     * Create an SSE-compatible event stream
     */
    createSSEStream(): {
        write: (content: string) => void;
        end: () => void;
        onEvent: (handler: (event: string) => void) => void;
    } {
        const handlers: ((event: string) => void)[] = [];

        this.on('chunk', (chunk: StreamChunk) => {
            const event = `event: chunk\ndata: ${JSON.stringify(chunk)}\n\n`;
            handlers.forEach(h => h(event));
        });

        this.on('error', (error) => {
            const event = `event: error\ndata: ${JSON.stringify(error)}\n\n`;
            handlers.forEach(h => h(event));
        });

        return {
            write: async (content: string) => {
                await this.process({
                    id: `sse_${Date.now()}`,
                    content,
                    type: 'token',
                    timestamp: new Date(),
                });
            },
            end: async () => {
                const flushed = await this.flush();
                const event = `event: end\ndata: ${JSON.stringify({ chunks: flushed.length })}\n\n`;
                handlers.forEach(h => h(event));
            },
            onEvent: (handler) => {
                handlers.push(handler);
            },
        };
    }

    // -------------------------------------------------------------------------
    // Utility Methods
    // -------------------------------------------------------------------------

    private async runWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Stage timeout')), timeout)
            ),
        ]);
    }

    private async processFromStage(chunk: StreamChunk, startStage: StreamTransformer): Promise<StreamChunk[]> {
        const startIndex = this.stages.indexOf(startStage) + 1;
        let chunks: StreamChunk[] = [chunk];

        for (let i = startIndex; i < this.stages.length; i++) {
            const stage = this.stages[i];
            const newChunks: StreamChunk[] = [];

            for (const c of chunks) {
                const result = await stage.transform(c);
                newChunks.push(...result.chunks);
            }

            chunks = newChunks;
        }

        return chunks;
    }

    // -------------------------------------------------------------------------
    // Configuration & Stats
    // -------------------------------------------------------------------------

    setConfig(config: Partial<PipelineConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): PipelineConfig {
        return { ...this.config };
    }

    getStats(): PipelineStats {
        return { ...this.stats };
    }

    resetStats(): void {
        this.stats = {
            chunksProcessed: 0,
            chunksEmitted: 0,
            errors: 0,
            avgLatency: 0,
            stageStats: Object.fromEntries(
                this.stages.map(s => [s.name, { processed: 0, avgTime: 0 }])
            ),
        };
    }

    getStages(): string[] {
        return this.stages.map(s => s.name);
    }
}

// Export singleton and helpers
export const streamingPipeline = StreamingPipeline.getInstance();

/**
 * Create a new independent pipeline instance
 */
export function createPipeline(): StreamingPipeline {
    return new (StreamingPipeline as any)();
}
