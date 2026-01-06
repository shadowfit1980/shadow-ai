/**
 * Dependency Analyzer
 * 
 * Analyzes project dependencies, detects vulnerabilities,
 * suggests updates, and identifies unused packages.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface Dependency {
    name: string;
    version: string;
    type: 'production' | 'development' | 'peer' | 'optional';
    latestVersion?: string;
    hasUpdate: boolean;
    isDeprecated: boolean;
    license?: string;
    size?: number;
}

interface DependencyVulnerability {
    id: string;
    package: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    fixVersion?: string;
}

interface DependencyGraph {
    nodes: Map<string, { name: string; version: string; depth: number }>;
    edges: Map<string, string[]>;
}

interface AnalysisResult {
    dependencies: Dependency[];
    devDependencies: Dependency[];
    vulnerabilities: DependencyVulnerability[];
    unused: string[];
    duplicates: Array<{ name: string; versions: string[] }>;
    graph: DependencyGraph;
    recommendations: string[];
    score: number;
}

// ============================================================================
// DEPENDENCY ANALYZER
// ============================================================================

export class DependencyAnalyzer extends EventEmitter {
    private static instance: DependencyAnalyzer;

    private constructor() {
        super();
    }

    static getInstance(): DependencyAnalyzer {
        if (!DependencyAnalyzer.instance) {
            DependencyAnalyzer.instance = new DependencyAnalyzer();
        }
        return DependencyAnalyzer.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    async analyzeProject(projectPath: string): Promise<AnalysisResult> {
        const packageJsonPath = path.join(projectPath, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('No package.json found');
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Parse dependencies
        const dependencies = this.parseDependencies(packageJson.dependencies || {}, 'production');
        const devDependencies = this.parseDependencies(packageJson.devDependencies || {}, 'development');

        // Analyze for vulnerabilities
        const vulnerabilities = await this.checkVulnerabilities([...dependencies, ...devDependencies]);

        // Find unused dependencies
        const unused = await this.findUnused(projectPath, [...dependencies, ...devDependencies]);

        // Find duplicates
        const duplicates = this.findDuplicates(projectPath);

        // Build dependency graph
        const graph = this.buildDependencyGraph([...dependencies, ...devDependencies]);

        // Generate recommendations
        const recommendations = this.generateRecommendations(dependencies, devDependencies, vulnerabilities, unused);

        // Calculate score
        const score = this.calculateScore(dependencies.length + devDependencies.length, vulnerabilities, unused, duplicates);

        this.emit('analysis:complete', { projectPath, score });

        return {
            dependencies,
            devDependencies,
            vulnerabilities,
            unused,
            duplicates,
            graph,
            recommendations,
            score,
        };
    }

    private parseDependencies(deps: Record<string, string>, type: Dependency['type']): Dependency[] {
        return Object.entries(deps).map(([name, version]) => ({
            name,
            version,
            type,
            hasUpdate: false, // Would check npm registry in real implementation
            isDeprecated: false,
        }));
    }

    // ========================================================================
    // VULNERABILITY CHECKING
    // ========================================================================

    private async checkVulnerabilities(deps: Dependency[]): Promise<DependencyVulnerability[]> {
        const vulnerabilities: DependencyVulnerability[] = [];

        // Known vulnerable packages (simplified - would use npm audit or Snyk in real implementation)
        const knownVulnerable: Record<string, { severity: DependencyVulnerability['severity']; title: string; fix: string }> = {
            'lodash': { severity: 'high', title: 'Prototype Pollution', fix: '4.17.21' },
            'minimist': { severity: 'critical', title: 'Prototype Pollution', fix: '1.2.6' },
            'node-fetch': { severity: 'high', title: 'Exposure of Sensitive Information', fix: '2.6.7' },
            'axios': { severity: 'medium', title: 'Server-Side Request Forgery', fix: '0.21.2' },
            'moment': { severity: 'low', title: 'Deprecated - Use date-fns or Luxon', fix: undefined },
        };

        for (const dep of deps) {
            if (knownVulnerable[dep.name]) {
                const vuln = knownVulnerable[dep.name];
                vulnerabilities.push({
                    id: `vuln-${dep.name}`,
                    package: dep.name,
                    severity: vuln.severity,
                    title: vuln.title,
                    description: `The package ${dep.name}@${dep.version} has a known vulnerability`,
                    fixVersion: vuln.fix,
                });
            }
        }

        return vulnerabilities;
    }

    // ========================================================================
    // UNUSED DETECTION
    // ========================================================================

    private async findUnused(projectPath: string, deps: Dependency[]): Promise<string[]> {
        const unused: string[] = [];
        const srcPath = path.join(projectPath, 'src');

        // Skip if no src directory
        if (!fs.existsSync(srcPath)) {
            return unused;
        }

        // Get all source files
        const sourceFiles = this.getSourceFiles(srcPath);

        // Read all source content
        let allContent = '';
        for (const file of sourceFiles) {
            try {
                allContent += fs.readFileSync(file, 'utf-8') + '\n';
            } catch (e) {
                // Skip unreadable files
            }
        }

        // Check each dependency
        for (const dep of deps) {
            // Check if package is imported
            const importPatterns = [
                new RegExp(`import.*['"]${dep.name}['"]`, 'g'),
                new RegExp(`require\\s*\\(\\s*['"]${dep.name}['"]`, 'g'),
                new RegExp(`from\\s+['"]${dep.name}`, 'g'),
            ];

            const isUsed = importPatterns.some(p => p.test(allContent));

            if (!isUsed && dep.type === 'production') {
                unused.push(dep.name);
            }
        }

        return unused;
    }

    private getSourceFiles(dir: string): string[] {
        const files: string[] = [];
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    files.push(...this.getSourceFiles(fullPath));
                } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        } catch (e) {
            // Handle permission errors
        }

        return files;
    }

    // ========================================================================
    // DUPLICATE DETECTION
    // ========================================================================

    private findDuplicates(projectPath: string): Array<{ name: string; versions: string[] }> {
        const duplicates: Array<{ name: string; versions: string[] }> = [];
        const lockPath = path.join(projectPath, 'package-lock.json');

        if (!fs.existsSync(lockPath)) {
            return duplicates;
        }

        try {
            const lockContent = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
            const packages = lockContent.packages || {};
            const versionMap = new Map<string, Set<string>>();

            for (const [key, value] of Object.entries(packages)) {
                if (key.includes('node_modules/')) {
                    const name = key.split('node_modules/').pop()!;
                    const version = (value as any).version;

                    if (!versionMap.has(name)) {
                        versionMap.set(name, new Set());
                    }
                    versionMap.get(name)!.add(version);
                }
            }

            for (const [name, versions] of versionMap) {
                if (versions.size > 1) {
                    duplicates.push({ name, versions: Array.from(versions) });
                }
            }
        } catch (e) {
            // Handle parse errors
        }

        return duplicates;
    }

    // ========================================================================
    // DEPENDENCY GRAPH
    // ========================================================================

    private buildDependencyGraph(deps: Dependency[]): DependencyGraph {
        const nodes = new Map<string, { name: string; version: string; depth: number }>();
        const edges = new Map<string, string[]>();

        // Add direct dependencies
        for (const dep of deps) {
            nodes.set(dep.name, { name: dep.name, version: dep.version, depth: 0 });
            edges.set(dep.name, []); // Would populate with transitive deps in real implementation
        }

        return { nodes, edges };
    }

    // ========================================================================
    // RECOMMENDATIONS
    // ========================================================================

    private generateRecommendations(
        deps: Dependency[],
        devDeps: Dependency[],
        vulns: DependencyVulnerability[],
        unused: string[]
    ): string[] {
        const recommendations: string[] = [];

        // Vulnerability fixes
        const criticalVulns = vulns.filter(v => v.severity === 'critical');
        if (criticalVulns.length > 0) {
            recommendations.push(`🚨 Fix ${criticalVulns.length} critical vulnerabilities immediately`);
            criticalVulns.forEach(v => {
                if (v.fixVersion) {
                    recommendations.push(`   npm update ${v.package}@${v.fixVersion}`);
                }
            });
        }

        // Unused packages
        if (unused.length > 0) {
            recommendations.push(`📦 Remove ${unused.length} unused packages to reduce bundle size`);
            recommendations.push(`   npm uninstall ${unused.join(' ')}`);
        }

        // Large dependency count
        if (deps.length > 50) {
            recommendations.push('⚠️ High dependency count. Consider auditing necessity of each package.');
        }

        // Deprecated packages
        const deprecated = [...deps, ...devDeps].filter(d => d.isDeprecated);
        if (deprecated.length > 0) {
            recommendations.push(`🔄 Migrate away from ${deprecated.length} deprecated packages`);
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ Dependencies look healthy!');
        }

        return recommendations;
    }

    // ========================================================================
    // SCORING
    // ========================================================================

    private calculateScore(
        totalDeps: number,
        vulns: DependencyVulnerability[],
        unused: string[],
        duplicates: Array<{ name: string; versions: string[] }>
    ): number {
        let score = 100;

        // Deduct for vulnerabilities
        vulns.forEach(v => {
            switch (v.severity) {
                case 'critical': score -= 25; break;
                case 'high': score -= 15; break;
                case 'medium': score -= 10; break;
                case 'low': score -= 5; break;
            }
        });

        // Deduct for unused
        score -= unused.length * 2;

        // Deduct for duplicates
        score -= duplicates.length * 3;

        // Bonus for lower dependency count
        if (totalDeps < 20) score += 5;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    // ========================================================================
    // PACKAGE.JSON OPERATIONS
    // ========================================================================

    suggestOptimizedPackageJson(current: Record<string, any>, analysis: AnalysisResult): Record<string, any> {
        const optimized = { ...current };

        // Remove unused
        if (optimized.dependencies) {
            for (const unused of analysis.unused) {
                delete optimized.dependencies[unused];
            }
        }

        // Add version recommendations
        const comments: string[] = [];
        for (const vuln of analysis.vulnerabilities) {
            if (vuln.fixVersion) {
                comments.push(`// ${vuln.package}: Update to ${vuln.fixVersion} to fix ${vuln.title}`);
            }
        }

        return {
            ...optimized,
            _recommendations: comments,
        };
    }
}

export const dependencyAnalyzer = DependencyAnalyzer.getInstance();
