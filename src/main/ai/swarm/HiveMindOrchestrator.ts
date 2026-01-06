/**
 * Hive Mind Mode - Collaborative AI Swarm Intelligence
 * Merge contexts across teams for swarm intelligence
 * Grok Recommendation: Hive Mind Mode / Shared Context Supercharge
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface AgentContext {
    id: string;
    agentId: string;
    userId: string;
    teamId: string;
    knowledge: Map<string, KnowledgeEntry>;
    activeFiles: string[];
    recentActions: AgentAction[];
    capabilities: string[];
    status: 'active' | 'idle' | 'busy';
    lastSync: Date;
}

interface KnowledgeEntry {
    key: string;
    value: unknown;
    source: string;
    confidence: number;
    timestamp: Date;
    expiresAt?: Date;
}

interface AgentAction {
    type: string;
    target: string;
    timestamp: Date;
    result: 'success' | 'failure' | 'pending';
}

interface SwarmTask {
    id: string;
    description: string;
    priority: number;
    requiredCapabilities: string[];
    assignedAgents: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    subtasks: SwarmTask[];
    results: Map<string, unknown>;
    createdAt: Date;
    completedAt?: Date;
}

interface ConsensusVote {
    agentId: string;
    decision: string;
    confidence: number;
    reasoning: string;
    timestamp: Date;
}

interface HiveMindStats {
    totalAgents: number;
    activeAgents: number;
    sharedKnowledgeSize: number;
    completedTasks: number;
    consensusAccuracy: number;
    syncLatency: number;
}

export class HiveMindOrchestrator extends EventEmitter {
    private static instance: HiveMindOrchestrator;
    private contexts: Map<string, AgentContext> = new Map();
    private sharedKnowledge: Map<string, KnowledgeEntry> = new Map();
    private activeTasks: Map<string, SwarmTask> = new Map();
    private consensusHistory: Map<string, ConsensusVote[]> = new Map();
    private syncInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.startSyncLoop();
    }

    static getInstance(): HiveMindOrchestrator {
        if (!HiveMindOrchestrator.instance) {
            HiveMindOrchestrator.instance = new HiveMindOrchestrator();
        }
        return HiveMindOrchestrator.instance;
    }

    private startSyncLoop(): void {
        this.syncInterval = setInterval(() => {
            this.synchronizeContexts();
        }, 5000); // Sync every 5 seconds
    }

    registerAgent(agentId: string, userId: string, teamId: string, capabilities: string[] = []): AgentContext {
        const context: AgentContext = {
            id: crypto.randomUUID(),
            agentId,
            userId,
            teamId,
            knowledge: new Map(),
            activeFiles: [],
            recentActions: [],
            capabilities,
            status: 'active',
            lastSync: new Date()
        };

        this.contexts.set(agentId, context);
        this.emit('agentRegistered', { agentId, context });
        return context;
    }

    unregisterAgent(agentId: string): boolean {
        const existed = this.contexts.delete(agentId);
        if (existed) {
            this.emit('agentUnregistered', { agentId });
        }
        return existed;
    }

    shareKnowledge(agentId: string, key: string, value: unknown, confidence: number = 0.8): boolean {
        const context = this.contexts.get(agentId);
        if (!context) return false;

        const entry: KnowledgeEntry = {
            key,
            value,
            source: agentId,
            confidence,
            timestamp: new Date()
        };

        // Add to agent's local knowledge
        context.knowledge.set(key, entry);

        // Determine if should be shared globally based on confidence
        if (confidence > 0.7) {
            const existing = this.sharedKnowledge.get(key);
            if (!existing || existing.confidence < confidence) {
                this.sharedKnowledge.set(key, entry);
                this.emit('knowledgeShared', { agentId, key, entry });
            }
        }

        return true;
    }

    queryKnowledge(key: string): KnowledgeEntry | null {
        return this.sharedKnowledge.get(key) || null;
    }

    searchKnowledge(pattern: string): KnowledgeEntry[] {
        const regex = new RegExp(pattern, 'i');
        const results: KnowledgeEntry[] = [];

        for (const [key, entry] of this.sharedKnowledge) {
            if (regex.test(key) || (typeof entry.value === 'string' && regex.test(entry.value))) {
                results.push(entry);
            }
        }

        return results.sort((a, b) => b.confidence - a.confidence);
    }

    createSwarmTask(description: string, requiredCapabilities: string[], priority: number = 5): SwarmTask {
        const task: SwarmTask = {
            id: crypto.randomUUID(),
            description,
            priority,
            requiredCapabilities,
            assignedAgents: [],
            status: 'pending',
            subtasks: [],
            results: new Map(),
            createdAt: new Date()
        };

        this.activeTasks.set(task.id, task);
        this.assignAgentsToTask(task);
        this.emit('taskCreated', task);

        return task;
    }

    private assignAgentsToTask(task: SwarmTask): void {
        const eligibleAgents: string[] = [];

        for (const [agentId, context] of this.contexts) {
            if (context.status !== 'active') continue;

            // Check if agent has required capabilities
            const hasCapabilities = task.requiredCapabilities.every(cap =>
                context.capabilities.includes(cap)
            );

            if (hasCapabilities) {
                eligibleAgents.push(agentId);
            }
        }

        // Assign up to 5 agents per task
        task.assignedAgents = eligibleAgents.slice(0, 5);

        for (const agentId of task.assignedAgents) {
            const context = this.contexts.get(agentId);
            if (context) {
                context.status = 'busy';
            }
        }

        this.emit('agentsAssigned', { taskId: task.id, agents: task.assignedAgents });
    }

    submitTaskResult(taskId: string, agentId: string, result: unknown): boolean {
        const task = this.activeTasks.get(taskId);
        if (!task || !task.assignedAgents.includes(agentId)) return false;

        task.results.set(agentId, result);
        this.emit('resultSubmitted', { taskId, agentId, result });

        // Check if all agents have submitted
        if (task.results.size >= task.assignedAgents.length) {
            this.concludeTask(task);
        }

        return true;
    }

    private concludeTask(task: SwarmTask): void {
        task.status = 'completed';
        task.completedAt = new Date();

        // Release agents
        for (const agentId of task.assignedAgents) {
            const context = this.contexts.get(agentId);
            if (context) {
                context.status = 'active';
            }
        }

        // Merge results using consensus
        const mergedResult = this.mergeResults(task);

        this.emit('taskCompleted', { task, mergedResult });
    }

    private mergeResults(task: SwarmTask): unknown {
        const results = Array.from(task.results.values());

        if (results.length === 0) return null;
        if (results.length === 1) return results[0];

        // Simple majority voting for string results
        if (results.every(r => typeof r === 'string')) {
            const counts = new Map<string, number>();
            for (const r of results) {
                counts.set(r as string, (counts.get(r as string) || 0) + 1);
            }
            let maxCount = 0;
            let winner = results[0];
            for (const [value, count] of counts) {
                if (count > maxCount) {
                    maxCount = count;
                    winner = value;
                }
            }
            return winner;
        }

        // For complex objects, merge unique fields
        if (results.every(r => typeof r === 'object' && r !== null)) {
            const merged: Record<string, unknown> = {};
            for (const r of results) {
                Object.assign(merged, r);
            }
            return merged;
        }

        // Default: return first result
        return results[0];
    }

    initiateConsensus(topic: string, options: string[], timeout: number = 30000): Promise<{ decision: string; confidence: number; votes: ConsensusVote[] }> {
        return new Promise((resolve) => {
            const votes: ConsensusVote[] = [];
            const votingId = crypto.randomUUID();

            // Request votes from all active agents
            for (const [agentId, context] of this.contexts) {
                if (context.status === 'active') {
                    // Simulate agent voting (in production, would query actual agents)
                    const vote: ConsensusVote = {
                        agentId,
                        decision: options[Math.floor(Math.random() * options.length)],
                        confidence: 0.5 + Math.random() * 0.5,
                        reasoning: 'Based on available context and knowledge',
                        timestamp: new Date()
                    };
                    votes.push(vote);
                }
            }

            this.consensusHistory.set(votingId, votes);

            // Tally votes
            const tally = new Map<string, { count: number; totalConfidence: number }>();
            for (const vote of votes) {
                const existing = tally.get(vote.decision) || { count: 0, totalConfidence: 0 };
                existing.count++;
                existing.totalConfidence += vote.confidence;
                tally.set(vote.decision, existing);
            }

            // Find winner
            let winner = options[0];
            let maxScore = 0;
            for (const [option, stats] of tally) {
                const score = stats.count * stats.totalConfidence;
                if (score > maxScore) {
                    maxScore = score;
                    winner = option;
                }
            }

            const confidence = tally.get(winner)?.count
                ? tally.get(winner)!.count / votes.length
                : 0;

            this.emit('consensusReached', { topic, decision: winner, confidence, votes });
            resolve({ decision: winner, confidence, votes });
        });
    }

    private synchronizeContexts(): void {
        const now = new Date();

        for (const [agentId, context] of this.contexts) {
            // Check for stale agents
            const timeSinceSync = now.getTime() - context.lastSync.getTime();
            if (timeSinceSync > 60000) { // 1 minute
                context.status = 'idle';
            }

            // Propagate shared knowledge to agents
            for (const [key, entry] of this.sharedKnowledge) {
                const localEntry = context.knowledge.get(key);
                if (!localEntry || localEntry.timestamp < entry.timestamp) {
                    context.knowledge.set(key, entry);
                }
            }
        }

        // Clean expired knowledge
        for (const [key, entry] of this.sharedKnowledge) {
            if (entry.expiresAt && entry.expiresAt < now) {
                this.sharedKnowledge.delete(key);
            }
        }

        this.emit('syncComplete', { timestamp: now });
    }

    heartbeat(agentId: string): boolean {
        const context = this.contexts.get(agentId);
        if (!context) return false;

        context.lastSync = new Date();
        if (context.status === 'idle') {
            context.status = 'active';
        }

        return true;
    }

    getStats(): HiveMindStats {
        let activeAgents = 0;
        for (const context of this.contexts.values()) {
            if (context.status === 'active') activeAgents++;
        }

        let completedTasks = 0;
        for (const task of this.activeTasks.values()) {
            if (task.status === 'completed') completedTasks++;
        }

        return {
            totalAgents: this.contexts.size,
            activeAgents,
            sharedKnowledgeSize: this.sharedKnowledge.size,
            completedTasks,
            consensusAccuracy: 0.85, // Would track actual accuracy
            syncLatency: 50 // ms, would measure actual latency
        };
    }

    getActiveAgents(): { agentId: string; status: string; capabilities: string[] }[] {
        return Array.from(this.contexts.values()).map(c => ({
            agentId: c.agentId,
            status: c.status,
            capabilities: c.capabilities
        }));
    }

    getTaskStatus(taskId: string): SwarmTask | null {
        return this.activeTasks.get(taskId) || null;
    }

    broadcastMessage(message: string, data?: unknown): void {
        for (const [agentId] of this.contexts) {
            this.emit('broadcast', { agentId, message, data });
        }
    }

    getTeamContext(teamId: string): AgentContext[] {
        return Array.from(this.contexts.values()).filter(c => c.teamId === teamId);
    }

    mergeTeamKnowledge(teamId: string): Map<string, KnowledgeEntry> {
        const merged = new Map<string, KnowledgeEntry>();

        for (const context of this.getTeamContext(teamId)) {
            for (const [key, entry] of context.knowledge) {
                const existing = merged.get(key);
                if (!existing || existing.confidence < entry.confidence) {
                    merged.set(key, entry);
                }
            }
        }

        return merged;
    }

    destroy(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.contexts.clear();
        this.sharedKnowledge.clear();
        this.activeTasks.clear();
    }
}

export const hiveMindOrchestrator = HiveMindOrchestrator.getInstance();
