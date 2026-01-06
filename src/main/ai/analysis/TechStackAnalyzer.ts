/**
 * Tech Stack Analyzer
 * 
 * Analyze project dependencies, frameworks, and technologies
 * to provide insights, recommendations, and migration paths.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface TechStackAnalysis {
    projectName: string;
    projectPath: string;
    frameworks: FrameworkInfo[];
    languages: LanguageInfo[];
    dependencies: DependencyInfo[];
    devDependencies: DependencyInfo[];
    buildTools: string[];
    testingFrameworks: string[];
    linters: string[];
    bundlers: string[];
    databases: string[];
    cloudServices: string[];
    cicd: string[];
    recommendations: Recommendation[];
    healthScore: number;
}

export interface FrameworkInfo {
    name: string;
    version: string;
    category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'testing' | 'other';
    popularity: 'high' | 'medium' | 'low';
    latestVersion?: string;
    isOutdated: boolean;
}

export interface LanguageInfo {
    name: string;
    percentage: number;
    fileCount: number;
    linesOfCode: number;
}

export interface DependencyInfo {
    name: string;
    version: string;
    latestVersion?: string;
    isOutdated: boolean;
    isDeprecated: boolean;
    vulnerabilities: number;
    license: string;
    size?: string;
}

export interface Recommendation {
    type: 'upgrade' | 'replace' | 'add' | 'remove' | 'security' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    action: string;
    impact: string;
}

// ============================================================================
// TECH STACK ANALYZER
// ============================================================================

export class TechStackAnalyzer extends EventEmitter {
    private static instance: TechStackAnalyzer;

    private frameworkPatterns: Map<string, { category: FrameworkInfo['category']; popularity: FrameworkInfo['popularity'] }> = new Map([
        ['react', { category: 'frontend', popularity: 'high' }],
        ['vue', { category: 'frontend', popularity: 'high' }],
        ['angular', { category: 'frontend', popularity: 'high' }],
        ['svelte', { category: 'frontend', popularity: 'medium' }],
        ['next', { category: 'fullstack', popularity: 'high' }],
        ['nuxt', { category: 'fullstack', popularity: 'medium' }],
        ['express', { category: 'backend', popularity: 'high' }],
        ['fastify', { category: 'backend', popularity: 'medium' }],
        ['nest', { category: 'backend', popularity: 'high' }],
        ['koa', { category: 'backend', popularity: 'medium' }],
        ['django', { category: 'backend', popularity: 'high' }],
        ['flask', { category: 'backend', popularity: 'high' }],
        ['fastapi', { category: 'backend', popularity: 'high' }],
        ['spring', { category: 'backend', popularity: 'high' }],
        ['go', { category: 'backend', popularity: 'high' }],
        ['react-native', { category: 'mobile', popularity: 'high' }],
        ['flutter', { category: 'mobile', popularity: 'high' }],
        ['expo', { category: 'mobile', popularity: 'high' }],
        ['electron', { category: 'fullstack', popularity: 'high' }],
        ['tauri', { category: 'fullstack', popularity: 'medium' }],
    ]);

    private constructor() {
        super();
    }

    static getInstance(): TechStackAnalyzer {
        if (!TechStackAnalyzer.instance) {
            TechStackAnalyzer.instance = new TechStackAnalyzer();
        }
        return TechStackAnalyzer.instance;
    }

    // ========================================================================
    // MAIN ANALYSIS
    // ========================================================================

    async analyzeProject(projectPath: string): Promise<TechStackAnalysis> {
        const projectName = path.basename(projectPath);

        const packageJsonPath = path.join(projectPath, 'package.json');
        let packageJson: any = null;

        if (fs.existsSync(packageJsonPath)) {
            packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        }

        const frameworks = this.detectFrameworks(packageJson);
        const languages = await this.analyzeLanguages(projectPath);
        const dependencies = this.analyzeDependencies(packageJson?.dependencies || {});
        const devDependencies = this.analyzeDependencies(packageJson?.devDependencies || {});
        const buildTools = this.detectBuildTools(packageJson);
        const testingFrameworks = this.detectTestingFrameworks(packageJson);
        const linters = this.detectLinters(projectPath, packageJson);
        const bundlers = this.detectBundlers(packageJson);
        const databases = this.detectDatabases(projectPath, packageJson);
        const cloudServices = this.detectCloudServices(projectPath, packageJson);
        const cicd = this.detectCICD(projectPath);

        const recommendations = this.generateRecommendations({
            frameworks, dependencies, devDependencies, testingFrameworks, linters
        });

        const healthScore = this.calculateHealthScore({
            frameworks, dependencies, devDependencies, testingFrameworks, linters, recommendations
        });

        const analysis: TechStackAnalysis = {
            projectName,
            projectPath,
            frameworks,
            languages,
            dependencies,
            devDependencies,
            buildTools,
            testingFrameworks,
            linters,
            bundlers,
            databases,
            cloudServices,
            cicd,
            recommendations,
            healthScore,
        };

        this.emit('analyzed', analysis);
        return analysis;
    }

    // ========================================================================
    // FRAMEWORK DETECTION
    // ========================================================================

    private detectFrameworks(packageJson: any): FrameworkInfo[] {
        const frameworks: FrameworkInfo[] = [];
        if (!packageJson) return frameworks;

        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        for (const [name, version] of Object.entries(allDeps)) {
            const normalizedName = name.replace('@', '').split('/')[0];
            const pattern = this.frameworkPatterns.get(normalizedName);

            if (pattern) {
                frameworks.push({
                    name,
                    version: version as string,
                    category: pattern.category,
                    popularity: pattern.popularity,
                    isOutdated: false, // Would need npm registry lookup
                });
            }
        }

        return frameworks;
    }

    // ========================================================================
    // LANGUAGE ANALYSIS
    // ========================================================================

    private async analyzeLanguages(projectPath: string): Promise<LanguageInfo[]> {
        const extensions: Record<string, { name: string; lines: number; files: number }> = {
            '.ts': { name: 'TypeScript', lines: 0, files: 0 },
            '.tsx': { name: 'TypeScript (React)', lines: 0, files: 0 },
            '.js': { name: 'JavaScript', lines: 0, files: 0 },
            '.jsx': { name: 'JavaScript (React)', lines: 0, files: 0 },
            '.py': { name: 'Python', lines: 0, files: 0 },
            '.go': { name: 'Go', lines: 0, files: 0 },
            '.rs': { name: 'Rust', lines: 0, files: 0 },
            '.java': { name: 'Java', lines: 0, files: 0 },
            '.rb': { name: 'Ruby', lines: 0, files: 0 },
            '.php': { name: 'PHP', lines: 0, files: 0 },
            '.swift': { name: 'Swift', lines: 0, files: 0 },
            '.kt': { name: 'Kotlin', lines: 0, files: 0 },
            '.dart': { name: 'Dart', lines: 0, files: 0 },
            '.css': { name: 'CSS', lines: 0, files: 0 },
            '.scss': { name: 'SCSS', lines: 0, files: 0 },
            '.html': { name: 'HTML', lines: 0, files: 0 },
        };

        const walk = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
                        walk(fullPath);
                    }
                } else {
                    const ext = path.extname(entry.name);
                    if (extensions[ext]) {
                        extensions[ext].files++;
                        try {
                            const content = fs.readFileSync(fullPath, 'utf-8');
                            extensions[ext].lines += content.split('\n').length;
                        } catch { }
                    }
                }
            }
        };

        try {
            walk(projectPath);
        } catch { }

        const totalLines = Object.values(extensions).reduce((sum, e) => sum + e.lines, 0);

        return Object.entries(extensions)
            .filter(([_, data]) => data.files > 0)
            .map(([_, data]) => ({
                name: data.name,
                percentage: totalLines > 0 ? Math.round((data.lines / totalLines) * 100) : 0,
                fileCount: data.files,
                linesOfCode: data.lines,
            }))
            .sort((a, b) => b.percentage - a.percentage);
    }

    // ========================================================================
    // DEPENDENCY ANALYSIS
    // ========================================================================

    private analyzeDependencies(deps: Record<string, string>): DependencyInfo[] {
        return Object.entries(deps).map(([name, version]) => ({
            name,
            version,
            isOutdated: false,
            isDeprecated: false,
            vulnerabilities: 0,
            license: 'Unknown',
        }));
    }

    // ========================================================================
    // TOOL DETECTION
    // ========================================================================

    private detectBuildTools(packageJson: any): string[] {
        const tools: string[] = [];
        const scripts = packageJson?.scripts || {};
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

        if (deps['typescript'] || deps['tsc']) tools.push('TypeScript');
        if (deps['webpack']) tools.push('Webpack');
        if (deps['vite']) tools.push('Vite');
        if (deps['rollup']) tools.push('Rollup');
        if (deps['esbuild']) tools.push('esbuild');
        if (deps['parcel']) tools.push('Parcel');
        if (deps['turbo']) tools.push('Turborepo');
        if (deps['nx']) tools.push('Nx');
        if (deps['lerna']) tools.push('Lerna');

        return tools;
    }

    private detectTestingFrameworks(packageJson: any): string[] {
        const frameworks: string[] = [];
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

        if (deps['jest']) frameworks.push('Jest');
        if (deps['vitest']) frameworks.push('Vitest');
        if (deps['mocha']) frameworks.push('Mocha');
        if (deps['cypress']) frameworks.push('Cypress');
        if (deps['playwright']) frameworks.push('Playwright');
        if (deps['puppeteer']) frameworks.push('Puppeteer');
        if (deps['@testing-library/react']) frameworks.push('React Testing Library');
        if (deps['supertest']) frameworks.push('Supertest');

        return frameworks;
    }

    private detectLinters(projectPath: string, packageJson: any): string[] {
        const linters: string[] = [];
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

        if (deps['eslint']) linters.push('ESLint');
        if (deps['prettier']) linters.push('Prettier');
        if (deps['stylelint']) linters.push('Stylelint');
        if (deps['@typescript-eslint/parser']) linters.push('TypeScript ESLint');
        if (fs.existsSync(path.join(projectPath, '.eslintrc.json'))) linters.push('ESLint Config');
        if (fs.existsSync(path.join(projectPath, '.prettierrc'))) linters.push('Prettier Config');

        return [...new Set(linters)];
    }

    private detectBundlers(packageJson: any): string[] {
        const bundlers: string[] = [];
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

        if (deps['webpack']) bundlers.push('Webpack');
        if (deps['vite']) bundlers.push('Vite');
        if (deps['rollup']) bundlers.push('Rollup');
        if (deps['esbuild']) bundlers.push('esbuild');
        if (deps['parcel']) bundlers.push('Parcel');
        if (deps['swc']) bundlers.push('SWC');

        return bundlers;
    }

    private detectDatabases(projectPath: string, packageJson: any): string[] {
        const databases: string[] = [];
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

        if (deps['prisma'] || deps['@prisma/client']) databases.push('Prisma');
        if (deps['mongoose'] || deps['mongodb']) databases.push('MongoDB');
        if (deps['pg'] || deps['postgres']) databases.push('PostgreSQL');
        if (deps['mysql'] || deps['mysql2']) databases.push('MySQL');
        if (deps['redis'] || deps['ioredis']) databases.push('Redis');
        if (deps['sqlite3'] || deps['better-sqlite3']) databases.push('SQLite');
        if (deps['firebase'] || deps['firebase-admin']) databases.push('Firebase');
        if (deps['@supabase/supabase-js']) databases.push('Supabase');
        if (deps['drizzle-orm']) databases.push('Drizzle');
        if (deps['typeorm']) databases.push('TypeORM');
        if (deps['sequelize']) databases.push('Sequelize');
        if (deps['knex']) databases.push('Knex');

        return databases;
    }

    private detectCloudServices(projectPath: string, packageJson: any): string[] {
        const services: string[] = [];
        const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

        if (deps['@aws-sdk/client-s3'] || deps['aws-sdk']) services.push('AWS');
        if (deps['@google-cloud/storage'] || deps['googleapis']) services.push('Google Cloud');
        if (deps['@azure/storage-blob']) services.push('Azure');
        if (deps['@vercel/kv'] || deps['@vercel/postgres']) services.push('Vercel');
        if (deps['stripe']) services.push('Stripe');
        if (deps['@sendgrid/mail']) services.push('SendGrid');
        if (deps['twilio']) services.push('Twilio');
        if (deps['cloudinary']) services.push('Cloudinary');
        if (deps['@sentry/node']) services.push('Sentry');
        if (deps['@launchdarkly/node-server-sdk']) services.push('LaunchDarkly');

        return services;
    }

    private detectCICD(projectPath: string): string[] {
        const cicd: string[] = [];

        if (fs.existsSync(path.join(projectPath, '.github/workflows'))) cicd.push('GitHub Actions');
        if (fs.existsSync(path.join(projectPath, '.gitlab-ci.yml'))) cicd.push('GitLab CI');
        if (fs.existsSync(path.join(projectPath, 'bitbucket-pipelines.yml'))) cicd.push('Bitbucket Pipelines');
        if (fs.existsSync(path.join(projectPath, '.circleci'))) cicd.push('CircleCI');
        if (fs.existsSync(path.join(projectPath, 'Jenkinsfile'))) cicd.push('Jenkins');
        if (fs.existsSync(path.join(projectPath, '.travis.yml'))) cicd.push('Travis CI');
        if (fs.existsSync(path.join(projectPath, 'vercel.json'))) cicd.push('Vercel');
        if (fs.existsSync(path.join(projectPath, 'netlify.toml'))) cicd.push('Netlify');

        return cicd;
    }

    // ========================================================================
    // RECOMMENDATIONS
    // ========================================================================

    private generateRecommendations(data: {
        frameworks: FrameworkInfo[];
        dependencies: DependencyInfo[];
        devDependencies: DependencyInfo[];
        testingFrameworks: string[];
        linters: string[];
    }): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Testing
        if (data.testingFrameworks.length === 0) {
            recommendations.push({
                type: 'add',
                severity: 'high',
                title: 'Add Testing Framework',
                description: 'No testing framework detected. Testing is essential for maintainability.',
                action: 'Install Vitest or Jest for unit testing',
                impact: 'Improved code quality and confidence in changes',
            });
        }

        // Linting
        if (!data.linters.includes('ESLint')) {
            recommendations.push({
                type: 'add',
                severity: 'medium',
                title: 'Add ESLint',
                description: 'ESLint helps maintain code quality and consistency.',
                action: 'Install and configure ESLint',
                impact: 'Consistent code style and early error detection',
            });
        }

        // TypeScript
        const allDeps = [...data.dependencies, ...data.devDependencies];
        const hasTS = allDeps.some(d => d.name === 'typescript');
        if (!hasTS && data.frameworks.some(f => ['react', 'next', 'vue', 'express'].includes(f.name))) {
            recommendations.push({
                type: 'add',
                severity: 'medium',
                title: 'Consider TypeScript',
                description: 'TypeScript provides type safety and better developer experience.',
                action: 'Add TypeScript to the project',
                impact: 'Reduced runtime errors and improved IDE support',
            });
        }

        return recommendations;
    }

    // ========================================================================
    // HEALTH SCORE
    // ========================================================================

    private calculateHealthScore(data: {
        frameworks: FrameworkInfo[];
        dependencies: DependencyInfo[];
        devDependencies: DependencyInfo[];
        testingFrameworks: string[];
        linters: string[];
        recommendations: Recommendation[];
    }): number {
        let score = 100;

        // Deduct for missing testing
        if (data.testingFrameworks.length === 0) score -= 20;

        // Deduct for missing linting
        if (data.linters.length === 0) score -= 10;

        // Deduct for critical recommendations
        score -= data.recommendations.filter(r => r.severity === 'critical').length * 15;
        score -= data.recommendations.filter(r => r.severity === 'high').length * 10;
        score -= data.recommendations.filter(r => r.severity === 'medium').length * 5;

        return Math.max(0, Math.min(100, score));
    }

    // ========================================================================
    // REPORTING
    // ========================================================================

    generateReport(analysis: TechStackAnalysis): string {
        return `# Tech Stack Analysis: ${analysis.projectName}

## Health Score: ${analysis.healthScore}/100 ${this.getScoreEmoji(analysis.healthScore)}

## Languages
${analysis.languages.map(l => `- **${l.name}**: ${l.percentage}% (${l.linesOfCode.toLocaleString()} lines)`).join('\n')}

## Frameworks
${analysis.frameworks.map(f => `- ${f.name} (${f.version}) - ${f.category}`).join('\n') || 'None detected'}

## Dependencies
- **Production**: ${analysis.dependencies.length}
- **Development**: ${analysis.devDependencies.length}

## Build & Testing
- **Build Tools**: ${analysis.buildTools.join(', ') || 'None'}
- **Testing**: ${analysis.testingFrameworks.join(', ') || 'None'}
- **Linters**: ${analysis.linters.join(', ') || 'None'}
- **Bundlers**: ${analysis.bundlers.join(', ') || 'None'}

## Infrastructure
- **Databases**: ${analysis.databases.join(', ') || 'None'}
- **Cloud Services**: ${analysis.cloudServices.join(', ') || 'None'}
- **CI/CD**: ${analysis.cicd.join(', ') || 'None'}

## Recommendations
${analysis.recommendations.map(r => `### ${this.getSeverityEmoji(r.severity)} ${r.title}
${r.description}
**Action**: ${r.action}
**Impact**: ${r.impact}
`).join('\n') || 'No recommendations at this time.'}
`;
    }

    private getScoreEmoji(score: number): string {
        if (score >= 90) return '🟢';
        if (score >= 70) return '🟡';
        if (score >= 50) return '🟠';
        return '🔴';
    }

    private getSeverityEmoji(severity: Recommendation['severity']): string {
        switch (severity) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🟢';
        }
    }
}

export const techStackAnalyzer = TechStackAnalyzer.getInstance();
