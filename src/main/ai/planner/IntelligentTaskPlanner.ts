/**
 * Intelligent Task Planner
 * 
 * Breaks down complex tasks into actionable steps with
 * dependency management, estimation, and progress tracking.
 */

import { EventEmitter } from 'events';

export interface TaskPlan {
    id: string;
    title: string;
    description: string;
    steps: PlanStep[];
    dependencies: TaskDependency[];
    estimatedTime: number; // minutes
    actualTime?: number;
    status: PlanStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    context?: Record<string, any>;
}

export interface PlanStep {
    id: string;
    title: string;
    description: string;
    type: StepType;
    action?: string;
    estimatedTime: number; // minutes
    actualTime?: number;
    status: StepStatus;
    dependencies: string[]; // step ids
    outputs?: Record<string, any>;
    notes?: string;
}

export type StepType =
    | 'research'
    | 'design'
    | 'implementation'
    | 'testing'
    | 'review'
    | 'documentation'
    | 'deployment'
    | 'manual';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface TaskDependency {
    from: string; // step id
    to: string; // step id
    type: 'blocks' | 'informs';
}

export interface PlanAnalysis {
    complexity: 'simple' | 'moderate' | 'complex';
    riskLevel: 'low' | 'medium' | 'high';
    criticalPath: string[]; // step ids
    parallelizable: string[][]; // groups of parallel steps
    bottlenecks: string[];
    estimatedCompletion: Date;
}

export interface PlanTemplate {
    name: string;
    description: string;
    steps: Omit<PlanStep, 'id' | 'status'>[];
}

// Predefined templates
const PLAN_TEMPLATES: PlanTemplate[] = [
    {
        name: 'Feature Implementation',
        description: 'Standard feature development workflow',
        steps: [
            { title: 'Requirements Analysis', description: 'Understand feature requirements', type: 'research', estimatedTime: 30, dependencies: [] },
            { title: 'Technical Design', description: 'Design the solution architecture', type: 'design', estimatedTime: 45, dependencies: [] },
            { title: 'Implementation', description: 'Write the feature code', type: 'implementation', estimatedTime: 120, dependencies: [] },
            { title: 'Unit Testing', description: 'Write and run unit tests', type: 'testing', estimatedTime: 60, dependencies: [] },
            { title: 'Code Review', description: 'Get code reviewed by peers', type: 'review', estimatedTime: 30, dependencies: [] },
            { title: 'Documentation', description: 'Update documentation', type: 'documentation', estimatedTime: 30, dependencies: [] },
        ],
    },
    {
        name: 'Bug Fix',
        description: 'Standard bug fixing workflow',
        steps: [
            { title: 'Reproduce Bug', description: 'Reproduce and understand the bug', type: 'research', estimatedTime: 15, dependencies: [] },
            { title: 'Root Cause Analysis', description: 'Find the root cause', type: 'research', estimatedTime: 30, dependencies: [] },
            { title: 'Implement Fix', description: 'Code the fix', type: 'implementation', estimatedTime: 45, dependencies: [] },
            { title: 'Test Fix', description: 'Verify the fix works', type: 'testing', estimatedTime: 20, dependencies: [] },
            { title: 'Regression Testing', description: 'Ensure no new bugs', type: 'testing', estimatedTime: 30, dependencies: [] },
        ],
    },
    {
        name: 'API Integration',
        description: 'Integrate with external API',
        steps: [
            { title: 'API Research', description: 'Study API documentation', type: 'research', estimatedTime: 30, dependencies: [] },
            { title: 'Design Integration', description: 'Plan integration approach', type: 'design', estimatedTime: 30, dependencies: [] },
            { title: 'Implement Client', description: 'Build API client', type: 'implementation', estimatedTime: 90, dependencies: [] },
            { title: 'Error Handling', description: 'Add robust error handling', type: 'implementation', estimatedTime: 45, dependencies: [] },
            { title: 'Integration Testing', description: 'Test with real API', type: 'testing', estimatedTime: 45, dependencies: [] },
            { title: 'Document Usage', description: 'Write usage documentation', type: 'documentation', estimatedTime: 30, dependencies: [] },
        ],
    },
];

