/**
 * TemporalContextEngine
 * 
 * Provides time-aware intelligence by analyzing Git history, commit patterns,
 * and developer behavior to understand code archaeology and predict future needs.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface CommitAnalysis {
    hash: string;
    message: string;
    author: string;
    timestamp: Date;
    filesChanged: string[];
    intent: string;
    patterns: string[];
}

export interface CodeArchaeology {
    filePath: string;
    totalCommits: number;
    firstCommit: Date;
    lastModified: Date;
    contributors: string[];
    changeFrequency: 'high' | 'medium' | 'low' | 'stable';
    whyExists: string;
    relatedFiles: string[];
}

export interface DeveloperPattern {
    timeOfDay: string;
    commonPatterns: string[];
    preferredStyles: Record<string, string>;
    refactoringTriggers: string[];
    debuggingStyle: string;
}

export interface FutureCompatibility {
    risk: 'high' | 'medium' | 'low';
    issues: string[];
    recommendations: string[];
    affectedVersions: string[];
}

export interface TemporalConfig {
    historyDepth: number;
    patternLearningEnabled: boolean;
    futureAnalysisEnabled: boolean;
    cacheEnabled: boolean;
}

// ============================================================================
// TEMPORAL CONTEXT ENGINE
// ============================================================================

export class TemporalContextEngine extends EventEmitter {
    private static instance: TemporalContextEngine;
    private commitCache: Map<string, CommitAnalysis> = new Map();
    private archaeologyCache: Map<string, CodeArchaeology> = new Map();
    private developerPatterns: Map<string, DeveloperPattern> = new Map();

    private config: TemporalConfig = {
        historyDepth: 100,
        patternLearningEnabled: true,
        futureAnalysisEnabled: true,
        cacheEnabled: true
    };

    private constructor() {
        super();
    }

    static getInstance(): TemporalContextEngine {
        if (!TemporalContextEngine.instance) {
            TemporalContextEngine.instance = new TemporalContextEngine();
        }
        return TemporalContextEngine.instance;
    }

    // -------------------------------------------------------------------------
    // Code Archaeology
    // -------------------------------------------------------------------------

    /**
     * Analyze why a piece of code exists by examining its history
     */
    async analyzeCodeArchaeology(filePath: string): Promise<CodeArchaeology> {
        // Check cache
        if (this.config.cacheEnabled && this.archaeologyCache.has(filePath)) {
            return this.archaeologyCache.get(filePath)!;
        }

        // In real implementation, this would parse git log
        const archaeology: CodeArchaeology = {
            filePath,
            totalCommits: 0,
            firstCommit: new Date(),
            lastModified: new Date(),
            contributors: [],
            changeFrequency: 'stable',
            whyExists: 'Analysis pending - requires git history access',
            relatedFiles: []
        };

        // Emit event for listeners that can provide git data
        this.emit('archaeologyRequest', { filePath });

        if (this.config.cacheEnabled) {
            this.archaeologyCache.set(filePath, archaeology);
        }

        return archaeology;
    }

    /**
     * Provide git history data for analysis
     */
    async loadGitHistory(commits: Array<{
        hash: string;
        message: string;
        author: string;
        timestamp: string | Date;
        files: string[];
    }>): Promise<void> {
        for (const commit of commits) {
            const analysis = await this.analyzeCommit(commit);
            this.commitCache.set(commit.hash, analysis);
        }

        this.emit('historyLoaded', { commitCount: commits.length });
    }

    /**
     * Analyze a single commit for intent and patterns
     */
    async analyzeCommit(commit: {
        hash: string;
        message: string;
        author: string;
        timestamp: string | Date;
        files: string[];
    }): Promise<CommitAnalysis> {
        // Analyze commit message for intent
        const intent = this.inferCommitIntent(commit.message);
        const patterns = this.extractPatterns(commit.message, commit.files);

        return {
            hash: commit.hash,
            message: commit.message,
            author: commit.author,
            timestamp: new Date(commit.timestamp),
            filesChanged: commit.files,
            intent,
            patterns
        };
    }

    // -------------------------------------------------------------------------
    // Developer Pattern Learning
    // -------------------------------------------------------------------------

    /**
     * Learn developer patterns from history
     */
    async learnDeveloperPatterns(developerId: string): Promise<DeveloperPattern> {
        if (!this.config.patternLearningEnabled) {
            return this.getDefaultPattern();
        }

        // Check existing patterns
        if (this.developerPatterns.has(developerId)) {
            return this.developerPatterns.get(developerId)!;
        }

        // Analyze developer's commits
        const developerCommits = Array.from(this.commitCache.values())
            .filter(c => c.author === developerId);

        const pattern: DeveloperPattern = {
            timeOfDay: this.analyzeTimePatterns(developerCommits),
            commonPatterns: this.extractCommonPatterns(developerCommits),
            preferredStyles: {},
            refactoringTriggers: this.detectRefactoringTriggers(developerCommits),
            debuggingStyle: 'systematic'
        };

        this.developerPatterns.set(developerId, pattern);
        this.emit('patternLearned', { developerId, pattern });

        return pattern;
    }

    /**
     * Predict what developer will likely need next
     */
    async predictNextAction(
        developerId: string,
        currentFile: string,
        recentActions: string[]
    ): Promise<string[]> {
        const pattern = await this.learnDeveloperPatterns(developerId);
        const archaeology = await this.analyzeCodeArchaeology(currentFile);

        const predictions: string[] = [];

        // Based on recent actions and patterns
        if (recentActions.includes('write_test') && pattern.commonPatterns.includes('tdd')) {
            predictions.push('Implement the feature being tested');
        }

        if (archaeology.changeFrequency === 'high') {
            predictions.push('Consider refactoring this frequently-changed file');
        }

        // Related file suggestions
        for (const related of archaeology.relatedFiles.slice(0, 3)) {
            predictions.push(`You may also want to update: ${related}`);
        }

        this.emit('predictionMade', { developerId, currentFile, predictions });
        return predictions;
    }

    // -------------------------------------------------------------------------
    // Future Compatibility Analysis
    // -------------------------------------------------------------------------

    /**
     * Check if code will break in future versions
     */
    async analyzeFutureCompatibility(
        code: string,
        dependencies: Record<string, string>
    ): Promise<FutureCompatibility> {
        if (!this.config.futureAnalysisEnabled) {
            return { risk: 'low', issues: [], recommendations: [], affectedVersions: [] };
        }

        const issues: string[] = [];
        const recommendations: string[] = [];
        const affectedVersions: string[] = [];

        // Check for deprecated patterns
        if (code.includes('require(') && !code.includes('import ')) {
            issues.push('CommonJS require() is being phased out in favor of ESM imports');
            recommendations.push('Consider migrating to ES modules');
            affectedVersions.push('Node.js 22+');
        }

        // Check dependency versions
        for (const [pkg, version] of Object.entries(dependencies)) {
            if (version.startsWith('^') || version.startsWith('~')) {
                // Semver ranges could break
                issues.push(`${pkg}@${version} uses semver range - may break on major updates`);
            }
        }

        // React-specific checks
        if (dependencies['react'] && !dependencies['react'].includes('19')) {
            issues.push('React 19 introduces breaking changes to lifecycle methods');
            recommendations.push('Review React 19 migration guide');
            affectedVersions.push('React 19');
        }

        const risk = issues.length > 3 ? 'high' : issues.length > 0 ? 'medium' : 'low';

        return { risk, issues, recommendations, affectedVersions };
    }

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    setConfig(config: Partial<TemporalConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): TemporalConfig {
        return { ...this.config };
    }

    clearCache(): void {
        this.commitCache.clear();
        this.archaeologyCache.clear();
        this.developerPatterns.clear();
    }

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    getStats(): {
        cachedCommits: number;
        cachedArchaeology: number;
        learnedPatterns: number;
    } {
        return {
            cachedCommits: this.commitCache.size,
            cachedArchaeology: this.archaeologyCache.size,
            learnedPatterns: this.developerPatterns.size
        };
    }

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------

    private inferCommitIntent(message: string): string {
        const lower = message.toLowerCase();

        if (lower.startsWith('fix') || lower.includes('bug')) return 'bugfix';
        if (lower.startsWith('feat') || lower.includes('add')) return 'feature';
        if (lower.startsWith('refactor') || lower.includes('cleanup')) return 'refactor';
        if (lower.startsWith('test') || lower.includes('spec')) return 'testing';
        if (lower.startsWith('docs') || lower.includes('readme')) return 'documentation';
        if (lower.startsWith('chore') || lower.includes('deps')) return 'maintenance';

        return 'other';
    }

    private extractPatterns(message: string, files: string[]): string[] {
        const patterns: string[] = [];

        if (files.some(f => f.includes('.test.') || f.includes('.spec.'))) {
            patterns.push('includes-tests');
        }

        if (files.length > 5) {
            patterns.push('large-change');
        }

        if (message.includes('WIP') || message.includes('wip')) {
            patterns.push('work-in-progress');
        }

        return patterns;
    }

    private analyzeTimePatterns(commits: CommitAnalysis[]): string {
        if (commits.length === 0) return 'unknown';

        const hours = commits.map(c => c.timestamp.getHours());
        const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;

        if (avgHour < 12) return 'morning';
        if (avgHour < 17) return 'afternoon';
        if (avgHour < 21) return 'evening';
        return 'night';
    }

    private extractCommonPatterns(commits: CommitAnalysis[]): string[] {
        const allPatterns = commits.flatMap(c => c.patterns);
        const counts = new Map<string, number>();

        for (const pattern of allPatterns) {
            counts.set(pattern, (counts.get(pattern) || 0) + 1);
        }

        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([pattern]) => pattern);
    }

    private detectRefactoringTriggers(commits: CommitAnalysis[]): string[] {
        const triggers: string[] = [];
        const refactorCommits = commits.filter(c => c.intent === 'refactor');

        if (refactorCommits.length > commits.length * 0.1) {
            triggers.push('frequent-refactorer');
        }

        return triggers;
    }

    private getDefaultPattern(): DeveloperPattern {
        return {
            timeOfDay: 'flexible',
            commonPatterns: [],
            preferredStyles: {},
            refactoringTriggers: [],
            debuggingStyle: 'unknown'
        };
    }
}

// Export singleton
export const temporalContextEngine = TemporalContextEngine.getInstance();
