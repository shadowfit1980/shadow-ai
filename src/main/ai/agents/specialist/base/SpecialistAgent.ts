/**
 * SpecialistAgent - Base Class for All Specialized Agents
 * 
 * Foundation for building domain-specific agents (Architect, TestWriter, etc.)
 * Provides common capabilities: execution, explainability, consensus, self-assessment
 */

import { ModelManager } from '../../../ModelManager';
import { getMemoryEngine } from '../../../memory';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentTask {
    task: string;
    spec: string;
    context?: Record<string, any>;
    constraints?: string[];
}

export interface AgentResult {
    success: boolean;
    summary: string;
    artifacts?: any[];
    confidence: number;
    explanation: string;
    alternatives?: Array<{
        description: string;
        confidence: number;
    }>;
    estimatedEffort?: number; // hours
}

export interface AgentCapability {
    name: string;
    description: string;
    confidenceLevel: number; // How good this agent is at this
}

export interface SelfAssessment {
    taskDifficulty: number; // 1-10
    expectedSuccessRate: number; // 0-1
    recommendedHelp?: string[]; // Other agents that should assist
    risks: string[];
}

// ============================================================================
// SPECIALIST AGENT BASE
// ============================================================================

export abstract class SpecialistAgent {
    protected modelManager: ModelManager;
    protected memory = getMemoryEngine();

    // Agent metadata
    abstract readonly agentType: string;
    abstract readonly capabilities: AgentCapability[];

    // Performance tracking
    private executionHistory: Array<{
        task: string;
        success: boolean;
        confidence: number;
        actualOutcome?: boolean;
    }> = [];

    constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    // ========================================================================
    // CORE EXECUTION
    // ========================================================================

    /**
     * Main execution method - must be implemented by each specialist
     */
    abstract execute(task: AgentTask): Promise<AgentResult>;