export class IntelligentTaskPlanner extends EventEmitter {
    private static instance: IntelligentTaskPlanner;
    private plans: Map<string, TaskPlan> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): IntelligentTaskPlanner {
        if (!IntelligentTaskPlanner.instance) {
            IntelligentTaskPlanner.instance = new IntelligentTaskPlanner();
        }
        return IntelligentTaskPlanner.instance;
    }

    // ========================================================================
    // PLAN CREATION
    // ========================================================================

    createPlan(title: string, description: string): TaskPlan {
        const plan: TaskPlan = {
            id: `plan_${Date.now()}`,
            title,
            description,
            steps: [],
            dependencies: [],
            estimatedTime: 0,
            status: 'draft',
            createdAt: new Date(),
        };

        this.plans.set(plan.id, plan);
        this.emit('plan:created', plan);
        return plan;
    }

    createFromTemplate(templateIndex: number, title: string): TaskPlan {
        const template = PLAN_TEMPLATES[templateIndex];
        if (!template) throw new Error('Template not found');

        const plan = this.createPlan(title, template.description);

        let prevStepId: string | null = null;
        for (const stepTemplate of template.steps) {
            const step = this.addStep(plan.id, {
                ...stepTemplate,
                dependencies: prevStepId ? [prevStepId] : [],
            });
            prevStepId = step.id;
        }

        return this.plans.get(plan.id)!;
    }

    async generatePlan(taskDescription: string): Promise<TaskPlan> {
        // AI-powered plan generation (simulated)
        const plan = this.createPlan(
            `Plan: ${taskDescription.slice(0, 50)}`,
            taskDescription
        );

        // Analyze task and generate steps
        const steps = this.analyzeTaskAndGenerateSteps(taskDescription);

        for (const step of steps) {
            this.addStep(plan.id, step);
        }

        // Set up dependencies
        this.autoDetectDependencies(plan.id);

        return this.plans.get(plan.id)!;
    }

    private analyzeTaskAndGenerateSteps(description: string): Omit<PlanStep, 'id' | 'status'>[] {
        const steps: Omit<PlanStep, 'id' | 'status'>[] = [];
        const lower = description.toLowerCase();

        // Add research step if needed
        if (lower.includes('new') || lower.includes('learn') || lower.includes('investigate')) {
            steps.push({
                title: 'Research & Analysis',
                description: 'Research the problem space and gather requirements',
                type: 'research',
                estimatedTime: 30,
                dependencies: [],
            });
        }

        // Add design step for complex tasks
        if (lower.includes('build') || lower.includes('create') || lower.includes('implement')) {
            steps.push({
                title: 'Design Solution',
                description: 'Design the technical approach',
                type: 'design',
                estimatedTime: 45,
                dependencies: [],
            });
        }

        // Add implementation step
        steps.push({
            title: 'Implementation',
            description: 'Implement the solution',
            type: 'implementation',
            estimatedTime: lower.includes('simple') ? 60 : 120,
            dependencies: [],
        });

        // Add testing step
        steps.push({
            title: 'Testing',
            description: 'Test the implementation',
            type: 'testing',
            estimatedTime: 45,
            dependencies: [],
        });

        // Add documentation if mentioned
        if (lower.includes('document') || lower.includes('readme')) {
            steps.push({
                title: 'Documentation',
                description: 'Write documentation',
                type: 'documentation',
                estimatedTime: 30,
                dependencies: [],
            });
        }

        return steps;
    }

    // ========================================================================
    // STEP MANAGEMENT
    // ========================================================================

    addStep(planId: string, step: Omit<PlanStep, 'id' | 'status'>): PlanStep {
        const plan = this.plans.get(planId);
        if (!plan) throw new Error('Plan not found');

        const newStep: PlanStep = {
            ...step,
            id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            status: 'pending',
        };

        plan.steps.push(newStep);
        plan.estimatedTime = this.calculateTotalTime(plan);

        this.emit('step:added', { planId, step: newStep });
        return newStep;
    }

    updateStep(planId: string, stepId: string, updates: Partial<PlanStep>): PlanStep | undefined {
        const plan = this.plans.get(planId);
        if (!plan) return undefined;

        const step = plan.steps.find(s => s.id === stepId);
        if (!step) return undefined;

        Object.assign(step, updates);
        plan.estimatedTime = this.calculateTotalTime(plan);

        this.emit('step:updated', { planId, step });
        return step;
    }

    removeStep(planId: string, stepId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan) return false;

        const index = plan.steps.findIndex(s => s.id === stepId);
        if (index === -1) return false;

        plan.steps.splice(index, 1);
        plan.dependencies = plan.dependencies.filter(d => d.from !== stepId && d.to !== stepId);
        plan.estimatedTime = this.calculateTotalTime(plan);

        this.emit('step:removed', { planId, stepId });
        return true;
    }

    completeStep(planId: string, stepId: string, actualTime?: number): PlanStep | undefined {
        const step = this.updateStep(planId, stepId, {
            status: 'completed',
            actualTime,
        });

        if (step) {
            this.checkPlanCompletion(planId);
        }

        return step;
    }

    private autoDetectDependencies(planId: string): void {
        const plan = this.plans.get(planId);
        if (!plan) return;

        // Simple heuristic: each step depends on the previous one
        for (let i = 1; i < plan.steps.length; i++) {
            plan.dependencies.push({
                from: plan.steps[i - 1].id,
                to: plan.steps[i].id,
                type: 'blocks',
            });
            plan.steps[i].dependencies = [plan.steps[i - 1].id];
        }
    }

    private calculateTotalTime(plan: TaskPlan): number {
        return plan.steps.reduce((total, step) => total + step.estimatedTime, 0);
    }

    private checkPlanCompletion(planId: string): void {
        const plan = this.plans.get(planId);
        if (!plan) return;

        const allCompleted = plan.steps.every(s => s.status === 'completed' || s.status === 'skipped');
        if (allCompleted && plan.status === 'active') {
            plan.status = 'completed';
            plan.completedAt = new Date();
            plan.actualTime = plan.steps.reduce((total, step) => total + (step.actualTime || step.estimatedTime), 0);
            this.emit('plan:completed', plan);
        }
    }

    // ========================================================================
    // PLAN EXECUTION
    // ========================================================================

    startPlan(planId: string): TaskPlan | undefined {
        const plan = this.plans.get(planId);
        if (!plan || plan.status !== 'draft') return undefined;

        plan.status = 'active';
        plan.startedAt = new Date();

        // Start first step
        const firstStep = plan.steps[0];
        if (firstStep) {
            firstStep.status = 'in_progress';
        }

        this.emit('plan:started', plan);
        return plan;
    }

    pausePlan(planId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan || plan.status !== 'active') return false;

        plan.status = 'paused';
        this.emit('plan:paused', plan);
        return true;
    }

    resumePlan(planId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan || plan.status !== 'paused') return false;

        plan.status = 'active';
        this.emit('plan:resumed', plan);
        return true;
    }

    cancelPlan(planId: string): boolean {
        const plan = this.plans.get(planId);
        if (!plan) return false;

        plan.status = 'cancelled';
        this.emit('plan:cancelled', plan);
        return true;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    analyzePlan(planId: string): PlanAnalysis | undefined {
        const plan = this.plans.get(planId);
        if (!plan) return undefined;

        // Calculate complexity
        const complexity =
            plan.steps.length <= 3 ? 'simple' :
                plan.steps.length <= 7 ? 'moderate' : 'complex';

        // Find critical path (longest chain of dependencies)
        const criticalPath = this.findCriticalPath(plan);

        // Find parallelizable steps
        const parallelizable = this.findParallelSteps(plan);

        // Identify bottlenecks (steps with many dependents)
        const bottlenecks = this.findBottlenecks(plan);

        // Estimate completion time
        const estimatedCompletion = new Date(Date.now() + plan.estimatedTime * 60 * 1000);

        return {
            complexity,
            riskLevel: complexity === 'complex' ? 'high' : complexity === 'moderate' ? 'medium' : 'low',
            criticalPath,
            parallelizable,
            bottlenecks,
            estimatedCompletion,
        };
    }

    private findCriticalPath(plan: TaskPlan): string[] {
        // Simple implementation: return all steps in order
        return plan.steps.map(s => s.id);
    }

    private findParallelSteps(plan: TaskPlan): string[][] {
        // Find steps with no dependencies on each other
        const groups: string[][] = [];
        const processed = new Set<string>();

        for (const step of plan.steps) {
            if (processed.has(step.id)) continue;

            const parallel = [step.id];
            processed.add(step.id);

            // Find other steps at same "level"
            for (const other of plan.steps) {
                if (processed.has(other.id)) continue;
                if (step.dependencies.length === other.dependencies.length &&
                    step.dependencies.every(d => other.dependencies.includes(d))) {
                    parallel.push(other.id);
                    processed.add(other.id);
                }
            }

            if (parallel.length > 1) {
                groups.push(parallel);
            }
        }

        return groups;
    }

    private findBottlenecks(plan: TaskPlan): string[] {
        const dependentCount = new Map<string, number>();

        for (const step of plan.steps) {
            for (const depId of step.dependencies) {
                dependentCount.set(depId, (dependentCount.get(depId) || 0) + 1);
            }
        }

        // Steps that block 3+ other steps
        return Array.from(dependentCount.entries())
            .filter(([_, count]) => count >= 3)
            .map(([id]) => id);
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getPlan(id: string): TaskPlan | undefined {
        return this.plans.get(id);
    }

    getAllPlans(): TaskPlan[] {
        return Array.from(this.plans.values());
    }

    getActivePlans(): TaskPlan[] {
        return Array.from(this.plans.values()).filter(p => p.status === 'active');
    }

    getTemplates(): PlanTemplate[] {
        return [...PLAN_TEMPLATES];
    }

    getProgress(planId: string): { completed: number; total: number; percentage: number } {
        const plan = this.plans.get(planId);
        if (!plan) return { completed: 0, total: 0, percentage: 0 };

        const completed = plan.steps.filter(s => s.status === 'completed').length;
        const total = plan.steps.length;

        return {
            completed,
            total,
            percentage: total > 0 ? (completed / total) * 100 : 0,
        };
    }

    deletePlan(id: string): boolean {
        const deleted = this.plans.delete(id);
        if (deleted) {
            this.emit('plan:deleted', id);
        }
        return deleted;
    }
}

export const intelligentTaskPlanner = IntelligentTaskPlanner.getInstance();
