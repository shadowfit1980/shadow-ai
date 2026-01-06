/**
 * Tool Chain Executor
 * 
 * Enables declarative tool pipeline execution where the output of one tool
 * feeds into the next, with middleware support for transformation.
 */

import { EventEmitter } from 'events';
import {
    Tool,
    ToolExecutionContext,
    ToolExecutionResult,
} from './types';
import { toolRegistry } from './ToolRegistry';

// ============================================================================
// TYPES
// ============================================================================

export interface ChainStep {
    toolName: string;
    params: Record<string, any>;
    /** Maps output fields from previous step to this step's params */
    inputMapping?: Record<string, string>;
    /** Name for this step's output in the chain context */
    outputAs?: string;
    /** Continue chain even if this step fails */
    optional?: boolean;
    /** Transform output before passing to next step */
    transform?: (output: any) => any;
}

export interface ChainMiddleware {
    name: string;
    /** Called before each step */
    beforeStep?: (step: ChainStep, context: ChainContext) => Promise<ChainStep>;
    /** Called after each step */
    afterStep?: (step: ChainStep, result: ToolExecutionResult, context: ChainContext) => Promise<ToolExecutionResult>;
}

export interface ChainContext {
    chainId: string;
    startTime: Date;
    currentStep: number;
    totalSteps: number;
    stepOutputs: Map<string, any>;
    metadata: Record<string, any>;
}

export interface ChainResult {
    success: boolean;
    chainId: string;
    outputs: Record<string, any>;
    steps: Array<{
        step: ChainStep;
        result: ToolExecutionResult;
        duration: number;
    }>;
    totalDuration: number;
    error?: Error;
}

export interface ToolChain {
    id: string;
    name: string;
    description?: string;
    steps: ChainStep[];
    middleware?: ChainMiddleware[];
    createdAt: Date;
}

// ============================================================================
// TOOL CHAIN EXECUTOR
// ============================================================================

export class ToolChainExecutor extends EventEmitter {
    private static instance: ToolChainExecutor;
    private chains: Map<string, ToolChain> = new Map();
    private middleware: ChainMiddleware[] = [];
    private executionHistory: ChainResult[] = [];
    private readonly MAX_HISTORY = 100;

    private constructor() {
        super();
    }

    static getInstance(): ToolChainExecutor {
        if (!ToolChainExecutor.instance) {
            ToolChainExecutor.instance = new ToolChainExecutor();
        }
        return ToolChainExecutor.instance;
    }

    // -------------------------------------------------------------------------
    // Chain Definition
    // -------------------------------------------------------------------------

