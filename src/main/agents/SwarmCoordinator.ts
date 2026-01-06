/**
 * 🐝 SwarmCoordinator - True Agentic Swarm System
 * 
 * Grok's Recommendation: Replace single AgentCoordinator with multi-agent swarm
 * 
 * 7 Fixed Roles:
 * 1. ProductManagerAgent - Requirements & prioritization
 * 2. ArchitectAgent - System design & patterns
 * 3. TechLeadAgent - Technical decisions & code review
 * 4. DeveloperAgent - Implementation
 * 5. TesterAgent - Quality assurance
 * 6. DevOpsAgent - Infrastructure & deployment
 * 7. SecurityEngineerAgent - Security audits
 */

import { EventEmitter } from 'events';
import { UnifiedReasoner } from '../ai/UnifiedReasoner';

// Types
export type AgentRole =
    | 'product_manager'
    | 'architect'
    | 'tech_lead'
    | 'developer'
    | 'tester'
    | 'devops'
    | 'security_engineer';

export interface SwarmTask {
    id: string;
    title: string;
    description: string;
    requester: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'review' | 'completed' | 'failed';
    assignedAgents: AgentRole[];
    context: Record<string, unknown>;
    results: AgentResult[];
    createdAt: Date;
    completedAt?: Date;
}

export interface AgentResult {
    agent: AgentRole;
    output: string;
    artifacts: string[];
    confidence: number;
    duration: number;
    recommendations: string[];
}

export interface SwarmDecision {
    decision: string;
    confidence: number;
    votes: Map<AgentRole, string>;
    reasoning: string;
}

export class SwarmCoordinator extends EventEmitter {
    private static instance: SwarmCoordinator;
    private reasoner: UnifiedReasoner;
    private activeTasks: Map<string, SwarmTask> = new Map();
    private agentStates: Map<AgentRole, 'idle' | 'busy' | 'waiting'> = new Map();

    private constructor() {
        super();
        this.reasoner = UnifiedReasoner.getInstance();
        this.initializeAgents();
    }

    static getInstance(): SwarmCoordinator {
        if (!SwarmCoordinator.instance) {
            SwarmCoordinator.instance = new SwarmCoordinator();
        }
        return SwarmCoordinator.instance;
    }

    private initializeAgents(): void {
        const roles: AgentRole[] = [
            'product_manager',
            'architect',
            'tech_lead',
            'developer',
            'tester',
            'devops',
            'security_engineer'
        ];

        roles.forEach(role => {
            this.agentStates.set(role, 'idle');
        });

        console.log('🐝 Swarm initialized with 7 agents');
    }

    /**
     * Execute a full swarm workflow on a task
     */
    async executeSwarm(task: SwarmTask): Promise<SwarmTask> {
        this.emit('swarm:start', { taskId: task.id });
        this.activeTasks.set(task.id, task);

        try {
            // Phase 1: Product Manager analyzes requirements
            const pmResult = await this.runAgent('product_manager', task, {
                goal: 'Analyze requirements and create user stories',
                context: task.description
            });
            task.results.push(pmResult);

            // Phase 2: Architect designs solution
            const archResult = await this.runAgent('architect', task, {
                goal: 'Design system architecture and component breakdown',
                context: pmResult.output
            });
            task.results.push(archResult);

            // Phase 3: Tech Lead reviews and creates implementation plan
            const tlResult = await this.runAgent('tech_lead', task, {
                goal: 'Review architecture and create detailed implementation plan',
                context: archResult.output
            });
            task.results.push(tlResult);

            // Phase 4: Security Engineer audits the plan
            const secResult = await this.runAgent('security_engineer', task, {
                goal: 'Security audit of proposed design',
                context: `${archResult.output}\n${tlResult.output}`
            });
            task.results.push(secResult);

            // Phase 5: Developer implements (parallel if multiple)
            const devResult = await this.runAgent('developer', task, {
                goal: 'Implement the solution according to the plan',
                context: tlResult.output,
                security: secResult.recommendations
            });
            task.results.push(devResult);

            // Phase 6: Tester verifies
            const testResult = await this.runAgent('tester', task, {
                goal: 'Test the implementation thoroughly',
                context: devResult.output
            });
            task.results.push(testResult);

            // Phase 7: DevOps prepares deployment
            const opsResult = await this.runAgent('devops', task, {
                goal: 'Prepare deployment configuration',
                context: devResult.output
            });
            task.results.push(opsResult);

            // Final consensus
            const consensus = await this.achieveConsensus(task);

            task.status = consensus.confidence >= 0.8 ? 'completed' : 'review';
            task.completedAt = new Date();

            this.emit('swarm:complete', { taskId: task.id, consensus });

        } catch (error) {
            task.status = 'failed';
            this.emit('swarm:error', { taskId: task.id, error });
        }

        return task;
    }

