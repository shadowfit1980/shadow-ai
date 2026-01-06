/**
 * Multi-Agent Orchestrator
 * 
 * Enables coordinated agent collaboration:
 * - Architect designs → Builder implements → Debugger validates
 * - Parallel execution with result merging
 * - Consensus-based decision making
 * - Workflow pipelines
 */

import { EventEmitter } from 'events';

export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    inputTypes: string[];
    outputTypes: string[];
}

export interface AgentInstance {
    id: string;
    type: AgentType;
    name: string;
    status: 'idle' | 'working' | 'completed' | 'error';
    capabilities: AgentCapability[];
    currentTask?: string;
    lastResult?: any;
}

export type AgentType =
    | 'architect'    // System design and planning
    | 'builder'      // Code implementation
    | 'debugger'     // Testing and debugging
    | 'reviewer'     // Code review
    | 'documenter'   // Documentation
    | 'optimizer'    // Performance optimization
    | 'security';    // Security analysis

export interface WorkflowStep {
    id: string;
    agentType: AgentType;
    action: string;
    input?: any;
    dependsOn?: string[];
    timeout?: number;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    results: Map<string, WorkflowStepResult>;
    createdAt: Date;
    completedAt?: Date;
}

export interface WorkflowStepResult {
    stepId: string;
    agentId: string;
    status: 'success' | 'failure' | 'timeout';
    output: any;
    duration: number;
    errors?: string[];
}

export interface ConsensusResult {
    decision: any;
    votes: { agentId: string; vote: any; confidence: number }[];
    consensus: boolean;
    agreementLevel: number;
}

/**
 * MultiAgentOrchestrator coordinates multiple agents
 */
export class MultiAgentOrchestrator extends EventEmitter {
    private static instance: MultiAgentOrchestrator;
    private agents: Map<string, AgentInstance> = new Map();
    private workflows: Map<string, Workflow> = new Map();
    private defaultAgents: AgentInstance[] = [];

    private constructor() {
        super();
        this.initializeDefaultAgents();
    }

    static getInstance(): MultiAgentOrchestrator {
        if (!MultiAgentOrchestrator.instance) {
            MultiAgentOrchestrator.instance = new MultiAgentOrchestrator();
        }
        return MultiAgentOrchestrator.instance;
    }

    /**
     * Initialize default agent types
     */
    private initializeDefaultAgents(): void {
        this.defaultAgents = [
            {
                id: 'architect-1',
                type: 'architect',
                name: 'Shadow Architect',
                status: 'idle',
                capabilities: [
                    { id: 'design', name: 'System Design', description: 'Design system architecture', inputTypes: ['requirements'], outputTypes: ['design', 'plan'] },
                    { id: 'plan', name: 'Task Planning', description: 'Break down tasks', inputTypes: ['task'], outputTypes: ['steps', 'plan'] },
                ],
            },
            {
                id: 'builder-1',
                type: 'builder',
                name: 'Shadow Builder',
                status: 'idle',
                capabilities: [
                    { id: 'implement', name: 'Code Implementation', description: 'Implement code from design', inputTypes: ['design', 'plan'], outputTypes: ['code'] },
                    { id: 'generate', name: 'Code Generation', description: 'Generate code from prompt', inputTypes: ['prompt'], outputTypes: ['code'] },
                ],
            },
            {
                id: 'debugger-1',
                type: 'debugger',
                name: 'Shadow Debugger',
                status: 'idle',
                capabilities: [
                    { id: 'test', name: 'Testing', description: 'Test code for bugs', inputTypes: ['code'], outputTypes: ['test-results'] },
                    { id: 'debug', name: 'Debugging', description: 'Find and fix bugs', inputTypes: ['code', 'error'], outputTypes: ['fix'] },
                ],
            },
            {
                id: 'reviewer-1',
                type: 'reviewer',
                name: 'Shadow Reviewer',
                status: 'idle',
                capabilities: [
                    { id: 'review', name: 'Code Review', description: 'Review code quality', inputTypes: ['code'], outputTypes: ['review-results'] },
                ],
            },
            {
                id: 'documenter-1',
                type: 'documenter',
                name: 'Shadow Documenter',
                status: 'idle',
                capabilities: [
                    { id: 'document', name: 'Documentation', description: 'Generate documentation', inputTypes: ['code'], outputTypes: ['docs'] },
                ],
            },
            {
                id: 'optimizer-1',
                type: 'optimizer',
                name: 'Shadow Optimizer',
                status: 'idle',
                capabilities: [
                    { id: 'optimize', name: 'Optimization', description: 'Optimize performance', inputTypes: ['code'], outputTypes: ['optimized-code'] },
                ],
            },
            {
                id: 'security-1',
                type: 'security',
                name: 'Shadow Security',
                status: 'idle',
                capabilities: [
                    { id: 'scan', name: 'Security Scan', description: 'Scan for vulnerabilities', inputTypes: ['code'], outputTypes: ['security-report'] },
                ],
            },
        ];

        for (const agent of this.defaultAgents) {
            this.agents.set(agent.id, agent);
        }

        console.log(`👥 [MultiAgentOrchestrator] Initialized with ${this.agents.size} agents`);
    }

