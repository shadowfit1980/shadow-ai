/**
 * GameAgent Tests
 */

import { GameAgent } from './GameAgent';

describe('GameAgent', () => {
    let agent: GameAgent;

    beforeEach(() => {
        agent = new GameAgent();
    });

    describe('initialization', () => {
        it('should have correct agent type', () => {
            expect(agent.agentType).toBe('GameAgent');
        });

        it('should have required capabilities', () => {
            const capabilityNames = agent.capabilities.map(c => c.name);
            expect(capabilityNames).toContain('game_engine_detection');
            expect(capabilityNames).toContain('procedural_generation');
            expect(capabilityNames).toContain('multiplayer_architecture');
        });

        it('should have 8 capabilities', () => {
            expect(agent.capabilities).toHaveLength(8);
        });
    });

    describe('detectGameProject', () => {
        it('should detect Unity project', async () => {
            const task = {
                task: 'Create Unity game',
                spec: 'Build a 3D platformer in Unity',
                context: { engine: 'unity' }
            };

            const project = await agent.detectGameProject(task);

            expect(project).toBeDefined();
            expect(project.engine).toBeDefined();
            expect(project.targetPlatforms).toBeDefined();
        });
    });

    describe('designArchitecture', () => {
        it('should return architecture with patterns', async () => {
            const task = {
                task: 'Design game architecture',
                spec: 'Create ECS-based game system'
            };
            const project = {
                engine: 'unity' as const,
                targetPlatforms: ['PC'],
                hasMultiplayer: false
            };

            const architecture = await agent.designArchitecture(task, project);

            expect(architecture).toHaveProperty('patterns');
            expect(architecture).toHaveProperty('components');
            expect(architecture).toHaveProperty('systems');
        });
    });

    describe('execute', () => {
        it('should return result with artifacts', async () => {
            const task = {
                task: 'Create player controller',
                spec: 'Build a third-person character controller'
            };

            const result = await agent.execute(task);

            expect(result).toHaveProperty('success');
            expect(result).toHaveProperty('confidence');
        });
    });
});
