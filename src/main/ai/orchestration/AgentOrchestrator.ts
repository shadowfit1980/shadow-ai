/**
 * Agent Orchestrator
 * 
 * Unified integration layer that connects all AI agent features:
 * - Plan/Act Controller
 * - Deep Context Engine
 * - GitHub Agent
 * - MCP Client
 * - Code Provenance
 * - Agent Memory
 * - Template Library
 * - Dev Server Manager
 * - Deployment Manager
 * - Testing Agent
 * - Framework Tools
 * 
 * This demonstrates how all modules work together seamlessly.
 */

import { EventEmitter } from 'events';
import { PlanActController, ExecutionPlan, PlanStep } from '../agentic/PlanActController';
import { DeepContextEngine } from '../context/DeepContextEngine';
import { GitHubAgent } from '../github/GitHubAgent';
import { MCPClient } from '../mcp/MCPClient';
import { CodeProvenance } from '../provenance/CodeProvenance';
import { AgentMemory } from '../memory/AgentMemory';
import { ModelManager } from '../ModelManager';

// New Enhancement Modules
import { toolChainExecutor } from '../tools/ToolChainExecutor';
import { agentHandoffManager } from '../agents/AgentHandoff';
import { contextCompressor } from '../context/ContextCompressor';
import { mctsPlanner } from '../reasoning/MCTSPlanner';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentTask {
    id: string;
    type: 'code_generation' | 'bug_fix' | 'refactor' | 'feature' | 'review' | 'deploy';
    description: string;
    context: Record<string, any>;
    status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed';
    plan?: ExecutionPlan;
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
}

export interface AgentCapabilities {
    planAct: boolean;
    deepContext: boolean;
    github: boolean;
    mcp: boolean;
    provenance: boolean;
    memory: boolean;
    // New capabilities
    toolChaining: boolean;
    agentHandoff: boolean;
    contextCompression: boolean;
    mctsPlanning: boolean;
}

// ============================================================================
// AGENT ORCHESTRATOR
// ============================================================================

export class AgentOrchestrator extends EventEmitter {
    private static instance: AgentOrchestrator;

    // Core modules
    private planActController: PlanActController;
    private contextEngine: DeepContextEngine;
    private githubAgent: GitHubAgent;
    private mcpClient: MCPClient;
    private provenance: CodeProvenance;
    private memory: AgentMemory;
    private modelManager: ModelManager;

    // State
    private currentTask: AgentTask | null = null;
    private taskHistory: AgentTask[] = [];
    private capabilities: AgentCapabilities;

    private constructor() {
        super();

        // Initialize all modules
        this.planActController = PlanActController.getInstance();
        this.contextEngine = DeepContextEngine.getInstance();
        this.githubAgent = GitHubAgent.getInstance();
        this.mcpClient = MCPClient.getInstance();
        this.provenance = CodeProvenance.getInstance();
        this.memory = AgentMemory.getInstance();
        this.modelManager = ModelManager.getInstance();

        // Check capabilities
        this.capabilities = {
            planAct: true,
            deepContext: true,
            github: true,
            mcp: true,
            provenance: true,
            memory: true,
            // New capabilities
            toolChaining: true,
            agentHandoff: true,
            contextCompression: true,
            mctsPlanning: true,
        };

        // Connect module events
        this.setupEventForwarding();
    }

    static getInstance(): AgentOrchestrator {
        if (!AgentOrchestrator.instance) {
            AgentOrchestrator.instance = new AgentOrchestrator();
        }
        return AgentOrchestrator.instance;
    }

    // ========================================================================
    // UNIFIED TASK EXECUTION
    // ========================================================================

