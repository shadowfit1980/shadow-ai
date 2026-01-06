/**
 * Plan/Act Controller
 * 
 * Implements explicit planning and execution phases for agentic workflows.
 * Inspired by Cursor's Agent Mode and Cline's Plan/Act system.
 * 
 * Plan Mode: AI analyzes, plans, and awaits approval
 * Act Mode: AI executes approved plan with user oversight
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export type AgentMode = 'plan' | 'act' | 'idle';

export interface PlanStep {
    id: string;
    description: string;
    type: 'file_edit' | 'file_create' | 'file_delete' | 'terminal' | 'analysis' | 'test';
    target?: string; // File path or command
    details: string;
    estimated_impact: 'low' | 'medium' | 'high';
    requires_approval: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
    result?: string;
    error?: string;
}

export interface ExecutionPlan {
    id: string;
    task: string;
    context: string;
    steps: PlanStep[];
    status: 'draft' | 'awaiting_approval' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';
    createdAt: Date;
    approvedAt?: Date;
    completedAt?: Date;
    rationale: string;
    risks: string[];
    rollbackSteps: string[];
}

export interface PlanActConfig {
    autoApproveThreshold: 'none' | 'low' | 'medium' | 'all';
    requireApprovalForDestructive: boolean;
    maxStepsWithoutApproval: number;
    showRationale: boolean;
}

// ============================================================================
// PLAN/ACT CONTROLLER
// ============================================================================

export class PlanActController extends EventEmitter {
    private static instance: PlanActController;
    private modelManager: ModelManager;

    private currentMode: AgentMode = 'idle';
    private currentPlan: ExecutionPlan | null = null;
    private planHistory: ExecutionPlan[] = [];
    private config: PlanActConfig = {
        autoApproveThreshold: 'none',
        requireApprovalForDestructive: true,
        maxStepsWithoutApproval: 5,
        showRationale: true,
    };

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): PlanActController {
        if (!PlanActController.instance) {
            PlanActController.instance = new PlanActController();
        }
        return PlanActController.instance;
    }

    // ========================================================================
    // MODE MANAGEMENT
    // ========================================================================

    /**
     * Get current agent mode
     */
    getMode(): AgentMode {
        return this.currentMode;
    }

    /**
     * Switch to Plan mode - AI analyzes and proposes changes
     */
    async enterPlanMode(task: string, context: Record<string, any> = {}): Promise<ExecutionPlan> {
        this.currentMode = 'plan';
        this.emit('mode:changed', { mode: 'plan', task });

        const plan = await this.generatePlan(task, context);
        this.currentPlan = plan;

        this.emit('plan:generated', plan);
        return plan;
    }

    /**
     * Switch to Act mode - Execute approved plan
     */
    async enterActMode(): Promise<void> {
        if (!this.currentPlan) {
            throw new Error('No plan to execute. Generate a plan first.');
        }

        if (this.currentPlan.status !== 'approved') {
            throw new Error('Plan must be approved before execution.');
        }

        this.currentMode = 'act';
        this.emit('mode:changed', { mode: 'act', planId: this.currentPlan.id });
    }

    /**
     * Exit to idle mode
     */
    exitToIdle(): void {
        this.currentMode = 'idle';
        this.emit('mode:changed', { mode: 'idle' });
    }

    // ========================================================================
    // PLAN GENERATION
    // ========================================================================

    /**
     * Generate an execution plan for a task
     */
    private async generatePlan(task: string, context: Record<string, any>): Promise<ExecutionPlan> {
        const planId = `plan_${Date.now()}`;

        const prompt = `You are an AI coding agent in PLAN mode. Analyze the task and create a detailed execution plan.

TASK: ${task}

CONTEXT:
${JSON.stringify(context, null, 2)}

Generate a comprehensive plan with:
1. Step-by-step actions needed
2. Files to modify/create/delete
3. Commands to run
4. Potential risks
5. Rollback steps if something goes wrong

Respond in JSON:
\`\`\`json
{
    "rationale": "Why this approach is best",
    "steps": [
        {
            "id": "step_1",
            "description": "What this step does",
            "type": "file_edit|file_create|file_delete|terminal|analysis|test",
            "target": "path/to/file or command",
            "details": "Detailed description of changes",
            "estimated_impact": "low|medium|high",
            "requires_approval": true/false
        }
    ],
    "risks": ["potential issues"],
    "rollbackSteps": ["how to undo if needed"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        const plan: ExecutionPlan = {
            id: planId,
            task,
            context: JSON.stringify(context),
            steps: (parsed.steps || []).map((s: any, idx: number) => ({
                ...s,
                id: s.id || `step_${idx + 1}`,
                status: 'pending',
                requires_approval: s.requires_approval ?? this.shouldRequireApproval(s),
            })),
            status: 'awaiting_approval',
            createdAt: new Date(),
            rationale: parsed.rationale || '',
            risks: parsed.risks || [],
            rollbackSteps: parsed.rollbackSteps || [],
        };

        return plan;
    }

    /**
     * Determine if a step requires approval based on config
     */
    private shouldRequireApproval(step: Partial<PlanStep>): boolean {
        // Destructive operations always require approval if configured
        if (this.config.requireApprovalForDestructive) {
            if (step.type === 'file_delete') return true;
            if (step.type === 'terminal' && this.isDestructiveCommand(step.target || '')) {
                return true;
            }
        }

        // Check impact level against auto-approve threshold
        const impactMap = { 'low': 1, 'medium': 2, 'high': 3 };
        const thresholdMap = { 'none': 0, 'low': 1, 'medium': 2, 'all': 4 };

        const impact = impactMap[step.estimated_impact || 'high'];
        const threshold = thresholdMap[this.config.autoApproveThreshold];

        return impact > threshold;
    }

    private isDestructiveCommand(command: string): boolean {
        const destructive = ['rm ', 'rm -rf', 'drop ', 'delete ', 'truncate ', 'format '];
        return destructive.some(d => command.toLowerCase().includes(d));
    }

    // ========================================================================
    // PLAN APPROVAL
    // ========================================================================

    /**
     * Approve the entire plan
     */
    approvePlan(): void {
        if (!this.currentPlan) throw new Error('No plan to approve');

        this.currentPlan.status = 'approved';
        this.currentPlan.approvedAt = new Date();
        this.currentPlan.steps.forEach(s => {
            if (s.status === 'pending') s.status = 'approved';
        });

        this.emit('plan:approved', this.currentPlan);
    }

    /**
     * Approve a specific step
     */
    approveStep(stepId: string): void {
        if (!this.currentPlan) throw new Error('No plan');

        const step = this.currentPlan.steps.find(s => s.id === stepId);
        if (!step) throw new Error(`Step ${stepId} not found`);

        step.status = 'approved';
        this.emit('step:approved', { planId: this.currentPlan.id, step });
    }

    /**
     * Reject a specific step
     */
    rejectStep(stepId: string, reason: string): void {
        if (!this.currentPlan) throw new Error('No plan');

        const step = this.currentPlan.steps.find(s => s.id === stepId);
        if (!step) throw new Error(`Step ${stepId} not found`);

        step.status = 'rejected';
        step.error = reason;
        this.emit('step:rejected', { planId: this.currentPlan.id, step, reason });
    }

    /**
     * Reject and cancel the entire plan
     */
    rejectPlan(reason: string): void {
        if (!this.currentPlan) throw new Error('No plan to reject');

        this.currentPlan.status = 'cancelled';
        this.planHistory.push(this.currentPlan);

        const rejectedPlan = this.currentPlan;
        this.currentPlan = null;
        this.currentMode = 'idle';

        this.emit('plan:rejected', { plan: rejectedPlan, reason });
    }

    // ========================================================================
    // PLAN EXECUTION
    // ========================================================================

    /**
     * Execute the current approved plan
     */
    async executePlan(executor: (step: PlanStep) => Promise<void>): Promise<{
        success: boolean;
        completedSteps: PlanStep[];
        failedStep?: PlanStep;
    }> {
        if (!this.currentPlan || this.currentPlan.status !== 'approved') {
            throw new Error('No approved plan to execute');
        }

        this.currentPlan.status = 'executing';
        this.emit('plan:started', this.currentPlan);

        const completedSteps: PlanStep[] = [];

        for (const step of this.currentPlan.steps) {
            if (step.status === 'rejected') continue;
            if (step.status !== 'approved') continue;

            step.status = 'executing';
            this.emit('step:started', step);

            try {
                await executor(step);
                step.status = 'completed';
                completedSteps.push(step);
                this.emit('step:completed', step);
            } catch (error: any) {
                step.status = 'failed';
                step.error = error.message;
                this.currentPlan.status = 'failed';

                this.emit('step:failed', { step, error: error.message });
                this.emit('plan:failed', { plan: this.currentPlan, failedStep: step });

                return { success: false, completedSteps, failedStep: step };
            }
        }

        this.currentPlan.status = 'completed';
        this.currentPlan.completedAt = new Date();
        this.planHistory.push(this.currentPlan);

        this.emit('plan:completed', this.currentPlan);

        return { success: true, completedSteps };
    }

    // ========================================================================
    // PLAN QUERIES
    // ========================================================================

    /**
     * Get current plan
     */
    getCurrentPlan(): ExecutionPlan | null {
        return this.currentPlan;
    }

    /**
     * Get plan history
     */
    getPlanHistory(): ExecutionPlan[] {
        return [...this.planHistory];
    }

    /**
     * Get pending approval steps
     */
    getPendingApprovalSteps(): PlanStep[] {
        if (!this.currentPlan) return [];
        return this.currentPlan.steps.filter(s =>
            s.status === 'pending' && s.requires_approval
        );
    }

    /**
     * Format plan for display
     */
    formatPlanForDisplay(): string {
        if (!this.currentPlan) return 'No active plan';

        const lines = [
            `📋 EXECUTION PLAN: ${this.currentPlan.task}`,
            `Status: ${this.currentPlan.status}`,
            '',
            `📝 Rationale: ${this.currentPlan.rationale}`,
            '',
            '📌 Steps:',
        ];

        this.currentPlan.steps.forEach((step, idx) => {
            const statusIcon = {
                'pending': '⏳',
                'approved': '✅',
                'rejected': '❌',
                'executing': '🔄',
                'completed': '✓',
                'failed': '💥',
            }[step.status];

            lines.push(`  ${idx + 1}. ${statusIcon} [${step.type}] ${step.description}`);
            lines.push(`     Target: ${step.target || 'N/A'}`);
            lines.push(`     Impact: ${step.estimated_impact}`);
        });

        if (this.currentPlan.risks.length > 0) {
            lines.push('', '⚠️ Risks:');
            this.currentPlan.risks.forEach(r => lines.push(`  - ${r}`));
        }

        return lines.join('\n');
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    /**
     * Update configuration
     */
    setConfig(config: Partial<PlanActConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): PlanActConfig {
        return { ...this.config };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async callModel(prompt: string): Promise<string> {
        return this.modelManager.chat([
            {
                role: 'system',
                content: 'You are an AI coding agent operating in Plan mode. Create detailed, safe execution plans.',
                timestamp: new Date()
            },
            {
                role: 'user',
                content: prompt,
                timestamp: new Date()
            }
        ]);
    }

    private parseJSON(text: string): any {
        try {
            const match = text.match(/```json\s*([\s\S]*?)\s*```/);
            return JSON.parse(match ? match[1] : text);
        } catch {
            return { steps: [] };
        }
    }
}

// Export singleton
export const planActController = PlanActController.getInstance();
