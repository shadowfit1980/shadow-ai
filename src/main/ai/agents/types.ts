/**
 * Multi-Agent System - Type Definitions
 * 
 * Defines all types for the agent orchestration system
 */

import { ProjectContext as MemoryProjectContext } from '../memory/types';
export { ProjectContext } from '../memory/types';

// ==================== Agent Types ====================

export type AgentType =
    | 'architect'
    | 'coder'
    | 'debugger'
    | 'reviewer'
    | 'devops'
    | 'designer';

export type TaskType =
    | 'feature'
    | 'bug'
    | 'refactor'
    | 'design'
    | 'deployment'
    | 'optimization';

export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type StepPriority = 'critical' | 'high' | 'medium' | 'low';

// ==================== Task & Analysis ====================

export interface ComplexTask {
    id: string;
    description: string;
    requirements?: string[];
    constraints?: string[];
    context?: any;
}

export interface TaskAnalysis {
    type: TaskType;
    complexity: TaskComplexity;
    requiredAgents: AgentType[];
    estimatedSteps: number;
    risks: string[];
    opportunities: string[];
}

// ==================== Execution Planning ====================

export interface ExecutionStep {
    id: string;
    agentType: AgentType;
    description: string;
    requirements: string[];
    dependencies: string[]; // IDs of steps that must complete first
    priority: StepPriority;
    estimatedDuration?: number; // in seconds
}

export interface ExecutionPlan {
    taskId: string;
    steps: ExecutionStep[];
    parallelizable: string[][]; // Groups of step IDs that can run in parallel
    estimatedDuration: number; // total in seconds
    riskLevel: 'low' | 'medium' | 'high';
}

// ==================== Agent Results ====================

export interface AgentResult {
    stepId: string;
    agentType: AgentType;
    success: boolean;
    output: any;
    duration: number; // actual time taken in seconds
    requiresReplanning?: boolean;
    issues?: Issue[];
    suggestions?: string[];
    confidence?: number; // 0-1 score
}

export interface Issue {
    severity: 'critical' | 'major' | 'minor';
    description: string;
    location?: string;
    suggestedFix?: string;
}

// ==================== Context ====================

export interface AgentContext {
    previousResults: AgentResult[];
    memory: MemoryProjectContext;
    userPreferences?: UserPreferences;
    currentStep: ExecutionStep;
    plan: ExecutionPlan;
}

export interface UserPreferences {
    codingStyle?: any;
    frameworks?: string[];
    avoidPatterns?: string[];
    prioritizeSpeed?: boolean;
}

// ==================== Agent Capabilities ====================

export interface AgentCapability {
    name: string;
    description: string;
    confidence: number; // How good the agent is at this (0-1)
}

export interface AgentMetadata {
    type: AgentType;
    name: string;
    specialty: string;
    capabilities: AgentCapability[];
    preferredModel: string;
    fallbackModel?: string;
}

// ==================== Orchestration ====================

export interface OrchestrationResult {
    taskId: string;
    success: boolean;
    results: AgentResult[];
    finalOutput: any;
    totalDuration: number;
    stepsCompleted: number;
    stepsTotal: number;
    quality: QualityMetrics;
}

export interface QualityMetrics {
    codeQuality?: number; // 0-1
    testCoverage?: number; // 0-100%
    securityScore?: number; // 0-1
    performanceScore?: number; // 0-1
    overallScore: number; // 0-1
}

// ==================== Agent Communication ====================

export interface AgentConsultation {
    from: AgentType;
    to: AgentType;
    question: string;
    context?: any;
}

export interface AgentResponse {
    from: AgentType;
    answer: string;
    confidence: number;
    additionalInfo?: any;
}

// ==================== Progress & Events ====================

export interface ExecutionProgress {
    taskId: string;
    currentStep: number;
    totalSteps: number;
    currentAgent: AgentType;
    status: 'planning' | 'executing' | 'reviewing' | 'complete' | 'failed';
    message: string;
    percentage: number;
}

