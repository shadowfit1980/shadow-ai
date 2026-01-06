/**
 * Cross-Project Knowledge Base
 * 
 * Shares learnings, patterns, and solutions across all projects.
 * Enables organizational learning and knowledge reuse.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface KnowledgeEntry {
    id: string;
    type: 'solution' | 'pattern' | 'lesson' | 'snippet' | 'configuration';
    title: string;
    description: string;
    content: string;
    tags: string[];
    projects: string[];
    usageCount: number;
    rating: number;
    createdAt: number;
    updatedAt: number;
}

interface ProjectContext {
    id: string;
    name: string;
    path: string;
    framework: string;
    language: string;
    lastAccessed: number;
}

interface SearchResult {
    entry: KnowledgeEntry;
    relevanceScore: number;
    matchedTags: string[];
}

// ============================================================================
// CROSS-PROJECT KNOWLEDGE BASE
// ============================================================================

export class CrossProjectKnowledgeBase extends EventEmitter {
    private static instance: CrossProjectKnowledgeBase;
    private knowledge: Map<string, KnowledgeEntry> = new Map();
    private projects: Map<string, ProjectContext> = new Map();
    private tagIndex: Map<string, string[]> = new Map(); // tag -> entry IDs
    private storagePath: string;

    private constructor() {
        super();
        this.storagePath = path.join(process.env.HOME || '', '.shadow-ai', 'knowledge');
        this.loadKnowledge();
    }

    static getInstance(): CrossProjectKnowledgeBase {
        if (!CrossProjectKnowledgeBase.instance) {
            CrossProjectKnowledgeBase.instance = new CrossProjectKnowledgeBase();
        }
        return CrossProjectKnowledgeBase.instance;
    }

    private loadKnowledge(): void {
        try {
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }

            const knowledgePath = path.join(this.storagePath, 'knowledge.json');
            if (fs.existsSync(knowledgePath)) {
                const data = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
                this.knowledge = new Map(Object.entries(data));
                this.rebuildIndex();
            }

            const projectsPath = path.join(this.storagePath, 'projects.json');
            if (fs.existsSync(projectsPath)) {
                const data = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
                this.projects = new Map(Object.entries(data));
            }
        } catch (error) {
            console.error('Failed to load knowledge:', error);
        }
    }

    private saveKnowledge(): void {
        try {
            const knowledgePath = path.join(this.storagePath, 'knowledge.json');
            fs.writeFileSync(knowledgePath, JSON.stringify(Object.fromEntries(this.knowledge), null, 2));

            const projectsPath = path.join(this.storagePath, 'projects.json');
            fs.writeFileSync(projectsPath, JSON.stringify(Object.fromEntries(this.projects), null, 2));
        } catch (error) {
            console.error('Failed to save knowledge:', error);
        }
    }

    private rebuildIndex(): void {
        this.tagIndex.clear();
        for (const entry of this.knowledge.values()) {
            for (const tag of entry.tags) {
                const existing = this.tagIndex.get(tag) || [];
                existing.push(entry.id);
                this.tagIndex.set(tag, existing);
            }
        }
    }

    // ========================================================================
    // KNOWLEDGE MANAGEMENT
    // ========================================================================

    addKnowledge(
        type: KnowledgeEntry['type'],
        title: string,
        description: string,
        content: string,
        options: { tags?: string[]; project?: string } = {}
    ): KnowledgeEntry {
        const id = `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        const entry: KnowledgeEntry = {
            id,
            type,
            title,
            description,
            content,
            tags: options.tags || [],
            projects: options.project ? [options.project] : [],
            usageCount: 0,
            rating: 5,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Auto-extract tags from content
        const extractedTags = this.extractTags(content);
        entry.tags = [...new Set([...entry.tags, ...extractedTags])];

        this.knowledge.set(id, entry);
        this.indexEntry(entry);
        this.emit('knowledge:added', entry);
        this.saveKnowledge();

        return entry;
    }

    private extractTags(content: string): string[] {
        const tags: string[] = [];

        // Framework detection
        if (content.includes('react') || content.includes('React')) tags.push('react');
        if (content.includes('express')) tags.push('express');
        if (content.includes('next') || content.includes('Next')) tags.push('nextjs');
        if (content.includes('vue') || content.includes('Vue')) tags.push('vue');
        if (content.includes('typescript') || content.includes(': string')) tags.push('typescript');

        // Pattern detection
        if (content.includes('async') || content.includes('await')) tags.push('async');
        if (content.includes('useState') || content.includes('useEffect')) tags.push('hooks');
        if (content.includes('try') && content.includes('catch')) tags.push('error-handling');
        if (content.includes('test(') || content.includes('describe(')) tags.push('testing');
        if (content.includes('@route') || content.includes('app.get')) tags.push('api');

        return tags;
    }

    private indexEntry(entry: KnowledgeEntry): void {
        for (const tag of entry.tags) {
            const existing = this.tagIndex.get(tag) || [];
            if (!existing.includes(entry.id)) {
                existing.push(entry.id);
                this.tagIndex.set(tag, existing);
            }
        }
    }

    getKnowledge(id: string): KnowledgeEntry | undefined {
        const entry = this.knowledge.get(id);
        if (entry) {
            entry.usageCount++;
            entry.updatedAt = Date.now();
            this.saveKnowledge();
        }
        return entry;
    }

    updateKnowledge(
        id: string,
        updates: Partial<Pick<KnowledgeEntry, 'title' | 'description' | 'content' | 'tags' | 'rating'>>
    ): KnowledgeEntry | null {
        const entry = this.knowledge.get(id);
        if (!entry) return null;

        Object.assign(entry, updates, { updatedAt: Date.now() });

        if (updates.tags) {
            this.rebuildIndex();
        }

        this.emit('knowledge:updated', entry);
        this.saveKnowledge();
        return entry;
    }

    deleteKnowledge(id: string): boolean {
        const deleted = this.knowledge.delete(id);
        if (deleted) {
            this.rebuildIndex();
            this.emit('knowledge:deleted', id);
            this.saveKnowledge();
        }
        return deleted;
    }

    // ========================================================================
    // SEARCH
    // ========================================================================

    search(query: string, options: { type?: KnowledgeEntry['type']; tags?: string[]; limit?: number } = {}): SearchResult[] {
        const results: SearchResult[] = [];
        const queryTerms = query.toLowerCase().split(/\s+/);
        const { type, tags: filterTags, limit = 20 } = options;

        for (const entry of this.knowledge.values()) {
            if (type && entry.type !== type) continue;

            let score = 0;
            const matchedTags: string[] = [];

            // Title match (highest weight)
            for (const term of queryTerms) {
                if (entry.title.toLowerCase().includes(term)) score += 10;
            }

            // Description match
            for (const term of queryTerms) {
                if (entry.description.toLowerCase().includes(term)) score += 5;
            }

            // Content match
            for (const term of queryTerms) {
                if (entry.content.toLowerCase().includes(term)) score += 2;
            }

            // Tag match
            for (const tag of entry.tags) {
                for (const term of queryTerms) {
                    if (tag.toLowerCase().includes(term)) {
                        score += 8;
                        matchedTags.push(tag);
                    }
                }
            }

            // Filter by tags
            if (filterTags && filterTags.length > 0) {
                const hasAllTags = filterTags.every(t => entry.tags.includes(t));
                if (!hasAllTags) continue;
            }

            // Boost by usage and rating
            score += entry.usageCount * 0.5;
            score += entry.rating;

            if (score > 0) {
                results.push({ entry, relevanceScore: score, matchedTags });
            }
        }

        return results
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }

    searchByTags(tags: string[]): KnowledgeEntry[] {
        const entryIds = new Set<string>();

        for (const tag of tags) {
            const ids = this.tagIndex.get(tag) || [];
            ids.forEach(id => entryIds.add(id));
        }

        return Array.from(entryIds)
            .map(id => this.knowledge.get(id))
            .filter((e): e is KnowledgeEntry => e !== undefined)
            .sort((a, b) => b.usageCount - a.usageCount);
    }

    findSimilar(content: string): KnowledgeEntry[] {
        const tags = this.extractTags(content);
        return this.searchByTags(tags).slice(0, 5);
    }

    // ========================================================================
    // PROJECT MANAGEMENT
    // ========================================================================

    registerProject(name: string, projectPath: string, framework: string, language: string): ProjectContext {
        const id = `project-${Date.now()}`;
        const project: ProjectContext = {
            id,
            name,
            path: projectPath,
            framework,
            language,
            lastAccessed: Date.now(),
        };

        this.projects.set(id, project);
        this.emit('project:registered', project);
        this.saveKnowledge();

        return project;
    }

    getProjectKnowledge(projectId: string): KnowledgeEntry[] {
        return Array.from(this.knowledge.values())
            .filter(e => e.projects.includes(projectId));
    }

    shareKnowledgeToProject(knowledgeId: string, projectId: string): boolean {
        const entry = this.knowledge.get(knowledgeId);
        if (!entry) return false;

        if (!entry.projects.includes(projectId)) {
            entry.projects.push(projectId);
            entry.updatedAt = Date.now();
            this.emit('knowledge:shared', { knowledgeId, projectId });
            this.saveKnowledge();
        }

        return true;
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    getStats(): {
        totalEntries: number;
        byType: Record<string, number>;
        topTags: Array<{ tag: string; count: number }>;
        mostUsed: KnowledgeEntry[];
    } {
        const byType: Record<string, number> = {};

        for (const entry of this.knowledge.values()) {
            byType[entry.type] = (byType[entry.type] || 0) + 1;
        }

        const tagCounts: Array<{ tag: string; count: number }> = [];
        for (const [tag, ids] of this.tagIndex) {
            tagCounts.push({ tag, count: ids.length });
        }
        const topTags = tagCounts.sort((a, b) => b.count - a.count).slice(0, 10);

        const mostUsed = Array.from(this.knowledge.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5);

        return {
            totalEntries: this.knowledge.size,
            byType,
            topTags,
            mostUsed,
        };
    }

    // ========================================================================
    // QUICK ADD PATTERNS
    // ========================================================================

    addSolution(title: string, problem: string, solution: string, tags: string[] = []): KnowledgeEntry {
        return this.addKnowledge(
            'solution',
            title,
            `Problem: ${problem}`,
            solution,
            { tags: ['solution', ...tags] }
        );
    }

    addPattern(name: string, description: string, code: string, tags: string[] = []): KnowledgeEntry {
        return this.addKnowledge(
            'pattern',
            name,
            description,
            code,
            { tags: ['pattern', ...tags] }
        );
    }

    addSnippet(name: string, code: string, tags: string[] = []): KnowledgeEntry {
        return this.addKnowledge(
            'snippet',
            name,
            `Code snippet for ${name}`,
            code,
            { tags: ['snippet', ...tags] }
        );
    }

    addConfiguration(name: string, config: string, description: string, tags: string[] = []): KnowledgeEntry {
        return this.addKnowledge(
            'configuration',
            name,
            description,
            config,
            { tags: ['config', ...tags] }
        );
    }
}

export const crossProjectKnowledgeBase = CrossProjectKnowledgeBase.getInstance();
