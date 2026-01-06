/**
 * Package Manager Integration
 * 
 * Unified interface for npm, yarn, pnpm, and bun.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

interface PackageInfo {
    name: string;
    version: string;
    latest?: string;
    outdated?: boolean;
}

export class PackageManagerIntegration extends EventEmitter {
    private static instance: PackageManagerIntegration;

    private constructor() { super(); }

    static getInstance(): PackageManagerIntegration {
        if (!PackageManagerIntegration.instance) {
            PackageManagerIntegration.instance = new PackageManagerIntegration();
        }
        return PackageManagerIntegration.instance;
    }

    detectManager(projectPath: string): PackageManager {
        if (fs.existsSync(path.join(projectPath, 'bun.lockb'))) return 'bun';
        if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
        if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
        return 'npm';
    }

    async install(projectPath: string, packages?: string[], dev = false): Promise<string> {
        const pm = this.detectManager(projectPath);
        const pkgStr = packages?.join(' ') || '';
        const devFlag = { npm: '-D', yarn: '-D', pnpm: '-D', bun: '-d' }[pm];

        let cmd = { npm: 'npm install', yarn: 'yarn add', pnpm: 'pnpm add', bun: 'bun add' }[pm];
        if (pkgStr) cmd += ` ${pkgStr}`;
        if (dev && pkgStr) cmd += ` ${devFlag}`;

        const { stdout } = await execAsync(cmd, { cwd: projectPath });
        this.emit('install:complete', { packages, dev });
        return stdout;
    }

    async remove(projectPath: string, packages: string[]): Promise<string> {
        const pm = this.detectManager(projectPath);
        const cmd = { npm: 'npm uninstall', yarn: 'yarn remove', pnpm: 'pnpm remove', bun: 'bun remove' }[pm];
        const { stdout } = await execAsync(`${cmd} ${packages.join(' ')}`, { cwd: projectPath });
        return stdout;
    }

    async listOutdated(projectPath: string): Promise<PackageInfo[]> {
        const pm = this.detectManager(projectPath);
        try {
            const cmd = { npm: 'npm outdated --json', yarn: 'yarn outdated --json', pnpm: 'pnpm outdated --json', bun: 'bun outdated' }[pm];
            const { stdout } = await execAsync(cmd, { cwd: projectPath });
            const data = JSON.parse(stdout || '{}');
            return Object.entries(data).map(([name, info]: [string, any]) => ({
                name,
                version: info.current || info.wanted,
                latest: info.latest,
                outdated: true
            }));
        } catch (e) {
            return [];
        }
    }

    async runScript(projectPath: string, script: string): Promise<string> {
        const pm = this.detectManager(projectPath);
        const cmd = { npm: 'npm run', yarn: 'yarn', pnpm: 'pnpm', bun: 'bun run' }[pm];
        const { stdout } = await execAsync(`${cmd} ${script}`, { cwd: projectPath });
        return stdout;
    }

    getPackageJson(projectPath: string): any {
        const pkgPath = path.join(projectPath, 'package.json');
        return fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) : {};
    }

    async search(query: string): Promise<{ name: string; description: string; version: string }[]> {
        try {
            const { stdout } = await execAsync(`npm search ${query} --json`);
            return JSON.parse(stdout).slice(0, 10).map((p: any) => ({
                name: p.name,
                description: p.description,
                version: p.version
            }));
        } catch (e) {
            return [];
        }
    }
}

export const packageManagerIntegration = PackageManagerIntegration.getInstance();
