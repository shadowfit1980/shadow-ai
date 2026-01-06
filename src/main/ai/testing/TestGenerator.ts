import * as fs from 'fs/promises';
import * as path from 'path';
import { ModelManager } from '../ModelManager';
import {
    TestSuite,
    TestCase,
    TestFramework,
    TestGenerationOptions,
    MockDefinition,
} from './types';

/**
 * Test Generator
 * Automatically generates comprehensive tests for code
 */
export class TestGenerator {
    private static instance: TestGenerator;
    private modelManager: ModelManager;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): TestGenerator {
        if (!TestGenerator.instance) {
            TestGenerator.instance = new TestGenerator();
        }
        return TestGenerator.instance;
    }

    /**
     * Generate tests for a file
     */
    async generateTests(
        filePath: string,
        options: Partial<TestGenerationOptions> = {}
    ): Promise<TestSuite> {
        const defaultOptions: TestGenerationOptions = {
            framework: this.detectFramework(filePath),
            includeEdgeCases: true,
            includeMocks: true,
            coverageTarget: 80,
            generateFixtures: false,
            testStyle: 'unit',
        };

        const opts = { ...defaultOptions, ...options };

        // Read source file
        const sourceCode = await fs.readFile(filePath, 'utf-8');

        // Analyze code structure
        const analysis = this.analyzeCode(sourceCode);

        // Generate test cases using AI
        const testCases = await this.generateTestCases(
            sourceCode,
            analysis,
            opts
        );

        // Generate mocks if needed
        const mocks = opts.includeMocks
            ? await this.generateMocks(analysis, opts.framework!)
            : [];

        // Build test suite
        const testSuite: TestSuite = {
            name: this.getTestSuiteName(filePath),
            framework: opts.framework!,
            filePath: this.getTestFilePath(filePath, opts.framework!),
            imports: this.generateImports(filePath, opts.framework!),
            testCases,
            mocks,
        };

        return testSuite;
    }

    /**
     * Generate tests from code string (without file)
     */
    async generateTestsFromCode(
        sourceCode: string,
        options: Partial<TestGenerationOptions> = {}
    ): Promise<TestSuite> {
        const defaultOptions: TestGenerationOptions = {
            framework: options.framework || TestFramework.Jest,
            includeEdgeCases: true,
            includeMocks: true,
            coverageTarget: 80,
            generateFixtures: false,
            testStyle: 'unit',
        };

        const opts = { ...defaultOptions, ...options };

        // Analyze code structure
        const analysis = this.analyzeCode(sourceCode);

        // Generate test cases using AI
        const testCases = await this.generateTestCases(
            sourceCode,
            analysis,
            opts
        );

        // Generate mocks if needed
        const mocks = opts.includeMocks
            ? await this.generateMocks(analysis, opts.framework!)
            : [];

        // Build test suite
        const testSuite: TestSuite = {
            name: 'Generated Tests',
            framework: opts.framework!,
            filePath: `test.test.${this.getExtension(opts.framework!)}`,
            imports: this.generateImportsForFramework(opts.framework!),
            testCases,
            mocks,
        };

        return testSuite;
    }

    /**
     * Generate test file content
     */
    async generateTestFile(testSuite: TestSuite): Promise<string> {
        let content = '';

        // Add imports
        content += testSuite.imports.join('\n');
        content += '\n\n';

        // Add mocks
        if (testSuite.mocks && testSuite.mocks.length > 0) {
            content += '// Mocks\n';
            testSuite.mocks.forEach(mock => {
                content += `${mock.implementation}\n\n`;
            });
        }

        // Add test suite
        content += `describe('${testSuite.name}', () => {\n`;

        // Add test cases
        testSuite.testCases.forEach(testCase => {
            content += `  test('${testCase.name}', () => {\n`;

            if (testCase.setup) {
                content += `    // Setup\n    ${testCase.setup}\n\n`;
            }

            content += `    ${testCase.code}\n`;

            if (testCase.teardown) {
                content += `\n    // Teardown\n    ${testCase.teardown}\n`;
            }

            content += `  });\n\n`;
        });

        content += '});\n';

        return content;
    }

    /**
     * Analyze code to identify testable units
     */
    private analyzeCode(code: string) {
        const functions: string[] = [];
        const classes: string[] = [];
        const exports: string[] = [];

        const lines = code.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            // Functions
            const funcMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
            if (funcMatch) {
                functions.push(funcMatch[1]);
            }

            // Arrow functions
            const arrowMatch = trimmed.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/);
            if (arrowMatch) {
                functions.push(arrowMatch[1]);
            }

            // Classes
            const classMatch = trimmed.match(/(?:export\s+)?class\s+(\w+)/);
            if (classMatch) {
                classes.push(classMatch[1]);
            }

            // Exports
            if (trimmed.startsWith('export')) {
                const exportMatch = trimmed.match(/export\s+(?:\{([^}]+)\}|(\w+))/);
                if (exportMatch) {
                    if (exportMatch[1]) {
                        const names = exportMatch[1].split(',').map(n => n.trim());
                        exports.push(...names);
                    } else if (exportMatch[2]) {
                        exports.push(exportMatch[2]);
                    }
                }
            }
        }

        return { functions, classes, exports };
    }

    /**
     * Generate test cases using AI
     */
    private async generateTestCases(
        sourceCode: string,
        analysis: any,
        options: TestGenerationOptions
    ): Promise<TestCase[]> {
        const prompt = this.buildTestGenerationPrompt(sourceCode, analysis, options);

        try {
            const response: any = await this.modelManager.chat([
                { role: 'user', content: prompt, timestamp: new Date() },
            ]);

            const content = typeof response === 'string' ? response : response.content;

            // Parse AI response to extract test cases
            return this.parseTestCases(content, options.framework!);
        } catch (error) {
            console.error('Error generating tests:', error);
            return this.generateFallbackTests(analysis, options);
        }
    }

    /**
     * Build prompt for AI test generation
     */
    private buildTestGenerationPrompt(
        sourceCode: string,
        analysis: any,
        options: TestGenerationOptions
    ): string {
        let prompt = `Generate comprehensive ${options.framework} tests for the following code.\n\n`;
        prompt += `Requirements:\n`;
        prompt += `- Framework: ${options.framework}\n`;
        prompt += `- Test style: ${options.testStyle}\n`;
        prompt += `- Include edge cases: ${options.includeEdgeCases}\n`;
        prompt += `- Coverage target: ${options.coverageTarget}%\n\n`;

        prompt += `Code to test:\n\`\`\`typescript\n${sourceCode}\n\`\`\`\n\n`;

        prompt += `Generate test cases in JSON format:\n`;
        prompt += `[\n`;
        prompt += `  {\n`;
        prompt += `    "name": "test description",\n`;
        prompt += `    "description": "what this test verifies",\n`;
        prompt += `    "code": "test implementation code",\n`;
        prompt += `    "assertions": ["assertion 1", "assertion 2"]\n`;
        prompt += `  }\n`;
        prompt += `]\n\n`;

        prompt += `Focus on:\n`;
        prompt += `- Happy path scenarios\n`;
        prompt += `- Edge cases (null, undefined, empty, boundary values)\n`;
        prompt += `- Error handling\n`;
        prompt += `- Async behavior (if applicable)\n`;

        return prompt;
    }

    /**
     * Parse test cases from AI response
     */
    private parseTestCases(response: string, framework: TestFramework): TestCase[] {
        try {
            // Remove markdown code blocks
            let jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');

            // Try to extract JSON array
            const match = jsonStr.match(/\[[\s\S]*\]/);
            if (match) {
                jsonStr = match[0];
            }

            const parsed = JSON.parse(jsonStr);

            if (Array.isArray(parsed)) {
                return parsed.map(item => ({
                    name: item.name || 'unnamed test',
                    description: item.description || '',
                    code: item.code || '',
                    assertions: item.assertions || [],
                    setup: item.setup,
                    teardown: item.teardown,
                }));
            }
        } catch (error) {
            console.error('Failed to parse test cases:', error);
        }

        return [];
    }

    /**
     * Generate fallback tests if AI fails
     */
    private generateFallbackTests(
        analysis: any,
        options: TestGenerationOptions
    ): TestCase[] {
        const tests: TestCase[] = [];

        // Generate basic tests for each function
        analysis.functions.forEach((funcName: string) => {
            tests.push({
                name: `should test ${funcName}`,
                description: `Basic test for ${funcName}`,
                code: `expect(${funcName}()).toBeDefined();`,
                assertions: ['defined'],
            });
        });

        return tests;
    }

    /**
     * Generate mocks for dependencies
     */
    private async generateMocks(
        analysis: any,
        framework: TestFramework
    ): Promise<MockDefinition[]> {
        // For now, return empty - can be enhanced with AI
        return [];
    }

    /**
     * Detect appropriate test framework
     */
    private detectFramework(filePath: string): TestFramework {
        const ext = path.extname(filePath);

        if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') {
            return TestFramework.Jest;
        } else if (ext === '.py') {
            return TestFramework.Pytest;
        } else if (ext === '.go') {
            return TestFramework.GoTest;
        } else if (ext === '.rs') {
            return TestFramework.RustTest;
        }

        return TestFramework.Jest; // Default
    }

    /**
     * Get test suite name
     */
    private getTestSuiteName(filePath: string): string {
        const basename = path.basename(filePath, path.extname(filePath));
        return basename;
    }

    /**
     * Get test file path
     */
    private getTestFilePath(filePath: string, framework: TestFramework): string {
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, path.extname(filePath));
        const ext = path.extname(filePath);

        if (framework === TestFramework.Jest) {
            return path.join(dir, `${basename}.test${ext}`);
        } else if (framework === TestFramework.Pytest) {
            return path.join(dir, `test_${basename}.py`);
        }

        return path.join(dir, `${basename}_test${ext}`);
    }

    /**
     * Generate imports for test file
     */
    private generateImports(filePath: string, framework: TestFramework): string[] {
        const imports: string[] = [];
        const basename = path.basename(filePath, path.extname(filePath));

        if (framework === TestFramework.Jest) {
            imports.push(`import { describe, test, expect } from '@jest/globals';`);
            imports.push(`import * as target from './${basename}';`);
        } else if (framework === TestFramework.Pytest) {
            imports.push(`import pytest`);
            imports.push(`from ${basename} import *`);
        }

        return imports;
    }

    /**
     * Generate imports for framework (without file path)
     */
    private generateImportsForFramework(framework: TestFramework): string[] {
        const imports: string[] = [];

        if (framework === TestFramework.Jest) {
            imports.push(`import { describe, test, expect } from '@jest/globals';`);
        } else if (framework === TestFramework.Pytest) {
            imports.push(`import pytest`);
        } else if (framework === TestFramework.Mocha) {
            imports.push(`import { describe, it, expect } from 'mocha';`);
            imports.push(`import { expect } from 'chai';`);
        }

        return imports;
    }

    /**
     * Get file extension for framework
     */
    private getExtension(framework: TestFramework): string {
        switch (framework) {
            case TestFramework.Jest:
            case TestFramework.Mocha:
                return 'ts';
            case TestFramework.Pytest:
                return 'py';
            case TestFramework.GoTest:
                return 'go';
            case TestFramework.RustTest:
                return 'rs';
            default:
                return 'ts';
        }
    }
}

// Export singleton getter
export function getTestGenerator(): TestGenerator {
    return TestGenerator.getInstance();
}
