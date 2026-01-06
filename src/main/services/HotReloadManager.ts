/**
 * 🔥 Hot Reload Manager
 * 
 * Live development experience:
 * - File watching
 * - Auto-rebuild
 * - Browser refresh
 * - State preservation
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface WatchConfig {
    projectPath: string;
    extensions: string[];
    ignored: string[];
    debounceMs: number;
}

export interface ReloadEvent {
    type: 'change' | 'add' | 'delete';
    file: string;
    timestamp: number;
}

export class HotReloadManager extends EventEmitter {
    private static instance: HotReloadManager;
    private watchers: Map<string, fs.FSWatcher> = new Map();
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private config: WatchConfig = {
        projectPath: '',
        extensions: ['.ts', '.js', '.tsx', '.jsx', '.css', '.html', '.json'],
        ignored: ['node_modules', 'dist', '.git', 'build'],
        debounceMs: 300
    };

    private constructor() { super(); }

    static getInstance(): HotReloadManager {
        if (!HotReloadManager.instance) {
            HotReloadManager.instance = new HotReloadManager();
        }
        return HotReloadManager.instance;
    }

    // ========================================================================
    // WATCHING
    // ========================================================================

    startWatching(projectPath: string, config?: Partial<WatchConfig>): void {
        this.stopWatching();

        this.config = { ...this.config, ...config, projectPath };
        this.watchDirectory(projectPath);

        this.emit('watchStarted', { path: projectPath });
    }

    private watchDirectory(dirPath: string): void {
        // Skip ignored directories
        const dirName = path.basename(dirPath);
        if (this.config.ignored.includes(dirName)) return;

        try {
            const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                if (filename) {
                    const filePath = path.join(dirPath, filename);
                    this.handleFileChange(eventType, filePath);
                }
            });

            this.watchers.set(dirPath, watcher);
        } catch (error) {
            console.error(`Failed to watch ${dirPath}:`, error);
        }
    }

    private handleFileChange(eventType: string, filePath: string): void {
        // Check extension
        const ext = path.extname(filePath);
        if (!this.config.extensions.includes(ext)) return;

        // Check ignored
        if (this.config.ignored.some(ignored => filePath.includes(ignored))) return;

        // Debounce
        const existingTimer = this.debounceTimers.get(filePath);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
            const event: ReloadEvent = {
                type: eventType === 'rename' ? (fs.existsSync(filePath) ? 'add' : 'delete') : 'change',
                file: filePath,
                timestamp: Date.now()
            };

            this.emit('fileChanged', event);
            this.triggerReload(event);
            this.debounceTimers.delete(filePath);
        }, this.config.debounceMs);

        this.debounceTimers.set(filePath, timer);
    }

    stopWatching(): void {
        this.watchers.forEach(watcher => watcher.close());
        this.watchers.clear();
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.emit('watchStopped');
    }

    // ========================================================================
    // RELOAD TRIGGERING
    // ========================================================================

    private triggerReload(event: ReloadEvent): void {
        const ext = path.extname(event.file);

        // Different reload strategies based on file type
        if (ext === '.css') {
            this.emit('cssReload', event);
        } else if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
            this.emit('fullReload', event);
        } else if (ext === '.html') {
            this.emit('fullReload', event);
        } else if (ext === '.json') {
            this.emit('dataReload', event);
        }
    }

    // ========================================================================
    // DEV SERVER INTEGRATION
    // ========================================================================

    generateDevServerCode(): string {
        return `
// Hot Reload Client (inject into game)
(function() {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'reload':
                window.location.reload();
                break;
            case 'css':
                reloadCSS(data.file);
                break;
            case 'state':
                restoreState(data.state);
                break;
        }
    };

    ws.onclose = () => {
        console.log('Hot reload disconnected. Retrying...');
        setTimeout(() => window.location.reload(), 1000);
    };

    function reloadCSS(file) {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
            if (link.href.includes(file)) {
                link.href = link.href.split('?')[0] + '?t=' + Date.now();
            }
        });
    }

    function restoreState(state) {
        if (window.game && window.game.restoreState) {
            window.game.restoreState(state);
        }
    }

    // Save state before reload
    window.addEventListener('beforeunload', () => {
        if (window.game && window.game.getState) {
            ws.send(JSON.stringify({
                type: 'saveState',
                state: window.game.getState()
            }));
        }
    });

    console.log('🔥 Hot reload connected');
})();
`;
    }

    generateServerCode(): string {
        return `
// Hot Reload Server
const WebSocket = require('ws');
const chokidar = require('chokidar');

const wss = new WebSocket.Server({ port: 3001 });
let savedState = null;

wss.on('connection', (ws) => {
    console.log('Hot reload client connected');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'saveState') {
            savedState = data.state;
        }
    });

    // Send saved state on reconnect
    if (savedState) {
        ws.send(JSON.stringify({ type: 'state', state: savedState }));
        savedState = null;
    }
});

// Watch files
const watcher = chokidar.watch('src', {
    ignored: /node_modules/,
    persistent: true
});

watcher.on('change', (path) => {
    console.log(\`File changed: \${path}\`);
    
    const type = path.endsWith('.css') ? 'css' : 'reload';
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, file: path }));
        }
    });
});

console.log('Hot reload server running on port 3001');
`;
    }
}

export const hotReloadManager = HotReloadManager.getInstance();
