/**
 * Task Automation Engine
 * 
 * Enables automated agent workflows with:
 * - Scheduled tasks (cron-like)
 * - Event-based triggers
 * - Condition-based automation
 * - Workflow templates
 */

import { EventEmitter } from 'events';

export interface AutomationTask {
    id: string;
    name: string;
    description: string;
    type: 'scheduled' | 'triggered' | 'manual';
    enabled: boolean;
    schedule?: ScheduleConfig;
    trigger?: TriggerConfig;
    actions: AutomationAction[];
    conditions?: AutomationCondition[];
    lastRun?: Date;
    nextRun?: Date;
    runCount: number;
    createdAt: Date;
}

export interface ScheduleConfig {
    type: 'interval' | 'cron' | 'once';
    interval?: number; // milliseconds
    cron?: string;
    runAt?: Date;
}

export interface TriggerConfig {
    event: string;
    filter?: Record<string, any>;
}

export interface AutomationAction {
    id: string;
    type: AutomationActionType;
    config: Record<string, any>;
    onSuccess?: string; // Next action ID
    onFailure?: string; // Action ID on failure
}

export type AutomationActionType =
    | 'run_command'
    | 'call_agent'
    | 'send_notification'
    | 'run_code_review'
    | 'build_context'
    | 'git_operation'
    | 'file_operation'
    | 'api_call'
    | 'execute_workflow'
    | 'check_git_status'
    | 'run_security_scan'
    | 'generate_report'
    | 'run_tests'
    | 'check_dependencies'
    | 'collect_metrics'
    | 'analyze_performance';

export interface AutomationCondition {
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'exists' | 'matches';
    value: any;
}

export interface AutomationResult {
    taskId: string;
    success: boolean;
    startTime: Date;
    endTime: Date;
    actionResults: Array<{
        actionId: string;
        success: boolean;
        output?: any;
        error?: string;
    }>;
}

/**
 * TaskAutomationEngine manages automated tasks
 */
export class TaskAutomationEngine extends EventEmitter {
    private static instance: TaskAutomationEngine;
    private tasks: Map<string, AutomationTask> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private isRunning: boolean = false;

    private constructor() {
        super();
        this.initializeDefaultTasks();
    }

    static getInstance(): TaskAutomationEngine {
        if (!TaskAutomationEngine.instance) {
            TaskAutomationEngine.instance = new TaskAutomationEngine();
        }
        return TaskAutomationEngine.instance;
    }

    /**
     * Initialize default automation tasks
     */
    private initializeDefaultTasks(): void {
        // Auto-review on file save
        this.createTask({
            name: 'Auto Code Review',
            description: 'Automatically review code when files are saved',
            type: 'triggered',
            trigger: { event: 'file:saved', filter: { extension: ['.ts', '.tsx', '.js'] } },
            actions: [
                { type: 'run_code_review', config: {} },
                { type: 'send_notification', config: { type: 'info', title: 'Review Complete' } },
            ],
        });

        // Daily context build
        this.createTask({
            name: 'Daily Context Build',
            description: 'Rebuild project context graph daily',
            type: 'scheduled',
            schedule: { type: 'interval', interval: 24 * 60 * 60 * 1000 }, // 24 hours
            actions: [
                { type: 'build_context', config: {} },
            ],
            enabled: false,
        });

        // Memory consolidation
        this.createTask({
            name: 'Memory Consolidation',
            description: 'Consolidate and clean up memory weekly',
            type: 'scheduled',
            schedule: { type: 'interval', interval: 7 * 24 * 60 * 60 * 1000 }, // 7 days
            actions: [
                { type: 'api_call', config: { method: 'memory:consolidate' } },
            ],
            enabled: false,
        });

        // Auto-format on save
        this.createTask({
            name: 'Auto Format',
            description: 'Format code using Prettier on file save',
            type: 'triggered',
            trigger: { event: 'file:saved', filter: { extension: ['.ts', '.tsx', '.js', '.css'] } },
            actions: [
                { type: 'run_command', config: { command: 'npx prettier --write {{file}}' } },
            ],
            enabled: false,
        });

        // Git commit reminder
        this.createTask({
            name: 'Commit Reminder',
            description: 'Remind to commit every 2 hours of active work',
            type: 'scheduled',
            schedule: { type: 'interval', interval: 2 * 60 * 60 * 1000 }, // 2 hours
            actions: [
                { type: 'check_git_status', config: {} },
                { type: 'send_notification', config: { type: 'info', title: 'Git Reminder', message: 'Consider committing your changes' } },
            ],
            enabled: false,
        });

        // Security scan on PR
        this.createTask({
            name: 'Security Scan',
            description: 'Run security analysis when a PR is opened',
            type: 'triggered',
            trigger: { event: 'git:pr_opened' },
            actions: [
                { type: 'run_security_scan', config: { level: 'standard' } },
                { type: 'generate_report', config: { format: 'markdown' } },
                { type: 'send_notification', config: { type: 'security', title: 'Security Scan Complete' } },
            ],
            enabled: false,
        });

        // Test runner on commit
        this.createTask({
            name: 'Auto Test',
            description: 'Run tests automatically after each commit',
            type: 'triggered',
            trigger: { event: 'git:committed' },
            actions: [
                { type: 'run_tests', config: { coverage: true } },
                { type: 'send_notification', config: { type: 'info', title: 'Tests Complete' } },
            ],
            enabled: false,
        });

        // Dependency update check
        this.createTask({
            name: 'Dependency Check',
            description: 'Check for outdated dependencies daily',
            type: 'scheduled',
            schedule: { type: 'interval', interval: 24 * 60 * 60 * 1000 },
            actions: [
                { type: 'check_dependencies', config: {} },
                { type: 'send_notification', config: { type: 'update', title: 'Dependency Report' } },
            ],
            enabled: false,
        });

        // Performance monitoring
        this.createTask({
            name: 'Performance Monitor',
            description: 'Collect and analyze performance metrics every hour',
            type: 'scheduled',
            schedule: { type: 'interval', interval: 60 * 60 * 1000 },
            actions: [
                { type: 'collect_metrics', config: { cpu: true, memory: true, disk: true } },
                { type: 'analyze_performance', config: {} },
            ],
            enabled: false,
        });

        console.log(`⚙️ [TaskAutomationEngine] Initialized with ${this.tasks.size} default tasks`);
    }

