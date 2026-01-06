/**
 * Test Runner Engine
 * Execute and manage test suites
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';

export interface TestResult {
    id: string;
    name: string;
    suite: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending';
    duration: number;
    error?: string;
    stack?: string;
}

export interface TestSuiteResult {
    id: string;
    name: string;
    file: string;
    tests: TestResult[];
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    startTime: number;
    endTime?: number;
}

export interface TestRunResult {
    id: string;
    framework: string;
    suites: TestSuiteResult[];
    totalPassed: number;
    totalFailed: number;
    totalSkipped: number;
    totalDuration: number;
    coverage?: CoverageResult;
    status: 'running' | 'completed' | 'failed';
}

export interface CoverageResult {
    lines: { covered: number; total: number; percentage: number };
    functions: { covered: number; total: number; percentage: number };
    branches: { covered: number; total: number; percentage: number };
    statements: { covered: number; total: number; percentage: number };
}

/**
 * TestRunnerEngine
 * Run tests across different frameworks
 */
export class TestRunnerEngine extends EventEmitter {
    private static instance: TestRunnerEngine;
    private runs: Map<string, TestRunResult> = new Map();
    private activeProcess: any = null;

    private constructor() {
        super();
    }

    static getInstance(): TestRunnerEngine {
        if (!TestRunnerEngine.instance) {
            TestRunnerEngine.instance = new TestRunnerEngine();
        }
        return TestRunnerEngine.instance;
    }

    /**
     * Run tests
     */
    async runTests(options: {
        cwd: string;
        framework?: 'jest' | 'mocha' | 'vitest' | 'pytest' | 'auto';
        pattern?: string;
        coverage?: boolean;
        watch?: boolean;
    }): Promise<TestRunResult> {
        const runId = `run_${Date.now()}`;
        const framework = options.framework || 'auto';
        const detectedFramework = framework === 'auto' ? await this.detectFramework(options.cwd) : framework;

        const result: TestRunResult = {
            id: runId,
            framework: detectedFramework,
            suites: [],
            totalPassed: 0,
            totalFailed: 0,
            totalSkipped: 0,
            totalDuration: 0,
            status: 'running',
        };

        this.runs.set(runId, result);
        this.emit('runStarted', result);

        try {
            const command = this.buildCommand(detectedFramework, options);
            const output = await this.executeCommand(command.cmd, command.args, options.cwd);

            // Parse results based on framework
            const parsed = this.parseOutput(detectedFramework, output);
            Object.assign(result, parsed);

            result.status = 'completed';
            this.emit('runCompleted', result);
        } catch (error: any) {
            result.status = 'failed';
            this.emit('runFailed', { runId, error: error.message });
        }

        return result;
    }

    /**
     * Detect test framework
     */
    private async detectFramework(cwd: string): Promise<string> {
        try {
            const { readFile } = await import('fs/promises');
            const { join } = await import('path');

            const pkgPath = join(cwd, 'package.json');
            const pkg = JSON.parse(await readFile(pkgPath, 'utf-8'));

            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps['vitest']) return 'vitest';
            if (deps['jest']) return 'jest';
            if (deps['mocha']) return 'mocha';
        } catch {
            // Not a Node.js project
        }

        // Check for Python
        try {
            const { access } = await import('fs/promises');
            const { join } = await import('path');

            await access(join(cwd, 'pytest.ini'));
            return 'pytest';
        } catch {
            // Not pytest
        }

