/**
 * HTNPlanner - Hierarchical Task Network Planner
 * 
 * Provides structured task decomposition and planning:
 * - Hierarchical decomposition of goals into subtasks
 * - Dependency-aware execution ordering
 * - Precondition and effect tracking
 * - Plan verification before execution
 * - Rollback mechanism for failures
 * 
 * Based on classical HTN planning with adaptations for AI agent tasks
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface WorldState {
    facts: Map<string, any>;
}

export interface Condition {
    type: 'fact' | 'comparison' | 'custom';
    key: string;
    operator?: '==' | '!=' | '>' | '<' | '>=' | '<=';
    value?: any;
    fn?: (state: WorldState) => boolean;
}

export interface Effect {
    type: 'set' | 'delete' | 'increment';
    key: string;
    value?: any;
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    type: 'primitive' | 'compound';
    /** Conditions that must be true before execution */
    preconditions: Condition[];
    /** Effects on world state after execution */
    effects: Effect[];
    /** Subtasks (for compound tasks) */
    subtasks: Task[];
    /** Agent responsible for execution */
    assignedAgent?: string;
    /** Execution status */
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    /** Execution result */
    result?: any;
    /** Error if failed */
    error?: string;
    /** Priority (lower = higher priority) */
    priority: number;
    /** Estimated duration in ms */
    estimatedDuration?: number;
    /** Actual duration in ms */
    actualDuration?: number;
    /** Dependencies (task IDs that must complete first) */
    dependencies: string[];
}

export interface Plan {
    id: string;
    goal: string;
    goalDescription?: string;
    rootTask: Task;
    /** Flattened execution order (primitive tasks only) */
    executionOrder: string[];
    /** Current world state */
    state: WorldState;
    /** Plan status */
    status: 'planning' | 'ready' | 'executing' | 'completed' | 'failed' | 'rolled-back';
    /** Checkpoint for rollback */
    stateSnapshots: WorldState[];
    /** Creation timestamp */
    createdAt: Date;
    /** Completion timestamp */
    completedAt?: Date;
}

export interface TaskMethod {
    name: string;
    /** Conditions for this method to apply */
    applicability: Condition[];
    /** How to decompose the task */
    decompose: (task: Task, state: WorldState) => Task[];
}

// ============================================================================
// DOMAIN KNOWLEDGE
// ============================================================================

const TASK_METHODS: Map<string, TaskMethod[]> = new Map();

// Register built-in task decomposition methods
function registerMethod(taskName: string, method: TaskMethod): void {
    const existing = TASK_METHODS.get(taskName) || [];
    existing.push(method);
    TASK_METHODS.set(taskName, existing);
}

// Built-in methods for common development tasks
registerMethod('implement_feature', {
    name: 'standard_feature_implementation',
    applicability: [],
    decompose: (task, state) => [
        createTask('analyze_requirements', 'primitive', [], ['design_architecture']),
        createTask('design_architecture', 'primitive', ['analyze_requirements'], ['write_code']),
        createTask('write_code', 'primitive', ['design_architecture'], ['write_tests']),
        createTask('write_tests', 'primitive', ['write_code'], ['verify_implementation']),
        createTask('verify_implementation', 'primitive', ['write_tests'], [])
    ]
});

registerMethod('fix_bug', {
    name: 'standard_bug_fix',
    applicability: [],
    decompose: (task, state) => [
        createTask('reproduce_bug', 'primitive', [], ['analyze_root_cause']),
        createTask('analyze_root_cause', 'primitive', ['reproduce_bug'], ['implement_fix']),
        createTask('implement_fix', 'primitive', ['analyze_root_cause'], ['add_regression_test']),
        createTask('add_regression_test', 'primitive', ['implement_fix'], ['verify_fix']),
        createTask('verify_fix', 'primitive', ['add_regression_test'], [])
    ]
});

