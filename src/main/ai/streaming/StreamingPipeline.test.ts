/**
 * StreamingPipeline Unit Tests
 */

import {
    StreamingPipeline,
    StreamChunk,
    TokenizerTransformer,
    JSONParserTransformer,
    ValidatorTransformer,
    AccumulatorTransformer
} from './StreamingPipeline';

describe('StreamingPipeline', () => {
    let pipeline: StreamingPipeline;

    beforeEach(() => {
        pipeline = (StreamingPipeline as any).getInstance();
        pipeline.clearStages();
    });

    describe('Stage Management', () => {
        it('should add stages', () => {
            pipeline.addStage(new TokenizerTransformer());
            pipeline.addStage(new AccumulatorTransformer());

            const stages = pipeline.getStages();
            expect(stages).toHaveLength(2);
            expect(stages).toContain('tokenizer');
            expect(stages).toContain('accumulator');
        });

        it('should clear stages', () => {
            pipeline.addStage(new TokenizerTransformer());
            pipeline.clearStages();

            expect(pipeline.getStages()).toHaveLength(0);
        });
    });

    describe('Transformers', () => {
        describe('TokenizerTransformer', () => {
            it('should have correct name', () => {
                const tokenizer = new TokenizerTransformer();
                expect(tokenizer.name).toBe('tokenizer');
            });

            it('should transform chunks', async () => {
                const tokenizer = new TokenizerTransformer();
                const chunk: StreamChunk = {
                    id: 'test1',
                    content: 'Hello world',
                    type: 'token',
                    timestamp: new Date()
                };

                const result = await tokenizer.transform(chunk);
                expect(result).toBeDefined();
            });
        });

        describe('JSONParserTransformer', () => {
            it('should have correct name', () => {
                const parser = new JSONParserTransformer();
                expect(parser.name).toBe('json_parser');
            });

            it('should parse JSON content', async () => {
                const parser = new JSONParserTransformer();
                const chunk: StreamChunk = {
                    id: 'json1',
                    content: '{"key": "value"}',
                    type: 'token',
                    timestamp: new Date()
                };

                const result = await parser.transform(chunk);
                expect(result).toBeDefined();
            });

            it('should handle non-JSON content gracefully', async () => {
                const parser = new JSONParserTransformer();
                const chunk: StreamChunk = {
                    id: 'text1',
                    content: 'Not JSON',
                    type: 'token',
                    timestamp: new Date()
                };

                const result = await parser.transform(chunk);
                expect(result).toBeDefined();
            });
        });

        describe('ValidatorTransformer', () => {
            it('should have correct name', () => {
                const validator = new ValidatorTransformer();
                expect(validator.name).toBe('validator');
            });
        });

        describe('AccumulatorTransformer', () => {
            it('should have correct name', () => {
                const accumulator = new AccumulatorTransformer();
                expect(accumulator.name).toBe('accumulator');
            });

            it('should accumulate chunks', async () => {
                const accumulator = new AccumulatorTransformer();

                await accumulator.transform({
                    id: 'a1', content: 'Hello', type: 'token', timestamp: new Date()
                });
                await accumulator.transform({
                    id: 'a2', content: ' World', type: 'token', timestamp: new Date()
                });

                const result = await accumulator.flush();
                expect(result).toBeDefined();
            });
        });
    });

    describe('Processing', () => {
        it('should process chunk through stages', async () => {
            pipeline.addStage(new TokenizerTransformer());
            pipeline.addStage(new AccumulatorTransformer());

            const chunk: StreamChunk = {
                id: 'process1',
                content: 'Test content',
                type: 'token',
                timestamp: new Date()
            };

            const results = await pipeline.process(chunk);
            expect(Array.isArray(results)).toBe(true);
        });

        it('should handle empty pipeline', async () => {
            const chunk: StreamChunk = {
                id: 'empty1',
                content: 'Test',
                type: 'token',
                timestamp: new Date()
            };

            const results = await pipeline.process(chunk);
            expect(results).toBeDefined();
        });

        it('should flush pipeline', async () => {
            pipeline.addStage(new AccumulatorTransformer());

            await pipeline.process({
                id: 'f1', content: 'Part 1', type: 'token', timestamp: new Date()
            });

            const flushed = await pipeline.flush();
            expect(Array.isArray(flushed)).toBe(true);
        });
    });

    describe('SSE Stream', () => {
        it('should create SSE stream', () => {
            const sse = pipeline.createSSEStream();

            expect(sse).toHaveProperty('write');
            expect(sse).toHaveProperty('end');
            expect(sse).toHaveProperty('onEvent');
            expect(typeof sse.write).toBe('function');
            expect(typeof sse.end).toBe('function');
        });

        it('should handle SSE events', (done) => {
            const sse = pipeline.createSSEStream();

            sse.onEvent((event) => {
                expect(event).toContain('data:');
                done();
            });

            sse.write('Test message');
        });
    });

    describe('Statistics', () => {
        it('should return stats', async () => {
            pipeline.addStage(new TokenizerTransformer());

            await pipeline.process({
                id: 's1', content: 'Test', type: 'token', timestamp: new Date()
            });

            const stats = pipeline.getStats();

            expect(stats).toHaveProperty('chunksProcessed');
            expect(stats).toHaveProperty('stageStats');
            expect(stats).toHaveProperty('avgLatency');
            expect(stats.chunksProcessed).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Events', () => {
        it('should emit chunk event', (done) => {
            pipeline.addStage(new TokenizerTransformer());

            pipeline.once('chunk', (chunk) => {
                expect(chunk).toBeDefined();
                done();
            });

            pipeline.process({
                id: 'e1', content: 'Event test', type: 'token', timestamp: new Date()
            });
        });
    });
});
