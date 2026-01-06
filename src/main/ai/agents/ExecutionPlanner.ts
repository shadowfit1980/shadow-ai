/**
 * ExecutionPlanner - Creates execution plans for multi-agent tasks
 * 
 * Determines the order and dependencies of agent execution steps
 */

import {
    TaskAnalysis,
    ExecutionPlan,
    ExecutionStep,
    AgentType,
    ComplexTask
} from './types';

export class ExecutionPlanner {
    /**
     * Create an execution plan from task analysis
     */
    async plan(task: ComplexTask, analysis: TaskAnalysis): Promise<ExecutionPlan> {
        console.log('\n📋 Creating execution plan...');

        const steps = this.createSteps(task, analysis);
        const parallelizable = this.identifyParallelSteps(steps);
        const estimatedDuration = this.estimateDuration(steps, analysis.complexity);
        const riskLevel = this.assessRisk(analysis);

        const plan: ExecutionPlan = {
            taskId: task.id,
            steps,
            parallelizable,
            estimatedDuration,
            riskLevel
        };

        console.log(`✅ Plan created: ${steps.length} steps, ~${Math.round(estimatedDuration / 60)} minutes`);
        console.log(`   Parallelizable groups: ${parallelizable.length}`);

        return plan;
    }

    private createSteps(task: ComplexTask, analysis: TaskAnalysis): ExecutionStep[] {
        const steps: ExecutionStep[] = [];

        // Build steps based on task type and required agents
        switch (analysis.type) {
            case 'feature':
                steps.push(...this.createFeatureSteps(task, analysis));
                break;
            case 'bug':
                steps.push(...this.createBugFixSteps(task, analysis));
                break;
            case 'refactor':
                steps.push(...this.createRefactorSteps(task, analysis));
                break;
            case 'design':
                steps.push(...this.createDesignSteps(task, analysis));
                break;
            case 'deployment':
                steps.push(...this.createDeploymentSteps(task, analysis));
                break;
            case 'optimization':
                steps.push(...this.createOptimizationSteps(task, analysis));
                break;
        }

        return steps;
    }

    private createFeatureSteps(task: ComplexTask, analysis: TaskAnalysis): ExecutionStep[] {
        const steps: ExecutionStep[] = [];
        const agents = analysis.requiredAgents;

        // 1. Architecture (if needed)
        if (agents.includes('architect')) {
            steps.push({
                id: `${task.id}-arch-1`,
                agentType: 'architect',
                description: `Design architecture for: ${task.description}`,
                requirements: task.requirements || [],
                dependencies: [],
                priority: 'critical',
                estimatedDuration: 300 // 5 minutes
            });
        }

        // 2. Design (if needed, depends on architecture)
        if (agents.includes('designer')) {
            steps.push({
                id: `${task.id}-design-1`,
                agentType: 'designer',
                description: `Create UI/UX design for: ${task.description}`,
                requirements: task.requirements || [],
                dependencies: agents.includes('architect') ? [`${task.id}-arch-1`] : [],
                priority: 'high',
                estimatedDuration: 360 // 6 minutes
            });
        }

        // 3. Implementation (depends on arch/design)
        if (agents.includes('coder')) {
            const deps: string[] = [];
            if (agents.includes('architect')) deps.push(`${task.id}-arch-1`);
            if (agents.includes('designer')) deps.push(`${task.id}-design-1`);

            steps.push({
                id: `${task.id}-code-1`,
                agentType: 'coder',
                description: `Implement: ${task.description}`,
                requirements: task.requirements || [],
                dependencies: deps,
                priority: 'critical',
                estimatedDuration: 600 // 10 minutes
            });
        }

        // 4. Review (depends on code)
        if (agents.includes('reviewer')) {
            steps.push({
                id: `${task.id}-review-1`,
                agentType: 'reviewer',
                description: `Review implementation quality and security`,
                requirements: ['Check for security vulnerabilities', 'Verify code quality'],
                dependencies: [`${task.id}-code-1`],
                priority: 'high',
                estimatedDuration: 240 // 4 minutes
            });
        }

        // 5. Testing (depends on code, can run parallel to review)
        if (agents.includes('debugger')) {
            steps.push({
                id: `${task.id}-test-1`,
                agentType: 'debugger',
                description: `Test and debug implementation`,
                requirements: ['Run all tests', 'Find and fix bugs'],
                dependencies: [`${task.id}-code-1`],
                priority: 'high',
                estimatedDuration: 420 // 7 minutes
            });
        }

        // 6. DevOps (depends on review and testing)
        if (agents.includes('devops')) {
            const deps: string[] = [];
            if (agents.includes('reviewer')) deps.push(`${task.id}-review-1`);
            if (agents.includes('debugger')) deps.push(`${task.id}-test-1`);
            if (deps.length === 0 && agents.includes('coder')) deps.push(`${task.id}-code-1`);

            steps.push({
                id: `${task.id}-devops-1`,
                agentType: 'devops',
                description: `Setup deployment and infrastructure`,
                requirements: ['Configure CI/CD', 'Setup monitoring'],
                dependencies: deps,
                priority: 'medium',
                estimatedDuration: 480 // 8 minutes
            });
        }

        return steps;
    }

