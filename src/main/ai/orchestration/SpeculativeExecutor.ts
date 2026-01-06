/**
 * Speculative Parallelism
 * 
 * Implements ChatGPT's suggestion for:
 * - Spawn multiple agents to explore strategies
 * - Race agents to find fastest solution
 * - Consensus voting to choose best output
 * - Result merging for ensemble approaches
 */

import { EventEmitter } from 'events';

export interface AgentTask {
    agentId: string;
    task: string;
    params: Record<string, any>;
}

export interface RaceResult {
    winner: AgentResult;
    allResults: AgentResult[];
    totalDuration: number;
    strategy: 'first' | 'best' | 'consensus';
}

export interface AgentResult {
    agentId: string;
    success: boolean;
    output: any;
    confidence: number;
    duration: number;
    reasoning?: string;
    error?: string;
}

export interface ConsensusResult {
    decision: any;
    votes: Vote[];
    agreement: number;
    method: 'majority' | 'weighted' | 'unanimous';
}

export interface Vote {
    agentId: string;
    choice: any;
    confidence: number;
    reasoning: string;
}

export type AgentExecutor = (agentId: string, task: string, params: Record<string, any>) => Promise<any>;

/**
 * SpeculativeExecutor enables parallel agent racing and consensus
 */
export class SpeculativeExecutor extends EventEmitter {
    private static instance: SpeculativeExecutor;
    private executors: Map<string, AgentExecutor> = new Map();
    private raceHistory: RaceResult[] = [];

    private constructor() {
        super();
    }

    static getInstance(): SpeculativeExecutor {
        if (!SpeculativeExecutor.instance) {
            SpeculativeExecutor.instance = new SpeculativeExecutor();
        }
        return SpeculativeExecutor.instance;
    }

    /**
     * Register an agent executor
     */
    registerExecutor(agentId: string, executor: AgentExecutor): void {
        this.executors.set(agentId, executor);
        console.log(`📋 [SpeculativeExecutor] Registered: ${agentId}`);
    }

    /**
     * Race multiple agents - first to complete wins
     */
    async raceFirst(tasks: AgentTask[]): Promise<RaceResult> {
        console.log(`🏁 [SpeculativeExecutor] Racing ${tasks.length} agents (first wins)`);
        const startTime = Date.now();
        this.emit('race:started', { strategy: 'first', agents: tasks.map(t => t.agentId) });

        const results: AgentResult[] = [];
        let winner: AgentResult | null = null;

        // Create race promises
        const racePromises = tasks.map(async (task) => {
            const executor = this.executors.get(task.agentId);
            if (!executor) {
                return {
                    agentId: task.agentId,
                    success: false,
                    output: null,
                    confidence: 0,
                    duration: 0,
                    error: 'Executor not found',
                };
            }

            const taskStart = Date.now();
            try {
                const output = await executor(task.agentId, task.task, task.params);
                return {
                    agentId: task.agentId,
                    success: true,
                    output,
                    confidence: output?.confidence ?? 0.8,
                    duration: Date.now() - taskStart,
                    reasoning: output?.reasoning,
                };
            } catch (error: any) {
                return {
                    agentId: task.agentId,
                    success: false,
                    output: null,
                    confidence: 0,
                    duration: Date.now() - taskStart,
                    error: error.message,
                };
            }
        });

        // Race to first successful result
        winner = await Promise.race(
            racePromises.map(async (p) => {
                const result = await p;
                if (result.success) return result;
                throw new Error('Agent failed');
            })
        ).catch(() => null);

        // Collect all results for history
        const allResults = await Promise.allSettled(racePromises);
        for (const r of allResults) {
            if (r.status === 'fulfilled') {
                results.push(r.value);
            }
        }

        // If no winner found, take best from results
        if (!winner) {
            winner = results.find(r => r.success) || results[0];
        }

        const raceResult: RaceResult = {
            winner: winner!,
            allResults: results,
            totalDuration: Date.now() - startTime,
            strategy: 'first',
        };

        this.raceHistory.push(raceResult);
        this.emit('race:completed', raceResult);
        console.log(`🏆 [SpeculativeExecutor] Winner: ${winner?.agentId} in ${winner?.duration}ms`);

        return raceResult;
    }

