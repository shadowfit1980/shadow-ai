/**
 * Predictive Streaming Engine
 * 
 * Enhances streaming responses with predictive caching,
 * pre-rendering likely continuations to speed up interactions.
 */

import { EventEmitter } from 'events';

export interface StreamPrediction {
    id: string;
    context: string;
    predictions: PredictedContinuation[];
    confidence: number;
    generatedAt: Date;
}

export interface PredictedContinuation {
    text: string;
    probability: number;
    tokens: number;
    category: 'code' | 'explanation' | 'question' | 'action';
}

export interface StreamBuffer {
    streamId: string;
    tokens: string[];
    totalTokens: number;
    lastToken: string;
    velocity: number; // tokens per second
    predictions: PredictedContinuation[];
    hits: number; // prediction hits count
}

export interface CacheEntry {
    key: string;
    predictions: PredictedContinuation[];
    hitCount: number;
    lastAccessed: Date;
    createdAt: Date;
}

// Common code patterns for prediction
const CODE_PATTERNS: { trigger: RegExp; continuations: { text: string; prob: number }[] }[] = [
    {
        trigger: /function\s+\w+\s*\(/,
        continuations: [
            { text: ') {\n', prob: 0.7 },
            { text: ', ', prob: 0.2 },
            { text: '): ', prob: 0.1 },
        ],
    },
    {
        trigger: /if\s*\(/,
        continuations: [
            { text: ') {\n', prob: 0.6 },
            { text: ' && ', prob: 0.2 },
            { text: ' || ', prob: 0.1 },
            { text: ' === ', prob: 0.1 },
        ],
    },
    {
        trigger: /const\s+\w+\s*=/,
        continuations: [
            { text: ' {\n', prob: 0.3 },
            { text: ' [\n', prob: 0.2 },
            { text: ' async ', prob: 0.15 },
            { text: ' () => ', prob: 0.2 },
            { text: ' new ', prob: 0.15 },
        ],
    },
    {
        trigger: /return\s+/,
        continuations: [
            { text: '{\n', prob: 0.25 },
            { text: 'null', prob: 0.1 },
            { text: 'true', prob: 0.1 },
            { text: 'false', prob: 0.1 },
            { text: 'await ', prob: 0.2 },
            { text: 'new ', prob: 0.1 },
        ],
    },
    {
        trigger: /\.\w+\(/,
        continuations: [
            { text: ')', prob: 0.3 },
            { text: ', ', prob: 0.2 },
            { text: '(', prob: 0.15 },
            { text: ' => ', prob: 0.2 },
        ],
    },
    {
        trigger: /import\s+{/,
        continuations: [
            { text: ' } from ', prob: 0.6 },
            { text: ', ', prob: 0.4 },
        ],
    },
];

// Natural language patterns
const NL_PATTERNS: { trigger: RegExp; continuations: { text: string; prob: number }[] }[] = [
    {
        trigger: /Here's how/i,
        continuations: [
            { text: ' to do it:\n\n', prob: 0.4 },
            { text: ' you can fix it:\n\n', prob: 0.3 },
            { text: ' it works:\n\n', prob: 0.3 },
        ],
    },
    {
        trigger: /First,/i,
        continuations: [
            { text: ' you need to ', prob: 0.4 },
            { text: ' let me explain ', prob: 0.3 },
            { text: ' install ', prob: 0.2 },
        ],
    },
    {
        trigger: /```(\w+)?$/,
        continuations: [
            { text: '\n', prob: 0.9 },
        ],
    },
    {
        trigger: /The (error|issue|problem)/i,
        continuations: [
            { text: ' is ', prob: 0.5 },
            { text: ' occurs because ', prob: 0.3 },
            { text: ' can be fixed by ', prob: 0.2 },
        ],
    },
];

export class PredictiveStreamingEngine extends EventEmitter {
    private static instance: PredictiveStreamingEngine;
    private activeStreams: Map<string, StreamBuffer> = new Map();
    private predictionCache: Map<string, CacheEntry> = new Map();
    private maxCacheSize: number = 1000;
    private metrics = {
        totalPredictions: 0,
        hits: 0,
        misses: 0,
    };

    private constructor() {
        super();
    }

    static getInstance(): PredictiveStreamingEngine {
        if (!PredictiveStreamingEngine.instance) {
            PredictiveStreamingEngine.instance = new PredictiveStreamingEngine();
        }
        return PredictiveStreamingEngine.instance;
    }

    // ========================================================================
    // STREAM MANAGEMENT
    // ========================================================================

    /**
     * Initialize a new stream
     */
    startStream(streamId: string): StreamBuffer {
        const buffer: StreamBuffer = {
            streamId,
            tokens: [],
            totalTokens: 0,
            lastToken: '',
            velocity: 0,
            predictions: [],
            hits: 0,
        };

        this.activeStreams.set(streamId, buffer);
        this.emit('stream:started', streamId);
        return buffer;
    }

    /**
     * Process incoming token and generate predictions
     */
    processToken(streamId: string, token: string): PredictedContinuation[] {
        const buffer = this.activeStreams.get(streamId);
        if (!buffer) return [];

        buffer.tokens.push(token);
        buffer.totalTokens++;
        buffer.lastToken = token;

        // Calculate velocity (tokens per second)
        const elapsed = (Date.now() - buffer.tokens.length * 50) / 1000; // Rough estimate
        buffer.velocity = buffer.totalTokens / Math.max(1, elapsed);

        // Generate predictions based on context
        const context = buffer.tokens.slice(-20).join('');
        const predictions = this.generatePredictions(context);

        // Check if previous predictions were hit
        if (buffer.predictions.length > 0) {
            const hit = buffer.predictions.some(p =>
                token.startsWith(p.text) || p.text.startsWith(token)
            );
            if (hit) {
                buffer.hits++;
                this.metrics.hits++;
            } else {
                this.metrics.misses++;
            }
        }

        buffer.predictions = predictions;
        this.metrics.totalPredictions += predictions.length;

        this.emit('stream:token', { streamId, token, predictions });
        return predictions;
    }

    /**
     * End a stream
     */
    endStream(streamId: string): { totalTokens: number; hitRate: number } {
        const buffer = this.activeStreams.get(streamId);
        if (!buffer) return { totalTokens: 0, hitRate: 0 };

        const result = {
            totalTokens: buffer.totalTokens,
            hitRate: buffer.totalTokens > 0 ? buffer.hits / buffer.totalTokens : 0,
        };

        this.activeStreams.delete(streamId);
        this.emit('stream:ended', { streamId, ...result });
        return result;
    }

    // ========================================================================
    // PREDICTION ENGINE
    // ========================================================================

    /**
     * Generate predictions based on context
     */
    private generatePredictions(context: string): PredictedContinuation[] {
        const predictions: PredictedContinuation[] = [];

        // Check cache first
        const cacheKey = this.getCacheKey(context);
        const cached = this.predictionCache.get(cacheKey);
        if (cached) {
            cached.hitCount++;
            cached.lastAccessed = new Date();
            return cached.predictions;
        }

        // Check code patterns
        for (const { trigger, continuations } of CODE_PATTERNS) {
            if (trigger.test(context)) {
                for (const cont of continuations) {
                    predictions.push({
                        text: cont.text,
                        probability: cont.prob,
                        tokens: cont.text.split(/\s+/).length,
                        category: 'code',
                    });
                }
            }
        }

        // Check NL patterns
        for (const { trigger, continuations } of NL_PATTERNS) {
            if (trigger.test(context)) {
                for (const cont of continuations) {
                    predictions.push({
                        text: cont.text,
                        probability: cont.prob,
                        tokens: cont.text.split(/\s+/).length,
                        category: 'explanation',
                    });
                }
            }
        }

        // Sort by probability
        predictions.sort((a, b) => b.probability - a.probability);

        // Cache predictions
        if (predictions.length > 0) {
            this.cachePredicitions(cacheKey, predictions.slice(0, 5));
        }

        return predictions.slice(0, 5);
    }

    /**
     * Pre-render likely continuations for faster display
     */
    preRender(context: string): string[] {
        const predictions = this.generatePredictions(context);
        return predictions.map(p => p.text);
    }

    // ========================================================================
    // CACHE MANAGEMENT
    // ========================================================================

    private getCacheKey(context: string): string {
        // Use last 50 characters as key
        return context.slice(-50).toLowerCase().replace(/\s+/g, ' ');
    }

    private cachePredicitions(key: string, predictions: PredictedContinuation[]): void {
        // Evict old entries if cache is full
        if (this.predictionCache.size >= this.maxCacheSize) {
            this.evictOldestEntries(100);
        }

        this.predictionCache.set(key, {
            key,
            predictions,
            hitCount: 0,
            lastAccessed: new Date(),
            createdAt: new Date(),
        });
    }

    private evictOldestEntries(count: number): void {
        const entries = Array.from(this.predictionCache.entries())
            .sort((a, b) => {
                // Sort by hit count (ascending) then by last accessed (ascending)
                if (a[1].hitCount !== b[1].hitCount) {
                    return a[1].hitCount - b[1].hitCount;
                }
                return a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime();
            });

        for (let i = 0; i < count && i < entries.length; i++) {
            this.predictionCache.delete(entries[i][0]);
        }
    }

    // ========================================================================
    // METRICS
    // ========================================================================

    getMetrics(): { hitRate: number; totalPredictions: number; cacheSize: number } {
        const total = this.metrics.hits + this.metrics.misses;
        return {
            hitRate: total > 0 ? this.metrics.hits / total : 0,
            totalPredictions: this.metrics.totalPredictions,
            cacheSize: this.predictionCache.size,
        };
    }

    getActiveStreams(): string[] {
        return Array.from(this.activeStreams.keys());
    }
}

export const predictiveStreamingEngine = PredictiveStreamingEngine.getInstance();