    /**
     * Execute a task with full agent capabilities
     */
    async executeTask(task: Omit<AgentTask, 'id' | 'status'>): Promise<AgentTask> {
        const fullTask: AgentTask = {
            ...task,
            id: `task_${Date.now()}`,
            status: 'pending',
            startedAt: new Date(),
        };

        this.currentTask = fullTask;
        this.emit('task:started', fullTask);

        try {
            // Step 1: Gather deep context
            const context = await this.gatherContext(task.context.repoPath, task.description);
            fullTask.context = { ...fullTask.context, ...context };

            // Step 2: Recall relevant memories
            const memories = this.memory.recall(task.description, { limit: 5 });
            fullTask.context.memories = memories;

            // Step 3: Generate execution plan
            fullTask.status = 'planning';
            this.emit('task:planning', fullTask);

            const plan = await this.planActController.enterPlanMode(
                task.description,
                fullTask.context
            );
            fullTask.plan = plan;

            // Step 4: Auto-approve plan (or wait for user approval)
            this.planActController.approvePlan();
            await this.planActController.enterActMode();

            // Step 5: Execute plan with provenance tracking
            fullTask.status = 'executing';
            this.emit('task:executing', fullTask);

            const result = await this.planActController.executePlan(
                (step) => this.executeStep(step)
            );

            fullTask.result = result;
            fullTask.status = result.success ? 'completed' : 'failed';
            fullTask.completedAt = new Date();

            // Step 6: Store learnings in memory
            this.memory.remember({
                type: 'context',
                content: `Completed task: ${task.description}`,
                importance: 0.7,
                metadata: { task: fullTask },
                tags: ['task', task.type],
            });

            this.taskHistory.push(fullTask);
            this.currentTask = null;
            this.emit('task:completed', fullTask);

            return fullTask;

        } catch (error: any) {
            fullTask.status = 'failed';
            fullTask.error = error.message;
            fullTask.completedAt = new Date();
            this.taskHistory.push(fullTask);
            this.currentTask = null;
            this.emit('task:failed', fullTask);
            return fullTask;
        }
    }

    /**
     * Execute a single plan step with tool integration
     */
    private async executeStep(step: PlanStep): Promise<void> {
        this.emit('step:executing', step);

        switch (step.type) {
            case 'file_create':
            case 'file_edit':
                await this.executeFileOperation(step);
                break;
            case 'file_delete':
                await this.mcpClient.executeTool('shell_command', {
                    command: `rm "${step.target}"`,
                });
                break;
            case 'terminal':
                await this.mcpClient.executeTool('shell_command', {
                    command: step.target || step.details,
                });
                break;
            case 'test':
                await this.runTests(step);
                break;
            case 'analysis':
                // Analysis steps are informational
                break;
        }

        this.emit('step:completed', step);
    }

    private async executeFileOperation(step: PlanStep): Promise<void> {
        if (!step.target) return;

        // Track provenance for AI-generated code
        if (step.details) {
            this.provenance.trackOrigin(step.details, {
                source: 'ai_generated',
                model: 'shadow-ai',
            });
        }

        // Write file using MCP
        await this.mcpClient.executeTool('write_file', {
            path: step.target,
            content: step.details || '',
        });
    }

    private async runTests(step: PlanStep): Promise<void> {
        const command = step.target || 'npm test';
        await this.mcpClient.executeTool('shell_command', { command });
    }

    // ========================================================================
    // CONTEXT INTEGRATION
    // ========================================================================

    /**
     * Gather deep context for a task
     */
    private async gatherContext(repoPath: string | undefined, query: string): Promise<Record<string, any>> {
        const context: Record<string, any> = {};

        if (repoPath) {
            // Index repository if not already indexed
            if (!this.contextEngine.getIndexedRepos().includes(repoPath)) {
                await this.contextEngine.indexRepository(repoPath);
            }

            // Get relevant context
            const result = await this.contextEngine.getContext(repoPath, {
                query,
                maxTokens: 100000,
            });

            context.relevantFiles = result.sources;
            context.codeContext = result.context;
            context.symbols = result.relevantSymbols;
        }

        return context;
    }

    // ========================================================================
    // GITHUB INTEGRATION
    // ========================================================================

    /**
     * Resolve a GitHub issue end-to-end
     */
    async resolveGitHubIssue(repoPath: string, issueNumber: number): Promise<AgentTask> {
        this.githubAgent.setRepository(repoPath);

        const issue = await this.githubAgent.getIssue(issueNumber);
        if (!issue) {
            throw new Error(`Issue #${issueNumber} not found`);
        }

        return this.executeTask({
            type: 'bug_fix',
            description: `Resolve GitHub Issue #${issueNumber}: ${issue.title}\n\n${issue.body}`,
            context: {
                repoPath,
                issueNumber,
                issue,
            },
        });
    }

    /**
     * Review a pull request
     */
    async reviewPullRequest(repoPath: string, prNumber: number): Promise<any> {
        this.githubAgent.setRepository(repoPath);

        const review = await this.githubAgent.reviewPR(prNumber);

        // Store review learnings
        if (review) {
            this.memory.remember({
                type: 'feedback',
                content: `PR Review #${prNumber}: ${review.summary}`,
                importance: 0.6,
                metadata: { review },
                tags: ['pr-review'],
            });
        }

        return review;
    }

