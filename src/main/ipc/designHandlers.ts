/**
 * IPC Handlers for Design Generation
 * Exposes Nano Banana Pro and Google Stitch functionality to renderer process
 */

import { ipcMain } from 'electron';

// Google AI Studio API Key
const GOOGLE_API_KEY = 'AIzaSyDrspFjr7NcWX9mRP515ik8iaR20Gn3Tfo';

export function setupDesignHandlers() {
    // ==================== Google Stitch Handlers ====================

    // Generate UI from prompt
    ipcMain.handle('design:generateUI', async (_, prompt: string, options: any) => {
        try {
            const { getGoogleStitchService } = await import('../ai/design');
            const service = getGoogleStitchService(GOOGLE_API_KEY);

            const design = await service.generateUI(prompt, options);
            return { success: true, design };
        } catch (error: any) {
            console.error('❌ UI generation error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Generate multiple UI variants
    ipcMain.handle('design:generateVariants', async (_, prompt: string, count: number, options: any) => {
        try {
            const { getGoogleStitchService } = await import('../ai/design');
            const service = getGoogleStitchService(GOOGLE_API_KEY);

            const variants = await service.generateVariants(prompt, count, options);
            return { success: true, variants };
        } catch (error: any) {
            console.error('❌ Variant generation error:', error.message);
            return { success: false, error: error.message, variants: [] };
        }
    });

    // Generate UI from wireframe/screenshot description
    ipcMain.handle('design:generateFromImage', async (_, imageDescription: string, options: any) => {
        try {
            const { getGoogleStitchService } = await import('../ai/design');
            const service = getGoogleStitchService(GOOGLE_API_KEY);

            const design = await service.generateFromImage(imageDescription, options);
            return { success: true, design };
        } catch (error: any) {
            console.error('❌ Image-to-UI error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Generate production code
    ipcMain.handle('design:generateCode', async (_, design: any, framework: string) => {
        try {
            const { getGoogleStitchService } = await import('../ai/design');
            const service = getGoogleStitchService(GOOGLE_API_KEY);

            const code = await service.generateCode(design, framework);
            return { success: true, code };
        } catch (error: any) {
            console.error('❌ Code generation error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // ==================== Nano Banana Pro Handlers ====================

    // Generate optimized image prompt
    ipcMain.handle('design:generateImagePrompt', async (_, prompt: string, options: any) => {
        try {
            const { getNanoBananaService } = await import('../ai/design');
            const service = getNanoBananaService(GOOGLE_API_KEY);

            const result = await service.generateImagePrompt(prompt, options);
            return { success: true, result };
        } catch (error: any) {
            console.error('❌ Image prompt generation error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Generate text-in-image prompt
    ipcMain.handle('design:generateTextImage', async (_, text: string, style: any) => {
        try {
            const { getNanoBananaService } = await import('../ai/design');
            const service = getNanoBananaService(GOOGLE_API_KEY);

            const result = await service.generateTextImage(text, style);
            return { success: true, result };
        } catch (error: any) {
            console.error('❌ Text image generation error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Generate diagram prompt
    ipcMain.handle('design:generateDiagram', async (_, data: any) => {
        try {
            const { getNanoBananaService } = await import('../ai/design');
            const service = getNanoBananaService(GOOGLE_API_KEY);

            const result = await service.generateDiagram(data);
            return { success: true, result };
        } catch (error: any) {
            console.error('❌ Diagram generation error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Generate mockup prompt
    ipcMain.handle('design:generateMockup', async (_, description: string, productType: string) => {
        try {
            const { getNanoBananaService } = await import('../ai/design');
            const service = getNanoBananaService(GOOGLE_API_KEY);

            const result = await service.generateMockup(description, productType);
            return { success: true, result };
        } catch (error: any) {
            console.error('❌ Mockup generation error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Generate character-consistent prompt
    ipcMain.handle('design:generateCharacter', async (_, characterDescription: string, scene: string) => {
        try {
            const { getNanoBananaService } = await import('../ai/design');
            const service = getNanoBananaService(GOOGLE_API_KEY);

            const result = await service.generateCharacterPrompt(characterDescription, scene);
            return { success: true, result };
        } catch (error: any) {
            console.error('❌ Character generation error:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Generate edit instructions
    ipcMain.handle('design:generateEditInstructions', async (_, originalDescription: string, edits: any) => {
        try {
            const { getNanoBananaService } = await import('../ai/design');
            const service = getNanoBananaService(GOOGLE_API_KEY);

            const result = await service.generateEditInstructions(originalDescription, edits);
            return { success: true, result };
        } catch (error: any) {
            console.error('❌ Edit instructions error:', error.message);
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Design generation IPC handlers registered');
}
