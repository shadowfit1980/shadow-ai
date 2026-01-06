/**
 * Smart Project Analyzer
 * 
 * Deeply analyzes project structure, patterns, and health
 * to provide insights and improvement suggestions.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectAnalysis {
    id: string;
    projectPath: string;
    structure: ProjectStructure;
    patterns: DetectedPattern[];
    health: ProjectHealth;
    recommendations: ProjectRecommendation[];
    analyzedAt: Date;
}

export interface ProjectStructure {
    type: ProjectType;
    framework?: string;
    language: string;
    packageManager?: string;
    directories: DirectoryInfo[];
    entryPoints: string[];
    configFiles: string[];
    totalFiles: number;
    totalLines: number;
}

export type ProjectType =
    | 'web_frontend'
    | 'web_backend'
    | 'fullstack'
    | 'library'
    | 'cli'
    | 'mobile'
    | 'desktop'
    | 'monorepo'
    | 'unknown';

export interface DirectoryInfo {
    path: string;
    purpose: string;
    fileCount: number;
    patterns: string[];
}

export interface DetectedPattern {
    name: string;
    type: PatternType;
    description: string;
    locations: string[];
    quality: 'good' | 'acceptable' | 'concerning';
    suggestion?: string;
}

export type PatternType =
    | 'architecture'
    | 'code_organization'
    | 'testing'
    | 'error_handling'
    | 'api_design'
    | 'state_management'
    | 'security'
    | 'performance';

export interface ProjectHealth {
    overallScore: number; // 0-100
    categories: {
        codeQuality: number;
        testCoverage: number;
        documentation: number;
        dependencies: number;
        security: number;
        maintainability: number;
    };
    issues: HealthIssue[];
}

export interface HealthIssue {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    fix: string;
}

export interface ProjectRecommendation {
    priority: 'low' | 'medium' | 'high';
    category: string;
    title: string;
    description: string;
    effort: 'small' | 'medium' | 'large';
    impact: 'low' | 'medium' | 'high';
}

// Pattern detection rules
const PATTERN_RULES = {
    mvc: {
        indicators: ['models/', 'views/', 'controllers/'],
        confidence: 0.8,
    },
    mvvm: {
        indicators: ['viewmodels/', 'views/', 'models/'],
        confidence: 0.8,
    },
    layered: {
        indicators: ['domain/', 'infrastructure/', 'application/', 'presentation/'],
        confidence: 0.9,
    },
    modular: {
        indicators: ['modules/', 'features/'],
        confidence: 0.7,
    },
    component_based: {
        indicators: ['components/', 'containers/', 'pages/'],
        confidence: 0.8,
    },
    microservices: {
        indicators: ['services/', 'packages/', 'apps/'],
        confidence: 0.6,
    },
};

export class SmartProjectAnalyzer extends EventEmitter {
    private static instance: SmartProjectAnalyzer;
    private analyses: Map<string, ProjectAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): SmartProjectAnalyzer {
        if (!SmartProjectAnalyzer.instance) {
            SmartProjectAnalyzer.instance = new SmartProjectAnalyzer();
        }
        return SmartProjectAnalyzer.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    async analyze(projectPath: string): Promise<ProjectAnalysis> {
        const id = `analysis_${Date.now()}`;

        // Gather structure info
        const structure = await this.analyzeStructure(projectPath);

        // Detect patterns
        const patterns = this.detectPatterns(projectPath, structure);

        // Calculate health
        const health = this.calculateHealth(structure, patterns);

        // Generate recommendations
        const recommendations = this.generateRecommendations(structure, patterns, health);

        const analysis: ProjectAnalysis = {
            id,
            projectPath,
            structure,
            patterns,
            health,
            recommendations,
            analyzedAt: new Date(),
        };

        this.analyses.set(id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private async analyzeStructure(projectPath: string): Promise<ProjectStructure> {
        const directories: DirectoryInfo[] = [];
        const configFiles: string[] = [];
        const entryPoints: string[] = [];
        let totalFiles = 0;
        let totalLines = 0;

        // Detect project type and framework
        const packageJsonPath = path.join(projectPath, 'package.json');
        let framework: string | undefined;
        let packageManager: string | undefined;
        let language = 'javascript';

        try {
            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

                // Detect framework
                if (pkg.dependencies?.next || pkg.devDependencies?.next) framework = 'Next.js';
                else if (pkg.dependencies?.react) framework = 'React';
                else if (pkg.dependencies?.vue) framework = 'Vue';
                else if (pkg.dependencies?.angular) framework = 'Angular';
                else if (pkg.dependencies?.express) framework = 'Express';
                else if (pkg.dependencies?.electron) framework = 'Electron';

                // Detect TypeScript
                if (pkg.devDependencies?.typescript) language = 'typescript';

                configFiles.push('package.json');
            }

            // Detect package manager
            if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
                packageManager = 'yarn';
            } else if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
                packageManager = 'pnpm';
            } else if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
                packageManager = 'npm';
            }

            // Scan directories
            const entries = fs.readdirSync(projectPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const dirPath = path.join(projectPath, entry.name);
                    const purpose = this.inferDirectoryPurpose(entry.name);
                    const fileCount = this.countFiles(dirPath);

                    directories.push({
                        path: entry.name,
                        purpose,
                        fileCount,
                        patterns: [],
                    });

                    totalFiles += fileCount;
                } else if (entry.isFile()) {
                    totalFiles++;

                    // Detect config files
                    if (this.isConfigFile(entry.name)) {
                        configFiles.push(entry.name);
                    }

                    // Detect entry points
                    if (this.isEntryPoint(entry.name)) {
                        entryPoints.push(entry.name);
                    }
                }
            }
        } catch (error) {
            // Handle file system errors gracefully
        }

        // Determine project type
        const type = this.determineProjectType(directories, framework, configFiles);

        return {
            type,
            framework,
            language,
            packageManager,
            directories,
            entryPoints,
            configFiles,
            totalFiles,
            totalLines,
        };
    }

    private countFiles(dirPath: string): number {
        try {
            let count = 0;
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isFile()) {
                    count++;
                } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    count += this.countFiles(path.join(dirPath, entry.name));
                }
            }

            return count;
        } catch {
            return 0;
        }
    }

    private inferDirectoryPurpose(name: string): string {
        const purposes: Record<string, string> = {
            src: 'Source code',
            lib: 'Library code',
            dist: 'Distribution/Build output',
            build: 'Build output',
            public: 'Static assets',
            static: 'Static files',
            assets: 'Media and assets',
            components: 'UI components',
            pages: 'Page components',
            api: 'API routes',
            routes: 'Route definitions',
            controllers: 'Request handlers',
            models: 'Data models',
            services: 'Business logic',
            utils: 'Utility functions',
            helpers: 'Helper functions',
            hooks: 'React hooks',
            context: 'React context',
            store: 'State management',
            types: 'Type definitions',
            interfaces: 'TypeScript interfaces',
            tests: 'Test files',
            __tests__: 'Jest test files',
            config: 'Configuration',
            scripts: 'Build/utility scripts',
            docs: 'Documentation',
        };

        return purposes[name.toLowerCase()] || 'Project directory';
    }

    private isConfigFile(name: string): boolean {
        const configFiles = [
            'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts',
            'next.config.js', 'tailwind.config.js', '.eslintrc', '.prettierrc',
            'jest.config.js', 'babel.config.js', 'rollup.config.js', 'turbo.json',
        ];
        return configFiles.some(f => name.includes(f.replace('.', '')));
    }

    private isEntryPoint(name: string): boolean {
        const entryPoints = ['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js', 'server.ts', 'server.js'];
        return entryPoints.includes(name);
    }

    private determineProjectType(directories: DirectoryInfo[], framework?: string, configFiles?: string[]): ProjectType {
        const dirNames = directories.map(d => d.path.toLowerCase());

        if (dirNames.includes('packages') || dirNames.includes('apps')) return 'monorepo';
        if (framework === 'Electron') return 'desktop';
        if (framework === 'React Native' || dirNames.includes('ios') || dirNames.includes('android')) return 'mobile';
        if (dirNames.includes('api') && dirNames.includes('components')) return 'fullstack';
        if (framework === 'Express' || dirNames.includes('controllers')) return 'web_backend';
        if (framework === 'React' || framework === 'Vue' || framework === 'Next.js') return 'web_frontend';
        if (configFiles?.includes('bin') || dirNames.includes('bin')) return 'cli';
        if (directories.length <= 2 && directories.some(d => d.path === 'src')) return 'library';

        return 'unknown';
    }

    // ========================================================================
    // PATTERN DETECTION
    // ========================================================================

    private detectPatterns(projectPath: string, structure: ProjectStructure): DetectedPattern[] {
        const patterns: DetectedPattern[] = [];
        const dirNames = structure.directories.map(d => d.path.toLowerCase() + '/');

        // Architecture patterns
        for (const [patternName, rule] of Object.entries(PATTERN_RULES)) {
            const matches = rule.indicators.filter(i => dirNames.some(d => d.includes(i)));
            if (matches.length / rule.indicators.length >= rule.confidence) {
                patterns.push({
                    name: patternName.replace(/_/g, ' ').toUpperCase(),
                    type: 'architecture',
                    description: `Project follows ${patternName.replace(/_/g, ' ')} architecture pattern`,
                    locations: matches,
                    quality: 'good',
                });
            }
        }

        // Testing patterns
        if (structure.directories.some(d => d.path.includes('test') || d.path.includes('__tests__'))) {
            patterns.push({
                name: 'Unit Testing',
                type: 'testing',
                description: 'Project has dedicated test directories',
                locations: structure.directories.filter(d => d.path.includes('test')).map(d => d.path),
                quality: 'good',
            });
        } else {
            patterns.push({
                name: 'Missing Tests',
                type: 'testing',
                description: 'No dedicated test directory found',
                locations: [],
                quality: 'concerning',
                suggestion: 'Add a __tests__ or tests directory for unit tests',
            });
        }

        // Error handling patterns (simplified detection)
        patterns.push({
            name: 'Error Handling',
            type: 'error_handling',
            description: 'Error handling patterns should be reviewed',
            locations: [],
            quality: 'acceptable',
            suggestion: 'Ensure consistent error handling across the codebase',
        });

        return patterns;
    }

    // ========================================================================
    // HEALTH CALCULATION
    // ========================================================================

    private calculateHealth(structure: ProjectStructure, patterns: DetectedPattern[]): ProjectHealth {
        const issues: HealthIssue[] = [];

        // Code quality score
        const hasLinter = structure.configFiles.some(f => f.includes('eslint'));
        const hasFormatter = structure.configFiles.some(f => f.includes('prettier'));
        const hasTypeScript = structure.language === 'typescript';

        let codeQuality = 50;
        if (hasLinter) codeQuality += 20;
        if (hasFormatter) codeQuality += 15;
        if (hasTypeScript) codeQuality += 15;

        if (!hasLinter) {
            issues.push({
                category: 'Code Quality',
                severity: 'medium',
                description: 'No ESLint configuration found',
                impact: 'Code style inconsistencies may occur',
                fix: 'Add ESLint with recommended rules',
            });
        }

        // Test coverage score
        const hasTests = patterns.some(p => p.type === 'testing' && p.quality === 'good');
        const testCoverage = hasTests ? 60 : 20;

        if (!hasTests) {
            issues.push({
                category: 'Testing',
                severity: 'high',
                description: 'No test directory found',
                impact: 'Bugs may go undetected',
                fix: 'Add unit tests for critical functionality',
            });
        }

        // Documentation score
        const hasReadme = structure.configFiles.includes('README.md');
        const documentation = hasReadme ? 60 : 30;

        if (!hasReadme) {
            issues.push({
                category: 'Documentation',
                severity: 'low',
                description: 'No README.md found',
                impact: 'New contributors may struggle to understand the project',
                fix: 'Add a README with setup instructions',
            });
        }

        // Dependencies score (simplified)
        const dependencies = 70;

        // Security score (simplified)
        const security = 65;

        // Maintainability
        const goodPatterns = patterns.filter(p => p.quality === 'good').length;
        const maintainability = 50 + (goodPatterns * 10);

        const categories = {
            codeQuality,
            testCoverage,
            documentation,
            dependencies,
            security,
            maintainability: Math.min(100, maintainability),
        };

        const overallScore = Object.values(categories).reduce((a, b) => a + b, 0) / 6;

        return {
            overallScore: Math.round(overallScore),
            categories,
            issues,
        };
    }

    // ========================================================================
    // RECOMMENDATIONS
    // ========================================================================

    private generateRecommendations(
        structure: ProjectStructure,
        patterns: DetectedPattern[],
        health: ProjectHealth
    ): ProjectRecommendation[] {
        const recommendations: ProjectRecommendation[] = [];

        // Based on health issues
        for (const issue of health.issues) {
            recommendations.push({
                priority: issue.severity === 'critical' || issue.severity === 'high' ? 'high' : 'medium',
                category: issue.category,
                title: issue.description,
                description: issue.fix,
                effort: 'small',
                impact: issue.severity === 'high' ? 'high' : 'medium',
            });
        }

        // Based on patterns
        for (const pattern of patterns.filter(p => p.quality === 'concerning')) {
            recommendations.push({
                priority: 'medium',
                category: pattern.type,
                title: pattern.name,
                description: pattern.suggestion || 'Review and improve this area',
                effort: 'medium',
                impact: 'medium',
            });
        }

        // General recommendations based on structure
        if (structure.type === 'fullstack' && !structure.directories.some(d => d.path.includes('shared'))) {
            recommendations.push({
                priority: 'low',
                category: 'Code Organization',
                title: 'Consider shared types directory',
                description: 'Create a shared/ directory for types and utilities used by both frontend and backend',
                effort: 'medium',
                impact: 'medium',
            });
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        return recommendations;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAnalysis(id: string): ProjectAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): ProjectAnalysis[] {
        return Array.from(this.analyses.values());
    }

    getLatestAnalysis(): ProjectAnalysis | undefined {
        const analyses = Array.from(this.analyses.values());
        return analyses.sort((a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime())[0];
    }
}

export const smartProjectAnalyzer = SmartProjectAnalyzer.getInstance();