    /**
     * Create a new tool chain
     */
    createChain(
        name: string,
        steps: ChainStep[],
        options?: { description?: string; middleware?: ChainMiddleware[] }
    ): ToolChain {
        const chain: ToolChain = {
            id: `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            description: options?.description,
            steps,
            middleware: options?.middleware || [],
            createdAt: new Date(),
        };

        this.chains.set(chain.id, chain);
        this.emit('chainCreated', chain);

        return chain;
    }

    /**
     * Get a chain by ID
     */
    getChain(chainId: string): ToolChain | undefined {
        return this.chains.get(chainId);
    }

    /**
     * List all chains
     */
    listChains(): ToolChain[] {
        return Array.from(this.chains.values());
    }

    /**
     * Delete a chain
     */
    deleteChain(chainId: string): boolean {
        const deleted = this.chains.delete(chainId);
        if (deleted) {
            this.emit('chainDeleted', chainId);
        }
        return deleted;
    }

    // -------------------------------------------------------------------------
    // Middleware
    // -------------------------------------------------------------------------

    /**
     * Add global middleware that applies to all chain executions
     */
    addMiddleware(middleware: ChainMiddleware): void {
        this.middleware.push(middleware);
    }

    /**
     * Remove middleware by name
     */
    removeMiddleware(name: string): boolean {
        const index = this.middleware.findIndex(m => m.name === name);
        if (index >= 0) {
            this.middleware.splice(index, 1);
            return true;
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // Execution
    // -------------------------------------------------------------------------

    /**
     * Execute a chain with initial parameters
     */
    async execute(
        chainId: string,
        initialParams: Record<string, any> = {},
        executionContext?: ToolExecutionContext
    ): Promise<ChainResult> {
        const chain = this.chains.get(chainId);
        if (!chain) {
            throw new Error(`Chain not found: ${chainId}`);
        }

        return this.executeSteps(chain.steps, initialParams, {
            chainName: chain.name,
            middleware: [...this.middleware, ...(chain.middleware || [])],
            executionContext,
        });
    }

    /**
     * Execute steps directly without creating a chain
     */
    async executeSteps(
        steps: ChainStep[],
        initialParams: Record<string, any> = {},
        options?: {
            chainName?: string;
            middleware?: ChainMiddleware[];
            executionContext?: ToolExecutionContext;
        }
    ): Promise<ChainResult> {
        const startTime = Date.now();
        const chainId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const context: ChainContext = {
            chainId,
            startTime: new Date(),
            currentStep: 0,
            totalSteps: steps.length,
            stepOutputs: new Map(Object.entries(initialParams)),
            metadata: { chainName: options?.chainName },
        };

        const middleware = options?.middleware || this.middleware;
        const stepResults: ChainResult['steps'] = [];
        let overallSuccess = true;
        let chainError: Error | undefined;

        this.emit('chainStarted', { chainId, steps: steps.length });

        for (let i = 0; i < steps.length; i++) {
            let step = steps[i];
            context.currentStep = i;

            const stepStartTime = Date.now();

            try {
                // Apply before middleware
                for (const mw of middleware) {
                    if (mw.beforeStep) {
                        step = await mw.beforeStep(step, context);
                    }
                }

                // Resolve parameters with input mapping
                const resolvedParams = this.resolveParams(step, context);

                this.emit('stepStarted', { chainId, step: i, toolName: step.toolName });

                // Execute the tool
                let result = await toolRegistry.execute(
                    step.toolName,
                    resolvedParams,
                    options?.executionContext
                );

                // Apply after middleware
                for (const mw of middleware) {
                    if (mw.afterStep) {
                        result = await mw.afterStep(step, result, context);
                    }
                }

                // Apply transform if specified
                if (step.transform && result.output) {
                    result = {
                        ...result,
                        output: step.transform(result.output),
                    };
                }

                // Store output
                const outputKey = step.outputAs || `step_${i}`;
                if (result.output !== undefined) {
                    context.stepOutputs.set(outputKey, result.output);
                }

                const stepDuration = Date.now() - stepStartTime;
                stepResults.push({ step, result, duration: stepDuration });

                this.emit('stepCompleted', {
                    chainId,
                    step: i,
                    success: result.success,
                    duration: stepDuration,
                });

                // Handle failure
                if (!result.success && !step.optional) {
                    overallSuccess = false;
                    chainError = result.error || new Error(`Step ${i} (${step.toolName}) failed`);
                    break;
                }

            } catch (error) {
                const stepDuration = Date.now() - stepStartTime;
                const result: ToolExecutionResult = {
                    success: false,
                    error: error instanceof Error ? error : new Error(String(error)),
                    duration: stepDuration,
                };

                stepResults.push({ step, result, duration: stepDuration });

                this.emit('stepFailed', {
                    chainId,
                    step: i,
                    error: result.error,
                });

                if (!step.optional) {
                    overallSuccess = false;
                    chainError = result.error;
                    break;
                }
            }
        }

        const totalDuration = Date.now() - startTime;

        const chainResult: ChainResult = {
            success: overallSuccess,
            chainId,
            outputs: Object.fromEntries(context.stepOutputs),
            steps: stepResults,
            totalDuration,
            error: chainError,
        };

        // Store in history
        this.executionHistory.push(chainResult);
        if (this.executionHistory.length > this.MAX_HISTORY) {
            this.executionHistory.shift();
        }

        this.emit('chainCompleted', {
            chainId,
            success: overallSuccess,
            duration: totalDuration,
        });

        return chainResult;
    }

    /**
     * Resolve parameters using input mapping from chain context
     */
    private resolveParams(step: ChainStep, context: ChainContext): Record<string, any> {
        const resolved = { ...step.params };

        if (step.inputMapping) {
            for (const [paramName, sourcePath] of Object.entries(step.inputMapping)) {
                const value = this.resolvePath(sourcePath, context.stepOutputs);
                if (value !== undefined) {
                    resolved[paramName] = value;
                }
            }
        }

        return resolved;
    }

    /**
     * Resolve a dot-notation path from step outputs
     * e.g., "fileContent.lines" or "step_0.data.items"
     */
    private resolvePath(path: string, outputs: Map<string, any>): any {
        const parts = path.split('.');
        const rootKey = parts[0];

        let value = outputs.get(rootKey);
        if (value === undefined) return undefined;

        for (let i = 1; i < parts.length; i++) {
            if (value === null || value === undefined) return undefined;
            value = value[parts[i]];
        }

        return value;
    }

    // -------------------------------------------------------------------------
    // History & Stats
    // -------------------------------------------------------------------------

    /**
     * Get execution history
     */
    getHistory(limit?: number): ChainResult[] {
        const history = [...this.executionHistory].reverse();
        return limit ? history.slice(0, limit) : history;
    }

    /**
     * Get execution statistics
     */
    getStats(): {
        totalExecutions: number;
        successRate: number;
        averageDuration: number;
        chainCount: number;
    } {
        const total = this.executionHistory.length;
        const successful = this.executionHistory.filter(r => r.success).length;
        const avgDuration = total > 0
            ? this.executionHistory.reduce((sum, r) => sum + r.totalDuration, 0) / total
            : 0;

        return {
            totalExecutions: total,
            successRate: total > 0 ? successful / total : 0,
            averageDuration: avgDuration,
            chainCount: this.chains.size,
        };
    }

    /**
     * Clear execution history
     */
    clearHistory(): void {
        this.executionHistory = [];
    }
}

// Export singleton
export const toolChainExecutor = ToolChainExecutor.getInstance();
