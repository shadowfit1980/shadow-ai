/**
 * AI Testing Agent
 * 
 * Automated test generation for unit, integration, and E2E tests.
 * Includes visual regression and accessibility testing.
 * Inspired by Firebase Studio's AI testing capabilities.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export type TestType = 'unit' | 'integration' | 'e2e' | 'visual' | 'accessibility' | 'performance';

export interface TestGenerationRequest {
    type: TestType;
    sourceFile: string;
    sourceCode?: string;
    framework?: 'jest' | 'vitest' | 'playwright' | 'cypress' | 'pytest';
    coverage?: 'basic' | 'comprehensive' | 'edge-cases';
}

export interface GeneratedTest {
    filename: string;
    code: string;
    type: TestType;
    coverage: string[];
    setup?: string;
    mocks?: string[];
}

export interface TestSuiteResult {
    success: boolean;
    tests: GeneratedTest[];
    totalTests: number;
    suggestions: string[];
    error?: string;
}

export interface TestRunResult {
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    failures: Array<{
        test: string;
        error: string;
        suggestion?: string;
    }>;
}

// ============================================================================
// TESTING AGENT
// ============================================================================

export class TestingAgent extends EventEmitter {
    private static instance: TestingAgent;
    private modelManager: ModelManager;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): TestingAgent {
        if (!TestingAgent.instance) {
            TestingAgent.instance = new TestingAgent();
        }
        return TestingAgent.instance;
    }

    // ========================================================================
    // TEST GENERATION
    // ========================================================================

    /**
     * Generate tests for a source file
     */
    async generateTests(request: TestGenerationRequest): Promise<TestSuiteResult> {
        const { type, sourceFile, framework = 'jest', coverage = 'comprehensive' } = request;

        this.emit('generation:started', { type, sourceFile });

        try {
            // Read source code if not provided
            let sourceCode = request.sourceCode;
            if (!sourceCode) {
                sourceCode = await fs.readFile(sourceFile, 'utf-8');
            }

            let tests: GeneratedTest[];

            switch (type) {
                case 'unit':
                    tests = await this.generateUnitTests(sourceFile, sourceCode, framework, coverage);
                    break;
                case 'integration':
                    tests = await this.generateIntegrationTests(sourceFile, sourceCode, framework);
                    break;
                case 'e2e':
                    tests = await this.generateE2ETests(sourceFile, sourceCode, framework);
                    break;
                case 'accessibility':
                    tests = await this.generateAccessibilityTests(sourceFile, sourceCode);
                    break;
                case 'performance':
                    tests = await this.generatePerformanceTests(sourceFile, sourceCode);
                    break;
                default:
                    tests = await this.generateUnitTests(sourceFile, sourceCode, framework, coverage);
            }

            const result: TestSuiteResult = {
                success: true,
                tests,
                totalTests: tests.reduce((sum, t) => sum + t.coverage.length, 0),
                suggestions: this.getTestingSuggestions(tests),
            };

            this.emit('generation:completed', result);
            return result;

        } catch (error: any) {
            const result: TestSuiteResult = {
                success: false,
                tests: [],
                totalTests: 0,
                suggestions: [],
                error: error.message,
            };
            this.emit('generation:failed', result);
            return result;
        }
    }

    /**
     * Generate unit tests
     */
    private async generateUnitTests(
        sourceFile: string,
        sourceCode: string,
        framework: string,
        coverage: string
    ): Promise<GeneratedTest[]> {
        const prompt = `Generate comprehensive ${framework} unit tests for this code.

Source file: ${path.basename(sourceFile)}
Coverage level: ${coverage}

\`\`\`typescript
${sourceCode}
\`\`\`

Requirements:
1. Test all public functions and methods
2. Include edge cases and error handling
3. Mock external dependencies
4. Use descriptive test names
5. Follow AAA pattern (Arrange, Act, Assert)

Respond in JSON:
\`\`\`json
{
    "tests": [
        {
            "filename": "ComponentName.test.ts",
            "code": "complete test file code",
            "coverage": ["function names tested"],
            "mocks": ["list of mocked dependencies"]
        }
    ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return (parsed.tests || []).map((t: any) => ({
            ...t,
            type: 'unit' as TestType,
        }));
    }

    /**
     * Generate integration tests
     */
    private async generateIntegrationTests(
        sourceFile: string,
        sourceCode: string,
        framework: string
    ): Promise<GeneratedTest[]> {
        const prompt = `Generate ${framework} integration tests for this code.

Source: ${path.basename(sourceFile)}

\`\`\`typescript
${sourceCode}
\`\`\`

Focus on:
1. API endpoint testing
2. Database interactions
3. External service integration
4. Multi-component workflows

Respond in JSON with the same format as unit tests.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return (parsed.tests || []).map((t: any) => ({
            ...t,
            type: 'integration' as TestType,
        }));
    }

    /**
     * Generate E2E tests (Playwright/Cypress)
     */
    private async generateE2ETests(
        sourceFile: string,
        sourceCode: string,
        framework: string
    ): Promise<GeneratedTest[]> {
        const e2eFramework = framework === 'cypress' ? 'cypress' : 'playwright';

        const prompt = `Generate ${e2eFramework} E2E tests for this UI component/page.

Source: ${path.basename(sourceFile)}

\`\`\`typescript
${sourceCode}
\`\`\`

Generate tests for:
1. User interaction flows
2. Form submissions
3. Navigation
4. Error states
5. Responsive behavior

Respond in JSON:
\`\`\`json
{
    "tests": [
        {
            "filename": "feature.spec.ts",
            "code": "complete E2E test code",
            "coverage": ["user flows tested"],
            "setup": "test setup code"
        }
    ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return (parsed.tests || []).map((t: any) => ({
            ...t,
            type: 'e2e' as TestType,
        }));
    }

    /**
     * Generate accessibility tests
     */
    private async generateAccessibilityTests(
        sourceFile: string,
        sourceCode: string
    ): Promise<GeneratedTest[]> {
        const prompt = `Generate accessibility (a11y) tests for this component.

Source: ${path.basename(sourceFile)}

\`\`\`typescript
${sourceCode}
\`\`\`

Test for:
1. ARIA attributes
2. Keyboard navigation
3. Screen reader compatibility
4. Color contrast
5. Focus management
6. Semantic HTML

Use jest-axe or similar. Respond in JSON format.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return (parsed.tests || []).map((t: any) => ({
            ...t,
            type: 'accessibility' as TestType,
        }));
    }

    /**
     * Generate performance tests
     */
    private async generatePerformanceTests(
        sourceFile: string,
        sourceCode: string
    ): Promise<GeneratedTest[]> {
        const prompt = `Generate performance tests for this code.

Source: ${path.basename(sourceFile)}

\`\`\`typescript
${sourceCode}
\`\`\`

Test for:
1. Render performance
2. Memory usage
3. Bundle size impact
4. API response times
5. Load time metrics

Respond in JSON format.`;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        return (parsed.tests || []).map((t: any) => ({
            ...t,
            type: 'performance' as TestType,
        }));
    }

    // ========================================================================
    // TEST ANALYSIS
    // ========================================================================

    /**
     * Analyze test failures and suggest fixes
     */
    async analyzeFailures(failures: Array<{ test: string; error: string }>): Promise<Array<{
        test: string;
        error: string;
        suggestion: string;
        fix?: string;
    }>> {
        const results = [];

        for (const failure of failures) {
            const prompt = `Analyze this test failure and suggest a fix:

Test: ${failure.test}
Error: ${failure.error}

Provide:
1. Likely cause
2. Suggested fix
3. Code changes if applicable

Respond in JSON:
\`\`\`json
{
    "suggestion": "explanation",
    "fix": "code fix if applicable"
}
\`\`\``;

            const response = await this.callModel(prompt);
            const parsed = this.parseJSON(response);

            results.push({
                ...failure,
                suggestion: parsed.suggestion || 'Unable to analyze',
                fix: parsed.fix,
            });
        }

        return results;
    }

    /**
     * Calculate test coverage gaps
     */
    async analyzeCoverageGaps(sourceCode: string, existingTests: string): Promise<{
        coveredFunctions: string[];
        uncoveredFunctions: string[];
        recommendations: string[];
    }> {
        const prompt = `Analyze test coverage for this code.

Source code:
\`\`\`typescript
${sourceCode}
\`\`\`

Existing tests:
\`\`\`typescript
${existingTests}
\`\`\`

Identify:
1. Functions/methods that are tested
2. Functions/methods that need tests
3. Edge cases not covered

Respond in JSON:
\`\`\`json
{
    "coveredFunctions": ["list"],
    "uncoveredFunctions": ["list"],
    "recommendations": ["suggestions for additional tests"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        return this.parseJSON(response);
    }

    // ========================================================================
    // TEST RUNNING
    // ========================================================================

    /**
     * Generate test command for the project
     */
    getTestCommand(framework: string, options: {
        watch?: boolean;
        coverage?: boolean;
        filter?: string;
    } = {}): string {
        const { watch = false, coverage = false, filter } = options;

        const commands: Record<string, string> = {
            'jest': `npx jest${watch ? ' --watch' : ''}${coverage ? ' --coverage' : ''}${filter ? ` --testPathPattern="${filter}"` : ''}`,
            'vitest': `npx vitest${watch ? '' : ' run'}${coverage ? ' --coverage' : ''}${filter ? ` ${filter}` : ''}`,
            'playwright': `npx playwright test${filter ? ` ${filter}` : ''}`,
            'cypress': `npx cypress run${filter ? ` --spec "${filter}"` : ''}`,
            'pytest': `pytest${coverage ? ' --cov' : ''}${filter ? ` -k "${filter}"` : ''}`,
        };

        return commands[framework] || commands['jest'];
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async callModel(prompt: string): Promise<string> {
        return this.modelManager.chat([
            {
                role: 'system',
                content: 'You are an expert test engineer. Generate comprehensive, maintainable tests.',
                timestamp: new Date()
            },
            {
                role: 'user',
                content: prompt,
                timestamp: new Date()
            }
        ]);
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return {};
        }
    }

    private getTestingSuggestions(tests: GeneratedTest[]): string[] {
        const suggestions: string[] = [];

        if (tests.length > 0) {
            suggestions.push('Review generated tests for accuracy');
            suggestions.push('Add tests for edge cases specific to your domain');
        }

        if (tests.some(t => t.mocks && t.mocks.length > 0)) {
            suggestions.push('Verify mock implementations match real behavior');
        }

        if (!tests.some(t => t.type === 'e2e')) {
            suggestions.push('Consider adding E2E tests for critical user flows');
        }

        return suggestions;
    }

    /**
     * Generate test file path based on source file
     */
    getTestFilePath(sourceFile: string, type: TestType): string {
        const dir = path.dirname(sourceFile);
        const ext = path.extname(sourceFile);
        const name = path.basename(sourceFile, ext);

        const suffixes: Record<TestType, string> = {
            'unit': '.test',
            'integration': '.integration.test',
            'e2e': '.spec',
            'visual': '.visual.test',
            'accessibility': '.a11y.test',
            'performance': '.perf.test',
        };

        return path.join(dir, '__tests__', `${name}${suffixes[type]}${ext}`);
    }
}

// Export singleton
export const testingAgent = TestingAgent.getInstance();
