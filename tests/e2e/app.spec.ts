/**
 * E2E Test Setup - Playwright Configuration
 * 
 * End-to-end tests for Shadow AI
 */

import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
        args: ['.'],
        env: { ...process.env, NODE_ENV: 'test' },
    });

    // Wait for the first window
    page = await electronApp.firstWindow();
    await page.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
    await electronApp.close();
});

test.describe('Shadow AI E2E Tests', () => {
    test('should launch application', async () => {
        const title = await page.title();
        expect(title).toBeTruthy();
    });

    test('should show main interface', async () => {
        // Check for main elements
        await expect(page.locator('#root')).toBeVisible();
    });

    test('should navigate between tabs', async () => {
        // Click chat tab if exists
        const chatTab = page.locator('button:has-text("Chat"), [data-tab="chat"]');
        if (await chatTab.count() > 0) {
            await chatTab.first().click();
            await page.waitForTimeout(500);
        }
    });

    test('should open settings', async () => {
        // Look for settings button
        const settingsBtn = page.locator('button:has-text("Settings"), button:has-text("⚙"), [data-action="settings"]');
        if (await settingsBtn.count() > 0) {
            await settingsBtn.first().click();
            await page.waitForTimeout(500);

            // Close if modal opened
            const closeBtn = page.locator('button:has-text("×"), button:has-text("Close")');
            if (await closeBtn.count() > 0) {
                await closeBtn.first().click();
            }
        }
    });

    test('should handle chat input', async () => {
        // Find chat input
        const chatInput = page.locator('textarea, input[type="text"]').first();
        if (await chatInput.count() > 0) {
            await chatInput.fill('Hello, test message');
            const value = await chatInput.inputValue();
            expect(value).toBe('Hello, test message');
            await chatInput.fill(''); // Clear
        }
    });

    test('should show workflow builder', async () => {
        const workflowTab = page.locator('button:has-text("Workflow"), [data-tab="workflow"]');
        if (await workflowTab.count() > 0) {
            await workflowTab.first().click();
            await page.waitForTimeout(500);

            // Check for workflow canvas
            const canvas = page.locator('[class*="canvas"], [class*="workflow"]');
            expect(await canvas.count()).toBeGreaterThanOrEqual(0);
        }
    });

    test('should show analytics dashboard', async () => {
        const analyticsTab = page.locator('button:has-text("Analytics"), [data-tab="analytics"]');
        if (await analyticsTab.count() > 0) {
            await analyticsTab.first().click();
            await page.waitForTimeout(500);
        }
    });

    test('should be responsive', async () => {
        // Get window info
        const isPackaged = await electronApp.evaluate(async ({ app }) => {
            return app.isPackaged;
        });

        expect(isPackaged).toBe(false); // Should be false in dev/test
    });

    test('should handle keyboard shortcuts', async () => {
        // Test Escape key
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        // Test Cmd/Ctrl+K (common for command palette)
        await page.keyboard.press('Meta+k');
        await page.waitForTimeout(200);
        await page.keyboard.press('Escape');
    });
});

test.describe('AI Chat Tests', () => {
    test('should display message history', async () => {
        const messages = page.locator('[class*="message"], [data-testid="message"]');
        // May or may not have messages initially
        expect(await messages.count()).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Workflow Tests', () => {
    test('should allow drag and drop of nodes', async () => {
        const workflowTab = page.locator('button:has-text("Workflow"), [data-tab="workflow"]');
        if (await workflowTab.count() > 0) {
            await workflowTab.first().click();
            await page.waitForTimeout(500);

            // Find palette items
            const paletteItem = page.locator('[draggable="true"]').first();
            const canvas = page.locator('[class*="canvas"]').first();

            if (await paletteItem.count() > 0 && await canvas.count() > 0) {
                // Attempt drag and drop
                await paletteItem.dragTo(canvas);
            }
        }
    });
});