    /**
     * Run all agents and select best result by confidence
     */
    async raceBest(tasks: AgentTask[]): Promise<RaceResult> {
        console.log(`🏁 [SpeculativeExecutor] Racing ${tasks.length} agents (best wins)`);
        const startTime = Date.now();
        this.emit('race:started', { strategy: 'best', agents: tasks.map(t => t.agentId) });

        // Run all agents in parallel
        const results = await Promise.all(
            tasks.map(async (task) => {
                const executor = this.executors.get(task.agentId);
                if (!executor) {
                    return {
                        agentId: task.agentId,
                        success: false,
                        output: null,
                        confidence: 0,
                        duration: 0,
                        error: 'Executor not found',
                    };
                }

                const taskStart = Date.now();
                try {
                    const output = await executor(task.agentId, task.task, task.params);
                    return {
                        agentId: task.agentId,
                        success: true,
                        output,
                        confidence: output?.confidence ?? 0.5,
                        duration: Date.now() - taskStart,
                        reasoning: output?.reasoning,
                    };
                } catch (error: any) {
                    return {
                        agentId: task.agentId,
                        success: false,
                        output: null,
                        confidence: 0,
                        duration: Date.now() - taskStart,
                        error: error.message,
                    };
                }
            })
        );

        // Select winner by highest confidence
        const successfulResults = results.filter(r => r.success);
        successfulResults.sort((a, b) => b.confidence - a.confidence);

        const winner = successfulResults[0] || results[0];

        const raceResult: RaceResult = {
            winner,
            allResults: results,
            totalDuration: Date.now() - startTime,
            strategy: 'best',
        };

        this.raceHistory.push(raceResult);
        this.emit('race:completed', raceResult);
        console.log(`🏆 [SpeculativeExecutor] Winner: ${winner.agentId} (confidence: ${(winner.confidence * 100).toFixed(1)}%)`);

        return raceResult;
    }

    /**
     * Run all agents and use consensus voting
     */
    async raceConsensus(
        tasks: AgentTask[],
        method: ConsensusResult['method'] = 'weighted'
    ): Promise<{ race: RaceResult; consensus: ConsensusResult }> {
        console.log(`🏁 [SpeculativeExecutor] Racing ${tasks.length} agents (consensus)`);
        const startTime = Date.now();
        this.emit('race:started', { strategy: 'consensus', agents: tasks.map(t => t.agentId) });

        // Run all agents
        const results = await Promise.all(
            tasks.map(async (task) => {
                const executor = this.executors.get(task.agentId);
                if (!executor) {
                    return {
                        agentId: task.agentId,
                        success: false,
                        output: null,
                        confidence: 0,
                        duration: 0,
                        error: 'Executor not found',
                    };
                }

                const taskStart = Date.now();
                try {
                    const output = await executor(task.agentId, task.task, task.params);
                    return {
                        agentId: task.agentId,
                        success: true,
                        output,
                        confidence: output?.confidence ?? 0.5,
                        duration: Date.now() - taskStart,
                        reasoning: output?.reasoning,
                    };
                } catch (error: any) {
                    return {
                        agentId: task.agentId,
                        success: false,
                        output: null,
                        confidence: 0,
                        duration: Date.now() - taskStart,
                        error: error.message,
                    };
                }
            })
        );

        // Build votes
        const votes: Vote[] = results
            .filter(r => r.success)
            .map(r => ({
                agentId: r.agentId,
                choice: r.output,
                confidence: r.confidence,
                reasoning: r.reasoning || '',
            }));

        // Calculate consensus
        const consensus = this.calculateConsensus(votes, method);

        // Winner is the one closest to consensus
        const winner = results.find(r =>
            r.success && JSON.stringify(r.output) === JSON.stringify(consensus.decision)
        ) || results.filter(r => r.success).sort((a, b) => b.confidence - a.confidence)[0] || results[0];

        const raceResult: RaceResult = {
            winner,
            allResults: results,
            totalDuration: Date.now() - startTime,
            strategy: 'consensus',
        };

        this.raceHistory.push(raceResult);
        this.emit('race:completed', { race: raceResult, consensus });
        console.log(`🏆 [SpeculativeExecutor] Consensus: ${(consensus.agreement * 100).toFixed(1)}% agreement`);

        return { race: raceResult, consensus };
    }

