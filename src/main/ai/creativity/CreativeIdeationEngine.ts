/**
 * Creative Ideation Engine
 * 
 * AI-powered brainstorming that suggests features, analyzes feasibility,
 * and generates interactive prototypes automatically.
 */

import { EventEmitter } from 'events';

export interface IdeationSession {
    id: string;
    topic: string;
    context: string;
    ideas: Idea[];
    selectedIdeas: string[];
    prototypes: Prototype[];
    status: 'brainstorming' | 'evaluating' | 'prototyping' | 'complete';
    createdAt: Date;
}

export interface Idea {
    id: string;
    title: string;
    description: string;
    category: IdeaCategory;
    feasibility: FeasibilityScore;
    innovationScore: number; // 0-1
    connections: string[]; // Related idea IDs
    votes: number;
    tags: string[];
}

export type IdeaCategory =
    | 'feature'
    | 'optimization'
    | 'bug_fix'
    | 'refactoring'
    | 'integration'
    | 'ux_improvement'
    | 'architecture'
    | 'moonshot';

export interface FeasibilityScore {
    technical: number; // 0-1
    time: number;      // 0-1 (1 = fast)
    resources: number; // 0-1 (1 = minimal)
    risk: number;      // 0-1 (1 = low risk)
    overall: number;
}

export interface Prototype {
    id: string;
    ideaId: string;
    type: PrototypeType;
    content: string;
    assets: PrototypeAsset[];
    interactive: boolean;
    generatedAt: Date;
}

export type PrototypeType =
    | 'wireframe'
    | 'mockup'
    | 'code_snippet'
    | 'architecture_diagram'
    | 'user_flow'
    | 'api_spec';

export interface PrototypeAsset {
    name: string;
    type: 'html' | 'css' | 'javascript' | 'svg' | 'json';
    content: string;
}

export interface BrainstormConfig {
    mode: 'free' | 'guided' | 'constrained';
    maxIdeas: number;
    focusAreas: string[];
    excludePatterns: string[];
    innovationBias: number; // 0-1, higher = more moonshot ideas
}

// Idea generation patterns
const IDEA_PATTERNS = {
    feature: [
        'What if users could {action}?',
        'Add ability to {action} with {constraint}',
        'Enable {user_type} to {action} when {condition}',
        'Integrate {tool} for better {outcome}',
    ],
    optimization: [
        'Speed up {process} by {method}',
        'Reduce {metric} through {approach}',
        'Cache {data} to improve {performance}',
        'Parallelize {operation} for faster {result}',
    ],
    ux_improvement: [
        'Simplify {workflow} to require fewer steps',
        'Add visual feedback for {action}',
        'Make {feature} more discoverable',
        'Improve error messages for {scenario}',
    ],
    moonshot: [
        'Revolutionary {technology} that {transformative_outcome}',
        'AI-powered {capability} that anticipates {need}',
        'Self-{adjective} system that {autonomous_action}',
        'Quantum-inspired {approach} for {breakthrough}',
    ],
};

export class CreativeIdeationEngine extends EventEmitter {
    private static instance: CreativeIdeationEngine;
    private sessions: Map<string, IdeationSession> = new Map();
    private ideaPool: Idea[] = [];

    private constructor() {
        super();
    }

