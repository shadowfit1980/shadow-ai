/**
 * Types for Self-Improvement and Learning System
 */

export interface PerformanceMetrics {
    taskId: string;
    taskType: string;
    timestamp: Date;
    duration: number;
    success: boolean;
    quality: number; // 0-1
    efficiency: number; // 0-1
    userSatisfaction?: number; // 0-1
    errorCount: number;
    retryCount: number;
    resourceUsage: {
        tokens: number;
        apiCalls: number;
        computeTime: number;
    };
    metadata?: Record<string, any>;
}

export interface Strategy {
    id: string;
    name: string;
    description: string;
    category: string;
    confidence: number; // 0-1
    successRate: number;
    avgQuality: number;
    avgEfficiency: number;
    usageCount: number;
    lastUsed: Date;
    parameters: Record<string, any>;
    applicableContexts: string[];
    createdAt: Date;
    evolvedFrom?: string;
}

export interface LearningSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    tasksCompleted: number;
    improvements: Improvement[];
    strategiesDiscovered: Strategy[];
    performanceDelta: {
        successRate: number;
        avgQuality: number;
        avgEfficiency: number;
    };
}

export interface Improvement {
    id: string;
    timestamp: Date;
    type: 'strategy' | 'parameter' | 'approach' | 'tool';
    description: string;
    beforeMetrics: PerformanceMetrics;
    afterMetrics: PerformanceMetrics;
    improvementFactor: number;
    confidence: number;
    adopted: boolean;
    rollbackAvailable: boolean;
}

export interface Feedback {
    taskId: string;
    timestamp: Date;
    rating: number; // 1-5
    aspects: {
        correctness: number;
        efficiency: number;
        codeQuality: number;
        completeness: number;
        creativity: number;
    };
    comments?: string;
    userExpectation?: string;
    actualResult?: string;
}

export interface CapabilityGap {
    capability: string;
    currentLevel: number; // 0-1
    desiredLevel: number; // 0-1
    gap: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    acquisitionStrategy?: string;
    estimatedEffort: number;
}

export interface ExperimentResult {
    experimentId: string;
    strategyA: Strategy;
    strategyB: Strategy;
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    metrics: {
        aPerformance: PerformanceMetrics[];
        bPerformance: PerformanceMetrics[];
    };
    statistically_significant: boolean;
}

export interface EvolutionRecord {
    timestamp: Date;
    type: 'improvement' | 'regression' | 'rollback' | 'discovery';
    description: string;
    impactedCapabilities: string[];
    performanceChange: number;
    confidence: number;
    canRollback: boolean;
}

export interface MetaLearningInsight {
    pattern: string;
    description: string;
    applicability: string[];
    confidence: number;
    examples: {
        context: string;
        approach: string;
        outcome: string;
    }[];
}
