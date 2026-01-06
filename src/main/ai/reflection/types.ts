// Self-Reflection and Critique System Types

export interface Critique {
    planId: string;
    overallScore: number; // 0-100
    strengths: string[];
    weaknesses: string[];
    risks: Risk[];
    suggestions: Suggestion[];
    confidence: number; // 0-1
}

export interface Risk {
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'technical' | 'security' | 'performance' | 'maintainability';
    description: string;
    likelihood: number; // 0-1
    impact: string;
    mitigation?: string;
}

export interface Suggestion {
    type: 'improvement' | 'alternative' | 'optimization';
    description: string;
    priority: 'low' | 'medium' | 'high';
    estimatedBenefit: string;
}

export interface SelfEvaluation {
    taskId: string;
    success: boolean;
    qualityScore: number; // 0-100
    completeness: number; // 0-1
    correctness: number; // 0-1
    efficiency: number; // 0-1
    lessons: Lesson[];
    improvements: string[];
}

export interface Lesson {
    what: string;
    why: string;
    howToApply: string;
}

export interface ReflectionResult {
    shouldProceed: boolean;
    mustAddress: string[];
    recommended: string[];
    alternativeApproaches: string[];
}
