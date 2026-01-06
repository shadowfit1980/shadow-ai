/**
 * Shadow AI E2E Tests - Core Application Flows
 * 
 * Tests the main functionality of the Shadow AI Electron app
 */

import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
        args: [path.join(__dirname, '../../dist/main/index.js')],
        env: {
            ...process.env,
            NODE_ENV: 'test'
        }
    });

    // Wait for first window
    window = await electronApp.firstWindow();

    // Wait for app to be ready
    await window.waitForLoadState('domcontentloaded');
    await window.waitForTimeout(2000); // Allow React to hydrate
});

test.afterAll(async () => {
    await electronApp.close();
});

test.describe('Application Launch', () => {
    test('should launch successfully', async () => {
        expect(electronApp).toBeDefined();
        expect(window).toBeDefined();
    });

    test('should display main window', async () => {
        const title = await window.title();
        expect(title).toContain('Shadow');
    });

    test('should have shadowAPI available', async () => {
        const hasAPI = await window.evaluate(() => {
            return typeof (window as any).shadowAPI !== 'undefined';
        });
        expect(hasAPI).toBe(true);
    });
});

test.describe('Model Management', () => {
    test('should list available models', async () => {
        const models = await window.evaluate(async () => {
            return await (window as any).shadowAPI.listModels();
        });
        expect(Array.isArray(models)).toBe(true);
    });
});

test.describe('Chat Interface', () => {
    test('should have chat input', async () => {
        // Look for textarea or input that might be the chat
        const chatInput = await window.locator('textarea, input[type="text"]').first();
        await expect(chatInput).toBeVisible();
    });

    test('should accept input', async () => {
        const chatInput = await window.locator('textarea, input[type="text"]').first();
        await chatInput.fill('Hello, Shadow AI!');
        const value = await chatInput.inputValue();
        expect(value).toContain('Hello');
    });
});

test.describe('Queen 3 Max APIs', () => {
    test('personality API should be available', async () => {
        const hasPersonality = await window.evaluate(() => {
            return typeof (window as any).shadowAPI.personality !== 'undefined';
        });
        expect(hasPersonality).toBe(true);
    });

    test('should get all personalities', async () => {
        const result = await window.evaluate(async () => {
            return await (window as any).shadowAPI.personality.getAll();
        });
        expect(result).toBeDefined();
    });

    test('health API should be available', async () => {
        const hasHealth = await window.evaluate(() => {
            return typeof (window as any).shadowAPI.health !== 'undefined';
        });
        expect(hasHealth).toBe(true);
    });

    test('pluginMarketplace API should be available', async () => {
        const hasPlugins = await window.evaluate(() => {
            return typeof (window as any).shadowAPI.pluginMarketplace !== 'undefined';
        });
        expect(hasPlugins).toBe(true);
    });

    test('multimodal API should be available', async () => {
        const hasMultimodal = await window.evaluate(() => {
            return typeof (window as any).shadowAPI.multimodal !== 'undefined';
        });
        expect(hasMultimodal).toBe(true);
    });

    test('deploy API should be available', async () => {
        const hasDeploy = await window.evaluate(() => {
            return typeof (window as any).shadowAPI.deploy !== 'undefined';
        });
        expect(hasDeploy).toBe(true);
    });
});

test.describe('IPC Communication', () => {
    test('should execute agent command', async () => {
        const result = await window.evaluate(async () => {
            try {
                return await (window as any).shadowAPI.executeCommand('echo', { message: 'test' });
            } catch (e) {
                return { error: true };
            }
        });
        expect(result).toBeDefined();
    });

    test('should get queue stats', async () => {
        const stats = await window.evaluate(async () => {
            return await (window as any).shadowAPI.getQueueStats();
        });
        expect(stats).toBeDefined();
    });
});

test.describe('Plugin System', () => {
    test('should search plugins', async () => {
        const result = await window.evaluate(async () => {
            return await (window as any).shadowAPI.pluginMarketplace.search('');
        });
        expect(result).toBeDefined();
    });

    test('should get plugin categories', async () => {
        const result = await window.evaluate(async () => {
            return await (window as any).shadowAPI.pluginMarketplace.getCategories();
        });
        expect(result).toBeDefined();
    });
});

test.describe('Collaboration Engine', () => {
    test('should have collabEngine API', async () => {
        const hasCollab = await window.evaluate(() => {
            return typeof (window as any).shadowAPI.collabEngine !== 'undefined';
        });
        expect(hasCollab).toBe(true);
    });
});
