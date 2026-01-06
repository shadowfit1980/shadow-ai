// Core types for multi-step reasoning system

export interface Task {
    id: string;
    description: string;
    context: Record<string, any>;
    constraints?: string[];
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
}

export interface Step {
    id: string;
    action: string;
    description: string;
    tool?: string;
    inputs: Record<string, any>;
    outputs: string[];
    dependencies: string[];
    retryable: boolean;
    timeout?: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface StepResult {
    stepId: string;
    success: boolean;
    output?: any;
    error?: Error;
    duration: number;
    retries: number;
}

export interface Thought {
    id: string;
    content: string;
    reasoning: string;
    score: number;
    depth: number;
    children?: Thought[];
}

export interface ThoughtChain {
    problem: string;
    thoughts: Thought[];
    selectedPath: Thought[];
    conclusion: string;
    confidence: number;
}

export interface DependencyGraph {
    nodes: Map<string, Step>;
    edges: Map<string, string[]>;
    levels: Step[][];
}

export interface StepGroup {
    level: number;
    steps: Step[];
    canParallelize: boolean;
}

export interface ExecutionPlan {
    groups: StepGroup[];
    totalSteps: number;
    estimatedDuration: number;
}

export interface ExecutionResult {
    taskId: string;
    success: boolean;
    steps: StepResult[];
    duration: number;
    errors: Error[];
    completedSteps: number;
    failedSteps: number;
}

export interface RetryConfig {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
}

export interface ToolDefinition {
    name: string;
    execute: (inputs: any) => Promise<any>;
    timeout?: number;
    retryable?: boolean;
}

export type ExecutionStrategy = 'sequential' | 'parallel' | 'hybrid';
