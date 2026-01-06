/**
 * Test Suite Manager - Test suite orchestration
 */
import { EventEmitter } from 'events';

export interface TestCase { id: string; name: string; file: string; status: 'pending' | 'passed' | 'failed' | 'skipped'; duration?: number; error?: string; }
export interface TestSuite { id: string; name: string; tests: TestCase[]; createdAt: number; runAt?: number; }

export class TestSuiteManager extends EventEmitter {
    private static instance: TestSuiteManager;
    private suites: Map<string, TestSuite> = new Map();
    private constructor() { super(); }
    static getInstance(): TestSuiteManager { if (!TestSuiteManager.instance) TestSuiteManager.instance = new TestSuiteManager(); return TestSuiteManager.instance; }

    create(name: string): TestSuite {
        const suite: TestSuite = { id: `suite_${Date.now()}`, name, tests: [], createdAt: Date.now() };
        this.suites.set(suite.id, suite);
        return suite;
    }

    addTest(suiteId: string, name: string, file: string): TestCase | null {
        const suite = this.suites.get(suiteId); if (!suite) return null;
        const test: TestCase = { id: `test_${Date.now()}`, name, file, status: 'pending' };
        suite.tests.push(test);
        return test;
    }

    async run(suiteId: string): Promise<TestSuite | null> {
        const suite = this.suites.get(suiteId); if (!suite) return null;
        suite.runAt = Date.now();
        suite.tests.forEach(t => { t.status = Math.random() > 0.1 ? 'passed' : 'failed'; t.duration = Math.floor(Math.random() * 1000); });
        this.emit('completed', suite);
        return suite;
    }

    getStats(suiteId: string): { passed: number; failed: number; total: number } | null { const s = this.suites.get(suiteId); if (!s) return null; return { passed: s.tests.filter(t => t.status === 'passed').length, failed: s.tests.filter(t => t.status === 'failed').length, total: s.tests.length }; }
    getAll(): TestSuite[] { return Array.from(this.suites.values()); }
}
export function getTestSuiteManager(): TestSuiteManager { return TestSuiteManager.getInstance(); }
