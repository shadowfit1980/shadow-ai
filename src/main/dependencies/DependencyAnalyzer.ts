/**
 * Dependency Analyzer
 * Analyze project dependencies for security and updates
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Dependency {
    name: string;
    version: string;
    type: 'production' | 'development' | 'peer' | 'optional';
    latestVersion?: string;
    hasUpdate: boolean;
    vulnerabilities: Vulnerability[];
}

export interface Vulnerability {
    id: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    title: string;
    description?: string;
    fixAvailable: boolean;
    fixedIn?: string;
    cwe?: string;
}

export interface DependencyAnalysis {
    id: string;
    projectPath: string;
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'unknown';
    totalDependencies: number;
    outdated: number;
    vulnerablePackages: number;
    dependencies: Dependency[];
    analyzedAt: number;
}

/**
 * DependencyAnalyzer
 * Analyze and audit project dependencies
 */
export class DependencyAnalyzer extends EventEmitter {
    private static instance: DependencyAnalyzer;
    private analyses: Map<string, DependencyAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): DependencyAnalyzer {
        if (!DependencyAnalyzer.instance) {
            DependencyAnalyzer.instance = new DependencyAnalyzer();
        }
        return DependencyAnalyzer.instance;
    }

    /**
     * Analyze project dependencies
     */
    async analyze(projectPath: string): Promise<DependencyAnalysis> {
        const id = `analysis_${Date.now()}`;
        this.emit('analysisStarted', { id, projectPath });

        const packageManager = await this.detectPackageManager(projectPath);
        let dependencies: Dependency[] = [];

        switch (packageManager) {
            case 'npm':
            case 'yarn':
            case 'pnpm':
                dependencies = await this.analyzeNodeDependencies(projectPath);
                break;
            case 'pip':
                dependencies = await this.analyzePythonDependencies(projectPath);
                break;
        }

        const analysis: DependencyAnalysis = {
            id,
            projectPath,
            packageManager,
            totalDependencies: dependencies.length,
            outdated: dependencies.filter(d => d.hasUpdate).length,
            vulnerablePackages: dependencies.filter(d => d.vulnerabilities.length > 0).length,
            dependencies,
            analyzedAt: Date.now(),
        };

        this.analyses.set(id, analysis);
        this.emit('analysisCompleted', analysis);

        return analysis;
    }

    /**
     * Detect package manager
     */
    private async detectPackageManager(projectPath: string): Promise<DependencyAnalysis['packageManager']> {
        const files = await fs.readdir(projectPath).catch(() => []);

        if (files.includes('pnpm-lock.yaml')) return 'pnpm';
        if (files.includes('yarn.lock')) return 'yarn';
        if (files.includes('package-lock.json')) return 'npm';
        if (files.includes('package.json')) return 'npm';
        if (files.includes('requirements.txt') || files.includes('Pipfile')) return 'pip';

        return 'unknown';
    }

    /**
     * Analyze Node.js dependencies
     */
    private async analyzeNodeDependencies(projectPath: string): Promise<Dependency[]> {
        const dependencies: Dependency[] = [];

        try {
            const pkgPath = path.join(projectPath, 'package.json');
            const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

            // Process production dependencies
            for (const [name, version] of Object.entries(pkg.dependencies || {})) {
                dependencies.push(await this.analyzeDependency(name, version as string, 'production'));
            }

            // Process dev dependencies
            for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
                dependencies.push(await this.analyzeDependency(name, version as string, 'development'));
            }

            // Process peer dependencies
            for (const [name, version] of Object.entries(pkg.peerDependencies || {})) {
                dependencies.push(await this.analyzeDependency(name, version as string, 'peer'));
            }
        } catch (error) {
            this.emit('analysisError', { projectPath, error });
        }

        return dependencies;
    }

    /**
     * Analyze a single dependency
     */
    private async analyzeDependency(name: string, version: string, type: Dependency['type']): Promise<Dependency> {
        const cleanVersion = version.replace(/^[\^~]/, '');

        // Check for known vulnerable packages (simulated)
        const vulnerabilities = this.checkKnownVulnerabilities(name, cleanVersion);

        // Simulate latest version check
        const hasUpdate = Math.random() > 0.7;
        const latestVersion = hasUpdate ? this.generateNewVersion(cleanVersion) : undefined;

        return {
            name,
            version: cleanVersion,
            type,
            latestVersion,
            hasUpdate,
            vulnerabilities,
        };
    }

    /**
     * Analyze Python dependencies
     */
    private async analyzePythonDependencies(projectPath: string): Promise<Dependency[]> {
        const dependencies: Dependency[] = [];

        try {
            const reqPath = path.join(projectPath, 'requirements.txt');
            const content = await fs.readFile(reqPath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

            for (const line of lines) {
                const match = line.match(/^([a-zA-Z0-9_-]+)==?(.+)?$/);
                if (match) {
                    dependencies.push(await this.analyzeDependency(match[1], match[2] || '*', 'production'));
                }
            }
        } catch {
            // No requirements.txt
        }

        return dependencies;
    }

    /**
     * Check known vulnerabilities
     */
    private checkKnownVulnerabilities(name: string, version: string): Vulnerability[] {
        const vulnerabilities: Vulnerability[] = [];

        // Known vulnerable packages (simulated database)
        const knownVulnerable: Record<string, Vulnerability> = {
            'lodash': {
                id: 'CVE-2021-23337',
                severity: 'high',
                title: 'Prototype Pollution',
                description: 'Command injection in lodash',
                fixAvailable: true,
                fixedIn: '4.17.21',
                cwe: 'CWE-94',
            },
            'minimist': {
                id: 'CVE-2021-44906',
                severity: 'critical',
                title: 'Prototype Pollution',
                fixAvailable: true,
                fixedIn: '1.2.6',
            },
            'axios': {
                id: 'CVE-2023-45857',
                severity: 'moderate',
                title: 'SSRF vulnerability',
                fixAvailable: true,
                fixedIn: '1.6.0',
            },
        };

        if (knownVulnerable[name.toLowerCase()]) {
            vulnerabilities.push(knownVulnerable[name.toLowerCase()]);
        }

        return vulnerabilities;
    }

    /**
     * Generate new version (simulated)
     */
    private generateNewVersion(current: string): string {
        const parts = current.split('.').map(p => parseInt(p) || 0);
        parts[2] = (parts[2] || 0) + Math.floor(Math.random() * 5) + 1;
        return parts.join('.');
    }

    /**
     * Get outdated dependencies
     */
    getOutdated(analysisId: string): Dependency[] {
        const analysis = this.analyses.get(analysisId);
        return analysis?.dependencies.filter(d => d.hasUpdate) || [];
    }

    /**
     * Get vulnerable dependencies
     */
    getVulnerable(analysisId: string): Dependency[] {
        const analysis = this.analyses.get(analysisId);
        return analysis?.dependencies.filter(d => d.vulnerabilities.length > 0) || [];
    }

    /**
     * Generate security report
     */
    generateSecurityReport(analysis: DependencyAnalysis): string {
        const lines = [
            `# Dependency Security Report`,
            '',
            `## Summary`,
            `- Total Dependencies: ${analysis.totalDependencies}`,
            `- Outdated: ${analysis.outdated}`,
            `- Vulnerable: ${analysis.vulnerablePackages}`,
            '',
        ];

        const vulnerable = analysis.dependencies.filter(d => d.vulnerabilities.length > 0);
        if (vulnerable.length > 0) {
            lines.push('## Vulnerabilities');
            for (const dep of vulnerable) {
                for (const vuln of dep.vulnerabilities) {
                    lines.push(`### ${dep.name}@${dep.version}`);
                    lines.push(`- **${vuln.severity.toUpperCase()}**: ${vuln.title}`);
                    if (vuln.fixAvailable) lines.push(`- Fix: Upgrade to ${vuln.fixedIn}`);
                }
            }
        }

        return lines.join('\n');
    }

    /**
     * Get analysis
     */
    getAnalysis(id: string): DependencyAnalysis | null {
        return this.analyses.get(id) || null;
    }
}

// Singleton getter
export function getDependencyAnalyzer(): DependencyAnalyzer {
    return DependencyAnalyzer.getInstance();
}
