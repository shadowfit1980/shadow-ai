/**
 * Package Manager Service - Dependency management
 */
import { EventEmitter } from 'events';

export interface Package { name: string; version: string; dev: boolean; size?: number; }
export interface PackageJson { name: string; version: string; dependencies: Record<string, string>; devDependencies: Record<string, string>; }

export class PackageManagerService extends EventEmitter {
    private static instance: PackageManagerService;
    private packages: Map<string, Package> = new Map();
    private constructor() { super(); }
    static getInstance(): PackageManagerService { if (!PackageManagerService.instance) PackageManagerService.instance = new PackageManagerService(); return PackageManagerService.instance; }

    async install(name: string, version = 'latest', dev = false): Promise<Package> {
        const pkg: Package = { name, version, dev, size: Math.floor(Math.random() * 1000) };
        this.packages.set(name, pkg);
        this.emit('installed', pkg);
        return pkg;
    }

    async uninstall(name: string): Promise<boolean> { const result = this.packages.delete(name); this.emit('uninstalled', name); return result; }
    async update(name: string): Promise<Package | null> { const pkg = this.packages.get(name); if (!pkg) return null; pkg.version = 'latest'; return pkg; }
    async search(query: string): Promise<{ name: string; description: string }[]> { return [{ name: query, description: 'Matching package' }]; }
    getInstalled(): Package[] { return Array.from(this.packages.values()); }
    generatePackageJson(): PackageJson { const deps: Record<string, string> = {}; const devDeps: Record<string, string> = {}; this.packages.forEach(p => p.dev ? devDeps[p.name] = p.version : deps[p.name] = p.version); return { name: 'project', version: '1.0.0', dependencies: deps, devDependencies: devDeps }; }
}
export function getPackageManagerService(): PackageManagerService { return PackageManagerService.getInstance(); }
