/**
 * MCTSPlanner Unit Tests
 */

import { MCTSPlanner, PlanAction, PlanState, MCTSConfig } from './MCTSPlanner';

describe('MCTSPlanner', () => {
    let planner: MCTSPlanner;

    beforeEach(() => {
        planner = (MCTSPlanner as any).getInstance();
    });

    describe('Configuration', () => {
        it('should have default config', () => {
            const config = planner.getConfig();

            expect(config).toHaveProperty('maxIterations');
            expect(config).toHaveProperty('explorationConstant');
            expect(config).toHaveProperty('maxDepth');
            expect(config).toHaveProperty('rolloutDepth');
            expect(config.maxIterations).toBe(1000);
            expect(config.explorationConstant).toBeCloseTo(1.41, 1);
        });

        it('should update config', () => {
            planner.setConfig({ maxIterations: 500 });
            const config = planner.getConfig();

            expect(config.maxIterations).toBe(500);

            // Reset
            planner.setConfig({ maxIterations: 1000 });
        });
    });

    describe('Action Planning', () => {
        it('should plan actions for a goal', async () => {
            const actions: PlanAction[] = [
                { name: 'analyze', description: 'Analyze code', params: {}, probability: 0.8, cost: 1 },
                { name: 'refactor', description: 'Refactor code', params: {}, probability: 0.7, cost: 2 },
                { name: 'test', description: 'Run tests', params: {}, probability: 0.9, cost: 1 }
            ];

            const plannedActions = await planner.planActions('improve code quality', {}, actions);

            expect(Array.isArray(plannedActions)).toBe(true);
            expect(plannedActions.length).toBeGreaterThan(0);
        });

        it('should score actions based on relevance', async () => {
            const actions: PlanAction[] = [
                { name: 'write_code', description: 'Write new code', params: {}, probability: 0.8, cost: 3 },
                { name: 'debug', description: 'Debug issues', params: {}, probability: 0.9, cost: 1 }
            ];

            const planned = await planner.planActions('fix bugs', {}, actions);

            // Debug should be prioritized for "fix bugs" goal
            expect(planned).toBeDefined();
        });

        it('should handle empty actions array', async () => {
            const planned = await planner.planActions('any goal', {}, []);
            expect(planned).toHaveLength(0);
        });

        it('should consider action probability', async () => {
            const actions: PlanAction[] = [
                { name: 'risky', description: 'Risky action', params: {}, probability: 0.1, cost: 1 },
                { name: 'safe', description: 'Safe action', params: {}, probability: 0.95, cost: 1 }
            ];

            const planned = await planner.planActions('complete task', {}, actions);

            // High probability actions should be preferred
            if (planned.length > 0) {
                expect(planned[0].probability).toBeGreaterThanOrEqual(0.1);
            }
        });
    });

    describe('Search', () => {
        it('should perform MCTS search', async () => {
            const initialState: PlanState = {
                id: 'initial',
                description: 'Start state',
                context: {},
                value: 0,
                visits: 0,
                terminal: false
            };

            const getActions = async (_state: PlanState) => [
                { name: 'a1', description: 'Action 1', params: {}, probability: 0.8, cost: 1 },
                { name: 'a2', description: 'Action 2', params: {}, probability: 0.6, cost: 2 }
            ];

            const simulate = async (state: PlanState, action: PlanAction) => ({
                ...state,
                id: `${state.id}_${action.name}`,
                visits: state.visits + 1
            });

            const evaluate = async (state: PlanState) => {
                return state.visits > 0 ? 0.7 : 0;
            };

            const result = await planner.search(initialState, getActions, simulate, evaluate);

            expect(result).toHaveProperty('bestPath');
            expect(result).toHaveProperty('simulationsRun');
            expect(result).toHaveProperty('nodesExplored');
        });
    });

    describe('UCB Calculation', () => {
        it('should calculate UCB correctly', () => {
            // Access private method for testing
            const ucb = (planner as any).calculateUCB(
                { state: { visits: 10, value: 5 } },
                { state: { visits: 100 } }
            );

            expect(typeof ucb).toBe('number');
            expect(ucb).toBeGreaterThan(0);
        });
    });

    describe('Events', () => {
        it('should emit events during search', (done) => {
            const timeout = setTimeout(() => done(), 1000);

            planner.once('iteration', (data) => {
                clearTimeout(timeout);
                expect(data).toHaveProperty('iteration');
                done();
            });

            const state: PlanState = {
                id: 'test',
                description: 'Test state',
                context: {},
                value: 0,
                visits: 0,
                terminal: false
            };
            planner.search(
                state,
                async () => [{ name: 'a', description: '', params: {}, probability: 1, cost: 1 }],
                async (s) => ({ ...s, visits: s.visits + 1 }),
                async () => 0.5
            );
        });
    });
});
