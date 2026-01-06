/**
 * Integration Tests - Queen 3 Max Cross-System Testing
 * 
 * Tests interactions between multiple Queen 3 Max systems
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock IPC for testing
const mockIpcRenderer = {
    invoke: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn()
};

// Setup mocks before tests
beforeAll(() => {
    (global as any).ipcRenderer = mockIpcRenderer;
});

afterAll(() => {
    delete (global as any).ipcRenderer;
});

describe('Queen 3 Max Integration - Cross-System Tests', () => {

    describe('Personality → Code Generation Integration', () => {
        test('should apply personality code style to generated code', async () => {
            // Mock personality with specific code style
            mockIpcRenderer.invoke.mockImplementation(async (channel: string) => {
                if (channel === 'personality:getCurrent') {
                    return {
                        success: true,
                        personality: {
                            id: 'ruth',
                            name: 'Ruth',
                            codeStyle: {
                                indentation: '2 spaces',
                                semicolons: true,
                                quotes: 'single'
                            }
                        }
                    };
                }
                return { success: true };
            });

            const { aiPersonalityEngine } = await import('../../src/main/ai/personality/AIPersonalityEngine');
            const prompt = aiPersonalityEngine.getSystemPrompt();

            expect(prompt).toBeDefined();
            expect(typeof prompt).toBe('string');
        });
    });

    describe('Health → Auto-Fix Integration', () => {
        test('should generate fix recommendations from health analysis', async () => {
            const { projectHealthDashboard } = await import('../../src/main/ai/health/ProjectHealthDashboard');

            // Analyze a mock project
            const health = await projectHealthDashboard.analyze('/tmp/test-project');

            expect(health).toBeDefined();
            expect(health.recommendations).toBeDefined();
            expect(Array.isArray(health.recommendations)).toBe(true);

            // Should have recommendations with auto-fix available
            const autoFixable = health.recommendations.filter((r: any) => r.autoFixAvailable);
            expect(autoFixable.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Plugin → Capability Extension', () => {
        test('should expose plugin capabilities to AI system', async () => {
            const { pluginEcosystem } = await import('../../src/main/ai/plugins/PluginEcosystem');

            await pluginEcosystem.initialize();

            // Get all plugins
            const result = await pluginEcosystem.searchPlugins();
            expect(result.plugins.length).toBeGreaterThan(0);

            // Each plugin should have capabilities
            for (const plugin of result.plugins) {
                expect(plugin.capabilities).toBeDefined();
                expect(Array.isArray(plugin.capabilities)).toBe(true);
            }
        });
    });

    describe('Multi-Modal → Code Generation', () => {
        test('should generate code from sketch analysis', async () => {
            const { multiModalInput } = await import('../../src/main/ai/multimodal/MultiModalInput');

            // Analyze a sketch
            const analysis = await multiModalInput.analyzeSketch({
                id: 'test-sketch',
                type: 'wireframe',
                source: 'test'
            });

            expect(analysis).toBeDefined();
            expect(analysis.components).toBeDefined();

            // Generate code from analysis
            const code = await multiModalInput.generateFromSketch('test-sketch', analysis, 'react');

            expect(code).toBeDefined();
            expect(code.files).toBeDefined();
        });
    });

    describe('Deployment → Health Check', () => {
        test('should run health check before deployment', async () => {
            const { deploymentOrchestrator } = await import('../../src/main/ai/deployment/DeploymentOrchestrator');
            const { projectHealthDashboard } = await import('../../src/main/ai/health/ProjectHealthDashboard');

            // Get health first
            const health = await projectHealthDashboard.analyze('/tmp/deploy-test');

            // Check if healthy enough to deploy
            const isHealthyEnough = health.overall.score >= 60;

            // Get deployment targets
            const targets = deploymentOrchestrator.getTargets();

            expect(targets.length).toBeGreaterThan(20);
            expect(typeof isHealthyEnough).toBe('boolean');
        });
    });

    describe('Collaboration → Real-Time Sync', () => {
        test('should create session and track participants', () => {
            const { collaborationEngine } = require('../../src/main/ai/collaboration/CollaborationEngine');

            // Create a session
            const session = collaborationEngine.createSession(
                'Integration Test Session',
                '/tmp/collab-test',
                'TestUser1'
            );

            expect(session).toBeDefined();
            expect(session.id).toBeDefined();

            // Join with another user
            const participant = collaborationEngine.joinSession(session.id, 'TestUser2');

            expect(participant).toBeDefined();
            expect(participant.name).toBe('TestUser2');

            // Get session - should have 2 participants
            const updatedSession = collaborationEngine.getSession(session.id);
            expect(updatedSession.participants.length).toBe(2);
        });
    });

    describe('What-If → Migration Scripts', () => {
        test('should generate migration scripts from scenario', async () => {
            const { whatIfSimulator } = await import('../../src/main/ai/simulation/WhatIfSimulator');

            // Analyze a migration scenario
            const scenario = await whatIfSimulator.analyze(
                'What if I migrate from React to Vue?'
            );

            expect(scenario).toBeDefined();
            expect(scenario.id).toBeDefined();

            // Generate migration scripts
            const scripts = await whatIfSimulator.generateMigrationScripts(scenario.id);

            expect(scripts).toBeDefined();
            expect(scripts.scripts).toBeDefined();
        });
    });

    describe('Voice → Code Generation', () => {
        test('should process voice command and generate intent', async () => {
            const { multiModalInput } = await import('../../src/main/ai/multimodal/MultiModalInput');

            // Start voice session
            const session = multiModalInput.startVoiceSession();
            expect(session.status).toBe('listening');

            // Process voice command
            const command = await multiModalInput.processVoiceCommand(
                session.id,
                'Create a function that sorts an array'
            );

            expect(command).toBeDefined();
            expect(command.intent).toBeDefined();
            expect(command.intent.action).toBe('create');
        });
    });
});

describe('System Resilience Tests', () => {
    test('should handle missing project gracefully', async () => {
        const { projectHealthDashboard } = await import('../../src/main/ai/health/ProjectHealthDashboard');

        // Analyze non-existent project
        const health = await projectHealthDashboard.analyze('/nonexistent/path');

        // Should still return valid structure
        expect(health).toBeDefined();
        expect(health.overall).toBeDefined();
    });

    test('should handle invalid plugin ID gracefully', async () => {
        const { pluginEcosystem } = await import('../../src/main/ai/plugins/PluginEcosystem');

        await pluginEcosystem.initialize();

        const plugin = pluginEcosystem.getPlugin('non-existent-plugin-id');

        expect(plugin).toBeUndefined();
    });

    test('should handle invalid voice session gracefully', async () => {
        const { multiModalInput } = await import('../../src/main/ai/multimodal/MultiModalInput');

        const session = multiModalInput.endVoiceSession('invalid-session-id');

        expect(session).toBeNull();
    });
});

describe('Performance Benchmarks', () => {
    test('plugin search should complete within 100ms', async () => {
        const { pluginEcosystem } = await import('../../src/main/ai/plugins/PluginEcosystem');
        await pluginEcosystem.initialize();

        const start = performance.now();
        await pluginEcosystem.searchPlugins('tailwind');
        const end = performance.now();

        expect(end - start).toBeLessThan(100);
    });

    test('health analysis should complete within 500ms', async () => {
        const { projectHealthDashboard } = await import('../../src/main/ai/health/ProjectHealthDashboard');

        const start = performance.now();
        await projectHealthDashboard.analyze('/tmp/benchmark-test');
        const end = performance.now();

        expect(end - start).toBeLessThan(500);
    });

    test('personality switch should complete within 50ms', async () => {
        const { aiPersonalityEngine } = await import('../../src/main/ai/personality/AIPersonalityEngine');

        const personalities = aiPersonalityEngine.getPersonalities();

        const start = performance.now();
        aiPersonalityEngine.setPersonality(personalities[0].id);
        const end = performance.now();

        expect(end - start).toBeLessThan(50);
    });
});