registerMethod('refactor_code', {
    name: 'safe_refactoring',
    applicability: [],
    decompose: (task, state) => [
        createTask('ensure_test_coverage', 'primitive', [], ['identify_changes']),
        createTask('identify_changes', 'primitive', ['ensure_test_coverage'], ['apply_refactoring']),
        createTask('apply_refactoring', 'primitive', ['identify_changes'], ['run_tests']),
        createTask('run_tests', 'primitive', ['apply_refactoring'], ['update_documentation']),
        createTask('update_documentation', 'primitive', ['run_tests'], [])
    ]
});

registerMethod('investigate_issue', {
    name: 'systematic_investigation',
    applicability: [],
    decompose: (task, state) => [
        createTask('gather_information', 'primitive', [], ['form_hypothesis']),
        createTask('form_hypothesis', 'primitive', ['gather_information'], ['test_hypothesis']),
        createTask('test_hypothesis', 'primitive', ['form_hypothesis'], ['document_findings']),
        createTask('document_findings', 'primitive', ['test_hypothesis'], [])
    ]
});

// Helper to create tasks
function createTask(
    name: string,
    type: 'primitive' | 'compound',
    dependencies: string[] = [],
    requiredFor: string[] = []
): Task {
    return {
        id: `task-${name}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        type,
        preconditions: [],
        effects: [],
        subtasks: [],
        status: 'pending',
        priority: 0,
        dependencies
    };
}

// ============================================================================
// HTN PLANNER CLASS
// ============================================================================

export class HTNPlanner extends EventEmitter {
    private plans: Map<string, Plan> = new Map();
    private executingPlan: Plan | null = null;
    private taskExecutors: Map<string, (task: Task, state: WorldState) => Promise<any>> = new Map();

    constructor() {
        super();
        console.log('[HTNPlanner] Initialized with', TASK_METHODS.size, 'task methods');
    }

    /**
     * Create a plan for a goal
     */
    createPlan(goal: string, description?: string): Plan {
        const plan: Plan = {
            id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            goal,
            goalDescription: description,
            rootTask: {
                id: `root-${Date.now()}`,
                name: goal,
                type: 'compound',
                preconditions: [],
                effects: [],
                subtasks: [],
                status: 'pending',
                priority: 0,
                dependencies: []
            },
            executionOrder: [],
            state: { facts: new Map() },
            status: 'planning',
            stateSnapshots: [],
            createdAt: new Date()
        };

        // Decompose the goal into subtasks
        this.decomposeTask(plan.rootTask, plan.state);

        // Flatten into execution order
        plan.executionOrder = this.flattenTasks(plan.rootTask);

        plan.status = 'ready';
        this.plans.set(plan.id, plan);

        this.emit('planCreated', plan);
        console.log(`[HTNPlanner] Created plan ${plan.id} with ${plan.executionOrder.length} steps`);

        return plan;
    }

    /**
     * Decompose a compound task into subtasks
     */
    private decomposeTask(task: Task, state: WorldState): void {
        if (task.type === 'primitive') return;

        const methods = TASK_METHODS.get(task.name) || [];

        // Find applicable method
        for (const method of methods) {
            if (this.checkConditions(method.applicability, state)) {
                task.subtasks = method.decompose(task, state);

                // Recursively decompose subtasks
                for (const subtask of task.subtasks) {
                    this.decomposeTask(subtask, state);
                }
                return;
            }
        }

        // If no method found, create a generic primitive task
        task.type = 'primitive';
        console.log(`[HTNPlanner] No method found for "${task.name}", treating as primitive`);
    }

    /**
     * Flatten task hierarchy into execution order
     */
    private flattenTasks(task: Task): string[] {
        const result: string[] = [];

        if (task.type === 'primitive') {
            result.push(task.id);
        } else {
            // Topological sort of subtasks based on dependencies
            const sorted = this.topologicalSort(task.subtasks);
            for (const subtask of sorted) {
                result.push(...this.flattenTasks(subtask));
            }
        }

        return result;
    }

    /**
     * Topological sort of tasks based on dependencies
     */
    private topologicalSort(tasks: Task[]): Task[] {
        const sorted: Task[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();

        const visit = (task: Task): void => {
            if (visited.has(task.id)) return;
            if (visiting.has(task.id)) {
                throw new Error(`Circular dependency detected at task ${task.name}`);
            }

            visiting.add(task.id);

            // Visit dependencies first
            for (const depId of task.dependencies) {
                const dep = tasks.find(t => t.id === depId || t.name === depId);
                if (dep) visit(dep);
            }

            visiting.delete(task.id);
            visited.add(task.id);
            sorted.push(task);
        };

        for (const task of tasks) {
            visit(task);
        }

        return sorted;
    }

    /**
     * Check if conditions are satisfied
     */
    private checkConditions(conditions: Condition[], state: WorldState): boolean {
        for (const cond of conditions) {
            if (!this.evaluateCondition(cond, state)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Evaluate a single condition
     */
    private evaluateCondition(condition: Condition, state: WorldState): boolean {
        switch (condition.type) {
            case 'fact':
                return state.facts.has(condition.key);
            case 'comparison':
                const value = state.facts.get(condition.key);
                switch (condition.operator) {
                    case '==': return value === condition.value;
                    case '!=': return value !== condition.value;
                    case '>': return value > condition.value;
                    case '<': return value < condition.value;
                    case '>=': return value >= condition.value;
                    case '<=': return value <= condition.value;
                    default: return false;
                }
            case 'custom':
                return condition.fn ? condition.fn(state) : false;
            default:
                return false;
        }
    }

    /**
     * Apply effects to world state
     */
    private applyEffects(effects: Effect[], state: WorldState): void {
        for (const effect of effects) {
            switch (effect.type) {
                case 'set':
                    state.facts.set(effect.key, effect.value);
                    break;
                case 'delete':
                    state.facts.delete(effect.key);
                    break;
                case 'increment':
                    const current = state.facts.get(effect.key) || 0;
                    state.facts.set(effect.key, current + (effect.value || 1));
                    break;
            }
        }
    }

    /**
     * Register a task executor
     */
    registerExecutor(
        taskName: string,
        executor: (task: Task, state: WorldState) => Promise<any>
    ): void {
        this.taskExecutors.set(taskName, executor);
    }

    /**
     * Execute a plan
     */
    async executePlan(planId: string): Promise<boolean> {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }

        if (plan.status !== 'ready') {
            throw new Error(`Plan ${planId} is not ready (status: ${plan.status})`);
        }

        this.executingPlan = plan;
        plan.status = 'executing';

        // Create initial state snapshot
        plan.stateSnapshots.push(this.cloneState(plan.state));

        const allTasks = this.getAllTasks(plan.rootTask);
        const taskMap = new Map(allTasks.map(t => [t.id, t]));

        try {
            for (const taskId of plan.executionOrder) {
                const task = taskMap.get(taskId);
                if (!task) continue;

                // Check preconditions
                if (!this.checkConditions(task.preconditions, plan.state)) {
                    task.status = 'skipped';
                    task.error = 'Preconditions not met';
                    this.emit('taskSkipped', { planId, task });
                    continue;
                }

                task.status = 'running';
                this.emit('taskStarted', { planId, task });

                const startTime = Date.now();

                try {
                    // Execute task
                    const executor = this.taskExecutors.get(task.name);
                    if (executor) {
                        task.result = await executor(task, plan.state);
                    } else {
                        // Default: just mark as done
                        task.result = { message: `Task ${task.name} completed (no executor)` };
                    }

                    task.status = 'completed';
                    task.actualDuration = Date.now() - startTime;

                    // Apply effects
                    this.applyEffects(task.effects, plan.state);

                    // Snapshot state after each task
                    plan.stateSnapshots.push(this.cloneState(plan.state));

                    this.emit('taskCompleted', { planId, task });

                } catch (error: any) {
                    task.status = 'failed';
                    task.error = error.message;
                    task.actualDuration = Date.now() - startTime;

                    this.emit('taskFailed', { planId, task, error });

                    // Attempt recovery or fail plan
                    plan.status = 'failed';
                    this.emit('planFailed', { plan, failedTask: task });

                    return false;
                }
            }

            plan.status = 'completed';
            plan.completedAt = new Date();
            this.emit('planCompleted', plan);

            return true;

        } finally {
            this.executingPlan = null;
        }
    }

    /**
     * Rollback a failed plan to previous state
     */
    rollbackPlan(planId: string, toSnapshot?: number): boolean {
        const plan = this.plans.get(planId);
        if (!plan) return false;

        const snapshotIndex = toSnapshot ?? 0;
        if (snapshotIndex >= plan.stateSnapshots.length) return false;

        plan.state = this.cloneState(plan.stateSnapshots[snapshotIndex]);
        plan.status = 'rolled-back';

        // Reset task statuses
        const allTasks = this.getAllTasks(plan.rootTask);
        for (const task of allTasks) {
            task.status = 'pending';
            task.result = undefined;
            task.error = undefined;
        }

        this.emit('planRolledBack', { plan, toSnapshot: snapshotIndex });
        console.log(`[HTNPlanner] Rolled back plan ${planId} to snapshot ${snapshotIndex}`);

        return true;
    }

    /**
     * Get all tasks from task hierarchy
     */
    private getAllTasks(task: Task): Task[] {
        const result: Task[] = [task];
        for (const subtask of task.subtasks) {
            result.push(...this.getAllTasks(subtask));
        }
        return result;
    }

    /**
     * Clone world state for snapshots
     */
    private cloneState(state: WorldState): WorldState {
        return {
            facts: new Map(state.facts)
        };
    }

    /**
     * Verify plan is valid before execution
     */
    verifyPlan(planId: string): { valid: boolean; issues: string[] } {
        const plan = this.plans.get(planId);
        if (!plan) {
            return { valid: false, issues: ['Plan not found'] };
        }

        const issues: string[] = [];
        const allTasks = this.getAllTasks(plan.rootTask);
        const taskIds = new Set(allTasks.map(t => t.id));

        // Check for missing dependencies
        for (const task of allTasks) {
            for (const depId of task.dependencies) {
                const depExists = allTasks.some(t => t.id === depId || t.name === depId);
                if (!depExists) {
                    issues.push(`Task "${task.name}" has missing dependency: ${depId}`);
                }
            }
        }

        // Check for circular dependencies
        try {
            this.topologicalSort(allTasks);
        } catch (error: any) {
            issues.push(error.message);
        }

        // Check for missing executors
        const primitives = allTasks.filter(t => t.type === 'primitive');
        for (const task of primitives) {
            if (!this.taskExecutors.has(task.name)) {
                issues.push(`No executor registered for task "${task.name}"`);
            }
        }

        return { valid: issues.length === 0, issues };
    }

    /**
     * Get plan by ID
     */
    getPlan(planId: string): Plan | undefined {
        return this.plans.get(planId);
    }

    /**
     * Get all plans
     */
    getAllPlans(): Plan[] {
        return Array.from(this.plans.values());
    }

    /**
     * Delete a plan
     */
    deletePlan(planId: string): boolean {
        return this.plans.delete(planId);
    }

    /**
     * Register custom decomposition method
     */
    registerMethod(taskName: string, method: TaskMethod): void {
        registerMethod(taskName, method);
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalPlans: number;
        completedPlans: number;
        failedPlans: number;
        registeredMethods: number;
        registeredExecutors: number;
    } {
        const plans = Array.from(this.plans.values());
        return {
            totalPlans: plans.length,
            completedPlans: plans.filter(p => p.status === 'completed').length,
            failedPlans: plans.filter(p => p.status === 'failed').length,
            registeredMethods: TASK_METHODS.size,
            registeredExecutors: this.taskExecutors.size
        };
    }
}

// Singleton
export const htnPlanner = new HTNPlanner();
