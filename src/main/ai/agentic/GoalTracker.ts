/**
 * Goal Tracker
 * 
 * Tracks hierarchical goals and sub-goals with success/failure evaluation
 * and progress monitoring.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type GoalStatus =
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'blocked'
    | 'cancelled';

export type GoalPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Goal {
    id: string;
    description: string;
    successCriteria: string[];
    status: GoalStatus;
    priority: GoalPriority;
    progress: number; // 0-100
    parentId?: string;
    subGoals: Goal[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    metadata: Record<string, any>;
    checkpoints: GoalCheckpoint[];
}

export interface GoalCheckpoint {
    id: string;
    description: string;
    reached: boolean;
    reachedAt?: Date;
    data?: any;
}

export interface GoalProgress {
    goalId: string;
    progress: number;
    currentCheckpoint?: string;
    remainingSteps: number;
    estimatedCompletion?: Date;
}

// ============================================================================
// GOAL TRACKER
// ============================================================================

export class GoalTracker extends EventEmitter {
    private static instance: GoalTracker;
    private goals: Map<string, Goal> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): GoalTracker {
        if (!GoalTracker.instance) {
            GoalTracker.instance = new GoalTracker();
        }
        return GoalTracker.instance;
    }

    // ========================================================================
    // GOAL MANAGEMENT
    // ========================================================================

    /**
     * Create a new goal
     */
    createGoal(
        description: string,
        successCriteria: string[],
        priority: GoalPriority = 'medium',
        parentId?: string
    ): string {
        const goal: Goal = {
            id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description,
            successCriteria,
            status: 'pending',
            priority,
            progress: 0,
            parentId,
            subGoals: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {},
            checkpoints: []
        };

        this.goals.set(goal.id, goal);

        // Link to parent if exists
        if (parentId) {
            const parent = this.goals.get(parentId);
            if (parent) {
                parent.subGoals.push(goal);
                this.updateGoalProgress(parentId);
            }
        }

        this.emit('goal:created', goal);
        console.log(`🎯 Goal created: ${goal.id} - ${description.substring(0, 50)}...`);

        return goal.id;
    }

    /**
     * Update goal status
     */
    updateGoal(goalId: string, status: GoalStatus, metadata?: Record<string, any>): void {
        const goal = this.goals.get(goalId);
        if (!goal) return;

        goal.status = status;
        goal.updatedAt = new Date();

        if (status === 'completed') {
            goal.progress = 100;
            goal.completedAt = new Date();
        } else if (status === 'failed' || status === 'cancelled') {
            goal.completedAt = new Date();
        }

        if (metadata) {
            goal.metadata = { ...goal.metadata, ...metadata };
        }

        // Update parent progress
        if (goal.parentId) {
            this.updateGoalProgress(goal.parentId);
        }

        this.emit('goal:updated', goal);
    }

    /**
     * Update goal progress
     */
    setProgress(goalId: string, progress: number): void {
        const goal = this.goals.get(goalId);
        if (!goal) return;

        goal.progress = Math.min(100, Math.max(0, progress));
        goal.updatedAt = new Date();

        if (goal.progress === 100 && goal.status !== 'completed') {
            goal.status = 'in_progress'; // Will be marked completed after validation
        }

        // Update parent progress
        if (goal.parentId) {
            this.updateGoalProgress(goal.parentId);
        }

        this.emit('goal:progress', { goalId, progress: goal.progress });
    }

    /**
     * Recursively update parent goal progress based on sub-goals
     */
    private updateGoalProgress(goalId: string): void {
        const goal = this.goals.get(goalId);
        if (!goal || goal.subGoals.length === 0) return;

        const totalProgress = goal.subGoals.reduce((sum, sg) => sum + sg.progress, 0);
        goal.progress = Math.round(totalProgress / goal.subGoals.length);
        goal.updatedAt = new Date();

        // Check if all sub-goals are completed
        const allCompleted = goal.subGoals.every(sg => sg.status === 'completed');
        if (allCompleted && goal.status !== 'completed') {
            goal.status = 'completed';
            goal.completedAt = new Date();
            this.emit('goal:completed', goal);
        }

        // Recursively update parent
        if (goal.parentId) {
            this.updateGoalProgress(goal.parentId);
        }
    }

    // ========================================================================
    // CHECKPOINTS
    // ========================================================================

    /**
     * Add a checkpoint to a goal
     */
    addCheckpoint(goalId: string, description: string): string {
        const goal = this.goals.get(goalId);
        if (!goal) throw new Error(`Goal ${goalId} not found`);

        const checkpoint: GoalCheckpoint = {
            id: `cp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            description,
            reached: false
        };

        goal.checkpoints.push(checkpoint);
        goal.updatedAt = new Date();

        return checkpoint.id;
    }

    /**
     * Mark a checkpoint as reached
     */
    reachCheckpoint(goalId: string, checkpointId: string, data?: any): void {
        const goal = this.goals.get(goalId);
        if (!goal) return;

        const checkpoint = goal.checkpoints.find(cp => cp.id === checkpointId);
        if (checkpoint) {
            checkpoint.reached = true;
            checkpoint.reachedAt = new Date();
            checkpoint.data = data;

            // Update progress based on checkpoints
            const reachedCount = goal.checkpoints.filter(cp => cp.reached).length;
            const progress = (reachedCount / goal.checkpoints.length) * 100;
            this.setProgress(goalId, progress);

            this.emit('checkpoint:reached', { goalId, checkpoint });
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    /**
     * Get a goal by ID
     */
    getGoal(goalId: string): Goal | undefined {
        return this.goals.get(goalId);
    }

    /**
     * Get all goals
     */
    getAllGoals(): Goal[] {
        return Array.from(this.goals.values());
    }

    /**
     * Get root goals (no parent)
     */
    getRootGoals(): Goal[] {
        return Array.from(this.goals.values()).filter(g => !g.parentId);
    }

    /**
     * Get goals by status
     */
    getGoalsByStatus(status: GoalStatus): Goal[] {
        return Array.from(this.goals.values()).filter(g => g.status === status);
    }

    /**
     * Get active goals (pending or in_progress)
     */
    getActiveGoals(): Goal[] {
        return Array.from(this.goals.values()).filter(
            g => g.status === 'pending' || g.status === 'in_progress'
        );
    }

    /**
     * Get goal hierarchy as tree
     */
    getGoalTree(goalId: string): Goal | undefined {
        return this.goals.get(goalId);
    }

    /**
     * Get goal progress summary
     */
    getProgress(goalId: string): GoalProgress | null {
        const goal = this.goals.get(goalId);
        if (!goal) return null;

        const unreachedCheckpoints = goal.checkpoints.filter(cp => !cp.reached);

        return {
            goalId,
            progress: goal.progress,
            currentCheckpoint: unreachedCheckpoints[0]?.description,
            remainingSteps: unreachedCheckpoints.length
        };
    }

    // ========================================================================
    // EVALUATION
    // ========================================================================

    /**
     * Evaluate if goal success criteria are met
     */
    async evaluateGoal(goalId: string, results: any): Promise<{
        success: boolean;
        criteriaResults: { criterion: string; met: boolean; reason: string }[];
    }> {
        const goal = this.goals.get(goalId);
        if (!goal) {
            return { success: false, criteriaResults: [] };
        }

        const criteriaResults = goal.successCriteria.map(criterion => {
            // Simple evaluation - can be enhanced with AI
            const met = this.evaluateCriterion(criterion, results);
            return {
                criterion,
                met,
                reason: met ? 'Criterion appears to be satisfied' : 'Criterion not met'
            };
        });

        const success = criteriaResults.every(cr => cr.met);

        if (success) {
            this.updateGoal(goalId, 'completed');
        }

        return { success, criteriaResults };
    }

    private evaluateCriterion(criterion: string, results: any): boolean {
        // Simple keyword-based evaluation
        // In production, this would use AI for semantic evaluation
        const resultStr = JSON.stringify(results).toLowerCase();
        const criterionWords = criterion.toLowerCase().split(' ').filter(w => w.length > 3);

        const matchCount = criterionWords.filter(word => resultStr.includes(word)).length;
        return matchCount >= criterionWords.length * 0.5;
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Remove a goal and its sub-goals
     */
    removeGoal(goalId: string): void {
        const goal = this.goals.get(goalId);
        if (!goal) return;

        // Remove sub-goals first
        for (const subGoal of goal.subGoals) {
            this.removeGoal(subGoal.id);
        }

        // Remove from parent's subGoals array
        if (goal.parentId) {
            const parent = this.goals.get(goal.parentId);
            if (parent) {
                parent.subGoals = parent.subGoals.filter(sg => sg.id !== goalId);
            }
        }

        this.goals.delete(goalId);
        this.emit('goal:removed', goalId);
    }

    /**
     * Clear all goals
     */
    clearAllGoals(): void {
        this.goals.clear();
        this.emit('goals:cleared');
    }

    // ========================================================================
    // STATS
    // ========================================================================

    getStats() {
        const goals = Array.from(this.goals.values());
        return {
            total: goals.length,
            pending: goals.filter(g => g.status === 'pending').length,
            inProgress: goals.filter(g => g.status === 'in_progress').length,
            completed: goals.filter(g => g.status === 'completed').length,
            failed: goals.filter(g => g.status === 'failed').length,
            avgProgress: goals.length > 0
                ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
                : 0
        };
    }
}

// Export singleton
export const goalTracker = GoalTracker.getInstance();
