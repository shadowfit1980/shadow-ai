/**
 * BrewInstaller - Installer for Homebrew packages (macOS/Linux)
 */

import { BaseInstaller } from './BaseInstaller';
import { InstallOptions } from '../types';

export class BrewInstaller extends BaseInstaller {
    get name(): string {
        return 'homebrew';
    }

    get packageManager(): string {
        return 'brew';
    }

    protected buildInstallCommand(packageName: string, options: InstallOptions): string {
        const parts = ['brew', 'install'];

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
        return `brew uninstall ${packageName}`;
    }

    protected buildUpgradeCommand(packageName: string): string {
        return `brew upgrade ${packageName}`;
    }

    protected buildVersionCommand(packageName: string): string {
        return `brew list --versions ${packageName} 2>/dev/null || echo "not installed"`;
    }

    protected parseVersion(output: string): string | null {
        if (output.includes('not installed')) {
            return null;
        }

        const match = output.match(/([\d.]+)/);
        return match ? match[1] : null;
    }
}
