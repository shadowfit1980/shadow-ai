/**
 * 🧪 Game Test Runner
 * 
 * Automated testing for generated games:
 * - Syntax validation
 * - Build verification
 * - Smoke tests
 * - Performance benchmarks
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
}

export interface TestSuite {
    projectPath: string;
    results: TestResult[];
    passed: number;
    failed: number;
    totalTime: number;
}

export class GameTestRunner extends EventEmitter {
    private static instance: GameTestRunner;

    private constructor() { super(); }

    static getInstance(): GameTestRunner {
        if (!GameTestRunner.instance) {
            GameTestRunner.instance = new GameTestRunner();
        }
        return GameTestRunner.instance;
    }

    async runTests(projectPath: string): Promise<TestSuite> {
        const results: TestResult[] = [];
        const startTime = Date.now();

        this.emit('testStart', { projectPath });

        // Test 1: TypeScript compilation
        results.push(await this.runTest('TypeScript Compilation', async () => {
            await execAsync('npx tsc --noEmit', { cwd: projectPath });
        }));

        // Test 2: Vite build
        results.push(await this.runTest('Vite Build', async () => {
            await execAsync('npm run build', { cwd: projectPath });
        }));

        // Test 3: Check required files
        results.push(await this.runTest('Required Files', async () => {
            const fs = require('fs');
            const path = require('path');
            const required = ['package.json', 'index.html', 'src/main.ts'];

            for (const file of required) {
                const exists = fs.existsSync(path.join(projectPath, file));
                if (!exists) throw new Error(`Missing: ${file}`);
            }
        }));

        // Test 4: Package.json valid
        results.push(await this.runTest('Package.json Valid', async () => {
            const fs = require('fs');
            const path = require('path');
            const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));

            if (!pkg.name) throw new Error('Missing name');
            if (!pkg.scripts?.dev) throw new Error('Missing dev script');
        }));

        const suite: TestSuite = {
            projectPath,
            results,
            passed: results.filter(r => r.passed).length,
            failed: results.filter(r => !r.passed).length,
            totalTime: Date.now() - startTime
        };

        this.emit('testComplete', suite);
        return suite;
    }

    private async runTest(name: string, fn: () => Promise<void>): Promise<TestResult> {
        const start = Date.now();
        try {
            await fn();
            return { name, passed: true, duration: Date.now() - start };
        } catch (error: any) {
            return { name, passed: false, duration: Date.now() - start, error: error.message };
        }
    }

    generateTestCode(): string {
        return `
// Game Test Framework
class GameTester {
    constructor(game) {
        this.game = game;
        this.tests = [];
        this.results = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🧪 Running game tests...');
        
        for (const test of this.tests) {
            const start = performance.now();
            try {
                await test.fn();
                this.results.push({
                    name: test.name,
                    passed: true,
                    time: performance.now() - start
                });
                console.log(\`✅ \${test.name}\`);
            } catch (error) {
                this.results.push({
                    name: test.name,
                    passed: false,
                    error: error.message,
                    time: performance.now() - start
                });
                console.log(\`❌ \${test.name}: \${error.message}\`);
            }
        }

        const passed = this.results.filter(r => r.passed).length;
        console.log(\`\\n📊 Results: \${passed}/\${this.tests.length} passed\`);
        return this.results;
    }

    // Built-in test helpers
    assert(condition, message = 'Assertion failed') {
        if (!condition) throw new Error(message);
    }

    assertEqual(a, b, message) {
        this.assert(a === b, message || \`Expected \${a} to equal \${b}\`);
    }

    assertExists(obj, message = 'Object does not exist') {
        this.assert(obj !== null && obj !== undefined, message);
    }
}

// Usage
const tester = new GameTester(game);

tester.test('Player spawns correctly', () => {
    tester.assertExists(game.player);
    tester.assertEqual(game.player.health, 100);
});

tester.test('Controls respond', async () => {
    const startX = game.player.x;
    game.simulateInput('right', 100);
    await game.wait(100);
    tester.assert(game.player.x > startX, 'Player should move right');
});

tester.run();
`;
    }
}

export const gameTestRunner = GameTestRunner.getInstance();
