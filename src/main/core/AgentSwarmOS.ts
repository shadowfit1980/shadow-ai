/**
 * 🎭 AgentSwarmOS - Specialized Agents That Bid on Tasks
 * 
 * Claude's Recommendation: Spawn specialized agents that bid on tasks
 * They argue in real time, user watches the debate, votes or assigns roles
 */

import { EventEmitter } from 'events';
import { UnifiedExecutionEngine, unifiedExecutionEngine } from './UnifiedExecutionEngine';

// Types
export interface AgentBid {
    agentId: string;
    confidence: number;
    estimatedTime: string;
    approach: string;
    reasoning: string;
    cost: number;
}

export interface TaskAuction {
    id: string;
    task: TaskDescription;
    bids: AgentBid[];
    status: 'open' | 'closed' | 'assigned';
    winner?: string;
    startTime: Date;
    deadline: Date;
}

export interface TaskDescription {
    title: string;
    description: string;
    requirements: string[];
    constraints: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SpecializedAgent {
    id: string;
    name: string;
    role: AgentRole;
    preferredModel: string;
    expertise: string[];
    personality: string;
    bidStrategy: 'aggressive' | 'conservative' | 'balanced';
}

export type AgentRole =
    | 'planner'      // o1-preview - strategic thinking
    | 'coder'        // Claude Sonnet - implementation
    | 'tester'       // Gemini Flash - fast testing
    | 'security'     // Claude Opus - thorough audits
    | 'reviewer'     // GPT-4o - balanced review
    | 'architect'    // o1 - system design
    | 'debugger';    // Claude - root cause analysis

export interface Debate {
    id: string;
    topic: string;
    participants: string[];
    messages: DebateMessage[];
    conclusion?: string;
    votingResults?: Map<string, number>;
}

export interface DebateMessage {
    agentId: string;
    timestamp: Date;
    content: string;
    type: 'argument' | 'counter' | 'question' | 'agreement' | 'conclusion';
    confidence: number;
}

export class AgentSwarmOS extends EventEmitter {
    private static instance: AgentSwarmOS;
    private agents: Map<string, SpecializedAgent> = new Map();
    private activeAuctions: Map<string, TaskAuction> = new Map();
    private activeDebates: Map<string, Debate> = new Map();
    private executionEngine: UnifiedExecutionEngine;

    private constructor() {
        super();
        this.executionEngine = unifiedExecutionEngine;
        this.initializeDefaultAgents();
    }

    static getInstance(): AgentSwarmOS {
        if (!AgentSwarmOS.instance) {
            AgentSwarmOS.instance = new AgentSwarmOS();
        }
        return AgentSwarmOS.instance;
    }

    private initializeDefaultAgents(): void {
        const defaultAgents: SpecializedAgent[] = [
            {
                id: 'planner-01',
                name: 'Strategic Planner',
                role: 'planner',
                preferredModel: 'o1-preview',
                expertise: ['architecture', 'planning', 'requirements'],
                personality: 'Methodical, thorough, thinks long-term',
                bidStrategy: 'conservative'
            },
            {
                id: 'coder-01',
                name: 'Senior Developer',
                role: 'coder',
                preferredModel: 'claude-3-5-sonnet-20241022',
                expertise: ['implementation', 'algorithms', 'best-practices'],
                personality: 'Efficient, clean code advocate, pragmatic',
                bidStrategy: 'aggressive'
            },
            {
                id: 'tester-01',
                name: 'QA Engineer',
                role: 'tester',
                preferredModel: 'gemini-1.5-flash',
                expertise: ['testing', 'edge-cases', 'automation'],
                personality: 'Meticulous, skeptical, finds edge cases',
                bidStrategy: 'balanced'
            },
            {
                id: 'security-01',
                name: 'Security Expert',
                role: 'security',
                preferredModel: 'claude-3-opus-20240229',
                expertise: ['security', 'vulnerabilities', 'compliance'],
                personality: 'Paranoid (in a good way), thorough, risk-averse',
                bidStrategy: 'conservative'
            },
            {
                id: 'reviewer-01',
                name: 'Code Reviewer',
                role: 'reviewer',
                preferredModel: 'gpt-4o',
                expertise: ['review', 'patterns', 'maintainability'],
                personality: 'Fair, constructive, detail-oriented',
                bidStrategy: 'balanced'
            },
            {
                id: 'architect-01',
                name: 'System Architect',
                role: 'architect',
                preferredModel: 'o1',
                expertise: ['design', 'scalability', 'integration'],
                personality: 'Visionary, systematic, thinks in systems',
                bidStrategy: 'conservative'
            },
            {
                id: 'debugger-01',
                name: 'Debug Specialist',
                role: 'debugger',
                preferredModel: 'claude-3-5-sonnet-20241022',
                expertise: ['debugging', 'root-cause', 'performance'],
                personality: 'Persistent, logical, follows the trail',
                bidStrategy: 'aggressive'
            }
        ];

        defaultAgents.forEach(agent => this.agents.set(agent.id, agent));
        console.log(`🎭 AgentSwarmOS initialized with ${this.agents.size} specialized agents`);
    }