    private createBugFixSteps(task: ComplexTask, analysis: TaskAnalysis): ExecutionStep[] {
        const steps: ExecutionStep[] = [];

        // 1. Debug and identify issue
        steps.push({
            id: `${task.id}-debug-1`,
            agentType: 'debugger',
            description: `Debug and identify root cause: ${task.description}`,
            requirements: task.requirements || [],
            dependencies: [],
            priority: 'critical',
            estimatedDuration: 300
        });

        // 2. Implement fix
        steps.push({
            id: `${task.id}-code-1`,
            agentType: 'coder',
            description: `Implement fix for bug`,
            requirements: ['Fix the identified issue', 'Add regression tests'],
            dependencies: [`${task.id}-debug-1`],
            priority: 'critical',
            estimatedDuration: 240
        });

        // 3. Review fix
        if (analysis.requiredAgents.includes('reviewer')) {
            steps.push({
                id: `${task.id}-review-1`,
                agentType: 'reviewer',
                description: `Review bug fix`,
                requirements: ['Verify fix is correct', 'Check for edge cases'],
                dependencies: [`${task.id}-code-1`],
                priority: 'high',
                estimatedDuration: 180
            });
        }

        // 4. Verify fix
        steps.push({
            id: `${task.id}-test-1`,
            agentType: 'debugger',
            description: `Verify bug is fixed and no regressions`,
            requirements: ['Test the fix', 'Run regression tests'],
            dependencies: [`${task.id}-code-1`],
            priority: 'critical',
            estimatedDuration: 240
        });

        return steps;
    }

    private createRefactorSteps(task: ComplexTask, analysis: TaskAnalysis): ExecutionStep[] {
        const steps: ExecutionStep[] = [];

        // Similar pattern but focused on refactoring
        if (analysis.requiredAgents.includes('architect')) {
            steps.push({
                id: `${task.id}-arch-1`,
                agentType: 'architect',
                description: `Plan refactoring approach: ${task.description}`,
                requirements: task.requirements || [],
                dependencies: [],
                priority: 'high',
                estimatedDuration: 240
            });
        }

        steps.push({
            id: `${task.id}-code-1`,
            agentType: 'coder',
            description: `Refactor code: ${task.description}`,
            requirements: task.requirements || ['Maintain functionality', 'Improve code quality'],
            dependencies: analysis.requiredAgents.includes('architect') ? [`${task.id}-arch-1`] : [],
            priority: 'critical',
            estimatedDuration: 480
        });

        steps.push({
            id: `${task.id}-test-1`,
            agentType: 'debugger',
            description: `Verify refactoring didn't break anything`,
            requirements: ['Run all tests', 'Verify functionality'],
            dependencies: [`${task.id}-code-1`],
            priority: 'critical',
            estimatedDuration: 300
        });

        return steps;
    }

