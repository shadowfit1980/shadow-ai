/**
 * Module Resolver - Fast module resolution
 */
import { EventEmitter } from 'events';

export interface ResolvedModule { specifier: string; resolved: string; type: 'esm' | 'cjs' | 'builtin' | 'url'; path: string; }
export interface ResolverConfig { conditions: string[]; extensions: string[]; mainFields: string[]; }

export class ModuleResolverEngine extends EventEmitter {
    private static instance: ModuleResolverEngine;
    private cache: Map<string, ResolvedModule> = new Map();
    private config: ResolverConfig = { conditions: ['import', 'require', 'node', 'default'], extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'], mainFields: ['module', 'main', 'browser'] };
    private constructor() { super(); }
    static getInstance(): ModuleResolverEngine { if (!ModuleResolverEngine.instance) ModuleResolverEngine.instance = new ModuleResolverEngine(); return ModuleResolverEngine.instance; }

    async resolve(specifier: string, importer?: string): Promise<ResolvedModule> {
        const cacheKey = `${specifier}:${importer || 'root'}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;
        const isBuiltin = specifier.startsWith('node:') || ['fs', 'path', 'http', 'crypto'].includes(specifier);
        const isUrl = specifier.startsWith('http://') || specifier.startsWith('https://');
        const resolved: ResolvedModule = { specifier, resolved: isBuiltin ? `node:${specifier.replace('node:', '')}` : isUrl ? specifier : `./node_modules/${specifier}/index.js`, type: isBuiltin ? 'builtin' : isUrl ? 'url' : 'esm', path: `/path/to/${specifier}` };
        this.cache.set(cacheKey, resolved); return resolved;
    }

    async resolveAll(specifiers: string[], importer?: string): Promise<ResolvedModule[]> { return Promise.all(specifiers.map(s => this.resolve(s, importer))); }
    setConfig(config: Partial<ResolverConfig>): void { Object.assign(this.config, config); }
    clearCache(): void { this.cache.clear(); }
}
export function getModuleResolverEngine(): ModuleResolverEngine { return ModuleResolverEngine.getInstance(); }
