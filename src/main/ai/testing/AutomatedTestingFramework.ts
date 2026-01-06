/**
 * AutomatedTestingFramework - Main entry point for testing system
 */

import { EventEmitter } from 'events';
import { TestGenerator } from './TestGenerator';
import { TestRunner, TestRunResult } from './TestRunner';
import {
    TestFramework,
    TestSuite,
    TestGenerationOptions,
    CoverageReport
} from './types';

export class AutomatedTestingFramework extends EventEmitter {
    private static instance: AutomatedTestingFramework;

    private testGenerator = TestGenerator.getInstance();
    private testRunner: TestRunner;

    private constructor() {
        super();
        this.testRunner = new TestRunner();
        console.log('🧪 Automated Testing Framework initialized');
    }

    static getInstance(): AutomatedTestingFramework {
        if (!AutomatedTestingFramework.instance) {
            AutomatedTestingFramework.instance = new AutomatedTestingFramework();
        }
        return AutomatedTestingFramework.instance;
    }

    /**
     * Generate tests for code
     */
    async generateTests(
        code: string,
        options: TestGenerationOptions = {
            includeEdgeCases: true,
            includeMocks: true,
            coverageTarget: 80,
            generateFixtures: false,
            testStyle: 'unit'
        }
    ): Promise<TestSuite> {
        console.log('\n🔬 Generating tests...');

        this.emit('generation_start', options);

        try {
            const suite = await this.testGenerator.generateTestsFromCode(code, options);

            this.emit('generation_complete', suite);

            console.log(`✅ Generated ${suite.testCases.length} tests`);

            return suite;

        } catch (error: any) {
            console.error('❌ Test generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Run tests
     */
    async runTests(framework?: TestFramework, options?: {
        coverage?: boolean;
        files?: string[];
    }): Promise<TestRunResult | TestRunResult[]> {
        this.emit('test_run_start', framework);

        try {
            let results: TestRunResult | TestRunResult[];

            if (framework) {
                results = await this.testRunner.runTests(framework, options);
            } else {
                results = await this.testRunner.runAllTests(options);
            }

            this.emit('test_run_complete', results);

            return results;

        } catch (error: any) {
            console.error('❌ Test run failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate and run tests in one go
     */
    async generateAndRun(
        code: string,
        options?: TestGenerationOptions
    ): Promise<{
        suite: TestSuite;
        results: TestRunResult;
    }> {
        console.log('\n🚀 Generate and run tests...\n');

        // Generate tests
        const suite = await this.generateTests(code, options);

        // Write test file (simplified for now)
        // In production, would write to actual file system

        // Run tests
        const results = await this.runTests(suite.framework, {
            coverage: true
        }) as TestRunResult;

        return {
            suite,
            results
        };
    }

    /**
     * Get coverage report
     */
    async getCoverage(framework: TestFramework): Promise<CoverageReport | undefined> {
        const results = await this.runTests(framework, { coverage: true }) as TestRunResult;
        return results.coverage;
    }

    /**
     * Analyze test quality
     */
    async analyzeTests(suite: TestSuite): Promise<{
        quality: number;
        suggestions: string[];
    }> {
        // Placeholder for test quality analysis
        const quality = suite.testCases.length > 0 ? 0.8 : 0;

        const suggestions: string[] = [];

        if (suite.testCases.length === 0) {
            suggestions.push('Add test cases');
        }

        if (!suite.mocks || suite.mocks.length === 0) {
            suggestions.push('Consider adding mocks for dependencies');
        }

        return {
            quality,
            suggestions
        };
    }
}

/**
 * Get singleton instance
 */
export function getTestingFramework(): AutomatedTestingFramework {
    return AutomatedTestingFramework.getInstance();
}
