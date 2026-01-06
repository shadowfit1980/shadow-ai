/**
 * Enhancement 140+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupEnhancement140Handlers(): void {
    // LOCALIZATION
    ipcMain.handle('localization:setLocale', async (_, { locale }: any) => {
        try { const { getLocalizationManager } = await import('../localization/LocalizationManager'); getLocalizationManager().setLocale(locale); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('localization:t', async (_, { key }: any) => {
        try { const { getLocalizationManager } = await import('../localization/LocalizationManager'); return { success: true, text: getLocalizationManager().t(key) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ACCESSIBILITY
    ipcMain.handle('accessibility:getSettings', async () => {
        try { const { getAccessibilityManager } = await import('../accessibility/AccessibilityManager'); return { success: true, settings: getAccessibilityManager().getSettings() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // THEMING
    ipcMain.handle('theming:setTheme', async (_, { id }: any) => {
        try { const { getThemeManager2 } = await import('../theming/ThemeManager2'); return { success: getThemeManager2().setTheme(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('theming:getAll', async () => {
        try { const { getThemeManager2 } = await import('../theming/ThemeManager2'); return { success: true, themes: getThemeManager2().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FONTS
    ipcMain.handle('fonts:getAll', async () => {
        try { const { getFontManager } = await import('../fonts/FontManager'); return { success: true, fonts: getFontManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ICONS
    ipcMain.handle('icons:search', async (_, { query }: any) => {
        try { const { getIconManager } = await import('../icons/IconManager'); return { success: true, icons: getIconManager().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SOUNDS
    ipcMain.handle('sounds:play', async (_, { id }: any) => {
        try { const { getSoundManager } = await import('../sounds/SoundManager'); getSoundManager().play(id); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ANIMATIONS
    ipcMain.handle('animations:isEnabled', async () => {
        try { const { getAnimationManager } = await import('../animations/AnimationManager'); return { success: true, enabled: getAnimationManager().isEnabled() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SHORTCUTS
    ipcMain.handle('shortcuts:getAll', async () => {
        try { const { getShortcutsManager } = await import('../shortcuts/ShortcutsManager'); return { success: true, shortcuts: getShortcutsManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // GESTURES
    ipcMain.handle('gestures:getAll', async () => {
        try { const { getGestureManager } = await import('../gestures/GestureManager'); return { success: true, gestures: getGestureManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FOCUS
    ipcMain.handle('focus:next', async () => {
        try { const { getFocusManager } = await import('../focus/FocusManager'); return { success: true, element: getFocusManager().focusNext() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 140+ IPC handlers registered (12 handlers)');
}
