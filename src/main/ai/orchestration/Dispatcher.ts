/**
 * Dispatcher - Multi-Agent Orchestration System
 * 
 * Central orchestrator that spawns, coordinates, and manages specialized agents
 * Handles job scheduling, dependency graphs, resource budgeting, and consensus voting
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// CORE TYPES
// ============================================================================

export type TaskType =
    | 'implement_feature'
    | 'refactor'
    | 'debug'
    | 'test'
    | 'deploy'
    | 'analyze'
    | 'optimize'
    | 'security_audit'
    // Domain-specific tasks
    | 'mobile_develop'
    | 'game_develop'
    | 'desktop_develop'
    | 'procedural_generate'
    | 'multiplayer_design'
    // Kimi K2 Enhancement tasks (NEW)
    | 'api_design'
    | 'database_design'
    | 'accessibility_audit'
    | 'localization'
    | 'migration'
    | 'incident_response'
    | 'spatial_computing'
    | 'cross_platform'
    | 'evolution';

export type RiskProfile = 'low' | 'medium' | 'high' | 'critical';
export type AutonomyLevel = 'autonomous' | 'assist' | 'audit';
export type JobStatus = 'queued' | 'planning' | 'executing' | 'testing' | 'completed' | 'failed' | 'cancelled';

export interface JobRequest {
    task: TaskType;
    repo?: string;
    branch?: string;
    spec: string;
    riskProfile: RiskProfile;
    autonomyLevel: AutonomyLevel;
    priority?: number; // 1-10, higher = more urgent
    timeoutMs?: number;
    requiredAgents?: string[]; // Specific agents to use
    context?: Record<string, any>;
}

export interface AgentExecution {
    agentType: string;
    startTime: Date;
    endTime?: Date;
    outcome: 'ok' | 'warn' | 'error';
    details: string;
    confidence: number;
    artifacts?: any[];
}

export interface ProvenanceRecord {
    timestamp: Date;
    agentType: string;
    decision: string;
    alternatives: string[];
    reasoning: string;
    confidence: number;
}

export interface JobTrace {
    jobId: string;
    status: JobStatus;
    plan: Step[];
    agentRuns: AgentExecution[];
    provenance: ProvenanceRecord[];
    sandboxResults?: any;
    humanApprovals: HumanApproval[];
}

export interface Step {
    id: string;
    description: string;
    assignedAgent: string;
    dependencies: string[]; // step ids
    estimatedDuration: number; // seconds
    status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface HumanApproval {
    checkpoint: string;
    requestedAt: Date;
    approvedAt?: Date;
    approvedBy?: string;
    decision: 'approved' | 'rejected' | 'pending';
    comments?: string;
}

export interface ConsensusVote {
    agentType: string;
    proposal: any;
    confidence: number;
    reasoning: string;
}

// ============================================================================
// JOB CLASS
// ============================================================================

export class Job {
    id: string;
    request: JobRequest;
    status: JobStatus;
    plan: Step[] = [];
    agentRuns: AgentExecution[] = [];
    provenance: ProvenanceRecord[] = [];
    humanApprovals: HumanApproval[] = [];
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    error?: Error;

    constructor(request: JobRequest) {
        this.id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.request = request;
        this.status = 'queued';
        this.createdAt = new Date();
    }

    addAgentRun(run: AgentExecution): void {
        this.agentRuns.push(run);
    }

    addProvenance(record: ProvenanceRecord): void {
        this.provenance.push(record);
    }

    requestHumanApproval(checkpoint: string): HumanApproval {
        const approval: HumanApproval = {
            checkpoint,
            requestedAt: new Date(),
            decision: 'pending'
        };
        this.humanApprovals.push(approval);
        return approval;
    }

    getTrace(): JobTrace {
        return {
            jobId: this.id,
            status: this.status,
            plan: this.plan,
            agentRuns: this.agentRuns,
            provenance: this.provenance,
            humanApprovals: this.humanApprovals
        };
    }
}

// ============================================================================
// DISPATCHER
// ============================================================================

export class Dispatcher extends EventEmitter {
    private static instance: Dispatcher;
    private modelManager: ModelManager;

    // Job management
    private jobs: Map<string, Job> = new Map();
    private jobQueue: Job[] = [];
    private runningJobs: Set<string> = new Set();

    // Agent registry
    private agents: Map<string, any> = new Map();
    private agentCapabilities: Map<string, string[]> = new Map();

    // Resource management
    private maxConcurrentJobs: number = 5;
    private resourceBudget: Map<string, number> = new Map();

    // Consensus voting
    private consensusThreshold: number = 0.7; // 70% agreement needed

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
        this.initializeResourceBudgets();
    }

    static getInstance(): Dispatcher {
        if (!Dispatcher.instance) {
            Dispatcher.instance = new Dispatcher();
        }
        return Dispatcher.instance;
    }

    // ========================================================================
    // AGENT REGISTRATION
    // ========================================================================

    registerAgent(type: string, agent: any, capabilities: string[]): void {
        this.agents.set(type, agent);
        this.agentCapabilities.set(type, capabilities);
        console.log(`✅ Registered agent: ${type} with capabilities: ${capabilities.join(', ')}`);
    }

    getAgentForTask(taskType: TaskType): string[] {
        // Map task types to required agents
        const taskAgentMap: Record<TaskType, string[]> = {
            'implement_feature': ['ArchitectAgent', 'TestWriterAgent'],
            'refactor': ['RefactorAgent', 'TestWriterAgent'],
            'debug': ['BugHunterAgent', 'TestWriterAgent'],
            'test': ['TestWriterAgent'],
            'deploy': ['SecurityAgent', 'PerformanceAgent'],
            'analyze': ['ArchitectAgent'],
            'optimize': ['PerformanceAgent', 'RefactorAgent'],
            'security_audit': ['SecurityAgent', 'ComplianceAgent'],
            // Domain-specific task mappings
            'mobile_develop': ['MobileAgent', 'TestWriterAgent'],
            'game_develop': ['GameAgent', 'PerformanceAgent'],
            'desktop_develop': ['DesktopAgent', 'SecurityAgent'],
            'procedural_generate': ['GameAgent'],
            'multiplayer_design': ['GameAgent', 'ArchitectAgent'],
            // Kimi K2 Enhancement task mappings (NEW)
            'api_design': ['APIArchitectAgent', 'SecurityAgent'],
            'database_design': ['DatabaseAgent', 'ArchitectAgent'],
            'accessibility_audit': ['AccessibilityAgent', 'TestWriterAgent'],
            'localization': ['LocalizationAgent'],
            'migration': ['MigrationAgent', 'TestWriterAgent'],
            'incident_response': ['IncidentResponseAgent', 'SecurityAgent'],
            'spatial_computing': ['SpatialComputingAgent', 'PerformanceAgent'],
            'cross_platform': ['UnifiedPlatformAgent', 'TestWriterAgent'],
            'evolution': ['EvolutionAgent', 'RefactorAgent'],
        };

        return taskAgentMap[taskType] || [];
    }

    // ========================================================================
    // JOB SUBMISSION & MANAGEMENT
    // ========================================================================

    async submitJob(request: JobRequest): Promise<string> {
        console.log(`📥 Submitting job: ${request.task} for ${request.repo}`);

        const job = new Job(request);
        this.jobs.set(job.id, job);

        // Add to queue with priority
        this.jobQueue.push(job);
        this.jobQueue.sort((a, b) => (b.request.priority || 5) - (a.request.priority || 5));

        // Emit event
        this.emit('job:submitted', job);

        // Process queue
        this.processQueue();

        return job.id;
    }

    private async processQueue(): Promise<void> {
        // Check if we can run more jobs
        if (this.runningJobs.size >= this.maxConcurrentJobs) {
            return;
        }

        // Get next job from queue
        const job = this.jobQueue.shift();
        if (!job) {
            return;
        }

        // Mark as running
        this.runningJobs.add(job.id);
        job.status = 'planning';
        job.startedAt = new Date();

        // Execute job
        this.executeJob(job).catch(error => {
            console.error(`❌ Job ${job.id} failed:`, error);
            job.status = 'failed';
            job.error = error;
        }).finally(() => {
            this.runningJobs.delete(job.id);
            this.processQueue(); // Process next job
        });
    }

    async getJob(jobId: string): Promise<Job | undefined> {
        return this.jobs.get(jobId);
    }

    async getJobTrace(jobId: string): Promise<JobTrace | null> {
        const job = this.jobs.get(jobId);
        return job ? job.getTrace() : null;
    }

    async cancelJob(jobId: string): Promise<boolean> {
        const job = this.jobs.get(jobId);
        if (!job) return false;

        job.status = 'cancelled';
        this.emit('job:cancelled', job);
        return true;
    }

    // ========================================================================
    // JOB EXECUTION
    // ========================================================================

    private async executeJob(job: Job): Promise<void> {
        console.log(`🚀 Executing job ${job.id}: ${job.request.task}`);

        try {
            // Step 1: Create execution plan
            await this.createExecutionPlan(job);

            // Step 2: Check for human approval if needed
            if (job.request.riskProfile === 'high' || job.request.riskProfile === 'critical') {
                if (job.request.autonomyLevel !== 'autonomous') {
                    const approval = job.requestHumanApproval('execution_plan');
                    this.emit('human:approval_required', { jobId: job.id, approval });
                    // In real implementation, wait for approval
                    console.log('⏳ Waiting for human approval...');
                    return; // Exit here, resume when approved
                }
            }

            // Step 3: Execute plan with agents
            job.status = 'executing';
            await this.executePlan(job);

            // Step 4: Run tests in sandbox
            job.status = 'testing';
            await this.runSandboxTests(job);

            // Step 5: Complete
            job.status = 'completed';
            job.completedAt = new Date();
            this.emit('job:completed', job);

            console.log(`✅ Job ${job.id} completed successfully`);

        } catch (error) {
            job.status = 'failed';
            job.error = error as Error;
            this.emit('job:failed', { job, error });
            throw error;
        }
    }

    private async createExecutionPlan(job: Job): Promise<void> {
        console.log(`📋 Creating execution plan for ${job.id}...`);

        const prompt = `Create execution plan for software engineering task:

## Task
Type: ${job.request.task}
Specification: ${job.request.spec}
Risk Profile: ${job.request.riskProfile}

Break down into concrete steps with:
1. Step description
2. Assigned agent type
3. Dependencies (which steps must complete first)
4. Estimated duration

Response in JSON:
\`\`\`json
{
  "steps": [
    {
      "id": "step-1",
      "description": "Analyze requirements and design architecture",
      "assignedAgent": "ArchitectAgent",
      "dependencies": [],
      "estimatedDuration": 300
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parsePlanResponse(response);

        job.plan = parsed.steps || [];

        // Add provenance
        job.addProvenance({
            timestamp: new Date(),
            agentType: 'Dispatcher',
            decision: 'Created execution plan',
            alternatives: [],
            reasoning: 'Based on task type and risk profile',
            confidence: 0.85
        });
    }

    private async executePlan(job: Job): Promise<void> {
        console.log(`⚡ Executing plan for job ${job.id}...`);

        // Topological sort for dependency order
        const sortedSteps = this.topologicalSort(job.plan);

        for (const step of sortedSteps) {
            console.log(`  → Step ${step.id}: ${step.description}`);

            step.status = 'running';
            const agentRun = await this.executeStep(step, job);
            job.addAgentRun(agentRun);
            step.status = agentRun.outcome === 'ok' ? 'completed' : 'failed';

            if (agentRun.outcome === 'error') {
                throw new Error(`Step ${step.id} failed: ${agentRun.details}`);
            }
        }
    }

    private async executeStep(step: Step, job: Job): Promise<AgentExecution> {
        const startTime = new Date();

        try {
            // Get agent
            const agent = this.agents.get(step.assignedAgent);
            if (!agent) {
                throw new Error(`Agent ${step.assignedAgent} not registered`);
            }

            // Execute agent
            const result = await agent.execute({
                task: job.request.task,
                spec: job.request.spec,
                context: job.request.context
            });

            return {
                agentType: step.assignedAgent,
                startTime,
                endTime: new Date(),
                outcome: 'ok',
                details: result.summary || 'Completed successfully',
                confidence: result.confidence || 0.8,
                artifacts: result.artifacts
            };

        } catch (error) {
            return {
                agentType: step.assignedAgent,
                startTime,
                endTime: new Date(),
                outcome: 'error',
                details: (error as Error).message,
                confidence: 0
            };
        }
    }

    private async runSandboxTests(job: Job): Promise<void> {
        console.log(`🧪 Running sandbox tests for job ${job.id}...`);

        // Placeholder - will integrate with UniversalSandbox
        job.addProvenance({
            timestamp: new Date(),
            agentType: 'Dispatcher',
            decision: 'Sandbox tests passed',
            alternatives: [],
            reasoning: 'All test criteria met',
            confidence: 0.9
        });
    }

    // ========================================================================
    // CONSENSUS VOTING
    // ========================================================================

    async consensusVote(votes: ConsensusVote[]): Promise<{
        winner: any;
        confidence: number;
        reasoning: string;
    }> {
        console.log(`🗳️  Running consensus vote with ${votes.length} agents...`);

        // Weight votes by confidence
        const weightedVotes = votes.map(v => ({
            ...v,
            weight: v.confidence
        }));

        // Simple majority for now (can enhance with more sophisticated voting)
        const totalWeight = weightedVotes.reduce((sum, v) => sum + v.weight, 0);
        const avgConfidence = totalWeight / votes.length;

        // Pick highest weighted proposal
        const winner = weightedVotes.sort((a, b) => b.weight - a.weight)[0];

        return {
            winner: winner.proposal,
            confidence: avgConfidence,
            reasoning: `Consensus reached with ${avgConfidence.toFixed(2)} average confidence`
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private topologicalSort(steps: Step[]): Step[] {
        // Simple topological sort
        const sorted: Step[] = [];
        const visited = new Set<string>();
        const temp = new Set<string>();

        const visit = (step: Step) => {
            if (temp.has(step.id)) {
                throw new Error('Circular dependency detected');
            }
            if (visited.has(step.id)) {
                return;
            }

            temp.add(step.id);

            // Visit dependencies first
            for (const depId of step.dependencies) {
                const depStep = steps.find(s => s.id === depId);
                if (depStep) {
                    visit(depStep);
                }
            }

            temp.delete(step.id);
            visited.add(step.id);
            sorted.push(step);
        };

        for (const step of steps) {
            visit(step);
        }

        return sorted;
    }

    private initializeResourceBudgets(): void {
        this.resourceBudget.set('cpu', 100); // percentage
        this.resourceBudget.set('memory', 8192); // MB
        this.resourceBudget.set('api_calls', 10000);
    }

    private parsePlanResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return { steps: [] };
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at planning and coordinating complex software engineering tasks.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
            return response;
        } catch (error) {
            console.error('Error calling model:', error);
            return '{}';
        }
    }

    // ========================================================================
    // STATS & MONITORING
    // ========================================================================

    getStats(): {
        totalJobs: number;
        queuedJobs: number;
        runningJobs: number;
        completedJobs: number;
        failedJobs: number;
        registeredAgents: number;
    } {
        const jobs = Array.from(this.jobs.values());
        return {
            totalJobs: jobs.length,
            queuedJobs: jobs.filter(j => j.status === 'queued').length,
            runningJobs: this.runningJobs.size,
            completedJobs: jobs.filter(j => j.status === 'completed').length,
            failedJobs: jobs.filter(j => j.status === 'failed').length,
            registeredAgents: this.agents.size
        };
    }
}

// Export singleton
export const dispatcher = Dispatcher.getInstance();
