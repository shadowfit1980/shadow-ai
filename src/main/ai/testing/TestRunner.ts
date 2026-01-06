/**
 * TestRunner - Executes tests and collects results
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
    TestFramework,
    TestSuite,
    CoverageReport,
    UncoveredArea
} from './types';

const execAsync = promisify(exec);

export interface TestRunResult {
    framework: TestFramework;
    passed: number;
    failed: number;
    total: number;
    duration: number;
    coverage?: CoverageReport;
    output: string;
    success: boolean;
}

export class TestRunner {
    private projectRoot: string;

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
    }

    /**
     * Run tests for a specific framework
     */
    async runTests(framework: TestFramework, options?: {
        coverage?: boolean;
        files?: string[];
        watch?: boolean;
    }): Promise<TestRunResult> {
        console.log(`\n🧪 Running ${framework} tests...`);

        const startTime = Date.now();

        try {
            const command = this.buildCommand(framework, options);
            console.log(`   Command: ${command}`);

            const { stdout, stderr } = await execAsync(command, {
                cwd: this.projectRoot,
                maxBuffer: 10 * 1024 * 1024 // 10MB
            });

            const output = stdout + stderr;
            const result = this.parseOutput(framework, output);

            let coverage: CoverageReport | undefined;
            if (options?.coverage) {
                coverage = await this.parseCoverageReport(framework);
            }

            const duration = Date.now() - startTime;

            console.log(`✅ Tests complete: ${result.passed}/${result.total} passed`);
            if (coverage) {
                console.log(`📊 Coverage: ${coverage.percentage.toFixed(1)}%`);
            }

            return {
                framework,
                passed: result.passed,
                failed: result.failed,
                total: result.total,
                duration,
                coverage,
                output,
                success: result.failed === 0
            };

        } catch (error: any) {
            const duration = Date.now() - startTime;

            console.error(`❌ Test run failed:`, error.message);

            return {
                framework,
                passed: 0,
                failed: 0,
                total: 0,
                duration,
                output: error.message,
                success: false
            };
        }
    }

    /**
     * Run all tests across all frameworks
     */
    async runAllTests(options?: { coverage?: boolean }): Promise<TestRunResult[]> {
        const results: TestRunResult[] = [];

        // Detect which frameworks are being used
        const frameworks = await this.detectFrameworks();

        console.log(`\n🎯 Running tests for ${frameworks.length} frameworks\n`);

        for (const framework of frameworks) {
            const result = await this.runTests(framework, options);
            results.push(result);
        }

        // Print summary
        this.printSummary(results);

        return results;
    }

    /**
     * Build test command for framework
     */
    private buildCommand(framework: TestFramework, options?: any): string {
        const parts: string[] = [];

        switch (framework) {
            case TestFramework.Jest:
                parts.push('npm run test');
                if (options?.coverage) {
                    parts.push('--', '--coverage');
                }
                if (options?.files) {
                    parts.push(...options.files);
                }
                break;

            case TestFramework.Mocha:
                parts.push('npx mocha');
                if (options?.files) {
                    parts.push(...options.files);
                } else {
                    parts.push('"**/*.test.js"');
                }
                break;

            case TestFramework.Pytest:
                parts.push('pytest');
                if (options?.coverage) {
                    parts.push('--cov');
                }
                if (options?.files) {
                    parts.push(...options.files);
                }
                break;

            default:
                throw new Error(`Unsupported framework: ${framework}`);
        }

        return parts.join(' ');
    }

    /**
     * Parse test output
     */
    private parseOutput(framework: TestFramework, output: string): {
        passed: number;
        failed: number;
        total: number;
    } {
        switch (framework) {
            case TestFramework.Jest:
                return this.parseJestOutput(output);
            case TestFramework.Mocha:
                return this.parseMochaOutput(output);
            case TestFramework.Pytest:
                return this.parsePytestOutput(output);
            default:
                return { passed: 0, failed: 0, total: 0 };
        }
    }

    private parseJestOutput(output: string): { passed: number; failed: number; total: number } {
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);

        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;

        return {
            passed,
            failed,
            total: passed + failed
        };
    }

    private parseMochaOutput(output: string): { passed: number; failed: number; total: number } {
        const passedMatch = output.match(/(\d+) passing/);
        const failedMatch = output.match(/(\d+) failing/);

        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;

        return {
            passed,
            failed,
            total: passed + failed
        };
    }

    private parsePytestOutput(output: string): { passed: number; failed: number; total: number } {
        const match = output.match(/(\d+) passed(?:, (\d+) failed)?/);

        if (match) {
            const passed = parseInt(match[1]);
            const failed = match[2] ? parseInt(match[2]) : 0;

            return {
                passed,
                failed,
                total: passed + failed
            };
        }

        return { passed: 0, failed: 0, total: 0 };
    }

    /**
     * Parse coverage report
     */
    private async parseCoverageReport(framework: TestFramework): Promise<CoverageReport | undefined> {
        try {
            let coveragePath: string;

            switch (framework) {
                case TestFramework.Jest:
                    coveragePath = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');
                    break;
                case TestFramework.Pytest:
                    coveragePath = path.join(this.projectRoot, '.coverage');
                    break;
                default:
                    return undefined;
            }

            const exists = await fs.access(coveragePath).then(() => true).catch(() => false);
            if (!exists) {
                return undefined;
            }

            if (framework === TestFramework.Jest) {
                const content = await fs.readFile(coveragePath, 'utf-8');
                const data = JSON.parse(content);

                const total = data.total;

                return {
                    totalLines: total.lines.total,
                    coveredLines: total.lines.covered,
                    totalFunctions: total.functions.total,
                    coveredFunctions: total.functions.covered,
                    totalBranches: total.branches.total,
                    coveredBranches: total.branches.covered,
                    percentage: total.lines.pct,
                    uncoveredAreas: [],
                    suggestions: []
                };
            }

            return undefined;

        } catch (error) {
            console.warn('⚠️  Could not parse coverage report:', error);
            return undefined;
        }
    }

    /**
     * Detect which test frameworks are being used
     */
    private async detectFrameworks(): Promise<TestFramework[]> {
        const frameworks: TestFramework[] = [];

        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(content);

            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            if (deps.jest || packageJson.scripts?.test?.includes('jest')) {
                frameworks.push(TestFramework.Jest);
            }

            if (deps.mocha) {
                frameworks.push(TestFramework.Mocha);
            }

            // Check for Python
            const hasPytestConfig = await fs.access(path.join(this.projectRoot, 'pytest.ini'))
                .then(() => true)
                .catch(() => false);

            if (hasPytestConfig) {
                frameworks.push(TestFramework.Pytest);
            }

        } catch (error) {
            console.warn('⚠️  Could not detect frameworks:', error);
        }

        return frameworks;
    }

    /**
     * Print test summary
     */
    private printSummary(results: TestRunResult[]): void {
        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║   Test Summary                                     ║');
        console.log('╚════════════════════════════════════════════════════╝\n');

        let totalPassed = 0;
        let totalFailed = 0;
        let totalTests = 0;

        results.forEach(result => {
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalTests += result.total;

            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${result.framework}: ${result.passed}/${result.total} passed`);

            if (result.coverage) {
                console.log(`   Coverage: ${result.coverage.percentage.toFixed(1)}%`);
            }
        });

        console.log(`\nTotal: ${totalPassed}/${totalTests} tests passed`);

        if (totalFailed > 0) {
            console.log(`❌ ${totalFailed} tests failed\n`);
        } else {
            console.log(`✅ All tests passed! 🎉\n`);
        }
    }
}
