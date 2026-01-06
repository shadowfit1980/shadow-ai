/**
 * File Watcher
 * Watch files for changes
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface WatchedFile {
    path: string;
    lastModified: number;
}

/**
 * FileWatcher
 * Monitor file changes
 */
export class FileWatcher extends EventEmitter {
    private static instance: FileWatcher;
    private watchers: Map<string, fs.FSWatcher> = new Map();
    private watched: Map<string, WatchedFile> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): FileWatcher {
        if (!FileWatcher.instance) {
            FileWatcher.instance = new FileWatcher();
        }
        return FileWatcher.instance;
    }

    watch(filePath: string): boolean {
        if (this.watchers.has(filePath)) return false;

        try {
            const watcher = fs.watch(filePath, (event, filename) => {
                this.emit('change', { path: filePath, event, filename });
            });

            this.watchers.set(filePath, watcher);
            this.watched.set(filePath, { path: filePath, lastModified: Date.now() });
            this.emit('watching', { path: filePath });
            return true;
        } catch {
            return false;
        }
    }

    unwatch(filePath: string): boolean {
        const watcher = this.watchers.get(filePath);
        if (!watcher) return false;

        watcher.close();
        this.watchers.delete(filePath);
        this.watched.delete(filePath);
        this.emit('unwatched', { path: filePath });
        return true;
    }

    unwatchAll(): void {
        for (const [path, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();
        this.watched.clear();
        this.emit('allUnwatched');
    }

    getWatched(): WatchedFile[] {
        return Array.from(this.watched.values());
    }

    isWatching(filePath: string): boolean {
        return this.watchers.has(filePath);
    }
}

export function getFileWatcher(): FileWatcher {
    return FileWatcher.getInstance();
}
