/**
 * HiveMind Service
 * 
 * Collective intelligence network enabling knowledge sharing between
 * Shadow AI instances while preserving privacy through pattern encryption.
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface KnowledgePattern {
    id: string;
    category: 'bugfix' | 'optimization' | 'architecture' | 'refactor' | 'security';
    pattern: string;
    solution: string;
    confidence: number;
    successCount: number;
    failureCount: number;
    tags: string[];
    encryptedMetadata?: string;
}

export interface PatternQuery {
    problem: string;
    context?: string;
    language?: string;
    framework?: string;
    maxResults?: number;
}

export interface PatternMatch {
    pattern: KnowledgePattern;
    relevance: number;
    adaptedSolution: string;
}

export interface HiveMindStats {
    localPatterns: number;
    contributedPatterns: number;
    queriesMade: number;
    successfulMatches: number;
    privacyMode: 'strict' | 'balanced' | 'open';
}

export interface HiveMindConfig {
    enabled: boolean;
    privacyMode: 'strict' | 'balanced' | 'open';
    contributionEnabled: boolean;
    queryEnabled: boolean;
    encryptionKey?: string;
    syncInterval: number;
}

// ============================================================================
// HIVEMIND SERVICE
// ============================================================================

export class HiveMindService extends EventEmitter {
    private static instance: HiveMindService;
    private localPatterns: Map<string, KnowledgePattern> = new Map();
    private queryHistory: Array<{ query: string; matches: number; timestamp: Date }> = [];
    private contributedCount: number = 0;

    private config: HiveMindConfig = {
        enabled: true,
        privacyMode: 'balanced',
        contributionEnabled: true,
        queryEnabled: true,
        syncInterval: 300000 // 5 minutes
    };

    private constructor() {
        super();
    }

    static getInstance(): HiveMindService {
        if (!HiveMindService.instance) {
            HiveMindService.instance = new HiveMindService();
        }
        return HiveMindService.instance;
    }

    // -------------------------------------------------------------------------
    // Pattern Learning
    // -------------------------------------------------------------------------

    /**
     * Learn a new pattern from successful task completion
     */
    async learnPattern(
        problem: string,
        solution: string,
        category: KnowledgePattern['category'],
        metadata?: {
            language?: string;
            framework?: string;
            tags?: string[];
        }
    ): Promise<KnowledgePattern> {
        const id = this.generatePatternId(problem, solution);

        // Check for existing similar pattern
        const existing = this.findSimilarPattern(problem);
        if (existing) {
            // Reinforce existing pattern
            existing.successCount++;
            existing.confidence = this.calculateConfidence(existing);
            this.emit('patternReinforced', existing);
            return existing;
        }

        // Create new pattern
        const pattern: KnowledgePattern = {
            id,
            category,
            pattern: this.extractPattern(problem),
            solution: this.anonymizeSolution(solution),
            confidence: 0.5,
            successCount: 1,
            failureCount: 0,
            tags: metadata?.tags || []
        };

        if (metadata?.language) pattern.tags.push(`lang:${metadata.language}`);
        if (metadata?.framework) pattern.tags.push(`framework:${metadata.framework}`);

        // Encrypt sensitive metadata if in strict mode
        if (this.config.privacyMode === 'strict') {
            pattern.encryptedMetadata = this.encryptMetadata(metadata);
        }

        this.localPatterns.set(id, pattern);
        this.emit('patternLearned', pattern);

        return pattern;
    }

    /**
     * Report pattern failure for calibration
     */
    async reportFailure(patternId: string): Promise<void> {
        const pattern = this.localPatterns.get(patternId);
        if (pattern) {
            pattern.failureCount++;
            pattern.confidence = this.calculateConfidence(pattern);
            this.emit('patternFailure', pattern);
        }
    }

    // -------------------------------------------------------------------------
    // Pattern Querying
    // -------------------------------------------------------------------------

    /**
     * Query the hive mind for solutions
     */
    async queryPatterns(query: PatternQuery): Promise<PatternMatch[]> {
        if (!this.config.queryEnabled) {
            return [];
        }

        const matches: PatternMatch[] = [];

        // Search local patterns
        for (const pattern of this.localPatterns.values()) {
            const relevance = this.calculateRelevance(query, pattern);
            if (relevance > 0.3) {
                matches.push({
                    pattern,
                    relevance,
                    adaptedSolution: this.adaptSolution(pattern.solution, query)
                });
            }
        }

        // Sort by relevance
        matches.sort((a, b) => b.relevance - a.relevance);

        // Record query
        this.queryHistory.push({
            query: query.problem,
            matches: matches.length,
            timestamp: new Date()
        });

        // Limit results
        const limitedMatches = matches.slice(0, query.maxResults || 5);

        this.emit('queryCompleted', { query, matchCount: limitedMatches.length });
        return limitedMatches;
    }

    /**
     * Get best solution for a problem
     */
    async getBestSolution(problem: string, context?: string): Promise<PatternMatch | null> {
        const matches = await this.queryPatterns({
            problem,
            context,
            maxResults: 1
        });

        return matches[0] || null;
    }

    // -------------------------------------------------------------------------
    // Pattern Contribution
    // -------------------------------------------------------------------------

    /**
     * Contribute patterns to the collective (privacy-preserving)
     */
    async contributePatterns(): Promise<number> {
        if (!this.config.contributionEnabled) {
            return 0;
        }

        // Get high-confidence patterns
        const patternsToContribute = Array.from(this.localPatterns.values())
            .filter(p => p.confidence > 0.7 && p.successCount >= 3);

        // In real implementation, would send to server
        // Here we just track the count
        this.contributedCount += patternsToContribute.length;

        this.emit('patternsContributed', { count: patternsToContribute.length });
        return patternsToContribute.length;
    }

    /**
     * Sync patterns from collective (receive)
     */
    async syncFromCollective(): Promise<number> {
        // In real implementation, would fetch from server
        // For now, emit event for external handling
        this.emit('syncRequested', { lastSync: new Date() });
        return 0;
    }

    /**
     * Import patterns from external source
     */
    async importPatterns(patterns: KnowledgePattern[]): Promise<number> {
        let imported = 0;

        for (const pattern of patterns) {
            if (!this.localPatterns.has(pattern.id)) {
                this.localPatterns.set(pattern.id, pattern);
                imported++;
            }
        }

        this.emit('patternsImported', { count: imported });
        return imported;
    }

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    setConfig(config: Partial<HiveMindConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('configUpdated', this.config);
    }

    getConfig(): HiveMindConfig {
        return { ...this.config };
    }

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    getStats(): HiveMindStats {
        const successfulMatches = this.queryHistory.filter(q => q.matches > 0).length;

        return {
            localPatterns: this.localPatterns.size,
            contributedPatterns: this.contributedCount,
            queriesMade: this.queryHistory.length,
            successfulMatches,
            privacyMode: this.config.privacyMode
        };
    }

    // -------------------------------------------------------------------------
    // Privacy Helpers
    // -------------------------------------------------------------------------

    /**
     * Extract abstract pattern (remove identifying info)
     */
    private extractPattern(problem: string): string {
        // Remove specific file paths, names, etc.
        return problem
            .replace(/\/[\/\w.-]+/g, '[PATH]')
            .replace(/\b[A-Z][a-zA-Z]+(?:Service|Controller|Manager)\b/g, '[CLASS]')
            .replace(/['"][^'"]+['"]/g, '[STRING]')
            .trim();
    }

    /**
     * Anonymize solution (remove specific identifiers)
     */
    private anonymizeSolution(solution: string): string {
        if (this.config.privacyMode === 'open') {
            return solution;
        }

        return solution
            .replace(/\b[a-zA-Z_][a-zA-Z0-9_]{20,}\b/g, '[ID]') // Long identifiers
            .replace(/https?:\/\/[^\s]+/g, '[URL]')
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            .trim();
    }

    /**
     * Encrypt sensitive metadata
     */
    private encryptMetadata(metadata: any): string {
        if (!metadata) return '';

        const key = this.config.encryptionKey || 'default-key';
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            crypto.scryptSync(key, 'salt', 32),
            Buffer.alloc(16, 0)
        );

        let encrypted = cipher.update(JSON.stringify(metadata), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    // -------------------------------------------------------------------------
    // Matching Helpers
    // -------------------------------------------------------------------------

    private generatePatternId(problem: string, solution: string): string {
        const hash = crypto.createHash('sha256');
        hash.update(problem + solution);
        return hash.digest('hex').substring(0, 16);
    }

    private findSimilarPattern(problem: string): KnowledgePattern | undefined {
        const normalizedProblem = this.extractPattern(problem);

        for (const pattern of this.localPatterns.values()) {
            if (this.similarity(pattern.pattern, normalizedProblem) > 0.8) {
                return pattern;
            }
        }

        return undefined;
    }

    private calculateRelevance(query: PatternQuery, pattern: KnowledgePattern): number {
        let score = 0;

        // Text similarity
        score += this.similarity(query.problem, pattern.pattern) * 0.5;

        // Confidence weight
        score += pattern.confidence * 0.3;

        // Tag matching
        if (query.language && pattern.tags.includes(`lang:${query.language}`)) {
            score += 0.1;
        }
        if (query.framework && pattern.tags.includes(`framework:${query.framework}`)) {
            score += 0.1;
        }

        return Math.min(score, 1);
    }

    private similarity(a: string, b: string): number {
        // Simple Jaccard similarity
        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.toLowerCase().split(/\s+/));

        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);

        return intersection.size / union.size;
    }

    private calculateConfidence(pattern: KnowledgePattern): number {
        const total = pattern.successCount + pattern.failureCount;
        if (total === 0) return 0.5;

        const successRate = pattern.successCount / total;
        // Apply Laplace smoothing for small samples
        const smoothed = (pattern.successCount + 1) / (total + 2);

        return smoothed;
    }

    private adaptSolution(solution: string, query: PatternQuery): string {
        // In real implementation, would use AI to adapt
        // For now, return as-is with context notes
        if (query.language) {
            return `// Adapted for ${query.language}\n${solution}`;
        }
        return solution;
    }
}

// Export singleton
export const hiveMindService = HiveMindService.getInstance();