    // ========================================================================
    // WORKFLOW ORCHESTRATION
    // ========================================================================

    /**
     * Full-stack feature development workflow
     */
    async developFeature(options: {
        repoPath: string;
        featureName: string;
        description: string;
        createPR?: boolean;
    }): Promise<AgentTask> {
        const { repoPath, featureName, description, createPR = true } = options;

        // Execute feature development task
        const task = await this.executeTask({
            type: 'feature',
            description: `Develop feature: ${featureName}\n\n${description}`,
            context: { repoPath, featureName },
        });

        // Optionally create PR
        if (createPR && task.status === 'completed') {
            const branch = `feature/${featureName.toLowerCase().replace(/\s+/g, '-')}`;

            await this.githubAgent.createPullRequest({
                title: `feat: ${featureName}`,
                body: description,
                branch,
            });
        }

        return task;
    }

    /**
     * Code review and refactor workflow
     */
    async reviewAndRefactor(repoPath: string, files: string[]): Promise<any> {
        // Gather context for files
        await this.gatherContext(repoPath, files.join(' '));

        // Generate improvement suggestions
        const prompt = `Review these files and suggest improvements:\n${files.join('\n')}`;

        const suggestions = await this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);

        // Store as memory for future reference
        this.memory.remember({
            type: 'pattern',
            content: `Code review patterns for ${files.length} files`,
            importance: 0.5,
            metadata: { files, suggestions },
            tags: ['code-review'],
        });

        return { files, suggestions };
    }

    // ========================================================================
    // STATUS & REPORTING
    // ========================================================================

    /**
     * Get current agent status
     */
    getStatus(): {
        currentTask: AgentTask | null;
        capabilities: AgentCapabilities;
        memory: { memories: number; patterns: number; preferences: number };
        indexedRepos: string[];
        mode: string;
    } {
        return {
            currentTask: this.currentTask,
            capabilities: this.capabilities,
            memory: this.memory.getStats(),
            indexedRepos: this.contextEngine.getIndexedRepos(),
            mode: this.planActController.getMode(),
        };
    }

    /**
     * Get task history
     */
    getTaskHistory(): AgentTask[] {
        return [...this.taskHistory];
    }

    /**
     * Generate agent report
     */
    generateReport(): string {
        const status = this.getStatus();
        const memoryStats = status.memory;

        return `
# Shadow AI Agent Report

## Current Status
- Mode: ${status.mode}
- Current Task: ${status.currentTask?.description || 'None'}

## Capabilities
${Object.entries(status.capabilities).map(([k, v]) => `- ${k}: ${v ? '✅' : '❌'}`).join('\n')}

## Memory
- Memories: ${memoryStats.memories}
- Patterns: ${memoryStats.patterns}
- Preferences: ${memoryStats.preferences}

## Indexed Repositories
${status.indexedRepos.length > 0 ? status.indexedRepos.map(r => `- ${r}`).join('\n') : 'None'}

## Task History
Completed: ${this.taskHistory.filter(t => t.status === 'completed').length}
Failed: ${this.taskHistory.filter(t => t.status === 'failed').length}
        `.trim();
    }

    // ========================================================================
    // EVENT FORWARDING
    // ========================================================================

    private setupEventForwarding(): void {
        // Forward Plan/Act events
        this.planActController.on('plan:generated', (plan) => this.emit('agent:plan', plan));
        this.planActController.on('step:completed', (step) => this.emit('agent:step', step));

        // Forward context events
        this.contextEngine.on('index:completed', (data) => this.emit('agent:indexed', data));

        // Forward GitHub events
        this.githubAgent.on('pr:created', (pr) => this.emit('agent:pr', pr));
        this.githubAgent.on('issue:resolved', (res) => this.emit('agent:issue', res));

        // Forward memory events
        this.memory.on('memory:stored', (mem) => this.emit('agent:memory', mem));
    }

    // ========================================================================
    // MODULE ACCESS
    // ========================================================================

    getPlanActController(): PlanActController { return this.planActController; }
    getContextEngine(): DeepContextEngine { return this.contextEngine; }
    getGitHubAgent(): GitHubAgent { return this.githubAgent; }
    getMCPClient(): MCPClient { return this.mcpClient; }
    getProvenance(): CodeProvenance { return this.provenance; }
    getMemory(): AgentMemory { return this.memory; }
}

// Export singleton
export const agentOrchestrator = AgentOrchestrator.getInstance();
