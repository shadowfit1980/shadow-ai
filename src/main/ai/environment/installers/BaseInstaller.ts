/**
 * BaseInstaller - Abstract base class for all package installers
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { InstallOptions, InstallResult, UninstallResult, UpgradeResult } from '../types';

const execAsync = promisify(exec);

export abstract class BaseInstaller {
    abstract get name(): string;
    abstract get packageManager(): string;

    /**
     * Install a package
     */
    async install(packageName: string, options: InstallOptions = {}): Promise<InstallResult> {
        const startTime = Date.now();

        console.log(`📦 Installing ${packageName}...`);

        try {
            const command = this.buildInstallCommand(packageName, options);
            const { stdout, stderr } = await execAsync(command);

            // Verify installation
            const version = options.skipVerify ? undefined : await this.getInstalledVersion(packageName);

            const duration = (Date.now() - startTime) / 1000;

            console.log(`✅ Installed ${packageName} in ${duration.toFixed(1)}s`);

            return {
                success: true,
                package: packageName,
                version,
                duration,
                output: stdout
            };

        } catch (error: any) {
            const duration = (Date.now() - startTime) / 1000;

            console.error(`❌ Failed to install ${packageName}:`, error.message);

            return {
                success: false,
                package: packageName,
                duration,
                error: error.message
            };
        }
    }

    /**
     * Uninstall a package
     */
    async uninstall(packageName: string): Promise<UninstallResult> {
        const startTime = Date.now();

        console.log(`🗑️  Uninstalling ${packageName}...`);

        try {
            const command = this.buildUninstallCommand(packageName);
            await execAsync(command);

            const duration = (Date.now() - startTime) / 1000;

            console.log(`✅ Uninstalled ${packageName} in ${duration.toFixed(1)}s`);

            return {
                success: true,
                package: packageName,
                duration
            };

        } catch (error: any) {
            return {
                success: false,
                package: packageName,
                duration: (Date.now() - startTime) / 1000,
                error: error.message
            };
        }
    }

    /**
     * Upgrade a package
     */
    async upgrade(packageName: string): Promise<UpgradeResult> {
        const startTime = Date.now();

        console.log(`⬆️  Upgrading ${packageName}...`);

        try {
            const oldVersion = await this.getInstalledVersion(packageName);

            const command = this.buildUpgradeCommand(packageName);
            await execAsync(command);

            const newVersion = await this.getInstalledVersion(packageName);

            const duration = (Date.now() - startTime) / 1000;

            console.log(`✅ Upgraded ${packageName}: ${oldVersion} → ${newVersion}`);

            return {
                success: true,
                package: packageName,
                oldVersion: oldVersion || 'unknown',
                newVersion: newVersion || 'unknown',
                duration
            };

        } catch (error: any) {
            return {
                success: false,
                package: packageName,
                oldVersion: 'unknown',
                newVersion: 'unknown',
                duration: (Date.now() - startTime) / 1000,
                error: error.message
            };
        }
    }

    /**
     * Check if package is installed
     */
    async isInstalled(packageName: string): Promise<boolean> {
        try {
            const version = await this.getInstalledVersion(packageName);
            return version !== null;
        } catch {
            return false;
        }
    }

    /**
     * Get installed package version
     */
    async getInstalledVersion(packageName: string): Promise<string | null> {
        try {
            const command = this.buildVersionCommand(packageName);
            const { stdout } = await execAsync(command);
            return this.parseVersion(stdout);
        } catch {
            return null;
        }
    }

    /**
     * Build install command - must be implemented by subclasses
     */
    protected abstract buildInstallCommand(packageName: string, options: InstallOptions): string;

    /**
     * Build uninstall command - must be implemented by subclasses
     */
    protected abstract buildUninstallCommand(packageName: string): string;

    /**
     * Build upgrade command - must be implemented by subclasses
     */
    protected abstract buildUpgradeCommand(packageName: string): string;

    /**
     * Build version check command - must be implemented by subclasses
     */
    protected abstract buildVersionCommand(packageName: string): string;

    /**
     * Parse version from output - can be overridden by subclasses
     */
    protected parseVersion(output: string): string | null {
        const match = output.match(/(\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    }
}
