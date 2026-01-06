/**
 * E2E Test Suite for All Grok Features
 * Comprehensive end-to-end tests for major user flows
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock Electron
vi.mock('electron', () => ({
    ipcMain: { handle: vi.fn() },
    app: { getPath: () => '/mock/path' }
}));

// ============ E2E Tests for Core Features ============

describe('E2E: Gamification Flow', () => {
    it('should complete full gamification journey', async () => {
        const { GamificationEngine } = await import('../ai/gamification/GamificationEngine');
        const engine = GamificationEngine.getInstance();

        // Create player
        const player = engine.createPlayer('E2ETestUser');
        expect(player.level).toBe(1);
        expect(player.xp).toBe(0);

        // Award XP multiple times
        engine.awardXp(player.id, 100, 'First code');
        engine.awardXp(player.id, 200, 'Bug fix');
        engine.awardXp(player.id, 150, 'Test written');

        // Check XP accumulated
        const updated = engine.getPlayer(player.id);
        expect(updated?.xp).toBeGreaterThan(0);

        // Update stats
        engine.updateStat(player.id, 'linesWritten', 500);
        engine.updateStat(player.id, 'bugsFixed', 10);

        // Unlock achievement
        engine.unlockAchievement(player.id, 'first_line');

        // Complete challenge
        const challenges = engine.getChallenges();
        if (challenges.length > 0) {
            engine.completeChallenge(player.id, challenges[0].id, 120);
        }

        // Check leaderboard
        const leaderboard = engine.getLeaderboard('allTime');
        expect(leaderboard.entries.length).toBeGreaterThan(0);
    });
});

describe('E2E: Knowledge Graph Flow', () => {
    it('should build and query knowledge graph', async () => {
        const { KnowledgeGraphEngine } = await import('../ai/knowledge/KnowledgeGraphEngine');
        const engine = KnowledgeGraphEngine.getInstance();
        engine.clear();

        // Build a code relationship graph
        const classNode = engine.addNode({ label: 'UserService', type: 'class', properties: { methods: 5 } });
        const methodNode1 = engine.addNode({ label: 'createUser', type: 'function', properties: {} });
        const methodNode2 = engine.addNode({ label: 'deleteUser', type: 'function', properties: {} });
        const dbNode = engine.addNode({ label: 'Database', type: 'module', properties: {} });

        // Create relationships
        engine.addEdge(classNode.id, methodNode1.id, 'has_method');
        engine.addEdge(classNode.id, methodNode2.id, 'has_method');
        engine.addEdge(methodNode1.id, dbNode.id, 'uses');
        engine.addEdge(methodNode2.id, dbNode.id, 'uses');

        // Query graph
        const neighbors = engine.getNeighbors(classNode.id, 'outgoing');
        expect(neighbors.length).toBe(2);

        // Find path
        const path = engine.findShortestPath(classNode.id, dbNode.id);
        expect(path).toBeDefined();
        expect(path?.path.length).toBeGreaterThan(0);

        // Get stats
        const stats = engine.getStats();
        expect(stats.totalNodes).toBe(4);
        expect(stats.totalEdges).toBe(4);

        // Export
        const json = engine.exportToJSON();
        expect(json).toContain('UserService');
    });
});

describe('E2E: AI Personality Flow', () => {
    it('should customize and use AI personality', async () => {
        const { AIPersonalityEngine } = await import('../ai/personality/AIPersonalityEngine');
        const engine = AIPersonalityEngine.getInstance();

        // Get available personalities
        const personalities = engine.getPersonalities();
        expect(personalities.length).toBeGreaterThan(0);

        // Switch personality
        engine.setPersonality('friendly');
        const active = engine.getActivePersonality();
        expect(active.id).toBe('friendly');

        // Generate response
        const greeting = engine.generateResponse('taskStart');
        expect(greeting).toBeDefined();
        expect(typeof greeting).toBe('string');

        // Get code style
        const style = engine.getCodeStyle();
        expect(style.naming).toBeDefined();

        // Switch to another personality
        engine.setPersonality('mentor');
        const mentorGreeting = engine.generateResponse('taskStart');
        expect(mentorGreeting).toBeDefined();
    });
});

describe('E2E: Digital Twin Flow', () => {
    it('should create and test digital twin', async () => {
        const { DigitalTwinSimulator } = await import('../ai/simulation/DigitalTwinSimulator');
        const simulator = DigitalTwinSimulator.getInstance();

        // Create digital twin
        const twin = simulator.createTwin({
            name: 'E2ETestServer',
            type: 'server',
            sourceEnvironment: 'production'
        });
        expect(twin.state.status).toBe('healthy');

        // Sync from production
        simulator.syncFromProduction(twin.id);

        // Apply chaos engineering
        const actions = simulator.getChaosActions();
        expect(actions.length).toBeGreaterThan(0);

        simulator.injectChaos(twin.id, 'memory_spike');
        let updated = simulator.getTwin(twin.id);
        expect(updated?.state.memory).toBeGreaterThan(50);

        // Revert chaos
        simulator.revertChaos(twin.id, 'memory_spike');
        updated = simulator.getTwin(twin.id);
        expect(updated?.state.status).toBe('healthy');
    });
});

describe('E2E: Changelog Generation Flow', () => {
    it('should generate changelog from commits', async () => {
        const { ChangelogGenerator } = await import('../ai/changelog/ChangelogGenerator');
        const generator = ChangelogGenerator.getInstance();
        generator.clear();

        // Parse commits
        const commits = [
            { hash: 'abc1', author: 'dev', date: new Date(), message: 'feat: add user authentication', files: [] },
            { hash: 'abc2', author: 'dev', date: new Date(), message: 'fix: resolve login bug', files: [] },
            { hash: 'abc3', author: 'dev', date: new Date(), message: 'feat!: breaking change to API', files: [] },
            { hash: 'abc4', author: 'dev', date: new Date(), message: 'docs: update README', files: [] }
        ];

        const parsed = generator.parseCommits(commits);
        expect(parsed.length).toBe(4);

        // Create version
        generator.createVersion('1.0.0', parsed);

        // Generate changelog
        const changelog = generator.generateChangelog();
        expect(changelog).toContain('# Changelog');
        expect(changelog).toContain('1.0.0');
        expect(changelog).toContain('user authentication');

        // Suggest next version
        const suggestion = generator.suggestVersion('1.0.0');
        expect(suggestion.suggested).toBeDefined();
    });
});

describe('E2E: Collaboration Flow', () => {
    it('should handle real-time collaboration session', async () => {
        const { RealTimeCollaborationHub } = await import('../ai/collaboration/RealTimeCollaborationHub');
        const hub = RealTimeCollaborationHub.getInstance();

        // Create session
        const session = hub.createSession({
            name: 'E2E Test Session',
            hostId: 'host-1',
            hostName: 'Alice',
            documentPath: './test.ts',
            content: 'const x = 1;'
        });
        expect(session.participants.length).toBe(1);

        // Join session
        const joinResult = hub.joinSession(session.id, 'user-2', 'Bob');
        expect(joinResult.success).toBe(true);
        expect(hub.getSession(session.id)?.participants.length).toBe(2);

        // Apply operation
        const opResult = hub.applyOperation(session.id, 'host-1', {
            type: 'insert',
            userId: 'host-1',
            position: { line: 0, column: 14 },
            content: '\nconst y = 2;'
        });
        expect(opResult.success).toBe(true);
        expect(opResult.version).toBe(2);

        // Send chat message
        const msg = hub.sendChat(session.id, 'user-2', 'Bob', 'Hello!');
        expect(msg).toBeDefined();

        // Create checkpoint
        const checkpoint = hub.createCheckpoint(session.id, 'host-1', 'Before refactor');
        expect(checkpoint).toBeDefined();

        // Leave session
        hub.leaveSession(session.id, 'user-2');
        expect(hub.getSession(session.id)?.participants.length).toBe(1);

        // End session
        hub.endSession(session.id);
        expect(hub.getSession(session.id)?.status).toBe('ended');
    });
});

describe('E2E: Code Review Flow', () => {
    it('should complete automated code review', async () => {
        const { AICodeReviewer } = await import('../ai/review/AICodeReviewer');
        const reviewer = AICodeReviewer.getInstance();

        const code = `
            function processData(data) {
                var result = [];
                for (var i = 0; i < data.length; i++) {
                    if (data[i].active) {
                        console.log(data[i]);
                        result.push(data[i].name + " - " + data[i].value);
                    }
                }
                return result;
            }
        `;

        // Review code
        const review = reviewer.reviewCode(code, 'test.ts');

        expect(review.issues.length).toBeGreaterThan(0);
        expect(review.suggestions.length).toBeGreaterThan(0);
        expect(review.metrics).toBeDefined();
        expect(review.score).toBeDefined();
        expect(review.summary).toBeDefined();

        // Check specific issues found
        const hasVarWarning = review.issues.some(i => i.message.includes('var'));
        const hasConsoleWarning = review.issues.some(i => i.message.includes('console'));
        expect(hasVarWarning || hasConsoleWarning).toBe(true);
    });
});

describe('E2E: Budget Tracking Flow', () => {
    it('should track project budget end-to-end', async () => {
        const { ProjectBudgetTracker } = await import('../ai/budget/ProjectBudgetTracker');
        const tracker = ProjectBudgetTracker.getInstance();

        // Create budget
        const budget = tracker.createBudget({
            projectName: 'E2E Test Project',
            totalBudget: 100000,
            currency: 'USD',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
        });

        expect(budget.categories.length).toBeGreaterThan(0);

        // Add expenses
        const devCategory = budget.categories.find(c => c.name === 'Development');
        if (devCategory) {
            tracker.addExpense(budget.id, {
                categoryId: devCategory.id,
                description: 'Developer salary',
                amount: 5000,
                date: new Date(),
                type: 'labor',
                recurring: true,
                approved: true
            });
        }

        // Add resource allocation
        tracker.addAllocation(budget.id, {
            resource: 'dev-1',
            type: 'developer',
            hoursPerWeek: 40,
            hourlyRate: 75,
            startDate: new Date()
        });

        // Log time
        tracker.logTime(budget.id, {
            developerId: 'dev-1',
            date: new Date(),
            hours: 8,
            task: 'Feature development',
            billable: true
        });

        // Generate report
        const report = tracker.generateReport(budget.id);
        expect(report).toBeDefined();
        expect(report?.summary.totalBudget).toBe(100000);
        expect(report?.recommendations.length).toBeGreaterThan(0);
    });
});

describe('E2E: Predictive Analytics Flow', () => {
    it('should generate code predictions and forecasts', async () => {
        const { PredictiveAnalyticsEngine } = await import('../ai/analytics/PredictiveAnalyticsEngine');
        const engine = PredictiveAnalyticsEngine.getInstance();

        const complexCode = `
            function complexFunction(data) {
                for (let i = 0; i < data.length; i++) {
                    for (let j = 0; j < data[i].items.length; j++) {
                        if (data[i].items[j].active) {
                            if (data[i].items[j].type === 'special') {
                                doSomething(data[i].items[j]);
                            }
                        }
                    }
                }
                // TODO: Fix this later
                // HACK: temporary solution
            }
        `;

        // Predict bug risk
        const bugPrediction = engine.predictBugRisk(complexCode, 'complex.ts');
        expect(bugPrediction.type).toBe('bug');
        expect(bugPrediction.probability).toBeGreaterThan(0.5);
        expect(bugPrediction.recommendations.length).toBeGreaterThan(0);

        // Predict performance
        const perfPrediction = engine.predictPerformance(complexCode);
        expect(perfPrediction.type).toBe('performance');
        expect(perfPrediction.factors.length).toBeGreaterThan(0);

        // Generate forecast
        const forecast = engine.generateForecast('Test Project', '1month');
        expect(forecast.metrics).toBeDefined();
        expect(forecast.opportunities.length).toBeGreaterThan(0);
    });
});
