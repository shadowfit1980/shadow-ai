/**
 * Plugin Auto-Tester
 * 
 * AI curator that reviews and tests plugins in isolated environments,
 * rating them on compatibility, security, and innovation potential.
 */

import { EventEmitter } from 'events';

export interface PluginTestResult {
    pluginId: string;
    timestamp: Date;
    overallScore: number; // 0-100
    scores: {
        compatibility: number;
        security: number;
        performance: number;
        innovation: number;
        stability: number;
    };
    testsPassed: number;
    testsFailed: number;
    vulnerabilities: SecurityVulnerability[];
    recommendations: string[];
    approved: boolean;
}

export interface SecurityVulnerability {
    type: 'critical' | 'high' | 'medium' | 'low';
    category: 'code_injection' | 'data_leak' | 'resource_abuse' | 'privilege_escalation' | 'other';
    description: string;
    location?: string;
    remediation?: string;
}

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    permissions?: string[];
    dependencies?: Record<string, string>;
}

// Security patterns to check for
const SECURITY_PATTERNS: { pattern: RegExp; type: SecurityVulnerability['type']; category: SecurityVulnerability['category']; description: string }[] = [
    { pattern: /eval\s*\(/gi, type: 'critical', category: 'code_injection', description: 'Use of eval() is dangerous' },
    { pattern: /new\s+Function\s*\(/gi, type: 'critical', category: 'code_injection', description: 'Dynamic function creation detected' },
    { pattern: /child_process/gi, type: 'high', category: 'privilege_escalation', description: 'Child process usage detected' },
    { pattern: /fs\.unlink|fs\.rm|fs\.rmdir/gi, type: 'high', category: 'resource_abuse', description: 'File deletion capability' },
    { pattern: /process\.env/gi, type: 'medium', category: 'data_leak', description: 'Environment variable access' },
    { pattern: /require\s*\(\s*['"`]\.\./gi, type: 'medium', category: 'privilege_escalation', description: 'Parent directory access' },
    { pattern: /XMLHttpRequest|fetch\s*\(/gi, type: 'low', category: 'data_leak', description: 'Network request capability' },
    { pattern: /document\.cookie|localStorage|sessionStorage/gi, type: 'medium', category: 'data_leak', description: 'Storage access detected' },
];

// Innovation indicators
const INNOVATION_INDICATORS = [
    'machine learning', 'ml', 'ai', 'neural',
    'quantum', 'blockchain', 'decentralized',
    'real-time', 'streaming', 'websocket',
    'visualization', '3d', 'vr', 'ar',
    'automation', 'smart', 'adaptive',
];

export class PluginAutoTester extends EventEmitter {
    private static instance: PluginAutoTester;
    private testResults: Map<string, PluginTestResult[]> = new Map();
    private approvedPlugins: Set<string> = new Set();
    private rejectedPlugins: Set<string> = new Set();

    private constructor() {
        super();
    }

    static getInstance(): PluginAutoTester {
        if (!PluginAutoTester.instance) {
            PluginAutoTester.instance = new PluginAutoTester();
        }
        return PluginAutoTester.instance;
    }

    // ========================================================================
    // TESTING
    // ========================================================================

    /**
     * Run comprehensive tests on a plugin
     */
    async testPlugin(manifest: PluginManifest, sourceCode: string): Promise<PluginTestResult> {
        this.emit('plugin:testing', manifest.id);

        const vulnerabilities: SecurityVulnerability[] = [];
        let testsPassed = 0;
        let testsFailed = 0;

        // Security analysis
        const securityScore = await this.analyzeSecurityAsync(sourceCode, vulnerabilities);

        // Compatibility checks
        const compatibilityScore = this.checkCompatibility(manifest);

        // Performance analysis
        const performanceScore = this.analyzePerformance(sourceCode);

        // Innovation assessment
        const innovationScore = this.assessInnovation(manifest, sourceCode);

        // Stability analysis
        const stabilityScore = this.analyzeStability(sourceCode);

        // Calculate overall score (weighted)
        const overallScore = Math.round(
            securityScore * 0.35 +
            compatibilityScore * 0.25 +
            performanceScore * 0.15 +
            innovationScore * 0.10 +
            stabilityScore * 0.15
        );

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            { security: securityScore, compatibility: compatibilityScore, performance: performanceScore, innovation: innovationScore, stability: stabilityScore },
            vulnerabilities
        );

        // Determine approval
        const approved = overallScore >= 60 &&
            securityScore >= 50 &&
            vulnerabilities.filter(v => v.type === 'critical').length === 0;

        const result: PluginTestResult = {
            pluginId: manifest.id,
            timestamp: new Date(),
            overallScore,
            scores: {
                compatibility: compatibilityScore,
                security: securityScore,
                performance: performanceScore,
                innovation: innovationScore,
                stability: stabilityScore,
            },
            testsPassed,
            testsFailed,
            vulnerabilities,
            recommendations,
            approved,
        };

        // Store result
        const pluginResults = this.testResults.get(manifest.id) || [];
        pluginResults.push(result);
        this.testResults.set(manifest.id, pluginResults);

        // Update approval status
        if (approved) {
            this.approvedPlugins.add(manifest.id);
            this.rejectedPlugins.delete(manifest.id);
        } else {
            this.rejectedPlugins.add(manifest.id);
            this.approvedPlugins.delete(manifest.id);
        }

        this.emit('plugin:tested', result);
        return result;
    }

    /**
     * Security analysis with pattern matching
     */
    private async analyzeSecurityAsync(code: string, vulnerabilities: SecurityVulnerability[]): Promise<number> {
        let score = 100;

        for (const { pattern, type, category, description } of SECURITY_PATTERNS) {
            const matches = code.match(pattern);
            if (matches) {
                vulnerabilities.push({
                    type,
                    category,
                    description: `${description} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
                });

                // Deduct points based on severity
                switch (type) {
                    case 'critical': score -= 30; break;
                    case 'high': score -= 20; break;
                    case 'medium': score -= 10; break;
                    case 'low': score -= 5; break;
                }
            }
        }

        // Check for obfuscated code (potential malware indicator)
        const obfuscationIndicators = [
            /\\x[0-9a-f]{2}/gi, // Hex escapes
            /\[['"`]\w+['"`]\]/g, // Bracket notation
            /String\.fromCharCode/gi,
        ];

        for (const pattern of obfuscationIndicators) {
            if (pattern.test(code)) {
                score -= 15;
                vulnerabilities.push({
                    type: 'high',
                    category: 'other',
                    description: 'Potential code obfuscation detected',
                });
            }
        }

        return Math.max(0, score);
    }

    /**
     * Check plugin compatibility with Shadow AI
     */
    private checkCompatibility(manifest: PluginManifest): number {
        let score = 100;

        // Check required fields
        if (!manifest.main) score -= 20;
        if (!manifest.version) score -= 10;
        if (!manifest.description) score -= 5;

        // Check version format
        if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
            score -= 10;
        }

        // Check for excessive permissions
        if (manifest.permissions) {
            const dangerousPerms = ['fs', 'shell', 'network', 'system'];
            for (const perm of manifest.permissions) {
                if (dangerousPerms.includes(perm)) {
                    score -= 5;
                }
            }
        }

        return Math.max(0, score);
    }

    /**
     * Analyze code for performance issues
     */
    private analyzePerformance(code: string): number {
        let score = 100;

        // Check for performance anti-patterns
        const antiPatterns = [
            { pattern: /while\s*\(\s*true\s*\)/gi, penalty: 20, desc: 'Infinite loop' },
            { pattern: /setInterval\s*\([^)]+,\s*\d{1,3}\)/gi, penalty: 15, desc: 'Fast interval' },
            { pattern: /\.forEach\(.*\.forEach/gi, penalty: 10, desc: 'Nested iteration' },
            { pattern: /JSON\.parse\(JSON\.stringify/gi, penalty: 10, desc: 'Deep clone via JSON' },
            { pattern: /new RegExp\(/gi, penalty: 5, desc: 'Dynamic regex' },
        ];

        for (const { pattern, penalty } of antiPatterns) {
            if (pattern.test(code)) {
                score -= penalty;
            }
        }

        // Bonus for async/await usage
        if (/async\s+function|await\s+/gi.test(code)) {
            score = Math.min(100, score + 5);
        }

        return Math.max(0, score);
    }

    /**
     * Assess innovation potential
     */
    private assessInnovation(manifest: PluginManifest, code: string): number {
        let score = 50; // Base score

        const fullText = `${manifest.name} ${manifest.description} ${code}`.toLowerCase();

        for (const indicator of INNOVATION_INDICATORS) {
            if (fullText.includes(indicator)) {
                score += 5;
            }
        }

        // Bonus for using modern APIs
        if (/WebSocket|Worker|SharedArrayBuffer|WebAssembly/gi.test(code)) {
            score += 10;
        }

        return Math.min(100, score);
    }

    /**
     * Analyze code stability
     */
    private analyzeStability(code: string): number {
        let score = 100;

        // Check for error handling
        const tryCatchCount = (code.match(/try\s*{/g) || []).length;
        const functionCount = (code.match(/function\s+\w+|=>\s*{/g) || []).length;

        if (functionCount > 0 && tryCatchCount / functionCount < 0.3) {
            score -= 20; // Insufficient error handling
        }

        // Check for type safety indicators
        if (!/:\s*(string|number|boolean|any|void)/gi.test(code)) {
            score -= 10; // Likely no TypeScript
        }

        // Check for tests
        if (/describe\s*\(|it\s*\(|test\s*\(/gi.test(code)) {
            score = Math.min(100, score + 10); // Has tests
        }

        return Math.max(0, score);
    }

    /**
     * Generate improvement recommendations
     */
    private generateRecommendations(scores: Record<string, number>, vulnerabilities: SecurityVulnerability[]): string[] {
        const recommendations: string[] = [];

        if (scores.security < 70) {
            recommendations.push('Review and fix security vulnerabilities before publishing');
        }

        if (vulnerabilities.some(v => v.type === 'critical')) {
            recommendations.push('CRITICAL: Remove eval() and dynamic code execution');
        }

        if (scores.compatibility < 80) {
            recommendations.push('Ensure manifest.json has all required fields');
        }

        if (scores.performance < 70) {
            recommendations.push('Optimize performance by avoiding nested loops and using async patterns');
        }

        if (scores.stability < 70) {
            recommendations.push('Add comprehensive error handling and TypeScript types');
        }

        if (scores.innovation < 60) {
            recommendations.push('Consider adding innovative features to stand out');
        }

        return recommendations;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    isApproved(pluginId: string): boolean {
        return this.approvedPlugins.has(pluginId);
    }

    getTestResults(pluginId: string): PluginTestResult[] {
        return this.testResults.get(pluginId) || [];
    }

    getLatestResult(pluginId: string): PluginTestResult | undefined {
        const results = this.testResults.get(pluginId);
        return results?.[results.length - 1];
    }

    getAllApproved(): string[] {
        return Array.from(this.approvedPlugins);
    }

    getAllRejected(): string[] {
        return Array.from(this.rejectedPlugins);
    }
}

export const pluginAutoTester = PluginAutoTester.getInstance();
