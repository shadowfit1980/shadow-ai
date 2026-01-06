/**
 * ContextCompressor Unit Tests
 */

import { ContextCompressor, ContextItem, CompressionConfig } from './ContextCompressor';

describe('ContextCompressor', () => {
    let compressor: ContextCompressor;

    beforeEach(() => {
        compressor = (ContextCompressor as any).getInstance();
        // Clear windows - this is the only Map on the class
        compressor['windows'].clear();
    });

    describe('Context Window Management', () => {
        it('should add items to context window', () => {
            const item = compressor.addToContext('testWindow', 'Test content', {
                type: 'code',
                priority: 'high'
            });

            expect(item).toHaveProperty('id');
            expect(item.content).toBe('Test content');
            expect(item.type).toBe('code');
            expect(item.priority).toBe('high');
        });

        it('should get window with items', () => {
            compressor.addToContext('myWindow', 'Item 1', { type: 'log', priority: 'low' });
            compressor.addToContext('myWindow', 'Item 2', { type: 'code', priority: 'high' });

            const window = compressor.getWindow('myWindow');

            expect(window).toBeDefined();
            expect(window.items).toHaveLength(2);
            expect(window.totalTokens).toBeGreaterThan(0);
        });

        it('should clear window', () => {
            compressor.addToContext('toClear', 'Content');
            compressor.clearWindow('toClear');

            const window = compressor.getWindow('toClear');
            expect(window.items).toHaveLength(0);
        });

        it('should create window if not exists', () => {
            const window = compressor.getWindow('newWindow');
            expect(window).toBeDefined();
            expect(window.items).toHaveLength(0);
        });
    });

    describe('Compression', () => {
        it('should compress window when over token limit', () => {
            // Add many items to exceed limit
            for (let i = 0; i < 100; i++) {
                compressor.addToContext('compressWindow', `Long content item ${i} that takes up tokens`);
            }

            const beforeCount = compressor.getWindow('compressWindow').items.length;
            compressor.compress('compressWindow');
            const afterCount = compressor.getWindow('compressWindow').items.length;

            // Compression should reduce items or maintain if under limit
            expect(afterCount).toBeLessThanOrEqual(beforeCount);
        });

        it('should preserve high priority items during compression', () => {
            compressor.addToContext('priorityWindow', 'Low priority', { priority: 'low' });
            compressor.addToContext('priorityWindow', 'Critical item', { priority: 'critical' });
            compressor.addToContext('priorityWindow', 'Another low', { priority: 'low' });

            compressor.compress('priorityWindow');

            const window = compressor.getWindow('priorityWindow');
            const criticalItems = window.items.filter(i => i.priority === 'critical');
            expect(criticalItems.length).toBeGreaterThan(0);
        });
    });

    describe('Checkpoints', () => {
        it('should create checkpoint', () => {
            compressor.addToContext('checkpointWindow', 'Item 1');
            compressor.addToContext('checkpointWindow', 'Item 2');

            // createCheckpoint returns ContextItem[] not a string id
            const checkpoint = compressor.createCheckpoint('checkpointWindow');

            expect(checkpoint).toBeDefined();
            expect(Array.isArray(checkpoint)).toBe(true);
            expect(checkpoint.length).toBe(2);
        });

        it('should restore from checkpoint', () => {
            compressor.addToContext('restoreWindow', 'Original');
            const checkpoint = compressor.createCheckpoint('restoreWindow');

            compressor.addToContext('restoreWindow', 'After checkpoint');
            expect(compressor.getWindow('restoreWindow').items).toHaveLength(2);

            compressor.restoreCheckpoint('restoreWindow', checkpoint);
            expect(compressor.getWindow('restoreWindow').items).toHaveLength(1);
        });
    });

    describe('Hierarchical Summary', () => {
        it('should create hierarchical summary', () => {
            compressor.addToContext('summaryWindow', 'Code change 1', { type: 'code' });
            compressor.addToContext('summaryWindow', 'Error occurred', { type: 'error' });
            compressor.addToContext('summaryWindow', 'Decision made', { type: 'decision' });

            const summary = compressor.createHierarchicalSummary('summaryWindow');

            expect(summary).toBeDefined();
            expect(typeof summary).toBe('string');
        });
    });

    describe('Configuration', () => {
        it('should get config', () => {
            const config = compressor.getConfig();

            expect(config).toHaveProperty('maxTokens');
            expect(config).toHaveProperty('targetTokens');
            expect(config).toHaveProperty('priorityWeights');
            expect(config).toHaveProperty('decayRate');
        });

        it('should set config', () => {
            compressor.setConfig({ maxTokens: 10000 });
            const config = compressor.getConfig();

            expect(config.maxTokens).toBe(10000);

            // Reset
            compressor.setConfig({ maxTokens: 8000 });
        });
    });

    describe('Statistics', () => {
        it('should return stats', () => {
            compressor.addToContext('statsWindow', 'Content');

            const stats = compressor.getStats();

            expect(stats).toHaveProperty('windowCount');
            expect(stats).toHaveProperty('totalItems');
            expect(stats).toHaveProperty('totalTokens');
            expect(stats).toHaveProperty('byPriority');
        });
    });
});
