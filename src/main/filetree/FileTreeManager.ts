/**
 * FileTree Manager - File system tree
 */
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileNode { name: string; path: string; type: 'file' | 'directory'; size?: number; children?: FileNode[]; }

export class FileTreeManager extends EventEmitter {
    private static instance: FileTreeManager;
    private cache: Map<string, FileNode> = new Map();
    private constructor() { super(); }
    static getInstance(): FileTreeManager { if (!FileTreeManager.instance) FileTreeManager.instance = new FileTreeManager(); return FileTreeManager.instance; }

    async getTree(rootPath: string, depth = 3): Promise<FileNode> {
        const build = async (p: string, d: number): Promise<FileNode> => {
            const stats = await fs.stat(p);
            const node: FileNode = { name: path.basename(p), path: p, type: stats.isDirectory() ? 'directory' : 'file', size: stats.size };
            if (stats.isDirectory() && d > 0) {
                const entries = await fs.readdir(p);
                node.children = await Promise.all(entries.slice(0, 100).map(e => build(path.join(p, e), d - 1).catch(() => null))).then(r => r.filter(Boolean) as FileNode[]);
            }
            return node;
        };
        const tree = await build(rootPath, depth);
        this.cache.set(rootPath, tree);
        return tree;
    }

    getCached(rootPath: string): FileNode | null { return this.cache.get(rootPath) || null; }
    clearCache(): void { this.cache.clear(); }
}

export function getFileTreeManager(): FileTreeManager { return FileTreeManager.getInstance(); }
