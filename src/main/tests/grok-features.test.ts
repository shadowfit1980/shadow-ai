/**
 * Comprehensive Integration Tests for Grok Recommendation Features
 * Tests for all newly implemented AI modules
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Electron
vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn()
    }
}));

// ============ GamificationEngine Tests ============
describe('GamificationEngine', () => {
    let gamificationEngine: ReturnType<typeof import('../ai/gamification/GamificationEngine').GamificationEngine.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/gamification/GamificationEngine');
        gamificationEngine = module.GamificationEngine.getInstance();
    });

    describe('Player Management', () => {
        it('should create a new player with default values', () => {
            const player = gamificationEngine.createPlayer('TestUser');

            expect(player).toBeDefined();
            expect(player.username).toBe('TestUser');
            expect(player.level).toBe(1);
            expect(player.xp).toBe(0);
            expect(player.rank).toBeDefined();
        });

        it('should award XP and track level ups', () => {
            const player = gamificationEngine.createPlayer('XPTestUser');
            const result = gamificationEngine.awardXp(player.id, 500, 'Test XP');

            expect(result.newXp).toBeGreaterThan(0);
        });

        it('should update player stats', () => {
            const player = gamificationEngine.createPlayer('StatsUser');
            gamificationEngine.updateStat(player.id, 'linesWritten', 100);

            const updatedPlayer = gamificationEngine.getPlayer(player.id);
            expect(updatedPlayer?.stats.linesWritten).toBe(100);
        });
    });

    describe('Achievements', () => {
        it('should have predefined achievements', () => {
            const achievements = gamificationEngine.getAchievements();
            expect(achievements.length).toBeGreaterThan(0);
        });

        it('should unlock achievement when conditions are met', () => {
            const player = gamificationEngine.createPlayer('AchievementUser');
            const success = gamificationEngine.unlockAchievement(player.id, 'first_line');

            expect(success).toBe(true);
            const updatedPlayer = gamificationEngine.getPlayer(player.id);
            expect(updatedPlayer?.achievements.length).toBeGreaterThan(0);
        });
    });

    describe('Challenges', () => {
        it('should return available challenges', () => {
            const challenges = gamificationEngine.getChallenges();
            expect(challenges.length).toBeGreaterThan(0);
        });

        it('should complete a challenge and award XP', () => {
            const player = gamificationEngine.createPlayer('ChallengeUser');
            const challenges = gamificationEngine.getChallenges('beginner');

            if (challenges.length > 0) {
                const result = gamificationEngine.completeChallenge(player.id, challenges[0].id, 300);
                expect(result.success).toBe(true);
                expect(result.xpEarned).toBeGreaterThan(0);
            }
        });
    });

    describe('Leaderboard', () => {
        it('should return leaderboard entries', () => {
            gamificationEngine.createPlayer('LeaderUser1');
            gamificationEngine.createPlayer('LeaderUser2');

            const leaderboard = gamificationEngine.getLeaderboard('allTime');
            expect(leaderboard.entries).toBeDefined();
            expect(leaderboard.period).toBe('allTime');
        });
    });
});

// ============ DigitalTwinSimulator Tests ============
describe('DigitalTwinSimulator', () => {
    let digitalTwinSimulator: ReturnType<typeof import('../ai/simulation/DigitalTwinSimulator').DigitalTwinSimulator.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/simulation/DigitalTwinSimulator');
        digitalTwinSimulator = module.DigitalTwinSimulator.getInstance();
    });

    describe('Twin Creation', () => {
        it('should create a digital twin', () => {
            const twin = digitalTwinSimulator.createTwin({
                name: 'TestServer',
                type: 'server',
                sourceEnvironment: 'production'
            });

            expect(twin).toBeDefined();
            expect(twin.name).toBe('TestServer');
            expect(twin.state.status).toBe('healthy');
        });

        it('should sync twin from production', () => {
            const twin = digitalTwinSimulator.createTwin({
                name: 'SyncServer',
                type: 'server',
                sourceEnvironment: 'production'
            });

            const result = digitalTwinSimulator.syncFromProduction(twin.id);
            expect(result.success).toBe(true);
        });
    });

    describe('Chaos Engineering', () => {
        it('should list available chaos actions', () => {
            const actions = digitalTwinSimulator.getChaosActions();
            expect(actions.length).toBeGreaterThan(0);
        });

        it('should inject chaos into a twin', () => {
            const twin = digitalTwinSimulator.createTwin({
                name: 'ChaosServer',
                type: 'server',
                sourceEnvironment: 'staging'
            });

            const success = digitalTwinSimulator.injectChaos(twin.id, 'cpu_spike');
            expect(success).toBe(true);

            const updatedTwin = digitalTwinSimulator.getTwin(twin.id);
            expect(updatedTwin?.state.cpu).toBe(100);
        });

        it('should revert chaos', () => {
            const twin = digitalTwinSimulator.createTwin({
                name: 'RevertServer',
                type: 'server',
                sourceEnvironment: 'staging'
            });

            digitalTwinSimulator.injectChaos(twin.id, 'cpu_spike');
            const success = digitalTwinSimulator.revertChaos(twin.id, 'cpu_spike');

            expect(success).toBe(true);
            const updatedTwin = digitalTwinSimulator.getTwin(twin.id);
            expect(updatedTwin?.state.status).toBe('healthy');
        });
    });
});

// ============ KnowledgeGraphEngine Tests ============
describe('KnowledgeGraphEngine', () => {
    let knowledgeGraphEngine: ReturnType<typeof import('../ai/knowledge/KnowledgeGraphEngine').KnowledgeGraphEngine.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/knowledge/KnowledgeGraphEngine');
        knowledgeGraphEngine = module.KnowledgeGraphEngine.getInstance();
        knowledgeGraphEngine.clear();
    });

    describe('Node Management', () => {
        it('should add a node', () => {
            const node = knowledgeGraphEngine.addNode({
                label: 'TestNode',
                type: 'concept',
                properties: {}
            });

            expect(node).toBeDefined();
            expect(node.label).toBe('TestNode');
        });

        it('should find a node by label', () => {
            knowledgeGraphEngine.addNode({
                label: 'FindableNode',
                type: 'function',
                properties: {}
            });

            const found = knowledgeGraphEngine.findNode('FindableNode');
            expect(found).toBeDefined();
            expect(found?.label).toBe('FindableNode');
        });
    });

    describe('Edge Management', () => {
        it('should add an edge between nodes', () => {
            const node1 = knowledgeGraphEngine.addNode({ label: 'Node1', type: 'class', properties: {} });
            const node2 = knowledgeGraphEngine.addNode({ label: 'Node2', type: 'function', properties: {} });

            const edge = knowledgeGraphEngine.addEdge(node1.id, node2.id, 'contains');
            expect(edge).toBeDefined();
            expect(edge?.relationship).toBe('contains');
        });

        it('should get neighbors of a node', () => {
            const node1 = knowledgeGraphEngine.addNode({ label: 'Parent', type: 'class', properties: {} });
            const node2 = knowledgeGraphEngine.addNode({ label: 'Child', type: 'function', properties: {} });
            knowledgeGraphEngine.addEdge(node1.id, node2.id, 'has_method');

            const neighbors = knowledgeGraphEngine.getNeighbors(node1.id, 'outgoing');
            expect(neighbors.length).toBe(1);
            expect(neighbors[0].label).toBe('Child');
        });
    });

    describe('Graph Algorithms', () => {
        it('should find shortest path', () => {
            const a = knowledgeGraphEngine.addNode({ label: 'A', type: 'concept', properties: {} });
            const b = knowledgeGraphEngine.addNode({ label: 'B', type: 'concept', properties: {} });
            const c = knowledgeGraphEngine.addNode({ label: 'C', type: 'concept', properties: {} });

            knowledgeGraphEngine.addEdge(a.id, b.id, 'connects');
            knowledgeGraphEngine.addEdge(b.id, c.id, 'connects');

            const path = knowledgeGraphEngine.findShortestPath(a.id, c.id);
            expect(path).toBeDefined();
            expect(path?.path.length).toBe(3);
        });

        it('should compute graph stats', () => {
            knowledgeGraphEngine.addNode({ label: 'N1', type: 'class', properties: {} });
            knowledgeGraphEngine.addNode({ label: 'N2', type: 'function', properties: {} });

            const stats = knowledgeGraphEngine.getStats();
            expect(stats.totalNodes).toBe(2);
        });
    });

    describe('Import/Export', () => {
        it('should export to JSON', () => {
            knowledgeGraphEngine.addNode({ label: 'ExportNode', type: 'concept', properties: {} });

            const json = knowledgeGraphEngine.exportToJSON();
            expect(json).toContain('ExportNode');
        });

        it('should import from JSON', () => {
            const json = JSON.stringify({
                nodes: [{ id: 'test-id', label: 'ImportNode', type: 'concept', properties: {}, createdAt: new Date(), updatedAt: new Date() }],
                edges: []
            });

            const result = knowledgeGraphEngine.importFromJSON(json);
            expect(result.nodesImported).toBe(1);
        });
    });
});

// ============ AIPersonalityEngine Tests ============
describe('AIPersonalityEngine', () => {
    let aiPersonalityEngine: ReturnType<typeof import('../ai/personality/AIPersonalityEngine').AIPersonalityEngine.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/personality/AIPersonalityEngine');
        aiPersonalityEngine = module.AIPersonalityEngine.getInstance();
    });

    describe('Personality Management', () => {
        it('should have multiple personalities', () => {
            const personalities = aiPersonalityEngine.getPersonalities();
            expect(personalities.length).toBeGreaterThan(0);
        });

        it('should set active personality', () => {
            const success = aiPersonalityEngine.setPersonality('friendly');
            expect(success).toBe(true);

            const active = aiPersonalityEngine.getActivePersonality();
            expect(active.id).toBe('friendly');
        });

        it('should get active personality', () => {
            const active = aiPersonalityEngine.getActivePersonality();
            expect(active).toBeDefined();
            expect(active.name).toBeDefined();
        });
    });

    describe('Response Generation', () => {
        it('should generate task start response', () => {
            const response = aiPersonalityEngine.generateResponse('taskStart');
            expect(response).toBeDefined();
            expect(typeof response).toBe('string');
        });

        it('should generate celebration response', () => {
            const response = aiPersonalityEngine.generateResponse('celebration');
            expect(response).toBeDefined();
        });
    });

    describe('Code Style', () => {
        it('should return code style preferences', () => {
            const style = aiPersonalityEngine.getCodeStyle();
            expect(style).toBeDefined();
            expect(style.naming).toBeDefined();
            expect(style.comments).toBeDefined();
        });
    });
});

// ============ CodeSentimentAnalyzer Tests ============
describe('CodeSentimentAnalyzer', () => {
    let codeSentimentAnalyzer: ReturnType<typeof import('../ai/sentiment/CodeSentimentAnalyzer').CodeSentimentAnalyzer.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/sentiment/CodeSentimentAnalyzer');
        codeSentimentAnalyzer = module.CodeSentimentAnalyzer.getInstance();
        codeSentimentAnalyzer.clearHistory();
    });

    describe('Text Analysis', () => {
        it('should detect positive sentiment', () => {
            const result = codeSentimentAnalyzer.analyzeText('This is great! Amazing work! 🎉');
            expect(result.sentiment).toBe('positive');
            expect(result.score).toBeGreaterThan(0);
        });

        it('should detect negative sentiment', () => {
            const result = codeSentimentAnalyzer.analyzeText('This is terrible! Why does this suck so much?');
            expect(['negative', 'frustrated']).toContain(result.sentiment);
            expect(result.score).toBeLessThan(0);
        });

        it('should detect neutral sentiment', () => {
            const result = codeSentimentAnalyzer.analyzeText('Initialize the variable');
            expect(result.sentiment).toBe('neutral');
        });
    });

    describe('File Analysis', () => {
        it('should analyze code comments', () => {
            const code = `
                // This is great code!
                function example() {
                    // TODO: Fix this terrible hack
                    return 42;
                }
            `;

            const results = codeSentimentAnalyzer.analyzeFile('test.ts', code);
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Health Report', () => {
        it('should generate health report', () => {
            const files = [
                { path: 'file1.ts', content: '// TODO: Fix this\n// HACK: temporary solution' },
                { path: 'file2.ts', content: '// Great implementation!\n// Works perfectly' }
            ];

            const report = codeSentimentAnalyzer.generateHealthReport(files);
            expect(report).toBeDefined();
            expect(report.frustrationIndicators).toBeDefined();
            expect(report.recommendations).toBeDefined();
        });
    });
});

// ============ APIDocumentationGenerator Tests ============
describe('APIDocumentationGenerator', () => {
    let apiDocumentationGenerator: ReturnType<typeof import('../ai/documentation/APIDocumentationGenerator').APIDocumentationGenerator.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/documentation/APIDocumentationGenerator');
        apiDocumentationGenerator = module.APIDocumentationGenerator.getInstance();
    });

    describe('Documentation Creation', () => {
        it('should create documentation', () => {
            const doc = apiDocumentationGenerator.createDocumentation({
                title: 'Test API',
                version: '1.0.0',
                description: 'Test description',
                baseUrl: 'https://api.example.com'
            });

            expect(doc).toBeDefined();
            expect(doc.title).toBe('Test API');
        });
    });

    describe('Code Parsing', () => {
        it('should parse Express routes', () => {
            const code = `
                app.get('/users', handler);
                app.post('/users', createHandler);
                app.get('/users/:id', getHandler);
            `;

            const parsed = apiDocumentationGenerator.parseCode(code, 'express');
            expect(parsed.endpoints.length).toBe(3);
        });

        it('should parse TypeScript interfaces', () => {
            const code = `
                interface User {
                    id: string;
                    name: string;
                    email?: string;
                }
            `;

            const parsed = apiDocumentationGenerator.parseCode(code, 'express');
            expect(parsed.schemas['User']).toBeDefined();
        });
    });

    describe('Export Formats', () => {
        it('should generate OpenAPI spec', () => {
            const doc = apiDocumentationGenerator.createDocumentation({
                title: 'Export Test',
                version: '1.0.0',
                description: 'Test',
                baseUrl: 'https://api.test.com'
            });

            const openapi = apiDocumentationGenerator.generateOpenAPI(doc.id);
            expect(openapi).toHaveProperty('openapi');
            expect(openapi).toHaveProperty('info');
        });

        it('should generate Markdown', () => {
            const doc = apiDocumentationGenerator.createDocumentation({
                title: 'MD Test',
                version: '1.0.0',
                description: 'Test',
                baseUrl: 'https://api.test.com'
            });

            const markdown = apiDocumentationGenerator.generateMarkdown(doc.id);
            expect(markdown).toContain('# MD Test');
        });
    });
});

// ============ DependencyVulnerabilityScanner Tests ============
describe('DependencyVulnerabilityScanner', () => {
    let scanner: ReturnType<typeof import('../ai/security/DependencyVulnerabilityScanner').DependencyVulnerabilityScanner.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/security/DependencyVulnerabilityScanner');
        scanner = module.DependencyVulnerabilityScanner.getInstance();
    });

    describe('Package Scanning', () => {
        it('should scan package.json', async () => {
            const packageJson = {
                name: 'test-project',
                dependencies: {
                    'lodash': '4.17.15',
                    'express': '4.17.1'
                }
            };

            const result = await scanner.scanPackageJson(packageJson);
            expect(result).toBeDefined();
            expect(result.totalDependencies).toBe(2);
        });

        it('should detect known vulnerabilities', async () => {
            const packageJson = {
                name: 'vulnerable-project',
                dependencies: {
                    'lodash': '4.17.0' // Known vulnerable version
                }
            };

            const result = await scanner.scanPackageJson(packageJson);
            expect(result.vulnerabilities.length).toBeGreaterThan(0);
        });
    });

    describe('Report Generation', () => {
        it('should generate markdown report', async () => {
            const packageJson = { name: 'report-test', dependencies: { 'lodash': '4.17.0' } };
            const scan = await scanner.scanPackageJson(packageJson);

            const report = scanner.generateReport(scan.id, 'markdown');
            expect(report).toContain('# Security Scan Report');
        });

        it('should calculate security score', async () => {
            const packageJson = { name: 'score-test', dependencies: {} };
            const result = await scanner.scanPackageJson(packageJson);

            expect(result.summary.score).toBe(100); // No vulnerabilities = 100
        });
    });

    describe('Database Stats', () => {
        it('should return database statistics', () => {
            const stats = scanner.getDatabaseStats();
            expect(stats.packages).toBeGreaterThan(0);
            expect(stats.vulnerabilities).toBeGreaterThan(0);
        });
    });
});

// ============ ChangelogGenerator Tests ============
describe('ChangelogGenerator', () => {
    let changelogGenerator: ReturnType<typeof import('../ai/changelog/ChangelogGenerator').ChangelogGenerator.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/changelog/ChangelogGenerator');
        changelogGenerator = module.ChangelogGenerator.getInstance();
        changelogGenerator.clear();
    });

    describe('Commit Parsing', () => {
        it('should parse conventional commits', () => {
            const commits = [
                { hash: 'abc123', author: 'dev', date: new Date(), message: 'feat: add new feature', files: [] },
                { hash: 'def456', author: 'dev', date: new Date(), message: 'fix: resolve bug', files: [] },
                { hash: 'ghi789', author: 'dev', date: new Date(), message: 'feat!: breaking change', files: [] }
            ];

            const parsed = changelogGenerator.parseCommits(commits);
            expect(parsed.length).toBe(3);
            expect(parsed[0].type).toBe('feat');
            expect(parsed[1].type).toBe('fix');
            expect(parsed[2].isBreaking).toBe(true);
        });
    });

    describe('Version Management', () => {
        it('should create a version', () => {
            const commits = changelogGenerator.parseCommits([
                { hash: 'a1', author: 'dev', date: new Date(), message: 'feat: feature 1', files: [] }
            ]);

            const version = changelogGenerator.createVersion('1.0.0', commits);
            expect(version.version).toBe('1.0.0');
            expect(version.features.length).toBe(1);
        });

        it('should suggest next version', () => {
            changelogGenerator.parseCommits([
                { hash: 'b1', author: 'dev', date: new Date(), message: 'feat!: breaking', files: [] }
            ]);

            const suggestion = changelogGenerator.suggestVersion('1.0.0');
            expect(suggestion.suggested).toBe('2.0.0');
            expect(suggestion.reason).toContain('Breaking');
        });
    });

    describe('Changelog Generation', () => {
        it('should generate markdown changelog', () => {
            const commits = changelogGenerator.parseCommits([
                { hash: 'c1', author: 'dev', date: new Date(), message: 'feat: new feature', files: [] }
            ]);
            changelogGenerator.createVersion('1.0.0', commits);

            const changelog = changelogGenerator.generateChangelog();
            expect(changelog).toContain('# Changelog');
            expect(changelog).toContain('1.0.0');
        });
    });
});
