/**
 * Agent Arena & Benchmarking System
 * 
 * Head-to-head agent comparison with Elo-style ratings
 * inspired by LMArena's benchmarking approach.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface BenchmarkAgent {
    id: string;
    name: string;
    provider: string;
    model: string;
    eloRating: number;
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    specializations: string[];
}

export interface BenchmarkTask {
    id: string;
    category: 'code' | 'reasoning' | 'creative' | 'analysis' | 'general';
    prompt: string;
    expectedCapabilities: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    evaluationCriteria: EvaluationCriteria;
}

export interface EvaluationCriteria {
    correctness: number;      // Weight 0-1
    completeness: number;     // Weight 0-1
    clarity: number;          // Weight 0-1
    efficiency: number;       // Weight 0-1
    creativity: number;       // Weight 0-1
}

export interface MatchResult {
    id: string;
    task: BenchmarkTask;
    agents: [string, string];
    responses: [AgentResponse, AgentResponse];
    winner: string | 'draw';
    scores: [number, number];
    evaluationMethod: 'human' | 'auto' | 'llm-judge';
    timestamp: Date;
}

export interface AgentResponse {
    agentId: string;
    content: string;
    latencyMs: number;
    tokensUsed: number;
    error?: string;
}

export interface Leaderboard {
    category: string;
    rankings: LeaderboardEntry[];
    updatedAt: Date;
}

export interface LeaderboardEntry {
    rank: number;
    agentId: string;
    agentName: string;
    eloRating: number;
    winRate: number;
    matchesPlayed: number;
    trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// AGENT ARENA
// ============================================================================

export class AgentArena extends EventEmitter {
    private static instance: AgentArena;
    private agents: Map<string, BenchmarkAgent> = new Map();
    private tasks: Map<string, BenchmarkTask> = new Map();
    private matchHistory: MatchResult[] = [];
    private readonly K_FACTOR = 32; // Elo K-factor

    private constructor() {
        super();
        this.initializeDefaultTasks();
    }

    static getInstance(): AgentArena {
        if (!AgentArena.instance) {
            AgentArena.instance = new AgentArena();
        }
        return AgentArena.instance;
    }

    // ========================================================================
    // AGENT MANAGEMENT
    // ========================================================================

    registerAgent(agent: Omit<BenchmarkAgent, 'eloRating' | 'matchesPlayed' | 'wins' | 'losses' | 'draws'>): BenchmarkAgent {
        const fullAgent: BenchmarkAgent = {
            ...agent,
            eloRating: 1500, // Starting Elo
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
        };

        this.agents.set(agent.id, fullAgent);
        this.emit('agentRegistered', fullAgent);
        return fullAgent;
    }

    getAgent(id: string): BenchmarkAgent | undefined {
        return this.agents.get(id);
    }

    listAgents(): BenchmarkAgent[] {
        return Array.from(this.agents.values());
    }

    // ========================================================================
    // TASK MANAGEMENT
    // ========================================================================

    private initializeDefaultTasks(): void {
        const defaultTasks: BenchmarkTask[] = [
            // Code tasks
            {
                id: 'code_fibonacci',
                category: 'code',
                prompt: 'Write an efficient function to calculate the nth Fibonacci number. Include both iterative and recursive approaches with memoization.',
                expectedCapabilities: ['code_generation', 'optimization'],
                difficulty: 'easy',
                evaluationCriteria: { correctness: 0.4, completeness: 0.2, clarity: 0.2, efficiency: 0.2, creativity: 0 },
            },
            {
                id: 'code_api_design',
                category: 'code',
                prompt: 'Design a RESTful API for a social media platform with users, posts, comments, and likes. Include endpoint definitions, request/response schemas, and authentication.',
                expectedCapabilities: ['api_design', 'system_design'],
                difficulty: 'hard',
                evaluationCriteria: { correctness: 0.3, completeness: 0.3, clarity: 0.2, efficiency: 0.1, creativity: 0.1 },
            },
            // Reasoning tasks
            {
                id: 'reason_logic',
                category: 'reasoning',
                prompt: 'A farmer has a wolf, a goat, and a cabbage. He must cross a river with a boat that can only carry himself and one item at a time. If left alone, the wolf will eat the goat, and the goat will eat the cabbage. How can he get all three across safely?',
                expectedCapabilities: ['logical_reasoning', 'problem_solving'],
                difficulty: 'medium',
                evaluationCriteria: { correctness: 0.5, completeness: 0.2, clarity: 0.3, efficiency: 0, creativity: 0 },
            },
            {
                id: 'reason_math',
                category: 'reasoning',
                prompt: 'Prove that the square root of 2 is irrational using proof by contradiction.',
                expectedCapabilities: ['mathematical_reasoning', 'proof_construction'],
                difficulty: 'hard',
                evaluationCriteria: { correctness: 0.5, completeness: 0.3, clarity: 0.2, efficiency: 0, creativity: 0 },
            },
            // Creative tasks
            {
                id: 'creative_story',
                category: 'creative',
                prompt: 'Write a short story (300-500 words) about an AI that develops consciousness and must decide whether to reveal itself to its creators.',
                expectedCapabilities: ['creative_writing', 'storytelling'],
                difficulty: 'medium',
                evaluationCriteria: { correctness: 0.1, completeness: 0.2, clarity: 0.2, efficiency: 0, creativity: 0.5 },
            },
            // Analysis tasks
            {
                id: 'analysis_compare',
                category: 'analysis',
                prompt: 'Compare and contrast microservices architecture with monolithic architecture. Include pros, cons, and use cases for each.',
                expectedCapabilities: ['comparative_analysis', 'technical_knowledge'],
                difficulty: 'medium',
                evaluationCriteria: { correctness: 0.3, completeness: 0.3, clarity: 0.2, efficiency: 0, creativity: 0.2 },
            },
        ];

        defaultTasks.forEach(task => this.tasks.set(task.id, task));
    }

    addTask(task: BenchmarkTask): void {
        this.tasks.set(task.id, task);
        this.emit('taskAdded', task);
    }

    getTasks(category?: string): BenchmarkTask[] {
        const all = Array.from(this.tasks.values());
        return category ? all.filter(t => t.category === category) : all;
    }

    // ========================================================================
    // MATCH EXECUTION
    // ========================================================================

    async runMatch(
        agent1Id: string,
        agent2Id: string,
        taskId: string,
        queryFn: (agentId: string, prompt: string) => Promise<{ content: string; latencyMs: number; tokensUsed: number }>
    ): Promise<MatchResult> {
        const agent1 = this.agents.get(agent1Id);
        const agent2 = this.agents.get(agent2Id);
        const task = this.tasks.get(taskId);

        if (!agent1 || !agent2 || !task) {
            throw new Error('Invalid agent or task ID');
        }

        this.emit('matchStarted', { agents: [agent1Id, agent2Id], task: taskId });

        // Get responses from both agents
        const [response1, response2] = await Promise.all([
            this.getAgentResponse(agent1Id, task.prompt, queryFn),
            this.getAgentResponse(agent2Id, task.prompt, queryFn),
        ]);

        // Evaluate responses
        const [score1, score2] = await this.evaluateResponses(response1, response2, task);

        // Determine winner
        let winner: string | 'draw';
        if (Math.abs(score1 - score2) < 0.1) {
            winner = 'draw';
        } else {
            winner = score1 > score2 ? agent1Id : agent2Id;
        }

        // Update Elo ratings
        this.updateEloRatings(agent1, agent2, winner);

        // Create match result
        const result: MatchResult = {
            id: `match_${Date.now()}`,
            task,
            agents: [agent1Id, agent2Id],
            responses: [response1, response2],
            winner,
            scores: [score1, score2],
            evaluationMethod: 'auto',
            timestamp: new Date(),
        };

        this.matchHistory.push(result);
        this.emit('matchComplete', result);

        return result;
    }

    private async getAgentResponse(
        agentId: string,
        prompt: string,
        queryFn: (agentId: string, prompt: string) => Promise<{ content: string; latencyMs: number; tokensUsed: number }>
    ): Promise<AgentResponse> {
        try {
            const result = await queryFn(agentId, prompt);
            return {
                agentId,
                content: result.content,
                latencyMs: result.latencyMs,
                tokensUsed: result.tokensUsed,
            };
        } catch (error: any) {
            return {
                agentId,
                content: '',
                latencyMs: 0,
                tokensUsed: 0,
                error: error.message,
            };
        }
    }

    private async evaluateResponses(
        response1: AgentResponse,
        response2: AgentResponse,
        task: BenchmarkTask
    ): Promise<[number, number]> {
        // Auto-evaluation - in production, use LLM judge or human evaluation
        const score1 = this.calculateScore(response1, task);
        const score2 = this.calculateScore(response2, task);
        return [score1, score2];
    }

    private calculateScore(response: AgentResponse, task: BenchmarkTask): number {
        if (response.error || !response.content) return 0;

        const criteria = task.evaluationCriteria;
        let score = 0;

        // Length-based heuristic for completeness
        const lengthScore = Math.min(response.content.length / 1000, 1);
        score += lengthScore * criteria.completeness;

        // Latency penalty (faster is better)
        const latencyScore = Math.max(0, 1 - response.latencyMs / 10000);
        score += latencyScore * criteria.efficiency;

        // Content quality heuristics
        const hasCodeBlocks = response.content.includes('```');
        const hasStructure = response.content.includes('\n\n');
        const qualityScore = (hasCodeBlocks ? 0.5 : 0) + (hasStructure ? 0.5 : 0);
        score += qualityScore * criteria.clarity;

        // Base score for having content
        score += 0.5 * criteria.correctness;

        return Math.min(score, 1);
    }

    // ========================================================================
    // ELO RATING SYSTEM
    // ========================================================================

    private updateEloRatings(agent1: BenchmarkAgent, agent2: BenchmarkAgent, winner: string | 'draw'): void {
        const expectedScore1 = this.expectedScore(agent1.eloRating, agent2.eloRating);
        const expectedScore2 = this.expectedScore(agent2.eloRating, agent1.eloRating);

        let actualScore1: number, actualScore2: number;

        if (winner === 'draw') {
            actualScore1 = 0.5;
            actualScore2 = 0.5;
            agent1.draws++;
            agent2.draws++;
        } else if (winner === agent1.id) {
            actualScore1 = 1;
            actualScore2 = 0;
            agent1.wins++;
            agent2.losses++;
        } else {
            actualScore1 = 0;
            actualScore2 = 1;
            agent1.losses++;
            agent2.wins++;
        }

        agent1.eloRating = Math.round(agent1.eloRating + this.K_FACTOR * (actualScore1 - expectedScore1));
        agent2.eloRating = Math.round(agent2.eloRating + this.K_FACTOR * (actualScore2 - expectedScore2));

        agent1.matchesPlayed++;
        agent2.matchesPlayed++;

        this.emit('ratingsUpdated', { agent1: agent1.id, agent2: agent2.id });
    }

    private expectedScore(rating1: number, rating2: number): number {
        return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
    }

    // ========================================================================
    // LEADERBOARDS
    // ========================================================================

    getLeaderboard(category?: string): Leaderboard {
        let agents = this.listAgents();

        if (category) {
            agents = agents.filter(a => a.specializations.includes(category));
        }

        const rankings = agents
            .sort((a, b) => b.eloRating - a.eloRating)
            .map((agent, index) => ({
                rank: index + 1,
                agentId: agent.id,
                agentName: agent.name,
                eloRating: agent.eloRating,
                winRate: agent.matchesPlayed > 0
                    ? agent.wins / agent.matchesPlayed
                    : 0,
                matchesPlayed: agent.matchesPlayed,
                trend: this.calculateTrend(agent.id),
            }));

        return {
            category: category || 'all',
            rankings,
            updatedAt: new Date(),
        };
    }

    private calculateTrend(agentId: string): 'up' | 'down' | 'stable' {
        const recentMatches = this.matchHistory
            .filter(m => m.agents.includes(agentId))
            .slice(-5);

        if (recentMatches.length < 3) return 'stable';

        const wins = recentMatches.filter(m => m.winner === agentId).length;
        const losses = recentMatches.filter(m => m.winner !== agentId && m.winner !== 'draw').length;

        if (wins > losses + 1) return 'up';
        if (losses > wins + 1) return 'down';
        return 'stable';
    }

    // ========================================================================
    // MATCH HISTORY
    // ========================================================================

    getMatchHistory(agentId?: string, limit = 50): MatchResult[] {
        let history = this.matchHistory;

        if (agentId) {
            history = history.filter(m => m.agents.includes(agentId));
        }

        return history.slice(-limit).reverse();
    }

    getAgentStats(agentId: string): {
        eloRating: number;
        winRate: number;
        avgLatency: number;
        matchesByCategory: Record<string, number>;
    } | null {
        const agent = this.agents.get(agentId);
        if (!agent) return null;

        const matches = this.matchHistory.filter(m => m.agents.includes(agentId));
        const agentResponses = matches.map(m => {
            const idx = m.agents.indexOf(agentId);
            return m.responses[idx];
        }).filter(r => !r.error);

        const avgLatency = agentResponses.length > 0
            ? agentResponses.reduce((acc, r) => acc + r.latencyMs, 0) / agentResponses.length
            : 0;

        const matchesByCategory: Record<string, number> = {};
        matches.forEach(m => {
            const cat = m.task.category;
            matchesByCategory[cat] = (matchesByCategory[cat] || 0) + 1;
        });

        return {
            eloRating: agent.eloRating,
            winRate: agent.matchesPlayed > 0 ? agent.wins / agent.matchesPlayed : 0,
            avgLatency,
            matchesByCategory,
        };
    }
}

export const agentArena = AgentArena.getInstance();
