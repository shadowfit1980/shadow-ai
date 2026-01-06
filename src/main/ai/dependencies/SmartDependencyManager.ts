/**
 * Smart Dependency Management
 * 
 * Auto-detect outdated/vulnerable packages, suggest upgrades,
 * and detect license conflicts.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface Dependency {
    name: string;
    currentVersion: string;
    latestVersion?: string;
    wantedVersion?: string;
    type: 'prod' | 'dev' | 'peer' | 'optional';
    outdated: boolean;
    major: boolean;
    license?: string;
}

export interface Vulnerability {
    id: string;
    package: string;
    severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
    title: string;
    url?: string;
    fixAvailable: boolean;
    fixVersion?: string;
}

export interface LicenseConflict {
    package: string;
    license: string;
    projectLicense: string;
    conflict: string;
    recommendation: string;
}

export interface DependencyReport {
    projectPath: string;
    timestamp: Date;
    totalDeps: number;
    outdated: Dependency[];
    vulnerabilities: Vulnerability[];
    licenseConflicts: LicenseConflict[];
    healthScore: number; // 0-100
}

// ============================================================================
// DEPENDENCY MANAGER
// ============================================================================

export class SmartDependencyManager extends EventEmitter {
    private static instance: SmartDependencyManager;
    private licenseCompatibility: Record<string, string[]> = {
        'MIT': ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'Unlicense'],
        'Apache-2.0': ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0'],
        'GPL-3.0': ['GPL-3.0', 'LGPL-3.0', 'AGPL-3.0'],
        'ISC': ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause'],
    };

    private constructor() {
        super();
    }

    static getInstance(): SmartDependencyManager {
        if (!SmartDependencyManager.instance) {
            SmartDependencyManager.instance = new SmartDependencyManager();
        }
        return SmartDependencyManager.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    /**
     * Full dependency analysis
     */
    async analyze(projectPath: string): Promise<DependencyReport> {
        this.emit('analysis:started', { projectPath });

        const report: DependencyReport = {
            projectPath,
            timestamp: new Date(),
            totalDeps: 0,
            outdated: [],
            vulnerabilities: [],
            licenseConflicts: [],
            healthScore: 100,
        };

        // Get outdated packages
        report.outdated = await this.checkOutdated(projectPath);

        // Check vulnerabilities
        report.vulnerabilities = await this.auditSecurity(projectPath);

        // Check license conflicts
        report.licenseConflicts = await this.checkLicenses(projectPath);

        // Calculate health score
        report.healthScore = this.calculateHealthScore(report);

        // Get total deps
        try {
            const pkgJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
            report.totalDeps = Object.keys(pkgJson.dependencies || {}).length +
                Object.keys(pkgJson.devDependencies || {}).length;
        } catch { }

        this.emit('analysis:completed', report);
        return report;
    }

    /**
     * Check for outdated packages
     */
    async checkOutdated(projectPath: string): Promise<Dependency[]> {
        try {
            const { stdout } = await execAsync('npm outdated --json 2>/dev/null || echo "{}"', { cwd: projectPath });
            const data = JSON.parse(stdout || '{}');

            return Object.entries(data).map(([name, info]: [string, any]) => ({
                name,
                currentVersion: info.current,
                latestVersion: info.latest,
                wantedVersion: info.wanted,
                type: info.type || 'prod',
                outdated: info.current !== info.latest,
                major: this.isMajorUpdate(info.current, info.latest),
                license: undefined,
            }));
        } catch {
            return [];
        }
    }

    private isMajorUpdate(current: string, latest: string): boolean {
        const currentMajor = parseInt(current?.split('.')[0] || '0');
        const latestMajor = parseInt(latest?.split('.')[0] || '0');
        return latestMajor > currentMajor;
    }

    /**
     * Run security audit
     */
    async auditSecurity(projectPath: string): Promise<Vulnerability[]> {
        try {
            const { stdout, stderr } = await execAsync('npm audit --json 2>/dev/null || echo "{}"', {
                cwd: projectPath,
                maxBuffer: 10 * 1024 * 1024,
            });

            const data = JSON.parse(stdout || stderr || '{}');
            const vulns: Vulnerability[] = [];

            if (data.vulnerabilities) {
                for (const [pkg, info] of Object.entries(data.vulnerabilities as Record<string, any>)) {
                    vulns.push({
                        id: info.via?.[0]?.source || `vuln_${pkg}`,
                        package: pkg,
                        severity: info.severity || 'moderate',
                        title: info.via?.[0]?.title || `Vulnerability in ${pkg}`,
                        url: info.via?.[0]?.url,
                        fixAvailable: info.fixAvailable !== false,
                        fixVersion: info.fixAvailable?.version,
                    });
                }
            }

            return vulns;
        } catch {
            return [];
        }
    }

    /**
     * Check for license conflicts
     */
    async checkLicenses(projectPath: string): Promise<LicenseConflict[]> {
        const conflicts: LicenseConflict[] = [];

        try {
            // Get project license
            const pkgJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
            const projectLicense = pkgJson.license || 'MIT';

            // Get dependency licenses
            const { stdout } = await execAsync('npm ls --json --depth=0 2>/dev/null || echo "{}"', { cwd: projectPath });
            const deps = JSON.parse(stdout || '{}');

            const compatible = this.licenseCompatibility[projectLicense] || [];

            for (const [name, info] of Object.entries(deps.dependencies || {}) as [string, any][]) {
                const depLicense = (info as any).license || 'Unknown';

                if (depLicense !== 'Unknown' && !compatible.includes(depLicense)) {
                    conflicts.push({
                        package: name,
                        license: depLicense,
                        projectLicense,
                        conflict: `${depLicense} is not compatible with ${projectLicense}`,
                        recommendation: `Consider finding an alternative to ${name} with a compatible license`,
                    });
                }
            }
        } catch { }

        return conflicts;
    }

    // ========================================================================
    // ACTIONS
    // ========================================================================

    /**
     * Update a package
     */
    async updatePackage(projectPath: string, packageName: string, version?: string): Promise<boolean> {
        try {
            const target = version ? `${packageName}@${version}` : `${packageName}@latest`;
            await execAsync(`npm install ${target}`, { cwd: projectPath });
            this.emit('package:updated', { package: packageName, version });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Update all packages
     */
    async updateAll(projectPath: string, major = false): Promise<boolean> {
        try {
            const cmd = major ? 'npx npm-check-updates -u && npm install' : 'npm update';
            await execAsync(cmd, { cwd: projectPath });
            this.emit('packages:updated');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Fix vulnerabilities
     */
    async fixVulnerabilities(projectPath: string, force = false): Promise<boolean> {
        try {
            const cmd = force ? 'npm audit fix --force' : 'npm audit fix';
            await execAsync(cmd, { cwd: projectPath });
            this.emit('vulnerabilities:fixed');
            return true;
        } catch {
            return false;
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private calculateHealthScore(report: DependencyReport): number {
        let score = 100;

        // Deduct for vulnerabilities
        for (const v of report.vulnerabilities) {
            if (v.severity === 'critical') score -= 20;
            else if (v.severity === 'high') score -= 10;
            else if (v.severity === 'moderate') score -= 5;
            else score -= 2;
        }

        // Deduct for major outdated
        for (const d of report.outdated) {
            if (d.major) score -= 3;
            else score -= 1;
        }

        // Deduct for license conflicts
        score -= report.licenseConflicts.length * 5;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get upgrade suggestions
     */
    async getSuggestions(projectPath: string): Promise<string[]> {
        const report = await this.analyze(projectPath);
        const suggestions: string[] = [];

        if (report.vulnerabilities.filter(v => v.severity === 'critical').length > 0) {
            suggestions.push('🚨 Critical vulnerabilities found. Run `npm audit fix` immediately.');
        }

        if (report.outdated.filter(d => d.major).length > 0) {
            suggestions.push('📦 Major updates available. Review breaking changes before updating.');
        }

        if (report.licenseConflicts.length > 0) {
            suggestions.push('⚖️ License conflicts detected. Review dependency licenses.');
        }

        if (report.healthScore < 70) {
            suggestions.push('⚠️ Project health is low. Consider a dependency cleanup.');
        }

        return suggestions;
    }
}

// Export singleton
export const smartDependencyManager = SmartDependencyManager.getInstance();
