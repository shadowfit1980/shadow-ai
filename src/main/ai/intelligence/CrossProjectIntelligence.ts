/**
 * CrossProjectIntelligence - Learning Patterns Across Projects
 * 
 * Learns coding patterns, preferences, and shared utilities across
 * all of a user's projects to provide personalized suggestions.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectProfile {
    id: string;
    path: string;
    name: string;
    languages: string[];
    frameworks: string[];
    patterns: CodingPattern[];
    lastAnalyzed: Date;
    fileCount: number;
}

export interface CodingPattern {
    id: string;
    type: 'naming' | 'structure' | 'error-handling' | 'async' | 'imports' | 'testing';
    pattern: string;
    frequency: number;
    confidence: number;
    projects: string[]; // Project IDs where pattern was found
    example?: string;
}

export interface UserPreferences {
    namingConvention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    quoteStyle: 'single' | 'double';
    semicolons: boolean;
    trailingComma: 'none' | 'es5' | 'all';
    preferredImports: 'named' | 'default' | 'namespace';
    asyncStyle: 'async-await' | 'promises' | 'callbacks';
    errorStyle: 'try-catch' | 'result-type' | 'nullable';
    testFramework: string;
    componentStyle?: 'functional' | 'class';
}

export interface SharedCode {
    signature: string;
    implementations: Array<{
        projectId: string;
        filePath: string;
        code: string;
    }>;
    suggestExtraction: boolean;
    extractionPath?: string;
}

export interface CrossProjectSuggestion {
    type: 'pattern' | 'utility' | 'convention' | 'structure';
    suggestion: string;
    reason: string;
    confidence: number;
    sourceProjects: string[];
    code?: string;
}

// ============================================================================
// CROSS PROJECT INTELLIGENCE
// ============================================================================

export class CrossProjectIntelligence extends EventEmitter {
    private static instance: CrossProjectIntelligence;

    private projects: Map<string, ProjectProfile> = new Map();
    private patterns: Map<string, CodingPattern> = new Map();
    private sharedCode: Map<string, SharedCode> = new Map();
    private userPreferences: UserPreferences | null = null;
    private codeHashes: Map<string, Set<string>> = new Map(); // hash -> projectIds

    private constructor() {
        super();
    }

    static getInstance(): CrossProjectIntelligence {
        if (!CrossProjectIntelligence.instance) {
            CrossProjectIntelligence.instance = new CrossProjectIntelligence();
        }
        return CrossProjectIntelligence.instance;
    }

    // ========================================================================
    // PROJECT ANALYSIS
    // ========================================================================

    /**
     * Analyze and register a project
     */
    async analyzeProject(projectPath: string, files: Array<{ path: string; content: string }>): Promise<ProjectProfile> {
        const projectId = this.generateProjectId(projectPath);
        const name = path.basename(projectPath);

        console.log(`🔬 [CrossProject] Analyzing: ${name}`);

        // Detect languages and frameworks
        const languages = this.detectLanguages(files);
        const frameworks = this.detectFrameworks(files);

        // Extract patterns
        const patterns = await this.extractPatterns(files, projectId);

        // Build code fingerprints for duplicate detection
        this.buildCodeFingerprints(files, projectId);

        const profile: ProjectProfile = {
            id: projectId,
            path: projectPath,
            name,
            languages,
            frameworks,
            patterns,
            lastAnalyzed: new Date(),
            fileCount: files.length
        };

        this.projects.set(projectId, profile);
        this.emit('project:analyzed', profile);

        // Update cross-project patterns
        await this.updateCrossProjectPatterns();

        console.log(`✅ [CrossProject] Analyzed ${name}: ${patterns.length} patterns, ${languages.join(', ')}`);
        return profile;
    }

    private detectLanguages(files: Array<{ path: string; content: string }>): string[] {
        const extensions: Record<string, string> = {
            '.ts': 'TypeScript', '.tsx': 'TypeScript',
            '.js': 'JavaScript', '.jsx': 'JavaScript',
            '.py': 'Python',
            '.go': 'Go',
            '.rs': 'Rust',
            '.java': 'Java',
            '.cs': 'C#',
            '.cpp': 'C++', '.c': 'C',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.swift': 'Swift',
            '.kt': 'Kotlin'
        };

        const detected = new Set<string>();
        for (const file of files) {
            const ext = path.extname(file.path);
            if (extensions[ext]) {
                detected.add(extensions[ext]);
            }
        }

        return Array.from(detected);
    }

    private detectFrameworks(files: Array<{ path: string; content: string }>): string[] {
        const frameworks: string[] = [];
        const allContent = files.map(f => f.content).join('\n');

        // React
        if (/import.*react|from ['"]react['"]/.test(allContent)) {
            frameworks.push('React');
        }
        // Vue
        if (/import.*vue|from ['"]vue['"]|\.vue/.test(allContent)) {
            frameworks.push('Vue');
        }
        // Angular
        if (/@angular\/|@Component|@NgModule/.test(allContent)) {
            frameworks.push('Angular');
        }
        // Express
        if (/from ['"]express['"]|require\(['"]express['"]\)/.test(allContent)) {
            frameworks.push('Express');
        }
        // Next.js
        if (/from ['"]next|next\//.test(allContent)) {
            frameworks.push('Next.js');
        }
        // Electron
        if (/from ['"]electron['"]|require\(['"]electron['"]\)/.test(allContent)) {
            frameworks.push('Electron');
        }
        // Jest
        if (/describe\s*\(|it\s*\(|expect\s*\(/.test(allContent)) {
            if (/jest/.test(allContent)) frameworks.push('Jest');
            else frameworks.push('Testing Framework');
        }

        return frameworks;
    }

    // ========================================================================
    // PATTERN EXTRACTION
    // ========================================================================

    private async extractPatterns(files: Array<{ path: string; content: string }>, projectId: string): Promise<CodingPattern[]> {
        const patterns: CodingPattern[] = [];

        // Naming conventions
        const namingPattern = this.detectNamingConvention(files);
        if (namingPattern) {
            patterns.push({ ...namingPattern, projects: [projectId] });
        }

        // Async style
        const asyncPattern = this.detectAsyncStyle(files);
        if (asyncPattern) {
            patterns.push({ ...asyncPattern, projects: [projectId] });
        }

        // Error handling
        const errorPattern = this.detectErrorHandling(files);
        if (errorPattern) {
            patterns.push({ ...errorPattern, projects: [projectId] });
        }

        // Import style
        const importPattern = this.detectImportStyle(files);
        if (importPattern) {
            patterns.push({ ...importPattern, projects: [projectId] });
        }

        return patterns;
    }

    private detectNamingConvention(files: Array<{ path: string; content: string }>): CodingPattern | null {
        let camelCase = 0, snake_case = 0, PascalCase = 0;

        for (const file of files) {
            // Count function/variable declarations
            const camelMatches = file.content.match(/(?:const|let|var|function)\s+([a-z][a-zA-Z0-9]*)\s*[=(:]/g);
            const snakeMatches = file.content.match(/(?:const|let|var|function)\s+([a-z][a-z0-9_]*)\s*[=(:]/g);
            const pascalMatches = file.content.match(/(?:class|interface|type)\s+([A-Z][a-zA-Z0-9]*)/g);

            camelCase += camelMatches?.length || 0;
            snake_case += snakeMatches?.filter(m => m.includes('_')).length || 0;
            PascalCase += pascalMatches?.length || 0;
        }

        const total = camelCase + snake_case + PascalCase;
        if (total < 10) return null;

        const dominant = Math.max(camelCase, snake_case);
        const convention = camelCase > snake_case ? 'camelCase' : 'snake_case';

        return {
            id: this.generatePatternId('naming', convention),
            type: 'naming',
            pattern: convention,
            frequency: dominant,
            confidence: dominant / total,
            projects: [],
            example: convention === 'camelCase' ? 'getUserName()' : 'get_user_name()'
        };
    }

    private detectAsyncStyle(files: Array<{ path: string; content: string }>): CodingPattern | null {
        let asyncAwait = 0, promises = 0, callbacks = 0;

        for (const file of files) {
            asyncAwait += (file.content.match(/async\s+|await\s+/g)?.length || 0);
            promises += (file.content.match(/\.then\s*\(|Promise\./g)?.length || 0);
            callbacks += (file.content.match(/callback|cb\s*[,)]/gi)?.length || 0);
        }

        const total = asyncAwait + promises + callbacks;
        if (total < 5) return null;

        let style = 'async-await';
        let dominant = asyncAwait;
        if (promises > dominant) { style = 'promises'; dominant = promises; }
        if (callbacks > dominant) { style = 'callbacks'; dominant = callbacks; }

        return {
            id: this.generatePatternId('async', style),
            type: 'async',
            pattern: style,
            frequency: dominant,
            confidence: dominant / total,
            projects: []
        };
    }

    private detectErrorHandling(files: Array<{ path: string; content: string }>): CodingPattern | null {
        let tryCatch = 0, resultType = 0;

        for (const file of files) {
            tryCatch += (file.content.match(/try\s*{|catch\s*\(/g)?.length || 0);
            resultType += (file.content.match(/Result<|Either<|\.ok\(|\.err\(/g)?.length || 0);
        }

        const total = tryCatch + resultType;
        if (total < 3) return null;

        const style = tryCatch > resultType ? 'try-catch' : 'result-type';
        const dominant = Math.max(tryCatch, resultType);

        return {
            id: this.generatePatternId('error', style),
            type: 'error-handling',
            pattern: style,
            frequency: dominant,
            confidence: dominant / total,
            projects: []
        };
    }

    private detectImportStyle(files: Array<{ path: string; content: string }>): CodingPattern | null {
        let named = 0, defaultImport = 0, namespace = 0;

        for (const file of files) {
            named += (file.content.match(/import\s*{[^}]+}\s*from/g)?.length || 0);
            defaultImport += (file.content.match(/import\s+\w+\s+from/g)?.length || 0);
            namespace += (file.content.match(/import\s*\*\s*as/g)?.length || 0);
        }

        const total = named + defaultImport + namespace;
        if (total < 5) return null;

        let style = 'named';
        let dominant = named;
        if (defaultImport > dominant) { style = 'default'; dominant = defaultImport; }
        if (namespace > dominant) { style = 'namespace'; dominant = namespace; }

        return {
            id: this.generatePatternId('imports', style),
            type: 'imports',
            pattern: style,
            frequency: dominant,
            confidence: dominant / total,
            projects: []
        };
    }

    // ========================================================================
    // SHARED CODE DETECTION
    // ========================================================================

    private buildCodeFingerprints(files: Array<{ path: string; content: string }>, projectId: string): void {
        for (const file of files) {
            // Extract function bodies and create hashes
            const functionMatches = file.content.match(/(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)\s*{[^}]{50,500}}/g) || [];

            for (const fn of functionMatches) {
                // Normalize and hash
                const normalized = fn.replace(/\s+/g, ' ').replace(/\w+(?=\s*[=:])/g, 'VAR');
                const hash = crypto.createHash('md5').update(normalized).digest('hex').substring(0, 16);

                if (!this.codeHashes.has(hash)) {
                    this.codeHashes.set(hash, new Set());
                }
                this.codeHashes.get(hash)!.add(projectId);
            }
        }
    }

    /**
     * Find code that appears in multiple projects
     */
    findSharedCode(): SharedCode[] {
        const shared: SharedCode[] = [];

        for (const [hash, projectIds] of this.codeHashes) {
            if (projectIds.size > 1) {
                shared.push({
                    signature: hash,
                    implementations: Array.from(projectIds).map(pid => ({
                        projectId: pid,
                        filePath: 'detected',
                        code: ''
                    })),
                    suggestExtraction: true,
                    extractionPath: 'shared/utils'
                });
            }
        }

        return shared;
    }

    // ========================================================================
    // CROSS-PROJECT ANALYSIS
    // ========================================================================

    private async updateCrossProjectPatterns(): Promise<void> {
        // Merge patterns from all projects
        for (const project of this.projects.values()) {
            for (const pattern of project.patterns) {
                const existing = this.patterns.get(pattern.id);
                if (existing) {
                    // Merge
                    existing.frequency += pattern.frequency;
                    if (!existing.projects.includes(project.id)) {
                        existing.projects.push(project.id);
                    }
                    // Recalculate confidence based on project coverage
                    existing.confidence = existing.projects.length / this.projects.size;
                } else {
                    this.patterns.set(pattern.id, { ...pattern });
                }
            }
        }

        // Update user preferences based on patterns
        this.updateUserPreferences();
    }

    private updateUserPreferences(): void {
        const namingPattern = Array.from(this.patterns.values()).find(p => p.type === 'naming');
        const asyncPattern = Array.from(this.patterns.values()).find(p => p.type === 'async');
        const errorPattern = Array.from(this.patterns.values()).find(p => p.type === 'error-handling');
        const importPattern = Array.from(this.patterns.values()).find(p => p.type === 'imports');

        this.userPreferences = {
            namingConvention: (namingPattern?.pattern as any) || 'camelCase',
            indentation: 'spaces',
            indentSize: 2,
            quoteStyle: 'single',
            semicolons: true,
            trailingComma: 'es5',
            preferredImports: (importPattern?.pattern as any) || 'named',
            asyncStyle: (asyncPattern?.pattern as any) || 'async-await',
            errorStyle: (errorPattern?.pattern as any) || 'try-catch',
            testFramework: 'jest'
        };
    }

    // ========================================================================
    // SUGGESTIONS
    // ========================================================================

    /**
     * Get personalized suggestions for current context
     */
    getSuggestions(context: { code?: string; language?: string; task?: string }): CrossProjectSuggestion[] {
        const suggestions: CrossProjectSuggestion[] = [];

        if (!this.userPreferences) return suggestions;

        // Naming convention suggestion
        if (context.code) {
            const hasSnakeCase = /_[a-z]/.test(context.code);
            const pref = this.userPreferences.namingConvention;

            if (pref === 'camelCase' && hasSnakeCase) {
                suggestions.push({
                    type: 'convention',
                    suggestion: 'Use camelCase naming',
                    reason: 'You typically use camelCase in your other projects',
                    confidence: 0.8,
                    sourceProjects: Array.from(this.projects.keys())
                });
            }
        }

        // Async style suggestion
        if (context.code?.includes('.then(')) {
            if (this.userPreferences.asyncStyle === 'async-await') {
                suggestions.push({
                    type: 'pattern',
                    suggestion: 'Consider using async/await',
                    reason: 'You prefer async/await in your other projects',
                    confidence: 0.7,
                    sourceProjects: Array.from(this.projects.keys())
                });
            }
        }

        return suggestions;
    }

    /**
     * Get user preferences learned from projects
     */
    getUserPreferences(): UserPreferences | null {
        return this.userPreferences;
    }

    /**
     * Get all learned patterns
     */
    getPatterns(): CodingPattern[] {
        return Array.from(this.patterns.values())
            .sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Get project summaries
     */
    getProjects(): ProjectProfile[] {
        return Array.from(this.projects.values());
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private generateProjectId(projectPath: string): string {
        return crypto.createHash('md5').update(projectPath).digest('hex').substring(0, 12);
    }

    private generatePatternId(type: string, pattern: string): string {
        return `${type}-${pattern}`;
    }

    clear(): void {
        this.projects.clear();
        this.patterns.clear();
        this.sharedCode.clear();
        this.codeHashes.clear();
        this.userPreferences = null;
    }
}

// Export singleton
export const crossProjectIntelligence = CrossProjectIntelligence.getInstance();
