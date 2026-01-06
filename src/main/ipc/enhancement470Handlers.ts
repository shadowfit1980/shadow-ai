/**
 * Enhancement 470+ IPC Handlers - Canva design platform features
 */

import { ipcMain } from 'electron';

export function setupEnhancement470Handlers(): void {
    // DESIGN CANVAS
    ipcMain.handle('canvas:create', async (_, { name, width, height }: any) => {
        try { const { getDesignCanvasEngine } = await import('../designcanvas/DesignCanvasEngine'); return { success: true, canvas: getDesignCanvasEngine().create(name, width, height) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEMPLATE LIBRARY
    ipcMain.handle('template:search', async (_, { query }: any) => {
        try { const { getTemplateLibraryEngine } = await import('../templatelib/TemplateLibraryEngine'); return { success: true, templates: getTemplateLibraryEngine().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ELEMENTS PANEL
    ipcMain.handle('elements:getByType', async (_, { type }: any) => {
        try { const { getElementsPanelEngine } = await import('../elementspanel/ElementsPanelEngine'); return { success: true, elements: getElementsPanelEngine().getByType(type) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEXT EDITOR
    ipcMain.handle('text:create', async (_, { content, style }: any) => {
        try { const { getTextEditorEngine } = await import('../texteditor/TextEditorEngine'); return { success: true, block: getTextEditorEngine().create(content, style) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // IMAGE EDITOR
    ipcMain.handle('image:load', async (_, { src }: any) => {
        try { const { getImageEditorEngine } = await import('../imageeditor/ImageEditorEngine'); return { success: true, edit: getImageEditorEngine().load(src) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LAYER MANAGER
    ipcMain.handle('layer:create', async (_, { canvasId, name }: any) => {
        try { const { getLayerManagerEngine } = await import('../layermgr/LayerManagerEngine'); return { success: true, layer: getLayerManagerEngine().create(canvasId, name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // EXPORT ENGINE
    ipcMain.handle('export:design', async (_, { canvasId, config }: any) => {
        try { const { getExportEngineCore } = await import('../exporteng/ExportEngineCore'); return { success: true, result: await getExportEngineCore().export(canvasId, config) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BRAND KIT
    ipcMain.handle('brand:create', async (_, { name, colors }: any) => {
        try { const { getBrandKitEngine } = await import('../brandkit/BrandKitEngine'); return { success: true, kit: getBrandKitEngine().create(name, colors) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COLLAB EDITOR
    ipcMain.handle('collab:start', async (_, { canvasId, owner }: any) => {
        try { const { getCollabEditorEngine } = await import('../collabeditor/CollabEditorEngine'); return { success: true, session: getCollabEditorEngine().startSession(canvasId, owner) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MAGIC RESIZE
    ipcMain.handle('resize:magic', async (_, { canvasId, presetId }: any) => {
        try { const { getMagicResizeEngine } = await import('../magicresize/MagicResizeEngine'); return { success: true, result: await getMagicResizeEngine().resize(canvasId, presetId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 470+ IPC handlers registered (10 handlers)');
}
