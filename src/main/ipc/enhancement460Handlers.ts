/**
 * Enhancement 460+ IPC Handlers - DynaUI animated component features
 */

import { ipcMain } from 'electron';

export function setupEnhancement460Handlers(): void {
    // ANIMATION LIBRARY
    ipcMain.handle('anim:get', async (_, { name }: any) => {
        try { const { getAnimationLibraryEngine } = await import('../animlib/AnimationLibraryEngine'); return { success: true, animation: getAnimationLibraryEngine().get(name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COMPONENT BUILDER
    ipcMain.handle('component:create', async (_, { type, name, props }: any) => {
        try { const { getComponentBuilderEngine } = await import('../compbuilder/ComponentBuilderEngine'); return { success: true, component: getComponentBuilderEngine().create(type, name, props) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // THEME GENERATOR
    ipcMain.handle('theme:create', async (_, { name, base, overrides }: any) => {
        try { const { getThemeGeneratorEngine } = await import('../themegen/ThemeGeneratorEngine'); return { success: true, theme: getThemeGeneratorEngine().create(name, base, overrides) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MOTION PRESETS
    ipcMain.handle('motion:get', async (_, { name }: any) => {
        try { const { getMotionPresetsEngine } = await import('../motionpresets/MotionPresetsEngine'); return { success: true, preset: getMotionPresetsEngine().get(name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // GRADIENT ENGINE
    ipcMain.handle('gradient:create', async (_, { type, name, stops, angle }: any) => {
        try { const { getGradientEngineCore } = await import('../gradienteng/GradientEngineCore'); return { success: true, gradient: getGradientEngineCore().create(type, name, stops, angle) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ICON SYSTEM
    ipcMain.handle('icon:search', async (_, { query }: any) => {
        try { const { getIconSystemEngine } = await import('../iconsystem/IconSystemEngine'); return { success: true, icons: getIconSystemEngine().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LAYOUT GRID
    ipcMain.handle('layout:get', async (_, { templateId }: any) => {
        try { const { getLayoutGridEngine } = await import('../layoutgrid/LayoutGridEngine'); return { success: true, template: getLayoutGridEngine().get(templateId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INTERACTION STATE
    ipcMain.handle('interaction:create', async (_, { name, states, initial }: any) => {
        try { const { getInteractionStateEngine } = await import('../interactionstate/InteractionStateEngine'); return { success: true, interaction: getInteractionStateEngine().create(name, states, initial) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VARIANT MANAGER
    ipcMain.handle('variant:getStyles', async (_, { component, selections }: any) => {
        try { const { getVariantManagerEngine } = await import('../variantmgr/VariantManagerEngine'); return { success: true, styles: getVariantManagerEngine().getStyles(component, selections) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PREVIEW RENDERER
    ipcMain.handle('preview:render', async (_, { component, props }: any) => {
        try { const { getPreviewRendererEngine } = await import('../previewrender/PreviewRendererEngine'); return { success: true, preview: getPreviewRendererEngine().render(component, props) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 460+ IPC handlers registered (10 handlers)');
}
