import { BaseTool, defineParameter } from '../BaseTool';
import { ToolExecutionContext, ToolExecutionResult } from '../types';
import { getTestGenerator } from '../../testing/TestGenerator';
import { getSecurityScanner } from '../../security/SecurityScanner';

/**
 * Tool to generate tests for a file
 */
export class GenerateTestsTool extends BaseTool {
    constructor() {
        super({
            name: 'generate_tests',
            description: 'Automatically generate comprehensive tests for a code file',
            category: 'analysis',
            parameters: [
                defineParameter('filePath', 'string', 'Path to the file to generate tests for'),
                defineParameter('framework', 'string', 'Test framework to use', false, {
                    enum: ['jest', 'pytest', 'mocha', 'junit'],
                }),
                defineParameter('includeEdgeCases', 'boolean', 'Include edge case tests', false, {
                    default: true,
                }),
                defineParameter('coverageTarget', 'number', 'Target coverage percentage', false, {
                    default: 80,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Generated test suite with test cases',
            },
            examples: [
                {
                    input: {
                        filePath: './src/utils/helper.ts',
                        framework: 'jest',
                        includeEdgeCases: true,
                    },
                    output: {
                        name: 'helper',
                        testCases: [],
                        filePath: './src/utils/helper.test.ts',
                    },
                    description: 'Generate Jest tests for a utility file',
                },
            ],
            tags: ['testing', 'automation', 'quality'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const generator = getTestGenerator();
            const testSuite = await generator.generateTests(params.filePath, {
                framework: params.framework,
                includeEdgeCases: params.includeEdgeCases !== false,
                coverageTarget: params.coverageTarget || 80,
                includeMocks: true,
                generateFixtures: false,
                testStyle: 'unit',
            });

            // Generate test file content
            const testFileContent = await generator.generateTestFile(testSuite);

            return this.createSuccessResult(
                {
                    testSuite,
                    testFileContent,
                    testFilePath: testSuite.filePath,
                },
                Date.now() - startTime
            );
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}

/**
 * Tool to scan for security vulnerabilities
 */
export class ScanSecurityTool extends BaseTool {
    constructor() {
        super({
            name: 'scan_security',
            description: 'Scan code for security vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.)',
            category: 'analysis',
            parameters: [
                defineParameter('path', 'string', 'File or directory path to scan'),
                defineParameter('recursive', 'boolean', 'Scan directories recursively', false, {
                    default: true,
                }),
            ],
            returns: {
                type: 'object',
                description: 'Security vulnerability report',
            },
            examples: [
                {
                    input: {
                        path: './src',
                        recursive: true,
                    },
                    output: {
                        totalIssues: 5,
                        criticalCount: 2,
                        issues: [],
                    },
                    description: 'Scan a directory for security issues',
                },
            ],
            tags: ['security', 'vulnerability', 'owasp'],
        });
    }

    async execute(
        params: Record<string, any>,
        context?: ToolExecutionContext
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        try {
            const scanner = getSecurityScanner();
            const path = params.path as string;

            // Check if it's a file or directory
            const fs = require('fs/promises');
            const stats = await fs.stat(path);

            let report;
            if (stats.isDirectory() && params.recursive !== false) {
                report = await scanner.scanDirectory(path);
            } else {
                const issues = await scanner.scanFile(path);
                report = {
                    scannedFiles: 1,
                    totalIssues: issues.length,
                    criticalCount: issues.filter((i: any) => i.severity === 'critical').length,
                    highCount: issues.filter((i: any) => i.severity === 'high').length,
                    mediumCount: issues.filter((i: any) => i.severity === 'medium').length,
                    lowCount: issues.filter((i: any) => i.severity === 'low').length,
                    issues,
                    summary: issues.length === 0 ? 'No issues found' : `Found ${issues.length} issues`,
                    scanDuration: Date.now() - startTime,
                };
            }

            return this.createSuccessResult(report, Date.now() - startTime);
        } catch (error: any) {
            return this.createErrorResult(error, Date.now() - startTime);
        }
    }
}