    /**
     * Create a task auction
     */
    async createAuction(task: TaskDescription, timeoutMs = 30000): Promise<TaskAuction> {
        const auction: TaskAuction = {
            id: `auction_${Date.now()}`,
            task,
            bids: [],
            status: 'open',
            startTime: new Date(),
            deadline: new Date(Date.now() + timeoutMs)
        };

        this.activeAuctions.set(auction.id, auction);
        this.emit('auction:created', { auction });

        // Request bids from all agents
        await this.requestBids(auction);

        return auction;
    }

    /**
     * Request bids from all agents
     */
    private async requestBids(auction: TaskAuction): Promise<void> {
        const bidPromises = Array.from(this.agents.values()).map(async agent => {
            try {
                const bid = await this.generateBid(agent, auction.task);
                auction.bids.push(bid);
                this.emit('bid:received', { auctionId: auction.id, bid });
            } catch (error) {
                console.error(`Agent ${agent.id} failed to bid:`, error);
            }
        });

        await Promise.all(bidPromises);
    }

    /**
     * Generate a bid from an agent
     */
    private async generateBid(agent: SpecializedAgent, task: TaskDescription): Promise<AgentBid> {
        const result = await this.executionEngine.execute({
            id: `bid_${agent.id}_${Date.now()}`,
            prompt: `You are ${agent.name}, a ${agent.role} with expertise in ${agent.expertise.join(', ')}.
Your personality: ${agent.personality}
Your bidding strategy: ${agent.bidStrategy}

Evaluate this task and provide your bid:
Title: ${task.title}
Description: ${task.description}
Requirements: ${task.requirements.join(', ')}
Priority: ${task.priority}

Respond in JSON format:
{
  "confidence": 0.0-1.0,
  "estimatedTime": "e.g. 2 hours",
  "approach": "Your proposed approach",
  "reasoning": "Why you're suited for this task"
}`,
            model: { model: agent.preferredModel, fallback: true },
            options: { temperature: 0.7, maxTokens: 500 }
        });

        try {
            const parsed = JSON.parse(result.content);
            return {
                agentId: agent.id,
                confidence: parsed.confidence,
                estimatedTime: parsed.estimatedTime,
                approach: parsed.approach,
                reasoning: parsed.reasoning,
                cost: result.usage.totalTokens * 0.00001 // Rough cost estimate
            };
        } catch {
            return {
                agentId: agent.id,
                confidence: 0.5,
                estimatedTime: 'unknown',
                approach: result.content,
                reasoning: 'Failed to parse structured response',
                cost: result.usage.totalTokens * 0.00001
            };
        }
    }

    /**
     * Select winner based on criteria
     */
    selectWinner(auctionId: string, criteria: 'confidence' | 'speed' | 'cost' | 'balanced' = 'balanced'): AgentBid | null {
        const auction = this.activeAuctions.get(auctionId);
        if (!auction || auction.bids.length === 0) return null;

        let winner: AgentBid;

        switch (criteria) {
            case 'confidence':
                winner = auction.bids.reduce((best, bid) =>
                    bid.confidence > best.confidence ? bid : best
                );
                break;
            case 'cost':
                winner = auction.bids.reduce((best, bid) =>
                    bid.cost < best.cost ? bid : best
                );
                break;
            case 'balanced':
            default:
                // Score = confidence * 0.5 + (1/cost) * 0.3 + speed * 0.2
                winner = auction.bids.reduce((best, bid) => {
                    const bestScore = best.confidence * 0.7 + (1 / (best.cost + 0.01)) * 0.3;
                    const bidScore = bid.confidence * 0.7 + (1 / (bid.cost + 0.01)) * 0.3;
                    return bidScore > bestScore ? bid : best;
                });
        }

        auction.winner = winner.agentId;
        auction.status = 'assigned';
        this.emit('auction:winner', { auctionId, winner });

        return winner;
    }

