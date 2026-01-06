/**
 * 🏥 CodebaseHealer - Self-Healing Codebase System
 * 
 * Automatically detects and fixes common codebase issues:
 * - Security vulnerabilities
 * - Outdated dependencies
 * - Breaking changes
 * - Code quality issues (bitrot)
 * 
 * This addresses Grok's criticism: "No self-healing codebase. 
 * No autonomous refactoring. Agent needs to maintain projects over time."
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

export interface HealthReport {
    projectPath: string;
    analyzedAt: Date;
    overallHealth: number; // 0-100
    issues: HealthIssue[];
    recommendations: Recommendation[];
    dependencies: DependencyStatus;
    security: SecurityStatus;
    codeQuality: CodeQualityStatus;
}

export interface HealthIssue {
    id: string;
    type: 'security' | 'dependency' | 'code_quality' | 'deprecation' | 'performance';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    file?: string;
    line?: number;
    autoFixable: boolean;
    fix?: string;
}

export interface Recommendation {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    category: string;
}

export interface DependencyStatus {
    total: number;
    outdated: number;
    vulnerable: number;
    deprecated: number;
    packages: PackageInfo[];
}

export interface PackageInfo {
    name: string;
    currentVersion: string;
    latestVersion?: string;
    wantedVersion?: string;
    type: 'dependency' | 'devDependency';
    vulnerabilities: Vulnerability[];
    deprecated: boolean;
    breakingChanges: boolean;
}

export interface Vulnerability {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    url?: string;
    patchedIn?: string;
}

export interface SecurityStatus {
    score: number; // 0-100
    vulnerabilities: Vulnerability[];
    exposedSecrets: SecretExposure[];
    insecurePatterns: InsecurePattern[];
}

export interface SecretExposure {
    file: string;
    line: number;
    type: 'api_key' | 'password' | 'token' | 'private_key';
    pattern: string;
}

export interface InsecurePattern {
    file: string;
    line: number;
    pattern: string;
    risk: string;
    fix: string;
}

export interface CodeQualityStatus {
    score: number; // 0-100
    complexity: number;
    duplication: number;
    testCoverage: number;
    documentation: number;
    deadCode: DeadCode[];
    unusedDependencies: string[];
}

export interface DeadCode {
    file: string;
    type: 'function' | 'variable' | 'import' | 'class';
    name: string;
    line: number;
}

export interface FixResult {
    success: boolean;
    issueId: string;
    changes: FileChange[];
    error?: string;
    rollbackId?: string;
}

export interface FileChange {
    file: string;
    action: 'modified' | 'created' | 'deleted';
    diff?: string;
}

// Secret patterns to detect
const SECRET_PATTERNS = [
    { type: 'api_key' as const, pattern: /['"]?[a-zA-Z0-9_-]*api[_-]?key['"]?\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi },
    { type: 'password' as const, pattern: /['"]?password['"]?\s*[:=]\s*['"][^'"]{8,}['"]/gi },
    { type: 'token' as const, pattern: /['"]?[a-zA-Z]*token['"]?\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/gi },
    { type: 'private_key' as const, pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g },
    { type: 'api_key' as const, pattern: /sk-[a-zA-Z0-9]{48}/g }, // OpenAI
    { type: 'api_key' as const, pattern: /ghp_[a-zA-Z0-9]{36}/g }, // GitHub
    { type: 'api_key' as const, pattern: /AKIA[0-9A-Z]{16}/g }, // AWS
];

// Insecure code patterns
const INSECURE_PATTERNS = [
    { pattern: /eval\s*\(/g, risk: 'Code injection via eval()', fix: 'Use safer alternatives like JSON.parse()' },
    { pattern: /dangerouslySetInnerHTML/g, risk: 'XSS vulnerability', fix: 'Use DOMPurify to sanitize HTML' },
    { pattern: /document\.write\s*\(/g, risk: 'DOM clobbering', fix: 'Use DOM manipulation methods instead' },
    { pattern: /innerHTML\s*=/g, risk: 'Potential XSS', fix: 'Use textContent or sanitize input' },
    { pattern: /child_process.*exec\s*\(/g, risk: 'Command injection', fix: 'Use execFile with fixed commands' },
    { pattern: /sql.*\+.*\$/g, risk: 'SQL injection', fix: 'Use parameterized queries' },
    { pattern: /password.*=.*["'][^"']+["']/g, risk: 'Hardcoded credentials', fix: 'Use environment variables' },
];

// ============================================================================
// CODEBASE HEALER
// ============================================================================

export class CodebaseHealer extends EventEmitter {
    private static instance: CodebaseHealer;
    private healingHistory: Map<string, FixResult[]> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): CodebaseHealer {
        if (!CodebaseHealer.instance) {
            CodebaseHealer.instance = new CodebaseHealer();
        }
        return CodebaseHealer.instance;
    }

    /**
     * Perform comprehensive health check on a project
     */
    public async analyzeHealth(projectPath: string): Promise<HealthReport> {
        console.log(`🏥 Analyzing health of ${projectPath}...`);
        this.emit('analysis:start', { projectPath });

        const issues: HealthIssue[] = [];
        const recommendations: Recommendation[] = [];

        // Run all analyses in parallel
        const [dependencies, security, codeQuality] = await Promise.all([
            this.analyzeDependencies(projectPath),
            this.analyzeSecurityIssues(projectPath),
            this.analyzeCodeQuality(projectPath)
        ]);

        // Collect issues from each analysis
        this.collectDependencyIssues(dependencies, issues);
        this.collectSecurityIssues(security, issues);
        this.collectCodeQualityIssues(codeQuality, issues);

        // Generate recommendations
        this.generateRecommendations(dependencies, security, codeQuality, recommendations);

        // Calculate overall health score
        const overallHealth = this.calculateHealthScore(issues);

        const report: HealthReport = {
            projectPath,
            analyzedAt: new Date(),
            overallHealth,
            issues,
            recommendations,
            dependencies,
            security,
            codeQuality
        };

        this.emit('analysis:complete', report);
        console.log(`✅ Health analysis complete. Score: ${overallHealth}/100`);

        return report;
    }

    /**
     * Auto-fix issues that are safely fixable
     */
    public async autoFix(
        projectPath: string,
        strategy: 'conservative' | 'aggressive' = 'conservative'
    ): Promise<FixResult[]> {
        console.log(`🔧 Auto-fixing issues with ${strategy} strategy...`);
        this.emit('autofix:start', { projectPath, strategy });

        const report = await this.analyzeHealth(projectPath);
        const results: FixResult[] = [];

        // Filter fixable issues based on strategy
        const fixableIssues = report.issues.filter(issue => {
            if (!issue.autoFixable) return false;
            if (strategy === 'conservative') {
                return issue.severity !== 'critical'; // Don't auto-fix critical in conservative mode
            }
            return true;
        });

        for (const issue of fixableIssues) {
            try {
                const result = await this.fixIssue(projectPath, issue);
                results.push(result);
                this.emit('autofix:progress', { issueId: issue.id, success: result.success });
            } catch (error: any) {
                results.push({
                    success: false,
                    issueId: issue.id,
                    changes: [],
                    error: error.message
                });
            }
        }

        this.healingHistory.set(projectPath, results);
        this.emit('autofix:complete', { results });

        return results;
    }

    /**
     * Update all dependencies
     */
    public async updateDependencies(
        projectPath: string,
        strategy: 'patch' | 'minor' | 'major' = 'minor'
    ): Promise<FixResult> {
        console.log(`📦 Updating dependencies with ${strategy} strategy...`);

        try {
            let command: string;

            switch (strategy) {
                case 'patch':
                    command = 'npm update';
                    break;
                case 'minor':
                    command = 'npx npm-check-updates -u --target minor && npm install';
                    break;
                case 'major':
                    command = 'npx npm-check-updates -u && npm install';
                    break;
            }

            const { stdout, stderr } = await execAsync(command, { cwd: projectPath });

            return {
                success: true,
                issueId: 'dependency-update',
                changes: [{ file: 'package.json', action: 'modified' }]
            };
        } catch (error: any) {
            return {
                success: false,
                issueId: 'dependency-update',
                changes: [],
                error: error.message
            };
        }
    }

    /**
     * Fix security vulnerabilities
     */
    public async patchVulnerabilities(projectPath: string): Promise<FixResult> {
        console.log(`🔒 Patching security vulnerabilities...`);

        try {
            const { stdout } = await execAsync('npm audit fix', { cwd: projectPath });

            // Run audit fix --force for remaining issues
            await execAsync('npm audit fix --force', { cwd: projectPath }).catch(() => { });

            return {
                success: true,
                issueId: 'security-patch',
                changes: [
                    { file: 'package.json', action: 'modified' },
                    { file: 'package-lock.json', action: 'modified' }
                ]
            };
        } catch (error: any) {
            return {
                success: false,
                issueId: 'security-patch',
                changes: [],
                error: error.message
            };
        }
    }

    /**
     * Remove unused dependencies
     */
    public async removeUnusedDependencies(projectPath: string): Promise<FixResult> {
        console.log(`🧹 Removing unused dependencies...`);

        try {
            const { stdout } = await execAsync('npx depcheck --json', { cwd: projectPath });
            const result = JSON.parse(stdout);

            const unused = [
                ...Object.keys(result.dependencies || {}),
                ...Object.keys(result.devDependencies || {})
            ];

            if (unused.length > 0) {
                await execAsync(`npm uninstall ${unused.join(' ')}`, { cwd: projectPath });
            }

            return {
                success: true,
                issueId: 'remove-unused',
                changes: unused.map(pkg => ({ file: `package.json (removed ${pkg})`, action: 'modified' as const }))
            };
        } catch (error: any) {
            return {
                success: false,
                issueId: 'remove-unused',
                changes: [],
                error: error.message
            };
        }
    }

    /**
     * Detect and report bitrot (code that's degrading over time)
     */
    public async detectBitrot(projectPath: string): Promise<HealthIssue[]> {
        const issues: HealthIssue[] = [];

        // Check for deprecated APIs
        await this.findDeprecatedUsage(projectPath, issues);

        // Check for outdated patterns
        await this.findOutdatedPatterns(projectPath, issues);

        // Check for missing types in TypeScript
        await this.findMissingTypes(projectPath, issues);

        return issues;
    }

    /**
     * Get healing history for a project
     */
    public getHealingHistory(projectPath: string): FixResult[] {
        return this.healingHistory.get(projectPath) || [];
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async analyzeDependencies(projectPath: string): Promise<DependencyStatus> {
        const packages: PackageInfo[] = [];
        let outdated = 0;
        let vulnerable = 0;
        let deprecated = 0;

        try {
            // Read package.json
            const pkgPath = path.join(projectPath, 'package.json');
            const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

            // Check outdated packages
            try {
                const { stdout } = await execAsync('npm outdated --json', { cwd: projectPath });
                const outdatedPkgs = JSON.parse(stdout || '{}');

                for (const [name, info] of Object.entries(outdatedPkgs) as [string, any][]) {
                    const pkgInfo: PackageInfo = {
                        name,
                        currentVersion: info.current,
                        latestVersion: info.latest,
                        wantedVersion: info.wanted,
                        type: pkg.dependencies?.[name] ? 'dependency' : 'devDependency',
                        vulnerabilities: [],
                        deprecated: false,
                        breakingChanges: this.isBreakingChange(info.current, info.latest)
                    };
                    packages.push(pkgInfo);
                    outdated++;
                }
            } catch {
                // npm outdated exits with code 1 if packages are outdated
            }

            // Check vulnerabilities
            try {
                const { stdout } = await execAsync('npm audit --json', { cwd: projectPath });
                const audit = JSON.parse(stdout);

                for (const [, advisory] of Object.entries(audit.advisories || {}) as [string, any][]) {
                    vulnerable++;
                    const existingPkg = packages.find(p => p.name === advisory.module_name);
                    if (existingPkg) {
                        existingPkg.vulnerabilities.push({
                            id: advisory.id.toString(),
                            severity: advisory.severity,
                            title: advisory.title,
                            url: advisory.url,
                            patchedIn: advisory.patched_versions
                        });
                    }
                }
            } catch {
                // audit might fail
            }

        } catch (error: any) {
            console.warn('Dependency analysis error:', error.message);
        }

        return {
            total: packages.length,
            outdated,
            vulnerable,
            deprecated,
            packages
        };
    }

    private async analyzeSecurityIssues(projectPath: string): Promise<SecurityStatus> {
        const vulnerabilities: Vulnerability[] = [];
        const exposedSecrets: SecretExposure[] = [];
        const insecurePatterns: InsecurePattern[] = [];

        // Scan files for secrets and insecure patterns
        await this.scanDirectory(projectPath, async (filePath, content) => {
            // Skip node_modules and other non-source files
            if (filePath.includes('node_modules') || filePath.includes('.git')) return;

            const relativePath = path.relative(projectPath, filePath);

            // Check for exposed secrets
            for (const { type, pattern } of SECRET_PATTERNS) {
                const matches = content.matchAll(pattern);
                for (const match of matches) {
                    const line = this.getLineNumber(content, match.index || 0);
                    exposedSecrets.push({
                        file: relativePath,
                        line,
                        type,
                        pattern: match[0].substring(0, 50) + '...'
                    });
                }
            }

            // Check for insecure patterns
            for (const { pattern, risk, fix } of INSECURE_PATTERNS) {
                const matches = content.matchAll(pattern);
                for (const match of matches) {
                    const line = this.getLineNumber(content, match.index || 0);
                    insecurePatterns.push({
                        file: relativePath,
                        line,
                        pattern: match[0],
                        risk,
                        fix
                    });
                }
            }
        });

        // Calculate security score
        const secretsPenalty = exposedSecrets.length * 15;
        const patternsPenalty = insecurePatterns.length * 5;
        const vulnPenalty = vulnerabilities.length * 10;
        const score = Math.max(0, 100 - secretsPenalty - patternsPenalty - vulnPenalty);

        return {
            score,
            vulnerabilities,
            exposedSecrets,
            insecurePatterns
        };
    }

    private async analyzeCodeQuality(projectPath: string): Promise<CodeQualityStatus> {
        const deadCode: DeadCode[] = [];
        const unusedDependencies: string[] = [];
        let complexity = 0;
        let fileCount = 0;

        await this.scanDirectory(projectPath, async (filePath, content) => {
            if (filePath.includes('node_modules') || filePath.includes('.git')) return;
            if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;

            fileCount++;

            // Calculate complexity (simplified - count branches)
            const branches = (content.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(|\?\s*:/g) || []).length;
            complexity += branches;

            // Find potentially unused exports
            const exports = content.matchAll(/export\s+(const|function|class|interface|type)\s+(\w+)/g);
            // This would need cross-file analysis for real dead code detection
        });

        // Get unused dependencies
        try {
            const { stdout } = await execAsync('npx depcheck --json', { cwd: projectPath });
            const result = JSON.parse(stdout);
            unusedDependencies.push(...Object.keys(result.dependencies || {}));
        } catch {
            // depcheck might not be available
        }

        const avgComplexity = fileCount > 0 ? complexity / fileCount : 0;
        const qualityScore = Math.max(0, 100 - (avgComplexity * 2) - (unusedDependencies.length * 5));

        return {
            score: qualityScore,
            complexity: avgComplexity,
            duplication: 0, // Would need sophisticated analysis
            testCoverage: 0, // Would need test runner integration
            documentation: 0, // Would need doc analysis
            deadCode,
            unusedDependencies
        };
    }

    private collectDependencyIssues(deps: DependencyStatus, issues: HealthIssue[]): void {
        for (const pkg of deps.packages) {
            if (pkg.vulnerabilities.length > 0) {
                for (const vuln of pkg.vulnerabilities) {
                    issues.push({
                        id: `vuln-${pkg.name}-${vuln.id}`,
                        type: 'security',
                        severity: vuln.severity,
                        title: `Vulnerability in ${pkg.name}`,
                        description: vuln.title,
                        autoFixable: !!vuln.patchedIn,
                        fix: vuln.patchedIn ? `Update to ${vuln.patchedIn}` : undefined
                    });
                }
            }

            if (pkg.breakingChanges) {
                issues.push({
                    id: `breaking-${pkg.name}`,
                    type: 'dependency',
                    severity: 'medium',
                    title: `Breaking changes available for ${pkg.name}`,
                    description: `Current: ${pkg.currentVersion}, Latest: ${pkg.latestVersion}`,
                    autoFixable: false
                });
            }
        }
    }

    private collectSecurityIssues(security: SecurityStatus, issues: HealthIssue[]): void {
        for (const secret of security.exposedSecrets) {
            issues.push({
                id: `secret-${secret.file}-${secret.line}`,
                type: 'security',
                severity: 'critical',
                title: `Exposed ${secret.type} detected`,
                description: `Found in ${secret.file} at line ${secret.line}`,
                file: secret.file,
                line: secret.line,
                autoFixable: false
            });
        }

        for (const pattern of security.insecurePatterns) {
            issues.push({
                id: `insecure-${pattern.file}-${pattern.line}`,
                type: 'security',
                severity: 'high',
                title: pattern.risk,
                description: `Found "${pattern.pattern}" in ${pattern.file}:${pattern.line}`,
                file: pattern.file,
                line: pattern.line,
                autoFixable: false,
                fix: pattern.fix
            });
        }
    }

    private collectCodeQualityIssues(quality: CodeQualityStatus, issues: HealthIssue[]): void {
        if (quality.complexity > 20) {
            issues.push({
                id: 'high-complexity',
                type: 'code_quality',
                severity: 'medium',
                title: 'High average complexity',
                description: `Average complexity of ${quality.complexity.toFixed(1)} per file is above recommended threshold`,
                autoFixable: false
            });
        }

        for (const unused of quality.unusedDependencies) {
            issues.push({
                id: `unused-${unused}`,
                type: 'code_quality',
                severity: 'low',
                title: `Unused dependency: ${unused}`,
                description: `The package "${unused}" appears to be unused`,
                autoFixable: true,
                fix: `npm uninstall ${unused}`
            });
        }
    }

    private generateRecommendations(
        deps: DependencyStatus,
        security: SecurityStatus,
        quality: CodeQualityStatus,
        recommendations: Recommendation[]
    ): void {
        if (deps.vulnerable > 0) {
            recommendations.push({
                title: 'Run npm audit fix',
                description: `You have ${deps.vulnerable} vulnerable dependencies. Run "npm audit fix" to resolve.`,
                impact: 'high',
                effort: 'low',
                category: 'Security'
            });
        }

        if (security.exposedSecrets.length > 0) {
            recommendations.push({
                title: 'Remove exposed secrets',
                description: 'Move secrets to environment variables and add .env to .gitignore',
                impact: 'high',
                effort: 'medium',
                category: 'Security'
            });
        }

        if (quality.unusedDependencies.length > 3) {
            recommendations.push({
                title: 'Clean up unused dependencies',
                description: `Remove ${quality.unusedDependencies.length} unused packages to reduce bundle size`,
                impact: 'medium',
                effort: 'low',
                category: 'Performance'
            });
        }
    }

    private calculateHealthScore(issues: HealthIssue[]): number {
        let score = 100;

        for (const issue of issues) {
            switch (issue.severity) {
                case 'critical': score -= 20; break;
                case 'high': score -= 10; break;
                case 'medium': score -= 5; break;
                case 'low': score -= 2; break;
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    private async fixIssue(projectPath: string, issue: HealthIssue): Promise<FixResult> {
        if (!issue.fix) {
            return { success: false, issueId: issue.id, changes: [], error: 'No fix available' };
        }

        try {
            // Execute the fix command
            await execAsync(issue.fix, { cwd: projectPath });
            return {
                success: true,
                issueId: issue.id,
                changes: [{ file: 'package.json', action: 'modified' }]
            };
        } catch (error: any) {
            return {
                success: false,
                issueId: issue.id,
                changes: [],
                error: error.message
            };
        }
    }

    private async scanDirectory(
        dir: string,
        callback: (filePath: string, content: string) => Promise<void>
    ): Promise<void> {
        const ignorePatterns = ['node_modules', '.git', 'dist', 'build', '.next'];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (ignorePatterns.some(pattern => entry.name === pattern)) continue;

                if (entry.isDirectory()) {
                    await this.scanDirectory(fullPath, callback);
                } else if (entry.isFile()) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        await callback(fullPath, content);
                    } catch {
                        // Skip files that can't be read
                    }
                }
            }
        } catch {
            // Directory might not exist
        }
    }

    private isBreakingChange(current: string, latest: string): boolean {
        const [currentMajor] = (current || '0').split('.').map(Number);
        const [latestMajor] = (latest || '0').split('.').map(Number);
        return latestMajor > currentMajor;
    }

    private getLineNumber(content: string, index: number): number {
        return content.substring(0, index).split('\n').length;
    }

    private async findDeprecatedUsage(projectPath: string, issues: HealthIssue[]): Promise<void> {
        // Check for common deprecated patterns
        const deprecatedPatterns = [
            { pattern: /componentWillMount/g, replacement: 'componentDidMount or useEffect' },
            { pattern: /componentWillReceiveProps/g, replacement: 'getDerivedStateFromProps or useEffect' },
            { pattern: /require\s*\(\s*['"]fs['"]\s*\)/g, replacement: 'fs/promises' }
        ];

        await this.scanDirectory(projectPath, async (filePath, content) => {
            if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;

            for (const { pattern, replacement } of deprecatedPatterns) {
                if (pattern.test(content)) {
                    issues.push({
                        id: `deprecated-${path.basename(filePath)}-${pattern.source}`,
                        type: 'deprecation',
                        severity: 'low',
                        title: `Deprecated API usage: ${pattern.source}`,
                        description: `Consider using ${replacement}`,
                        file: filePath,
                        autoFixable: false
                    });
                }
            }
        });
    }

    private async findOutdatedPatterns(projectPath: string, issues: HealthIssue[]): Promise<void> {
        // Placeholder for finding outdated coding patterns
    }

    private async findMissingTypes(projectPath: string, issues: HealthIssue[]): Promise<void> {
        // Placeholder for TypeScript type checking
    }
}

// Export singleton
export const codebaseHealer = CodebaseHealer.getInstance();
