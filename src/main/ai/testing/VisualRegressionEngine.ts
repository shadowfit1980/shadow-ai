/**
 * 📸 VisualRegressionEngine - Screenshot-Based Visual Testing
 * 
 * Captures screenshots of UI components and compares them against baselines
 * to detect visual regressions automatically.
 * 
 * This addresses Grok's criticism: "No visual regression testing. 
 * Your users can ship broken UIs without knowing."
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface Screenshot {
    id: string;
    url: string;
    selector?: string;
    viewport: Viewport;
    timestamp: Date;
    buffer: Buffer;
    hash: string;
}

export interface Viewport {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
}

export interface DiffResult {
    identical: boolean;
    diffPercentage: number;
    diffPixels: number;
    totalPixels: number;
    diffImagePath?: string;
    regions: DiffRegion[];
}

export interface DiffRegion {
    x: number;
    y: number;
    width: number;
    height: number;
    description: string;
}

export interface TestCase {
    id: string;
    name: string;
    url: string;
    selector?: string;
    viewport: Viewport;
    threshold: number;
    baselinePath?: string;
    createdAt: Date;
    lastRun?: Date;
    status: 'pending' | 'passed' | 'failed' | 'new';
}

export interface TestResult {
    testId: string;
    passed: boolean;
    diffResult?: DiffResult;
    screenshot: Screenshot;
    baseline?: Screenshot;
    duration: number;
    error?: string;
}

export interface HTMLReport {
    title: string;
    generatedAt: Date;
    totalTests: number;
    passed: number;
    failed: number;
    newBaselines: number;
    results: TestResult[];
    htmlContent: string;
}

// ============================================================================
// VISUAL REGRESSION ENGINE
// ============================================================================

export class VisualRegressionEngine extends EventEmitter {
    private static instance: VisualRegressionEngine;
    private testCases: Map<string, TestCase> = new Map();
    private baselines: Map<string, Screenshot> = new Map();
    private baselineDir: string;
    private screenshotDir: string;
    private diffDir: string;

    private readonly defaultViewport: Viewport = {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false
    };

    private readonly mobileViewport: Viewport = {
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        isMobile: true
    };

    private constructor() {
        super();
        const baseDir = path.join(process.cwd(), '.shadow-ai', 'visual-testing');
        this.baselineDir = path.join(baseDir, 'baselines');
        this.screenshotDir = path.join(baseDir, 'screenshots');
        this.diffDir = path.join(baseDir, 'diffs');
    }

    public static getInstance(): VisualRegressionEngine {
        if (!VisualRegressionEngine.instance) {
            VisualRegressionEngine.instance = new VisualRegressionEngine();
        }
        return VisualRegressionEngine.instance;
    }

    /**
     * Initialize directories
     */
    public async initialize(): Promise<void> {
        await fs.mkdir(this.baselineDir, { recursive: true });
        await fs.mkdir(this.screenshotDir, { recursive: true });
        await fs.mkdir(this.diffDir, { recursive: true });
        await this.loadBaselines();
    }

    /**
     * Capture a screenshot of a URL or element
     */
    public async captureScreenshot(
        url: string,
        options: {
            selector?: string;
            viewport?: Viewport;
            fullPage?: boolean;
            waitForSelector?: string;
            delay?: number;
        } = {}
    ): Promise<Screenshot> {
        const viewport = options.viewport || this.defaultViewport;
        const timestamp = new Date();
        const id = this.generateId();

        // Use Puppeteer-style command via system (simplified for demo)
        // In production, this would use actual Puppeteer or Playwright
        const screenshotPath = path.join(this.screenshotDir, `${id}.png`);

        try {
            // For Electron apps, we can use webContents.capturePage()
            // For external URLs, we'd use Puppeteer
            // This is a placeholder that shows the architecture

            const buffer = await this.captureWithElectron(url, viewport, options);

            const hash = crypto.createHash('md5').update(buffer).digest('hex');

            const screenshot: Screenshot = {
                id,
                url,
                selector: options.selector,
                viewport,
                timestamp,
                buffer,
                hash
            };

            // Save to disk
            await fs.writeFile(screenshotPath, buffer);

            this.emit('screenshot:captured', { id, url, path: screenshotPath });
            return screenshot;

        } catch (error: any) {
            this.emit('screenshot:error', { url, error: error.message });
            throw error;
        }
    }

    /**
     * Compare screenshot with baseline
     */
    public async compareWithBaseline(
        current: Screenshot | Buffer,
        baseline: Screenshot | Buffer,
        threshold: number = 0.01
    ): Promise<DiffResult> {
        const currentBuffer = Buffer.isBuffer(current) ? current : current.buffer;
        const baselineBuffer = Buffer.isBuffer(baseline) ? baseline : baseline.buffer;

        // Simple pixel-by-pixel comparison
        // In production, use pixelmatch or similar library
        const diffResult = await this.pixelCompare(currentBuffer, baselineBuffer);

        const passed = diffResult.diffPercentage <= threshold;

        if (!passed) {
            // Generate diff image
            const diffId = this.generateId();
            const diffPath = path.join(this.diffDir, `diff-${diffId}.png`);
            await this.generateDiffImage(currentBuffer, baselineBuffer, diffPath);
            diffResult.diffImagePath = diffPath;
        }

        return diffResult;
    }

    /**
     * Create a new test case
     */
    public createTestCase(
        name: string,
        url: string,
        options: {
            selector?: string;
            viewport?: Viewport;
            threshold?: number;
        } = {}
    ): TestCase {
        const testCase: TestCase = {
            id: this.generateId(),
            name,
            url,
            selector: options.selector,
            viewport: options.viewport || this.defaultViewport,
            threshold: options.threshold || 0.01,
            createdAt: new Date(),
            status: 'pending'
        };

        this.testCases.set(testCase.id, testCase);
        this.emit('testcase:created', testCase);

        return testCase;
    }

    /**
     * Run a single test
     */
    public async runTest(testId: string): Promise<TestResult> {
        const startTime = Date.now();
        const testCase = this.testCases.get(testId);

        if (!testCase) {
            throw new Error(`Test case not found: ${testId}`);
        }

        try {
            // Capture current screenshot
            const screenshot = await this.captureScreenshot(testCase.url, {
                selector: testCase.selector,
                viewport: testCase.viewport
            });

            // Get baseline
            const baseline = this.baselines.get(testId);

            if (!baseline) {
                // No baseline - this is a new test
                await this.saveBaseline(testId, screenshot);
                testCase.status = 'new';

                return {
                    testId,
                    passed: true,
                    screenshot,
                    duration: Date.now() - startTime
                };
            }

            // Compare with baseline
            const diffResult = await this.compareWithBaseline(
                screenshot,
                baseline,
                testCase.threshold
            );

            const passed = diffResult.identical || diffResult.diffPercentage <= testCase.threshold;
            testCase.status = passed ? 'passed' : 'failed';
            testCase.lastRun = new Date();

            this.emit('test:complete', { testId, passed, diffResult });

            return {
                testId,
                passed,
                diffResult,
                screenshot,
                baseline,
                duration: Date.now() - startTime
            };

        } catch (error: any) {
            testCase.status = 'failed';

            return {
                testId,
                passed: false,
                screenshot: null as any,
                duration: Date.now() - startTime,
                error: error.message
            };
        }
    }

    /**
     * Run all tests
     */
    public async runAllTests(): Promise<TestResult[]> {
        const results: TestResult[] = [];

        for (const [testId] of this.testCases) {
            const result = await this.runTest(testId);
            results.push(result);
        }

        return results;
    }

    /**
     * Update baseline for a test
     */
    public async updateBaseline(testId: string): Promise<void> {
        const testCase = this.testCases.get(testId);
        if (!testCase) {
            throw new Error(`Test case not found: ${testId}`);
        }

        const screenshot = await this.captureScreenshot(testCase.url, {
            selector: testCase.selector,
            viewport: testCase.viewport
        });

        await this.saveBaseline(testId, screenshot);
        this.emit('baseline:updated', { testId });
    }

    /**
     * Generate HTML report
     */
    public async generateReport(results: TestResult[]): Promise<HTMLReport> {
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed && !r.error).length;
        const newBaselines = results.filter(r => !this.baselines.has(r.testId)).length;

        const htmlContent = this.buildReportHTML(results, passed, failed, newBaselines);

        const report: HTMLReport = {
            title: 'Visual Regression Test Report',
            generatedAt: new Date(),
            totalTests: results.length,
            passed,
            failed,
            newBaselines,
            results,
            htmlContent
        };

        // Save report
        const reportPath = path.join(this.screenshotDir, '..', 'report.html');
        await fs.writeFile(reportPath, htmlContent);

        this.emit('report:generated', { path: reportPath });
        return report;
    }

    /**
     * Get all test cases
     */
    public getTestCases(): TestCase[] {
        return Array.from(this.testCases.values());
    }

    /**
     * Get test case by ID
     */
    public getTestCase(id: string): TestCase | undefined {
        return this.testCases.get(id);
    }

    /**
     * Delete a test case
     */
    public async deleteTestCase(id: string): Promise<void> {
        this.testCases.delete(id);
        this.baselines.delete(id);

        // Remove baseline file
        try {
            await fs.unlink(path.join(this.baselineDir, `${id}.png`));
        } catch {
            // File may not exist
        }
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async captureWithElectron(
        url: string,
        viewport: Viewport,
        options: any
    ): Promise<Buffer> {
        // This is a placeholder implementation
        // In production, this would:
        // 1. Create a hidden BrowserWindow
        // 2. Load the URL
        // 3. Wait for page to load
        // 4. Use webContents.capturePage()

        // For now, return a placeholder buffer
        // The actual implementation would use Electron's built-in screenshot capabilities

        const { BrowserWindow } = require('electron');

        return new Promise(async (resolve, reject) => {
            try {
                const win = new BrowserWindow({
                    width: viewport.width,
                    height: viewport.height,
                    show: false,
                    webPreferences: {
                        offscreen: true
                    }
                });

                await win.loadURL(url);

                // Wait for page to be ready
                await new Promise(r => setTimeout(r, options.delay || 1000));

                const image = await win.webContents.capturePage();
                win.close();

                resolve(image.toPNG());
            } catch (error) {
                reject(error);
            }
        });
    }

    private async pixelCompare(current: Buffer, baseline: Buffer): Promise<DiffResult> {
        // Simple hash-based comparison
        // In production, use pixelmatch library for actual pixel comparison
        const currentHash = crypto.createHash('md5').update(current).digest('hex');
        const baselineHash = crypto.createHash('md5').update(baseline).digest('hex');

        const identical = currentHash === baselineHash;

        if (identical) {
            return {
                identical: true,
                diffPercentage: 0,
                diffPixels: 0,
                totalPixels: current.length / 4, // Assuming RGBA
                regions: []
            };
        }

        // Calculate approximate difference
        let diffCount = 0;
        const minLength = Math.min(current.length, baseline.length);

        for (let i = 0; i < minLength; i += 4) {
            if (current[i] !== baseline[i] ||
                current[i + 1] !== baseline[i + 1] ||
                current[i + 2] !== baseline[i + 2]) {
                diffCount++;
            }
        }

        const totalPixels = minLength / 4;
        const diffPercentage = diffCount / totalPixels;

        return {
            identical: false,
            diffPercentage,
            diffPixels: diffCount,
            totalPixels,
            regions: [{ x: 0, y: 0, width: 100, height: 100, description: 'Detected change' }]
        };
    }

    private async generateDiffImage(current: Buffer, baseline: Buffer, outputPath: string): Promise<void> {
        // In production, this would generate an actual diff image
        // For now, just copy the current screenshot
        await fs.writeFile(outputPath, current);
    }

    private async saveBaseline(testId: string, screenshot: Screenshot): Promise<void> {
        const baselinePath = path.join(this.baselineDir, `${testId}.png`);
        await fs.writeFile(baselinePath, screenshot.buffer);
        this.baselines.set(testId, screenshot);

        const testCase = this.testCases.get(testId);
        if (testCase) {
            testCase.baselinePath = baselinePath;
        }
    }

    private async loadBaselines(): Promise<void> {
        try {
            const files = await fs.readdir(this.baselineDir);

            for (const file of files) {
                if (file.endsWith('.png')) {
                    const testId = file.replace('.png', '');
                    const buffer = await fs.readFile(path.join(this.baselineDir, file));

                    this.baselines.set(testId, {
                        id: testId,
                        url: '',
                        viewport: this.defaultViewport,
                        timestamp: new Date(),
                        buffer,
                        hash: crypto.createHash('md5').update(buffer).digest('hex')
                    });
                }
            }
        } catch {
            // Directory might not exist yet
        }
    }

    private buildReportHTML(
        results: TestResult[],
        passed: number,
        failed: number,
        newBaselines: number
    ): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; }
        .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .stats { display: flex; gap: 2rem; margin-top: 1rem; }
        .stat { background: rgba(255,255,255,0.1); padding: 1rem 2rem; border-radius: 8px; }
        .stat-value { font-size: 2rem; font-weight: bold; }
        .stat-label { opacity: 0.8; font-size: 0.875rem; }
        .passed { color: #3fb950; }
        .failed { color: #f85149; }
        .new { color: #58a6ff; }
        .results { padding: 2rem; }
        .result { background: #161b22; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; }
        .result-header { padding: 1rem; display: flex; align-items: center; gap: 1rem; border-bottom: 1px solid #30363d; }
        .status-badge { padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
        .status-passed { background: #238636; }
        .status-failed { background: #da3633; }
        .status-new { background: #1f6feb; }
        .result-details { padding: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .screenshot { border-radius: 8px; overflow: hidden; }
        .screenshot img { width: 100%; display: block; }
        .screenshot-label { padding: 0.5rem; background: #21262d; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Visual Regression Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${results.length}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat">
                <div class="stat-value passed">${passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value failed">${failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value new">${newBaselines}</div>
                <div class="stat-label">New Baselines</div>
            </div>
        </div>
    </div>
    <div class="results">
        ${results.map(r => `
        <div class="result">
            <div class="result-header">
                <span class="status-badge ${r.passed ? 'status-passed' : 'status-failed'}">
                    ${r.passed ? 'PASSED' : 'FAILED'}
                </span>
                <span>${r.testId}</span>
                <span style="opacity: 0.6; margin-left: auto;">${r.duration}ms</span>
            </div>
            ${r.diffResult && !r.diffResult.identical ? `
            <div class="result-details">
                <div>Diff: ${(r.diffResult.diffPercentage * 100).toFixed(2)}%</div>
                <div>Changed pixels: ${r.diffResult.diffPixels}</div>
            </div>
            ` : ''}
        </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Export singleton
export const visualRegressionEngine = VisualRegressionEngine.getInstance();