        return 'jest'; // Default
    }

    /**
     * Build test command
     */
    private buildCommand(framework: string, options: any): { cmd: string; args: string[] } {
        const args: string[] = [];

        switch (framework) {
            case 'jest':
                args.push('--json');
                if (options.coverage) args.push('--coverage');
                if (options.pattern) args.push(options.pattern);
                return { cmd: 'npx', args: ['jest', ...args] };

            case 'vitest':
                args.push('run', '--reporter=json');
                if (options.coverage) args.push('--coverage');
                if (options.pattern) args.push(options.pattern);
                return { cmd: 'npx', args: ['vitest', ...args] };

            case 'mocha':
                args.push('--reporter', 'json');
                if (options.pattern) args.push(options.pattern);
                return { cmd: 'npx', args: ['mocha', ...args] };

            case 'pytest':
                args.push('--json-report', '--json-report-file=-');
                if (options.coverage) args.push('--cov');
                if (options.pattern) args.push(options.pattern);
                return { cmd: 'python', args: ['-m', 'pytest', ...args] };

            default:
                return { cmd: 'npm', args: ['test'] };
        }
    }

    /**
     * Execute command
     */
    private executeCommand(cmd: string, args: string[], cwd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let output = '';
            let errorOutput = '';

            const proc = spawn(cmd, args, { cwd, shell: true });
            this.activeProcess = proc;

            proc.stdout.on('data', (data) => {
                output += data.toString();
                this.emit('output', data.toString());
            });

            proc.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            proc.on('close', (code) => {
                this.activeProcess = null;
                // Tests completed (even with failures)
                resolve(output || errorOutput);
            });

            proc.on('error', (err) => {
                this.activeProcess = null;
                reject(err);
            });
        });
    }

    /**
     * Parse test output
     */
    private parseOutput(framework: string, output: string): Partial<TestRunResult> {
        try {
            // Try to parse JSON output
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const json = JSON.parse(jsonMatch[0]);
                return this.parseJestOutput(json);
            }
        } catch {
            // Fallback to text parsing
        }

        // Simple text parsing
        const passed = (output.match(/(\d+)\s*(?:passing|passed)/i)?.[1] || '0');
        const failed = (output.match(/(\d+)\s*(?:failing|failed)/i)?.[1] || '0');
        const skipped = (output.match(/(\d+)\s*(?:skipped|pending)/i)?.[1] || '0');

        return {
            totalPassed: parseInt(passed),
            totalFailed: parseInt(failed),
            totalSkipped: parseInt(skipped),
            suites: [],
        };
    }

    /**
     * Parse Jest output
     */
    private parseJestOutput(json: any): Partial<TestRunResult> {
        const suites: TestSuiteResult[] = [];

        for (const testResult of json.testResults || []) {
            const suite: TestSuiteResult = {
                id: `suite_${Date.now()}`,
                name: testResult.name || 'Unknown',
                file: testResult.name,
                tests: [],
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: testResult.endTime - testResult.startTime,
                startTime: testResult.startTime,
                endTime: testResult.endTime,
            };

            for (const assertion of testResult.assertionResults || []) {
                const test: TestResult = {
                    id: `test_${Date.now()}`,
                    name: assertion.title,
                    suite: assertion.ancestorTitles?.join(' > ') || '',
                    status: assertion.status,
                    duration: assertion.duration || 0,
                    error: assertion.failureMessages?.join('\n'),
                };

                suite.tests.push(test);
                if (test.status === 'passed') suite.passed++;
                else if (test.status === 'failed') suite.failed++;
                else suite.skipped++;
            }

            suites.push(suite);
        }

        return {
            totalPassed: json.numPassedTests || 0,
            totalFailed: json.numFailedTests || 0,
            totalSkipped: json.numPendingTests || 0,
            totalDuration: json.testResults?.reduce((acc: number, t: any) =>
                acc + (t.endTime - t.startTime), 0) || 0,
            suites,
        };
    }

    /**
     * Stop running tests
     */
    stopTests(): boolean {
        if (this.activeProcess) {
            this.activeProcess.kill('SIGTERM');
            this.activeProcess = null;
            return true;
        }
        return false;
    }

    /**
     * Get run result
     */
    getRun(runId: string): TestRunResult | null {
        return this.runs.get(runId) || null;
    }

    /**
     * Get all runs
     */
    getAllRuns(): TestRunResult[] {
        return Array.from(this.runs.values());
    }

    /**
     * Generate test report
     */
    generateReport(result: TestRunResult): string {
        const lines = [
            `# Test Report: ${result.framework}`,
            '',
            `## Summary`,
            `- Passed: ${result.totalPassed}`,
            `- Failed: ${result.totalFailed}`,
            `- Skipped: ${result.totalSkipped}`,
            `- Duration: ${result.totalDuration}ms`,
            '',
        ];

        if (result.suites.length > 0) {
            lines.push('## Suites');
            for (const suite of result.suites) {
                lines.push(`### ${suite.name}`);
                lines.push(`✅ ${suite.passed} passed | ❌ ${suite.failed} failed`);
            }
        }

        return lines.join('\n');
    }
}

// Singleton getter
export function getTestRunnerEngine(): TestRunnerEngine {
    return TestRunnerEngine.getInstance();
}
