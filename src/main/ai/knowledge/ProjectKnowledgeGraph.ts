/**
 * 🧠 Project Knowledge Graph (PKG)
 * 
 * Persistent, semantic project memory that stores:
 * - Every design decision with rationale
 * - Code artifact relationships
 * - User feedback and preferences
 * - Performance metrics over time
 * - Bug reports and resolutions
 * 
 * This is the CRITICAL missing piece for true autonomy.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Knowledge Types
export interface KnowledgeNode {
    id: string;
    type: 'decision' | 'artifact' | 'feedback' | 'metric' | 'bug' | 'requirement' | 'constraint';
    content: string;
    embedding?: number[];
    metadata: {
        projectId: string;
        timestamp: Date;
        author: 'user' | 'agent' | 'system';
        confidence: number;
        tags: string[];
        linkedNodes: string[];
        version: number;
    };
}

export interface DesignDecision extends KnowledgeNode {
    type: 'decision';
    decision: {
        question: string;
        answer: string;
        alternatives: { option: string; reason: string }[];
        rationale: string;
        constraints: string[];
        tradeoffs: { positive: string[]; negative: string[] };
        sources: { type: 'documentation' | 'benchmark' | 'user' | 'inference'; url?: string }[];
    };
}

export interface CodeArtifact extends KnowledgeNode {
    type: 'artifact';
    artifact: {
        filePath: string;
        language: string;
        purpose: string;
        dependencies: string[];
        exports: string[];
        complexity: number;
        testCoverage: number;
        lastModified: Date;
        changeHistory: { date: Date; description: string; author: string }[];
    };
}

export interface PerformanceMetric extends KnowledgeNode {
    type: 'metric';
    metric: {
        name: string;
        value: number;
        unit: string;
        baseline?: number;
        target?: number;
        trend: 'improving' | 'stable' | 'degrading';
        history: { date: Date; value: number }[];
    };
}

export interface Requirement extends KnowledgeNode {
    type: 'requirement';
    requirement: {
        category: 'functional' | 'non-functional' | 'business' | 'technical';
        priority: 'critical' | 'high' | 'medium' | 'low';
        status: 'proposed' | 'approved' | 'implemented' | 'verified';
        kpis: { name: string; target: string; current?: string }[];
        stakeholder?: string;
        acceptanceCriteria: string[];
    };
}

export interface ProjectContext {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    lastAccessed: Date;
    techStack: {
        languages: string[];
        frameworks: string[];
        databases: string[];
        infrastructure: string[];
    };
    businessContext: {
        domain: string;
        targetUsers: string;
        kpis: { name: string; target: string }[];
        constraints: string[];
    };
    teamContext: {
        size: number;
        expertise: string[];
        preferences: Record<string, any>;
    };
}

class ProjectKnowledgeGraph {
    private static instance: ProjectKnowledgeGraph;
    private nodes: Map<string, KnowledgeNode> = new Map();
    private projects: Map<string, ProjectContext> = new Map();
    private edges: Map<string, Set<string>> = new Map();
    private storageDir: string;
    private embeddings: Map<string, number[]> = new Map();

    private constructor() {
        this.storageDir = path.join(process.cwd(), '.shadow-ai', 'knowledge');
        this.ensureStorageDir();
        this.loadFromDisk();
    }

    public static getInstance(): ProjectKnowledgeGraph {
        if (!ProjectKnowledgeGraph.instance) {
            ProjectKnowledgeGraph.instance = new ProjectKnowledgeGraph();
        }
        return ProjectKnowledgeGraph.instance;
    }

    private ensureStorageDir(): void {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    private generateId(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    // ==================== PROJECT MANAGEMENT ====================

    public createProject(name: string, description: string): ProjectContext {
        const project: ProjectContext = {
            id: this.generateId(),
            name,
            description,
            createdAt: new Date(),
            lastAccessed: new Date(),
            techStack: { languages: [], frameworks: [], databases: [], infrastructure: [] },
            businessContext: { domain: '', targetUsers: '', kpis: [], constraints: [] },
            teamContext: { size: 1, expertise: [], preferences: {} }
        };
        this.projects.set(project.id, project);
        this.saveToDisk();
        return project;
    }

    public getProject(projectId: string): ProjectContext | undefined {
        const project = this.projects.get(projectId);
        if (project) {
            project.lastAccessed = new Date();
            this.saveToDisk();
        }
        return project;
    }

    public updateProjectContext(projectId: string, updates: Partial<ProjectContext>): void {
        const project = this.projects.get(projectId);
        if (project) {
            Object.assign(project, updates, { lastAccessed: new Date() });
            this.saveToDisk();
        }
    }

    // ==================== KNOWLEDGE MANAGEMENT ====================

    public addDesignDecision(
        projectId: string,
        question: string,
        answer: string,
        rationale: string,
        alternatives: { option: string; reason: string }[] = [],
        constraints: string[] = []
    ): DesignDecision {
        const node: DesignDecision = {
            id: this.generateId(),
            type: 'decision',
            content: `${question}: ${answer}`,
            metadata: {
                projectId,
                timestamp: new Date(),
                author: 'agent',
                confidence: 0.9,
                tags: ['design-decision'],
                linkedNodes: [],
                version: 1
            },
            decision: {
                question,
                answer,
                alternatives,
                rationale,
                constraints,
                tradeoffs: { positive: [], negative: [] },
                sources: []
            }
        };

        this.nodes.set(node.id, node);
        this.saveToDisk();
        return node;
    }

    public addRequirement(
        projectId: string,
        content: string,
        category: Requirement['requirement']['category'],
        priority: Requirement['requirement']['priority'],
        kpis: { name: string; target: string }[] = []
    ): Requirement {
        const node: Requirement = {
            id: this.generateId(),
            type: 'requirement',
            content,
            metadata: {
                projectId,
                timestamp: new Date(),
                author: 'user',
                confidence: 1.0,
                tags: ['requirement', category],
                linkedNodes: [],
                version: 1
            },
            requirement: {
                category,
                priority,
                status: 'proposed',
                kpis,
                acceptanceCriteria: []
            }
        };

        this.nodes.set(node.id, node);
        this.saveToDisk();
        return node;
    }

    public addCodeArtifact(
        projectId: string,
        filePath: string,
        language: string,
        purpose: string
    ): CodeArtifact {
        const node: CodeArtifact = {
            id: this.generateId(),
            type: 'artifact',
            content: purpose,
            metadata: {
                projectId,
                timestamp: new Date(),
                author: 'system',
                confidence: 1.0,
                tags: ['artifact', language],
                linkedNodes: [],
                version: 1
            },
            artifact: {
                filePath,
                language,
                purpose,
                dependencies: [],
                exports: [],
                complexity: 0,
                testCoverage: 0,
                lastModified: new Date(),
                changeHistory: []
            }
        };

        this.nodes.set(node.id, node);
        this.saveToDisk();
        return node;
    }

    public recordMetric(
        projectId: string,
        name: string,
        value: number,
        unit: string,
        target?: number
    ): PerformanceMetric {
        // Check for existing metric
        const existing = this.findMetric(projectId, name);

        if (existing) {
            existing.metric.history.push({ date: new Date(), value });
            existing.metric.value = value;
            existing.metric.trend = this.calculateTrend(existing.metric.history);
            this.saveToDisk();
            return existing;
        }

        const node: PerformanceMetric = {
            id: this.generateId(),
            type: 'metric',
            content: `${name}: ${value} ${unit}`,
            metadata: {
                projectId,
                timestamp: new Date(),
                author: 'system',
                confidence: 1.0,
                tags: ['metric'],
                linkedNodes: [],
                version: 1
            },
            metric: {
                name,
                value,
                unit,
                target,
                trend: 'stable',
                history: [{ date: new Date(), value }]
            }
        };

        this.nodes.set(node.id, node);
        this.saveToDisk();
        return node;
    }

    private findMetric(projectId: string, name: string): PerformanceMetric | undefined {
        for (const node of this.nodes.values()) {
            if (node.type === 'metric' &&
                node.metadata.projectId === projectId &&
                (node as PerformanceMetric).metric.name === name) {
                return node as PerformanceMetric;
            }
        }
        return undefined;
    }

    private calculateTrend(history: { date: Date; value: number }[]): 'improving' | 'stable' | 'degrading' {
        if (history.length < 3) return 'stable';
        const recent = history.slice(-5);
        const first = recent[0].value;
        const last = recent[recent.length - 1].value;
        const change = (last - first) / first;
        if (change > 0.1) return 'improving';
        if (change < -0.1) return 'degrading';
        return 'stable';
    }

    // ==================== LINKING & RELATIONSHIPS ====================

    public linkNodes(fromId: string, toId: string): void {
        if (!this.edges.has(fromId)) {
            this.edges.set(fromId, new Set());
        }
        this.edges.get(fromId)!.add(toId);

        const fromNode = this.nodes.get(fromId);
        if (fromNode && !fromNode.metadata.linkedNodes.includes(toId)) {
            fromNode.metadata.linkedNodes.push(toId);
        }

        this.saveToDisk();
    }

    public getRelatedNodes(nodeId: string, depth: number = 1): KnowledgeNode[] {
        const related: Set<string> = new Set();
        const queue: { id: string; level: number }[] = [{ id: nodeId, level: 0 }];

        while (queue.length > 0) {
            const { id, level } = queue.shift()!;
            if (level > depth) continue;

            const edges = this.edges.get(id);
            if (edges) {
                for (const targetId of edges) {
                    if (!related.has(targetId)) {
                        related.add(targetId);
                        queue.push({ id: targetId, level: level + 1 });
                    }
                }
            }
        }

        return Array.from(related)
            .map(id => this.nodes.get(id))
            .filter(Boolean) as KnowledgeNode[];
    }

    // ==================== QUERYING ====================

    public query(projectId: string, question: string): {
        answer: string;
        sources: KnowledgeNode[];
        confidence: number;
    } {
        // Simple keyword matching for now - would use embeddings in production
        const keywords = question.toLowerCase().split(/\s+/);
        const matches: { node: KnowledgeNode; score: number }[] = [];

        for (const node of this.nodes.values()) {
            if (node.metadata.projectId !== projectId) continue;

            const content = node.content.toLowerCase();
            let score = 0;
            for (const keyword of keywords) {
                if (content.includes(keyword)) score++;
            }

            if (score > 0) {
                matches.push({ node, score });
            }
        }

        matches.sort((a, b) => b.score - a.score);
        const topMatches = matches.slice(0, 5).map(m => m.node);

        if (topMatches.length === 0) {
            return {
                answer: 'No relevant knowledge found for this project.',
                sources: [],
                confidence: 0
            };
        }

        // Construct answer from top matches
        const answer = topMatches.map(n => {
            if (n.type === 'decision') {
                const d = n as DesignDecision;
                return `Decision: ${d.decision.question} → ${d.decision.answer} (Reason: ${d.decision.rationale})`;
            }
            return n.content;
        }).join('\n\n');

        return {
            answer,
            sources: topMatches,
            confidence: Math.min(1, matches[0]?.score / keywords.length || 0)
        };
    }

    public getProjectHistory(projectId: string): KnowledgeNode[] {
        const nodes = Array.from(this.nodes.values())
            .filter(n => n.metadata.projectId === projectId)
            .sort((a, b) =>
                new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
            );
        return nodes;
    }

    public getDecisionHistory(projectId: string): DesignDecision[] {
        return this.getProjectHistory(projectId)
            .filter(n => n.type === 'decision') as DesignDecision[];
    }

    // ==================== PERSISTENCE ====================

    private saveToDisk(): void {
        const data = {
            nodes: Array.from(this.nodes.entries()),
            projects: Array.from(this.projects.entries()),
            edges: Array.from(this.edges.entries()).map(([k, v]) => [k, Array.from(v)])
        };

        const filePath = path.join(this.storageDir, 'knowledge-graph.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    private loadFromDisk(): void {
        const filePath = path.join(this.storageDir, 'knowledge-graph.json');

        if (fs.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                this.nodes = new Map(data.nodes);
                this.projects = new Map(data.projects);
                this.edges = new Map(
                    data.edges.map(([k, v]: [string, string[]]) => [k, new Set(v)])
                );
            } catch (err) {
                console.error('Failed to load knowledge graph:', err);
            }
        }
    }

    // ==================== ANALYTICS ====================

    public getProjectStats(projectId: string): {
        totalNodes: number;
        nodesByType: Record<string, number>;
        decisionCount: number;
        artifactCount: number;
        requirementsFulfilled: number;
        requirementsTotal: number;
        healthScore: number;
    } {
        const projectNodes = Array.from(this.nodes.values())
            .filter(n => n.metadata.projectId === projectId);

        const nodesByType: Record<string, number> = {};
        let requirementsFulfilled = 0;
        let requirementsTotal = 0;

        for (const node of projectNodes) {
            nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;

            if (node.type === 'requirement') {
                requirementsTotal++;
                if ((node as Requirement).requirement.status === 'verified') {
                    requirementsFulfilled++;
                }
            }
        }

        const healthScore = requirementsTotal > 0
            ? (requirementsFulfilled / requirementsTotal) * 100
            : 100;

        return {
            totalNodes: projectNodes.length,
            nodesByType,
            decisionCount: nodesByType['decision'] || 0,
            artifactCount: nodesByType['artifact'] || 0,
            requirementsFulfilled,
            requirementsTotal,
            healthScore
        };
    }
}

export const projectKnowledgeGraph = ProjectKnowledgeGraph.getInstance();
export default projectKnowledgeGraph;
