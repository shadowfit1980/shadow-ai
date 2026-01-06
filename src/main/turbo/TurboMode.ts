/**
 * Turbo Mode
 * Auto-execute terminal commands without confirmation
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';

export interface TurboConfig {
    enabled: boolean;
    autoExecuteTerminal: boolean;
    autoApplyEdits: boolean;
    autoFixLint: boolean;
    autoRunTests: boolean;
    confirmDestructive: boolean;
    maxConcurrent: number;
    timeout: number;
}

export interface TurboExecution {
    id: string;
    command: string;
    type: 'terminal' | 'edit' | 'lint' | 'test';
    status: 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
    output: string;
    startTime: number;
    endTime?: number;
    autoExecuted: boolean;
}

/**
 * TurboMode
 * Speed up workflows by auto-executing safe commands
 */
export class TurboMode extends EventEmitter {
    private static instance: TurboMode;
    private config: TurboConfig = {
        enabled: false,
        autoExecuteTerminal: true,
        autoApplyEdits: true,
        autoFixLint: true,
        autoRunTests: false,
        confirmDestructive: true,
        maxConcurrent: 3,
        timeout: 30000,
    };
    private executions: Map<string, TurboExecution> = new Map();
    private queue: TurboExecution[] = [];
    private activeCount = 0;
    private destructivePatterns = [
        /rm\s+-rf/i,
        /delete/i,
        /drop\s+table/i,
        /truncate/i,
        /force/i,
        /--hard/i,
        /push\s+--force/i,
    ];

    private constructor() {
        super();
    }

    static getInstance(): TurboMode {
        if (!TurboMode.instance) {
            TurboMode.instance = new TurboMode();
        }
        return TurboMode.instance;
    }

    /**
     * Enable turbo mode
     */
    enable(): void {
        this.config.enabled = true;
        this.emit('enabled');
    }

    /**
     * Disable turbo mode
     */
    disable(): void {
        this.config.enabled = false;
        this.emit('disabled');
    }

    /**
     * Check if enabled
     */
    isEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Configure turbo mode
     */
    configure(options: Partial<TurboConfig>): void {
        this.config = { ...this.config, ...options };
        this.emit('configured', this.config);
    }

    /**
     * Get configuration
     */
    getConfig(): TurboConfig {
        return { ...this.config };
    }

    /**
     * Execute terminal command in turbo mode
     */
    async executeTerminal(command: string, cwd?: string): Promise<TurboExecution> {
        const execution: TurboExecution = {
            id: `turbo_${Date.now()}`,
            command,
            type: 'terminal',
            status: 'queued',
            output: '',
            startTime: Date.now(),
            autoExecuted: false,
        };

        this.executions.set(execution.id, execution);

        // Check if should auto-execute
        if (this.shouldAutoExecute(command)) {
            execution.autoExecuted = true;
            this.queue.push(execution);
            this.processQueue();
        } else {
            execution.status = 'skipped';
            this.emit('requiresConfirmation', execution);
        }

        return execution;
    }

    /**
     * Check if command should auto-execute
     */
    private shouldAutoExecute(command: string): boolean {
        if (!this.config.enabled || !this.config.autoExecuteTerminal) {
            return false;
        }

        // Check for destructive patterns
        if (this.config.confirmDestructive) {
            for (const pattern of this.destructivePatterns) {
                if (pattern.test(command)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Process execution queue
     */
    private async processQueue(): Promise<void> {
        while (this.queue.length > 0 && this.activeCount < this.config.maxConcurrent) {
            const execution = this.queue.shift();
            if (execution) {
                this.activeCount++;
                await this.runExecution(execution);
                this.activeCount--;
            }
        }
    }

    /**
     * Run a single execution
     */
    private async runExecution(execution: TurboExecution): Promise<void> {
        execution.status = 'running';
        this.emit('executionStarted', execution);

        try {
            const output = await this.runCommand(execution.command);
            execution.output = output;
            execution.status = 'completed';
            execution.endTime = Date.now();
            this.emit('executionCompleted', execution);
        } catch (error: any) {
            execution.output = error.message;
            execution.status = 'failed';
            execution.endTime = Date.now();
            this.emit('executionFailed', execution);
        }
    }

    /**
     * Run command
     */
    private runCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let output = '';
            const timeout = setTimeout(() => {
                reject(new Error('Command timed out'));
            }, this.config.timeout);

            const proc = spawn(command, [], { shell: true });

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                output += data.toString();
            });

            proc.on('close', (code) => {
                clearTimeout(timeout);
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Exit code ${code}: ${output}`));
                }
            });

            proc.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    /**
     * Force execute (skip confirmation)
     */
    async forceExecute(executionId: string): Promise<TurboExecution | null> {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== 'skipped') {
            return null;
        }

        execution.status = 'queued';
        execution.autoExecuted = false;
        this.queue.push(execution);
        this.processQueue();

        return execution;
    }

    /**
     * Get execution by ID
     */
    getExecution(id: string): TurboExecution | null {
        return this.executions.get(id) || null;
    }

    /**
     * Get all executions
     */
    getAllExecutions(): TurboExecution[] {
        return Array.from(this.executions.values());
    }

    /**
     * Get recent executions
     */
    getRecentExecutions(limit = 20): TurboExecution[] {
        return Array.from(this.executions.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }

    /**
     * Clear execution history
     */
    clearHistory(): void {
        this.executions.clear();
        this.emit('historyCleared');
    }

    /**
     * Add destructive pattern
     */
    addDestructivePattern(pattern: RegExp): void {
        this.destructivePatterns.push(pattern);
    }

    /**
     * Is command destructive
     */
    isDestructive(command: string): boolean {
        return this.destructivePatterns.some(p => p.test(command));
    }
}

// Singleton getter
export function getTurboMode(): TurboMode {
    return TurboMode.getInstance();
}
