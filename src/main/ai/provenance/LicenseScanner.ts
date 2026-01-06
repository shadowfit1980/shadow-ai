/**
 * LicenseScanner - Dependency License Scanning
 * 
 * Scans dependencies for license compliance:
 * - Parses package.json and lockfiles
 * - Identifies license types
 * - Flags incompatible/copyleft licenses
 * - Generates SBOM (Software Bill of Materials)
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export type LicenseType =
    | 'MIT'
    | 'Apache-2.0'
    | 'BSD-2-Clause'
    | 'BSD-3-Clause'
    | 'ISC'
    | 'GPL-2.0'
    | 'GPL-3.0'
    | 'LGPL-2.1'
    | 'LGPL-3.0'
    | 'MPL-2.0'
    | 'AGPL-3.0'
    | 'Unlicense'
    | 'WTFPL'
    | 'CC0-1.0'
    | 'Unknown';

export type LicenseCategory = 'permissive' | 'copyleft' | 'weak-copyleft' | 'public-domain' | 'unknown';

export interface LicenseInfo {
    name: string;
    spdxId: LicenseType | string;
    category: LicenseCategory;
    compatible: boolean;
    url?: string;
}

export interface DependencyLicense {
    name: string;
    version: string;
    license: LicenseInfo;
    path?: string;
    repository?: string;
    direct: boolean;
}

export interface ScanResult {
    scannedAt: string;
    projectPath: string;
    totalDependencies: number;
    directDependencies: number;
    licenses: DependencyLicense[];
    issues: LicenseIssue[];
    summary: {
        permissive: number;
        copyleft: number;
        weakCopyleft: number;
        publicDomain: number;
        unknown: number;
    };
}

export interface LicenseIssue {
    severity: 'error' | 'warning' | 'info';
    dependency: string;
    message: string;
    suggestion?: string;
}

export interface SBOMEntry {
    name: string;
    version: string;
    purl: string;  // Package URL
    license: string;
    supplier?: string;
    hash?: string;
}

export interface SBOM {
    bomFormat: 'CycloneDX';
    specVersion: '1.4';
    version: number;
    metadata: {
        timestamp: string;
        tools: { name: string; version: string }[];
        component: {
            type: 'application';
            name: string;
            version: string;
        };
    };
    components: SBOMEntry[];
}

// License categorization
const LICENSE_CATEGORIES: Record<string, { category: LicenseCategory; compatible: boolean }> = {
    'MIT': { category: 'permissive', compatible: true },
    'Apache-2.0': { category: 'permissive', compatible: true },
    'BSD-2-Clause': { category: 'permissive', compatible: true },
    'BSD-3-Clause': { category: 'permissive', compatible: true },
    'ISC': { category: 'permissive', compatible: true },
    'Unlicense': { category: 'public-domain', compatible: true },
    'CC0-1.0': { category: 'public-domain', compatible: true },
    'WTFPL': { category: 'public-domain', compatible: true },
    'MPL-2.0': { category: 'weak-copyleft', compatible: true },
    'LGPL-2.1': { category: 'weak-copyleft', compatible: true },
    'LGPL-3.0': { category: 'weak-copyleft', compatible: true },
    'GPL-2.0': { category: 'copyleft', compatible: false },
    'GPL-3.0': { category: 'copyleft', compatible: false },
    'AGPL-3.0': { category: 'copyleft', compatible: false },
};

export class LicenseScanner {
    private static instance: LicenseScanner;
    private allowedLicenses: Set<string> = new Set([
        'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC',
        'Unlicense', 'CC0-1.0', 'WTFPL', 'MPL-2.0', '0BSD'
    ]);

    private constructor() {
        console.log('[LicenseScanner] Initialized');
    }

    static getInstance(): LicenseScanner {
        if (!LicenseScanner.instance) {
            LicenseScanner.instance = new LicenseScanner();
        }
        return LicenseScanner.instance;
    }

    /**
     * Configure allowed licenses
     */
    setAllowedLicenses(licenses: string[]): void {
        this.allowedLicenses = new Set(licenses);
    }

    /**
     * Get license info from SPDX identifier
     */
    getLicenseInfo(spdxId: string): LicenseInfo {
        const normalized = this.normalizeLicense(spdxId);
        const category = LICENSE_CATEGORIES[normalized];

        return {
            name: normalized,
            spdxId: normalized,
            category: category?.category || 'unknown',
            compatible: category?.compatible ?? false,
            url: `https://spdx.org/licenses/${normalized}.html`
        };
    }

    /**
     * Normalize license string to SPDX identifier
     */
    private normalizeLicense(license: string): string {
        if (!license) return 'Unknown';

        const normalized = license.trim().toUpperCase();

        // Common variations
        const mappings: Record<string, string> = {
            'MIT': 'MIT',
            'APACHE 2.0': 'Apache-2.0',
            'APACHE-2.0': 'Apache-2.0',
            'APACHE 2': 'Apache-2.0',
            'BSD': 'BSD-3-Clause',
            'BSD-2': 'BSD-2-Clause',
            'BSD-3': 'BSD-3-Clause',
            'ISC': 'ISC',
            'GPL': 'GPL-3.0',
            'GPL-2': 'GPL-2.0',
            'GPL-3': 'GPL-3.0',
            'GPLV2': 'GPL-2.0',
            'GPLV3': 'GPL-3.0',
            'LGPL': 'LGPL-3.0',
            'LGPL-2': 'LGPL-2.1',
            'LGPL-3': 'LGPL-3.0',
            'AGPL': 'AGPL-3.0',
            'MPL': 'MPL-2.0',
            'MPL-2': 'MPL-2.0',
            'UNLICENSE': 'Unlicense',
            'CC0': 'CC0-1.0',
            'WTFPL': 'WTFPL',
            '0BSD': '0BSD',
        };

        return mappings[normalized] || license;
    }

    /**
     * Scan a project for dependency licenses
     */
    async scanProject(projectPath: string): Promise<ScanResult> {
        console.log(`[LicenseScanner] Scanning: ${projectPath}`);

        const licenses: DependencyLicense[] = [];
        const issues: LicenseIssue[] = [];

        // Read package.json
        const packageJsonPath = path.join(projectPath, 'package.json');
        let directDeps: Record<string, string> = {};
        let projectName = 'unknown';

        try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(content);
            projectName = pkg.name || 'unknown';
            directDeps = {
                ...pkg.dependencies,
                ...pkg.devDependencies
            };
        } catch (error) {
            issues.push({
                severity: 'error',
                dependency: 'package.json',
                message: 'Could not read package.json',
                suggestion: 'Ensure package.json exists and is valid JSON'
            });
        }

        // Scan node_modules
        const nodeModulesPath = path.join(projectPath, 'node_modules');
        try {
            const modules = await fs.readdir(nodeModulesPath);

            for (const moduleName of modules) {
                if (moduleName.startsWith('.') || moduleName.startsWith('@')) {
                    // Handle scoped packages
                    if (moduleName.startsWith('@')) {
                        try {
                            const scopedModules = await fs.readdir(path.join(nodeModulesPath, moduleName));
                            for (const scopedModule of scopedModules) {
                                const fullName = `${moduleName}/${scopedModule}`;
                                const depLicense = await this.scanDependency(
                                    path.join(nodeModulesPath, moduleName, scopedModule),
                                    fullName,
                                    !!directDeps[fullName]
                                );
                                if (depLicense) {
                                    licenses.push(depLicense);
                                    this.checkLicenseIssues(depLicense, issues);
                                }
                            }
                        } catch {
                            // Ignore errors reading scoped packages
                        }
                    }
                    continue;
                }

                const depLicense = await this.scanDependency(
                    path.join(nodeModulesPath, moduleName),
                    moduleName,
                    !!directDeps[moduleName]
                );

                if (depLicense) {
                    licenses.push(depLicense);
                    this.checkLicenseIssues(depLicense, issues);
                }
            }
        } catch (error) {
            issues.push({
                severity: 'warning',
                dependency: 'node_modules',
                message: 'Could not scan node_modules directory',
                suggestion: 'Run npm install first'
            });
        }

        // Calculate summary
        const summary = {
            permissive: licenses.filter(l => l.license.category === 'permissive').length,
            copyleft: licenses.filter(l => l.license.category === 'copyleft').length,
            weakCopyleft: licenses.filter(l => l.license.category === 'weak-copyleft').length,
            publicDomain: licenses.filter(l => l.license.category === 'public-domain').length,
            unknown: licenses.filter(l => l.license.category === 'unknown').length
        };

        const result: ScanResult = {
            scannedAt: new Date().toISOString(),
            projectPath,
            totalDependencies: licenses.length,
            directDependencies: Object.keys(directDeps).length,
            licenses,
            issues,
            summary
        };

        console.log(`[LicenseScanner] Found ${licenses.length} dependencies, ${issues.length} issues`);
        return result;
    }

    /**
     * Scan a single dependency
     */
    private async scanDependency(
        depPath: string,
        name: string,
        isDirect: boolean
    ): Promise<DependencyLicense | null> {
        const packageJsonPath = path.join(depPath, 'package.json');

        try {
            const content = await fs.readFile(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(content);

            const licenseStr = typeof pkg.license === 'string'
                ? pkg.license
                : pkg.license?.type || 'Unknown';

            return {
                name,
                version: pkg.version || '0.0.0',
                license: this.getLicenseInfo(licenseStr),
                path: depPath,
                repository: pkg.repository?.url || pkg.repository,
                direct: isDirect
            };
        } catch {
            return null;
        }
    }

    /**
     * Check for license issues
     */
    private checkLicenseIssues(dep: DependencyLicense, issues: LicenseIssue[]): void {
        if (dep.license.category === 'unknown') {
            issues.push({
                severity: 'warning',
                dependency: `${dep.name}@${dep.version}`,
                message: `Unknown license: ${dep.license.spdxId}`,
                suggestion: 'Manually verify the license is compatible'
            });
        }

        if (dep.license.category === 'copyleft' && dep.direct) {
            issues.push({
                severity: 'error',
                dependency: `${dep.name}@${dep.version}`,
                message: `Copyleft license (${dep.license.spdxId}) may require source disclosure`,
                suggestion: 'Consider using an alternative package with a permissive license'
            });
        }

        if (dep.license.category === 'weak-copyleft') {
            issues.push({
                severity: 'info',
                dependency: `${dep.name}@${dep.version}`,
                message: `Weak copyleft license (${dep.license.spdxId}) - modifications must be disclosed`,
                suggestion: 'Ensure compliance if modifying this package'
            });
        }
    }

    /**
     * Generate CycloneDX SBOM
     */
    generateSBOM(scanResult: ScanResult, projectName: string, projectVersion: string): SBOM {
        const components: SBOMEntry[] = scanResult.licenses.map(dep => ({
            name: dep.name,
            version: dep.version,
            purl: `pkg:npm/${dep.name}@${dep.version}`,
            license: dep.license.spdxId,
            supplier: dep.repository
        }));

        return {
            bomFormat: 'CycloneDX',
            specVersion: '1.4',
            version: 1,
            metadata: {
                timestamp: new Date().toISOString(),
                tools: [{ name: 'Shadow AI', version: '3.0.0' }],
                component: {
                    type: 'application',
                    name: projectName,
                    version: projectVersion
                }
            },
            components
        };
    }

    /**
     * Export SBOM to file
     */
    async exportSBOM(sbom: SBOM, outputPath: string): Promise<void> {
        await fs.writeFile(outputPath, JSON.stringify(sbom, null, 2));
        console.log(`[LicenseScanner] Exported SBOM to: ${outputPath}`);
    }

    /**
     * Get compliance report
     */
    getComplianceReport(scanResult: ScanResult): {
        compliant: boolean;
        score: number; // 0-100
        summary: string;
        recommendations: string[];
    } {
        const copyleftCount = scanResult.summary.copyleft;
        const unknownCount = scanResult.summary.unknown;
        const errorCount = scanResult.issues.filter(i => i.severity === 'error').length;

        const compliant = copyleftCount === 0 && errorCount === 0;

        // Calculate score
        let score = 100;
        score -= copyleftCount * 20;
        score -= unknownCount * 5;
        score -= errorCount * 15;
        score = Math.max(0, score);

        const recommendations: string[] = [];

        if (copyleftCount > 0) {
            recommendations.push(`Replace ${copyleftCount} copyleft dependencies with permissive alternatives`);
        }
        if (unknownCount > 0) {
            recommendations.push(`Review ${unknownCount} dependencies with unknown licenses`);
        }
        if (scanResult.summary.weakCopyleft > 0) {
            recommendations.push('Document compliance for weak-copyleft dependencies');
        }

        return {
            compliant,
            score,
            summary: compliant
                ? 'All dependencies use compatible licenses'
                : `Found ${errorCount} license compliance issues`,
            recommendations
        };
    }
}

export const licenseScanner = LicenseScanner.getInstance();
