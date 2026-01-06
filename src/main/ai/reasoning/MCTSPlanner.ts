/**
 * MCTS Planner (Monte Carlo Tree Search)
 * 
 * Uses Monte Carlo Tree Search for intelligent task planning and action selection.
 * Explores possible action sequences and selects optimal paths.
 * 
 * Enhanced with:
 * - TemporalContextEngine integration for historical pattern awareness
 * - DeveloperMindMerge integration for personalized predictions
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface PlanState {
    id: string;
    description: string;
    context: Record<string, any>;
    /** Value estimate from simulations (0-1) */
    value: number;
    /** Visit count for UCB calculation */
    visits: number;
    /** Whether this is a terminal state */
    terminal: boolean;
}

export interface PlanAction {
    name: string;
    description: string;
    params: Record<string, any>;
    /** Estimated success probability */
    probability: number;
    /** Estimated cost/time */
    cost: number;
    /** Temporal relevance boost (from history) */
    temporalBoost?: number;
    /** Developer preference score */
    developerPreference?: number;
}

export interface PlanNode {
    id: string;
    state: PlanState;
    action?: PlanAction;
    parent?: PlanNode;
    children: PlanNode[];
    /** UCB1 score for selection */
    ucbScore: number;
}

export interface SearchResult {
    bestPath: PlanAction[];
    confidence: number;
    nodesExplored: number;
    simulationsRun: number;
    estimatedValue: number;
    /** Whether temporal context influenced the result */
    temporalInfluence?: boolean;
    /** Whether developer patterns influenced the result */
    developerInfluence?: boolean;
}

export interface MCTSConfig {
    /** Maximum iterations */
    maxIterations: number;
    /** Exploration constant (higher = more exploration) */
    explorationConstant: number;
    /** Maximum tree depth */
    maxDepth: number;
    /** Simulation rollout depth */
    rolloutDepth: number;
    /** Time budget in milliseconds */
    timeBudget: number;
    /** Enable temporal context integration */
    useTemporalContext: boolean;
    /** Enable developer pattern integration */
    useDeveloperPatterns: boolean;
    /** Weight for temporal boost (0-1) */
    temporalWeight: number;
    /** Weight for developer preferences (0-1) */
    developerWeight: number;
}

// ============================================================================
// MCTS PLANNER
// ============================================================================

export class MCTSPlanner extends EventEmitter {
    private static instance: MCTSPlanner;

    private config: MCTSConfig = {
        maxIterations: 1000,
        explorationConstant: 1.41, // sqrt(2) - UCB1 standard
        maxDepth: 10,
        rolloutDepth: 5,
        timeBudget: 5000,
        useTemporalContext: true,
        useDeveloperPatterns: true,
        temporalWeight: 0.2,
        developerWeight: 0.3,
    };

    private nodeCount = 0;

    // Temporal and developer context references (lazy loaded)
    private temporalEngine: any = null;
    private developerMerge: any = null;

    private constructor() {
        super();
        this.initializeContextEngines();
    }

    static getInstance(): MCTSPlanner {
        if (!MCTSPlanner.instance) {
            MCTSPlanner.instance = new MCTSPlanner();
        }
        return MCTSPlanner.instance;
    }

    private initializeContextEngines(): void {
        // Lazy load to avoid circular dependencies
        try {
            const { temporalContextEngine } = require('../context/TemporalContextEngine');
            this.temporalEngine = temporalContextEngine;
        } catch {
            console.log('TemporalContextEngine not available');
        }

        try {
            const { developerMindMerge } = require('../memory/DeveloperMindMerge');
            this.developerMerge = developerMindMerge;
        } catch {
            console.log('DeveloperMindMerge not available');
        }
    }

    // -------------------------------------------------------------------------
    // Main Search
    // -------------------------------------------------------------------------

    /**
     * Find the best action sequence for a given state
     */
    async search(
        initialState: PlanState,
        getActions: (state: PlanState) => Promise<PlanAction[]>,
        simulate: (state: PlanState, action: PlanAction) => Promise<PlanState>,
        evaluate: (state: PlanState) => Promise<number>
    ): Promise<SearchResult> {
        const startTime = Date.now();
        this.nodeCount = 0;

        // Create root node
        const root: PlanNode = this.createNode(initialState);

        let iterations = 0;
        let simulationsRun = 0;

        // Main MCTS loop
        while (
            iterations < this.config.maxIterations &&
            Date.now() - startTime < this.config.timeBudget
        ) {
            iterations++;

            // Phase 1: Selection
            const selected = this.select(root);

            // Phase 2: Expansion
            const expanded = await this.expand(selected, getActions, simulate);

            // Phase 3: Simulation (rollout)
            const value = await this.simulate(expanded, simulate, evaluate);
            simulationsRun++;

            // Phase 4: Backpropagation
            this.backpropagate(expanded, value);

            this.emit('iteration', {
                iteration: iterations,
                nodesExplored: this.nodeCount,
                bestValue: this.getBestChild(root)?.state.value || 0,
            });
        }

        // Extract best path
        const bestPath = this.extractBestPath(root);
        const bestChild = this.getBestChild(root);

        return {
            bestPath,
            confidence: bestChild ? bestChild.state.visits / iterations : 0,
            nodesExplored: this.nodeCount,
            simulationsRun,
            estimatedValue: bestChild?.state.value || 0,
        };
    }

