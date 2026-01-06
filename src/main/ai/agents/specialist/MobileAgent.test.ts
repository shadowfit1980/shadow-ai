/**
 * MobileAgent Tests
 */

import { MobileAgent } from './MobileAgent';

describe('MobileAgent', () => {
    let agent: MobileAgent;

    beforeEach(() => {
        agent = new MobileAgent();
    });

    describe('initialization', () => {
        it('should have correct agent type', () => {
            expect(agent.agentType).toBe('MobileAgent');
        });

        it('should have required capabilities', () => {
            const capabilityNames = agent.capabilities.map(c => c.name);
            expect(capabilityNames).toContain('mobile_platform_detection');
            expect(capabilityNames).toContain('cross_platform_code_gen');
            expect(capabilityNames).toContain('app_store_optimization');
        });

        it('should have 6 capabilities', () => {
            expect(agent.capabilities).toHaveLength(6);
        });
    });

    describe('detectPlatform', () => {
        it('should detect platform from task context', async () => {
            const task = {
                task: 'Create React Native app',
                spec: 'Build a mobile app using React Native',
                context: { framework: 'react-native' }
            };

            const platform = await agent.detectPlatform(task);

            expect(platform).toBeDefined();
            expect(platform.type).toBeDefined();
            expect(platform.name).toBeDefined();
        });
    });

    describe('execute', () => {
        it('should return result with correct structure', async () => {
            const task = {
                task: 'Create login screen',
                spec: 'Build a mobile login screen with email and password'
            };

            const result = await agent.execute(task);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('confidence');
            expect(result).toHaveProperty('explanation');
        });

        it('should fail for empty spec', async () => {
            const task = {
                task: 'Test',
                spec: ''
            };

            const result = await agent.execute(task);
            expect(result.success).toBe(false);
        });
    });
});