    /**
     * Calculate consensus from votes
     */
    private calculateConsensus(votes: Vote[], method: ConsensusResult['method']): ConsensusResult {
        if (votes.length === 0) {
            return {
                decision: null,
                votes: [],
                agreement: 0,
                method,
            };
        }

        // Group by choice (using JSON string for comparison)
        const choiceGroups = new Map<string, { choice: any; votes: Vote[]; totalWeight: number }>();

        for (const vote of votes) {
            const key = JSON.stringify(vote.choice);
            if (!choiceGroups.has(key)) {
                choiceGroups.set(key, { choice: vote.choice, votes: [], totalWeight: 0 });
            }
            const group = choiceGroups.get(key)!;
            group.votes.push(vote);
            group.totalWeight += method === 'weighted' ? vote.confidence : 1;
        }

        // Find winning choice
        let winner = { choice: null as any, votes: [] as Vote[], totalWeight: 0 };
        for (const group of choiceGroups.values()) {
            if (group.totalWeight > winner.totalWeight) {
                winner = group;
            }
        }

        // Calculate agreement
        const totalWeight = method === 'weighted'
            ? votes.reduce((sum, v) => sum + v.confidence, 0)
            : votes.length;
        const agreement = winner.totalWeight / totalWeight;

        return {
            decision: winner.choice,
            votes,
            agreement,
            method,
        };
    }

    /**
     * Merge results from multiple agents (ensemble)
     */
    async ensemble<T>(
        tasks: AgentTask[],
        merger: (results: AgentResult[]) => T
    ): Promise<{ merged: T; results: AgentResult[] }> {
        console.log(`🔀 [SpeculativeExecutor] Ensemble with ${tasks.length} agents`);
        this.emit('ensemble:started', { agents: tasks.map(t => t.agentId) });

        // Run all agents
        const results = await Promise.all(
            tasks.map(async (task) => {
                const executor = this.executors.get(task.agentId);
                if (!executor) {
                    return {
                        agentId: task.agentId,
                        success: false,
                        output: null,
                        confidence: 0,
                        duration: 0,
                        error: 'Executor not found',
                    };
                }

                const taskStart = Date.now();
                try {
                    const output = await executor(task.agentId, task.task, task.params);
                    return {
                        agentId: task.agentId,
                        success: true,
                        output,
                        confidence: output?.confidence ?? 0.5,
                        duration: Date.now() - taskStart,
                    };
                } catch (error: any) {
                    return {
                        agentId: task.agentId,
                        success: false,
                        output: null,
                        confidence: 0,
                        duration: Date.now() - taskStart,
                        error: error.message,
                    };
                }
            })
        );

        // Merge successful results
        const successfulResults = results.filter(r => r.success);
        const merged = merger(successfulResults);

        this.emit('ensemble:completed', { merged, results });
        return { merged, results };
    }

    /**
     * Get race history
     */
    getRaceHistory(): RaceResult[] {
        return [...this.raceHistory];
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalRaces: number;
        byStrategy: Record<string, number>;
        avgDuration: number;
        winnerDistribution: Record<string, number>;
    } {
        const stats = {
            totalRaces: this.raceHistory.length,
            byStrategy: {} as Record<string, number>,
            avgDuration: 0,
            winnerDistribution: {} as Record<string, number>,
        };

        let totalDuration = 0;
        for (const race of this.raceHistory) {
            stats.byStrategy[race.strategy] = (stats.byStrategy[race.strategy] || 0) + 1;
            stats.winnerDistribution[race.winner.agentId] = (stats.winnerDistribution[race.winner.agentId] || 0) + 1;
            totalDuration += race.totalDuration;
        }

        stats.avgDuration = this.raceHistory.length > 0 ? totalDuration / this.raceHistory.length : 0;

        return stats;
    }
}

export default SpeculativeExecutor;
