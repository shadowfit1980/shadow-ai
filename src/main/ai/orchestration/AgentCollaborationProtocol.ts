/**
 * Agent Collaboration Protocol
 * 
 * Enables multiple agents to work together on complex tasks.
 * Features:
 * - Parallel agent execution
 * - Agent debate and consensus building
 * - Conflict resolution for contradictory suggestions
 * - Task delegation and orchestration
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentCapability {
    name: string;
    confidence: number;
    specialization: string[];
}

export interface AgentProfile {
    id: string;
    name: string;
    capabilities: AgentCapability[];
    execute: (task: any) => Promise<any>;
}

export interface CollaborationTask {
    id: string;
    description: string;
    context: Record<string, any>;
    requiredCapabilities: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AgentSuggestion {
    agentId: string;
    suggestion: any;
    confidence: number;
    reasoning: string;
    timestamp: number;
}

export interface ConsensusResult {
    agreed: boolean;
    finalDecision: any;
    supportingAgents: string[];
    dissenting: AgentSuggestion[];
    confidence: number;
}

export interface CollaborationResult {
    taskId: string;
    results: Map<string, any>;
    consensus?: ConsensusResult;
    duration: number;
    participatingAgents: string[];
}

// ============================================================================
// AGENT COLLABORATION PROTOCOL
// ============================================================================

export class AgentCollaborationProtocol extends EventEmitter {
    private static instance: AgentCollaborationProtocol;
    private registeredAgents: Map<string, AgentProfile> = new Map();
    private activeCollaborations: Map<string, CollaborationTask> = new Map();

    private constructor() {
        super();
        this.setMaxListeners(50);
    }

    static getInstance(): AgentCollaborationProtocol {
        if (!AgentCollaborationProtocol.instance) {
            AgentCollaborationProtocol.instance = new AgentCollaborationProtocol();
        }
        return AgentCollaborationProtocol.instance;
    }

    // -------------------------------------------------------------------------
    // Agent Registration
    // -------------------------------------------------------------------------

    registerAgent(agent: AgentProfile): void {
        this.registeredAgents.set(agent.id, agent);
        this.emit('agentRegistered', agent);
    }

    unregisterAgent(agentId: string): void {
        this.registeredAgents.delete(agentId);
        this.emit('agentUnregistered', agentId);
    }

    getRegisteredAgents(): AgentProfile[] {
        return Array.from(this.registeredAgents.values());
    }

    // -------------------------------------------------------------------------
    // Parallel Execution
    // -------------------------------------------------------------------------

    /**
     * Execute task across multiple agents in parallel
     */
    async parallelAgentExecution(
        agentIds: string[],
        task: CollaborationTask
    ): Promise<CollaborationResult> {
        const startTime = Date.now();
        const taskId = `collab_${Date.now()}`;
        this.activeCollaborations.set(taskId, task);

        const agents = agentIds
            .map(id => this.registeredAgents.get(id))
            .filter(Boolean) as AgentProfile[];

        this.emit('collaborationStarted', { taskId, agents: agentIds });

        // Execute all agents in parallel
        const results = await Promise.allSettled(
            agents.map(async agent => {
                try {
                    const result = await agent.execute(task);
                    return { agentId: agent.id, result, success: true };
                } catch (error: any) {
                    return { agentId: agent.id, error: error.message, success: false };
                }
            })
        );

        const resultMap = new Map<string, any>();
        results.forEach((r, i) => {
            if (r.status === 'fulfilled') {
                resultMap.set(agents[i].id, r.value);
            }
        });

        this.activeCollaborations.delete(taskId);

        const collaborationResult: CollaborationResult = {
            taskId,
            results: resultMap,
            duration: Date.now() - startTime,
            participatingAgents: agentIds,
        };

        this.emit('collaborationCompleted', collaborationResult);
        return collaborationResult;
    }

    // -------------------------------------------------------------------------
    // Agent Debate
    // -------------------------------------------------------------------------

    /**
     * Have agents debate a topic and reach consensus
     */
    async agentDebate(
        topic: string,
        agentIds: string[],
        context: Record<string, any> = {}
    ): Promise<ConsensusResult> {
        const suggestions: AgentSuggestion[] = [];

        // Phase 1: Gather initial suggestions
        for (const agentId of agentIds) {
            const agent = this.registeredAgents.get(agentId);
            if (!agent) continue;

            try {
                const result = await agent.execute({
                    task: 'debate',
                    topic,
                    context,
                    prompt: `Provide your expert opinion on: ${topic}`
                });

                suggestions.push({
                    agentId,
                    suggestion: result,
                    confidence: result.confidence || 0.5,
                    reasoning: result.reasoning || '',
                    timestamp: Date.now(),
                });
            } catch (error) {
                console.error(`Agent ${agentId} failed in debate:`, error);
            }
        }

        // Phase 2: Find consensus
        return this.buildConsensus(suggestions);
    }

    /**
     * Build consensus from multiple suggestions
     */
    private buildConsensus(suggestions: AgentSuggestion[]): ConsensusResult {
        if (suggestions.length === 0) {
            return {
                agreed: false,
                finalDecision: null,
                supportingAgents: [],
                dissenting: [],
                confidence: 0,
            };
        }

        // Weight by confidence
        const weightedSuggestions = suggestions.map(s => ({
            ...s,
            weight: s.confidence,
        }));

        // Sort by confidence
        weightedSuggestions.sort((a, b) => b.weight - a.weight);

        // Take highest confidence suggestion as baseline
        const primary = weightedSuggestions[0];

        // Find supporting agents (similar suggestions)
        const supporting = weightedSuggestions.filter(s =>
            s.agentId !== primary.agentId &&
            this.areSuggestionsSimilar(s.suggestion, primary.suggestion)
        );

        const dissenting = weightedSuggestions.filter(s =>
            s.agentId !== primary.agentId &&
            !this.areSuggestionsSimilar(s.suggestion, primary.suggestion)
        );

        const supportRatio = (supporting.length + 1) / suggestions.length;
        const agreed = supportRatio >= 0.5;

        return {
            agreed,
            finalDecision: primary.suggestion,
            supportingAgents: [primary.agentId, ...supporting.map(s => s.agentId)],
            dissenting,
            confidence: agreed ? supportRatio * primary.confidence : 0.3,
        };
    }

    private areSuggestionsSimilar(a: any, b: any): boolean {
        // Simple similarity check - can be enhanced with semantic comparison
        const aStr = JSON.stringify(a).toLowerCase();
        const bStr = JSON.stringify(b).toLowerCase();

        // Check for common key terms
        const aWords = new Set(aStr.split(/\W+/).filter(w => w.length > 3));
        const bWords = new Set(bStr.split(/\W+/).filter(w => w.length > 3));

        let overlap = 0;
        aWords.forEach(w => {
            if (bWords.has(w)) overlap++;
        });

        const similarity = overlap / Math.max(aWords.size, bWords.size);
        return similarity > 0.3;
    }

    // -------------------------------------------------------------------------
    // Conflict Resolution
    // -------------------------------------------------------------------------

    /**
     * Resolve conflicting suggestions from multiple agents
     */
    async resolveConflictingSuggestions(
        suggestions: AgentSuggestion[]
    ): Promise<AgentSuggestion> {
        if (suggestions.length === 0) {
            throw new Error('No suggestions to resolve');
        }

        if (suggestions.length === 1) {
            return suggestions[0];
        }

        // Strategy 1: Weight by confidence
        const byConfidence = [...suggestions].sort((a, b) => b.confidence - a.confidence);

        // Strategy 2: Look for overlap
        const allSuggestions = suggestions.map(s => s.suggestion);
        const merged = this.mergeSuggestions(allSuggestions);

        // Return highest confidence with merged insights
        return {
            agentId: 'collaboration_protocol',
            suggestion: merged || byConfidence[0].suggestion,
            confidence: byConfidence[0].confidence * 0.9,
            reasoning: `Resolved from ${suggestions.length} agent suggestions. Primary: ${byConfidence[0].agentId}`,
            timestamp: Date.now(),
        };
    }

    private mergeSuggestions(suggestions: any[]): any {
        // Try to merge object suggestions
        if (suggestions.every(s => typeof s === 'object' && s !== null)) {
            const merged: Record<string, any> = {};
            for (const s of suggestions) {
                Object.assign(merged, s);
            }
            return merged;
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // Task Delegation
    // -------------------------------------------------------------------------

    /**
     * Delegate subtasks to appropriate agents
     */
    async agentDelegation(
        primaryAgentId: string,
        subtasks: CollaborationTask[]
    ): Promise<Map<string, any>> {
        const results = new Map<string, any>();

        for (const subtask of subtasks) {
            // Find best agent for subtask
            const bestAgent = this.findBestAgentForTask(subtask);

            if (bestAgent) {
                try {
                    const result = await bestAgent.execute(subtask);
                    results.set(subtask.id, { agent: bestAgent.id, result });
                } catch (error: any) {
                    results.set(subtask.id, { agent: bestAgent.id, error: error.message });
                }
            } else {
                results.set(subtask.id, { error: 'No suitable agent found' });
            }
        }

        return results;
    }

    private findBestAgentForTask(task: CollaborationTask): AgentProfile | null {
        let bestAgent: AgentProfile | null = null;
        let bestScore = 0;

        for (const agent of this.registeredAgents.values()) {
            let score = 0;

            for (const cap of agent.capabilities) {
                for (const required of task.requiredCapabilities) {
                    if (cap.name.toLowerCase().includes(required.toLowerCase()) ||
                        cap.specialization.some(s => s.toLowerCase().includes(required.toLowerCase()))) {
                        score += cap.confidence;
                    }
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestAgent = agent;
            }
        }

        return bestAgent;
    }

    // -------------------------------------------------------------------------
    // Statistics
    // -------------------------------------------------------------------------

    getStats(): {
        registeredAgents: number;
        activeCollaborations: number;
    } {
        return {
            registeredAgents: this.registeredAgents.size,
            activeCollaborations: this.activeCollaborations.size,
        };
    }
}

// Export singleton
export const agentCollaboration = AgentCollaborationProtocol.getInstance();