    /**
     * Self-assess ability to handle task
     */
    async assess(task: AgentTask): Promise<SelfAssessment> {
        const prompt = `Assess your ability to handle this task:

Agent Type: ${this.agentType}
Capabilities: ${this.capabilities.map(c => c.name).join(', ')}

Task: ${task.task}
Spec: ${task.spec}

Assess:
1. Task difficulty (1-10)
2. Expected success rate (0-1)
3. Risks
4. Whether you need help from other agents

Response in JSON:
\`\`\`json
{
  "taskDifficulty": 7,
  "expectedSuccessRate": 0.85,
  "recommendedHelp": ["TestWriterAgent"],
  "risks": ["Complex edge cases", "Performance requirements"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseAssessmentResponse(response);

        return {
            taskDifficulty: parsed.taskDifficulty || 5,
            expectedSuccessRate: parsed.expectedSuccessRate || 0.7,
            recommendedHelp: parsed.recommendedHelp,
            risks: parsed.risks || []
        };
    }

    /**
     * Generate multiple alternative solutions
     */
    async generateAlternatives(task: AgentTask, count: number = 3): Promise<Array<{
        description: string;
        pros: string[];
        cons: string[];
        confidence: number;
    }>> {
        console.log(`💡 Generating ${count} alternative solutions...`);

        const prompt = `Generate ${count} alternative approaches for this task:

Task: ${task.task}
Spec: ${task.spec}

For each alternative provide:
- Description
- Pros
- Cons
- Confidence level

Response in JSON:
\`\`\`json
{
  "alternatives": [
    {
      "description": "Approach 1 description",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1"],
      "confidence": 0.8
    }
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseAlternativesResponse(response);

        return parsed.alternatives || [];
    }

    /**
     * Explain reasoning for a decision
     */
    async explain(decision: string, context: any): Promise<string> {
        const prompt = `Explain this decision in clear, audit-ready language:

Decision: ${decision}
Context: ${JSON.stringify(context, null, 2)}

Provide:
1. What was decided
2. Why this was chosen
3. What alternatives were considered
4. Confidence level and caveats`;

        const response = await this.callModel(prompt);
        return response;
    }

    // ========================================================================
    // COLLABORATION
    // ========================================================================

    /**
     * Request help from another agent
     */
    async requestHelp(agentType: string, task: AgentTask): Promise<any> {
        console.log(`🤝 ${this.agentType} requesting help from ${agentType}...`);

        // In real implementation, would dispatch through Dispatcher
        return {
            requested: true,
            agentType,
            task
        };
    }

    /**
     * Peer review another agent's work
     */
    async peerReview(result: AgentResult): Promise<{
        approved: boolean;
        feedback: string[];
        suggestedImprovements: string[];
        confidence: number;
    }> {
        const prompt = `Peer review this agent's work:

Summary: ${result.summary}
Confidence: ${result.confidence}
Explanation: ${result.explanation}

Provide honest feedback:
1. Should this be approved?
2. What feedback do you have?
3. Suggested improvements

Response in JSON:
\`\`\`json
{
  "approved": true,
  "feedback": ["Good implementation", "Clear explanation"],
  "suggestedImprovements": ["Add more error handling"],
  "confidence": 0.85
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parsePeerReviewResponse(response);

        return {
            approved: parsed.approved !== false,
            feedback: parsed.feedback || [],
            suggestedImprovements: parsed.suggestedImprovements || [],
            confidence: parsed.confidence || 0.7
        };
    }

    // ========================================================================
    // SELF-IMPROVEMENT
    // ========================================================================

    /**
     * Record execution for learning
     */
    recordExecution(task: string, success: boolean, confidence: number): void {
        this.executionHistory.push({
            task,
            success,
            confidence
        });

        // Keep reasonable history size
        if (this.executionHistory.length > 1000) {
            this.executionHistory = this.executionHistory.slice(-500);
        }
    }

    /**
     * Update with actual outcome for calibration
     */
    updateOutcome(taskIndex: number, actualOutcome: boolean): void {
        if (taskIndex >= 0 && taskIndex < this.executionHistory.length) {
            this.executionHistory[taskIndex].actualOutcome = actualOutcome;
        }
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats(): {
        totalExecutions: number;
        successRate: number;
        averageConfidence: number;
        calibrationScore: number; // How well predicted confidence matches reality
    } {
        const total = this.executionHistory.length;
        if (total === 0) {
            return {
                totalExecutions: 0,
                successRate: 0,
                averageConfidence: 0,
                calibrationScore: 0
            };
        }

        const successes = this.executionHistory.filter(e => e.success).length;
        const successRate = successes / total;

        const avgConfidence = this.executionHistory.reduce((sum, e) => sum + e.confidence, 0) / total;

        // Calibration: how well confidence matches actual outcomes
        const withOutcomes = this.executionHistory.filter(e => e.actualOutcome !== undefined);
        let calibrationScore = 0;
        if (withOutcomes.length > 0) {
            const errors = withOutcomes.map(e =>
                Math.abs(e.confidence - (e.actualOutcome ? 1 : 0))
            );
            calibrationScore = 1 - (errors.reduce((sum, e) => sum + e, 0) / errors.length);
        }

        return {
            totalExecutions: total,
            successRate,
            averageConfidence: avgConfidence,
            calibrationScore
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    protected async callModel(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: systemPrompt || `You are ${this.agentType}, an expert specialized agent.`,
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
            console.error(`Error in ${this.agentType}:`, error);
            return '{}';
        }
    }

    protected parseJSON(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseAssessmentResponse(response: string): any {
        return this.parseJSON(response);
    }

    private parseAlternativesResponse(response: string): any {
        return this.parseJSON(response);
    }

    private parsePeerReviewResponse(response: string): any {
        return this.parseJSON(response);
    }

    // ========================================================================
    // ABSTRACT HELPERS (can be overridden)
    // ========================================================================

    /**
     * Validate task before execution
     */
    protected async validateTask(task: AgentTask): Promise<{
        valid: boolean;
        errors: string[];
    }> {
        const errors: string[] = [];

        if (!task.spec || task.spec.trim().length === 0) {
            errors.push('Task specification is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Estimate effort for task
     */
    protected async estimateEffort(task: AgentTask): Promise<number> {
        // Default: use AI to estimate
        const prompt = `Estimate effort in hours for this task:

Task: ${task.task}
Spec: ${task.spec}

Response in JSON:
\`\`\`json
{
  "hours": 8
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);
        return parsed.hours || 4; // Default 4 hours
    }
}