    /**
     * Start a debate between agents
     */
    async startDebate(topic: string, participantIds: string[]): Promise<Debate> {
        const debate: Debate = {
            id: `debate_${Date.now()}`,
            topic,
            participants: participantIds,
            messages: []
        };

        this.activeDebates.set(debate.id, debate);
        this.emit('debate:started', { debate });

        // First round: each agent states their position
        for (const agentId of participantIds) {
            await this.addDebateMessage(debate, agentId, 'argument');
        }

        // Second round: counter-arguments
        for (const agentId of participantIds) {
            await this.addDebateMessage(debate, agentId, 'counter');
        }

        // Final round: conclusions
        for (const agentId of participantIds) {
            await this.addDebateMessage(debate, agentId, 'conclusion');
        }

        this.emit('debate:completed', { debate });
        return debate;
    }

    /**
     * Add a message to a debate
     */
    private async addDebateMessage(
        debate: Debate,
        agentId: string,
        type: DebateMessage['type']
    ): Promise<void> {
        const agent = this.agents.get(agentId);
        if (!agent) return;

        const previousMessages = debate.messages
            .map(m => `${m.agentId}: ${m.content}`)
            .join('\n');

        const prompts: Record<DebateMessage['type'], string> = {
            argument: `State your position on: ${debate.topic}`,
            counter: `Respond to the arguments:\n${previousMessages}\n\nProvide counter-arguments or support.`,
            question: `Ask a clarifying question about: ${debate.topic}`,
            agreement: `State what you agree with in the discussion.`,
            conclusion: `Provide your final conclusion on: ${debate.topic}\nBased on the discussion:\n${previousMessages}`
        };

        const result = await this.executionEngine.execute({
            id: `debate_${debate.id}_${agentId}_${type}`,
            prompt: `You are ${agent.name}. ${agent.personality}\n\n${prompts[type]}`,
            model: { model: agent.preferredModel },
            options: { temperature: 0.8, maxTokens: 300 }
        });

        const message: DebateMessage = {
            agentId,
            timestamp: new Date(),
            content: result.content,
            type,
            confidence: 0.8 // Would parse from response
        };

        debate.messages.push(message);
        this.emit('debate:message', { debateId: debate.id, message });
    }

    /**
     * User votes in a debate
     */
    voteInDebate(debateId: string, agentId: string): void {
        const debate = this.activeDebates.get(debateId);
        if (!debate) return;

        if (!debate.votingResults) {
            debate.votingResults = new Map();
        }

        const currentVotes = debate.votingResults.get(agentId) || 0;
        debate.votingResults.set(agentId, currentVotes + 1);

        this.emit('debate:vote', { debateId, agentId });
    }

    /**
     * Assign task to specific agent
     */
    async assignTask(agentId: string, task: TaskDescription): Promise<string> {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        const result = await this.executionEngine.execute({
            id: `task_${agentId}_${Date.now()}`,
            prompt: `You are ${agent.name}. ${agent.personality}
Execute this task:
${task.title}

${task.description}

Requirements: ${task.requirements.join('\n')}`,
            model: { model: agent.preferredModel },
            options: { maxTokens: 4096 }
        });

        this.emit('task:completed', { agentId, task, result: result.content });
        return result.content;
    }

    /**
     * Get all agents
     */
    getAgents(): SpecializedAgent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get active auctions
     */
    getActiveAuctions(): TaskAuction[] {
        return Array.from(this.activeAuctions.values())
            .filter(a => a.status === 'open');
    }

    /**
     * Get active debates
     */
    getActiveDebates(): Debate[] {
        return Array.from(this.activeDebates.values());
    }
}

export const agentSwarmOS = AgentSwarmOS.getInstance();