    /**
     * Create a workflow
     */
    createWorkflow(params: {
        name: string;
        description: string;
        steps: Omit<WorkflowStep, 'id'>[];
    }): Workflow {
        const workflow: Workflow = {
            id: `wf-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: params.name,
            description: params.description,
            steps: params.steps.map((step, i) => ({
                ...step,
                id: `step-${i + 1}`,
            })),
            status: 'pending',
            results: new Map(),
            createdAt: new Date(),
        };

        this.workflows.set(workflow.id, workflow);
        this.emit('workflow:created', workflow);

        return workflow;
    }

    /**
     * Execute a workflow
     */
    async executeWorkflow(workflowId: string): Promise<Workflow> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        workflow.status = 'running';
        this.emit('workflow:started', workflow);

        const completed = new Set<string>();
        const stepQueue = [...workflow.steps];

        while (stepQueue.length > 0) {
            // Find steps that can run (dependencies met)
            const runnableSteps = stepQueue.filter(step => {
                if (!step.dependsOn || step.dependsOn.length === 0) {
                    return true;
                }
                return step.dependsOn.every(depId => completed.has(depId));
            });

            if (runnableSteps.length === 0 && stepQueue.length > 0) {
                // Deadlock - circular dependencies
                workflow.status = 'failed';
                this.emit('workflow:failed', { workflow, reason: 'Circular dependencies detected' });
                return workflow;
            }

            // Execute runnable steps in parallel
            const results = await Promise.all(
                runnableSteps.map(step => this.executeStep(workflow, step))
            );

            // Mark completed
            for (const step of runnableSteps) {
                completed.add(step.id);
                const index = stepQueue.indexOf(step);
                if (index > -1) stepQueue.splice(index, 1);
            }

            // Check for failures
            const failures = results.filter(r => r.status === 'failure');
            if (failures.length > 0) {
                workflow.status = 'failed';
                this.emit('workflow:failed', { workflow, failures });
                return workflow;
            }
        }

        workflow.status = 'completed';
        workflow.completedAt = new Date();
        this.emit('workflow:completed', workflow);

        return workflow;
    }

    /**
     * Execute a single workflow step
     */
    private async executeStep(workflow: Workflow, step: WorkflowStep): Promise<WorkflowStepResult> {
        const startTime = Date.now();

        // Find an available agent of the required type
        const agent = this.findAvailableAgent(step.agentType);
        if (!agent) {
            return {
                stepId: step.id,
                agentId: '',
                status: 'failure',
                output: null,
                duration: 0,
                errors: [`No available agent of type: ${step.agentType}`],
            };
        }

        agent.status = 'working';
        agent.currentTask = step.action;
        this.emit('step:started', { workflow, step, agent });

        try {
            // Gather input from dependencies
            let input = step.input || {};
            if (step.dependsOn) {
                for (const depId of step.dependsOn) {
                    const depResult = workflow.results.get(depId);
                    if (depResult) {
                        input = { ...input, [depId]: depResult.output };
                    }
                }
            }

            // Simulate agent execution (in real implementation, call actual agent)
            const output = await this.simulateAgentExecution(agent, step.action, input);

            const duration = Date.now() - startTime;
            const result: WorkflowStepResult = {
                stepId: step.id,
                agentId: agent.id,
                status: 'success',
                output,
                duration,
            };

            workflow.results.set(step.id, result);
            agent.status = 'idle';
            agent.currentTask = undefined;
            agent.lastResult = output;

            this.emit('step:completed', { workflow, step, result });
            return result;

        } catch (error: any) {
            const duration = Date.now() - startTime;
            const result: WorkflowStepResult = {
                stepId: step.id,
                agentId: agent.id,
                status: 'failure',
                output: null,
                duration,
                errors: [error.message],
            };

            workflow.results.set(step.id, result);
            agent.status = 'error';

            this.emit('step:failed', { workflow, step, error });
            return result;
        }
    }

    /**
     * Simulate agent execution
     */
    private async simulateAgentExecution(
        agent: AgentInstance,
        action: string,
        input: any
    ): Promise<any> {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Return simulated output based on agent type
        switch (agent.type) {
            case 'architect':
                return { plan: `Architecture plan for: ${JSON.stringify(input).substring(0, 100)}...`, components: ['ComponentA', 'ComponentB'] };
            case 'builder':
                return { code: `// Generated code\nfunction example() {\n  // Implementation\n}`, files: ['example.ts'] };
            case 'debugger':
                return { passed: true, testsRun: 10, coverage: 85 };
            case 'reviewer':
                return { score: 8.5, issues: [], suggestions: ['Consider adding types'] };
            case 'documenter':
                return { docs: '# Documentation\n\nGenerated documentation...' };
            case 'optimizer':
                return { optimized: true, improvement: '15% faster' };
            case 'security':
                return { vulnerabilities: 0, warnings: 2 };
            default:
                return { result: 'completed' };
        }
    }

