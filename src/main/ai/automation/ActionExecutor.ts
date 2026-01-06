/**
 * Action Executor
 * 
 * Executes automation actions with proper isolation and error handling
 */

import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface ActionContext {
    workingDirectory: string;
    environment: Record<string, string>;
    timeout: number;
    dryRun: boolean;
}

export interface ActionResult {
    success: boolean;
    output?: any;
    error?: string;
    duration: number;
    logs: string[];
}

export interface ActionDefinition {
    type: string;
    name: string;
    description: string;
    parameters: ParameterDefinition[];
    executor: (params: Record<string, any>, context: ActionContext) => Promise<ActionResult>;
}

export interface ParameterDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required: boolean;
    default?: any;
    description: string;
}

/**
 * ActionExecutor - Central registry and executor for automation actions
 */
export class ActionExecutor extends EventEmitter {
    private static instance: ActionExecutor;
    private actions: Map<string, ActionDefinition> = new Map();
    private executionHistory: Array<{
        actionType: string;
        timestamp: Date;
        result: ActionResult;
    }> = [];
    private maxHistorySize = 1000;

    private constructor() {
        super();
        this.registerBuiltInActions();
    }

    static getInstance(): ActionExecutor {
        if (!ActionExecutor.instance) {
            ActionExecutor.instance = new ActionExecutor();
        }
        return ActionExecutor.instance;
    }

    /**
     * Register built-in actions
     */
    private registerBuiltInActions(): void {
        // Shell Command Executor
        this.registerAction({
            type: 'shell_command',
            name: 'Shell Command',
            description: 'Execute a shell command',
            parameters: [
                { name: 'command', type: 'string', required: true, description: 'Command to execute' },
                { name: 'args', type: 'array', required: false, default: [], description: 'Command arguments' },
            ],
            executor: async (params, context) => {
                const startTime = Date.now();
                const logs: string[] = [];

                try {
                    const result = await this.executeCommand(
                        `${params.command} ${(params.args || []).join(' ')}`,
                        context.workingDirectory,
                        context.timeout
                    );
                    logs.push(`Command executed: ${params.command}`);
                    return { success: true, output: result, duration: Date.now() - startTime, logs };
                } catch (error) {
                    return {
                        success: false,
                        error: (error as Error).message,
                        duration: Date.now() - startTime,
                        logs
                    };
                }
            },
        });

        // File Operations
        this.registerAction({
            type: 'file_write',
            name: 'Write File',
            description: 'Write content to a file',
            parameters: [
                { name: 'path', type: 'string', required: true, description: 'File path' },
                { name: 'content', type: 'string', required: true, description: 'Content to write' },
                { name: 'append', type: 'boolean', required: false, default: false, description: 'Append mode' },
            ],
            executor: async (params, context) => {
                const startTime = Date.now();
                const logs: string[] = [];
                const filePath = path.isAbsolute(params.path)
                    ? params.path
                    : path.join(context.workingDirectory, params.path);

                try {
                    if (context.dryRun) {
                        logs.push(`[DRY RUN] Would write to: ${filePath}`);
                        return { success: true, output: { dryRun: true }, duration: Date.now() - startTime, logs };
                    }

                    await fs.mkdir(path.dirname(filePath), { recursive: true });

                    if (params.append) {
                        await fs.appendFile(filePath, params.content);
                    } else {
                        await fs.writeFile(filePath, params.content);
                    }

                    logs.push(`File written: ${filePath}`);
                    return { success: true, output: { path: filePath }, duration: Date.now() - startTime, logs };
                } catch (error) {
                    return { success: false, error: (error as Error).message, duration: Date.now() - startTime, logs };
                }
            },
        });

        // HTTP Request
        this.registerAction({
            type: 'http_request',
            name: 'HTTP Request',
            description: 'Make an HTTP request',
            parameters: [
                { name: 'url', type: 'string', required: true, description: 'Request URL' },
                { name: 'method', type: 'string', required: false, default: 'GET', description: 'HTTP method' },
                { name: 'headers', type: 'object', required: false, default: {}, description: 'Headers' },
                { name: 'body', type: 'string', required: false, description: 'Request body' },
            ],
            executor: async (params, context) => {
                const startTime = Date.now();
                const logs: string[] = [];

                try {
                    const response = await fetch(params.url, {
                        method: params.method || 'GET',
                        headers: params.headers || {},
                        body: params.body,
                    });

                    const data = await response.text();
                    logs.push(`HTTP ${params.method || 'GET'} ${params.url} - ${response.status}`);

                    return {
                        success: response.ok,
                        output: { status: response.status, data },
                        duration: Date.now() - startTime,
                        logs
                    };
                } catch (error) {
                    return { success: false, error: (error as Error).message, duration: Date.now() - startTime, logs };
                }
            },
        });

        // Git Operations
        this.registerAction({
            type: 'git_commit',
            name: 'Git Commit',
            description: 'Create a git commit',
            parameters: [
                { name: 'message', type: 'string', required: true, description: 'Commit message' },
                { name: 'addAll', type: 'boolean', required: false, default: true, description: 'Add all changes' },
            ],
            executor: async (params, context) => {
                const startTime = Date.now();
                const logs: string[] = [];

                try {
                    if (params.addAll) {
                        await this.executeCommand('git add -A', context.workingDirectory, context.timeout);
                        logs.push('Added all changes to staging');
                    }

                    const result = await this.executeCommand(
                        `git commit -m "${params.message}"`,
                        context.workingDirectory,
                        context.timeout
                    );
                    logs.push(`Committed: ${params.message}`);

                    return { success: true, output: result, duration: Date.now() - startTime, logs };
                } catch (error) {
                    return { success: false, error: (error as Error).message, duration: Date.now() - startTime, logs };
                }
            },
        });

        // Notification
        this.registerAction({
            type: 'send_notification',
            name: 'Send Notification',
            description: 'Send a notification to the user',
            parameters: [
                { name: 'title', type: 'string', required: true, description: 'Notification title' },
                { name: 'message', type: 'string', required: true, description: 'Notification message' },
                { name: 'type', type: 'string', required: false, default: 'info', description: 'info/warning/error' },
            ],
            executor: async (params, _context) => {
                const startTime = Date.now();
                this.emit('notification', {
                    type: params.type || 'info',
                    title: params.title,
                    message: params.message,
                    timestamp: new Date(),
                });
                return {
                    success: true,
                    output: { notified: true },
                    duration: Date.now() - startTime,
                    logs: [`Notification sent: ${params.title}`]
                };
            },
        });

        // Delay/Wait
        this.registerAction({
            type: 'delay',
            name: 'Delay',
            description: 'Wait for a specified duration',
            parameters: [
                { name: 'ms', type: 'number', required: true, description: 'Milliseconds to wait' },
            ],
            executor: async (params, _context) => {
                const startTime = Date.now();
                await new Promise(resolve => setTimeout(resolve, params.ms));
                return {
                    success: true,
                    output: { waited: params.ms },
                    duration: Date.now() - startTime,
                    logs: [`Waited ${params.ms}ms`]
                };
            },
        });

        // Conditional
        this.registerAction({
            type: 'conditional',
            name: 'Conditional',
            description: 'Execute action based on condition',
            parameters: [
                { name: 'condition', type: 'string', required: true, description: 'Condition expression' },
                { name: 'thenAction', type: 'object', required: true, description: 'Action if true' },
                { name: 'elseAction', type: 'object', required: false, description: 'Action if false' },
            ],
            executor: async (params, context) => {
                const startTime = Date.now();
                // Simple condition evaluation (can be extended)
                const conditionMet = this.evaluateCondition(params.condition);

                const actionToRun = conditionMet ? params.thenAction : params.elseAction;
                if (actionToRun) {
                    return this.executeAction(actionToRun.type, actionToRun.params, context);
                }

                return {
                    success: true,
                    output: { conditionMet, actionSkipped: !actionToRun },
                    duration: Date.now() - startTime,
                    logs: [`Condition ${conditionMet ? 'met' : 'not met'}`]
                };
            },
        });

        console.log(`⚙️ [ActionExecutor] Registered ${this.actions.size} built-in actions`);
    }

