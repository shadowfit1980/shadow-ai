/**
 * Deeplink Handler
 * Handles shadow-ai:// URL scheme for app launching
 * Similar to Cursor's deeplink support
 */

import { app, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { parse as parseUrl } from 'url';

export interface DeeplinkAction {
    type: 'open' | 'task' | 'chat' | 'file' | 'unknown';
    params: Record<string, string>;
}

export interface OpenParams {
    path?: string;
    file?: string;
    line?: number;
    column?: number;
    newWindow?: boolean;
}

export interface TaskParams {
    description: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    workspace?: string;
}

export interface ChatParams {
    message: string;
    context?: string;
}

/**
 * DeeplinkHandler
 * Manages shadow-ai:// URL protocol handling
 */
export class DeeplinkHandler extends EventEmitter {
    private static instance: DeeplinkHandler;
    private isRegistered = false;
    private pendingUrl: string | null = null;
    private mainWindow: BrowserWindow | null = null;

    private constructor() {
        super();
    }

    static getInstance(): DeeplinkHandler {
        if (!DeeplinkHandler.instance) {
            DeeplinkHandler.instance = new DeeplinkHandler();
        }
        return DeeplinkHandler.instance;
    }

    /**
     * Register the URL protocol handler
     */
    register(): void {
        if (this.isRegistered) return;

        const PROTOCOL = 'shadow-ai';

        // Register as default protocol client
        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [process.argv[1]]);
            }
        } else {
            app.setAsDefaultProtocolClient(PROTOCOL);
        }

        // Handle protocol URL on macOS
        app.on('open-url', (event, url) => {
            event.preventDefault();
            this.handleUrl(url);
        });

        // Handle protocol URL on Windows/Linux (via argv)
        const gotTheLock = app.requestSingleInstanceLock();

        if (!gotTheLock) {
            // Another instance is running, quit this one
            // The other instance will handle the URL
            app.quit();
        } else {
            app.on('second-instance', (event, commandLine) => {
                // Find the URL in command line args
                const url = commandLine.find(arg => arg.startsWith('shadow-ai://'));
                if (url) {
                    this.handleUrl(url);
                }

                // Focus existing window
                if (this.mainWindow) {
                    if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                    this.mainWindow.focus();
                }
            });
        }

        // Check for pending URL from startup
        const startupUrl = process.argv.find(arg => arg.startsWith('shadow-ai://'));
        if (startupUrl) {
            this.pendingUrl = startupUrl;
        }

        this.isRegistered = true;
        console.log('✅ Deeplink handler registered for shadow-ai://');
    }

    /**
     * Set the main window reference
     */
    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window;

        // Process any pending URL
        if (this.pendingUrl) {
            this.handleUrl(this.pendingUrl);
            this.pendingUrl = null;
        }
    }

    /**
     * Handle an incoming URL
     */
    handleUrl(url: string): void {
        console.log('📎 Handling deeplink:', url);

        const action = this.parseDeeplink(url);

        if (!this.mainWindow) {
            // Window not ready yet, store for later
            this.pendingUrl = url;
            return;
        }

        switch (action.type) {
            case 'open':
                this.handleOpen(action.params);
                break;
            case 'task':
                this.handleTask(action.params);
                break;
            case 'chat':
                this.handleChat(action.params);
                break;
            case 'file':
                this.handleFile(action.params);
                break;
            default:
                console.warn('Unknown deeplink action:', action.type);
        }

        // Emit event for external listeners
        this.emit('deeplink', action);
    }

    /**
     * Parse a deeplink URL into an action
     */
    parseDeeplink(url: string): DeeplinkAction {
        try {
            const parsed = parseUrl(url, true);
            const host = parsed.host || parsed.pathname?.replace(/^\//, '') || 'unknown';
            const params: Record<string, string> = {};

            // Parse query parameters
            if (parsed.query) {
                for (const [key, value] of Object.entries(parsed.query)) {
                    if (typeof value === 'string') {
                        params[key] = decodeURIComponent(value);
                    } else if (Array.isArray(value) && value.length > 0) {
                        params[key] = decodeURIComponent(value[0]);
                    }
                }
            }

            return {
                type: host as DeeplinkAction['type'],
                params,
            };
        } catch (error) {
            console.error('Failed to parse deeplink:', error);
            return { type: 'unknown', params: {} };
        }
    }

    /**
     * Generate a deeplink URL
     */
    generateDeeplink(action: string, params: Record<string, string>): string {
        const queryParts = Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        return `shadow-ai://${action}${queryParts ? `?${queryParts}` : ''}`;
    }

    // Private handlers

    private handleOpen(params: Record<string, string>): void {
        const openParams: OpenParams = {
            path: params.path,
            file: params.file,
            line: params.line ? parseInt(params.line, 10) : undefined,
            column: params.column ? parseInt(params.column, 10) : undefined,
            newWindow: params.newWindow === 'true',
        };

        console.log('Opening:', openParams);

        // Send to renderer
        this.mainWindow?.webContents.send('deeplink:open', openParams);
        this.emit('open', openParams);
    }

    private handleTask(params: Record<string, string>): void {
        const taskParams: TaskParams = {
            description: params.description || params.d || '',
            priority: (params.priority || 'normal') as TaskParams['priority'],
            workspace: params.workspace,
        };

        console.log('Task:', taskParams);

        // Send to renderer
        this.mainWindow?.webContents.send('deeplink:task', taskParams);
        this.emit('task', taskParams);
    }

    private handleChat(params: Record<string, string>): void {
        const chatParams: ChatParams = {
            message: params.message || params.m || '',
            context: params.context,
        };

        console.log('Chat:', chatParams);

        // Send to renderer
        this.mainWindow?.webContents.send('deeplink:chat', chatParams);
        this.emit('chat', chatParams);
    }

    private handleFile(params: Record<string, string>): void {
        // Same as open but specifically for files
        this.handleOpen({ ...params, file: params.path || params.file });
    }
}

// Singleton getter
export function getDeeplinkHandler(): DeeplinkHandler {
    return DeeplinkHandler.getInstance();
}