    /**
     * Find an available agent of a type
     */
    private findAvailableAgent(type: AgentType): AgentInstance | undefined {
        for (const agent of this.agents.values()) {
            if (agent.type === type && agent.status === 'idle') {
                return agent;
            }
        }
        return undefined;
    }

    /**
     * Request consensus from multiple agents
     */
    async requestConsensus(params: {
        question: string;
        agentTypes: AgentType[];
        options: any[];
    }): Promise<ConsensusResult> {
        const votes: { agentId: string; vote: any; confidence: number }[] = [];

        for (const type of params.agentTypes) {
            const agent = this.findAvailableAgent(type);
            if (agent) {
                // Simulate voting (in real implementation, call actual agent)
                const randomIndex = Math.floor(Math.random() * params.options.length);
                votes.push({
                    agentId: agent.id,
                    vote: params.options[randomIndex],
                    confidence: 0.5 + Math.random() * 0.5,
                });
            }
        }

        // Count votes
        const voteCounts = new Map<string, number>();
        for (const vote of votes) {
            const key = JSON.stringify(vote.vote);
            voteCounts.set(key, (voteCounts.get(key) || 0) + 1);
        }

        // Find majority
        let maxVotes = 0;
        let decision = null;
        for (const [key, count] of voteCounts) {
            if (count > maxVotes) {
                maxVotes = count;
                decision = JSON.parse(key);
            }
        }

        const agreementLevel = votes.length > 0 ? maxVotes / votes.length : 0;

        return {
            decision,
            votes,
            consensus: agreementLevel >= 0.5,
            agreementLevel,
        };
    }

    /**
     * Create a common workflow template
     */
    createFeatureWorkflow(featureName: string): Workflow {
        return this.createWorkflow({
            name: `Feature: ${featureName}`,
            description: `Complete workflow for implementing ${featureName}`,
            steps: [
                { agentType: 'architect', action: 'design', input: { feature: featureName } },
                { agentType: 'builder', action: 'implement', dependsOn: ['step-1'] },
                { agentType: 'reviewer', action: 'review', dependsOn: ['step-2'] },
                { agentType: 'debugger', action: 'test', dependsOn: ['step-2'] },
                { agentType: 'documenter', action: 'document', dependsOn: ['step-2', 'step-3'] },
            ],
        });
    }

    // Public API
    getAgents(): AgentInstance[] { return [...this.agents.values()]; }
    getAgent(id: string): AgentInstance | undefined { return this.agents.get(id); }
    getWorkflow(id: string): Workflow | undefined { return this.workflows.get(id); }
    getWorkflows(): Workflow[] { return [...this.workflows.values()]; }
}

export default MultiAgentOrchestrator;
