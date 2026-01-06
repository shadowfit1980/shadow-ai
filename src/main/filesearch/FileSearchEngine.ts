/**
 * File Search - Fast file finding
 */
import { EventEmitter } from 'events';

export interface FileResult { path: string; name: string; type: 'file' | 'folder'; size?: number; modified?: number; matchScore: number; }
export interface SearchOptions { pattern: string; includeHidden: boolean; maxResults: number; extensions?: string[]; }

export class FileSearchEngine extends EventEmitter {
    private static instance: FileSearchEngine;
    private indexedFiles: FileResult[] = [];
    private constructor() { super(); }
    static getInstance(): FileSearchEngine { if (!FileSearchEngine.instance) FileSearchEngine.instance = new FileSearchEngine(); return FileSearchEngine.instance; }

    index(files: Omit<FileResult, 'matchScore'>[]): void { this.indexedFiles = files.map(f => ({ ...f, matchScore: 0 })); this.emit('indexed', { count: files.length }); }

    search(options: SearchOptions): FileResult[] {
        const pattern = options.pattern.toLowerCase();
        let results = this.indexedFiles.filter(f => {
            if (!options.includeHidden && f.name.startsWith('.')) return false;
            if (options.extensions?.length && !options.extensions.some(ext => f.name.endsWith(`.${ext}`))) return false;
            return f.name.toLowerCase().includes(pattern) || f.path.toLowerCase().includes(pattern);
        });
        results = results.map(r => ({ ...r, matchScore: r.name.toLowerCase() === pattern ? 1 : r.name.toLowerCase().startsWith(pattern) ? 0.8 : 0.5 }));
        results.sort((a, b) => b.matchScore - a.matchScore);
        return results.slice(0, options.maxResults);
    }

    fuzzySearch(query: string, maxResults = 20): FileResult[] { return this.search({ pattern: query, includeHidden: false, maxResults }); }
    getByExtension(ext: string): FileResult[] { return this.indexedFiles.filter(f => f.name.endsWith(`.${ext}`)); }
    getRecent(limit = 10): FileResult[] { return [...this.indexedFiles].sort((a, b) => (b.modified || 0) - (a.modified || 0)).slice(0, limit); }
}
export function getFileSearchEngine(): FileSearchEngine { return FileSearchEngine.getInstance(); }
