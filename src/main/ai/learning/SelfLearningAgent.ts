/**
 * Self-Learning Agent
 * 
 * Learns from errors and doesn't repeat them.
 * Stores successful code patterns/templates for faster project duplication.
 * Enables rapid cloning of websites, landing pages, and applications.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorLesson {
    id: string;
    errorType: string;
    errorMessage: string;
    context: string;
    mistake: string;
    correction: string;
    preventionStrategy: string;
    occurrences: number;
    lastOccurred: number;
    resolved: boolean;
}

interface CodeTemplate {
    id: string;
    name: string;
    type: 'landing-page' | 'website' | 'web-app' | 'api' | 'mobile-app' | 'component' | 'full-stack';
    framework: string;
    description: string;
    files: Map<string, string>;
    structure: string[];
    dependencies: string[];
    metadata: {
        createdAt: number;
        lastUsed: number;
        usageCount: number;
        rating: number;
        tags: string[];
    };
}

interface LearningContext {
    task: string;
    approach: string;
    outcome: 'success' | 'failure' | 'partial';
    duration: number;
    feedback?: string;
}

interface PeerKnowledge {
    agentId: string;
    lessons: ErrorLesson[];
    templates: string[];
    sharedAt: number;
}

// ============================================================================
// SELF-LEARNING AGENT
// ============================================================================

export class SelfLearningAgent extends EventEmitter {
    private static instance: SelfLearningAgent;

    // Error learning
    private errorLessons: Map<string, ErrorLesson> = new Map();
    private errorPatternIndex: Map<string, string[]> = new Map(); // pattern -> lesson IDs

    // Template library
    private templateLibrary: Map<string, CodeTemplate> = new Map();
    private templateIndex: Map<string, string[]> = new Map(); // tag -> template IDs

    // Learning history
    private learningHistory: LearningContext[] = [];

    // Peer knowledge
    private peerKnowledge: Map<string, PeerKnowledge> = new Map();

    // Storage path
    private storagePath: string;

    private constructor() {
        super();
        this.storagePath = path.join(process.env.HOME || '', '.shadow-ai', 'learning');
        this.ensureStorageExists();
        this.loadPersistedData();
    }

    static getInstance(): SelfLearningAgent {
        if (!SelfLearningAgent.instance) {
            SelfLearningAgent.instance = new SelfLearningAgent();
        }
        return SelfLearningAgent.instance;
    }

    private ensureStorageExists(): void {
        try {
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create storage directory:', error);
        }
    }

    private loadPersistedData(): void {
        try {
            const lessonsPath = path.join(this.storagePath, 'lessons.json');
            const templatesPath = path.join(this.storagePath, 'templates.json');

            if (fs.existsSync(lessonsPath)) {
                const data = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
                this.errorLessons = new Map(Object.entries(data));
                this.rebuildErrorIndex();
            }

            if (fs.existsSync(templatesPath)) {
                const data = JSON.parse(fs.readFileSync(templatesPath, 'utf-8'));
                for (const [id, template] of Object.entries(data)) {
                    const t = template as any;
                    t.files = new Map(Object.entries(t.files || {}));
                    this.templateLibrary.set(id, t);
                }
                this.rebuildTemplateIndex();
            }
        } catch (error) {
            console.error('Failed to load persisted data:', error);
        }
    }

    private persistData(): void {
        try {
            const lessonsPath = path.join(this.storagePath, 'lessons.json');
            const templatesPath = path.join(this.storagePath, 'templates.json');

            const lessonsData = Object.fromEntries(this.errorLessons);
            fs.writeFileSync(lessonsPath, JSON.stringify(lessonsData, null, 2));

            const templatesData: Record<string, any> = {};
            for (const [id, template] of this.templateLibrary) {
                templatesData[id] = {
                    ...template,
                    files: Object.fromEntries(template.files),
                };
            }
            fs.writeFileSync(templatesPath, JSON.stringify(templatesData, null, 2));
        } catch (error) {
            console.error('Failed to persist data:', error);
        }
    }

    // ========================================================================
    // ERROR LEARNING
    // ========================================================================

    async learnFromError(
        error: Error | string,
        context: string,
        correction?: string
    ): Promise<ErrorLesson> {
        const errorMessage = error instanceof Error ? error.message : error;
        const errorType = this.categorizeError(errorMessage);

        // Check if we've seen this error before
        const existingLesson = this.findSimilarLesson(errorMessage);

        if (existingLesson) {
            existingLesson.occurrences++;
            existingLesson.lastOccurred = Date.now();
            if (correction) {
                existingLesson.correction = correction;
                existingLesson.resolved = true;
            }
            this.emit('error:updated', existingLesson);
            this.persistData();
            return existingLesson;
        }

        // Create new lesson
        const lesson: ErrorLesson = {
            id: this.generateId('lesson'),
            errorType,
            errorMessage,
            context,
            mistake: this.analyzeMistake(errorMessage, context),
            correction: correction || 'Pending analysis',
            preventionStrategy: this.generatePreventionStrategy(errorType),
            occurrences: 1,
            lastOccurred: Date.now(),
            resolved: !!correction,
        };

        this.errorLessons.set(lesson.id, lesson);
        this.indexError(lesson);
        this.emit('error:learned', lesson);
        this.persistData();

        return lesson;
    }

    private categorizeError(errorMessage: string): string {
        const patterns = [
            { pattern: /TypeError|Cannot read property/i, type: 'type-error' },
            { pattern: /ReferenceError|is not defined/i, type: 'reference-error' },
            { pattern: /SyntaxError/i, type: 'syntax-error' },
            { pattern: /ENOENT|file not found/i, type: 'file-not-found' },
            { pattern: /ECONNREFUSED|connection refused/i, type: 'connection-error' },
            { pattern: /timeout|ETIMEDOUT/i, type: 'timeout-error' },
            { pattern: /permission denied|EACCES/i, type: 'permission-error' },
            { pattern: /out of memory|heap/i, type: 'memory-error' },
            { pattern: /import|require|module/i, type: 'module-error' },
            { pattern: /validation|invalid/i, type: 'validation-error' },
        ];

        for (const { pattern, type } of patterns) {
            if (pattern.test(errorMessage)) {
                return type;
            }
        }

        return 'unknown-error';
    }

    private findSimilarLesson(errorMessage: string): ErrorLesson | null {
        for (const lesson of this.errorLessons.values()) {
            const similarity = this.calculateSimilarity(lesson.errorMessage, errorMessage);
            if (similarity > 0.85) {
                return lesson;
            }
        }
        return null;
    }

    private analyzeMistake(errorMessage: string, context: string): string {
        const errorType = this.categorizeError(errorMessage);

        const mistakePatterns: Record<string, string> = {
            'type-error': 'Attempted to access property on null/undefined or used wrong type',
            'reference-error': 'Used variable before declaration or misspelled identifier',
            'syntax-error': 'Invalid code syntax - missing brackets, quotes, or keywords',
            'file-not-found': 'Referenced file path that does not exist',
            'connection-error': 'Tried to connect to unavailable service',
            'timeout-error': 'Operation took too long to complete',
            'permission-error': 'Insufficient permissions for the operation',
            'memory-error': 'Used too much memory or created memory leak',
            'module-error': 'Failed to import/require module correctly',
            'validation-error': 'Provided invalid data that failed validation',
        };

        return mistakePatterns[errorType] || 'Unknown mistake pattern';
    }

    private generatePreventionStrategy(errorType: string): string {
        const strategies: Record<string, string> = {
            'type-error': 'Use optional chaining (?.) and nullish coalescing (??). Add type guards.',
            'reference-error': 'Declare variables before use. Use IDE autocomplete to avoid typos.',
            'syntax-error': 'Use linter and formatter. Enable strict mode.',
            'file-not-found': 'Verify paths exist before operations. Use path.resolve().',
            'connection-error': 'Add retry logic and health checks. Use circuit breaker.',
            'timeout-error': 'Increase timeouts. Add progress indicators. Optimize operations.',
            'permission-error': 'Check permissions before operations. Run with correct user.',
            'memory-error': 'Paginate large datasets. Clean up resources. Use streams.',
            'module-error': 'Verify package is installed. Check import paths.',
            'validation-error': 'Validate inputs at boundaries. Use schema validation.',
        };

        return strategies[errorType] || 'Review and analyze the error pattern';
    }

    private indexError(lesson: ErrorLesson): void {
        const keywords = this.extractKeywords(lesson.errorMessage);
        for (const keyword of keywords) {
            const existing = this.errorPatternIndex.get(keyword) || [];
            existing.push(lesson.id);
            this.errorPatternIndex.set(keyword, existing);
        }
    }

    private rebuildErrorIndex(): void {
        this.errorPatternIndex.clear();
        for (const lesson of this.errorLessons.values()) {
            this.indexError(lesson);
        }
    }

    shouldAvoid(proposedAction: string): { avoid: boolean; reason?: string; alternative?: string } {
        for (const lesson of this.errorLessons.values()) {
            const similarity = this.calculateSimilarity(lesson.context, proposedAction);
            if (similarity > 0.7 && lesson.occurrences > 1) {
                return {
                    avoid: true,
                    reason: `This approach previously caused: ${lesson.mistake}`,
                    alternative: lesson.correction,
                };
            }
        }
        return { avoid: false };
    }

    // ========================================================================
    // TEMPLATE LIBRARY
    // ========================================================================

    async saveAsTemplate(
        name: string,
        type: CodeTemplate['type'],
        files: Map<string, string>,
        options: {
            framework?: string;
            description?: string;
            dependencies?: string[];
            tags?: string[];
        } = {}
    ): Promise<CodeTemplate> {
        const id = this.generateId('template');

        const template: CodeTemplate = {
            id,
            name,
            type,
            framework: options.framework || 'vanilla',
            description: options.description || `${type} template`,
            files,
            structure: Array.from(files.keys()),
            dependencies: options.dependencies || [],
            metadata: {
                createdAt: Date.now(),
                lastUsed: Date.now(),
                usageCount: 0,
                rating: 5,
                tags: options.tags || [type],
            },
        };

        this.templateLibrary.set(id, template);
        this.indexTemplate(template);
        this.emit('template:saved', { id, name, type });
        this.persistData();

        return template;
    }

    async captureProjectAsTemplate(
        projectPath: string,
        name: string,
        type: CodeTemplate['type'],
        options: { extensions?: string[]; exclude?: string[] } = {}
    ): Promise<CodeTemplate> {
        const extensions = options.extensions || ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json'];
        const exclude = options.exclude || ['node_modules', 'dist', 'build', '.git', '.next'];

        const files = new Map<string, string>();

        const scanDirectory = (dir: string, relativePath: string = ''): void => {
            try {
                const entries = fs.readdirSync(dir);

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry);
                    const relPath = path.join(relativePath, entry);

                    if (exclude.some(e => entry.includes(e))) continue;

                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory()) {
                        scanDirectory(fullPath, relPath);
                    } else if (extensions.some(ext => entry.endsWith(ext))) {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        files.set(relPath, content);
                    }
                }
            } catch (error) {
                console.error(`Error scanning directory ${dir}:`, error);
            }
        };

        scanDirectory(projectPath);

        // Detect framework
        let framework = 'vanilla';
        const packageJsonPath = path.join(projectPath, 'package.json');
        let dependencies: string[] = [];

        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

                if (dependencies.includes('next')) framework = 'nextjs';
                else if (dependencies.includes('react')) framework = 'react';
                else if (dependencies.includes('vue')) framework = 'vue';
                else if (dependencies.includes('angular')) framework = 'angular';
                else if (dependencies.includes('express')) framework = 'express';
            } catch (e) {
                // Ignore parse errors
            }
        }

        return this.saveAsTemplate(name, type, files, {
            framework,
            dependencies,
            description: `Captured from ${projectPath}`,
            tags: [type, framework],
        });
    }

    async getTemplate(id: string): Promise<CodeTemplate | null> {
        const template = this.templateLibrary.get(id);
        if (template) {
            template.metadata.lastUsed = Date.now();
            template.metadata.usageCount++;
            this.persistData();
        }
        return template || null;
    }

    async searchTemplates(query: string, type?: CodeTemplate['type']): Promise<CodeTemplate[]> {
        const results: CodeTemplate[] = [];
        const queryTerms = query.toLowerCase().split(/\s+/);

        for (const template of this.templateLibrary.values()) {
            if (type && template.type !== type) continue;

            let score = 0;

            // Name match
            for (const term of queryTerms) {
                if (template.name.toLowerCase().includes(term)) score += 10;
                if (template.framework.toLowerCase().includes(term)) score += 5;
                if (template.metadata.tags.some(t => t.toLowerCase().includes(term))) score += 3;
                if (template.description.toLowerCase().includes(term)) score += 2;
            }

            if (score > 0) {
                results.push(template);
            }
        }

        // Sort by score and usage
        return results.sort((a, b) =>
            (b.metadata.usageCount * 2 + b.metadata.rating) -
            (a.metadata.usageCount * 2 + a.metadata.rating)
        );
    }

    async findSimilarTemplate(
        description: string,
        type?: CodeTemplate['type']
    ): Promise<CodeTemplate | null> {
        const templates = await this.searchTemplates(description, type);
        return templates[0] || null;
    }

    async duplicateFromTemplate(
        templateId: string,
        targetPath: string,
        customizations?: Map<string, string>
    ): Promise<{ success: boolean; filesCreated: string[] }> {
        const template = await this.getTemplate(templateId);
        if (!template) {
            return { success: false, filesCreated: [] };
        }

        const filesCreated: string[] = [];

        try {
            for (const [filePath, content] of template.files) {
                const targetFilePath = path.join(targetPath, filePath);
                const targetDir = path.dirname(targetFilePath);

                // Apply customizations
                let finalContent = content;
                if (customizations) {
                    for (const [placeholder, value] of customizations) {
                        finalContent = finalContent.replace(new RegExp(placeholder, 'g'), value);
                    }
                }

                // Create directory
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                // Write file
                fs.writeFileSync(targetFilePath, finalContent);
                filesCreated.push(targetFilePath);
            }

            this.emit('template:duplicated', { templateId, targetPath, filesCreated: filesCreated.length });
            return { success: true, filesCreated };
        } catch (error) {
            this.emit('template:error', { templateId, error });
            return { success: false, filesCreated };
        }
    }

    private indexTemplate(template: CodeTemplate): void {
        const tags = [
            ...template.metadata.tags,
            template.type,
            template.framework,
        ];

        for (const tag of tags) {
            const existing = this.templateIndex.get(tag) || [];
            existing.push(template.id);
            this.templateIndex.set(tag, existing);
        }
    }

    private rebuildTemplateIndex(): void {
        this.templateIndex.clear();
        for (const template of this.templateLibrary.values()) {
            this.indexTemplate(template);
        }
    }

    // ========================================================================
    // PEER LEARNING
    // ========================================================================

    async learnFromPeer(peerId: string, knowledge: PeerKnowledge): Promise<number> {
        let lessonsLearned = 0;

        for (const lesson of knowledge.lessons) {
            const existing = this.findSimilarLesson(lesson.errorMessage);
            if (!existing && lesson.resolved) {
                this.errorLessons.set(lesson.id, { ...lesson, id: this.generateId('lesson') });
                lessonsLearned++;
            }
        }

        this.peerKnowledge.set(peerId, knowledge);
        this.rebuildErrorIndex();
        this.persistData();

        this.emit('peer:learned', { peerId, lessonsLearned });
        return lessonsLearned;
    }

    async shareKnowledge(): Promise<PeerKnowledge> {
        return {
            agentId: 'self',
            lessons: Array.from(this.errorLessons.values()).filter(l => l.resolved),
            templates: Array.from(this.templateLibrary.keys()),
            sharedAt: Date.now(),
        };
    }

    // ========================================================================
    // LEARNING CONTEXT
    // ========================================================================

    recordLearning(context: LearningContext): void {
        this.learningHistory.push(context);

        // Keep only last 1000 entries
        if (this.learningHistory.length > 1000) {
            this.learningHistory = this.learningHistory.slice(-1000);
        }

        this.emit('learning:recorded', context);
    }

    getSuccessfulApproaches(task: string): string[] {
        return this.learningHistory
            .filter(l => l.outcome === 'success' && this.calculateSimilarity(l.task, task) > 0.6)
            .map(l => l.approach);
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    getStats(): {
        totalLessons: number;
        resolvedLessons: number;
        totalTemplates: number;
        mostUsedTemplates: string[];
        commonErrors: string[];
    } {
        const resolvedLessons = Array.from(this.errorLessons.values()).filter(l => l.resolved).length;

        const sortedTemplates = Array.from(this.templateLibrary.values())
            .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
            .slice(0, 5)
            .map(t => t.name);

        const sortedErrors = Array.from(this.errorLessons.values())
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 5)
            .map(l => l.errorType);

        return {
            totalLessons: this.errorLessons.size,
            resolvedLessons,
            totalTemplates: this.templateLibrary.size,
            mostUsedTemplates: sortedTemplates,
            commonErrors: sortedErrors,
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private calculateSimilarity(a: string, b: string): number {
        const wordsA = new Set(a.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.toLowerCase().split(/\s+/));

        let intersection = 0;
        for (const word of wordsA) {
            if (wordsB.has(word)) intersection++;
        }

        return intersection / Math.max(wordsA.size, wordsB.size);
    }

    private extractKeywords(text: string): string[] {
        const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from']);
        return text
            .toLowerCase()
            .split(/\W+/)
            .filter(w => w.length > 2 && !stopWords.has(w));
    }

    private generateId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const selfLearningAgent = SelfLearningAgent.getInstance();
