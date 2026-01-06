/**
 * Browser IPC Handlers
 * 
 * Exposes BrowserAgent functionality to the renderer process
 */

import { ipcMain } from 'electron';
import { BrowserAgent, BrowserAction } from '../ai/browser';

export function setupBrowserHandlers(): void {
    console.log('🔧 Setting up Browser IPC handlers...');

    const browser = BrowserAgent.getInstance();

    // Initialize browser
    ipcMain.handle('browser:initialize', async (_, options?: { headless?: boolean }) => {
        try {
            await browser.initialize(options);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Navigate to URL
    ipcMain.handle('browser:navigate', async (_, url: string, options?: any) => {
        try {
            const result = await browser.navigate(url, options);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Click element
    ipcMain.handle('browser:click', async (_, selector: string, options?: any) => {
        try {
            const result = await browser.click(selector, options);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Type text
    ipcMain.handle('browser:type', async (_, selector: string, text: string, options?: any) => {
        try {
            const result = await browser.type(selector, text, options);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Take screenshot
    ipcMain.handle('browser:screenshot', async (_, options?: any) => {
        try {
            const result = await browser.screenshot(options);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Extract content
    ipcMain.handle('browser:extractContent', async (_, options?: any) => {
        try {
            const content = await browser.extractContent(options);
            return { success: true, content };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Wait for element/condition
    ipcMain.handle('browser:wait', async (_, options: any) => {
        try {
            const result = await browser.wait(options);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Scroll
    ipcMain.handle('browser:scroll', async (_, options?: any) => {
        try {
            const result = await browser.scroll(options);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Research a topic
    ipcMain.handle('browser:research', async (_, query: string, options?: any) => {
        try {
            const result = await browser.research(query, options);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Fill form
    ipcMain.handle('browser:fillForm', async (_, formSelector: string, data: Record<string, string>) => {
        try {
            const result = await browser.fillForm(formSelector, data);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Execute multiple actions
    ipcMain.handle('browser:executeActions', async (_, actions: BrowserAction[]) => {
        try {
            const results = await browser.executeActions(actions);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get current page info
    ipcMain.handle('browser:getCurrentPage', async () => {
        const page = await browser.getCurrentPage();
        return page;
    });

    // Get action history
    ipcMain.handle('browser:getActionHistory', async () => {
        return browser.getActionHistory();
    });

    // Check if ready
    ipcMain.handle('browser:isReady', async () => {
        return browser.isReady();
    });

    // Close browser
    ipcMain.handle('browser:close', async () => {
        try {
            await browser.close();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Browser IPC handlers registered');
}