export interface AgentEvent {
    type: 'step_start' | 'step_complete' | 'step_failed' | 'replanning' | 'consultation';
    timestamp: Date;
    agentType: AgentType;
    stepId?: string;
    message: string;
    data?: any;
}

// ==================== Specialized Agent Outputs ====================

export interface ArchitectureOutput {
    components: Component[];
    dataModels: DataModel[];
    apiEndpoints: APIEndpoint[];
    techStack: TechStack;
    rationale: string;
    diagrams?: string[];
}

export interface Component {
    name: string;
    type: 'service' | 'library' | 'utility' | 'component';
    responsibilities: string[];
    dependencies: string[];
}

export interface DataModel {
    name: string;
    fields: Field[];
    relationships: Relationship[];
    indexes?: string[];
}

export interface Field {
    name: string;
    type: string;
    required: boolean;
    validation?: string;
}

export interface Relationship {
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    target: string;
    foreignKey?: string;
}

export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    authentication: boolean;
    requestBody?: any;
    responseBody?: any;
}

export interface TechStack {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    infrastructure?: string[];
    testing?: string[];
}

export interface CodeOutput {
    files: CodeFile[];
    tests: TestFile[];
    documentation: string;
    dependencies: Dependency[];
}

export interface CodeFile {
    path: string;
    name: string;
    content: string;
    language: string;
}

export interface TestFile {
    path: string;
    name: string;
    content: string;
    framework: string;
}

export interface Dependency {
    name: string;
    version: string;
    type: 'production' | 'development';
}

export interface ReviewOutput {
    approved: boolean;
    issues: Issue[];
    improvements: string[];
    securityFindings: SecurityFinding[];
    performanceNotes: string[];
    overallScore: number;
}

export interface SecurityFinding {
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    description: string;
    location: string;
    recommendation: string;
}

export interface DebugOutput {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    bugs: Bug[];
    fixes: Fix[];
    coverage?: number;
}

export interface Bug {
    severity: 'critical' | 'major' | 'minor';
    description: string;
    location: string;
    reproduction: string;
    rootCause?: string;
}

export interface Fix {
    bugId: string;
    description: string;
    changes: CodeFile[];
    verified: boolean;
}

export interface DevOpsOutput {
    infrastructure: InfrastructureConfig;
    cicd: CICDConfig;
    monitoring: MonitoringConfig;
    deployment: DeploymentConfig;
}

export interface InfrastructureConfig {
    platform: string;
    resources: any[];
    networking: any;
    security: any;
}

export interface CICDConfig {
    pipeline: PipelineStage[];
    triggers: string[];
    notifications: string[];
}

export interface PipelineStage {
    name: string;
    steps: string[];
    conditions?: string[];
}

export interface MonitoringConfig {
    metrics: string[];
    alerts: Alert[];
    logging: any;
}

export interface Alert {
    name: string;
    condition: string;
    severity: 'critical' | 'warning' | 'info';
    action: string;
}

export interface DeploymentConfig {
    environment: string;
    strategy: 'blue-green' | 'rolling' | 'canary';
    rollback: boolean;
    healthChecks: string[];
}

export interface DesignOutput {
    components: UIComponent[];
    designSystem: DesignSystem;
    accessibility: AccessibilityReport;
    assets: Asset[];
}

export interface UIComponent {
    name: string;
    type: string;
    props: ComponentProp[];
    states: string[];
    variants: string[];
}

export interface ComponentProp {
    name: string;
    type: string;
    required: boolean;
    default?: any;
}

export interface DesignSystem {
    colors: ColorPalette;
    typography: Typography;
    spacing: number[];
    breakpoints: Breakpoint[];
}

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    [key: string]: string;
}

export interface Typography {
    fontFamily: string;
    sizes: { [key: string]: string };
    weights: { [key: string]: number };
}

export interface Breakpoint {
    name: string;
    minWidth: number;
}

export interface AccessibilityReport {
    score: number;
    issues: string[];
    recommendations: string[];
    wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface Asset {
    type: 'image' | 'icon' | 'animation';
    name: string;
    path: string;
    format: string;
}