    private createDesignSteps(task: ComplexTask, analysis: TaskAnalysis): ExecutionStep[] {
        const steps: ExecutionStep[] = [];

        steps.push({
            id: `${task.id}-design-1`,
            agentType: 'designer',
            description: `Create design: ${task.description}`,
            requirements: task.requirements || [],
            dependencies: [],
            priority: 'critical',
            estimatedDuration: 420
        });

        if (analysis.requiredAgents.includes('coder')) {
            steps.push({
                id: `${task.id}-code-1`,
                agentType: 'coder',
                description: `Implement design`,
                requirements: ['Match design exactly', 'Ensure responsive'],
                dependencies: [`${task.id}-design-1`],
                priority: 'high',
                estimatedDuration: 480
            });
        }

        return steps;
    }

    private createDeploymentSteps(task: ComplexTask, analysis: TaskAnalysis): ExecutionStep[] {
        const steps: ExecutionStep[] = [];

        steps.push({
            id: `${task.id}-devops-1`,
            agentType: 'devops',
            description: `Setup deployment: ${task.description}`,
            requirements: task.requirements || [],
            dependencies: [],
            priority: 'critical',
            estimatedDuration: 540
        });

        return steps;
    }

    private createOptimizationSteps(task: ComplexTask, analysis: TaskAnalysis): ExecutionStep[] {
        const steps: ExecutionStep[] = [];

        // Similar to refactoring but focused on performance
        steps.push({
            id: `${task.id}-debug-1`,
            agentType: 'debugger',
            description: `Profile and identify performance bottlenecks`,
            requirements: task.requirements || [],
            dependencies: [],
            priority: 'high',
            estimatedDuration: 300
        });

        steps.push({
            id: `${task.id}-code-1`,
            agentType: 'coder',
            description: `Optimize: ${task.description}`,
            requirements: ['Improve performance', 'Maintain functionality'],
            dependencies: [`${task.id}-debug-1`],
            priority: 'critical',
            estimatedDuration: 420
        });

        steps.push({
            id: `${task.id}-test-1`,
            agentType: 'debugger',
            description: `Verify performance improvements`,
            requirements: ['Benchmark performance', 'Verify no regressions'],
            dependencies: [`${task.id}-code-1`],
            priority: 'high',
            estimatedDuration: 240
        });

        return steps;
    }

    private identifyParallelSteps(steps: ExecutionStep[]): string[][] {
        const parallelGroups: string[][] = [];
        const processed = new Set<string>();

        // Group steps that have the same dependencies (can run in parallel)
        for (const step of steps) {
            if (processed.has(step.id)) continue;

            const group = [step.id];
            processed.add(step.id);

            // Find other steps with same dependencies
            for (const otherStep of steps) {
                if (processed.has(otherStep.id)) continue;

                if (this.haveSameDependencies(step.dependencies, otherStep.dependencies)) {
                    group.push(otherStep.id);
                    processed.add(otherStep.id);
                }
            }

            if (group.length > 1) {
                parallelGroups.push(group);
            }
        }

        return parallelGroups;
    }

    private haveSameDependencies(deps1: string[], deps2: string[]): boolean {
        if (deps1.length !== deps2.length) return false;
        const sorted1 = [...deps1].sort();
        const sorted2 = [...deps2].sort();
        return sorted1.every((dep, i) => dep === sorted2[i]);
    }

    private estimateDuration(steps: ExecutionStep[], complexity: string): number {
        const baseDuration = steps.reduce((sum, step) => sum + (step.estimatedDuration || 300), 0);

        // Adjust for complexity
        const multiplier = complexity === 'simple' ? 0.7 : complexity === 'complex' ? 1.3 : 1.0;

        return Math.round(baseDuration * multiplier);
    }

    private assessRisk(analysis: TaskAnalysis): 'low' | 'medium' | 'high' {
        if (analysis.risks.length === 0 && analysis.complexity === 'simple') {
            return 'low';
        }

        if (analysis.risks.length > 3 || analysis.complexity === 'complex') {
            return 'high';
        }

        return 'medium';
    }
}