    /**
     * Register a custom action
     */
    registerAction(action: ActionDefinition): void {
        this.actions.set(action.type, action);
        this.emit('action:registered', action.type);
    }

    /**
     * Execute an action
     */
    async executeAction(
        type: string,
        params: Record<string, any>,
        context: Partial<ActionContext> = {}
    ): Promise<ActionResult> {
        const action = this.actions.get(type);
        if (!action) {
            return {
                success: false,
                error: `Unknown action type: ${type}`,
                duration: 0,
                logs: []
            };
        }

        // Build full context
        const fullContext: ActionContext = {
            workingDirectory: context.workingDirectory || process.cwd(),
            environment: context.environment || {},
            timeout: context.timeout || 30000,
            dryRun: context.dryRun || false,
        };

        // Validate parameters
        const validationError = this.validateParams(action, params);
        if (validationError) {
            return {
                success: false,
                error: validationError,
                duration: 0,
                logs: []
            };
        }

        // Apply defaults
        const finalParams = this.applyDefaults(action, params);

        // Execute
        this.emit('action:start', { type, params: finalParams });
        const result = await action.executor(finalParams, fullContext);
        this.emit('action:complete', { type, result });

        // Track history
        this.executionHistory.push({
            actionType: type,
            timestamp: new Date(),
            result,
        });
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.shift();
        }

        return result;
    }

    /**
     * Execute a command
     */
    private executeCommand(command: string, cwd: string, timeout: number): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, { cwd, timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    /**
     * Validate action parameters
     */
    private validateParams(action: ActionDefinition, params: Record<string, any>): string | null {
        for (const param of action.parameters) {
            if (param.required && !(param.name in params)) {
                return `Missing required parameter: ${param.name}`;
            }
        }
        return null;
    }

    /**
     * Apply parameter defaults
     */
    private applyDefaults(action: ActionDefinition, params: Record<string, any>): Record<string, any> {
        const result = { ...params };
        for (const param of action.parameters) {
            if (!(param.name in result) && param.default !== undefined) {
                result[param.name] = param.default;
            }
        }
        return result;
    }

    /**
     * Evaluate a simple condition
     */
    private evaluateCondition(condition: string): boolean {
        // Simple evaluation - can be extended for more complex conditions
        if (condition === 'true') return true;
        if (condition === 'false') return false;
        // Add more complex condition parsing as needed
        return false;
    }

    /**
     * Get available actions
     */
    getAvailableActions(): ActionDefinition[] {
        return Array.from(this.actions.values());
    }

    /**
     * Get execution history
     */
    getHistory(limit: number = 100) {
        return this.executionHistory.slice(-limit);
    }
}

export default ActionExecutor;
