/**
 * PipInstaller - Installer for Python packages
 */

import { BaseInstaller } from './BaseInstaller';
import { InstallOptions } from '../types';

export class PipInstaller extends BaseInstaller {
    get name(): string {
        return 'pip';
    }

    get packageManager(): string {
        return 'pip3';
    }

    protected buildInstallCommand(packageName: string, options: InstallOptions): string {
        const parts = ['pip3', 'install'];

        if (options.force) {
            parts.push('--force-reinstall');
        }

        if (options.quiet) {
            parts.push('--quiet');
        }

        parts.push(packageName);

        return parts.join(' ');
    }

    protected buildUninstallCommand(packageName: string): string {
        return `pip3 uninstall -y ${packageName}`;
    }

    protected buildUpgradeCommand(packageName: string): string {
        return `pip3 install --upgrade ${packageName}`;
    }

    protected buildVersionCommand(packageName: string): string {
        return `pip3 show ${packageName} 2>/dev/null || echo "not installed"`;
    }

    protected parseVersion(output: string): string | null {
        if (output.includes('not installed')) {
            return null;
        }

        const match = output.match(/Version: ([\d.]+)/);
        return match ? match[1] : null;
    }
}
