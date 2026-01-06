/**
 * BaseAgent - Foundation for all specialized agents
 * 
 * Provides common functionality that all agents inherit
 */

import { getMemoryEngine } from '../memory';
import {
    AgentType,
    AgentMetadata,
    AgentCapability,
    ExecutionStep,
    AgentContext,
    AgentResult,
    ProjectContext,
    Issue
} from './types';
import { selfImprovementEngine } from '../learning/SelfImprovementEngine';
import { treeOfThoughtReasoning, Problem } from '../reasoning/TreeOfThoughtReasoning';
import { multiPerspectiveAnalyzer } from '../reasoning/MultiPerspectiveAnalyzer';
import { causalReasoningEngine } from '../reasoning/CausalReasoningEngine';
import { analogicalReasoningEngine } from '../reasoning/AnalogicalReasoningEngine';
import { contradictionDetector } from '../reasoning/ContradictionDetector';
import { problemDecompositionEngine } from '../reasoning/ProblemDecompositionEngine';
import { hypothesisTestingFramework } from '../reasoning/HypothesisTestingFramework';
import { predictiveAnalyzer } from '../proactive/PredictiveAnalyzer';
import { userIntentPredictor } from '../proactive/UserIntentPredictor';
import { projectComplexityEstimator } from '../proactive/ProjectComplexityEstimator';
import { resourceUsageForecaster } from '../proactive/ResourceUsageForecaster';
import { selfHealingSystem } from '../errorHandling/SelfHealingSystem';
import { technicalDebtResolver } from '../errorHandling/TechnicalDebtResolver';
import { visionProcessor } from '../multimodal/VisionProcessor';
import { diagramGenerator } from '../multimodal/DiagramGenerator';
import { architectureTranslator } from '../multimodal/ArchitectureTranslator';
import { audioCommandProcessor } from '../multimodal/AudioCommandProcessor';
import { multiModalFusion } from '../multimodal/MultiModalFusion';
import { PerformanceMetrics } from '../learning/types';

export abstract class BaseAgent {
    protected memory = getMemoryEngine();
    protected selfImprovement = selfImprovementEngine;
    protected reasoning = treeOfThoughtReasoning;
    protected perspectiveAnalyzer = multiPerspectiveAnalyzer;
    protected causalReasoning = causalReasoningEngine;
    protected analogicalReasoning = analogicalReasoningEngine;
    protected contradictionDetector = contradictionDetector;
    protected problemDecomposer = problemDecompositionEngine;
    protected hypothesisTester = hypothesisTestingFramework;
    protected predictor = predictiveAnalyzer;
    protected intentPredictor = userIntentPredictor;
    protected complexityEstimator = projectComplexityEstimator;
    protected resourceForecaster = resourceUsageForecaster;
    protected healer = selfHealingSystem;
    protected debtResolver = technicalDebtResolver;
    protected vision = visionProcessor;
    protected diagramGen = diagramGenerator;
    protected architect = architectureTranslator;
    protected audio = audioCommandProcessor;
    protected modalFusion = multiModalFusion;

    /**
     * Agent metadata - must be implemented by each agent
     */
    abstract get metadata(): AgentMetadata;

    /**
     * Get agent specialty description
     */
    get specialty(): string {
        return this.metadata.specialty;
    }

    /**
     * Get agent capabilities
     */
    get capabilities(): AgentCapability[] {
        return this.metadata.capabilities;
    }

    /**
     * Get agent type
     */
    get type(): AgentType {
        return this.metadata.type;
    }

    /**
     * Main execution method - orchestrates the agent's work
     */
    async execute(step: ExecutionStep, context: AgentContext): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            console.log(`\n🤖 ${this.metadata.name} starting: ${step.description}`);

            // 1. Retrieve relevant memories
            const relevantContext = await this.getRelevantMemory(step, context);

            // 2. Build specialized prompt
            const prompt = await this.buildPrompt(step, context, relevantContext);

            // 3. Execute with AI model
            const response = await this.callModel(prompt);

            // 4. Parse and validate response
            const output = await this.parseResponse(response, step);

            // 5. Validate output quality
            const validation = await this.validateOutput(output, step);

            if (!validation.valid) {
                console.warn(`⚠️  ${this.metadata.name} output validation failed`);
                return {
                    stepId: step.id,
                    agentType: this.type,
                    success: false,
                    output: null,
                    duration: (Date.now() - startTime) / 1000,
                    issues: validation.issues,
                    requiresReplanning: validation.critical
                };
            }

            // 6. Remember what we did
            await this.rememberExecution(step, output, context);

