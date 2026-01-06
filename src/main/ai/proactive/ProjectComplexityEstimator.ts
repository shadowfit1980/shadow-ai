/**
 * Project Complexity Estimator
 * 
 * Analyzes projects and tasks to estimate complexity, effort, and risk
 * Helps in planning and resource allocation
 */

import { ModelManager } from '../ModelManager';

export interface ComplexityAnalysis {
    overallComplexity: number; // 1-10 scale
    breakdown: {
        technical: number;
        architectural: number;
        integration: number;
        business: number;
        ui: number;
    };
    factors: Array<{
        factor: string;
        impact: 'high' | 'medium' | 'low';
        contribution: number; // Points added to complexity
    }>;
    estimatedEffort: {
        optimistic: number; // hours
        realistic: number;
        pessimistic: number;
    };
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
}

export interface TaskComplexity {
    taskId: string;
    description: string;
    complexity: number;
    estimatedHours: number;
    dependencies: string[];
    risks: string[];
    requiredSkills: string[];
}

export class ProjectComplexityEstimator {
    private static instance: ProjectComplexityEstimator;
    private modelManager: ModelManager;

    // Track historical estimates vs actuals
    private estimationHistory: Array<{
        estimated: number;
        actual: number;
        accuracy: number;
    }> = [];

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): ProjectComplexityEstimator {
        if (!ProjectComplexityEstimator.instance) {
            ProjectComplexityEstimator.instance = new ProjectComplexityEstimator();
        }
        return ProjectComplexityEstimator.instance;
    }

    /**
     * Estimate project complexity
     */
    async estimateProjectComplexity(project: {
        description: string;
        requirements?: string[];
        technologies?: string[];
        teamSize?: number;
        deadline?: Date;
    }): Promise<ComplexityAnalysis> {
        console.log('📊 Estimating project complexity...');

        const prompt = `Analyze project complexity:

## Project
${project.description}

${project.requirements ? `## Requirements\n${project.requirements.join('\n')}\n` : ''}
${project.technologies ? `## Technologies\n${project.technologies.join(', ')}\n` : ''}
${project.teamSize ? `## Team Size\n${project.teamSize} developers\n` : ''}

Analyze complexity across dimensions:
1. Technical complexity (algorithms, data structures, performance)
2. Architectural complexity (system design, scalability)
3. Integration complexity (APIs, third-party services)
4. Business complexity (domain logic, rules)
5. UI complexity (user interface, interactions)

Response in JSON:
\`\`\`json
{
  "overallComplexity": 7,
  "breakdown": {
    "technical": 8,
    "architectural": 7,
    "integration": 6,
    "business": 5,
    "ui": 7
  },
  "factors": [
    {
      "factor": "Real-time synchronization required",
      "impact": "high",
      "contribution": 2
    }
  ],
  "estimatedEffort": {
    "optimistic": 200,
    "realistic": 350,
    "pessimistic": 500
  },
  "riskLevel": "high",
  "recommendations": [
    "Consider phased approach",
    "Prototype high-risk components first"
  ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseComplexityResponse(response);

        const analysis: ComplexityAnalysis = {
            overallComplexity: parsed.overallComplexity || 5,
            breakdown: parsed.breakdown || {
                technical: 5,
                architectural: 5,
                integration: 5,
                business: 5,
                ui: 5
            },
            factors: parsed.factors || [],
            estimatedEffort: parsed.estimatedEffort || {
                optimistic: 0,
                realistic: 0,
                pessimistic: 0
            },
            riskLevel: parsed.riskLevel || 'medium',
            recommendations: parsed.recommendations || []
        };

        console.log(`✅ Complexity: ${analysis.overallComplexity}/10, Risk: ${analysis.riskLevel}`);
        return analysis;
    }

    /**
     * Break down project into tasks with complexity estimates
     */
    async estimateTaskComplexities(
        project: string,
        tasks: Array<{ id: string; description: string }>
    ): Promise<TaskComplexity[]> {
        console.log(`📋 Estimating ${tasks.length} task complexities...`);

        const complexities: TaskComplexity[] = [];

        for (const task of tasks) {
            const complexity = await this.estimateSingleTask(task, project);
            complexities.push(complexity);
        }

        return complexities;
    }

    /**
     * Calibrate estimates based on actual results
     */
    recordActual(taskId: string, estimated: number, actual: number): void {
        const accuracy = 1 - Math.abs(estimated - actual) / Math.max(estimated, actual);

        this.estimationHistory.push({
            estimated,
            actual,
            accuracy
        });

        // Keep reasonable history size
        if (this.estimationHistory.length > 100) {
            this.estimationHistory = this.estimationHistory.slice(-50);
        }

        console.log(`📝 Recorded: estimated ${estimated}h, actual ${actual}h, accuracy ${(accuracy * 100).toFixed(0)}%`);
    }

    /**
     * Get estimation accuracy statistics
     */
    getAccuracyStats(): {
        avgAccuracy: number;
        trend: 'improving' | 'declining' | 'stable';
        totalEstimates: number;
        calibrationFactor: number; // Multiply estimates by this
    } {
        if (this.estimationHistory.length === 0) {
            return {
                avgAccuracy: 0,
                trend: 'stable',
                totalEstimates: 0,
                calibrationFactor: 1.0
            };
        }

        const avgAccuracy = this.estimationHistory.reduce((sum, h) => sum + h.accuracy, 0) /
            this.estimationHistory.length;

        // Calculate calibration factor (how much we typically under/overestimate)
        const avgRatio = this.estimationHistory.reduce((sum, h) => sum + (h.actual / h.estimated), 0) /
            this.estimationHistory.length;

        // Determine trend
        const recent = this.estimationHistory.slice(-10);
        const older = this.estimationHistory.slice(-20, -10);

        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (recent.length >= 5 && older.length >= 5) {
            const recentAvg = recent.reduce((sum, h) => sum + h.accuracy, 0) / recent.length;
            const olderAvg = older.reduce((sum, h) => sum + h.accuracy, 0) / older.length;

            if (recentAvg > olderAvg + 0.1) trend = 'improving';
            else if (recentAvg < olderAvg - 0.1) trend = 'declining';
        }

        return {
            avgAccuracy,
            trend,
            totalEstimates: this.estimationHistory.length,
            calibrationFactor: avgRatio
        };
    }

    /**
     * Estimate complexity based on code metrics
     */
    analyzeCodeComplexity(code: string, language: string): {
        cyclomaticComplexity: number;
        linesOfCode: number;
        functions: number;
        nestingDepth: number;
        complexity: 'low' | 'medium' | 'high' | 'very-high';
    } {
        const lines = code.split('\n');
        const linesOfCode = lines.filter(l => l.trim().length > 0).length;

        // Simple cyclomatic complexity approximation
        const decisionPoints = (code.match(/\b(if|while|for|case|catch|\?\?|\|\||&&)\b/g) || []).length;
        const cyclomaticComplexity = decisionPoints + 1;

        // Count functions (approximate)
        const functionPattern = language === 'typescript'
            ? /\b(function|=>|\basync\s+function)\b/g
            : /\bdef\b/g;
        const functions = (code.match(functionPattern) || []).length;

        // Estimate nesting depth
        let maxDepth = 0;
        let currentDepth = 0;
        for (const char of code) {
            if (char === '{' || char === '(') currentDepth++;
            if (char === '}' || char === ')') currentDepth--;
            maxDepth = Math.max(maxDepth, currentDepth);
        }

        let complexity: 'low' | 'medium' | 'high' | 'very-high' = 'low';
        if (cyclomaticComplexity > 20 || maxDepth > 6) complexity = 'very-high';
        else if (cyclomaticComplexity > 10 || maxDepth > 4) complexity = 'high';
        else if (cyclomaticComplexity > 5 || maxDepth > 3) complexity = 'medium';

        return {
            cyclomaticComplexity,
            linesOfCode,
            functions,
            nestingDepth: maxDepth,
            complexity
        };
    }

    // Private methods

    private async estimateSingleTask(
        task: { id: string; description: string },
        projectContext: string
    ): Promise<TaskComplexity> {
        const prompt = `Estimate task complexity:

## Project Context
${projectContext}

## Task
${task.description}

Estimate:
1. Complexity (1-10)
2. Time estimate (hours)
3. Dependencies (what else needed?)
4. Risks
5. Required skills

Response in JSON:
\`\`\`json
{
  "complexity": 6,
  "estimatedHours": 8,
  "dependencies": ["Database setup", "API design"],
  "risks": ["Data migration complexity", "Performance bottleneck"],
  "requiredSkills": ["TypeScript", "PostgreSQL", "React"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseTaskResponse(response);

        return {
            taskId: task.id,
            description: task.description,
            complexity: parsed.complexity || 5,
            estimatedHours: parsed.estimatedHours || 0,
            dependencies: parsed.dependencies || [],
            risks: parsed.risks || [],
            requiredSkills: parsed.requiredSkills || []
        };
    }

    // Response parsers

    private parseComplexityResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private parseTaskResponse(response: string): any {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : response;
            return JSON.parse(jsonStr);
        } catch (error) {
            return {};
        }
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert at estimating software project complexity and effort.',
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
}

// Export singleton
export const projectComplexityEstimator = ProjectComplexityEstimator.getInstance();
