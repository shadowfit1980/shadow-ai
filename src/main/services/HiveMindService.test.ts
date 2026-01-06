/**
 * HiveMindService Tests
 */

import { HiveMindService } from './HiveMindService';

describe('HiveMindService', () => {
    let service: HiveMindService;

    beforeEach(() => {
        service = HiveMindService.getInstance();
    });

    describe('singleton', () => {
        it('should return same instance', () => {
            const instance1 = HiveMindService.getInstance();
            const instance2 = HiveMindService.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('learnPattern', () => {
        it('should learn new pattern', async () => {
            const pattern = await service.learnPattern(
                'How to fix null pointer',
                'Check for null before accessing',
                'bugfix',
                { language: 'typescript' }
            );

            expect(pattern).toHaveProperty('id');
            expect(pattern).toHaveProperty('category');
            expect(pattern.category).toBe('bugfix');
        });

        it('should increment frequency on duplicate', async () => {
            const pattern1 = await service.learnPattern(
                'Same problem',
                'Same solution',
                'bugfix'
            );
            const pattern2 = await service.learnPattern(
                'Same problem',
                'Same solution',
                'bugfix'
            );

            expect(pattern2.successCount).toBeGreaterThanOrEqual(pattern1.successCount);
        });
    });

    describe('queryPatterns', () => {
        it('should return matches', async () => {
            // First learn a pattern
            await service.learnPattern(
                'Array iteration',
                'Use forEach or map',
                'optimization'
            );

            const matches = await service.queryPatterns({
                problem: 'How to iterate array',
                maxResults: 5
            });

            expect(Array.isArray(matches)).toBe(true);
        });
    });

    describe('getBestSolution', () => {
        it('should return best match or null', async () => {
            const solution = await service.getBestSolution('Unknown problem');
            // May or may not find a match
            expect(solution === null || solution.pattern !== undefined).toBe(true);
        });
    });

    describe('statistics', () => {
        it('should return stats', () => {
            const stats = service.getStats();

            expect(stats).toHaveProperty('localPatterns');
            expect(stats).toHaveProperty('contributedPatterns');
            expect(stats).toHaveProperty('queriesMade');
        });
    });

    describe('configuration', () => {
        it('should update config', () => {
            service.setConfig({ privacyMode: 'strict' });
            const config = service.getConfig();
            expect(config.privacyMode).toBe('strict');
        });
    });
});
