/**
 * NpmInstaller - Installer for npm packages
 */

import { BaseInstaller } from './BaseInstaller';
import { InstallOptions } from '../types';

export class NpmInstaller extends BaseInstaller {
    get name(): string {
        return 'npm';
    }

    get packageManager(): string {
        return 'npm';
    }

    protected buildInstallCommand(packageName: string, options: InstallOptions): string {
        const parts = ['npm', 'install'];

        if (options.global) {
            parts.push('-g');
        }

        if (options.saveDev) {
            parts.push('--save-dev');
        }

        if (options.force) {
            parts.push('--force');
        }

        if (options.quiet) {
            parts.push('--quiet');
        }

        parts.push(packageName);

        return parts.join(' ');
    }

    protected buildUninstallCommand(packageName: string): string {
        return `npm uninstall ${packageName}`;
    }

    protected buildUpgradeCommand(packageName: string): string {
        return `npm update ${packageName}`;
    }

    protected buildVersionCommand(packageName: string): string {
        return `npm list ${packageName} --depth=0 2>/dev/null || echo "not installed"`;
    }

    protected parseVersion(output: string): string | null {
        if (output.includes('not installed')) {
            return null;
        }

        const match = output.match(/@(\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    }
}
