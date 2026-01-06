// Request Analysis Types
export interface TaskAnalysis {
    intent: string;
    complexity: 'simple' | 'medium' | 'complex';
    affectedFiles: string[];
    requiredTools: string[];
    estimatedSteps: number;
    risks: string[];
    category: 'feature' | 'bugfix' | 'refactor' | 'optimization' | 'documentation';
}

// Implementation Plan Types
export interface ImplementationPlan {
    id: string;
    title: string;
    summary: string;
    phases: Phase[];
    files: FileChange[];
    risks: Risk[];
    estimatedTime: number;
    createdAt: Date;
}

export interface Phase {
    id: string;
    name: string;
    description: string;
    steps: Step[];
    dependencies: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface Step {
    id: string;
    description: string;
    file?: string;
    action: 'create' | 'modify' | 'delete' | 'execute';
    code?: string;
    completed: boolean;
}

export interface FileChange {
    path: string;
    action: 'create' | 'modify' | 'delete';
    description: string;
    linesAdded?: number;
    linesRemoved?: number;
}

export interface Risk {
    level: 'low' | 'medium' | 'high';
    description: string;
    mitigation?: string;
}

// Diff Preview Types
export interface DiffPreview {
    file: string;
    action: 'create' | 'modify' | 'delete';
    diff: string;
    linesAdded: number;
    linesRemoved: number;
    oldContent?: string;
    newContent?: string;
}

// Execution Types
export interface ExecutionResult {
    success: boolean;
    completedSteps: string[];
    failedSteps: string[];
    errors: ExecutionError[];
    duration: number;
}

export interface ExecutionError {
    stepId: string;
    error: string;
    timestamp: Date;
}
