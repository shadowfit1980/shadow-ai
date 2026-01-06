import { RequestAnalyzer } from './RequestAnalyzer';
import { PlanGenerator } from './PlanGenerator';
import { TaskAnalysis, ImplementationPlan, DiffPreview, ExecutionResult } from './types';

export class PlanningAgent {
    private analyzer: RequestAnalyzer;
    private generator: PlanGenerator;

    constructor() {
        this.analyzer = new RequestAnalyzer();
        this.generator = new PlanGenerator();
    }

    /**
     * Create a complete implementation plan from user request
     */
    async createPlan(userInput: string, aiContext?: string): Promise<{
        analysis: TaskAnalysis;
        plan: ImplementationPlan;
    }> {
        // Step 1: Analyze the request
        console.log('📊 Analyzing request...');
        const analysis = await this.analyzer.analyze(userInput);

        // Step 2: Generate implementation plan
        console.log('📋 Generating plan...');
        const plan = await this.generator.generatePlan(analysis, aiContext);

        console.log(`✅ Plan created: ${plan.phases.length} phases, ${plan.files.length} files`);

        return { analysis, plan };
    }

    /**
     * Determine if request requires planning
     */
    requiresPlanning(userInput: string): boolean {
        const lowerInput = userInput.toLowerCase();

        // Simple queries don't need planning
        const simplePatterns = [
            /^what is/,
            /^how do/,
            /^can you explain/,
            /^tell me about/,
            /^show me/,
        ];

        if (simplePatterns.some(pattern => pattern.test(lowerInput))) {
            return false;
        }

        // Code generation/modification needs planning
        const complexPatterns = [
            /create.*component/,
            /add.*feature/,
            /implement/,
            /refactor/,
            /update.*file/,
            /build/,
            /fix.*bug/,
        ];

        return complexPatterns.some(pattern => pattern.test(lowerInput));
    }

    /**
     * Generate markdown representation of plan for display
     */
    generatePlanMarkdown(plan: ImplementationPlan): string {
        let markdown = `# ${plan.title}\n\n`;
        markdown += `## Summary\n${plan.summary}\n\n`;
        markdown += `**Estimated Time:** ${plan.estimatedTime} minutes\n\n`;

        // Risks
        if (plan.risks.length > 0) {
            markdown += `## ⚠️ Risks\n\n`;
            plan.risks.forEach(risk => {
                const emoji = risk.level === 'high' ? '🔴' : risk.level === 'medium' ? '🟡' : '🟢';
                markdown += `${emoji} **${risk.level.toUpperCase()}**: ${risk.description}\n`;
                if (risk.mitigation) {
                    markdown += `   - *Mitigation:* ${risk.mitigation}\n`;
                }
            });
            markdown += '\n';
        }

        // Phases
        markdown += `## 📋 Implementation Phases\n\n`;
        plan.phases.forEach((phase, index) => {
            markdown += `### Phase ${index + 1}: ${phase.name}\n`;
            markdown += `${phase.description}\n\n`;

            phase.steps.forEach((step, stepIndex) => {
                const checkbox = step.completed ? '[x]' : '[ ]';
                markdown += `${stepIndex + 1}. ${checkbox} ${step.description}\n`;
            });
            markdown += '\n';
        });

        // Files
        if (plan.files.length > 0) {
            markdown += `## 📁 Files to Change\n\n`;
            plan.files.forEach(file => {
                const badge = file.action === 'create' ? '**[NEW]**' :
                    file.action === 'delete' ? '**[DELETE]**' :
                        '**[MODIFY]**';
                markdown += `- ${badge} \`${file.path}\` - ${file.description}\n`;
            });
            markdown += '\n';
        }

        return markdown;
    }

    /**
     * Execute an implementation plan
     */
    async executePlan(
        plan: ImplementationPlan,
        executor: (step: any) => Promise<void>,
        onProgress?: (phaseId: string, stepId: string) => void
    ): Promise<ExecutionResult> {
        const startTime = Date.now();
        const completedSteps: string[] = [];
        const failedSteps: string[] = [];
        const errors: any[] = [];

        try {
            for (const phase of plan.phases) {
                console.log(`🚀 Starting Phase: ${phase.name}`);
                phase.status = 'in-progress';

                for (const step of phase.steps) {
                    try {
                        console.log(`   ⚙️ Executing: ${step.description}`);
                        await executor(step);
                        step.completed = true;
                        completedSteps.push(step.id);

                        if (onProgress) {
                            onProgress(phase.id, step.id);
                        }
                    } catch (error: any) {
                        console.error(`   ❌ Failed: ${step.description}`, error.message);
                        failedSteps.push(step.id);
                        errors.push({
                            stepId: step.id,
                            error: error.message,
                            timestamp: new Date(),
                        });
                        phase.status = 'failed';
                        throw error; // Stop execution on error
                    }
                }

                phase.status = 'completed';
                console.log(`✅ Completed Phase: ${phase.name}`);
            }

            return {
                success: true,
                completedSteps,
                failedSteps,
                errors,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                success: false,
                completedSteps,
                failedSteps,
                errors,
                duration: Date.now() - startTime,
            };
        }
    }
}

// Singleton instance
let instance: PlanningAgent | null = null;

export function getPlanningAgent(): PlanningAgent {
    if (!instance) {
        instance = new PlanningAgent();
    }
    return instance;
}
