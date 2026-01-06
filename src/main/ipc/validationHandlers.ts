/**
 * Code Validation IPC Handlers
 * 
 * Exposes code validation and smart generation to the renderer
 */

import { ipcMain } from 'electron';
import { CodePreValidator } from '../ai/validation/CodePreValidator';
import { SmartCodeGenerator } from '../ai/validation/SmartCodeGenerator';

export function setupValidationHandlers(): void {
    const validator = CodePreValidator.getInstance();
    const generator = SmartCodeGenerator.getInstance();

    console.log('🔍 Setting up Code Validation IPC handlers...');

    // Validate HTML before use
    ipcMain.handle('code:validateHTML', async (_, html: string) => {
        try {
            const result = validator.validateHTML(html, { checkLinks: true, checkScripts: true });
            return {
                success: true,
                result,
                message: validator.formatResult(result)
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Validate CSS before use
    ipcMain.handle('code:validateCSS', async (_, css: string) => {
        try {
            const result = validator.validateCSS(css);
            return {
                success: true,
                result,
                message: validator.formatResult(result)
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Validate JavaScript before use
    ipcMain.handle('code:validateJS', async (_, js: string) => {
        try {
            const result = validator.validateJavaScript(js);
            return {
                success: true,
                result,
                message: validator.formatResult(result)
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Validate TypeScript before use
    ipcMain.handle('code:validateTS', async (_, ts: string) => {
        try {
            const result = validator.validateTypeScript(ts);
            return {
                success: true,
                result,
                message: validator.formatResult(result)
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Validate a complete web project
    ipcMain.handle('code:validateProject', async (_, files: { path: string; content: string }[]) => {
        try {
            const result = validator.validateWebProject(files);
            return {
                success: true,
                result,
                message: validator.formatResult(result)
            };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Generate single-file HTML (pre-validated)
    ipcMain.handle('code:generateSingleHTML', async (_, options: {
        title: string;
        description?: string;
        styles: string;
        bodyContent: string;
        scripts?: string;
    }) => {
        try {
            const result = generator.generateSingleFileHTML(options);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Generate web project (pre-validated)
    ipcMain.handle('code:generateWebProject', async (_, options: {
        name: string;
        html: string;
        css: string;
        js?: string;
    }) => {
        try {
            const result = generator.generateWebProject(options);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Generate React component (pre-validated)
    ipcMain.handle('code:generateReactComponent', async (_, options: {
        name: string;
        props?: { name: string; type: string; required?: boolean }[];
        state?: { name: string; type: string; initial: string }[];
        jsx: string;
        styles?: string;
    }) => {
        try {
            const result = generator.generateReactComponent(options);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Auto-fix HTML issues
    ipcMain.handle('code:autoFixHTML', async (_, html: string) => {
        try {
            const result = generator.autoFixHTML(html);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    // Bundle files into single HTML
    ipcMain.handle('code:bundleToSingle', async (_, files: { path: string; content: string; language: string }[]) => {
        try {
            const result = generator.bundleToSingleFile(files as any);
            return { success: true, ...result };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    });

    console.log('✅ Code Validation IPC handlers registered');
}

export default setupValidationHandlers;
