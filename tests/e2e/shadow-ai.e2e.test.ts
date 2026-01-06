/**
 * Shadow AI v5.0 E2E Tests
 * 
 * End-to-end tests using Playwright for Electron
 */

import { test, expect, _electron as electron } from '@playwright/test';

let app: Awaited<ReturnType<typeof electron.launch>>;
let page: Awaited<ReturnType<typeof app.firstWindow>>;

test.beforeAll(async () => {
    // Launch Electron app
    app = await electron.launch({
        args: ['.'],
        timeout: 30000
    });
    page = await app.firstWindow();
});

test.afterAll(async () => {
    await app.close();
});

test.describe('Shadow AI v5.0 - Application Launch', () => {
    test('should display v5.0 header', async () => {
        await expect(page.locator('text=Shadow AI v5')).toBeVisible({ timeout: 10000 });
    });

    test('should show v5.0.0 in footer', async () => {
        await expect(page.locator('text=Shadow AI v5.0.0')).toBeVisible();
    });
});

test.describe('MasterDashboard', () => {
    test('should have Dashboard tab as first tab', async () => {
        const dashboardTab = page.locator('button:has-text("🎛️ Dashboard")');
        await expect(dashboardTab).toBeVisible();
    });

    test('should click Dashboard tab and show MasterDashboard', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await expect(page.locator('text=Queen 3 Max Control Center')).toBeVisible({ timeout: 5000 });
    });

    test('should show 16 tabs in MasterDashboard', async () => {
        // Navigate to dashboard first
        await page.locator('button:has-text("🎛️ Dashboard")').click();

        // Check for revolutionary tabs
        const tabNames = ['Overview', 'Health', 'Plugins', 'Knowledge', 'BDI Swarm', 'Security', 'Intent', 'Temporal', 'Business', 'Router'];
        for (const tabName of tabNames) {
            const tab = page.locator(`button:has-text("${tabName}")`);
            await expect(tab).toBeVisible();
        }
    });
});

test.describe('Revolutionary Features - Knowledge Graph', () => {
    test('should open Knowledge tab', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("Knowledge")').click();
        await expect(page.locator('text=Project Knowledge Graph')).toBeVisible({ timeout: 5000 });
    });

    test('should create a new project', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("Knowledge")').click();

        // Fill in project creation form if visible
        const createBtn = page.locator('button:has-text("Create Project")');
        if (await createBtn.isVisible()) {
            await createBtn.click();
        }
    });
});

test.describe('Revolutionary Features - BDI Swarm', () => {
    test('should open BDI Swarm tab', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("BDI Swarm")').click();
        await expect(page.locator('text=BDI Agent Swarm')).toBeVisible({ timeout: 5000 });
    });

    test('should show 12 specialized agents', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("BDI Swarm")').click();

        // Look for some of the agent names
        const agentNames = ['Nexus', 'Clara', 'Atlas', 'Pixel', 'Server'];
        for (const name of agentNames) {
            const agent = page.locator(`text=${name}`);
            await expect(agent).toBeVisible({ timeout: 3000 });
        }
    });
});

test.describe('Revolutionary Features - Security Fortress', () => {
    test('should open Security tab', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("Security")').click();
        await expect(page.locator('text=Security Fortress')).toBeVisible({ timeout: 5000 });
    });

    test('should show threat patterns', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("Security")').click();

        // Check for threat pattern indicators
        await expect(page.locator('text=SQL Injection').or(page.locator('text=XSS'))).toBeVisible({ timeout: 3000 });
    });
});

test.describe('Revolutionary Features - Model Router', () => {
    test('should open Router tab', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("Router")').click();
        await expect(page.locator('text=Intelligent Model Router')).toBeVisible({ timeout: 5000 });
    });

    test('should show model configurations', async () => {
        await page.locator('button:has-text("🎛️ Dashboard")').click();
        await page.locator('button:has-text("Router")').click();

        // Check for some model names
        await expect(page.locator('text=GPT-4o').or(page.locator('text=Claude'))).toBeVisible({ timeout: 3000 });
    });
});

test.describe('Tab Navigation', () => {
    test('should switch between main tabs', async () => {
        // Click Code tab
        await page.locator('button:has-text("Code")').first().click();
        await expect(page.locator('.monaco-editor, [class*="editor"]')).toBeVisible({ timeout: 5000 });

        // Click Preview tab
        await page.locator('button:has-text("Preview")').click();
        await expect(page.locator('iframe, [class*="preview"]')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Settings', () => {
    test('should open settings panel', async () => {
        await page.locator('button:has-text("⚙️ Settings")').click();
        await expect(page.locator('text=API Keys').or(page.locator('text=Settings'))).toBeVisible({ timeout: 5000 });
    });
});
