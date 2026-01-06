/**
 * ToolChainExecutor Unit Tests
 */

import { ToolChainExecutor, ChainStep, ChainResult } from './ToolChainExecutor';

describe('ToolChainExecutor', () => {
    let executor: ToolChainExecutor;

    beforeEach(() => {
        // Get singleton instance
        executor = (ToolChainExecutor as any).getInstance();
        // Clear any existing chains
        executor['chains'].clear();
        executor['executionHistory'] = [];
    });

    describe('Chain Creation', () => {
        it('should create a chain with valid steps', () => {
            const steps: ChainStep[] = [
                { toolName: 'readFile', params: { path: './test.txt' } },
                { toolName: 'analyzeCode', params: {}, inputMapping: { content: 'step_0' } }
            ];

            const chain = executor.createChain('testChain', steps, {
                description: 'Test chain description'
            });

            expect(chain).toBeDefined();
            expect(chain.id).toContain('chain_');
            expect(chain.name).toBe('testChain');
            expect(chain.steps).toHaveLength(2);
            expect(chain.description).toBe('Test chain description');
        });

        it('should store chain for later retrieval', () => {
            const steps: ChainStep[] = [
                { toolName: 'test', params: {} }
            ];

            const chain = executor.createChain('storedChain', steps);
            const retrieved = executor.getChain(chain.id);

            expect(retrieved).toBeDefined();
            expect(retrieved?.name).toBe('storedChain');
        });

        it('should list all chains', () => {
            executor.createChain('chain1', [{ toolName: 'a', params: {} }]);
            executor.createChain('chain2', [{ toolName: 'b', params: {} }]);

            const chains = executor.listChains();
            expect(chains).toHaveLength(2);
        });

        it('should delete a chain', () => {
            const chain = executor.createChain('toDelete', [{ toolName: 'x', params: {} }]);

            const deleted = executor.deleteChain(chain.id);
            expect(deleted).toBe(true);
            expect(executor.getChain(chain.id)).toBeUndefined();
        });
    });

    describe('Middleware', () => {
        it('should add and remove middleware', () => {
            const middleware = {
                name: 'testMiddleware',
                beforeStep: async (step: ChainStep) => step,
            };

            executor.addMiddleware(middleware);
            expect(executor['middleware']).toContainEqual(middleware);

            const removed = executor.removeMiddleware('testMiddleware');
            expect(removed).toBe(true);
            expect(executor['middleware']).not.toContainEqual(middleware);
        });

        it('should return false when removing non-existent middleware', () => {
            const removed = executor.removeMiddleware('nonExistent');
            expect(removed).toBe(false);
        });
    });

    describe('Statistics', () => {
        it('should return correct stats', () => {
            executor.createChain('statsChain', [{ toolName: 't', params: {} }]);

            const stats = executor.getStats();

            expect(stats).toHaveProperty('totalExecutions');
            expect(stats).toHaveProperty('successRate');
            expect(stats).toHaveProperty('averageDuration');
            expect(stats).toHaveProperty('chainCount');
            expect(stats.chainCount).toBe(1);
        });

        it('should clear history', () => {
            executor['executionHistory'].push({} as ChainResult);
            executor.clearHistory();

            expect(executor.getHistory()).toHaveLength(0);
        });
    });

    describe('Events', () => {
        it('should emit chainCreated event', (done) => {
            executor.once('chainCreated', (chain) => {
                expect(chain.name).toBe('eventChain');
                done();
            });

            executor.createChain('eventChain', [{ toolName: 'e', params: {} }]);
        });

        it('should emit chainDeleted event', (done) => {
            const chain = executor.createChain('toEmit', [{ toolName: 'f', params: {} }]);

            executor.once('chainDeleted', (chainId) => {
                expect(chainId).toBe(chain.id);
                done();
            });

            executor.deleteChain(chain.id);
        });
    });
});