            // 7. Return result
            const duration = (Date.now() - startTime) / 1000;
            console.log(`✅ ${this.metadata.name} completed in ${duration.toFixed(1)}s`);

            return {
                stepId: step.id,
                agentType: this.type,
                success: true,
                output,
                duration,
                confidence: this.calculateConfidence(output),
                issues: validation.warnings,
                suggestions: await this.generateSuggestions(output, context)
            };

        } catch (error: any) {
            console.error(`❌ ${this.metadata.name} failed:`, error.message);

            // Attempt self-healing
            const healingResult = await this.attemptSelfHealing(error, step);

            if (healingResult.success) {
                console.log(`🔧 Self-healed error: ${healingResult.strategy}`);
                // Retry execution with healed code
                return await this.execute(step, context);
            }

            // Record failure for learning
            await this.recordPerformance({
                taskId: step.id,
                taskType: this.type,
                timestamp: new Date(),
                duration: Date.now() - startTime,
                success: false,
                quality: 0,
                efficiency: 0,
                errorCount: 1,
                retryCount: 0,
                resourceUsage: {
                    tokens: 0,
                    apiCalls: 1,
                    computeTime: Date.now() - startTime
                }
            });

            return {
                stepId: step.id,
                agentType: this.type,
                success: false,
                output: null,
                duration: (Date.now() - startTime) / 1000,
                issues: [{
                    severity: 'critical' as const,
                    description: error.message,
                    suggestedFix: healingResult.fallback?.degradedBehavior || 'Retry with different parameters or consult other agents'
                }]
            };
        }
    }

    /**
     * Get relevant context from memory
     */
    protected async getRelevantMemory(
        step: ExecutionStep,
        context: AgentContext
    ): Promise<ProjectContext> {
        try {
            // Build search query from step description and requirements
            const query = `${step.description} ${step.requirements.join(' ')}`;

            // Get context from memory engine
            const memoryContext = await this.memory.getRelevantContext(query, {
                limit: 10
            });

            return memoryContext;
        } catch (error) {
            console.warn(`⚠️  Could not retrieve memory context:`, error);
            return {
                code: [],
                decisions: [],
                styles: [],
                architecture: []
            };
        }
    }

    /**
     * Build AI prompt - must be implemented by each agent
     */
    protected abstract buildPrompt(
        step: ExecutionStep,
        context: AgentContext,
        memory: ProjectContext
    ): Promise<string>;

    /**
     * Parse AI response - must be implemented by each agent
     */
    protected abstract parseResponse(response: string, step: ExecutionStep): Promise<any>;

    /**
     * Call AI model with prompt
     */
    protected async callModel(prompt: string): Promise<string> {
        // For now, use a simple approach
        // In production, this would route to appropriate model based on agent type
        const { ModelManager } = await import('../ModelManager');
        const manager = ModelManager.getInstance();

        try {
            const response = await manager.chat([
                {
                    role: 'system',
                    content: this.getSystemPrompt(),
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            return response;
        } catch (error: any) {
            throw new Error(`Model call failed: ${error.message}`);
        }
    }

    /**
     * Get system prompt specific to this agent
     */
    protected getSystemPrompt(): string {
        return `You are ${this.metadata.name}, a specialized AI agent.

Specialty: ${this.metadata.specialty}

Capabilities:
${this.metadata.capabilities.map(c => `- ${c.name}: ${c.description}`).join('\n')}

You must:
1. Provide detailed, accurate responses
2. Follow best practices in your domain
3. Return responses in the requested format
4. Be thorough and professional
5. Consider edge cases and potential issues`;
    }

    /**
     * Validate output quality
     */
    protected async validateOutput(output: any, step: ExecutionStep): Promise<{
        valid: boolean;
        critical: boolean;
        issues: Issue[];
        warnings: Issue[];
    }> {
        const issues: Issue[] = [];
        const warnings: Issue[] = [];

        // Basic validation - can be overridden by specific agents
        if (!output) {
            issues.push({
                severity: 'critical',
                description: 'No output generated'
            });
        }

        return {
            valid: issues.length === 0,
            critical: issues.some(i => i.severity === 'critical'),
            issues,
            warnings
        };
    }

    /**
     * Remember execution in memory engine
     */
    protected async rememberExecution(
        step: ExecutionStep,
        output: any,
        context: AgentContext
    ): Promise<void> {
        try {
            await this.memory.remember({
                type: 'conversation',
                content: `Agent: ${this.metadata.name}
Task: ${step.description}
Result: ${JSON.stringify(output, null, 2)}`,
                metadata: {
                    agentType: this.type,
                    stepId: step.id,
                    timestamp: Date.now(),
                    success: true
                }
            });
        } catch (error) {
            console.warn(`⚠️  Could not remember execution:`, error);
        }
    }

    /**
     * Calculate confidence score for output
     */
    protected calculateConfidence(output: any): number {
        // Default implementation - can be overridden
        return output ? 0.8 : 0;
    }

    /**
     * Generate suggestions for improvement
     */
    protected async generateSuggestions(
        output: any,
        context: AgentContext
    ): Promise<string[]> {
        // Default implementation - can be overridden
        return [];
    }

    /**
     * Consult another agent (for collaboration)
     */
    protected async consultAgent(
        targetAgent: AgentType,
        question: string,
        context?: any
    ): Promise<string> {
        // This will be implemented by the Orchestrator
        // For now, return a placeholder
        return `Consultation with ${targetAgent} not yet implemented`;
    }

    // -------------------------------------------------------------------------
    // Agent Handoff Methods
    // -------------------------------------------------------------------------

    /**
     * Request handoff to another agent for specialized task
     */
    protected async handoffTo(
        targetAgent: AgentType,
        task: string,
        options?: {
            context?: Record<string, any>;
            expectations?: string[];
            priority?: 'critical' | 'high' | 'medium' | 'low';
        }
    ): Promise<any> {
        const { agentHandoffManager } = await import('./AgentHandoff');

        console.log(`🤝 ${this.metadata.name} requesting handoff to ${targetAgent}`);

        try {
            const request = agentHandoffManager.requestHandoff(
                this.type,
                targetAgent,
                task,
                {
                    context: options?.context || {},
                    expectations: options?.expectations || [],
                    priority: options?.priority || 'medium',
                    callbackData: {
                        sourceAgent: this.metadata.name,
                        stepId: Date.now().toString()
                    }
                }
            );

            // In a real implementation, this would wait for the handoff to complete
            // For now, we return the request for tracking
            return {
                handoffId: request.id,
                targetAgent,
                task,
                status: 'requested'
            };
        } catch (error: any) {
            console.error(`❌ Handoff request failed:`, error.message);
            throw error;
        }
    }

    /**
     * Receive and process a handoff from another agent
     */
    protected async receiveHandoff(request: any): Promise<any> {
        const { agentHandoffManager } = await import('./AgentHandoff');

        console.log(`📥 ${this.metadata.name} receiving handoff: ${request.task}`);

        try {
            // Accept the handoff
            agentHandoffManager.accept(request.id);

            // Execute the task
            const step: ExecutionStep = {
                id: request.id,
                agentType: this.type,
                description: request.task,
                requirements: request.expectations || [],
                dependencies: [],
                priority: request.priority || 'medium'
            };

            // Create a minimal context
            const context: AgentContext = {
                previousResults: [],
                memory: { code: [], decisions: [], styles: [], architecture: [] },
                currentStep: step,
                plan: {
                    taskId: request.id,
                    steps: [step],
                    parallelizable: [],
                    estimatedDuration: 60,
                    riskLevel: 'low'
                }
            };

            const result = await this.execute(step, context);

            // Complete or fail the handoff
            if (result.success) {
                const handoffResult = agentHandoffManager.complete(
                    request.id,
                    { result: result.output },
                    [`Completed by ${this.metadata.name}`]
                );
                return handoffResult;
            } else {
                const handoffResult = agentHandoffManager.fail(
                    request.id,
                    result.issues?.[0]?.description || 'Execution failed'
                );
                return handoffResult;
            }
        } catch (error: any) {
            const { agentHandoffManager } = await import('./AgentHandoff');
            agentHandoffManager.fail(request.id, error.message);
            throw error;
        }
    }

    /**
     * Get pending handoffs for this agent
     */
    protected async getPendingHandoffs(): Promise<any[]> {
        const { agentHandoffManager } = await import('./AgentHandoff');
        return agentHandoffManager.getPendingHandoffs(this.type);
    }

    /**
     * Use tree-of-thought reasoning for complex problems
     */
    protected async reasonWithTreeOfThought(problem: Problem): Promise<any> {
        console.log('🌳 Using tree-of-thought reasoning...');
        const result = await this.reasoning.solve(problem);
        return result;
    }

    /**
     * Analyze from multiple perspectives
     */
    protected async analyzeMultiplePerspectives(task: string, currentApproach?: string): Promise<any> {
        console.log('👁️  Analyzing from multiple perspectives...');
        const analysis = await this.perspectiveAnalyzer.analyze({
            task,
            currentApproach
        });
        return analysis;
    }

    /**
     * Predict potential issues before execution
     */
    protected async predictIssues(code: string, context?: any): Promise<any> {
        console.log('🔮 Predicting potential issues...');
        const issues = await this.predictor.predictIssues(code, context);
        return issues;
    }

    /**
     * Attempt self-healing for errors
     */
    protected async attemptSelfHealing(error: any, step: ExecutionStep): Promise<any> {
        console.log('🔧 Attempting self-healing...');
        const result = await this.healer.heal({
            error: {
                id: step.id,
                type: error.name || 'Error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date(),
                severity: 'high'
            },
            attemptedFixes: []
        });
        return result;
    }

    /**
     * Record performance metrics for self-improvement
     */
    protected async recordPerformance(metrics: PerformanceMetrics): Promise<void> {
        await this.selfImprovement.recordPerformance(metrics);
    }

    /**
     * Self-improve based on experience
     */
    protected async selfImprove(): Promise<void> {
        const stats = this.selfImprovement.getPerformanceStats();
        console.log('📈 Self-improvement statistics:', {
            successRate: stats.overall.successRate.toFixed(2),
            avgQuality: stats.overall.avgQuality.toFixed(2),
            totalTasks: stats.overall.totalTasks
        });
    }

    /**
     * Analyze causal impact of a change
     */
    protected async analyzeCausalImpact(change: string, context?: any): Promise<any> {
        console.log('🔍 Analyzing causal impact...');
        const impact = await this.causalReasoning.predictImpact(change, context);
        return impact;
    }

    /**
     * Find root cause of a problem
     */
    protected async findRootCause(problem: string, context?: any): Promise<any> {
        console.log('🔎 Finding root cause...');
        const rootCause = await this.causalReasoning.findRootCause(problem, context);
        return rootCause;
    }

    /**
     * Solve problem using analogical reasoning
     */
    protected async solveByAnalogy(problem: string, context?: any): Promise<any> {
        console.log('🔄 Solving by analogy...');
        const solution = await this.analogicalReasoning.solveByAnalogy(problem, context);
        return solution;
    }

    /**
     * Learn patterns from examples
     */
    protected async learnPattern(examples: Array<{ problem: string; solution: string; domain: string }>): Promise<any> {
        console.log('📚 Learning pattern...');
        const pattern = await this.analogicalReasoning.learnPattern(examples);
        return pattern;
    }

    /**
     * Check for contradictions in statements/requirements
     */
    protected async checkContradictions(statements: Array<{ content: string; source: string }>): Promise<any> {
        console.log('⚖️  Checking for contradictions...');
        const check = await this.contradictionDetector.detectContradictions(statements);
        return check;
    }

    /**
     * Decompose complex problem into subproblems
     */
    protected async decomposeProblem(problem: any): Promise<any> {
        console.log('🔨 Decomposing problem...');
        const decomposition = await this.problemDecomposer.decompose(problem);
        return decomposition;
    }

    /**
     * Solve problem recursively
     */
    protected async solveRecursively(problem: any): Promise<any> {
        console.log('🔄 Solving recursively...');
        const solution = await this.problemDecomposer.solveRecursively(problem);
        return solution;
    }

    /**
     * Generate hypotheses for an observation
     */
    protected async generateHypotheses(observation: string, context?: any): Promise<any> {
        console.log('💡 Generating hypotheses...');
        const hypotheses = await this.hypothesisTester.generateHypotheses(observation, context);
        return hypotheses;
    }

    /**
     * Test a hypothesis scientifically
     */
    protected async testHypothesis(hypothesis: any): Promise<any> {
        console.log('🧪 Testing hypothesis...');
        const result = await this.hypothesisTester.testHypothesis(hypothesis);
        return result;
    }

    /**
     * Predict user's intent from context
     */
    protected async predictUserIntent(context: any): Promise<any> {
        console.log('🔮 Predicting user intent...');
        const intent = await this.intentPredictor.predictIntent(context);
        return intent;
    }

    /**
     * Estimate project complexity
     */
    protected async estimateComplexity(project: any): Promise<any> {
        console.log('📊 Estimating complexity...');
        const analysis = await this.complexityEstimator.estimateProjectComplexity(project);
        return analysis;
    }

    /**
     * Forecast resource usage
     */
    protected async forecastResources(resource: string, timeframe: any): Promise<any> {
        console.log('📈 Forecasting resources...');
        const forecast = await this.resourceForecaster.forecastUsage(resource, timeframe);
        return forecast;
    }

    /**
     * Record resource usage for forecasting
     */
    protected recordResourceUsage(resource: string, value: number): void {
        this.resourceForecaster.recordUsage(resource, value);
    }

    /**
     * Optimize resource consumption
     */
    protected async optimizeResources(resource: string): Promise<any> {
        console.log('⚡ Optimizing resources...');
        const optimization = await this.resourceForecaster.optimizeResourceUsage(resource);
        return optimization;
    }

    /**
     * Detect user state (productive/frustrated/stuck)
     */
    protected async detectUserState(context: any): Promise<any> {
        console.log('🧠 Detecting user state...');
        const state = await this.intentPredictor.detectUserState(context);
        return state;
    }

    /**
     * Analyze technical debt in codebase
     */
    protected async analyzeDebt(codebase: any): Promise<any> {
        console.log('🔍 Analyzing technical debt...');
        const analysis = await this.debtResolver.analyzeDebt(codebase);
        return analysis;
    }

    /**
     * Auto-fix technical debt
     */
    protected async fixDebt(debtItem: any, code: string): Promise<any> {
        console.log('🔧 Fixing technical debt...');
        const result = await this.debtResolver.autoFix(debtItem, code);
        return result;
    }

    /**
     * Convert UI mockup to code
     */
    protected async mockupToCode(imagePath: string, framework?: string): Promise<any> {
        console.log('🎨 Converting mockup to code...');
        const code = await this.vision.screenshotToCode(imagePath, framework as any);
        return code;
    }

    /**
     * Generate diagram from code
     */
    protected async codeToDiagram(code: string, type?: string): Promise<any> {
        console.log('📊 Generating diagram...');
        const diagram = type
            ? await this.diagramGen.autoDiagram(code)
            : await this.diagramGen.autoDiagram(code);
        return diagram;
    }

    /**
     * Design system architecture from description
     */
    protected async designSystem(description: string, requirements?: any): Promise<any> {
        console.log('🏗️  Designing system...');
        const architecture = await this.architect.translateToArchitecture(description, requirements);
        return architecture;
    }

    /**
     * Recommend technology stack
     */
    protected async recommendTech(requirements: any): Promise<any> {
        console.log('💡 Recommending tech stack...');
        const stack = await this.architect.recommendTechStack(requirements);
        return stack;
    }

    /**
     * Extract design tokens from mockup
     */
    protected async extractDesignTokens(imagePath: string): Promise<any> {
        console.log('🎨 Extracting design tokens...');
        const tokens = await this.vision.extractDesignTokens(imagePath);
        return tokens;
    }

    /**
     * Process voice command
     */
    protected async processVoice(transcript: string): Promise<any> {
        console.log('🎤 Processing voice command...');
        const command = await this.audio.processAudio(transcript);
        return command;
    }

    /**
     * Convert voice to code
     */
    protected async voiceToCode(description: string, language?: string): Promise<any> {
        console.log('🗣️  Converting voice to code...');
        const result = await this.audio.voiceToCode(description, language);
        return result;
    }

    /**
     * Fuse multi-modal inputs
     */
    protected async fuseInputs(inputs: any): Promise<any> {
        console.log('🔀 Fusing multi-modal inputs...');
        const understanding = await this.modalFusion.fuseInputs(inputs);
        return understanding;
    }

    /**
     * Generate response from multi-modal inputs
     */
    protected async multiModalResponse(inputs: any): Promise<any> {
        console.log('💬 Generating multi-modal response...');
        const response = await this.modalFusion.generateResponse(inputs);
        return response;
    }

    /**
     * Combine text + vision for implementation
     */
    protected async textPlusVisionImplementation(description: string, mockupPath: string): Promise<any> {
        console.log('🎨📝 Combining text + vision...');
        const impl = await this.modalFusion.textPlusVisionToImplementation(description, mockupPath);
        return impl;
    }

    /**
     * Get preferred model for this agent
     */
    protected getPreferredModel(): string {
        return this.metadata.preferredModel;
    }

    /**
     * Format output as JSON
     */
    protected formatAsJSON(data: any): string {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Extract JSON from text response
     */
    protected extractJSON(text: string): any {
        // Try to find JSON in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                // Fall through to null
            }
        }
        return null;
    }

    /**
     * Extract code blocks from markdown
     */
    protected extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
        const blocks: Array<{ language: string; code: string }> = [];
        const regex = /```(\w+)?\n([\s\S]*?)```/g;

        let match;
        while ((match = regex.exec(text)) !== null) {
            blocks.push({
                language: match[1] || 'plaintext',
                code: match[2].trim()
            });
        }

        return blocks;
    }
}