    static getInstance(): CreativeIdeationEngine {
        if (!CreativeIdeationEngine.instance) {
            CreativeIdeationEngine.instance = new CreativeIdeationEngine();
        }
        return CreativeIdeationEngine.instance;
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    /**
     * Start a new brainstorming session
     */
    startSession(topic: string, context: string = ''): IdeationSession {
        const session: IdeationSession = {
            id: `session_${Date.now()}`,
            topic,
            context,
            ideas: [],
            selectedIdeas: [],
            prototypes: [],
            status: 'brainstorming',
            createdAt: new Date(),
        };

        this.sessions.set(session.id, session);
        this.emit('session:started', session);
        return session;
    }

    /**
     * Get an existing session
     */
    getSession(sessionId: string): IdeationSession | undefined {
        return this.sessions.get(sessionId);
    }

    // ========================================================================
    // BRAINSTORMING
    // ========================================================================

    /**
     * Generate ideas for a topic
     */
    brainstorm(sessionId: string, config?: Partial<BrainstormConfig>): Idea[] {
        const session = this.sessions.get(sessionId);
        if (!session) return [];

        const fullConfig: BrainstormConfig = {
            mode: 'guided',
            maxIdeas: 10,
            focusAreas: [],
            excludePatterns: [],
            innovationBias: 0.3,
            ...config,
        };

        const newIdeas: Idea[] = [];

        // Generate ideas based on patterns
        const categories: IdeaCategory[] = ['feature', 'optimization', 'ux_improvement'];
        if (Math.random() < fullConfig.innovationBias) {
            categories.push('moonshot');
        }

        for (const category of categories) {
            const patterns = IDEA_PATTERNS[category as keyof typeof IDEA_PATTERNS] || [];
            const numIdeas = Math.ceil(fullConfig.maxIdeas / categories.length);

            for (let i = 0; i < numIdeas && newIdeas.length < fullConfig.maxIdeas; i++) {
                const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                const idea = this.generateIdeaFromPattern(pattern, session.topic, category);
                newIdeas.push(idea);
            }
        }

        // Connect related ideas
        this.connectIdeas(newIdeas);

        session.ideas.push(...newIdeas);
        this.emit('ideas:generated', { sessionId, ideas: newIdeas });
        return newIdeas;
    }

    private generateIdeaFromPattern(pattern: string, topic: string, category: IdeaCategory): Idea {
        // Fill in pattern with relevant terms
        const filled = pattern
            .replace('{action}', this.getRandomAction(topic))
            .replace('{constraint}', this.getRandomConstraint())
            .replace('{user_type}', this.getRandomUserType())
            .replace('{condition}', this.getRandomCondition())
            .replace('{tool}', this.getRandomTool())
            .replace('{outcome}', this.getRandomOutcome())
            .replace('{process}', topic.toLowerCase())
            .replace('{method}', this.getRandomMethod())
            .replace('{metric}', this.getRandomMetric())
            .replace('{approach}', this.getRandomApproach())
            .replace('{data}', 'frequently accessed data')
            .replace('{performance}', 'response times')
            .replace('{operation}', 'batch operations')
            .replace('{result}', 'throughput')
            .replace('{workflow}', `${topic} workflow`)
            .replace('{feature}', 'this feature')
            .replace('{scenario}', 'edge cases')
            .replace('{technology}', this.getRandomTechnology())
            .replace('{transformative_outcome}', 'changes everything')
            .replace('{capability}', 'prediction engine')
            .replace('{need}', 'user needs')
            .replace('{adjective}', 'healing')
            .replace('{autonomous_action}', 'repairs itself')
            .replace('{breakthrough}', 'unprecedented performance');

        return {
            id: `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: filled.length > 50 ? filled.slice(0, 50) + '...' : filled,
            description: filled,
            category,
            feasibility: this.assessFeasibility(category, filled),
            innovationScore: category === 'moonshot' ? 0.9 : 0.3 + Math.random() * 0.4,
            connections: [],
            votes: 0,
            tags: this.extractTags(filled),
        };
    }

    private getRandomAction(topic: string): string {
        const actions = ['create', 'edit', 'share', 'export', 'import', 'automate', 'schedule', 'analyze'];
        return actions[Math.floor(Math.random() * actions.length)] + ' ' + topic.toLowerCase();
    }

    private getRandomConstraint(): string {
        const constraints = ['minimal clicks', 'voice control', 'keyboard shortcuts', 'batch mode'];
        return constraints[Math.floor(Math.random() * constraints.length)];
    }

    private getRandomUserType(): string {
        const types = ['developers', 'admins', 'power users', 'beginners'];
        return types[Math.floor(Math.random() * types.length)];
    }

    private getRandomCondition(): string {
        const conditions = ['offline', 'on mobile', 'in a hurry', 'collaborating'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    private getRandomTool(): string {
        const tools = ['GitHub', 'VS Code', 'Slack', 'Jira', 'Figma'];
        return tools[Math.floor(Math.random() * tools.length)];
    }

    private getRandomOutcome(): string {
        const outcomes = ['productivity', 'collaboration', 'code quality', 'debugging'];
        return outcomes[Math.floor(Math.random() * outcomes.length)];
    }

    private getRandomMethod(): string {
        const methods = ['caching', 'lazy loading', 'indexing', 'compression'];
        return methods[Math.floor(Math.random() * methods.length)];
    }

    private getRandomMetric(): string {
        const metrics = ['latency', 'memory usage', 'CPU cycles', 'network calls'];
        return metrics[Math.floor(Math.random() * metrics.length)];
    }

    private getRandomApproach(): string {
        const approaches = ['memoization', 'prefetching', 'batching', 'streaming'];
        return approaches[Math.floor(Math.random() * approaches.length)];
    }

    private getRandomTechnology(): string {
        const tech = ['AI', 'blockchain', 'edge computing', 'neural network'];
        return tech[Math.floor(Math.random() * tech.length)];
    }

    private assessFeasibility(category: IdeaCategory, description: string): FeasibilityScore {
        const baseScores: Record<IdeaCategory, Partial<FeasibilityScore>> = {
            feature: { technical: 0.7, time: 0.5, resources: 0.6, risk: 0.7 },
            optimization: { technical: 0.8, time: 0.7, resources: 0.8, risk: 0.8 },
            bug_fix: { technical: 0.9, time: 0.8, resources: 0.9, risk: 0.9 },
            refactoring: { technical: 0.7, time: 0.4, resources: 0.5, risk: 0.5 },
            integration: { technical: 0.6, time: 0.5, resources: 0.5, risk: 0.6 },
            ux_improvement: { technical: 0.8, time: 0.6, resources: 0.7, risk: 0.8 },
            architecture: { technical: 0.5, time: 0.3, resources: 0.4, risk: 0.4 },
            moonshot: { technical: 0.2, time: 0.1, resources: 0.2, risk: 0.2 },
        };

        const base = baseScores[category];
        const score: FeasibilityScore = {
            technical: base.technical || 0.5,
            time: base.time || 0.5,
            resources: base.resources || 0.5,
            risk: base.risk || 0.5,
            overall: 0,
        };

        score.overall = (score.technical + score.time + score.resources + score.risk) / 4;
        return score;
    }

    private extractTags(text: string): string[] {
        const keywords = ['api', 'ui', 'performance', 'security', 'ai', 'automation', 'integration'];
        return keywords.filter(k => text.toLowerCase().includes(k));
    }

    private connectIdeas(ideas: Idea[]): void {
        for (let i = 0; i < ideas.length; i++) {
            for (let j = i + 1; j < ideas.length; j++) {
                const sharedTags = ideas[i].tags.filter(t => ideas[j].tags.includes(t));
                if (sharedTags.length > 0) {
                    ideas[i].connections.push(ideas[j].id);
                    ideas[j].connections.push(ideas[i].id);
                }
            }
        }
    }

    // ========================================================================
    // PROTOTYPING
    // ========================================================================

    /**
     * Generate a prototype for an idea
     */
    generatePrototype(sessionId: string, ideaId: string, type: PrototypeType): Prototype | undefined {
        const session = this.sessions.get(sessionId);
        if (!session) return undefined;

        const idea = session.ideas.find(i => i.id === ideaId);
        if (!idea) return undefined;

        const prototype: Prototype = {
            id: `proto_${Date.now()}`,
            ideaId,
            type,
            content: this.generatePrototypeContent(idea, type),
            assets: this.generatePrototypeAssets(idea, type),
            interactive: type === 'mockup' || type === 'wireframe',
            generatedAt: new Date(),
        };

        session.prototypes.push(prototype);
        session.status = 'prototyping';
        this.emit('prototype:generated', { sessionId, prototype });
        return prototype;
    }

    private generatePrototypeContent(idea: Idea, type: PrototypeType): string {
        switch (type) {
            case 'wireframe':
                return `Wireframe for: ${idea.title}\n\n[Header]\n[Navigation]\n[Main Content Area]\n  - ${idea.description}\n[Footer]`;

            case 'mockup':
                return `<div class="mockup">
  <h1>${idea.title}</h1>
  <p>${idea.description}</p>
  <button>Try It</button>
</div>`;

            case 'code_snippet':
                return `// Implementation skeleton for: ${idea.title}
export class ${idea.title.replace(/\s+/g, '')} {
  async execute(): Promise<void> {
    // TODO: Implement ${idea.description}
  }
}`;

            case 'architecture_diagram':
                return `Architecture for: ${idea.title}

[Client] --> [API Gateway] --> [Service]
                               |
                               v
                          [Database]`;

            case 'user_flow':
                return `User Flow: ${idea.title}

1. User initiates action
2. System processes request
3. ${idea.description}
4. User receives feedback
5. Action complete`;

            case 'api_spec':
                return `POST /api/${idea.title.toLowerCase().replace(/\s+/g, '-')}

Request:
{
  "action": "${idea.description.slice(0, 30)}..."
}

Response:
{
  "success": true,
  "result": {}
}`;

            default:
                return idea.description;
        }
    }

    private generatePrototypeAssets(idea: Idea, type: PrototypeType): PrototypeAsset[] {
        if (type === 'mockup') {
            return [
                {
                    name: 'styles.css',
                    type: 'css',
                    content: `.mockup { padding: 20px; border-radius: 8px; background: linear-gradient(135deg, #1a1a2e, #16213e); }
.mockup h1 { color: #00d9ff; }
.mockup button { background: #00d9ff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }`,
                },
            ];
        }
        return [];
    }

    // ========================================================================
    // VOTING & SELECTION
    // ========================================================================

    voteIdea(sessionId: string, ideaId: string, delta: number = 1): number {
        const session = this.sessions.get(sessionId);
        if (!session) return 0;

        const idea = session.ideas.find(i => i.id === ideaId);
        if (!idea) return 0;

        idea.votes += delta;
        return idea.votes;
    }

    selectIdea(sessionId: string, ideaId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        if (!session.selectedIdeas.includes(ideaId)) {
            session.selectedIdeas.push(ideaId);
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getTopIdeas(sessionId: string, limit: number = 5): Idea[] {
        const session = this.sessions.get(sessionId);
        if (!session) return [];

        return [...session.ideas]
            .sort((a, b) => {
                const scoreA = a.votes * 2 + a.feasibility.overall * 10 + a.innovationScore * 5;
                const scoreB = b.votes * 2 + b.feasibility.overall * 10 + b.innovationScore * 5;
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }

    getAllSessions(): IdeationSession[] {
        return Array.from(this.sessions.values());
    }
}

export const creativeIdeationEngine = CreativeIdeationEngine.getInstance();
