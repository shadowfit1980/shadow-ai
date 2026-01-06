/**
 * IPC Handlers for Automated Testing Framework
 * Exposes testing capabilities to the renderer process
 */

import { ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getTestingFramework } from '../ai/testing';
import { TestFramework, TestGenerationOptions } from '../ai/testing/types';

/**
 * Register all testing-related IPC handlers
 */
export function registerTestingHandlers() {
    console.log('📝 Registering testing IPC handlers...');

    // ============================================
    // TEST GENERATION
    // ============================================

    /**
     * Generate tests from code string
     */
    ipcMain.handle('testing:generate-from-code', async (event, code: string, options: Partial<TestGenerationOptions>) => {
        try {
            const framework = getTestingFramework();

            // Provide defaults for required options
            const fullOptions: TestGenerationOptions = {
                includeEdgeCases: options.includeEdgeCases ?? true,
                includeMocks: options.includeMocks ?? true,
                coverageTarget: options.coverageTarget ?? 80,
                generateFixtures: options.generateFixtures ?? false,
                testStyle: options.testStyle ?? 'unit',
                framework: options.framework
            };

            // Send progress updates
            const window = BrowserWindow.fromWebContents(event.sender);

            if (window) {
                window.webContents.send('testing:progress', {
                    stage: 'analyzing',
                    progress: 25,
                    message: 'Analyzing code structure...'
                });
            }

            const suite = await framework.generateTests(code, fullOptions);

            if (window) {
                window.webContents.send('testing:progress', {
                    stage: 'complete',
                    progress: 100,
                    message: 'Tests generated successfully!'
                });
            }

            return {
                success: true,
                suite
            };
        } catch (error: any) {
            console.error('Error generating tests from code:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Generate tests from file path
     */
    ipcMain.handle('testing:generate-from-file', async (event, filePath: string, options: Partial<TestGenerationOptions>) => {
        try {
            const framework = getTestingFramework();
            const window = BrowserWindow.fromWebContents(event.sender);

            // Provide defaults for required options
            const fullOptions: TestGenerationOptions = {
                includeEdgeCases: options.includeEdgeCases ?? true,
                includeMocks: options.includeMocks ?? true,
                coverageTarget: options.coverageTarget ?? 80,
                generateFixtures: options.generateFixtures ?? false,
                testStyle: options.testStyle ?? 'unit',
                framework: options.framework
            };

            if (window) {
                window.webContents.send('testing:progress', {
                    stage: 'analyzing',
                    progress: 10,
                    message: 'Reading file...'
                });
            }

            // Read file
            const code = await fs.readFile(filePath, 'utf-8');

            if (window) {
                window.webContents.send('testing:progress', {
                    stage: 'generating',
                    progress: 50,
                    message: 'Generating tests...'
                });
            }

            const suite = await framework.generateTests(code, fullOptions);

            if (window) {
                window.webContents.send('testing:progress', {
                    stage: 'complete',
                    progress: 100,
                    message: 'Tests generated!'
                });
            }

            return {
                success: true,
                suite,
                sourceFile: filePath
            };
        } catch (error: any) {
            console.error('Error generating tests from file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Analyze code structure without generating tests
     */
    ipcMain.handle('testing:analyze-code', async (event, code: string) => {
        try {
            // Use TestGenerator's internal analysis
            const { TestGenerator } = require('../ai/testing/TestGenerator');
            const generator = TestGenerator.getInstance();

            // Access private method through any cast (for analysis only)
            const analysis = (generator as any).analyzeCode(code);

            return {
                success: true,
                analysis
            };
        } catch (error: any) {
            console.error('Error analyzing code:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    // ============================================
    // TEST EXECUTION
    // ============================================

    /**
     * Run tests for specific framework
     */
    ipcMain.handle('testing:run-tests', async (event, framework: TestFramework, options?: {
        coverage?: boolean;
        files?: string[];
    }) => {
        try {
            const testingFramework = getTestingFramework();
            const window = BrowserWindow.fromWebContents(event.sender);

            if (window) {
                window.webContents.send('testing:run-progress', {
                    status: 'running',
                    message: `Running ${framework} tests...`
                });
            }

            const results = await testingFramework.runTests(framework, options);

            if (window) {
                window.webContents.send('testing:run-progress', {
                    status: 'complete',
                    message: 'Tests complete!'
                });
            }

            return {
                success: true,
                results
            };
        } catch (error: any) {
            console.error('Error running tests:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Run all tests across all frameworks
     */
    ipcMain.handle('testing:run-all-tests', async (event, options?: { coverage?: boolean }) => {
        try {
            const framework = getTestingFramework();
            const window = BrowserWindow.fromWebContents(event.sender);

            if (window) {
                window.webContents.send('testing:run-progress', {
                    status: 'running',
                    message: 'Running all tests...'
                });
            }

            const results = await framework.runTests(undefined, options);

            if (window) {
                window.webContents.send('testing:run-progress', {
                    status: 'complete',
                    message: 'All tests complete!'
                });
            }

            return {
                success: true,
                results: Array.isArray(results) ? results : [results]
            };
        } catch (error: any) {
            console.error('Error running all tests:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Detect available testing frameworks in project
     */
    ipcMain.handle('testing:detect-frameworks', async (event, projectPath: string) => {
        try {
            const frameworks: TestFramework[] = [];

            // Check package.json
            const packageJsonPath = path.join(projectPath, 'package.json');
            try {
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
            } catch (error) {
                // package.json not found or invalid
            }

            // Check for Python
            const pytestConfig = path.join(projectPath, 'pytest.ini');
            const hasPytest = await fs.access(pytestConfig).then(() => true).catch(() => false);
            if (hasPytest) {
                frameworks.push(TestFramework.Pytest);
            }

            return {
                success: true,
                frameworks
            };
        } catch (error: any) {
            console.error('Error detecting frameworks:', error);
            return {
                success: false,
                error: error.message,
                frameworks: []
            };
        }
    });

    // ============================================
    // COVERAGE & ANALYSIS
    // ============================================

    /**
     * Get coverage report for framework
     */
    ipcMain.handle('testing:get-coverage', async (event, framework: TestFramework) => {
        try {
            const testingFramework = getTestingFramework();
            const coverage = await testingFramework.getCoverage(framework);

            return {
                success: true,
                coverage
            };
        } catch (error: any) {
            console.error('Error getting coverage:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Analyze test quality
     */
    ipcMain.handle('testing:analyze-quality', async (event, suite: any) => {
        try {
            const framework = getTestingFramework();
            const analysis = await framework.analyzeTests(suite);

            return {
                success: true,
                analysis
            };
        } catch (error: any) {
            console.error('Error analyzing quality:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Get improvement suggestions for tests
     */
    ipcMain.handle('testing:get-suggestions', async (event, suite: any) => {
        try {
            const framework = getTestingFramework();
            const analysis = await framework.analyzeTests(suite);

            return {
                success: true,
                suggestions: analysis.suggestions
            };
        } catch (error: any) {
            console.error('Error getting suggestions:', error);
            return {
                success: false,
                error: error.message,
                suggestions: []
            };
        }
    });

    // ============================================
    // FILE OPERATIONS
    // ============================================

    /**
     * Save generated test suite to file
     */
    ipcMain.handle('testing:save-test-suite', async (event, suite: any, targetPath: string) => {
        try {
            const { TestGenerator } = require('../ai/testing/TestGenerator');
            const generator = TestGenerator.getInstance();

            // Generate file content
            const content = await generator.generateTestFile(suite);

            // Ensure directory exists
            const dir = path.dirname(targetPath);
            await fs.mkdir(dir, { recursive: true });

            // Write file
            await fs.writeFile(targetPath, content, 'utf-8');

            return {
                success: true,
                path: targetPath
            };
        } catch (error: any) {
            console.error('Error saving test suite:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Preview generated test file content
     */
    ipcMain.handle('testing:preview-test-file', async (event, suite: any) => {
        try {
            const { TestGenerator } = require('../ai/testing/TestGenerator');
            const generator = TestGenerator.getInstance();

            const content = await generator.generateTestFile(suite);

            return {
                success: true,
                content
            };
        } catch (error: any) {
            console.error('Error previewing test file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    });

    /**
     * Find test files in project
     */
    ipcMain.handle('testing:find-test-files', async (event, projectPath: string) => {
        try {
            const { glob } = require('glob');

            // Common test file patterns
            const patterns = [
                '**/*.test.{ts,tsx,js,jsx}',
                '**/*.spec.{ts,tsx,js,jsx}',
                '**/test_*.py',
                '**/*_test.py'
            ];

            const files: string[] = [];

            for (const pattern of patterns) {
                const matches = await glob(pattern, {
                    cwd: projectPath,
                    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
                });
                files.push(...matches);
            }

            return {
                success: true,
                files: [...new Set(files)] // Remove duplicates
            };
        } catch (error: any) {
            console.error('Error finding test files:', error);
            return {
                success: false,
                error: error.message,
                files: []
            };
        }
    });

    console.log('✅ Testing IPC handlers registered');
}
