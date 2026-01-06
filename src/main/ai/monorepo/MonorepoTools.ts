/**
 * Monorepo Tools
 * 
 * Tools for managing monorepo workspaces.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

interface Workspace {
    name: string;
    path: string;
    version: string;
    dependencies: string[];
    scripts: string[];
}

interface MonorepoInfo {
    type: 'npm' | 'yarn' | 'pnpm' | 'turborepo' | 'nx' | 'lerna';
    root: string;
    workspaces: Workspace[];
}

export class MonorepoTools extends EventEmitter {
    private static instance: MonorepoTools;

    private constructor() { super(); }

    static getInstance(): MonorepoTools {
        if (!MonorepoTools.instance) {
            MonorepoTools.instance = new MonorepoTools();
        }
        return MonorepoTools.instance;
    }

    detectMonorepo(rootPath: string): MonorepoInfo | null {
        // Check for various monorepo tools
        if (fs.existsSync(path.join(rootPath, 'turbo.json'))) {
            return this.parseMonorepo(rootPath, 'turborepo');
        }
        if (fs.existsSync(path.join(rootPath, 'nx.json'))) {
            return this.parseMonorepo(rootPath, 'nx');
        }
        if (fs.existsSync(path.join(rootPath, 'lerna.json'))) {
            return this.parseMonorepo(rootPath, 'lerna');
        }
        if (fs.existsSync(path.join(rootPath, 'pnpm-workspace.yaml'))) {
            return this.parseMonorepo(rootPath, 'pnpm');
        }

        // Check package.json workspaces
        const pkgPath = path.join(rootPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            if (pkg.workspaces) {
                return this.parseMonorepo(rootPath, 'npm');
            }
        }

        return null;
    }

    private parseMonorepo(rootPath: string, type: MonorepoInfo['type']): MonorepoInfo {
        const workspaces = this.findWorkspaces(rootPath);
        return { type, root: rootPath, workspaces };
    }

    private findWorkspaces(rootPath: string): Workspace[] {
        const workspaces: Workspace[] = [];
        const pkgPath = path.join(rootPath, 'package.json');

        if (!fs.existsSync(pkgPath)) return workspaces;

        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : (pkg.workspaces?.packages || []);

        for (const pattern of patterns) {
            const basePath = pattern.replace('/*', '');
            const fullPath = path.join(rootPath, basePath);
            if (!fs.existsSync(fullPath)) continue;

            const entries = fs.readdirSync(fullPath, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const wsPkgPath = path.join(fullPath, entry.name, 'package.json');
                if (!fs.existsSync(wsPkgPath)) continue;

                const wsPkg = JSON.parse(fs.readFileSync(wsPkgPath, 'utf-8'));
                workspaces.push({
                    name: wsPkg.name,
                    path: path.join(basePath, entry.name),
                    version: wsPkg.version || '0.0.0',
                    dependencies: Object.keys(wsPkg.dependencies || {}),
                    scripts: Object.keys(wsPkg.scripts || {})
                });
            }
        }

        return workspaces;
    }

    getDependencyGraph(info: MonorepoInfo): Record<string, string[]> {
        const graph: Record<string, string[]> = {};
        const names = new Set(info.workspaces.map(w => w.name));

        for (const ws of info.workspaces) {
            graph[ws.name] = ws.dependencies.filter(d => names.has(d));
        }

        return graph;
    }

    generateWorkspace(rootPath: string, name: string, type: 'app' | 'lib'): { files: Record<string, string> } {
        const wsPath = type === 'app' ? 'apps' : 'packages';
        const files: Record<string, string> = {};

        files[`${wsPath}/${name}/package.json`] = JSON.stringify({
            name: `@workspace/${name}`,
            version: '0.0.0',
            main: 'src/index.ts',
            scripts: { build: 'tsc', test: 'jest' }
        }, null, 2);

        files[`${wsPath}/${name}/src/index.ts`] = type === 'lib'
            ? `export const ${name} = () => '${name}';\n`
            : `console.log('${name} app');\n`;

        files[`${wsPath}/${name}/tsconfig.json`] = JSON.stringify({
            extends: '../../tsconfig.base.json',
            compilerOptions: { outDir: './dist' }
        }, null, 2);

        return { files };
    }
}

export const monorepoTools = MonorepoTools.getInstance();