    /**
     * Run a single agent with the UnifiedReasoner
     */
    private async runAgent(
        role: AgentRole,
        task: SwarmTask,
        context: Record<string, unknown>
    ): Promise<AgentResult> {
        this.agentStates.set(role, 'busy');
        this.emit('agent:start', { role, taskId: task.id });

        const startTime = Date.now();

        const agentPrompt = this.buildAgentPrompt(role, task, context);

        const plan = await this.reasoner.think({
            id: `${task.id}_${role}`,
            description: agentPrompt,
            context: JSON.stringify(context),
            priority: task.priority
        });

        const duration = Date.now() - startTime;

        const result: AgentResult = {
            agent: role,
            output: plan.steps.map(s => s.action).join('\n'),
            artifacts: [],
            confidence: plan.confidence,
            duration,
            recommendations: plan.risks.map(r => r.mitigation)
        };

        this.agentStates.set(role, 'idle');
        this.emit('agent:complete', { role, taskId: task.id, result });

        return result;
    }

    /**
     * Build role-specific prompts
     */
    private buildAgentPrompt(role: AgentRole, task: SwarmTask, context: Record<string, unknown>): string {
        const rolePrompts: Record<AgentRole, string> = {
            product_manager: `
You are a Product Manager. Your job is to:
- Analyze user requirements
- Break down into user stories
- Prioritize features
- Define acceptance criteria

Task: ${task.title}
Description: ${task.description}

Provide structured user stories with acceptance criteria.
`,
            architect: `
You are a System Architect. Your job is to:
- Design system architecture
- Choose appropriate patterns
- Define component boundaries
- Plan for scalability

Previous context: ${JSON.stringify(context)}

Provide a detailed architecture design with diagrams (in mermaid format).
`,
            tech_lead: `
You are a Tech Lead. Your job is to:
- Review architectural decisions
- Create implementation plans
- Define coding standards
- Plan code reviews

Previous context: ${JSON.stringify(context)}

Provide a detailed implementation plan with task breakdown.
`,
            developer: `
You are a Senior Developer. Your job is to:
- Implement features according to plan
- Write clean, maintainable code
- Follow best practices
- Document your code

Implementation plan: ${JSON.stringify(context)}

Provide the implementation code with inline documentation.
`,
            tester: `
You are a QA Engineer. Your job is to:
- Design test strategies
- Write test cases
- Perform testing
- Report issues

Implementation to test: ${JSON.stringify(context)}

Provide test cases and testing strategy.
`,
            devops: `
You are a DevOps Engineer. Your job is to:
- Design CI/CD pipelines
- Configure infrastructure
- Set up monitoring
- Plan deployments

Code to deploy: ${JSON.stringify(context)}

Provide deployment configuration and pipeline definition.
`,
            security_engineer: `
You are a Security Engineer. Your job is to:
- Audit for vulnerabilities
- Review security patterns
- Check compliance
- Recommend mitigations

Design to audit: ${JSON.stringify(context)}

Provide security audit report with recommendations.
`
        };

        return rolePrompts[role];
    }

    /**
     * Achieve consensus among all agents
     */
    private async achieveConsensus(task: SwarmTask): Promise<SwarmDecision> {
        const votes = new Map<AgentRole, string>();
        let totalConfidence = 0;

        for (const result of task.results) {
            votes.set(result.agent, result.output);
            totalConfidence += result.confidence;
        }

        const avgConfidence = totalConfidence / task.results.length;

        // Check for significant disagreements
        const disagreements = task.results.filter(r => r.confidence < 0.7);

        return {
            decision: disagreements.length === 0 ? 'approved' : 'needs_review',
            confidence: avgConfidence,
            votes,
            reasoning: disagreements.length > 0
                ? `${disagreements.length} agents have concerns`
                : 'All agents agree on the approach'
        };
    }

    /**
     * Quick task execution with minimal agents
     */
    async quickExecute(description: string): Promise<string> {
        const task: SwarmTask = {
            id: `quick_${Date.now()}`,
            title: 'Quick Task',
            description,
            requester: 'user',
            priority: 'medium',
            status: 'pending',
            assignedAgents: ['developer'],
            context: {},
            results: [],
            createdAt: new Date()
        };

        const result = await this.runAgent('developer', task, {
            goal: 'Complete this task quickly',
            context: description
        });

        return result.output;
    }

    /**
     * Full project execution (all 7 agents)
     */
    async executeProject(projectDescription: string): Promise<SwarmTask> {
        const task: SwarmTask = {
            id: `project_${Date.now()}`,
            title: 'Full Project',
            description: projectDescription,
            requester: 'user',
            priority: 'high',
            status: 'pending',
            assignedAgents: [
                'product_manager',
                'architect',
                'tech_lead',
                'developer',
                'tester',
                'devops',
                'security_engineer'
            ],
            context: {},
            results: [],
            createdAt: new Date()
        };

        return this.executeSwarm(task);
    }

    /**
     * Get swarm status
     */
    getStatus(): { agents: Map<AgentRole, string>; activeTasks: number } {
        return {
            agents: this.agentStates,
            activeTasks: this.activeTasks.size
        };
    }
}

export const swarmCoordinator = SwarmCoordinator.getInstance();
