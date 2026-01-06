
import { ipcMain } from 'electron';
import { PluginMarketplace } from '../ai/plugins/PluginMarketplace';

export function setupPluginHandlers() {
    const marketplace = PluginMarketplace.getInstance();

    ipcMain.handle('plugin:list', async () => {
        return marketplace.getAllPlugins();
    });

    ipcMain.handle('plugin:install', async (_, pluginId: string) => {
        return marketplace.installPlugin(pluginId);
    });

    ipcMain.handle('plugin:uninstall', async (_, pluginId: string) => {
        return marketplace.uninstallPlugin(pluginId);
    });

    ipcMain.handle('plugin:enable', async (_, pluginId: string) => {
        return marketplace.enablePlugin(pluginId);
    });

    ipcMain.handle('plugin:disable', async (_, pluginId: string) => {
        return marketplace.disablePlugin(pluginId);
    });
}
