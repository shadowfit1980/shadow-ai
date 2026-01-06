/**
 * Breadcrumb Navigation - File path breadcrumbs
 */
import { EventEmitter } from 'events';

export interface Breadcrumb { label: string; path: string; symbol?: string; kind?: 'file' | 'folder' | 'class' | 'function'; }

export class BreadcrumbNavigation extends EventEmitter {
    private static instance: BreadcrumbNavigation;
    private currentPath: Breadcrumb[] = [];
    private constructor() { super(); }
    static getInstance(): BreadcrumbNavigation { if (!BreadcrumbNavigation.instance) BreadcrumbNavigation.instance = new BreadcrumbNavigation(); return BreadcrumbNavigation.instance; }

    setPath(filePath: string, symbol?: { name: string; kind: 'class' | 'function' }): Breadcrumb[] {
        const parts = filePath.split('/').filter(Boolean);
        this.currentPath = parts.map((p, i) => ({ label: p, path: '/' + parts.slice(0, i + 1).join('/'), kind: (i === parts.length - 1 ? 'file' : 'folder') as 'file' | 'folder' }));
        if (symbol) this.currentPath.push({ label: symbol.name, path: filePath, symbol: symbol.name, kind: symbol.kind });
        this.emit('changed', this.currentPath);
        return this.currentPath;
    }

    get(): Breadcrumb[] { return [...this.currentPath]; }
    navigateTo(index: number): string | null { if (index >= this.currentPath.length) return null; this.currentPath = this.currentPath.slice(0, index + 1); return this.currentPath[index]?.path || null; }
}
export function getBreadcrumbNavigation(): BreadcrumbNavigation { return BreadcrumbNavigation.getInstance(); }