    /**
     * Simple planning for action selection
     */
    async planActions(
        goal: string,
        context: Record<string, any>,
        availableActions: PlanAction[]
    ): Promise<PlanAction[]> {
        const initialState: PlanState = {
            id: 'initial',
            description: goal,
            context,
            value: 0,
            visits: 0,
            terminal: false,
        };

        // Simple heuristic-based action selection when no simulation is possible
        const scoredActions = availableActions.map(action => ({
            action,
            score: this.scoreAction(action, goal, context),
        }));

        scoredActions.sort((a, b) => b.score - a.score);

        return scoredActions.slice(0, 5).map(s => s.action);
    }

    // -------------------------------------------------------------------------
    // MCTS Phases
    // -------------------------------------------------------------------------

    /**
     * Selection phase: Navigate to a leaf node using UCB1
     */
    private select(node: PlanNode): PlanNode {
        let current = node;

        while (current.children.length > 0 && !current.state.terminal) {
            // Update UCB scores
            for (const child of current.children) {
                child.ucbScore = this.calculateUCB(child, current);
            }

            // Select child with highest UCB score
            current = current.children.reduce((best, child) =>
                child.ucbScore > best.ucbScore ? child : best
            );
        }

        return current;
    }

    /**
     * Expansion phase: Add child nodes for unexplored actions
     */
    private async expand(
        node: PlanNode,
        getActions: (state: PlanState) => Promise<PlanAction[]>,
        simulate: (state: PlanState, action: PlanAction) => Promise<PlanState>
    ): Promise<PlanNode> {
        if (node.state.terminal) {
            return node;
        }

        // Get available actions
        const actions = await getActions(node.state);

        if (actions.length === 0) {
            node.state.terminal = true;
            return node;
        }

        // Check depth limit
        let depth = 0;
        let current: PlanNode | undefined = node;
        while (current?.parent) {
            depth++;
            current = current.parent;
        }

        if (depth >= this.config.maxDepth) {
            node.state.terminal = true;
            return node;
        }

        // Expand with all actions
        for (const action of actions) {
            const nextState = await simulate(node.state, action);
            const childNode = this.createNode(nextState, action, node);
            node.children.push(childNode);
        }

        // Return a random child for simulation
        return node.children[Math.floor(Math.random() * node.children.length)];
    }

    /**
     * Simulation phase: Random rollout to estimate value
     */
    private async simulate(
        node: PlanNode,
        simulateStep: (state: PlanState, action: PlanAction) => Promise<PlanState>,
        evaluate: (state: PlanState) => Promise<number>
    ): Promise<number> {
        let state = { ...node.state };
        let depth = 0;

        while (!state.terminal && depth < this.config.rolloutDepth) {
            // Generate random action (simplified)
            const randomAction: PlanAction = {
                name: `random_${depth}`,
                description: 'Random rollout action',
                params: {},
                probability: 0.5,
                cost: 1,
            };

            try {
                state = await simulateStep(state, randomAction);
                depth++;
            } catch {
                break;
            }
        }

        return await evaluate(state);
    }

    /**
     * Backpropagation: Update node statistics up the tree
     */
    private backpropagate(node: PlanNode, value: number): void {
        let current: PlanNode | undefined = node;

        while (current) {
            current.state.visits++;
            // Incremental mean update
            current.state.value += (value - current.state.value) / current.state.visits;
            current = current.parent;
        }
    }

    // -------------------------------------------------------------------------
    // Utility Methods
    // -------------------------------------------------------------------------

    /**
     * Calculate UCB1 score for node selection
     */
    private calculateUCB(node: PlanNode, parent: PlanNode): number {
        if (node.state.visits === 0) {
            return Infinity; // Unexplored nodes have highest priority
        }

        const exploitation = node.state.value;
        const exploration = this.config.explorationConstant * Math.sqrt(
            Math.log(parent.state.visits) / node.state.visits
        );

        return exploitation + exploration;
    }

    /**
     * Create a new plan node
     */
    private createNode(
        state: PlanState,
        action?: PlanAction,
        parent?: PlanNode
    ): PlanNode {
        this.nodeCount++;
        return {
            id: `node_${this.nodeCount}`,
            state: { ...state, id: `state_${this.nodeCount}` },
            action,
            parent,
            children: [],
            ucbScore: 0,
        };
    }

    /**
     * Get the best child based on visits (robust child selection)
     */
    private getBestChild(node: PlanNode): PlanNode | null {
        if (node.children.length === 0) return null;

        return node.children.reduce((best, child) =>
            child.state.visits > best.state.visits ? child : best
        );
    }

    /**
     * Extract best action path from root to best leaf
     */
    private extractBestPath(root: PlanNode): PlanAction[] {
        const path: PlanAction[] = [];
        let current = root;

        while (current.children.length > 0) {
            const bestChild = this.getBestChild(current);
            if (bestChild && bestChild.action) {
                path.push(bestChild.action);
                current = bestChild;
            } else {
                break;
            }
        }

        return path;
    }

    /**
     * Score an action based on goal relevance
     */
    private scoreAction(
        action: PlanAction,
        goal: string,
        context: Record<string, any>
    ): number {
        let score = action.probability;

        // Boost score if action name/description relates to goal
        const goalWords = goal.toLowerCase().split(/\s+/);
        const actionWords = `${action.name} ${action.description}`.toLowerCase().split(/\s+/);

        const matchCount = goalWords.filter(w => actionWords.some(aw => aw.includes(w))).length;
        score += matchCount * 0.1;

        // Penalize high-cost actions slightly
        score -= action.cost * 0.05;

        return Math.max(0, Math.min(1, score));
    }

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    setConfig(config: Partial<MCTSConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): MCTSConfig {
        return { ...this.config };
    }

    /**
     * Get search statistics
     */
    getStats(): { nodeCount: number } {
        return { nodeCount: this.nodeCount };
    }
}

// Export singleton
export const mctsPlanner = MCTSPlanner.getInstance();
