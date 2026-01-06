/**
 * TemporalContextEngine Tests
 */

import { TemporalContextEngine } from './TemporalContextEngine';

describe('TemporalContextEngine', () => {
    let engine: TemporalContextEngine;

    beforeEach(() => {
        engine = TemporalContextEngine.getInstance();
        engine.clearCache();
    });

    describe('singleton', () => {
        it('should return same instance', () => {
            const instance1 = TemporalContextEngine.getInstance();
            const instance2 = TemporalContextEngine.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('analyzeCodeArchaeology', () => {
        it('should return archaeology result', async () => {
            const result = await engine.analyzeCodeArchaeology('/test/file.ts');

            expect(result).toHaveProperty('filePath');
            expect(result).toHaveProperty('totalCommits');
            expect(result).toHaveProperty('changeFrequency');
        });
    });

    describe('loadGitHistory', () => {
        it('should load commits', async () => {
            const commits = [
                {
                    hash: 'abc123',
                    message: 'fix: bug fix',
                    author: 'dev@example.com',
                    timestamp: new Date().toISOString(),
                    files: ['file1.ts']
                }
            ];

            await engine.loadGitHistory(commits);
            const stats = engine.getStats();

            expect(stats.cachedCommits).toBeGreaterThan(0);
        });
    });

    describe('learnDeveloperPatterns', () => {
        it('should return developer pattern', async () => {
            const pattern = await engine.learnDeveloperPatterns('dev1');

            expect(pattern).toHaveProperty('timeOfDay');
            expect(pattern).toHaveProperty('commonPatterns');
            expect(pattern).toHaveProperty('debuggingStyle');
        });
    });

    describe('predictNextAction', () => {
        it('should return predictions array', async () => {
            const predictions = await engine.predictNextAction(
                'dev1',
                '/test/file.ts',
                ['edit', 'save']
            );

            expect(Array.isArray(predictions)).toBe(true);
        });
    });

    describe('configuration', () => {
        it('should update config', () => {
            engine.setConfig({ historyDepth: 200 });
            const config = engine.getConfig();
            expect(config.historyDepth).toBe(200);
        });
    });
});