    /**
     * Create a new automation task
     */
    createTask(params: {
        name: string;
        description: string;
        type: AutomationTask['type'];
        schedule?: ScheduleConfig;
        trigger?: TriggerConfig;
        actions: Omit<AutomationAction, 'id'>[];
        conditions?: AutomationCondition[];
        enabled?: boolean;
    }): AutomationTask {
        const task: AutomationTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: params.name,
            description: params.description,
            type: params.type,
            enabled: params.enabled ?? true,
            schedule: params.schedule,
            trigger: params.trigger,
            actions: params.actions.map((a, i) => ({ ...a, id: `action-${i + 1}` })),
            conditions: params.conditions,
            runCount: 0,
            createdAt: new Date(),
        };

        this.tasks.set(task.id, task);

        if (task.enabled && task.type === 'scheduled') {
            this.scheduleTask(task);
        }

        this.emit('task:created', task);
        return task;
    }

    /**
     * Schedule a task
     */
    private scheduleTask(task: AutomationTask): void {
        if (!task.schedule) return;

        // Clear existing timer
        const existingTimer = this.timers.get(task.id);
        if (existingTimer) {
            clearInterval(existingTimer);
        }

        if (task.schedule.type === 'interval' && task.schedule.interval) {
            const timer = setInterval(() => {
                this.executeTask(task.id);
            }, task.schedule.interval);

            this.timers.set(task.id, timer);
            task.nextRun = new Date(Date.now() + task.schedule.interval);
        } else if (task.schedule.type === 'once' && task.schedule.runAt) {
            const delay = task.schedule.runAt.getTime() - Date.now();
            if (delay > 0) {
                const timer = setTimeout(() => {
                    this.executeTask(task.id);
                    this.timers.delete(task.id);
                }, delay);

                this.timers.set(task.id, timer);
                task.nextRun = task.schedule.runAt;
            }
        }
    }

    /**
     * Execute a task
     */
    async executeTask(taskId: string): Promise<AutomationResult> {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        const startTime = new Date();
        const actionResults: AutomationResult['actionResults'] = [];

        this.emit('task:started', task);

        try {
            // Check conditions
            if (task.conditions && !this.checkConditions(task.conditions)) {
                return {
                    taskId,
                    success: false,
                    startTime,
                    endTime: new Date(),
                    actionResults: [{ actionId: 'conditions', success: false, error: 'Conditions not met' }],
                };
            }

            // Execute actions
            for (const action of task.actions) {
                try {
                    const output = await this.executeAction(action);
                    actionResults.push({
                        actionId: action.id,
                        success: true,
                        output,
                    });

                    // Follow success path if defined
                    if (action.onSuccess) {
                        const nextAction = task.actions.find(a => a.id === action.onSuccess);
                        if (nextAction) {
                            // Will be executed in sequence
                        }
                    }
                } catch (error: any) {
                    actionResults.push({
                        actionId: action.id,
                        success: false,
                        error: error.message,
                    });

                    // Follow failure path or stop
                    if (action.onFailure) {
                        const failureAction = task.actions.find(a => a.id === action.onFailure);
                        if (failureAction) {
                            await this.executeAction(failureAction);
                        }
                    }
                }
            }

            task.lastRun = new Date();
            task.runCount++;

            const result: AutomationResult = {
                taskId,
                success: actionResults.every(r => r.success),
                startTime,
                endTime: new Date(),
                actionResults,
            };

            this.emit('task:completed', { task, result });
            return result;

        } catch (error: any) {
            const result: AutomationResult = {
                taskId,
                success: false,
                startTime,
                endTime: new Date(),
                actionResults: [{ actionId: 'execution', success: false, error: error.message }],
            };

            this.emit('task:failed', { task, error });
            return result;
        }
    }

    /**
     * Execute a single action
     */
    private async executeAction(action: AutomationAction): Promise<any> {
        console.log(`⚡ [Automation] Executing action: ${action.type}`);

        switch (action.type) {
            case 'run_command':
                // Simulate command execution
                return { command: action.config.command, output: 'Command executed' };

            case 'call_agent':
                // Simulate agent call
                return { agent: action.config.agent, response: 'Agent responded' };

            case 'send_notification':
                // Would call NotificationService
                return { sent: true };

            case 'run_code_review':
                // Would call CodeReviewAgent
                return { issues: 0, score: 95 };

            case 'build_context':
                // Would call ProjectContextGraph
                return { files: 100, symbols: 500 };

            case 'git_operation':
                return { operation: action.config.operation, success: true };

            case 'file_operation':
                return { operation: action.config.operation, success: true };

            case 'api_call':
                return { method: action.config.method, result: 'Success' };

            case 'execute_workflow':
                return { workflowId: action.config.workflowId, status: 'completed' };

            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }

    /**
     * Check conditions
     */
    private checkConditions(conditions: AutomationCondition[]): boolean {
        // Default to true for now - would need context to properly evaluate
        return true;
    }

    /**
     * Handle an event trigger
     */
    handleEvent(event: string, data: any): void {
        for (const task of this.tasks.values()) {
            if (task.enabled && task.type === 'triggered' && task.trigger?.event === event) {
                // Check filter
                if (task.trigger.filter) {
                    let matches = true;
                    for (const [key, value] of Object.entries(task.trigger.filter)) {
                        if (Array.isArray(value)) {
                            if (!value.includes(data[key])) matches = false;
                        } else if (data[key] !== value) {
                            matches = false;
                        }
                    }
                    if (!matches) continue;
                }

                this.executeTask(task.id).catch(console.error);
            }
        }
    }

    /**
     * Enable/disable a task
     */
    setEnabled(taskId: string, enabled: boolean): boolean {
        const task = this.tasks.get(taskId);
        if (!task) return false;

        task.enabled = enabled;

        if (enabled && task.type === 'scheduled') {
            this.scheduleTask(task);
        } else if (!enabled) {
            const timer = this.timers.get(taskId);
            if (timer) {
                clearInterval(timer);
                this.timers.delete(taskId);
            }
        }

        this.emit('task:updated', task);
        return true;
    }

    /**
     * Delete a task
     */
    deleteTask(taskId: string): boolean {
        const timer = this.timers.get(taskId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(taskId);
        }
        return this.tasks.delete(taskId);
    }

    // Public API
    getTasks(): AutomationTask[] { return [...this.tasks.values()]; }
    getTask(id: string): AutomationTask | undefined { return this.tasks.get(id); }

    /**
     * Start the automation engine
     */
    start(): void {
        this.isRunning = true;
        for (const task of this.tasks.values()) {
            if (task.enabled && task.type === 'scheduled') {
                this.scheduleTask(task);
            }
        }
        console.log('✅ [TaskAutomationEngine] Started');
    }

    /**
     * Stop the automation engine
     */
    stop(): void {
        this.isRunning = false;
        for (const timer of this.timers.values()) {
            clearInterval(timer);
        }
        this.timers.clear();
        console.log('🛑 [TaskAutomationEngine] Stopped');
    }
}

export default TaskAutomationEngine;
