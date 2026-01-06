/**
 * VS Code Importer
 * Import extensions, themes, and keybindings from VS Code
 * Similar to Cursor's 1-click import feature
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface VSCodeExtension {
    id: string;
    name: string;
    publisher: string;
    version: string;
    installed: boolean;
}

export interface VSCodeTheme {
    name: string;
    type: 'dark' | 'light' | 'hc';
    path: string;
}

export interface VSCodeKeybinding {
    key: string;
    command: string;
    when?: string;
}

export interface VSCodeSettings {
    [key: string]: any;
}

export interface ImportResult {
    extensions: VSCodeExtension[];
    themes: string[];
    keybindings: VSCodeKeybinding[];
    settings: VSCodeSettings;
}

/**
 * VSCodeImporter
 * Imports VS Code configuration for Shadow AI
 */
export class VSCodeImporter extends EventEmitter {
    private static instance: VSCodeImporter;
    private vscodePath: string;

    private constructor() {
        super();
        this.vscodePath = this.getVSCodePath();
    }

    static getInstance(): VSCodeImporter {
        if (!VSCodeImporter.instance) {
            VSCodeImporter.instance = new VSCodeImporter();
        }
        return VSCodeImporter.instance;
    }

    /**
     * Get VS Code user data path based on platform
     */
    private getVSCodePath(): string {
        const home = os.homedir();
        switch (process.platform) {
            case 'darwin':
                return path.join(home, 'Library', 'Application Support', 'Code', 'User');
            case 'win32':
                return path.join(process.env.APPDATA || '', 'Code', 'User');
            default:
                return path.join(home, '.config', 'Code', 'User');
        }
    }

    /**
     * Check if VS Code is installed
     */
    async isVSCodeInstalled(): Promise<boolean> {
        try {
            await fs.access(this.vscodePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get installed extensions
     */
    async getExtensions(): Promise<VSCodeExtension[]> {
        const extensions: VSCodeExtension[] = [];

        try {
            const extensionsPath = path.join(path.dirname(this.vscodePath), 'extensions');
            const entries = await fs.readdir(extensionsPath, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.isDirectory()) continue;

                const packageJsonPath = path.join(extensionsPath, entry.name, 'package.json');
                try {
                    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

                    extensions.push({
                        id: `${packageJson.publisher}.${packageJson.name}`,
                        name: packageJson.displayName || packageJson.name,
                        publisher: packageJson.publisher,
                        version: packageJson.version,
                        installed: true,
                    });
                } catch {
                    // Invalid extension, skip
                }
            }
        } catch {
            // Extensions folder not found
        }

        this.emit('extensionsLoaded', extensions);
        return extensions;
    }

    /**
     * Get user settings
     */
    async getSettings(): Promise<VSCodeSettings> {
        try {
            const settingsPath = path.join(this.vscodePath, 'settings.json');
            const content = await fs.readFile(settingsPath, 'utf-8');
            // Remove comments from JSON
            const cleaned = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            return JSON.parse(cleaned);
        } catch {
            return {};
        }
    }

    /**
     * Get keybindings
     */
    async getKeybindings(): Promise<VSCodeKeybinding[]> {
        try {
            const keybindingsPath = path.join(this.vscodePath, 'keybindings.json');
            const content = await fs.readFile(keybindingsPath, 'utf-8');
            // Remove comments from JSON
            const cleaned = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            return JSON.parse(cleaned);
        } catch {
            return [];
        }
    }

    /**
     * Get installed themes
     */
    async getThemes(): Promise<string[]> {
        const themes: string[] = [];
        const settings = await this.getSettings();

        // Current theme
        if (settings['workbench.colorTheme']) {
            themes.push(settings['workbench.colorTheme']);
        }

        // Get from extensions
        const extensions = await this.getExtensions();
        for (const ext of extensions) {
            if (ext.name.toLowerCase().includes('theme')) {
                themes.push(ext.name);
            }
        }

        return [...new Set(themes)];
    }

    /**
     * Import all VS Code configuration
     */
    async importAll(): Promise<ImportResult> {
        this.emit('importStarted');

        const [extensions, settings, keybindings, themes] = await Promise.all([
            this.getExtensions(),
            this.getSettings(),
            this.getKeybindings(),
            this.getThemes(),
        ]);

        const result: ImportResult = {
            extensions,
            themes,
            keybindings,
            settings,
        };

        this.emit('importCompleted', result);
        return result;
    }

    /**
     * Export configuration for Shadow AI
     */
    async exportForShadowAI(targetPath: string): Promise<void> {
        const result = await this.importAll();

        // Export as Shadow AI config
        const config = {
            imported: {
                from: 'vscode',
                date: new Date().toISOString(),
            },
            editor: {
                theme: result.settings['workbench.colorTheme'] || 'dark',
                fontSize: result.settings['editor.fontSize'] || 14,
                fontFamily: result.settings['editor.fontFamily'] || 'Consolas',
                tabSize: result.settings['editor.tabSize'] || 2,
                wordWrap: result.settings['editor.wordWrap'] || 'off',
                minimap: result.settings['editor.minimap.enabled'] ?? true,
            },
            extensions: result.extensions.map(e => ({
                id: e.id,
                name: e.name,
            })),
            keybindings: result.keybindings,
        };

        await fs.writeFile(targetPath, JSON.stringify(config, null, 2));
        this.emit('exported', { targetPath });
    }

    /**
     * Get editor preferences for quick import
     */
    async getEditorPreferences(): Promise<{
        theme: string;
        fontSize: number;
        fontFamily: string;
        tabSize: number;
    }> {
        const settings = await this.getSettings();

        return {
            theme: settings['workbench.colorTheme'] || 'Default Dark',
            fontSize: settings['editor.fontSize'] || 14,
            fontFamily: settings['editor.fontFamily'] || 'Consolas, Monaco, monospace',
            tabSize: settings['editor.tabSize'] || 2,
        };
    }

    /**
     * Get commonly used extensions categories
     */
    categorizeExtensions(extensions: VSCodeExtension[]): Record<string, VSCodeExtension[]> {
        const categories: Record<string, VSCodeExtension[]> = {
            'Language Support': [],
            'Themes': [],
            'Linters': [],
            'Git': [],
            'AI': [],
            'Productivity': [],
            'Other': [],
        };

        for (const ext of extensions) {
            const name = ext.name.toLowerCase();
            const id = ext.id.toLowerCase();

            if (name.includes('theme') || name.includes('icon')) {
                categories['Themes'].push(ext);
            } else if (name.includes('eslint') || name.includes('prettier') || name.includes('lint')) {
                categories['Linters'].push(ext);
            } else if (name.includes('git') || id.includes('git')) {
                categories['Git'].push(ext);
            } else if (name.includes('copilot') || name.includes('ai') || name.includes('gpt')) {
                categories['AI'].push(ext);
            } else if (name.includes('python') || name.includes('typescript') || name.includes('java') || name.includes('go')) {
                categories['Language Support'].push(ext);
            } else {
                categories['Other'].push(ext);
            }
        }

        return categories;
    }
}

// Singleton getter
export function getVSCodeImporter(): VSCodeImporter {
    return VSCodeImporter.getInstance();
}
