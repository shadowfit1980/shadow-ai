/**
 * DesktopAgent Tests
 */

import { DesktopAgent } from './DesktopAgent';

describe('DesktopAgent', () => {
    let agent: DesktopAgent;

    beforeEach(() => {
        agent = new DesktopAgent();
    });

    describe('initialization', () => {
        it('should have correct agent type', () => {
            expect(agent.agentType).toBe('DesktopAgent');
        });

        it('should have required capabilities', () => {
            const capabilityNames = agent.capabilities.map(c => c.name);
            expect(capabilityNames).toContain('native_api_generation');
            expect(capabilityNames).toContain('installer_creation');
            expect(capabilityNames).toContain('electron_development');
        });

        it('should have 7 capabilities', () => {
            expect(agent.capabilities).toHaveLength(7);
        });
    });

    describe('detectDesktopProject', () => {
        it('should detect Electron project', async () => {
            const task = {
                task: 'Create Electron app',
                spec: 'Build a cross-platform desktop app',
                context: { framework: 'electron' }
            };

            const project = await agent.detectDesktopProject(task);

            expect(project).toBeDefined();
            expect(project.framework).toBeDefined();
            expect(project.platform).toBeDefined();
        });
    });

    describe('analyzeCrossPlatform', () => {
        it('should return cross-platform analysis', async () => {
            const task = {
                task: 'Analyze cross-platform',
                spec: 'Check platform differences'
            };
            const project = {
                platform: 'cross-platform' as const,
                framework: 'electron' as const,
                targetVersions: ['Windows 10+', 'macOS 12+'],
                features: ['system-tray']
            };

            const analysis = await agent.analyzeCrossPlatform(task, project);

            expect(analysis).toHaveProperty('platformDifferences');
            expect(analysis).toHaveProperty('recommendations');
        });
    });

    describe('execute', () => {
        it('should return result with correct structure', async () => {
            const task = {
                task: 'Create native app',
                spec: 'Build a system tray application'
            };

            const result = await agent.execute(task);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('confidence');
        });
    });
});
